#!/usr/bin/env python3
"""End-to-end test harness for the language-detect Lambda pipeline.

Usage:
    AWS_PROFILE=NDX/SandboxAdmin python3 scripts/test-language-detect.py [AUDIO_FILE]

If no AUDIO_FILE is given, defaults to ~/Downloads/audio_message (2).m4a
which is a real Italian sample from the user. Any ffmpeg-readable format
(m4a, mp3, wav, ogg) is accepted; this script transcodes to the same
format Connect's KVS uses (8 kHz mono little-endian 16-bit PCM).

Three layers of testing, in order of dependency depth:

  1. _transcribe_pcm: feed raw LE PCM directly to the Lambda's Transcribe
     wrapper. Confirms IdentifyLanguage + the language → Polly mapping.

  2. parse_mkv_audio_pcm + _transcribe_pcm: wrap the audio in Matroska
     (mimicking how Connect's KVS produces it) and feed it through the
     full demux + Transcribe pipeline.

  3. live KVS data (--from-contact CONTACT_ID): pulls the actual KVS
     fragments produced by Connect for that contact, runs the full
     demux + Transcribe pipeline, and reports what would have been
     written to contact attributes.

Each layer that passes proves a bigger chunk of the production code path.
"""
from __future__ import annotations

import argparse
import asyncio
import os
import subprocess
import sys
from pathlib import Path

SCENARIO_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCENARIO_DIR / "lambdas" / "language-detect"))
import index as ld  # type: ignore


DEFAULT_AUDIO = str(Path.home() / "Downloads" / "audio_message (2).m4a")
BENCHMARK_AUDIO = [
    str(Path.home() / "Downloads" / "audio_message (1).m4a"),
    str(Path.home() / "Downloads" / "audio_message (2).m4a"),
]
BENCHMARK_CAPS = [3, 4, 5, 6, 8, 12]


def _to_le_pcm(audio_path: str, sample_rate: int = 8000) -> bytes:
    """Transcode any ffmpeg-readable file to mono little-endian 16-bit PCM
    at the given sample rate."""
    proc = subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", audio_path,
            "-ac", "1",
            "-ar", str(sample_rate),
            "-f", "s16le",
            "-",
        ],
        check=True,
        stdout=subprocess.PIPE,
    )
    return proc.stdout


def _to_mkv(audio_path: str, sample_rate: int = 8000) -> bytes:
    """Transcode to Matroska + LE PCM, matching Connect's KVS output."""
    proc = subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", audio_path,
            "-ac", "1",
            "-ar", str(sample_rate),
            "-c:a", "pcm_s16le",
            "-f", "matroska",
            "-",
        ],
        check=True,
        stdout=subprocess.PIPE,
    )
    return proc.stdout


def test_transcribe_only(audio_path: str) -> None:
    print(f"[1] Transcribe-only test  audio={audio_path}")
    pcm = _to_le_pcm(audio_path)
    print(f"    converted to {len(pcm)} bytes of 8 kHz LE PCM (~{len(pcm)/16000:.1f}s)")

    transcript, lang = asyncio.run(ld._transcribe_pcm(pcm, sample_rate_hz=8000))
    short, voice, engine, polly_language = ld._classify(lang)
    print(f"    detected: {lang!r} -> short={short} voice={voice} engine={engine} lex_locale={polly_language}")
    print(f"    transcript: {transcript!r}")
    if not lang:
        print("    [FAIL] empty language code returned")
        sys.exit(1)
    if short == "en":
        print(f"    [WARN] detected 'en' for what was expected to be non-English")
    print()


def test_full_demux(audio_path: str) -> None:
    print(f"[2] MKV demux + Transcribe test  audio={audio_path}")
    mkv = _to_mkv(audio_path)
    print(f"    wrapped as MKV: {len(mkv)} bytes")
    pcm = ld.parse_mkv_audio_pcm(mkv)
    print(f"    demuxed to PCM: {len(pcm)} bytes")
    if not pcm:
        print("    [FAIL] demux produced empty PCM")
        sys.exit(1)
    transcript, lang = asyncio.run(ld._transcribe_pcm(pcm, sample_rate_hz=8000))
    short, voice, engine, polly_language = ld._classify(lang)
    print(f"    detected: {lang!r} -> short={short} voice={voice} engine={engine}")
    print(f"    transcript: {transcript!r}")
    if not lang:
        print("    [FAIL] empty language code returned")
        sys.exit(1)
    print()


def test_live_kvs(contact_id: str) -> None:
    """Pull a real Connect contact's KVS data, run the full Lambda pipeline."""
    import boto3
    print(f"[3] Live KVS test  contact_id={contact_id}")
    kv = boto3.client("kinesisvideo", verify=False)
    streams = kv.list_streams()["StreamInfoList"]
    stream = next((s for s in streams if contact_id in s["StreamName"]), None)
    if not stream:
        print(f"    [FAIL] no KVS stream found for contact {contact_id}")
        sys.exit(1)
    print(f"    stream: {stream['StreamName']}")
    blob = ld._kvs_get_media(stream["StreamARN"], "")
    print(f"    KVS blob: {len(blob)} bytes")
    pcm = ld.parse_mkv_audio_pcm(blob)
    print(f"    demuxed PCM: {len(pcm)} bytes (~{len(pcm)/16000:.1f}s)")
    if len(pcm) > 12 * 8000 * 2:
        pcm = pcm[: 12 * 8000 * 2]
        print(f"    capped to 12s for Transcribe ({len(pcm)} bytes)")
    transcript, lang = asyncio.run(ld._transcribe_pcm(pcm, sample_rate_hz=8000))
    short, voice, engine, polly_language = ld._classify(lang)
    print(f"    detected: {lang!r} -> short={short} voice={voice} engine={engine}")
    print(f"    transcript: {transcript!r}")
    print()


def benchmark(audio_paths: list[str], caps: list[int]) -> None:
    """For each audio file, time the full pipeline at each cap (in seconds)
    so we can pick the shortest audio that reliably identifies the language
    within the contact flow's 8 s InvokeLambda budget. Reports a table:
    cap | wallclock | language | first words of transcript."""
    import time
    print(f"\n[benchmark] {len(audio_paths)} files x {len(caps)} caps = {len(audio_paths)*len(caps)} runs\n")
    for path in audio_paths:
        if not os.path.exists(path):
            print(f"  skip (missing): {path}")
            continue
        print(f"=== {os.path.basename(path)} ===")
        full_pcm = _to_le_pcm(path)
        full_secs = len(full_pcm) / 16000
        print(f"  source: {full_secs:.1f}s of 8 kHz LE PCM\n")
        print(f"  {'cap':>5} {'pcm_bytes':>10} {'demux_s':>8} {'tx_s':>6} {'lang':>6}  transcript (first 60)")
        print(f"  {'-'*5} {'-'*10} {'-'*8} {'-'*6} {'-'*6}  {'-'*60}")
        for cap_s in caps:
            cap_bytes = cap_s * 8000 * 2
            slice_pcm = full_pcm[:cap_bytes]
            mkv = _to_mkv_from_pcm(slice_pcm, sample_rate=8000)

            t0 = time.time()
            demuxed = ld.parse_mkv_audio_pcm(mkv)
            demux_s = time.time() - t0

            t1 = time.time()
            transcript, lang = asyncio.run(ld._transcribe_pcm(demuxed, sample_rate_hz=8000))
            tx_s = time.time() - t1

            print(f"  {cap_s:>5} {len(demuxed):>10} {demux_s:>8.2f} {tx_s:>6.2f} {lang or '—':>6}  {transcript[:60]!r}")
        print()


def _to_mkv_from_pcm(pcm_le: bytes, sample_rate: int) -> bytes:
    """Wrap raw LE PCM in a Matroska container that matches Connect's KVS
    output format -- 8 kHz mono pcm_s16le inside MKV."""
    proc = subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "s16le", "-ar", str(sample_rate), "-ac", "1",
            "-i", "-",
            "-c:a", "pcm_s16le", "-f", "matroska", "-",
        ],
        check=True,
        input=pcm_le,
        stdout=subprocess.PIPE,
    )
    return proc.stdout


def benchmark_live_lambda(audio_paths: list[str]) -> None:
    """Invoke the DEPLOYED language-detect Lambda end-to-end via a real KVS
    stream Connect produced for an existing contact. This is the closest
    fully-automated proxy for an end-to-end phone call, exercising:
      orchestrator -> async worker -> KVS GetMedia -> demux -> Transcribe
      streaming -> update_contact_attributes -> orchestrator poll catch -> return.

    Reports orchestrator wallclock + the language it returned, so we can
    verify the orchestrator polls long enough to catch the worker's result
    inside the contact flow's 8 s InvokeLambda budget. Uses the most
    recent real contact id with a matching KVS stream so update +
    get_contact_attributes both succeed."""
    import boto3, time, urllib3, datetime
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    print(f"\n[live-lambda-benchmark]")

    session = boto3.Session(profile_name="NDX/SandboxAdmin", region_name="us-east-1")
    kvs = session.client("kinesisvideo", verify=False)
    lam = session.client("lambda")
    cn = session.client("connect")

    streams = kvs.list_streams().get("StreamInfoList", []) or []
    aicc = [s for s in streams if "ndx-try-aicc" in s["StreamName"]]
    if not aicc:
        print("  no AICC KVS streams available -- need a recent voice call to seed one")
        return

    # Match each KVS stream with its real contact id so update + get
    # contact_attributes succeed (the orchestrator's polling needs to see
    # the worker's writes). KVS stream name embeds the contact id.
    runs = []
    for stream in aicc:
        # Stream name format: ...-contact-<contact_id>
        name = stream["StreamName"]
        idx = name.rfind("contact-")
        if idx == -1:
            continue
        contact_id = name[idx + len("contact-"):]
        runs.append((stream, contact_id))
    if not runs:
        print("  no KVS streams with still-existing contacts (24h retention)")
        return

    print(f"  using {len(runs)} stream/contact pair(s)")
    print(f"  {'contact':>14}  {'wallclock':>10}  {'language':>10}  status")
    print(f"  {'-'*14}  {'-'*10}  {'-'*10}  {'-'*40}")
    for stream, contact_id in runs[:3]:
        event = {
            "Details": {
                "ContactData": {
                    "ContactId": contact_id,
                    "MediaStreams": {
                        "Customer": {"Audio": {"StreamARN": stream["StreamARN"], "StartFragmentNumber": ""}}
                    },
                },
                "Parameters": {},
            }
        }
        t0 = time.time()
        resp = lam.invoke(
            FunctionName="ndx-try-aicc-language-detect-us-east-1",
            InvocationType="RequestResponse",
            Payload=__import__("json").dumps(event).encode(),
        )
        dt = time.time() - t0
        body = __import__("json").loads(resp["Payload"].read())
        print(f"  {contact_id[:14]:>14}  {dt:>9.2f}s  {body.get('detected_language','?'):>10}  {body.get('status','?')}")
    print()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", nargs="?", default=DEFAULT_AUDIO,
                        help=f"audio file path (default: {DEFAULT_AUDIO})")
    parser.add_argument("--from-contact", metavar="CONTACT_ID",
                        help="instead of an audio file, pull KVS data for the given Connect contact id")
    parser.add_argument("--skip-demux", action="store_true",
                        help="only run layer 1 (Transcribe-only) test")
    parser.add_argument("--benchmark", action="store_true",
                        help="cap-vs-accuracy local benchmark across audio_message (1) and (2)")
    parser.add_argument("--benchmark-live", action="store_true",
                        help="invoke the deployed Lambda end-to-end against an existing KVS stream, measure orchestrator timing")
    args = parser.parse_args()

    if args.benchmark:
        benchmark(BENCHMARK_AUDIO, BENCHMARK_CAPS)
        return

    if args.benchmark_live:
        benchmark_live_lambda(BENCHMARK_AUDIO)
        return

    if args.from_contact:
        test_live_kvs(args.from_contact)
        return

    if not os.path.exists(args.audio):
        sys.exit(f"audio file not found: {args.audio}")
    test_transcribe_only(args.audio)
    if not args.skip_demux:
        test_full_demux(args.audio)


if __name__ == "__main__":
    main()
