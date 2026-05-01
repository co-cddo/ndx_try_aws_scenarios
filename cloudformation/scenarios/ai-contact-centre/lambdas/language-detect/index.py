"""Real-time language detection from a Connect customer audio stream.

Invoked from the contact flow after the first Lex turn has captured the
caller's audio. Reads the same audio fragment from KVS (Connect's media
stream for the contact) and runs Amazon Transcribe Streaming with
IdentifyLanguage=True, restricted to the eight languages we support.

The ASR transcript Lex produced for turn 1 is unreliable for non-English
callers because Lex is locale-locked (en_US) and produces phonetic-English
gibberish for non-English audio. This Lambda gives us a true transcript +
identified language, which we then write back as contact attributes so the
flow's "Apply caller voice" + "Set Lex locale" blocks can switch the rest
of the call to the right language.

Inputs (Connect contact-flow event):
    Details.ContactData.ContactId                        -- for update_contact_attributes
    Details.ContactData.MediaStreams.Customer.Audio.StartFragmentNumber
    Details.ContactData.MediaStreams.Customer.Audio.StreamARN
    Details.ContactData.InstanceARN

Outputs (returned to the flow as session attributes for it to consume):
    detected_language     -- ISO 639-1, e.g. 'it'
    polly_voice           -- 'Bianca'
    polly_engine          -- 'neural'
    polly_language        -- BCP-47, e.g. 'it-IT'
    transcribe_text       -- the cleanly-transcribed turn-1 utterance
"""
from __future__ import annotations

import asyncio
import io
import logging
import os
import struct
import time
from typing import Optional, Tuple

import json
import boto3

from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler

logger = logging.getLogger()
logger.setLevel(logging.INFO)

INSTANCE_ID = os.environ.get("CONNECT_INSTANCE_ID", "")
WORKER_MODE_KEY = "ndx_aicc_lang_detect_worker"
# Transcribe streaming with IdentifyLanguage accepts a maximum of 5 language
# options. Polish, Welsh, and Romanian fall through to the English path
# (Polly voice still switches to Ola/Gwyneth/Carmen if a later turn confirms
# the language some other way; for now they get English transcription).
LANGUAGE_OPTIONS = ["en-GB", "it-IT", "fr-FR", "de-DE", "es-ES"]
DEFAULT_LANGUAGE = "en-GB"

# Same mappings rag-fulfilment uses; duplicated here so this Lambda is the
# single writer of the contact-attribute trio. Welsh and Romanian aren't in
# Transcribe's 8-language streaming options on most regions, so they fall
# back to en-US for ASR but still get Welsh/Romanian Polly voices and
# Bedrock answers.
VOICE_BY_LANG = {
    "en": ("Amy",     "neural",   "en-US"),
    "it": ("Bianca",  "neural",   "it-IT"),
    "fr": ("Lea",     "neural",   "fr-FR"),
    "de": ("Vicki",   "neural",   "de-DE"),
    "es": ("Lucia",   "neural",   "es-ES"),
    "pl": ("Ola",     "neural",   "pl-PL"),
    "cy": ("Gwyneth", "standard", "en-US"),
    "ro": ("Carmen",  "standard", "en-US"),
}

connect = boto3.client("connect")
kvs_meta = boto3.client("kinesisvideo")
lambda_client = boto3.client("lambda")


def _last_segment(arn: str) -> str:
    return arn.rsplit("/", 1)[-1] if arn else arn


def _read_vint(buf: bytes, pos: int) -> Tuple[int, int]:
    """Read a variable-length integer (EBML VINT) from `buf` starting at
    `pos`. Returns (value, bytes_consumed)."""
    if pos >= len(buf):
        raise EOFError
    first = buf[pos]
    length = 0
    mask = 0x80
    while length < 8 and not (first & mask):
        length += 1
        mask >>= 1
    length += 1  # length-marker byte counts itself
    if pos + length > len(buf):
        raise EOFError
    value = first & (mask - 1)
    for i in range(1, length):
        value = (value << 8) | buf[pos + i]
    return value, length


def _read_size(buf: bytes, pos: int) -> Tuple[int, int]:
    """EBML size field is a VINT but we don't strip the marker bit."""
    return _read_vint(buf, pos)


def _read_id(buf: bytes, pos: int) -> Tuple[int, int]:
    """EBML element IDs are VINTs but the marker bit IS part of the ID."""
    if pos >= len(buf):
        raise EOFError
    first = buf[pos]
    length = 0
    mask = 0x80
    while length < 4 and not (first & mask):
        length += 1
        mask >>= 1
    length += 1
    if pos + length > len(buf):
        raise EOFError
    value = 0
    for i in range(length):
        value = (value << 8) | buf[pos + i]
    return value, length


# Matroska / EBML element IDs we care about
ID_SEGMENT = 0x18538067
ID_CLUSTER = 0x1F43B675
ID_SIMPLE_BLOCK = 0xA3
ID_TIMECODE = 0xE7
ID_TRACKS = 0x1654AE6B
ID_TRACK_ENTRY = 0xAE
ID_TRACK_NUMBER = 0xD7
ID_CODEC_ID = 0x86
ID_AUDIO = 0xE1
ID_SAMPLING_FREQUENCY = 0xB5

# Container elements we recurse into
CONTAINER_IDS = {ID_SEGMENT, ID_CLUSTER, ID_TRACKS, ID_TRACK_ENTRY, ID_AUDIO}


def _trim_leading_silence(pcm: bytes, sample_rate_hz: int = 8000,
                          frame_ms: int = 100, threshold: int = 2000,
                          required_loud_frames: int = 5) -> bytes:
    """Skip the silent prefix from a little-endian 16-bit PCM buffer.

    Connect's `Start customer media stream` fires before the bot's Greet
    plays, so the first 5+ seconds of KVS audio is silence (the customer
    hasn't spoken yet). Without trimming, capping at 5 s of audio means
    we feed Transcribe almost all silence and IdentifyLanguage returns
    empty.

    A naive "first frame above threshold" trim mis-fires on transient
    noise (line clicks, breathing) before the customer actually starts
    speaking. We look for SUSTAINED loud audio: the first frame that has
    `required_loud_frames - 1` more loud frames within the next 1 second.
    Threshold ~2000 is well above background line noise but well below
    typical speech peaks (8000-15000). Returns the original buffer if no
    sustained-loud span is found."""
    samples_per_frame = sample_rate_hz * frame_ms // 1000
    bytes_per_frame = samples_per_frame * 2
    n_frames = len(pcm) // bytes_per_frame
    if n_frames == 0:
        return pcm

    # Precompute per-frame peaks
    peaks = []
    for f in range(n_frames):
        frame = pcm[f * bytes_per_frame:(f + 1) * bytes_per_frame]
        peak = 0
        for i in range(0, bytes_per_frame, 2):
            sample = int.from_bytes(frame[i:i + 2], "little", signed=True)
            if abs(sample) > peak:
                peak = abs(sample)
        peaks.append(peak)

    # Find first frame f such that >= required_loud_frames frames in
    # [f, f + lookahead] are above threshold.
    lookahead = max(required_loud_frames * 2, sample_rate_hz // (samples_per_frame))
    for f in range(n_frames):
        if peaks[f] < threshold:
            continue
        loud = sum(1 for p in peaks[f:f + lookahead] if p >= threshold)
        if loud >= required_loud_frames:
            return pcm[f * bytes_per_frame:]
    return pcm


def parse_mkv_audio_pcm(blob: bytes) -> bytes:
    """Walk a Matroska blob and concatenate the audio payloads from every
    SimpleBlock. Connect's KVS audio is L16 (raw PCM 16-bit big-endian, mono,
    8 kHz) per the MEDIA_STREAMS storage config, so SimpleBlock payloads are
    already raw audio bytes — we just strip the 4-byte SimpleBlock header
    (track number VINT + 2-byte timecode + 1-byte flags)."""
    out = io.BytesIO()
    pos = 0
    end = len(blob)
    stack: list[int] = []  # stack of element-end positions

    def in_container() -> Optional[int]:
        return stack[-1] if stack else None

    while pos < end:
        # Pop containers we've fallen out of
        while stack and pos >= stack[-1]:
            stack.pop()
        try:
            elem_id, id_len = _read_id(blob, pos)
            size, size_len = _read_size(blob, pos + id_len)
        except EOFError:
            break
        header_len = id_len + size_len
        body_start = pos + header_len
        body_end = body_start + size

        if elem_id in CONTAINER_IDS or elem_id == ID_SEGMENT:
            stack.append(body_end)
            pos = body_start
            continue

        if elem_id == ID_SIMPLE_BLOCK:
            # SimpleBlock layout: VINT track number | int16 timecode | flags | data
            try:
                _track, t_len = _read_vint(blob, body_start)
            except EOFError:
                break
            payload_start = body_start + t_len + 2 + 1
            if payload_start <= body_end:
                out.write(blob[payload_start:body_end])
        # Skip other elements (timecode, tracks etc.)
        pos = body_end if body_end <= end else end

    return out.getvalue()


async def _open_transcribe_stream(sample_rate_hz: int):
    """Pre-open a Transcribe streaming connection so we can overlap its
    ~500 ms init cost with KVS GetMedia. Returns the stream object and a
    handler that we'll drive once we have audio bytes ready to send."""
    client = TranscribeStreamingClient(region=os.environ.get("AWS_REGION", "us-east-1"))
    stream = await client.start_stream_transcription(
        language_code=None,
        identify_language=True,
        language_options=LANGUAGE_OPTIONS,
        preferred_language=DEFAULT_LANGUAGE,
        media_sample_rate_hz=sample_rate_hz,
        media_encoding="pcm",
    )
    return stream


async def _drive_transcribe(stream, pcm_le: bytes, sample_rate_hz: int) -> Tuple[str, str]:
    """Drive an already-open Transcribe stream with the given PCM bytes
    and return (final_transcript, identified_language). KVS audio is
    little-endian PCM despite the L16 spec naming -- verified empirically."""
    if len(pcm_le) % 2 == 1:
        pcm_le = pcm_le[:-1]

    state = {"transcript": "", "language": ""}

    class _Handler(TranscriptResultStreamHandler):
        async def handle_transcript_event(self, transcript_event):
            for result in transcript_event.transcript.results or []:
                if result.is_partial:
                    continue
                if result.alternatives:
                    state["transcript"] += " " + result.alternatives[0].transcript
                lang = getattr(result, "language_code", None)
                if lang:
                    state["language"] = lang

    handler = _Handler(stream.output_stream)

    chunk_size = sample_rate_hz * 2 // 10  # 100 ms chunks
    async def _writer():
        for i in range(0, len(pcm_le), chunk_size):
            await stream.input_stream.send_audio_event(audio_chunk=pcm_le[i:i + chunk_size])
        await stream.input_stream.end_stream()

    await asyncio.gather(_writer(), handler.handle_events())
    return state["transcript"].strip(), state["language"]


async def _transcribe_pcm(pcm_le: bytes, sample_rate_hz: int) -> Tuple[str, str]:
    """Backwards-compatible wrapper that opens a Transcribe stream then
    drives it with the given PCM. Existing callers / tests use this; the
    deployed worker uses the split _open_transcribe_stream + _drive_transcribe
    pair so the stream open overlaps with KVS read."""
    stream = await _open_transcribe_stream(sample_rate_hz)
    return await _drive_transcribe(stream, pcm_le, sample_rate_hz)


async def _kvs_and_transcribe_open(stream_arn: str, start_fragment: Optional[str],
                                    sample_rate_hz: int) -> Tuple[bytes, object]:
    """Run KVS GetMedia + Transcribe stream open concurrently. Returns
    (blob, opened_stream) once both finish. Saves ~500 ms vs the
    sequential path because Transcribe's HTTP/2 connection setup happens
    while KVS is still sending us bytes."""
    loop = asyncio.get_event_loop()
    kvs_task = loop.run_in_executor(None, _kvs_get_media, stream_arn, start_fragment)
    transcribe_task = asyncio.create_task(_open_transcribe_stream(sample_rate_hz))
    blob, stream = await asyncio.gather(kvs_task, transcribe_task)
    return blob, stream


def _kvs_get_media(stream_arn: str, start_fragment: Optional[str]) -> bytes:
    """Pull recent Matroska bytes from KVS for this contact's media stream.

    KVS GetMedia opens a long-lived live stream connection that keeps reads
    blocked while the contact is still streaming -- empirically observed
    waits of ~30 seconds when streaming is active. We work around it by
    setting a tight socket read timeout so the FIRST read that has nothing
    new to deliver bails out, and by capping the overall data we consume."""
    import socket
    from botocore.config import Config

    endpoint = kvs_meta.get_data_endpoint(StreamARN=stream_arn, APIName="GET_MEDIA")["DataEndpoint"]
    media = boto3.client(
        "kinesis-video-media",
        endpoint_url=endpoint,
        region_name=os.environ.get("AWS_REGION", "us-east-1"),
        config=Config(read_timeout=2, retries={"max_attempts": 1}),
    )
    selector = (
        {"StartSelectorType": "FRAGMENT_NUMBER", "AfterFragmentNumber": start_fragment}
        if start_fragment
        else {"StartSelectorType": "EARLIEST"}
    )
    resp = media.get_media(StreamARN=stream_arn, StartSelector=selector)
    body = resp["Payload"]
    chunks: list[bytes] = []
    # Read ~16 s worth of audio. Connect's `Start customer media stream`
    # block fires before the Greet plays, so typically ~5-8 s of leading
    # silence; the customer then speaks for 5-10 s. 16 s of buffered audio
    # should give us 5+ s of speech post-trim. Smaller cap = we hit the
    # exit threshold faster, before KVS's connection-idle timeout kicks
    # in (the dominant cost of the previous 480 KB cap was waiting for
    # more live fragments after we'd consumed the buffered ones).
    target_bytes = 256 * 1024  # ~16 s of 8 kHz 16-bit mono LE PCM
    read = 0
    try:
        while read < target_bytes:
            chunk = body.read(64 * 1024)
            if not chunk:
                break
            chunks.append(chunk)
            read += len(chunk)
    except (socket.timeout, Exception) as exc:
        # Read timed out waiting for more live data. Use what we have so
        # far -- it's normal for the connection to idle once we've consumed
        # the buffered audio and the customer has stopped speaking.
        logger.info("kvs read stopped after %d bytes (%s)", read, type(exc).__name__)
    return b"".join(chunks)


def _classify(language_bcp47: str) -> Tuple[str, str, str, str]:
    """Map Transcribe's BCP-47 output to (lang_2, polly_voice, polly_engine, polly_language).
    Transcribe returns codes like 'en-US', 'it-IT'. We treat any 'en-*' as English."""
    if not language_bcp47:
        return "en", *VOICE_BY_LANG["en"]
    short = language_bcp47.split("-", 1)[0].lower()
    if short not in VOICE_BY_LANG:
        return "en", *VOICE_BY_LANG["en"]
    voice, engine, lex_locale = VOICE_BY_LANG[short]
    return short, voice, engine, lex_locale


def lambda_handler(event, context):
    """Single synchronous execution path. Pulls audio from KVS in parallel
    with opening the Transcribe HTTP/2 stream, runs IdentifyLanguage on
    ~5 s of speech-trimmed audio, writes the detected language + Polly
    voice + clean transcript back to the contact's attributes, and
    returns the detection result for the contact flow's downstream blocks
    to consume.

    Backwards compat: the WORKER_MODE_KEY branch is preserved so any old
    in-flight async invocations don't break, and so the benchmark harness
    can pass an explicit stream_arn outside the contact-flow shape."""
    payload = event or {}
    if payload.get(WORKER_MODE_KEY):
        return _do_worker(payload)

    # Contact-flow shape: pull stream ARN from MediaStreams.Customer.Audio
    details = event.get("Details", {}) or {}
    cdata = details.get("ContactData", {}) or {}
    contact_id = cdata.get("ContactId", "")
    media = (cdata.get("MediaStreams", {}) or {}).get("Customer", {}).get("Audio", {}) or {}
    params = details.get("Parameters", {}) or {}
    stream_arn = media.get("StreamARN") or params.get("StreamARN", "")
    start_fragment = media.get("StartFragmentNumber") or params.get("StartFragmentNumber", "")

    if not stream_arn:
        logger.warning("No StreamARN on contact %s; falling back to en", contact_id)
        return _result(contact_id, "en", "", "no_stream")

    worker_payload = {
        WORKER_MODE_KEY: True,
        "contact_id": contact_id,
        "stream_arn": stream_arn,
        "start_fragment": start_fragment or "",
    }
    out = _do_worker(worker_payload)
    # Strip the timing diagnostics from the contact-flow response shape;
    # they're only useful for the benchmark harness.
    out.pop("_timings", None)
    return out


def _do_worker(payload):
    """Returns the detection result, plus a `_timings` dict so the
    benchmark harness can read stage-by-stage timing without parsing
    CloudWatch logs. Times are in seconds, measured with time.perf_counter.

    Pipeline overlap: open the Transcribe stream concurrently with the KVS
    GetMedia read so its ~500 ms HTTP/2 init is paid in parallel rather
    than added to the wall-clock total."""
    timings: dict = {}
    contact_id = payload.get("contact_id", "")
    stream_arn = payload.get("stream_arn", "")
    start_fragment = payload.get("start_fragment", "")
    if not stream_arn:
        return _result(contact_id, "en", "", "worker_no_stream", timings=timings)

    t0 = time.perf_counter()
    try:
        blob, transcribe_stream = asyncio.run(_kvs_and_transcribe_open(
            stream_arn, start_fragment, sample_rate_hz=8000,
        ))
    except Exception as exc:
        logger.exception("kvs+transcribe init failed: %s", exc)
        return _result(contact_id, "en", "", f"init_error:{exc}", timings=timings)
    timings["kvs_and_open_s"] = round(time.perf_counter() - t0, 3)
    timings["kvs_blob_bytes"] = len(blob)

    if not blob:
        return _result(contact_id, "en", "", "empty_stream", timings=timings)

    t1 = time.perf_counter()
    pcm = parse_mkv_audio_pcm(blob)
    timings["demux_s"] = round(time.perf_counter() - t1, 3)
    timings["pcm_bytes"] = len(pcm)

    t2 = time.perf_counter()
    pre_trim_len = len(pcm)
    pcm = _trim_leading_silence(pcm)
    timings["trim_s"] = round(time.perf_counter() - t2, 3)
    timings["pcm_after_trim_bytes"] = len(pcm)
    logger.info("worker contact %s: kvs blob=%d, pcm=%d, after_silence_trim=%d, "
                "kvs+open_s=%.2f demux_s=%.2f trim_s=%.2f",
                contact_id, len(blob), pre_trim_len, len(pcm),
                timings["kvs_and_open_s"], timings["demux_s"], timings["trim_s"])

    if len(pcm) < 8000 * 2:  # <1 second of speech
        return _result(contact_id, "en", "", "audio_too_short", timings=timings)

    # Cap audio at ~5 seconds of *speech* (after silence trim). Transcribe
    # streaming paces at ~1x real-time so worker total time is ~7 s for 5 s
    # of audio (KVS + demux + Transcribe connection overhead). The flow
    # orchestrator polls for the worker's result so smaller audio = faster
    # turnaround for the caller.
    max_pcm = 5 * 8000 * 2
    if len(pcm) > max_pcm:
        pcm = pcm[:max_pcm]

    t3 = time.perf_counter()
    try:
        transcript, lang_bcp47 = asyncio.run(_drive_transcribe(transcribe_stream, pcm, sample_rate_hz=8000))
    except Exception as exc:
        logger.exception("transcribe streaming failed: %s", exc)
        return _result(contact_id, "en", "", f"transcribe_error:{exc}", timings=timings)
    timings["transcribe_total_s"] = round(time.perf_counter() - t3, 3)

    short, voice, engine, polly_language = _classify(lang_bcp47)
    logger.info("worker contact %s: transcribe lang=%s short=%s transcript=%r transcribe_s=%.2f",
                contact_id, lang_bcp47, short, transcript[:200], timings["transcribe_total_s"])

    if INSTANCE_ID and contact_id:
        t4 = time.perf_counter()
        try:
            connect.update_contact_attributes(
                InstanceId=INSTANCE_ID,
                InitialContactId=contact_id,
                Attributes={
                    "LanguageCode": short,
                    "PollyVoice": voice,
                    "PollyEngine": engine,
                    "PollyLanguage": polly_language,
                    "TranscribeTranscript": transcript[:1024],
                },
            )
        except Exception:
            logger.exception("update_contact_attributes failed")
        timings["update_attrs_s"] = round(time.perf_counter() - t4, 3)

    timings["worker_total_s"] = round(time.perf_counter() - t0, 3)
    return {
        "detected_language": short,
        "polly_voice": voice,
        "polly_engine": engine,
        "polly_language": polly_language,
        "transcribe_text": transcript[:1024],
        "_timings": timings,
    }


def _result(contact_id: str, fallback: str, transcript: str, reason: str, timings: dict | None = None) -> dict:
    short, voice, engine, polly_language = _classify(fallback)
    if INSTANCE_ID and contact_id:
        try:
            connect.update_contact_attributes(
                InstanceId=INSTANCE_ID,
                InitialContactId=contact_id,
                Attributes={
                    "LanguageCode": short,
                    "PollyVoice": voice,
                    "PollyEngine": engine,
                    "PollyLanguage": polly_language,
                    "TranscribeTranscript": transcript[:1024],
                    "LanguageDetectFallback": reason,
                },
            )
        except Exception:
            logger.exception("update_contact_attributes (fallback) failed")
    return {
        "detected_language": short,
        "polly_voice": voice,
        "polly_engine": engine,
        "polly_language": polly_language,
        "transcribe_text": transcript[:1024],
        "fallback_reason": reason,
        "_timings": timings or {},
    }
