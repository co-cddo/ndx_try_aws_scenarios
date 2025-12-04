# Brainstorming Session Results

**Session Date:** 2025-11-27
**Facilitator:** Business Analyst Mary
**Participant:** cns

## Session Start

**Approach Selected:** AI-Recommended Flow

**Techniques Planned:**
1. First Principles Thinking - Core truths about "try before you buy"
2. SCAMPER Gap Analysis - Systematic examination of 27 existing scenarios
3. Six Thinking Hats - Prioritization for launch set

**Context Loaded:** 27 existing scenarios from Asana tagged `NDX:Try AWS scenario`, each with standardized subtasks (Infrastructure, Sample Data, Frontend, Documentation, Testing, Cost Monitoring)

## Executive Summary

**Topic:** NDX:Try AWS Scenarios - Gap analysis, prioritization, and experience design for Innovation Sandbox demo scenarios

**Session Goals:** Identify gaps in current 27 scenarios, establish prioritization criteria, define cross-cutting patterns for user experience

**Techniques Used:** First Principles, Empathy Mapping, Journey Mapping, Devil's Advocate, Pre-mortem Analysis, Value Chain Analysis, SCAMPER, Six Thinking Hats

**Total Ideas Generated:** 29 (2 new scenarios, 13 features/improvements, 14 enhancements)

### Key Themes Identified:

1. **Informed Confidence > Adoption** - Goal is smarter customers who can evaluate and decide, not sales conversions
2. **AI Anxiety is Universal** - All personas share concerns about AI costs, risks, governance - scenarios must address these
3. **Three Journey Gaps** - Discovery (no matcher), Sense-Making (no debrief), Pathway (no next steps)
4. **Pragmatic Persona Targeting** - Not every scenario for every persona; tag and focus appropriately
5. **Starter Pack Strategy** - Launch 6 polished scenarios rather than 29 unpolished ones

## Technique Sessions

### Technique 1: First Principles Thinking

**Goal:** Strip away assumptions to find what makes "try before you buy" truly compelling

**Key Questions Explored:**
- Who are the target users? → Total mix depending on scenario - "open up, not dumb down"
- What's their mindset? → Mix of curious, skeptical, mandated to evaluate
- What does success look like? → Understanding the offering and value proposition; becoming an informed customer capable of evaluating competitively or proceeding to procurement

**Three Core Principles Established:**

#### Principle 1: Create Smarter Customers (Refined)
> The goal is not adoption. The goal is **informed confidence that levels the playing field** - making it harder to dismiss alternatives without genuine evaluation.

Success states (all equally valid):
- "I could do this myself" ✓
- "I need a partner but now I know what to ask for" ✓
- "This isn't right for us and here's why" ✓

The only failure: "I still don't really get it."

**Strategic value:** NDX:Try scenarios reduce information asymmetry against incumbents. Even if decisions are political, the technical team now has *evidence* to push back with. The "unknown risk" of AWS becomes *known* risk.

#### Principle 2: Show the Real Shape of the Work (Refined)

Beyond cost estimates, users need to understand:
- **Complexity shape** - Deploy-and-done vs needs-ongoing-care
- **Skill requirements** - Can existing team run this? What roles needed?
- **Integration reality** - What does connecting to *our* systems involve?

**Critical addition:** Always show the shape WITH pathways forward:
- "Here's the complexity... AND here's who can help" (partner ecosystem)
- "Here's the skills gap... AND here's the learning path" (training resources)
- "Here's the integration challenge... AND here's the typical approach" (patterns/playbooks)

Radical transparency is a feature, not a bug - but transparency without pathways creates paralysis.

#### Principle 3: Pragmatic Persona Targeting (Refined)

~~"Open up, not dumb down" means multiple entry points per scenario~~ → **Be pragmatic about persona fit per scenario.**

Instead of forcing all four personas on every scenario:
1. **Tag each scenario with primary persona(s)** - Who is this *really* for?
2. **Accept that some scenarios are technical-first, others are service-first**
3. **Documentation depth follows the primary persona**

| User | What they need |
|------|----------------|
| CTO/Head of IT | Architecture diagram, cost model, security posture |
| Service Manager | "What does this do for my residents?" |
| Developer | "Show me the code, let me poke at it" |
| Finance | "What's the TCO? What's the risk?" |

**New Action Item:** Evaluate all 27 scenarios and assign primary/secondary personas. Initial hypothesis:

| Scenario Type | Primary Persona | Secondary |
|---------------|-----------------|-----------|
| Bedrock Chatbot + Telephony | Service Manager | CTO |
| CloudFormation/Infrastructure | Developer | CTO |
| QuickSight Dashboard | Service Manager | Finance |
| Entity Resolution | Developer | CTO |
| Textract/Comprehend (doc processing) | Service Manager | Developer |
| WorkSpaces/AppStream | CTO | Finance |
| Amazon Q Apps | Service Manager | Developer |
| Cost/Budget scenarios | Finance | CTO |

---

### Advanced Elicitation: Empathy Mapping (Four Personas)

**Goal:** Deepen "Respect the Spectrum" by understanding each user type's motivations, fears, and needs - particularly around AI.

#### Persona 1: CTO / Head of IT

| Dimension | What do they... |
|-----------|-----------------|
| **THINK** | "Is this secure enough for our data?" / "How does this fit our roadmap?" / "Can AI actually deliver or is it hype?" / "What's the migration path if we go all-in?" / "Are we falling behind other councils on AI?" |
| **FEEL** | Pressure to modernize, fear of vendor lock-in, FOMO on AI, cautious optimism mixed with healthy skepticism, anxiety about AI governance/ethics |
| **SEE** | Board presentations about digital transformation, ChatGPT headlines, peers adopting cloud, vendor sales pitches, central gov AI frameworks emerging |
| **SAY** | "Show me the architecture" / "What's the exit strategy?" / "Who else in local gov is using this?" / "How do we govern AI safely?" / "What's real vs what's vapourware?" |
| **DO** | Skim executive summaries, drill into security/compliance sections, forward to technical leads for validation, attend AI webinars/conferences, ask about responsible AI guardrails |
| **PAINS** | Budget scrutiny, skills gap in team, past failed IT projects, political pressure, no internal AI expertise, fear of AI going wrong publicly |
| **GAINS** | Wants to be seen as innovative but prudent, needs wins to show leadership, wants to "get AI" before being forced to |

#### Persona 2: Service Manager (e.g., Head of Waste, Housing, Planning)

| Dimension | What do they... |
|-----------|-----------------|
| **THINK** | "Will this actually help my residents?" / "My team is already stretched" / "I don't understand the tech but I need results" / "Can AI really understand the nuances of our service?" |
| **FEEL** | Overwhelmed by demand, skeptical of IT promises, protective of service quality, curious but time-poor, excited but wary about AI replacing judgment |
| **SEE** | Backlogs growing, complaints about response times, news stories about AI chatbots going wrong, other councils claiming transformation wins |
| **SAY** | "What does this do for my residents?" / "How long until it's live?" / "Who supports it when it breaks?" / "Will AI get it wrong and cause complaints?" |
| **DO** | Ask for plain English explanations, want to see it working with realistic scenarios, check with peers at other councils, involve frontline staff in evaluation |
| **PAINS** | Service cuts, recruitment struggles, manual processes eating time, fear of looking foolish if tech fails publicly, no time to become AI expert |
| **GAINS** | Wants to reduce backlogs, improve resident satisfaction, free staff for complex cases, look innovative to leadership without betting career on unproven tech |

#### Persona 3: Developer / Technical Lead

| Dimension | What do they... |
|-----------|-----------------|
| **THINK** | "Show me the code" / "Is this well-architected or a bodge?" / "Can I actually extend this?" / "What's the learning curve for my team?" / "Is this AI wrapper or real ML?" |
| **FEEL** | Curious, potentially excited, suspicious of vendor demos, want to get hands dirty, eager to skill up on AI but wary of magic black boxes |
| **SEE** | GitHub repos, CloudFormation templates, API documentation, Stack Overflow, Bedrock/SageMaker docs, conference talks |
| **SAY** | "What's under the hood?" / "Is this production-ready or just a demo?" / "What happens at scale?" / "Can I fine-tune the model?" / "Where does our data go?" |
| **DO** | Deploy immediately, read the code before the docs, try to break it, check dependencies and security, experiment with prompts, fork and modify |
| **PAINS** | Technical debt, legacy systems to integrate with, stakeholders who don't understand constraints, AI skills gap, pressure to deliver AI fast |
| **GAINS** | Wants to learn new tech, build portfolio/CV, deliver something impressive, become the AI expert on the team |

#### Persona 4: Finance / Procurement Lead

| Dimension | What do they... |
|-----------|-----------------|
| **THINK** | "What's the total cost of ownership?" / "What are the hidden costs?" / "How does this fit procurement rules?" / "What's the contract exit clause?" / "How do I budget for AI when usage is unpredictable?" |
| **FEEL** | Risk-averse, responsible for public money, suspicious of cloud "pay as you go" unpredictability, anxious about AI costs spiraling |
| **SEE** | Spreadsheets, business cases, framework agreements, NDX/G-Cloud catalogues, audit reports |
| **SAY** | "What's the worst-case cost?" / "Is this on a framework?" / "What about GDPR and data sovereignty?" / "How do we cap AI spend?" / "What do we get for that price?" |
| **DO** | Build comparison models, scrutinize cost estimates, consult legal, check existing contracts, want clear cost/benefit breakdown |
| **PAINS** | Budget pressure, audit scrutiny, unpredictable cloud bills, lengthy procurement, can't model AI costs with confidence |
| **GAINS** | Wants defensible decisions, clear value-for-money story, compliance confidence, ability to explain AI spend to auditors |

#### Key Insight: The AI Cost/Risk Anxiety

Across all four personas, a common thread emerges:

> **AI introduces new uncertainty dimensions that cloud alone didn't have:**
> - Unpredictable token/inference costs
> - "AI going wrong" reputational risk
> - Governance/ethics questions
> - Data handling concerns
> - Skills gap for everyone

**Actionable Recommendation:** Every AI scenario should explicitly address these anxieties:
- Cost caps / budget alerts (already in subtasks - good!)
- "What happens when AI is wrong" guidance
- Data flow diagrams showing where data goes
- Governance checklist for responsible AI

---

### Advanced Elicitation: Journey Mapping (Scenario Experience)

**Goal:** Map the end-to-end journey from "hears about NDX:Try" to "makes informed decision" - identifying touchpoints, pain points, and opportunities.

#### Stage 1: Discovery
*How do they find out about this?*

| Element | Current State |
|---------|---------------|
| **Touchpoints** | NDX marketplace, GDS channels, word of mouth, AWS events |
| **Actions** | Browse catalogue, hear recommendation, see demo at conference |
| **Thoughts** | "Is this relevant to my council?" / "Is this real or vapourware?" |
| **Emotions** | Curious, slightly skeptical |
| **Pain Points** | Hard to find? Not clear what "Try" means? Too many options? |

#### Stage 2: Evaluation / Selection
*Deciding which scenario to try*

| Element | Current State |
|---------|---------------|
| **Touchpoints** | Scenario listing, README, cost estimates |
| **Actions** | Scan titles, read descriptions, check costs, compare to needs |
| **Thoughts** | "Which one matches my problem?" / "What will this cost me?" |
| **Emotions** | Overwhelmed? Engaged? Confused by choice? |
| **Pain Points** | 27 scenarios - how to choose? No clear "start here"? |

#### Stage 3: Deployment
*Getting it running in sandbox*

| Element | Current State |
|---------|---------------|
| **Touchpoints** | CloudFormation template, deployment guide, Innovation Sandbox |
| **Actions** | Request sandbox account, deploy stack, wait, troubleshoot |
| **Thoughts** | "Will this just work?" / "How long will this take?" |
| **Emotions** | Anticipation, potential frustration if errors |
| **Pain Points** | Deployment failures? Missing prerequisites? Unclear errors? |

#### Stage 4: Hands-On Experience
*Actually using the demo*

| Element | Current State |
|---------|---------------|
| **Touchpoints** | Demo UI, sample data, documentation |
| **Actions** | Try features, explore, test with realistic scenarios |
| **Thoughts** | "Does this work with data like ours?" / "What can I break?" |
| **Emotions** | Engaged, curious, possibly delighted or disappointed |
| **Pain Points** | Sample data not realistic? UI too basic? Not enough to explore? |

#### Stage 5: Evaluation / Understanding
*Making sense of what they experienced*

| Element | Current State |
|---------|---------------|
| **Touchpoints** | Architecture docs, cost reports, comparison guides |
| **Actions** | Review costs incurred, assess complexity, discuss with team |
| **Thoughts** | "Could we do this for real?" / "What would production look like?" |
| **Emotions** | Reflective, weighing options |
| **Pain Points** | Gap between demo and production unclear? No "next steps" guidance? |

#### Stage 6: Decision / Action
*What happens next?*

| Element | Current State |
|---------|---------------|
| **Touchpoints** | Procurement info, partner recommendations, review submission |
| **Actions** | Write up findings, present to leadership, initiate procurement OR move on |
| **Thoughts** | "How do I justify this?" / "Who can help us build this properly?" |
| **Emotions** | Confident or uncertain, depending on experience |
| **Pain Points** | No clear path to production? Don't know how to find a partner? |

#### Journey Gaps Identified

Three potential experience gaps surfaced:

1. **Scenario Discovery/Matching (Stage 1→2)** - How do users navigate 27 options? Is there a "quiz" or matcher to help them find the right scenario for their needs?

2. **Built-in Debrief (Stage 4→5)** - Is there a structured way to help users make sense of what they experienced? A "what you just saw" summary or evaluation template?

3. **Warm Handoff (Stage 6)** - After the demo ends... then what? Clear path to production, partner recommendations, procurement guidance?

---

### Advanced Elicitation: Devil's Advocate (Stress-Testing Principles)

**Goal:** Challenge our three principles by arguing the opposing viewpoint to stress-test our foundation.

#### Challenge 1: "Create Smarter Customers" is Naïve

**Opposing argument:** "Informed confidence" sounds noble, but decisions are political, not rational. Most users won't engage deeply. Concluding "I need a partner" leads to shelving, not procurement.

**Defence accepted:** The real value is **levelling the playing field against incumbents**. NDX:Try reduces information asymmetry - even if decisions are political, technical teams now have evidence to push back with.

**Principle refined:** ✓ Added "levels the playing field" framing

#### Challenge 2: "Show the Real Shape" Creates Paralysis

**Opposing argument:** Being too honest about complexity scares people off. Sometimes people need to start before they fully understand what they're getting into.

**Defence:** Radical transparency is a **feature**, not a bug. BUT the key is showing shape WITH pathways forward - partners, training, patterns.

**Principle refined:** ✓ Added "always show pathways forward alongside complexity"

#### Challenge 3: "Respect the Spectrum" is Scope Creep

**Opposing argument:** Four audiences × 27 scenarios = 108 documentation paths. You'll do all four badly instead of one well. Better to let scenarios specialize.

**Defence accepted:** Be pragmatic. Some scenarios are technical-first, others service-first. Tag each scenario with primary persona rather than forcing all four on every one.

**Principle refined:** ✓ Reframed as "Pragmatic Persona Targeting" with action to evaluate all 27 scenarios for primary/secondary personas

---

### Advanced Elicitation: Pre-mortem Analysis (Failure Scenarios)

**Goal:** Imagine NDX:Try AWS Scenarios has failed in 12 months. What went wrong? Proactive risk identification.

#### Failure Scenario 1: "Nobody Showed Up"
*The scenarios were technically excellent, but nobody deployed them.*

- **Contributing factors:** Innovation Sandbox process too slow, poor discoverability, no marketing, word of mouth never reached critical mass
- **Warning signs:** Low deployment numbers in first 3 months, no organic mentions in local gov forums
- **Preventive measures:** Launch campaign with GDS/AWS, showcase at conferences, seed with friendly councils, track metrics
- **Status:** ✓ Already underway

#### Failure Scenario 2: "They Tried, They Bounced"
*People deployed but had poor experience - never came back.*

- **Contributing factors:** CloudFormation failures, fake-looking sample data, basic UI, too complex for 30-min session, no guidance on what to DO
- **Warning signs:** High deployment but low engagement time, support tickets, confused feedback
- **Preventive measures:** Rigorous deployment testing, realistic sample data, guided tour experience, clear "try this first" actions

#### Failure Scenario 3: "Dead End After Demo"
*Good demo experiences but nothing happened next.*

- **Contributing factors:** No clear path to production, partner ecosystem not engaged, procurement guidance missing, demo-to-production gap too large
- **Warning signs:** Positive feedback but zero procurement, "great demo, but..." comments, users asking "what now?"
- **Preventive measures:** Partner engagement from day one, "what's next" guidance in every scenario, procurement playbook, track conversion

#### Failure Scenario 4: "AWS/GDS Lost Interest"
*Initial enthusiasm, but project lost sponsorship and momentum.*

- **Contributing factors:** No clear owner after launch, scenarios became stale, no new scenarios added, budget disappeared, priorities shifted
- **Warning signs:** Scenarios not updated when services change, no new scenarios in 6+ months, key people moving on
- **Preventive measures:** Establish ongoing maintenance commitment, community contribution model, regular review cadence, clear success metrics

#### Failure Scenario 5: "Competitor Narrative"
*Other clouds launched better experiences, narrative shifted.*

- **Contributing factors:** Moved too slowly, didn't iterate on feedback, competitor experiences slicker
- **Warning signs:** Azure/GCP announcing similar initiatives, unfavourable comparisons
- **Preventive measures:** Move fast on launch, continuous improvement, stay aware of competitors, differentiate on UK local gov specificity
- **Note:** NDX will support AWS/Azure/GCP and others - NDX becomes the cloud-agnostic evaluation ground, making this less about competition and more about being the best "try" experience regardless of cloud

#### Pre-mortem Risk Summary

| Risk | Likelihood | Impact | Priority |
|------|------------|--------|----------|
| Poor discoverability / no awareness | High | Fatal | 🔴 Critical |
| Deployment failures / poor first experience | Medium | High | 🔴 Critical |
| Dead end after demo (no next steps) | High | High | 🔴 Critical |
| Loss of sponsorship / maintenance | Medium | High | 🟡 Important |
| Competitor leapfrog | Low | Medium | 🟢 Monitor |

---

### Advanced Elicitation: Value Chain Analysis

**Goal:** Trace activities from "user hears about NDX:Try" to "user makes informed decision" - identify where value is created and where there are gaps.

#### Primary Activities (Direct Value Creation)

| Activity | Value Created | Current State |
|----------|---------------|---------------|
| **1. Awareness** | Opens the door | Depends on GDS/AWS marketing, conferences |
| **2. Scenario Discovery** | Matches problem to solution | 27 scenarios listed, no guided matching |
| **3. Sandbox Provisioning** | Removes friction to trying | Innovation Sandbox process (external) |
| **4. Deployment** | "It just works" - builds confidence | CloudFormation templates ✓ |
| **5. Hands-On Experience** | The "aha moment" | Demo UI, sample data ✓ |
| **6. Sense-Making** | Transforms experience into insight | Architecture docs (gaps here) |
| **7. Decision Support** | Enables organisational action | Business case templates? |
| **8. Pathway Forward** | Converts interest into action | Partner/procurement guidance? |

#### Value Concentration

```
Awareness → Discovery → Provisioning → Deployment → Experience → Sense-Making → Decision → Pathway
   LOW        MED          LOW           MED          HIGH          HIGH          MED       HIGH
```

**High-value activities:** Experience, Sense-Making, Pathway Forward

**Current investment:** Deployment ✓, Experience ✓

**Underinvestment:** Discovery, Sense-Making, Pathway Forward

#### Value Chain Gaps

| Gap | Problem | Risk |
|-----|---------|------|
| **Discovery → Experience** | 27 scenarios, no guided selection | Wrong choice → poor experience |
| **Experience → Sense-Making** | Demo ends, no structured debrief | Experience without understanding |
| **Sense-Making → Pathway** | Understanding achieved, action unclear | Informed but stuck |

#### Quick Wins (Action Items)

**1. Scenario Selector Quiz**
- "Answer 5 questions, get recommended scenarios"
- Questions: What's your role? What problem are you solving? What's your technical comfort? Which service area? How much time do you have?
- Output: Top 3 recommended scenarios with rationale
- Addresses: Discovery gap

**2. Post-Demo Debrief Template**
- Standardised "What You Just Experienced" document per scenario
- Sections: What this demo showed, Key capabilities demonstrated, What production would require, Cost at scale estimates, Questions to consider
- Could be auto-generated or included in README
- Addresses: Sense-Making gap

**3. Per-Scenario "What's Next" Section**
- Consistent section in every scenario README
- Contents: How to take this to production, Skill requirements for real implementation, Recommended partners (if applicable), Procurement via NDX, Related scenarios to try
- Addresses: Pathway gap

#### Strategic Investments (Future)

- **Partner Ecosystem Integration** - Connect demo completers with implementation partners
- **Procurement Playbook** - Business case template, NDX purchasing guidance
- **Cross-Scenario Journeys** - "You tried Chatbot, you might also like Sentiment Analysis"

---

### Technique 2: SCAMPER Gap Analysis

**Goal:** Systematically examine 27 existing scenarios for gaps, improvements, and opportunities.

#### Current Scenario Inventory

| Category | Count | Examples |
|----------|-------|----------|
| AI/ML Services | 12 | Bedrock, Rekognition, Comprehend, Textract, Q Apps |
| Contact Centre | 5 | Connect, Q in Connect, WhatsApp, Callback |
| Location Services | 3 | Address Validation, Fleet Tracking, Care Routing |
| Analytics/BI | 3 | QuickSight, Kinesis Dashboard, Entity Resolution |
| End User Computing | 2 | WorkSpaces, AppStream |
| Other | 2 | Translate, Polly, Cognito/WAF |

#### S - Substitute (New Scenarios)

**Gap identified:** IoT not represented - easy to demo, highly visual, fake data simple

**New scenarios to add:**

**1. [Demo] Smart Car Park Occupancy**
| Element | Details |
|---------|---------|
| Overview | Real-time parking monitoring. Dashboard shows availability, historical patterns, signage integration |
| Primary Persona | Service Manager (Parking/Transport), CTO |
| AWS Services | IoT Core, DynamoDB, Lambda, QuickSight, SNS, Location Service |
| Sample Data | 5 car parks × 50-200 spaces, 7 days of entry/exit events with realistic peaks |
| Cost Estimate | ~$4/24hr |

**2. [Demo] Smart Street Lighting Management**
| Element | Details |
|---------|---------|
| Overview | IoT-connected street lights reporting faults, energy usage, dimming schedules. Borough-wide dashboard |
| Primary Persona | Service Manager (Highways), CTO, Finance |
| AWS Services | IoT Core, IoT Device Shadow, Lambda, DynamoDB, QuickSight, SNS, Timestream |
| Sample Data | 500 virtual lamp posts, 10 streets, fault simulation, energy readings, day/night cycles |
| Cost Estimate | ~$5/24hr |

#### C - Combine (Scenario Journeys)

**Priority Journey: Citizen Communication Suite**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Text-to-    │     │  2. Multilingual │     │  3. Sentiment   │
│     Speech      │ ──► │    Translation   │ ──► │    Analysis     │
│  (Accessibility)│     │   (Reach)        │     │  (Understanding)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
      Polly                  Translate             Comprehend

"Make it heard"      "Make it understood"    "Know how it landed"
```

**Combined Story:** A council tax reminder goes out. Polly creates audio for visually impaired residents. Translate converts to Polish, Urdu, Bengali. Comprehend analyses response sentiment. You've built an accessible, inclusive, measurable communications pipeline.

**Other journey candidates:**
- AI Document Processing Suite (FOI → PII → Benefits → Planning)
- Contact Centre Transformation (Chatbot → Connect → Q in Connect → WhatsApp)
- Location Intelligence Pack (Address Validation → Fleet → Routing → Car Park)

#### M - Modify (Enhancements to All Scenarios)

**1. Complexity Ratings**
- ⭐ Simple (deploy and explore)
- ⭐⭐ Moderate (some config needed)
- ⭐⭐⭐ Advanced (integration knowledge helpful)

**2. "Time to Wow" Indicator**
- "5 minutes to first insight"
- "15 minutes to see it working"
- "30 minutes for full exploration"

**3. Realistic Sample Data**
- Real UK postcode patterns
- Believable fictional council names
- Seasonal patterns (fly-tipping peaks spring, heating complaints winter)
- Differentiator: "feels like our data"

#### P - Put to Other Uses

Call out multiple use cases per scenario:

| Scenario | Primary Use | Other Uses |
|----------|-------------|------------|
| Bedrock Knowledge Bases | Staff policy Q&A | Councillor briefings, resident self-service, training |
| Sentiment Analysis | Feedback categorisation | Social media monitoring, staff surveys, complaint early warning |
| Location Services | Fleet tracking | Electoral boundaries, deprivation mapping, planning impact radius |

#### E - Eliminate (Barrier Removal)

**1. Max Cost Guarantee**
- "This demo CANNOT cost more than £X"
- Auto-shutdown after 24/48 hours

**2. Quick Demo vs Deep Dive Modes**
- Quick: 10-minute guided tour, see highlights
- Deep: Full exploration, bring your own data

**3. "This is just a toy" perception**
- Production Pathway section in each scenario
- Real council case study links where available
- Partner recommendations for scaling

#### R - Reverse/Rearrange

**1. Pre-deployed "Instant Demo" Option**
- Click a link, see it working immediately
- No CloudFormation wait
- Offer both: "Watch it" vs "Build it" modes

**2. Readiness Assessment Scenario**
- Answer questions about current state
- Get recommendations on which scenarios match maturity
- "You're ready for X, need Y before attempting Z"

**3. Persona Playlists**
- "CTO Strategic Overview" - 3 scenarios showing breadth
- "Service Manager Quick Wins" - highest ROI, lowest complexity
- "Developer Deep Dive" - most technical, code-heavy

#### SCAMPER Summary

| Letter | Key Output |
|--------|------------|
| **S** | +2 IoT scenarios (Car Park, Street Lighting) |
| **C** | Citizen Communication Suite journey |
| **A** | (Skipped) |
| **M** | Complexity ratings, Time to Wow, realistic data |
| **P** | Multiple use cases per scenario |
| **E** | Max cost guarantee, Quick/Deep modes |
| **R** | Instant demo option, Readiness Assessment, Persona playlists |

---

### Technique 3: Six Thinking Hats - Prioritization

**Goal:** Examine all generated ideas through six lenses to determine launch priorities.

#### 🎩 White Hat (Facts)
- 27 scenarios defined with consistent structure
- 6 subtasks per scenario (Infrastructure, Sample Data, Frontend, Docs, Testing, Cost Monitoring)
- Innovation Sandbox is deployment target
- AWS suite focus (Azure/GCP will be separate)
- No scenarios built yet (greenfield)

#### 🎩 Red Hat (Emotions/Gut Feel)
**High energy:** Scenario Selector Quiz, Citizen Comms Suite, "What's Next" sections, IoT scenarios
**Lower energy:** Readiness Assessment, Pre-deployed Instant Demo (phase 2)

#### 🎩 Black Hat (Caution/Risks)
| Risk | Mitigation |
|------|------------|
| Scenario Selector over-engineered | Start with simple decision tree |
| IoT simulation complexity | Fake sensors convincingly |
| "What's Next" becomes stale | Keep generic initially, update process |
| Max cost guarantee accuracy | Conservative estimates, clear disclaimers |

#### 🎩 Yellow Hat (Benefits/Optimism)
- Scenario Selector solves "27 options paralysis" immediately
- "What's Next" converts demos into action - the whole point
- Persona Tags: low effort, high clarity
- IoT opens new service category with visual wow factor
- Citizen Comms Suite: strong story, accessibility = legal requirement

#### 🎩 Green Hat (Creativity)
**"Starter Pack" concept:** Don't launch all 27+2 at once. Launch curated 5-7 scenarios covering different personas, complexity levels, service areas. Creates focus, allows polish, builds momentum.

#### 🎩 Blue Hat (Process/Decision)

**Prioritization criteria applied:**
- Addresses journey gap identified? (High weight)
- Low effort to implement? (Medium weight)
- High impact on user experience? (High weight)
- Required for launch vs nice-to-have? (High weight)

---

## Idea Categorization

### Immediate Opportunities

_Ideas ready to implement now - Must-have for launch_

1. **Per-Scenario "What's Next" Section** - Template for all scenarios closing dead-end gap
2. **Primary/Secondary Persona Tags** - Tag all 27 scenarios to enable targeting
3. **Complexity Ratings + Time to Wow** - ⭐⭐⭐ ratings and time indicators for all
4. **Scenario Selector v1** - Simple decision tree/quiz for discovery

### Future Innovations

_Ideas requiring development/research - Fast-follow_

1. **Citizen Communication Suite Journey** - Polly → Translate → Comprehend with combined story
2. **Smart Car Park IoT Scenario** - New category, high visual impact
3. **Smart Street Lighting IoT Scenario** - Complements car park, different use case
4. **Post-Demo Debrief Template** - Structured sense-making document

### Moonshots

_Ambitious, transformative concepts - Phase 2_

1. **Quick Demo vs Deep Dive Modes** - Two paths per scenario
2. **Persona Playlists** - Curated paths for CTO, Service Manager, Developer
3. **Readiness Assessment** - Maturity-based recommendations
4. **Pre-deployed Instant Demo** - Zero-wait "Watch it" option

### Insights and Learnings

_Key realizations from the session_

1. **Goal is informed confidence, not adoption** - Smarter customers who can evaluate, compare, and decide
2. **AI introduces new anxiety dimensions** - Cost unpredictability, "AI going wrong" risk, governance questions affect all personas
3. **Transparency with pathways** - Show real complexity BUT always with routes forward (partners, training, patterns)
4. **Pragmatic persona targeting** - Not all scenarios for all people; tag primary/secondary and document accordingly
5. **Three journey gaps exist** - Discovery (no matcher), Sense-Making (no debrief), Pathway (no next steps)
6. **NDX as cloud-agnostic evaluation ground** - AWS scenarios first, Azure/GCP to follow separately

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: Scenario Metadata Framework

- Rationale: Enables everything else - persona tags, complexity ratings, time-to-wow, "What's Next" sections
- Next steps: Create template, apply to all 27 existing scenarios, include in new scenario template
- Resources needed: Documentation effort, review with stakeholders
- Priority: Must-have for launch

#### #2 Priority: Starter Pack Curation

- Rationale: Focus beats breadth; polish 6 scenarios rather than spread thin across 29
- Next steps: Finalize Starter Pack list, prioritize these 6 for build-out
- Resources needed: Decision on final 6, concentrated development effort
- Priority: Must-have for launch

**Proposed Starter Pack:**
1. Council Chatbot with Bedrock (Service Manager entry, high wow)
2. FOI Redaction (common pain point, clear ROI)
3. Text-to-Speech Accessibility (simplest, legal requirement angle)
4. QuickSight Dashboard (Finance/CTO entry point)
5. Smart Car Park IoT (new category, visual)
6. Address Validation (Developer entry, quick win)

#### #3 Priority: Scenario Selector v1

- Rationale: Solves discovery gap, front door to the experience
- Next steps: Design 5-question flow, map to scenario recommendations, build simple UI or decision tree
- Resources needed: UX input, logic mapping
- Priority: Must-have for launch

## Reflection and Follow-up

### What Worked Well

- **First Principles grounding** - Establishing "informed confidence" as the goal shaped all subsequent decisions
- **Empathy mapping** - Four personas with AI-specific anxieties provided actionable targeting guidance
- **Journey mapping** - Revealed three clear gaps (discovery, sense-making, pathway) that became priorities
- **Devil's Advocate** - Stress-testing principles led to practical refinements (pragmatic persona targeting)
- **Pre-mortem** - Surfaced risks early with concrete mitigations
- **SCAMPER** - Systematic gap analysis produced new scenarios (IoT) and the journey concept

### Areas for Further Exploration

1. **Partner ecosystem engagement** - How to connect demo completers with implementation partners
2. **Procurement playbook** - Business case template, NDX purchasing guidance
3. **Success metrics** - How to measure whether scenarios are achieving "informed confidence"
4. **Feedback loop design** - How to capture and act on user experiences
5. **Maintenance model** - Ongoing updates as AWS services evolve

### Recommended Follow-up Techniques

- **Stakeholder Mapping** - Identify who needs to approve/support the Starter Pack decisions
- **Service Blueprint** - Design the full "Try" experience across touchpoints
- **Decision Matrix** - If Starter Pack selection needs more rigorous comparison

### Questions That Emerged

1. How will users discover NDX:Try scenarios? (Marketing/awareness strategy)
2. What's the Innovation Sandbox account provisioning timeline? (External dependency)
3. Should there be a "community" aspect - councils sharing experiences?
4. How do we handle scenarios becoming outdated when AWS releases new features?
5. What's the success metric - deployments? Time spent? Procurement initiated?

### Next Session Planning

- **Suggested topics:** Starter Pack scenario deep-dives, Scenario Selector quiz design, "What's Next" template creation
- **Recommended timeframe:** After initial PRD/Architecture work
- **Preparation needed:** Confirm Starter Pack selection, gather any existing scenario documentation

---

## Session Summary

**Total Ideas Generated:** 29 (2 new scenarios, 13 features/improvements, 14 enhancements)

**Techniques Used:** First Principles, Empathy Mapping, Journey Mapping, Devil's Advocate, Pre-mortem Analysis, Value Chain Analysis, SCAMPER, Six Thinking Hats

**Key Outcomes:**
1. Three core principles refined (informed confidence, transparency with pathways, pragmatic persona targeting)
2. Four personas mapped with AI-specific anxieties identified
3. Three journey gaps identified with quick-win solutions
4. Five failure scenarios with mitigations documented
5. Two new IoT scenarios proposed
6. Starter Pack of 6 priority scenarios selected
7. Clear launch priorities: Metadata Framework, Starter Pack, Scenario Selector

---

_Session facilitated using the BMAD CIS brainstorming framework_
