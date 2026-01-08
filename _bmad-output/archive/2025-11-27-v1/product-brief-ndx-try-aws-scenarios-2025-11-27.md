# Product Brief: NDX:Try AWS Scenarios

**Date:** 2025-11-27
**Author:** cns
**Project Type:** Greenfield infrastructure project
**Status:** Ready for PRD Phase

---

## Executive Summary

NDX:Try AWS Scenarios is a "try before you buy" platform enabling UK local government to experience AWS cloud services through pre-built, deployable demo scenarios within Innovation Sandbox accounts. The project addresses a critical adoption gap: 95% of councils are exploring AI and 53% use hybrid cloud, yet 90% have never used G-Cloud despite 12 years of availability. This reveals that the barrier isn't lack of interest—it's lack of confidence to evaluate and act.

The goal is not adoption. The goal is **informed confidence that levels the playing field**—making it harder for councils to dismiss alternatives without genuine evaluation, and making it easier for technical teams to build evidence-based cases for modernisation.

---

## Core Vision

### Problem Statement

UK local government faces a perfect storm blocking cloud and AI adoption:

1. **Information Asymmetry** - Councils can't effectively evaluate AWS services without deploying them, but deployment requires commitment they're unwilling to make without evaluation
2. **Risk Aversion Culture** - 86% face budget crises; failed IT projects haunt institutional memory; multiple approval layers create paralysis
3. **Skills Gap** - 49% lack adequate technical staff; only 24% have training programmes; no internal AI expertise
4. **Incumbent Lock-in** - Microsoft dominates through existing relationships (Office 365, Azure AD); "nobody got fired for buying Microsoft"
5. **Procurement Friction** - G-Cloud exists but 90% have never used it; the process feels too risky for untested services

The result: councils remain stuck with legacy systems, miss AI opportunities, and can't build the evidence needed to justify modernisation to committees and leadership.

### Problem Impact

- **£3.57 billion collective council budget shortfall** makes every technology decision high-stakes
- **Cloud spending has plateaued** (0% growth 2021-2024)—councils have "harvested low-hanging fruit" and stopped
- **856% growth in AI contracts** (32 in 2018 → 306 in 2024) shows demand, but 50% remain at early stages
- **57% of councils have NO IoT deployment** despite proven ROI examples (Sandwell street lighting: 7-year payback)
- Technical teams lack evidence to push back against political decisions favouring incumbents

### Why Existing Solutions Fall Short

| What Exists | Why It's Not Enough |
|-------------|---------------------|
| **AWS Quick Starts** | Individual templates requiring CloudFormation expertise; US federal-focused; no UK local gov context |
| **AWS Solutions Library** | Reference architectures, not deployable experiences; requires significant assembly |
| **Azure POC Programs** | Manual sandbox setup; Microsoft-centric; no standardised evaluation path |
| **Consultancy-led POCs** | Expensive, custom, slow; creates dependency rather than capability |
| **G-Cloud Listings** | Service descriptions only—no way to experience before committing |
| **Innovation Sandbox (raw)** | Production-ready platform but empty; requires scenarios to be valuable |

**The gap:** AWS has the platform (Innovation Sandbox) and the services. Councils have the need. What's missing is the **bridge**—pre-built, UK-specific, immediately-demonstrable scenarios that let councils experience AWS value with zero commitment.

### Proposed Solution

NDX:Try AWS Scenarios provides:

1. **Curated Demo Scenarios** - Pre-built CloudFormation stacks covering AI/ML, IoT, analytics, and contact centre use cases relevant to UK local government
2. **One-Click Deployment** - Deploy to Innovation Sandbox accounts without CloudFormation expertise
3. **Realistic UK Context** - London region deployment, synthetic council data, GDS Design System patterns
4. **Guided Experience** - Clear "try this first" actions, time-to-wow indicators, complexity ratings
5. **Complete Journey** - From discovery (scenario selector) through experience to decision (what's next guidance, partner recommendations)
6. **Cost Transparency** - Upfront estimates, maximum cost guarantees, automated cleanup

**Starter Pack Launch (Validated by Decision Matrix):** 6 polished scenarios selected through weighted criteria analysis:

| Rank | Scenario | Score | Primary Persona | Key Strength |
|------|----------|-------|-----------------|--------------|
| 1 | **Council Chatbot (Bedrock)** | 4.25 | Service Manager | AI flagship, 83% council interest, maximum wow |
| 2 | **Planning Application AI** | 3.95 | Service Manager | Research-validated priority, document AI |
| 3 | **FOI Redaction** | 3.85 | Legal/Governance | Legal mandate driver, clear ROI |
| 4 | **Smart Car Park IoT** | 3.65 | Service Manager | New category, visual impact, Watford proof |
| 5 | **Text-to-Speech** | 3.60 | Service Manager | Accessibility mandate, simplest deployment |
| 6 | **QuickSight Dashboard** | 3.45 | Finance/CTO | Universal need, data-driven decisions |

**Selection Criteria Applied:**
- Persona Coverage (15%) - Entry points for all key stakeholders
- Wow Factor (20%) - First impressions drive word-of-mouth
- Legal/Mandate Driver (15%) - "Must do" beats "nice to have"
- Market Validation (20%) - Research-backed council demand
- Technical Simplicity (10%) - Capacity-constrained council reality
- Differentiation (10%) - AWS advantages over Azure/GCP
- AI Focus (10%) - Aligns with growing AI budgets

**Fast-Follow Priority (Phase 2):**
1. Address Validation (Developer entry point)
2. Smart Street Lighting IoT
3. Amazon Connect Contact Centre
4. Sentiment Analysis

### Key Differentiators

| NDX:Try | vs. Alternatives |
|---------|------------------|
| **UK-specific scenarios** | AWS templates are US federal-focused |
| **Integrated multi-service demos** | Quick Starts are single-service |
| **Realistic synthetic government data** | Generic or no sample data |
| **One-click deployment** | Requires CloudFormation expertise |
| **Automated cleanup** | Manual teardown |
| **Cost estimation upfront** | Discover costs after deployment |
| **Guided evaluation journey** | Deploy and figure it out yourself |
| **"What's Next" pathways** | Dead end after demo |

### Stakeholder Ecosystem

NDX:Try operates within a stakeholder ecosystem requiring coordinated engagement:

**Strategic Partners:**
- **AWS** - Platform provider + co-marketing; Innovation Sandbox integration; technical SA support
- **GDS Local** - Policy alignment + pilot council identification; launched Nov 2025 with fresh mandate
- **LGA AI Hub** - Community reach (300+ council members) + case study distribution

**Primary Users:**
- **Council CTOs/Heads of IT** - Need evidence for committees; seek risk reduction and peer validation
- **Service Managers** - Need problem-solution fit in plain English; "what does this do for my residents?"
- **Developers** - Need technical credibility; clean code, good docs, extensibility

**Enablers:**
- **Finance/Procurement** - Require cost caps, G-Cloud compliance, TCO transparency
- **Implementation Partners** - Convert demos to production; warm handoff process
- **Crown Commercial Service** - G-Cloud framework alignment

**Stakeholder Engagement Priority:**

| Tier | Stakeholders | Approach |
|------|--------------|----------|
| **Strategic** | AWS, GDS Local, LGA AI Hub | Co-create success; joint development; mutual promotion |
| **Champions** | CTOs, Service Managers, Developers | Enable their success; evidence provision; technical credibility |
| **Enablers** | Finance, Partners, CCS | Remove friction; compliance; ecosystem building |

**Critical Success Factor:** The real product isn't demos—it's evidence CTOs can take to committees. "We evaluated AWS objectively" is the deliverable that unlocks procurement.

### Value Chain & Journey Gaps

**Where NDX:Try Creates Unique Value:**

Analysis of the end-to-end evaluation journey reveals that while deployment and hands-on experience are necessary, the highest-value activities are often underserved:

| Journey Stage | Traditional Gap | NDX:Try Solution |
|---------------|-----------------|------------------|
| **Discovery** | 27 options, no guidance | Scenario Selector matching problem to solution |
| **Sense-Making** | "Cool demo, now what?" | Structured "What You Experienced" debrief per scenario |
| **Decision Support** | No committee-ready evidence | Evidence Pack template with ROI, risk, comparison data |
| **Pathway Forward** | Dead end after demo | Partner recommendations + G-Cloud procurement guidance |

**Value Chain Insight:**

```
Activity:    Awareness → Discovery → Provisioning → Deployment → Experience → Sense-Making → Decision → Pathway
Value:         LOW        MEDIUM       LOW          MEDIUM        HIGH          HIGH         MEDIUM     HIGH
Gap Status:  (external)   (FIX)      (AWS owns)    (✓ built)    (✓ built)      (FIX)        (FIX)     (FIX)
```

**Strategic Differentiation:** The demo itself is table stakes. NDX:Try's unique value is completing the journey from experience to informed organisational decision—the "last mile" that AWS, Azure, and consultancies don't solve at scale.

### Assumptions & Risks

**Key Assumptions (Validated through Devil's Advocate analysis):**

1. **"Informed confidence" creates action** - Evidence helps technical teams influence political decisions. Success includes "informed rejection" as a valid outcome—ending paralysis is the goal, not forcing adoption.

2. **6 scenarios is sufficient for launch** - Starter Pack covers multiple personas and service areas. Full roadmap of 27+ scenarios visible from day one; Phase 2 prioritised by actual demand feedback.

3. **Councils will deploy** - Mitigated by zero-deployment paths (videos, hosted demos, LGA group sessions) for capacity-constrained councils. Don't assume councils have spare staff hours.

4. **AWS partnership is desirable but not critical** - Build direct council relationships that create independent value. Move fast to establish presence. Stay complementary to AWS, not competitive.

5. **Target segment is "cloud-curious"** - Councils who haven't started evaluating cloud/AI, not councils stuck mid-migration. The 90% who never used G-Cloud represents the addressable market.

**Primary Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low deployment due to council capacity constraints | High | High | Zero-deployment evaluation paths; partner-assisted tours; LGA group sessions |
| Starter Pack scenarios miss actual demand | Medium | Medium | Visible roadmap; feedback mechanism; demand-driven Phase 2 prioritisation |
| AWS indifference or decides to compete | Medium | High | Direct council relationships; move fast; stay complementary not competitive |
| "Informed confidence" doesn't convert to procurement | Medium | High | Committee-ready evidence packs; track conversion metrics explicitly |
| Councils already exhausted by cloud pitches | Medium | Medium | Lead with AI (genuinely new); target cloud-curious not cloud-stuck |

**Success Metrics Must Include:**
- % of evaluators who produce committee-ready documentation
- % who take *any* action (procure, formally reject with rationale, or request deeper evaluation)
- "Informed rejection" counted as success, not failure

### External Environment (PESTLE)

**External factors shaping NDX:Try's opportunity:**

| Factor | Key Insight | Strategic Response |
|--------|-------------|-------------------|
| **Political** | GDS Local launched Nov 2025 with council transformation mandate | Partner early; first-mover advantage with fresh government unit |
| **Economic** | £3.57B budget shortfall BUT 856% AI contract growth | Lead with AI (growing budget); emphasise zero-risk evaluation |
| **Social** | 49% skills gap + strong peer influence | Zero-deployment paths; case studies become force multiplier through LGA |
| **Technological** | Innovation Sandbox ready; 83% exploring gen AI | Platform exists; content is the gap we fill; gen AI is fresh appetite |
| **Legal** | Accessibility and FOI are legal mandates | Text-to-Speech and FOI Redaction scenarios address legal requirements, not optional features |
| **Environmental** | Net zero commitments + climate confusion | Include carbon impact estimates; position cloud as sustainability enabler |

**Detailed PESTLE Assessment:**

| Factor | Tailwinds | Headwinds |
|--------|-----------|-----------|
| **Political** | GDS Local, Cloud First policy, efficiency pressure | Central-local tensions, election cycle uncertainty |
| **Economic** | AI budget growth, G-Cloud framework, shared services trend | Budget crisis, cloud spending plateau, ROI scrutiny |
| **Social** | Peer influence, rising resident expectations | Skills gap, risk aversion, AI anxiety, digital divide |
| **Technological** | Innovation Sandbox ready, gen AI appetite, IoT growth | Legacy systems, Microsoft incumbency, CloudFormation expertise |
| **Legal** | Accessibility mandates, FOI requirements create demand | GDPR complexity, procurement regulations |
| **Environmental** | Net zero pressure, smart city sustainability | Climate confusion (opportunity to educate) |

**Timing Assessment:** External environment is unusually favourable. GDS Local's fresh mandate, AI budget growth amid general austerity, and ready platform infrastructure create a window of opportunity. Key constraint remains council capacity (skills gap, risk aversion)—which NDX:Try directly addresses through zero-commitment, low-friction evaluation.

---

## Target Users

### Primary Users

Four distinct personas, each with different needs and entry points:

#### 1. CTO / Head of IT
| Dimension | Profile |
|-----------|---------|
| **Thinks** | "Is this secure enough? How does it fit our roadmap? Are we falling behind on AI?" |
| **Fears** | Vendor lock-in, budget overruns, past failed IT projects, AI governance risks |
| **Needs** | Architecture diagrams, security posture, cost models, exit strategies, peer validation |
| **Entry Scenarios** | Council Chatbot (architecture), QuickSight (data strategy), Car Park IoT (infrastructure) |

#### 2. Service Manager (Waste, Housing, Planning, etc.)
| Dimension | Profile |
|-----------|---------|
| **Thinks** | "Will this actually help my residents? My team is already stretched." |
| **Fears** | Looking foolish if tech fails publicly, AI getting it wrong, no time to become expert |
| **Needs** | Plain English benefits, realistic scenarios, peer council examples, "what does this do for me?" |
| **Entry Scenarios** | Council Chatbot, Planning Application AI, FOI Redaction, Text-to-Speech, Car Park IoT |

#### 3. Developer / Technical Lead
| Dimension | Profile |
|-----------|---------|
| **Thinks** | "Show me the code. Is this production-ready or just a demo? Can I extend it?" |
| **Fears** | Technical debt, stakeholders who don't understand constraints, AI skills gap |
| **Needs** | Clean code, good documentation, extensibility, "what's under the hood?" access |
| **Entry Scenarios** | Council Chatbot (code access), Car Park IoT (infrastructure code), Address Validation (Phase 2) |

#### 4. Finance / Procurement Lead
| Dimension | Profile |
|-----------|---------|
| **Thinks** | "What's the TCO? What are the hidden costs? How do I budget for unpredictable AI usage?" |
| **Fears** | Unpredictable cloud bills, audit scrutiny, procurement compliance, AI costs spiraling |
| **Needs** | Cost caps, worst-case estimates, G-Cloud compliance, clear value-for-money story |
| **Entry Scenarios** | QuickSight Dashboard, FOI Redaction (ROI story) |

### The Universal AI Anxiety

Across all four personas, a common thread emerges:

> **AI introduces new uncertainty dimensions that cloud alone didn't have:**
> - Unpredictable token/inference costs
> - "AI going wrong" reputational risk
> - Governance/ethics questions without clear answers
> - Data handling concerns (where does council data go?)
> - Skills gap affecting everyone, not just technical staff

**Every AI scenario must explicitly address:** cost caps, "what happens when AI is wrong" guidance, data flow diagrams, and governance checklists for responsible AI.

### Pragmatic Persona Targeting

Not every scenario for every persona. Each scenario is tagged with primary and secondary audiences:

| Scenario | Primary Persona | Secondary |
|----------|-----------------|-----------|
| Council Chatbot (Bedrock) | Service Manager | CTO, Developer |
| Planning Application AI | Service Manager | CTO |
| FOI Redaction | Legal/Governance | Service Manager, Finance |
| Smart Car Park IoT | Service Manager | CTO, Developer |
| Text-to-Speech | Service Manager | Accessibility Lead |
| QuickSight Dashboard | Finance/CTO | Service Manager |

### User Journey Design

**Journey-Driven Design Principles:**

Each persona follows the same stages but with different needs:

```
AWARE → DISCOVER → DEPLOY → EXPERIENCE → EVALUATE → DECIDE
```

| Persona | Journey Focus | Key Deliverable |
|---------|---------------|-----------------|
| **CTO** | Building internal advocacy case | Committee-ready evidence pack |
| **Service Manager** | Imagining resident impact | "What this means for your service" story |
| **Developer** | Technical credibility assessment | Clean, extensible, well-documented code |
| **Finance** | Defensible cost decision | Audit-ready TCO with worst-case scenarios |

**Critical Journey Gaps Addressed:**

| Gap | Stage | Solution |
|-----|-------|----------|
| **Discovery Gap** | DISCOVER | Scenario Selector quiz matches problem to scenario |
| **Deployment Gap** | DEPLOY | Zero-deployment paths (videos, hosted demos) for non-technical users |
| **Evaluation Gap** | EVALUATE | "What You Experienced" structured debrief per scenario |
| **Decision Gap** | DECIDE | Committee Evidence Pack template + partner warm handoff |

**Journey-Based Feature Priorities:**

| Feature | Stage | Priority |
|---------|-------|----------|
| Scenario Selector Quiz | DISCOVER | Must-have |
| Zero-Deployment Demo Videos | DEPLOY | Must-have |
| Cost Transparency Dashboard | EXPERIENCE | Must-have |
| "What You Experienced" Summary | EVALUATE | Must-have |
| Committee Evidence Pack | EVALUATE → DECIDE | Must-have |
| Partner Warm Handoff | DECIDE | Should-have |
| Peer Council Case Studies | EVALUATE | Should-have |
| Production Pathway Guide | EXPERIENCE → EVALUATE | Should-have |

**Design Principle:** Not all personas deploy. Service Managers and Finance leads may never touch CloudFormation—but they still need to complete their journey through alternative paths (videos, reports, partner tours).

### Empathy-Driven Design Requirements

**Core Emotional Needs (All Personas):**

| Need | Design Response |
|------|-----------------|
| **Fear of public failure** | "What happens when AI is wrong" guidance; human oversight emphasis |
| **Time poverty** | Genuine "15 minutes to first insight" experience; no lengthy setup |
| **Trust deficit** | Peer council case studies; LGA validation; transparent limitations |
| **AI anxiety** | Cost caps visible upfront; data flow diagrams; governance checklists |
| **Loneliness** | Connection to peer community; LGA AI Hub integration |

**Persona-Specific Emotional Design:**

| Persona | Primary Emotional Need | Design Response |
|---------|------------------------|-----------------|
| **CTO** | "Cover my decision" | Committee-ready evidence; risk quantification; exit strategy |
| **Service Manager** | "Help my residents, don't add work" | Plain English; realistic demos; "what this means for your service" |
| **Developer** | "Don't embarrass me technically" | Clean code; honest limitations; extensibility documentation |
| **Finance** | "Defend to auditors" | Worst-case costs; G-Cloud compliance; audit-ready documentation |

**Key Emotional Insight:**

> Everyone fears public failure. No one has time. Trust is earned through peers, not vendors. AI anxiety is universal.

**Design Principle:** NDX:Try is not selling technology—it's selling confidence, safety, and defensible decisions. Every feature should reduce fear, not just demonstrate capability.

### Service Architecture Requirements

**Service Blueprint Insights:**

NDX:Try operates across three layers requiring distinct capabilities:

| Layer | Key Components | Build vs. Depend |
|-------|----------------|------------------|
| **Frontstage** | Website, Scenario Selector, Demo UIs, Evidence Packs | Build |
| **Backstage** | Templates, Sample Data, Documentation, Analytics | Build |
| **Support** | Innovation Sandbox, AWS Services, Partners, LGA/GDS | Depend |

**Critical External Dependencies:**

| Dependency | Owner | Risk | Mitigation |
|------------|-------|------|------------|
| Innovation Sandbox provisioning | AWS | Friction out of our control | Zero-deployment paths; "while you wait" content |
| Partner ecosystem | Partners | Must be built from scratch | Early partner engagement; start with 2-3 vetted partners |
| LGA/GDS relationships | LGA/GDS | Force multipliers not yet established | Priority outreach; align messaging to their goals |

**Backstage Investment Required:**

| Component | Purpose | Priority |
|-----------|---------|----------|
| Sample Data Pipeline | Realistic UK council data generation | Must-have |
| Template CI/CD | Automated testing, deployment validation | Must-have |
| Evidence Pack Generator | Auto-generate committee materials | Must-have |
| Analytics System | Track journey completion, drop-offs, outcomes | Should-have |
| Partner CRM | Match councils to implementation partners | Should-have |
| Feedback Pipeline | Capture and analyse user feedback | Should-have |

**Zero-Deployment Path (Critical):**

For Service Managers and Finance leads who won't deploy CloudFormation:

| Alternative | Description | Effort |
|-------------|-------------|--------|
| Demo videos | 5-10 minute walkthrough per scenario | Medium |
| Hosted demos | Shared environment, no deployment needed | High |
| Partner tours | 30-min guided evaluation with partner | Low (partner delivers) |
| Screenshot walkthroughs | Annotated visual guides | Low |

This ensures all personas can complete their journey regardless of technical capability.

### Root Cause Validation

**Why NDX:Try Works: Five Whys Analysis**

Drilling into "why councils don't adopt cloud" reveals five root causes—all addressable by NDX:Try:

| Root Cause | Manifests As | NDX:Try Solution |
|------------|--------------|------------------|
| **Information asymmetry** | Can't evaluate without risky commitment | Low-commitment demo scenarios + zero cost |
| **Evidence-to-decision gap** | CTOs can't build committee recommendation | Committee Evidence Pack template |
| **Solutions designed for IT, not users** | Service Managers distrust IT promises | Service Manager-focused scenarios, plain English |
| **AI transparency gap** | Unknown risks block AI adoption | "What happens when AI is wrong" guidance |
| **G-Cloud is procurement, not evaluation** | 90% never explore possibilities | Bridge: scenarios → evidence → G-Cloud procurement |

**Strategic Implication:**

NDX:Try isn't competing with AWS or Azure. It's filling a structural gap in the evaluation-to-procurement journey. Councils that use NDX:Try will *increase* cloud spending (either AWS or competitive), because we're solving the "how do we evaluate fairly?" problem, not the "which cloud?" problem.

**Key Validation Points:**

- ✓ Information asymmetry: Scenarios directly address by providing hands-on evaluation
- ✓ Evidence gap: Evidence Pack templates translate demo results into committee language
- ✓ User-centred design: Scenarios are built for Service Managers and Finance, not just IT
- ✓ AI anxiety: Every AI scenario includes failure guidance and governance checklists
- ✓ Journey completion: "What's Next" pathways connect evaluation to G-Cloud procurement

### Competitive Position & Strategic Risks

**SWOT Analysis: NDX:Try's Position**

**Strengths:** Real market gap (90% councils stuck evaluating cloud), strong validation (856% AI growth), aligned with policy (Cloud First, GDS Local), peer-driven distribution (LGA AI Hub).

**Weaknesses:** Dependent on AWS goodwill, must build partner ecosystem from zero, team capacity unproven, "informed confidence" hypothesis unvalidated.

**Opportunities:** GDS Local's fresh mandate (Nov 2025), AI budget growth amid cloud plateau, LGA network reach (300+ members), Innovation Sandbox maturity.

**Threats:** AWS competition or indifference, Microsoft incumbency, council procurement inertia, consultant FUD.

**Competitive Position vs. Alternatives:**

| vs. Alternative | Our Advantage | Their Advantage |
|-----------------|---------------|-----------------|
| **Azure POC Programs** | Speed, friction-free, peer-driven, impartial | Vendor relationship (existing) |
| **Consultant POC** | Cost, scalability, objectivity, time-to-insight | Custom solutions, production delivery |
| **Do Nothing (Status Quo)** | Forces decision, raises awareness | No new risk, no effort required |

**Strategic Risks & Mitigations:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| AWS indifference or competition | Medium | High | Build direct council relationships; keep portable |
| Partner ecosystem doesn't materialize | Medium | High | Early outreach to 2-3 anchoring partners; concurrent recruitment |
| Council procurement inertia | High | Medium | Focus on "informed decision" not "forced adoption"; celebrate informed rejection |
| Team capacity insufficient | Medium | High | Phase scenarios; use templates; prioritise highest-value first |
| "Informed confidence" doesn't convert | Medium | Medium | Track metrics rigorously; iterate messaging if hypothesis fails |

**Winning Strategy:**

1. **Partner with GDS Local immediately** (legitimacy + reach through fresh government unit)
2. **Build 2-3 case studies with early councils** (peer validation to drive next 10+ councils)
3. **Recruit implementation partners concurrent with launch** (complete evaluation-to-production journey)
4. **Position as cloud-agnostic evaluation platform** (not AWS vendor lock-in)
5. **Move fast to establish presence** (before Azure/competitors respond to market gap)

---

## Success Metrics

### Primary Success Metric: Informed Decision Rate

**What It Measures:** % of councils completing evaluation who make a measurable decision (proceed, reject, or request deeper eval).

**Why It Matters:** "Informed confidence" is only valuable if it leads to action. The goal isn't adoption—it's ending paralysis.

| Outcome | Counted As | Target |
|---------|-----------|--------|
| Procure AWS service (direct) | Success | 20-30% |
| Procure via G-Cloud | Success | 10-15% |
| Formally reject (with rationale) | Success | 20-25% |
| Request deeper evaluation | Success | 15-20% |
| No decision / stuck | Failure | <15% |

**Sample:** Of 100 councils completing a full scenario evaluation, 65-80 should take measurable action. Rest remain stuck = area for improvement.

### Secondary Success Metrics

#### Engagement & Reach

| Metric | Success Target | Frequency |
|--------|----------------|-----------|
| Scenarios deployed (per month) | 50+ | Monthly |
| Unique councils accessing | 100+ in Year 1 | Quarterly |
| LGA AI Hub referrals | 30+ councils | Quarterly |
| Case studies published | 3+ councils by end Year 1 | Quarterly |
| Partner leads generated | 20+ qualified leads | Monthly |

#### Quality & Experience

| Metric | Success Target | Method |
|--------|----------------|--------|
| **Deployment success rate** | 95%+ first-time deployment | CloudFormation logs |
| **Time to first insight** | 15 mins average | Session analytics |
| **User satisfaction** | 4.0+/5.0 average | Post-scenario survey |
| **"Would recommend" rate** | 70%+ | NPS survey |
| **Completion rate** | 60%+ reach EVALUATE stage | Journey funnel |

#### Evidence of Informed Confidence

| Metric | Success Target | Method |
|--------|----------------|--------|
| **Evidence Pack downloads** | 50%+ of evaluators | Analytics |
| **Committee presentations** | 20+ councils present findings | Survey follow-up |
| **Committee approval rates** | 65%+ of presented cases approved | Survey follow-up |
| **Peer recommendations** | "Referred by peer council" = 30%+ of new councils | Referral tracking |

#### Business Impact (Tracked Post-Decision)

| Metric | Success Target | Timeline |
|--------|----------------|----------|
| **AWS procurement** | 5-10 councils within 6 months of evaluation | Sales partnership |
| **G-Cloud procurement** | 3-5 councils procuring through framework | G-Cloud tracking |
| **Partner implementations** | 3-5 production deployments from Starter Pack scenarios | Partner reporting |
| **AI contract growth acceleration** | Councils credit NDX:Try in procurement RFPs | RFP analysis |

### How Success Metrics Inform Iteration

**If informed decision rate is low (<60%):**
- Evidence Pack template isn't working → redesign
- "What's Next" guidance is vague → clarify pathways
- Scenario Selector is mismatching → improve quiz logic

**If engagement is low (<50 deployments/month):**
- Awareness problem (partner with GDS Local)
- Discovery problem (improve Scenario Selector visibility)
- Deployment friction (simplify CloudFormation or add videos)

**If satisfaction is low (<4.0/5.0):**
- Sample data doesn't feel realistic → regenerate
- UI is confusing → redesign
- Guidance is missing → add docs

**If peer recommendations are low (<20%):**
- Case studies need amplification through LGA
- Early councils need better support to tell their story
- Success doesn't feel shareable → make feedback loop easier

---

## MVP Scope Summary

### What's Included (Starter Pack - Phase 1)

✓ **6 validated scenarios** (from Decision Matrix)
✓ **Scenario Selector quiz** (discovery tool)
✓ **Zero-deployment paths** (videos, hosted demos for non-technical users)
✓ **Committee Evidence Pack templates** (per persona)
✓ **"What You Experienced" summaries** (sense-making guides)
✓ **"What's Next" guidance** (partner recommendations, G-Cloud info)
✓ **Cost transparency** (upfront estimates, maximum cost guarantees)
✓ **Realistic UK council sample data** (synthetic but recognisable)
✓ **LGA AI Hub integration** (distribution + validation)

### What's Out of Scope (Phase 2)

○ **Live partner ecosystem integration** (CRM for partner matching - post-launch)
○ **Hosted demo environments** (pre-deployed running scenarios - Phase 2)
○ **Persona playlists** (curated 3-scenario journeys - Phase 2)
○ **Advanced analytics dashboards** (detailed funnel analysis - Phase 2)
○ **Cross-scenario journey stories** (e.g., "Citizen Communication Suite") (Phase 2)
○ **Readiness Assessment scenario** (maturity-based recommendations) (Phase 2)
○ **Multi-cloud support** (Azure/GCP scenarios) (Phase 2+)
○ **Custom data upload** (bring your own data for deep dives) (Phase 2)

### Definition of Done for MVP

✓ All 6 Starter Pack scenarios deployable with <95% success rate
✓ "15 minutes to first insight" target met across all scenarios
✓ Committee Evidence Pack can be auto-generated from session data
✓ "What's Next" guidance includes 2-3 vetted implementation partners
✓ Scenario Selector quiz reaches 90%+ accuracy on persona matching
✓ Success metrics tracking system live (Google Analytics + custom tracking)
✓ Zero-deployment paths (videos) available for all 6 scenarios
✓ LGA AI Hub partnership confirmed; 1st co-event scheduled
✓ First 2 case studies completed and published
✓ Documentation complete and tested with real councils

---

## Go-to-Market Strategy

### Phase 1: Launch Window (Q1 2026)

**Critical Actions (Concurrent):**

1. **GDS Local Partnership** (Weeks 1-2)
   - Introduce NDX:Try to GDS Local leadership
   - Propose joint messaging around council digital transformation
   - Target: Co-announcement at Q1 event

2. **LGA AI Hub Engagement** (Weeks 1-4)
   - Present at LGA AI Hub monthly meeting
   - Offer to contribute resources/case studies
   - Recruit first 2-3 councils as pilot evaluators
   - Target: 5+ councils in pipeline by end of month

3. **Partner Recruitment** (Weeks 2-6)
   - Identify 3-5 implementation partners (Deloitte, Accenture, smaller consultants)
   - Pitch "warm handoff" model: we provide evaluation, you provide implementation
   - Secure commitment for "What's Next" recommendations
   - Target: 2-3 anchoring partners confirmed

4. **First Scenarios Ready** (Weeks 1-8)
   - Deploy 3 highest-value scenarios (Council Chatbot, Planning Application AI, FOI Redaction)
   - Bulletproof deployment; test with real councils
   - Create demo videos and "while you wait" content
   - Target: Production-ready by week 8

5. **Early Council Recruitment** (Weeks 4-12)
   - Target 3-5 councils through LGA + GDS Local channels
   - Provide white-glove evaluation support
   - Turn into case studies
   - Target: 2 case studies published by end of Q1

### Phase 2: Momentum (Q2 2026)

- Launch remaining 3 Starter Pack scenarios
- Scale to 50+ deployments/month
- Build partner ecosystem case studies
- Start roadmap for Phase 2 features based on feedback

### Success Metrics for GTM

| Milestone | Target | Owner |
|-----------|--------|-------|
| GDS Local partnership confirmed | Week 2 | PM |
| LGA AI Hub presentation | Week 4 | PM |
| 3+ scenarios in production | Week 8 | Dev |
| 2 implementation partners signed | Week 6 | BD |
| 3-5 councils in evaluation | Week 8 | PM |
| 2 case studies published | Week 12 | PM |
| 50+ scenario deployments/month | Week 16 | Growth |

---

## Next Steps

### Immediate Actions (This Week)

1. **Validate Stakeholder Alignment**
   - Confirm AWS support for scenarios concept
   - Identify GDS Local contact for outreach
   - Get LGA AI Hub meeting scheduling contact

2. **Refine Starter Pack Details**
   - Each scenario needs: architecture diagram, sample data spec, CloudFormation template outline, success criteria
   - Create scenario development templates to ensure consistency

3. **Design Decision: AWS-Only vs Multi-Cloud**
   - Current brief assumes AWS-first, Phase 2 adds Azure/GCP
   - Confirm this is correct, or adjust strategy upfront

### This Month

4. **Architect Infrastructure**
   - Website/CMS for scenarios and metadata
   - Quiz engine for Scenario Selector
   - Analytics tracking for success metrics
   - Evidence Pack template generator

5. **Recruit Core Team**
   - Scenario developers (need 2-3 for parallel development)
   - AWS SA for architecture review
   - UX/product person for quiz and evidence pack design

6. **Begin Partner Outreach**
   - Create partner pitch deck
   - Identify 5-10 potential implementation partners
   - Schedule introductory calls

### Next Month

7. **Start Scenario Development**
   - Council Chatbot (highest priority + highest wow factor)
   - Planning Application AI (research-validated demand)
   - FOI Redaction (legal mandate driver)

8. **Build Evidence Pack Generator**
   - Design template per persona (CTO, Service Manager, Finance, Developer)
   - Implement auto-population from session data
   - Test with 3+ councils

9. **Create Demo Videos**
   - 5-10 minute walkthroughs for each scenario
   - Target realistic council scenarios, not demo perfection

---

## Document Ownership & Evolution

**This Product Brief is:**
- ✓ **Ready for PRD Phase** - Sufficient detail to begin Product Requirements Document
- ✓ **Ready for Architecture** - Technical team can begin design
- ✓ **Ready for Partner Engagement** - GDS Local/LGA can understand value proposition
- ✓ **Living Document** - Update quarterly as market/assumptions change

**Key Assumptions to Monitor:**
1. GDS Local receptiveness (confirm by Week 2)
2. AWS willingness to co-promote (confirm by Week 3)
3. LGA AI Hub partnership (confirm by Week 4)
4. "Informed confidence → action" hypothesis (track with metrics)
5. Council capacity constraints (adjust zero-deployment paths if needed)

**Handoff to Next Phase:**
→ Product Manager: Create detailed PRD from this brief
→ Architect: Design system architecture and scenarios
→ Product Team: Begin Scenario Selector quiz design
→ Community Manager: Schedule GDS Local + LGA outreach

---

## Final Reflection

NDX:Try solves a genuine problem at a unique moment. The external environment is unusually favorable:

- **GDS Local** just launched with a mandate to support councils (fresh window)
- **AI budgets** are growing while cloud plateaus (economic tailwind)
- **Innovation Sandbox** is production-ready and empty (platform waiting for content)
- **Peer networks** (LGA) are primed for distribution (network effect)

The risks are real (AWS indifference, partner ecosystem, council inertia), but none are showstoppers. The winning strategy is simple: **move fast, build peer validation, establish partnerships, and position as cloud-agnostic evaluation tool.**

This brief captures the vision. Now it's time to execute.

---

_This Product Brief was created through deep discovery and advanced elicitation, incorporating stakeholder mapping, value chain analysis, journey mapping, empathy research, service design, root cause validation, competitive analysis, and success metrics. It is ready for the PRD phase._
