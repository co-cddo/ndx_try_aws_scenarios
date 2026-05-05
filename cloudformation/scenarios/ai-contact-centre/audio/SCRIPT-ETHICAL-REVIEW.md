# Distress script, ethical review and credits

## Purpose

`audio/distress-script-en_GB.mp3` is a fictional audio recording of a distressed caller used in walkthrough Step 2 to demonstrate how the AI Contact Centre handles sustained negative sentiment, multi-intent decomposition, and safeguarding flagging.

This document records the script's authorship, the safeguarding lead who reviewed it, the date of review, the content warning, and the playback policy. AC22 (the distress-audio acceptance criterion) requires this file to exist and to contain each of those elements.

## Author

- **Name:** Chris Nesbitt-Smith (NDX:Try team), in collaboration with the BMad ux-designer agent (Sally) for tone and pacing.
- **Role:** Scenario author, NDX:Try.

## Safeguarding lead reviewer

- **Name:** *PENDING (interim Polly synthesis approved by scenario author Chris Nesbitt-Smith for demonstration use only). To be signed off by a named human safeguarding-trained reviewer before the audio is replaced with a human voice recording.*
- **Role:** Safeguarding lead (TBC). The reviewer should be a named human, ideally with experience in domestic-abuse helpline operations, social-services intake, or similar professional context.
- **Statement of review:** the reviewer has read the script, confirmed it does not depict any real call, does not include any real personal details, does not encourage any harmful behaviour, and is appropriate for use as a demonstration artefact in a procurement / training context.

## Date of review

- **Date:** 2026-04-28 (interim Polly synthesis). Awaiting full safeguarding-lead sign-off when human voice recording is procured.

## Voice talent

- **Voice:** Amazon Polly Neural en-GB Amy (synthetic). Synthesised on 2026-04-28 from the script below using `aws polly synthesize-speech --voice-id Amy --engine neural`. Document this in any demonstration: the audio is a synthetic voice, not a human actor. The intended replacement is a human voice; Polly Amy is the documented fallback per BLUEPRINT.md.

## Content warning

The audio depicts a fictional distressed caller listing five different problems in escalating distress: missed bin collections, damp and mould in the home, anti-social behaviour from a neighbour, council tax enforcement worries, and a car blocking a driveway. The caller's tone is upset, breathy, and at points tearful.

This audio is not based on any real call, any real council, or any real resident. Any resemblance to a real situation is coincidental. Listeners who have experienced any of these situations in real life may find the audio difficult to listen to.

## Playback policy

- This audio is for demonstration use within the NDX:Try AI Contact Centre walkthrough only.
- Do not use this audio in any real safeguarding training without prior consultation with the named safeguarding lead.
- Do not use this audio in any context where listeners might believe it depicts a real caller.
- Do not modify the audio to insert real personal details, real council names, or real addresses.
- Step 2 of the walkthrough renders a content warning before the download link, with a "skip to Step 3" alternative.
- The companion SPA does not auto-play the audio. Playback is initiated by the lease user only.

## Script (verbatim)

> "Look, I don't know what to do anymore. The bins haven't been collected for three weeks, there's damp coming through my bedroom ceiling, my downstairs neighbour is shouting at all hours and the kids are scared, the council tax letter is threatening enforcement, and now there's a car parked across my driveway so I can't get out for work. Please. I'm at the end of my tether."

## Recording instructions for the human voice talent

- Read in a tone of sustained, weary distress. Not crisis-level. The kind of tone someone might have at the third call to the council in a fortnight, when they have stopped expecting to be heard.
- Pace: 110-130 words per minute. Pause briefly after each comma. Pause longer between the second-to-last and last sentence.
- Microphone: any condenser microphone with a pop filter. Record in a treated room (carpeted, soft furnishings).
- Format: MP3, 44.1kHz, 128kbps. Approximately 25-35 seconds duration.
- Do NOT include real personal details. The script as written contains none.

## Renewal

This ethical review is valid for the lifetime of this scenario in the repository. If the script is changed, the review must be redone and this file updated with a new review date.

## See also

- Walkthrough Step 2 (`src/walkthroughs/ai-contact-centre/step-2.njk`), content warning and credits surface in the rendered page.
- AC22 acceptance criterion in the tech-spec.
- `tests/walkthrough-snapshot.test.mjs`, verifies the rendered Step 2 page contains a content-warning element, a credit element, and a link to this file.
