# What we'd need from AWS to make this Welsh-ready

This page is the keepsake. It is the takeaway artefact for any UK gov body procuring contact-centre AI from AWS where Welsh-language parity, or BSL parity, or accessibility beyond English speech, is a procurement requirement.

## The numbers

Roughly **538,000 people in Wales** spoke Welsh in the 2021 ONS census (17.8% of the population aged 3+). Source: Office for National Statistics, *Welsh language, England and Wales: Census 2021*, published 6 December 2022.

The Welsh Government's Cymraeg 2050 strategy targets a million Welsh speakers by 2050. UK councils with Welsh-language statutory duties (notably the 22 principal areas in Wales, plus authorities in border English counties with Welsh-speaking populations) cannot procure a residents-facing AI contact centre that does not offer parity.

## Where AWS is, today (April 2026)

| Capability | English (en_GB) | Welsh (cy_GB) | Gap |
| ---------- | -------------- | ------------- | --- |
| Real-time speech-to-text | Amazon Transcribe streaming | Batch only | No streaming Transcribe for cy-WL |
| Lex v2 NLU | Full feature set, en_GB native | Limited cy_GB locale | Slot types and intent classifiers not at parity |
| Polly text-to-speech | Neural en-GB voices (Amy, Brian, Arthur) | Standard engine only | No Neural Welsh voice; quality gap audible to native speakers |
| Contact Lens analytics | Native sentiment, redaction, categorisation | English-language model only | No equivalent Welsh-language sentiment / redaction models |
| Bedrock Guardrails | Multi-language but English-strongest | English-strongest | Welsh-language coverage of Guardrails policies untested |

## Strategic ask

If you are a UK gov body procuring contact-centre AI, here are the four questions to put to your AWS Technical Account Manager:

1. **Welsh streaming Transcribe ETA.** Ask your AWS Technical Account Manager for a roadmap commitment with a date, and ask AWS TAM to put it in writing. Without streaming Transcribe, real-time call transcription in Welsh is not achievable on the AWS platform alone.
2. **Native cy_GB Lex NLU ETA.** Ask AWS TAM what partial-parity milestones exist before full parity. Slot types for postcodes, addresses, council tax bands are easier than free-form intent classification, what is the AWS roadmap for those?
3. **Polly Neural Welsh ETA.** Ask AWS TAM whether the new generative-voice family will reach Welsh first, or whether Neural Welsh remains the canonical roadmap entry. The quality gap between Standard and Neural is audible to native speakers and material for a council's accessibility duty.
4. **BSL via video relay roadmap.** This is partially a non-AWS-native feature. Ask your AWS Technical Account Manager which partners AWS recommends and what AWS-native features (Chime SDK, Connect video) bring video-relay closer to a procurable single-vendor solution.

## Accessibility beyond Welsh

The Welsh-language gap is the headline. There are wider accessibility considerations a procurement document should cover:

- **TTY support.** Amazon Connect supports TTY for hearing-impaired callers via the standard PSTN path. No additional configuration in this scenario. Procurement should ask AWS to confirm TTY behaviour with Contact Lens redaction enabled.
- **Live Transcription for hearing-impaired callers.** Contact Lens's redacted transcript stream can be surfaced to a deaf or hearing-impaired caller's companion device in real time, giving them a captions-on-call experience. This scenario's three-pane SPA demonstrates the underlying transcript pane; turning it into a captions service for the caller themselves is an extension.
- **SMS reporting alternatives.** For residents who can't or won't use voice, the same multimodal Lambda accepts a WhatsApp/SMS-equivalent payload. The Lambda code path is identical. Procurement should ask AWS about End User Messaging SMS pricing in the UK.
- **BSL via video relay.** Outside this scenario today. A procurement conversation with AWS TAM should establish: (a) is Connect Video ready for BSL relay use cases, (b) which approved BSL relay partners integrate with Connect, (c) what is the AWS roadmap for direct BSL.
- **Reading age and plain English.** Bedrock Guardrails can enforce a maximum reading age in generated answers. Procurement should specify a reading age (typically 9 to 11 for council customer-facing comms) and AWS Configuration should enforce.

## What this scenario does NOT claim

This NDX:Try scenario does not solve the Welsh-language gap. The demo is in English. We have not built a workaround that cobbles together batch Transcribe with a buffered chat UX; that is not a real-time voice experience and would not pass procurement scrutiny.

## What this scenario DOES claim

It demonstrates that the en_GB voice stack on AWS is procurable today for a single-language English contact centre. It documents where the gap is for Welsh and gives councils the procurement language to push AWS for the missing pieces. The strategic ask block is the value of this page.

---

*This page was authored 28 April 2026. AWS service availability changes; check the AWS What's New feed before quoting any of the above in a procurement document. Verify the source for ONS 2021 census figures before printing for committee.*

*Author: NDX:Try team. Reviewed for procurement accuracy by: NDX:Try lead.*
