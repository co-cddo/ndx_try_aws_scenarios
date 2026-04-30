"""End-to-end voice contact-flow simulator.

Drives the deployed Lex bot + RAG Lambda through the same sequence the Connect
contact flow would, without dialling. Each turn:

  1. Send an audio file (or text) to Lex's RecognizeUtterance/RecognizeText.
  2. Lex's fulfillment hook fires (MultiIntentFunction populates session attrs).
  3. Read transcript + decomposed_json + safeguarding_flag from session attrs.
  4. Invoke RagFulfilmentFunction with the same Lambda payload Connect would
     pass via the `InvokeLambdaFunction` action.
  5. Check `should_disconnect` and `safeguarding` to decide the next flow step.
  6. If safeguarding: simulate the outbound-callback Lambda and end the call.
  7. If disconnect: end. Otherwise: loop with the next caller turn.

Usage:
  python3 tests/flow-sim.py path/to/audio_message_16k.pcm
  python3 tests/flow-sim.py text:"when are bins collected" text:"bn1 5aa" text:"no thanks"
"""
import argparse
import base64
import gzip
import json
import os
import sys
import time
import uuid
import boto3

session = boto3.Session(profile_name=os.environ.get("AWS_PROFILE", "NDX/SandboxAdmin"),
                        region_name="us-east-1")

BOT_ID = "HY7CHBYSJO"
ALIAS_ID = "JZ3PQBXTHC"
LOCALE = "en_US"
RAG_FN = "ndx-try-aicc-rag-us-east-1"
OUTBOUND_FN = "ndx-try-aicc-outbound-callback-us-east-1"

lex = session.client("lexv2-runtime")
lambdac = session.client("lambda")


def _decode(b64gz: str) -> str:
    return gzip.decompress(base64.b64decode(b64gz)).decode("utf-8")


def lex_turn(session_id: str, turn):
    """Send a turn to Lex. `turn` is a dict {kind: 'audio'|'text', value: str}."""
    if turn["kind"] == "audio":
        with open(turn["value"], "rb") as f:
            audio = f.read()
        resp = lex.recognize_utterance(
            botId=BOT_ID, botAliasId=ALIAS_ID, localeId=LOCALE,
            sessionId=session_id,
            requestContentType="audio/x-l16; sample-rate=16000; channel-count=1",
            responseContentType="text/plain; charset=utf-8",
            inputStream=audio,
        )
        transcript = json.loads(_decode(resp["inputTranscript"]))
        interps = json.loads(_decode(resp["interpretations"]))
        session_state = json.loads(_decode(resp["sessionState"]))
    else:
        resp = lex.recognize_text(
            botId=BOT_ID, botAliasId=ALIAS_ID, localeId=LOCALE,
            sessionId=session_id, text=turn["value"],
        )
        transcript = turn["value"]
        interps = resp.get("interpretations", [])
        session_state = resp.get("sessionState", {})

    intent_name = interps[0]["intent"]["name"] if interps else "FallbackIntent"
    sa = session_state.get("sessionAttributes", {}) or {}
    return {
        "transcript": transcript,
        "intent": intent_name,
        "alternates": [(i["intent"]["name"], i.get("nluConfidence", {}).get("score"))
                       for i in interps[1:5]],
        "session_attrs": sa,
    }


def rag_turn(contact_id: str, lex_result):
    sa = lex_result["session_attrs"]
    event = {
        "Details": {
            "ContactData": {
                "ContactId": contact_id,
                "CustomerEndpoint": {"Address": "+447700900123"},
            },
            "Parameters": {
                "user_utterance": sa.get("lex_input_transcript") or lex_result["transcript"],
                "matched_intent": lex_result["intent"],
                "decomposed_json": sa.get("decomposed_intents_json", ""),
                "safeguarding": sa.get("safeguarding_flag", "false"),
            },
        },
    }
    t = time.monotonic()
    resp = lambdac.invoke(FunctionName=RAG_FN, InvocationType="RequestResponse",
                          Payload=json.dumps(event).encode())
    out = json.loads(resp["Payload"].read())
    out["_latency"] = time.monotonic() - t
    return out


def outbound_turn(contact_id: str, customer_phone: str = "+447700900123"):
    event = {"Details": {"ContactData": {"ContactId": contact_id,
                                          "CustomerEndpoint": {"Address": customer_phone}},
                          "Parameters": {"customer_phone": customer_phone}}}
    t = time.monotonic()
    resp = lambdac.invoke(FunctionName=OUTBOUND_FN, InvocationType="RequestResponse",
                          Payload=json.dumps(event).encode())
    out = json.loads(resp["Payload"].read())
    out["_latency"] = time.monotonic() - t
    return out


def parse_turns(args):
    """Convert CLI args to turn dicts."""
    out = []
    for a in args:
        if a.startswith("text:"):
            out.append({"kind": "text", "value": a[5:]})
        else:
            out.append({"kind": "audio", "value": a})
    return out


def run(turns, simulate_outbound=False):
    contact_id = f"sim-{uuid.uuid4().hex[:8]}"
    session_id = contact_id
    print(f"[contact_id: {contact_id}]")
    print(f"[bot greeting: \"Hello, you've reached Aldershire District Council. What can I help with?\"]\n")

    for i, turn in enumerate(turns, 1):
        print(f"--- TURN {i} (caller: {turn['kind']}: {turn['value'][:60] + '...' if len(str(turn['value'])) > 60 else turn['value']!r}) ---")
        try:
            lex_result = lex_turn(session_id, turn)
        except Exception as exc:
            print(f"Lex error: {exc}")
            return
        print(f"  transcript: {lex_result['transcript']!r}")
        print(f"  primary intent: {lex_result['intent']}  alternates: {lex_result['alternates'][:3]}")

        rag_result = rag_turn(contact_id, lex_result)
        print(f"  bot answer ({rag_result['_latency']:.2f}s, {len(rag_result.get('answer',''))} chars):")
        print(f"    {rag_result.get('answer','')}")

        sg = rag_result.get("safeguarding") == "true"
        dc = rag_result.get("should_disconnect") == "true"
        print(f"  flags: safeguarding={sg} should_disconnect={dc} fulfilled={rag_result.get('fulfilled')}")

        if sg:
            print(f"\n[FLOW: safeguarding flagged → TriggerOutboundCallback Lambda]")
            if simulate_outbound:
                cb = outbound_turn(contact_id)
                print(f"  outbound result ({cb['_latency']:.2f}s): {cb}")
            else:
                print(f"  (skipped real Connect call; pass --simulate-outbound to fire it)")
            print(f"[FLOW: ReadbackAndDisconnect → End]")
            return
        if dc:
            print(f"\n[FLOW: should_disconnect → ReadbackAndDisconnect → End]")
            return
        print(f"[FLOW: AnswerAndListen → next turn]\n")
    print("\n[end of script]")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("turns", nargs="+",
                    help="text:'utterance' or path/to/audio.pcm")
    ap.add_argument("--simulate-outbound", action="store_true",
                    help="Actually fire the outbound callback Lambda (will dial!)")
    args = ap.parse_args()
    run(parse_turns(args.turns), simulate_outbound=args.simulate_outbound)
