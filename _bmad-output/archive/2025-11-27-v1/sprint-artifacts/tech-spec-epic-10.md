# Epic Technical Specification: Text-to-Speech Exploration

Date: 2025-11-28
Author: cns
Epic ID: 10
Status: Draft

---

## Overview

Epic 10 extends the hands-on exploration framework to the Text-to-Speech scenario. Users will explore voice customization, neural vs standard engines, SSML markup, and audio quality options.

This epic follows the patterns established in Epic 6 (Reference Implementation), reusing exploration components and reducing implementation effort by ~40%.

**User Value Statement:** "I understand voice options, speech customization, and how to create accessible council content."

## Objectives and Scope

### In Scope

- **Story 10.1:** Exploration Landing Page with accessibility-focused persona paths
- **Story 10.2:** 5 guided experiments (voice comparison, engine types, SSML, terminology, content types)
- **Story 10.3:** Architecture tour covering Polly synthesis, S3 storage, audio streaming
- **Story 10.4:** 3 boundary challenges (long text, non-English, special characters)
- **Story 10.5:** Production guidance for accessibility integration
- **Story 10.6:** Screenshot automation for Text-to-Speech exploration pages
- Reuse of Epic 6 components
- TTS-specific data file: `src/_data/exploration/text-to-speech.yaml`

### Out of Scope

- Modifications to the core Text-to-Speech CloudFormation template
- Changes to the basic walkthrough (Story 3.6)
- Custom voice training

### Dependencies

- **Epic 6 (Contexted):** Reusable components established
- **Story 3.6 (Done):** Text-to-Speech Walkthrough must exist
- **Deployed Text-to-Speech scenario:** Live endpoints for experiments

## System Architecture Alignment

### Text-to-Speech Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Input                               │
│                     ├── Text Content                         │
│                     ├── Voice Selection (Amy/Brian/Emma)     │
│                     └── SSML Markup (optional)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Amazon Polly                             │
│                     ├── Neural Engine (higher quality)       │
│                     ├── Standard Engine (lower cost)         │
│                     └── SSML Processing                      │
└────────────────────┬────────────────────────────────────────┘
                     │ Audio Stream
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     S3 Audio Storage                         │
│                     ├── MP3 Format                           │
│                     └── Cache for repeated content           │
└────────────────────┬────────────────────────────────────────┘
                     │ Presigned URL
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Audio Playback                           │
│                     ├── Browser HTML5 Audio                  │
│                     └── Download Option                      │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Design

### Services and Modules

#### New Files to Create

| File | Purpose | Story |
|------|---------|-------|
| `src/walkthroughs/text-to-speech/explore/index.njk` | Exploration landing page | 10.1 |
| `src/walkthroughs/text-to-speech/explore/experiments.njk` | 5 guided experiments | 10.2 |
| `src/walkthroughs/text-to-speech/explore/architecture.njk` | Visual + Console tours | 10.3 |
| `src/walkthroughs/text-to-speech/explore/limits.njk` | 3 boundary challenges | 10.4 |
| `src/walkthroughs/text-to-speech/explore/production.njk` | Production guidance | 10.5 |
| `src/_data/exploration/text-to-speech.yaml` | Exploration activity metadata | 10.1-10.5 |
| `src/assets/images/exploration/text-to-speech/` | Screenshot directory | 10.6 |

### Data Models and Contracts

#### Exploration Activity Data Model

```yaml
# src/_data/exploration/text-to-speech.yaml
scenario_id: text-to-speech
scenario_title: Text-to-Speech
total_time_estimate: "35 minutes"
activities:
  - id: exp1
    title: "Compare Different Voices"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Different voices suit different content types"
    is_first: true
    safe_badge: true
    voices:
      - name: "Amy"
        description: "British English female, warm and professional"
      - name: "Brian"
        description: "British English male, clear and authoritative"
      - name: "Emma"
        description: "British English female, friendly and conversational"
    sample_text: "Welcome to the council services portal. How can we help you today?"
    expected_output: "Play button for each voice, hear differences"
    screenshot: "experiments/exp1-voice-comparison.png"

  - id: exp2
    title: "Neural vs Standard Engine"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Neural engine sounds more natural, costs more"
    safe_badge: true
    engines:
      - name: "Neural"
        description: "AI-powered, human-like quality"
        cost_note: "~4x standard cost"
      - name: "Standard"
        description: "Traditional synthesis, lower cost"
        cost_note: "Base price"
    sample_text: "Planning permission applications can be submitted online through our portal."
    expected_output: "Side-by-side comparison of same text"
    screenshot: "experiments/exp2-engine-comparison.png"

  - id: exp3
    title: "SSML for Natural Pauses"
    category: experiments
    persona: both
    time_estimate: "10 min"
    learning: "SSML markup creates more natural-sounding speech"
    safe_badge: true
    ssml_examples:
      - name: "Add pause"
        markup: '<break time="500ms"/>'
        effect: "Brief pause between sentences"
      - name: "Emphasis"
        markup: '<emphasis level="strong">important</emphasis>'
        effect: "Stressed word"
      - name: "Slower rate"
        markup: '<prosody rate="slow">read carefully</prosody>'
        effect: "Reduced speed for clarity"
    expected_output: "Hear difference with and without SSML"
    screenshot: "experiments/exp3-ssml.png"

  - id: exp4
    title: "Council Terminology"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Unusual words may need pronunciation hints"
    safe_badge: true
    terminology:
      - word: "Councillor"
        phoneme: "kaʊn.sɪ.lər"
      - word: "S106"
        pronunciation: "Section one oh six"
      - word: "GDPR"
        pronunciation: "G D P R"
    expected_output: "Correct pronunciation of council-specific terms"
    screenshot: "experiments/exp4-terminology.png"

  - id: exp5
    title: "Different Content Types"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "TTS works for various council communications"
    safe_badge: true
    content_types:
      - type: "Council announcement"
        sample: "Council tax bands for 2024-25 have been published."
      - type: "Service letter"
        sample: "Dear Resident, your bin collection day has changed."
      - type: "FAQ answer"
        sample: "Yes, you can report a pothole online or by phone."
    expected_output: "Each content type sounds appropriate"
    screenshot: "experiments/exp5-content-types.png"

  # Boundary Challenges
  - id: limit1
    title: "Very Long Text"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Long content is chunked automatically"
    challenge_description: "Paste a 10-paragraph council policy document"
    sample_text: "[Long council policy text - 2000+ characters]"
    expected_behavior: "Text synthesized in chunks, audio combined"
    business_implication: "No practical limit for council documents"
    recovery: "Audio plays normally"
    screenshot: "limits/limit1-long-text.png"

  - id: limit2
    title: "Non-English Text"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Welsh and other languages require specific voices"
    challenge_description: "Enter Welsh language text"
    sample_text: "Croeso i'n gwasanaethau cyngor."
    expected_behavior: "English voice may mispronounce; Welsh voice needed"
    business_implication: "Multi-language councils need voice planning"
    recovery: "Switch to appropriate language voice"
    screenshot: "limits/limit2-welsh.png"

  - id: limit3
    title: "Special Characters and Abbreviations"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Abbreviations may need explicit pronunciation"
    challenge_description: "Enter text with postcodes, £ symbols, dates"
    sample_text: "Reference: ABC123-2024. Cost: £250.00. Date: 01/04/2025."
    expected_behavior: "Some symbols read correctly, others need SSML"
    business_implication: "Templates may need pronunciation hints"
    recovery: "Use SSML for consistent pronunciation"
    screenshot: "limits/limit3-special.png"
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Audio generation | <3 seconds for 100 words | Polly streaming |
| Audio playback | Immediate after generation | Presigned URL |
| SSML processing | No additional delay | Polly native support |

### Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Audio player accessible | HTML5 audio with keyboard controls |
| Transcript available | Original text displayed alongside audio |
| Download option | MP3 download for offline use |

## Acceptance Criteria (Authoritative)

### Story 10.1: Exploration Landing Page

- [ ] Persona selection for accessibility focus
- [ ] 5 Visual-First activities covering voice options
- [ ] 5 Console activities for Polly exploration
- [ ] Unique focus areas: voice selection, SSML, accessibility
- [ ] Reuses Epic 6 layout and components

### Story 10.2: "What Can I Change?" Experiments

- [ ] Experiment 1: Voice comparison (Amy/Brian/Emma)
- [ ] Experiment 2: Neural vs Standard engine
- [ ] Experiment 3: SSML markup for natural speech
- [ ] Experiment 4: Council terminology pronunciation
- [ ] Experiment 5: Different content types
- [ ] Audio playback for each experiment

### Story 10.3: "How Does It Work?" Architecture Tour

- [ ] Visual Tour: Text input to audio output flow
- [ ] Console Tour: Polly console, S3 storage, audio player
- [ ] Voice synthesis demonstration
- [ ] Caching explanation

### Story 10.4: "Test the Limits" Boundary Exercise

- [ ] Challenge 1: Very long text (chunking)
- [ ] Challenge 2: Non-English/Welsh text
- [ ] Challenge 3: Special characters and abbreviations
- [ ] Each shows expected behavior and workarounds

### Story 10.5: "Take It Further" Production Guidance

- [ ] Website accessibility integration
- [ ] Multi-language strategy
- [ ] Audio caching for repeated content
- [ ] Cost optimization (standard vs neural)
- [ ] SSML template library

### Story 10.6: Screenshot Automation Pipeline

- [ ] Text-to-Speech pages added to shared pipeline
- [ ] Audio player states captured
- [ ] SSML editor screenshots

## Traceability Mapping

| Story | Functional Requirements | Non-Functional Requirements |
|-------|------------------------|----------------------------|
| 10.1 | FR57, FR58, FR59, FR60, FR90 | NFR37, NFR39, NFR40 |
| 10.2 | FR65, FR66, FR67, FR68 | NFR37, NFR39, NFR40 |
| 10.3 | FR69, FR70, FR71, FR83 | NFR37, NFR38, NFR39 |
| 10.4 | FR72, FR73, FR74 | NFR37, NFR39 |
| 10.5 | FR75, FR76, FR77 | NFR39 |
| 10.6 | FR61, FR62, FR63, FR81 | NFR38, NFR44 |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Welsh voice unavailable in demo region | Medium | Medium | Document language limitations |
| Audio playback blocked by browser | Low | Low | Download fallback option |

### Assumptions

- Polly British English voices available (Amy, Brian, Emma)
- Neural engine available for demo
- S3 audio storage within demo limits

## Test Strategy Summary

### Integration Testing

| Test | Method | Automation |
|------|--------|------------|
| Voice selection | Playwright E2E | GitHub Actions |
| Audio playback | Playwright audio test | GitHub Actions |
| SSML processing | Integration test | GitHub Actions |

### Manual Testing Checklist

- [ ] All 3 voices produce distinct audio
- [ ] Neural vs Standard difference audible
- [ ] SSML pauses and emphasis work correctly
- [ ] Council terminology pronounced correctly
- [ ] Long text processed successfully
