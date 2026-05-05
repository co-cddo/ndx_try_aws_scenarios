# Welsh-language and accessibility considerations

Internal note for ai-contact-centre maintainers and procurement conversations.
Not currently surfaced on the public walkthrough.

## Audience

Roughly 538,000 people in Wales spoke Welsh in the 2021 ONS census (17.8% of
the population aged 3+). The Welsh Government's *Cymraeg 2050* strategy targets
a million Welsh speakers by 2050. UK councils with statutory Welsh-language
duties need parity across resident-facing channels before this scenario could
be deployed in production for those councils.

## Capability matrix

| Capability                | English (en_GB) | Welsh (cy_GB)             |
|---------------------------|-----------------|---------------------------|
| Real-time speech-to-text  | Streaming Transcribe, Contact Lens-integrated | Batch Transcribe |
| Lex v2 NLU                | Full feature set, en_GB native | Available, with feature-set differences from en_GB |
| Text-to-speech            | Neural en-GB voices (Amy, Brian, Arthur) | Standard-engine voices |

The matrix is a snapshot. Welsh-language AWS service availability changes,
check the AWS What's New feed before quoting any of the above in a procurement
document.

## Procurement conversation prompts

For UK gov bodies procuring contact-centre AI, here are useful questions to
raise with an AWS Technical Account Manager:

1. Welsh streaming Transcribe roadmap and timelines.
2. Welsh-language Lex NLU roadmap and parity milestones with en_GB.
3. Neural Welsh voice availability and generative-voice alternatives.
4. BSL-via-video-relay options through AWS partners.

## Accessibility paths already in this scenario

- **TTY support.** Amazon Connect supports TTY for hearing-impaired callers via
  the standard PSTN path. No additional configuration required.
- **Live transcription.** Contact Lens's redacted transcript stream can be
  surfaced to a deaf or hearing-impaired caller's companion device in real
  time.
- **Photo-only reporting.** For residents who can't or won't use voice, the
  multimodal Lambda accepts a photo upload payload. The same Lambda code path
  serves the in-browser simulator and would serve any third-party messaging
  bridge.

## BSL via video relay

Outside this scenario today. A separate procurement conversation with AWS
partner integrators is the right starting point.
