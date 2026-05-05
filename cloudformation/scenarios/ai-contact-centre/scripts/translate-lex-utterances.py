#!/usr/bin/env python3
"""One-shot helper: translate Lex sample utterances from en_US into the 5
additional locales the AI Contact Centre supports for proper transcription.

Reads the canonical English intent utterances from `template.yaml` (the
`LexBot` resource), calls Bedrock Nova once per intent per target locale,
and writes one JSON file per locale to
`cloudformation/scenarios/ai-contact-centre/lex/locales/<locale>.json`.

Each per-locale JSON file looks like:

    {
      "WelcomeIntent":  ["Ciao", "Salve", "Buongiorno"],
      "BinCollection":  ["Quando passa il netturbino", ...],
      ...
    }

The CFN template loader uses these as SampleUtterances for the Lex BotLocale.
Run once. Hand-tweak Italian if needed (it's the demo language). Files are
committed alongside the rest of the scenario.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import boto3
import yaml


SCENARIO_DIR = Path(__file__).resolve().parent.parent
TEMPLATE_PATH = SCENARIO_DIR / "template.yaml"
LOCALE_DIR = SCENARIO_DIR / "lex" / "locales"

# Bedrock Nova Lite is plenty for short utterance translation, and it's the
# same model used elsewhere in this scenario.
MODEL_ARN = "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0"

TARGET_LOCALES = {
    "it_IT": "Italian (Italy)",
    "fr_FR": "French (France)",
    "de_DE": "German (Germany)",
    "es_ES": "Spanish (Spain)",
    "pl_PL": "Polish (Poland)",
}


def _extract_en_intents() -> dict[str, list[str]]:
    """Pull SampleUtterances per intent out of the LexBot.BotLocales[en_US]
    block. We can't just yaml.safe_load the whole template because it has
    CFN intrinsic tags (!Sub, !GetAtt, etc.) that PyYAML doesn't know. We
    only need the LexBot block, which is plain YAML — slice it out and
    parse just that."""
    raw = TEMPLATE_PATH.read_text()
    # Find the LexBot resource start.
    m = re.search(r"^  LexBot:\n", raw, re.MULTILINE)
    if not m:
        raise SystemExit("Could not locate LexBot: in template.yaml")
    start = m.start()
    # End at the next top-level resource (two spaces + identifier + colon).
    next_resource = re.search(r"^  [A-Z][A-Za-z0-9]+:\n", raw[m.end():], re.MULTILINE)
    if not next_resource:
        raise SystemExit("Could not find next resource after LexBot")
    end = m.end() + next_resource.start()
    chunk = raw[start:end]

    # CFN intrinsic tags (!Sub, !GetAtt, etc.) trip up SafeLoader. We don't
    # care about those values for this script, so register a generic
    # constructor that resolves any unknown tag to its scalar/sequence/
    # mapping content.
    class _CfnLoader(yaml.SafeLoader):
        pass

    def _ignore_tag(loader, tag_suffix, node):
        if isinstance(node, yaml.ScalarNode):
            return loader.construct_scalar(node)
        if isinstance(node, yaml.SequenceNode):
            return loader.construct_sequence(node)
        return loader.construct_mapping(node)

    _CfnLoader.add_multi_constructor("!", _ignore_tag)
    parsed = yaml.load(chunk, Loader=_CfnLoader)
    locales = parsed["LexBot"]["Properties"]["BotLocales"]
    en = next((l for l in locales if l["LocaleId"] == "en_US"), None)
    if not en:
        raise SystemExit("en_US locale not found in LexBot.BotLocales")
    out: dict[str, list[str]] = {}
    for intent in en.get("Intents", []) or []:
        name = intent["Name"]
        utterances = [s["Utterance"] for s in intent.get("SampleUtterances", []) or []]
        if utterances:
            out[name] = utterances
    return out


def _bedrock_translate(client, intent_name: str, utterances: list[str], target_locale: str, target_name: str) -> list[str]:
    if not utterances:
        return []
    joined = "\n".join(f"- {u}" for u in utterances)
    prompt = (
        f"You are localising sample utterances for an Amazon Lex contact-centre bot. "
        f"Translate each English utterance into natural, conversational {target_name}. "
        f"These are how a caller would phrase '{intent_name}' to a UK council switchboard, "
        f"so keep the register informal and idiomatic for everyday speech.\n\n"
        f"Rules:\n"
        f"- Output only the translations, one per line, with a leading hyphen + space (matching the input format).\n"
        f"- Same number of output lines as input.\n"
        f"- Do not add commentary, numbering, or quotes around the lines.\n"
        f"- Preserve any UK-specific terms that have no clean local equivalent (e.g. 'council') by translating to the closest local-government term.\n\n"
        f"English utterances:\n{joined}\n\n"
        f"{target_name} translations:"
    )
    resp = client.converse(
        modelId=MODEL_ARN,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 600, "temperature": 0.2},
    )
    text = resp["output"]["message"]["content"][0]["text"].strip()
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    cleaned: list[str] = []
    for ln in lines:
        # Strip leading hyphen / dash / bullet
        ln = re.sub(r"^[-*•]\s*", "", ln).strip()
        # Strip surrounding quotes
        if (ln.startswith('"') and ln.endswith('"')) or (ln.startswith("'") and ln.endswith("'")):
            ln = ln[1:-1].strip()
        if ln:
            cleaned.append(ln)
    if len(cleaned) != len(utterances):
        sys.stderr.write(
            f"  WARNING: {intent_name} {target_locale}: got {len(cleaned)} lines for {len(utterances)} inputs\n"
        )
    return cleaned


def main():
    en_intents = _extract_en_intents()
    print(f"Loaded {len(en_intents)} intents from en_US locale.", flush=True)
    for n, utts in en_intents.items():
        print(f"  {n}: {len(utts)} utterances", flush=True)

    LOCALE_DIR.mkdir(parents=True, exist_ok=True)
    client = boto3.client("bedrock-runtime", region_name="us-east-1")

    for locale_id, target_name in TARGET_LOCALES.items():
        out_path = LOCALE_DIR / f"{locale_id}.json"
        if out_path.exists():
            print(f"\n[{locale_id}] already exists, skipping. Delete to regenerate.", flush=True)
            continue
        print(f"\n[{locale_id}] translating into {target_name}...", flush=True)
        translated: dict[str, list[str]] = {}
        for intent_name, utterances in en_intents.items():
            print(f"  - {intent_name} ({len(utterances)})", flush=True)
            translated[intent_name] = _bedrock_translate(
                client, intent_name, utterances, locale_id, target_name
            )
        out_path.write_text(json.dumps(translated, ensure_ascii=False, indent=2) + "\n")
        print(f"  wrote {out_path}", flush=True)


if __name__ == "__main__":
    main()
