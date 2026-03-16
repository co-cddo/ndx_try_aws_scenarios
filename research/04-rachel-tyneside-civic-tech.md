Now I have comprehensive research across all categories. Let me compile the full list of 65+ solution ideas.

---

# Civic Technology Solutions for UK Local Government

Below are 65+ unique, free/open-source solution ideas deployable on AWS, covering democratic participation, digital inclusion, citizen engagement, and community tools.

---

## 1. Consul Democracy -- Participatory Democracy Platform
A comprehensive citizen participation platform supporting proposals, debates, voting, collaborative legislation, and participatory budgeting. Used by 250+ cities worldwide including Madrid.

### Relevant for:
 - Metropolitan borough councils
 - Unitary authorities
 - County councils
 - London boroughs
 - Combined authorities

### Sources:
 - [Consul Democracy GitHub](https://github.com/consuldemocracy/consuldemocracy)
 - [Consul Democracy Website](https://consuldemocracy.org/)
 - [Consul Installer](https://github.com/consuldemocracy/installer)

### Difficulty of build (10 is hard):
6/10: Ruby on Rails app with PostgreSQL; installer scripts exist but needs configuration for AWS RDS and customisation for UK local gov context.

### Why:
Proven at scale in 250+ organisations worldwide, offering a single platform for proposals, debates, voting, and budgeting -- reducing the need for multiple engagement tools.

---

## 2. Decidim -- Modular Participatory Framework
A modular Ruby on Rails participatory democracy framework with configurable spaces (initiatives, assemblies, processes) and components (meetings, surveys, proposals, budgets).

### Relevant for:
 - Metropolitan borough councils
 - Unitary authorities
 - County councils
 - Combined authorities
 - London boroughs

### Sources:
 - [Decidim Website](https://decidim.org/)
 - [Decidim GitHub](https://github.com/decidim/decidim)
 - [Decidim Docs](https://docs.decidim.org/en/develop/features/general-features.html)

### Difficulty of build (10 is hard):
6/10: Well-documented Docker deployment; modular architecture requires planning for which modules to enable; needs translation for UK English and local gov terminology.

### Why:
Highly modular design means councils can start small and add components over time -- Barcelona, Helsinki, and many European cities prove its democratic value.

---

## 3. FixMyStreet -- Street Problem Reporting
Map-based platform for citizens to report potholes, broken streetlights, fly-tipping and other street issues, automatically routing reports to the responsible authority.

### Relevant for:
 - District councils
 - Unitary authorities
 - Metropolitan borough councils
 - London boroughs
 - County councils (highways)

### Sources:
 - [FixMyStreet GitHub](https://github.com/mysociety/fixmystreet)
 - [FixMyStreet Platform](https://fixmystreet.org/)
 - [FMS Endpoint](https://github.com/mysociety/fms-endpoint)

### Difficulty of build (10 is hard):
5/10: Mature Perl application with extensive documentation; main effort is configuring map tiles, authority boundaries, and integrating with existing back-office systems.

### Why:
Already widely used across UK councils; self-hosting gives full control over data, branding, and integration with existing highways and waste management systems.

---

## 4. Alaveteli -- Freedom of Information Request Platform
An internationalized FOI request management system, the engine behind WhatDoTheyKnow. Tracks the full lifecycle of requests from submission through to response and appeal.

### Relevant for:
 - All local authority types
 - Combined authorities
 - Police and Crime Commissioners
 - Parish/town councils (larger ones)

### Sources:
 - [Alaveteli GitHub](https://github.com/mysociety/alaveteli)
 - [Alaveteli Website](https://alaveteli.org/)
 - [Alaveteli Deployments](https://alaveteli.org/deployments/)

### Difficulty of build (10 is hard):
5/10: Ruby on Rails application with good deployment documentation; needs mail server configuration and authority contact database population.

### Why:
Handles 15-20% of UK central government FOI requests via WhatDoTheyKnow; self-hosting enables councils to manage FOI transparently while retaining control of workflows.

---

## 5. TheyWorkForYou -- Parliamentary Monitoring
Open-source platform that parses and publishes parliamentary transcripts, making them searchable and alertable, helping citizens track what their representatives say and do.

### Relevant for:
 - Combined authorities
 - County councils
 - Unitary authorities (for local adaptation to council proceedings)

### Sources:
 - [TheyWorkForYou GitHub](https://github.com/mysociety/theyworkforyou)
 - [mySociety Democracy](https://www.mysociety.org/democracy/)

### Difficulty of build (10 is hard):
7/10: Complex data pipeline for parsing Hansard-style transcripts; adapting for local council minutes requires significant customisation of the parsing engine.

### Why:
Enables transparency by making council proceedings text-searchable and alertable, so citizens can follow specific topics or councillors without attending every meeting.

---

## 6. WriteToThem / WriteInPublic -- Contact Your Representative
A platform allowing citizens to contact their elected representatives at all levels using just their postcode, without needing to know who represents them.

### Relevant for:
 - All local authority types
 - Combined authorities
 - Parish/town councils

### Sources:
 - [WriteToThem](https://www.mysociety.org/democracy/writetothem-for-campaigners/writetothem/)
 - [mySociety GitHub](https://github.com/mysociety)

### Difficulty of build (10 is hard):
5/10: Requires integration with boundary and representative data; the platform itself is straightforward but needs ongoing data maintenance for councillor contact details.

### Why:
Removes barriers to contacting representatives -- 15,000 people use WriteToThem monthly. Self-hosting lets councils embed it directly in their websites.

---

## 7. CKAN -- Open Data Portal
The world's leading open-source data management system for publishing, sharing, and discovering datasets. Powers data.gov.uk and hundreds of government data portals worldwide.

### Relevant for:
 - All local authority types
 - Combined authorities
 - County councils

### Sources:
 - [CKAN Website](https://ckan.org/)
 - [CKAN GitHub](https://github.com/ckan/ckan)
 - [CKAN for Government](https://ckan.org/government)

### Difficulty of build (10 is hard):
5/10: Well-documented Python application with Docker deployment; AWS has published reference architectures. Main effort is data curation and metadata standards.

### Why:
Enables transparency by publishing council spending, performance data, and geographic data in machine-readable formats, meeting Local Government Transparency Code requirements.

---

## 8. LimeSurvey -- Citizen Satisfaction Surveys
A powerful open-source survey platform supporting conditional logic, multilingual surveys, GDPR-compliant data collection, and extensive reporting -- used by governments in 80+ countries.

### Relevant for:
 - All local authority types
 - Parish/town councils
 - Combined authorities

### Sources:
 - [LimeSurvey Website](https://www.limesurvey.org/)
 - [LimeSurvey GitHub](https://github.com/LimeSurvey/LimeSurvey)

### Difficulty of build (10 is hard):
3/10: Mature PHP application with one-click installers; runs well on EC2 with MySQL/MariaDB; extensive theme and plugin ecosystem.

### Why:
Replaces expensive commercial survey tools while giving councils full ownership of citizen feedback data and the flexibility to create complex branching consultations.

---

## 9. Formbricks -- In-Context Citizen Feedback
An open-source survey and feedback platform enabling in-app, website, link, and email surveys with targeted triggers -- designed to capture citizen experience at every touchpoint.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Formbricks Website](https://formbricks.com/)
 - [Formbricks GitHub](https://github.com/formbricks/formbricks)
 - [Formbricks Government](https://formbricks.com/industry/government-survey-tool)

### Difficulty of build (10 is hard):
3/10: Modern Next.js application with Docker compose deployment; easy to self-host on AWS with ECS or EC2.

### Why:
Captures feedback in context (e.g., after completing a planning application) rather than generic surveys, yielding higher quality insights about specific council services.

---

## 10. Pol.is -- AI-Powered Opinion Gathering
A machine-learning-powered platform for large-scale opinion gathering that identifies consensus and opinion groups through real-time statistical analysis of short statement votes.

### Relevant for:
 - Metropolitan borough councils
 - Unitary authorities
 - Combined authorities
 - County councils

### Sources:
 - [Pol.is / Computational Democracy Project](https://compdemocracy.org/polis/)
 - [Pol.is Wikipedia](https://en.wikipedia.org/wiki/Pol.is)
 - [Pol.is GitHub Documentation](https://github.com/pol-is/polis-documentation)

### Difficulty of build (10 is hard):
6/10: Multi-component system (Node.js, Clojure, PostgreSQL) with Docker deployment; the ML clustering component needs adequate compute resources on AWS.

### Why:
Used by Taiwan's government to successfully pass legislation through consensus-finding. Uniquely surfaces agreement across divided groups -- ideal for contentious local issues.

---

## 11. Your Priorities -- Idea Generation and Deliberation
A citizen engagement progressive web app enabling structured idea generation, balanced deliberation (pros and cons), and prioritisation -- used in 45 countries by 2+ million people.

### Relevant for:
 - All local authority types
 - Combined authorities
 - Parish/town councils

### Sources:
 - [Your Priorities App GitHub](https://github.com/CitizensFoundation/your-priorities-app)
 - [Citizens Foundation](https://citizens.is/)
 - [Your Priorities Features](https://citizens.is/your-priorities-features-overview/)

### Difficulty of build (10 is hard):
5/10: Node.js application with Web Components frontend; well-documented Docker deployment; API is extensible for custom integrations.

### Why:
The structured pros/cons format prevents echo chambers and produces genuinely balanced deliberation, giving councils clearer signals about community sentiment.

---

## 12. Loomio -- Collaborative Decision-Making
An open-source platform helping groups discuss proposals and reach decisions through structured consensus processes (agree, disagree, abstain, block).

### Relevant for:
 - Parish/town councils
 - Community councils (Scotland)
 - Neighbourhood forums
 - Council committees and working groups

### Sources:
 - [Loomio Website](https://www.loomio.com/)
 - [Loomio on openDemocracy](https://www.opendemocracy.net/en/digitaliberties/loomio-and-problem-of-deliberation/)

### Difficulty of build (10 is hard):
4/10: Ruby on Rails application with Docker deployment; self-hosted version is well-documented and runs comfortably on modest AWS instances.

### Why:
Perfect for smaller democratic bodies like parish councils or neighbourhood forums that need structured, transparent decision-making without the overhead of full council meetings.

---

## 13. DemocracyOS -- Policy Deliberation
An open-source platform for political consultation, deliberation, and voting on policy issues, enabling citizens to propose, discuss, and vote on matters affecting them.

### Relevant for:
 - Metropolitan borough councils
 - Unitary authorities
 - Combined authorities

### Sources:
 - [DemocracyOS on Participedia](https://participedia.net/method/4314)
 - [Democracy Technologies Database](https://democracy-technologies.org/database/)

### Difficulty of build (10 is hard):
5/10: Node.js application; moderate complexity for deployment; translated into 15 languages; some codebase maintenance concerns.

### Why:
Battle-tested in national contexts (Tunisia constitutional debate, Mexico open government policy) and translatable to local government policy consultations.

---

## 14. UK Government E-Petitions Platform
The open-source code behind petition.parliament.uk, enabling citizens to create, sign, and track petitions with signature verification, moderation workflows, and threshold triggers.

### Relevant for:
 - County councils
 - Unitary authorities
 - Metropolitan borough councils
 - London boroughs

### Sources:
 - [E-Petitions GitHub](https://github.com/alphagov/e-petitions)
 - [GDS Blog on E-Petitions](https://gds.blog.gov.uk/2012/05/29/e-petitions-open-source-open-data-and-getting-trendy/)

### Difficulty of build (10 is hard):
5/10: Ruby on Rails application; requires email verification infrastructure and moderation workflows; signature thresholds need configuring for local council contexts.

### Why:
Built and battle-tested by GDS for the UK Parliament, so already designed for UK governance norms including verification, moderation, and threshold-based debate triggers.

---

## 15. Belenios -- Verifiable Online Voting
A state-of-the-art verifiable online voting system providing end-to-end cryptographic verification while preserving ballot secrecy, suitable for referendums and polls.

### Relevant for:
 - Parish/town councils (parish polls)
 - Neighbourhood forums
 - Community councils
 - All local authorities (internal votes)

### Sources:
 - [Belenios Website](https://www.belenios.org/)
 - [Belenios on Democracy Technologies](https://democracy-technologies.org/database/)

### Difficulty of build (10 is hard):
7/10: OCaml-based system requiring cryptographic key management; the security model is robust but needs careful operational procedures for trustworthy elections.

### Why:
Provides mathematically verifiable election integrity -- essential for any binding or semi-binding community vote where trust and transparency are paramount.

---

## 16. Stanford Participatory Budgeting Platform
A dedicated platform for running participatory budgeting elections where citizens vote on how to allocate portions of a public budget across proposed projects.

### Relevant for:
 - Metropolitan borough councils
 - Unitary authorities
 - London boroughs
 - Combined authorities

### Sources:
 - [Stanford PB Platform](https://pbstanford.org/)
 - [Citizens Foundation GitHub](https://github.com/CitizensFoundation)

### Difficulty of build (10 is hard):
4/10: Web-based voting interface with straightforward deployment; main effort is designing the PB process, project proposals, and communication strategy.

### Why:
Gives citizens direct say over real budget allocations, building trust and engagement -- councils like Tower Hamlets and Edinburgh have run successful PB processes.

---

## 17. Visual Town Budget -- Interactive Budget Visualisation
An open-source framework that transforms government budget data into interactive, colour-coded visualisations allowing citizens to explore spending by department and category.

### Relevant for:
 - All local authority types
 - Combined authorities
 - Parish/town councils

### Sources:
 - [Visual Town Budget GitHub](https://github.com/goinvo/Visual-Town-Budget)
 - [Visual Budget ICOS](https://icos.urenio.org/applications/visual-budget/)

### Difficulty of build (10 is hard):
3/10: Static JavaScript application that reads budget data from structured files; needs only S3 and CloudFront for hosting; main effort is preparing budget data in the required format.

### Why:
Turns impenetrable council budget spreadsheets into engaging, explorable visualisations that help residents understand where their council tax goes.

---

## 18. LibreTranslate -- Self-Hosted Translation Service
A free, self-hosted machine translation API supporting 30+ languages, enabling councils to offer multi-language access to their digital services without third-party dependencies.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [LibreTranslate GitHub](https://github.com/LibreTranslate/LibreTranslate)
 - [LibreTranslate Website](https://libretranslate.com/)

### Difficulty of build (10 is hard):
4/10: Python application with Docker deployment; runs well on GPU-enabled EC2 instances for better performance; API is straightforward to integrate with council websites.

### Why:
Enables councils to translate website content, forms, and communications into community languages on-demand without per-word commercial translation costs or data sovereignty concerns.

---

## 19. Simply Readable -- AI Easy Read Document Generator
An open-source application using Amazon Bedrock to transform complex council documents into Easy Read format with simplified language and supporting images, built in partnership with Swindon Council.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [AWS Blog - Improving Inclusion and Accessibility](https://aws.amazon.com/blogs/machine-learning/improving-inclusion-and-accessibility-through-automated-document-translation-with-an-open-source-app-using-amazon-translate/)
 - [Easy Read Generator GitHub](https://github.com/choiwab/Easy_Read)

### Difficulty of build (10 is hard):
6/10: AWS CDK application using Bedrock, Cognito, AppSync, and S3; already designed for AWS deployment but requires Bedrock model access and ISB-compatible role naming.

### Why:
The Equality Act 2010 requires councils to make information accessible; this tool dramatically reduces the time and cost of producing Easy Read documents from hours to minutes.

---

## 20. Pa11y Dashboard -- Automated Accessibility Monitoring
An open-source web dashboard that automatically tests council web pages daily against WCAG accessibility standards, tracking improvements and regressions over time with exportable reports.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Pa11y Website](https://pa11y.org/)
 - [Pa11y Dashboard GitHub](https://github.com/pa11y/pa11y-dashboard)
 - [Pa11y CLI GitHub](https://github.com/pa11y/pa11y)

### Difficulty of build (10 is hard):
3/10: Node.js application with MongoDB; easy to deploy on EC2; configure it with your council's page URLs and it runs automated daily audits.

### Why:
Public Sector Bodies Accessibility Regulations 2018 require councils to meet WCAG 2.1 AA; this tool provides continuous, automated monitoring rather than point-in-time audits.

---

## 21. Axe-core -- Accessibility Testing Engine
The open-source accessibility testing engine (by Deque) that powers automated WCAG compliance checks, integrable into CI/CD pipelines, browsers, and testing frameworks.

### Relevant for:
 - All local authority types (development teams)

### Sources:
 - [Axe Platform](https://www.deque.com/axe/)
 - [Axe-core GitHub](https://github.com/dequelabs/axe-core)

### Difficulty of build (10 is hard):
2/10: JavaScript library that integrates into existing test suites; minimal infrastructure needed; runs in Lambda or as part of CodeBuild pipelines.

### Why:
Catches accessibility issues before they reach citizens by integrating into the development process, preventing expensive remediation of live services.

---

## 22. Tanaguru -- Deep Accessibility Auditing
An open-source (AGPL) website assessment tool focused on WCAG accessibility audits, providing detailed compliance reports with high automation and reliability.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Tanaguru Website](https://www.tanaguru.com/)
 - [Open Source Accessibility Tools Roundup](https://www.digitala11y.com/open-source-accessibility-tools/)

### Difficulty of build (10 is hard):
5/10: Java-based application requiring Tomcat and MySQL; more complex deployment than Pa11y but offers deeper analysis including contrast checking and link validation.

### Why:
Provides a more thorough audit than lighter tools, checking entire sites with page-by-page detail -- essential for councils with large, legacy website estates.

---

## 23. sign.mt -- Real-Time Sign Language Translation
An open-source application providing real-time multilingual bi-directional translation between spoken and signed languages, with customisable photo-realistic sign language avatars.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [sign.mt Paper](https://arxiv.org/html/2310.05064v2)
 - [SignAvatar](https://www.signavatar.org/)

### Difficulty of build (10 is hard):
8/10: Requires ML model hosting, pose estimation, and avatar rendering; GPU compute needed; BSL models may need additional training data beyond the available ASL models.

### Why:
Over 150,000 BSL users in the UK often struggle to access council services. Automated sign language translation can provide 24/7 accessibility that human interpreters cannot.

---

## 24. GenASL Sign Language Avatar Generator
An AWS-native open-source solution using generative AI to translate speech or text into expressive sign language avatar animations, deployable on Amazon SageMaker.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [GenASL AWS Blog](https://aws.amazon.com/blogs/machine-learning/genasl-generative-ai-powered-american-sign-language-avatars/)
 - [GenASL GitHub](https://github.com/aws-samples/genai-asl-avatar-generator)

### Difficulty of build (10 is hard):
7/10: AWS-native architecture using SageMaker and Bedrock; currently ASL-focused, so BSL adaptation would require additional pose data and linguistic mapping work.

### Why:
Purpose-built for AWS deployment, reducing infrastructure complexity. Could be adapted for BSL to provide automated sign language content for council video communications.

---

## 25. NVDA -- Open-Source Screen Reader
A free, open-source screen reader for Windows that provides text-to-speech and Braille output, enabling blind and visually impaired citizens to access council digital services.

### Relevant for:
 - All local authority types (for distribution to residents)

### Sources:
 - [NVDA Website](https://www.nvaccess.org/)
 - [BrowserStack Screen Reader Guide](https://www.browserstack.com/guide/screen-reader-apps)

### Difficulty of build (10 is hard):
2/10: No build required for the screen reader itself; the opportunity is to host a download portal and training resources on AWS for residents who need assistive technology.

### Why:
Councils can distribute NVDA alongside digital inclusion programmes, ensuring visually impaired residents can access online council services without purchasing expensive commercial screen readers.

---

## 26. Moodle -- Digital Skills Training Platform
The world's most widely used open-source learning management system, supporting 360+ million learners with courses, quizzes, forums, and certification -- ideal for digital inclusion training.

### Relevant for:
 - All local authority types
 - Combined authorities
 - County councils

### Sources:
 - [Moodle Website](https://moodle.org/)
 - [Moodle Open Source](https://moodle.com/about/open-source/)

### Difficulty of build (10 is hard):
4/10: PHP/MySQL application with extensive hosting documentation; AWS has published Moodle reference architectures using EC2 Auto Scaling and RDS.

### Why:
Enables councils to offer structured digital skills courses to residents, from basic internet use to online form completion, supporting the government's digital inclusion strategy.

---

## 27. Kolibri -- Offline-First Digital Learning
An offline-first open-source learning platform with 173+ language content library, designed for areas with limited internet connectivity -- ideal for community centres and libraries.

### Relevant for:
 - District councils
 - Unitary authorities
 - County councils (rural areas)
 - Parish/town councils

### Sources:
 - [Kolibri Website](https://learningequality.org/kolibri/)
 - [Kolibri GitHub](https://github.com/learningequality/kolibri)

### Difficulty of build (10 is hard):
3/10: Python application that runs on minimal hardware including Raspberry Pi; can be pre-loaded with content and deployed in libraries and community centres without internet.

### Why:
2.4 million UK adults have zero digital skills; Kolibri enables offline digital literacy training in community centres and libraries where connectivity is poor or non-existent.

---

## 28. LocalGov Drupal -- Council Website Platform
A collaboratively built open-source CMS developed by and for UK councils, with pre-built content types for council services, WCAG 2.1 AA compliance, and shared development costs.

### Relevant for:
 - District councils
 - Unitary authorities
 - Metropolitan borough councils
 - London boroughs
 - County councils

### Sources:
 - [LocalGov Drupal Website](https://localgovdrupal.org/)
 - [LocalGov Drupal GitHub](https://github.com/localgovdrupal)
 - [Drupal.org LocalGov Drupal](https://www.drupal.org/association/supporters/blog/localgov-drupal-a-cms-developed-for-uk-councils-by-uk-councils)

### Difficulty of build (10 is hard):
4/10: Standard Drupal installation profile with council-specific modules; 56+ councils already use it; community provides shared development and support.

### Why:
Councils report up to 80% cost savings versus commercial CMS platforms, with accessibility built in and a community of 56+ councils sharing development costs.

---

## 29. CiviCRM -- Constituent Relationship Management
The leading open-source CRM for the civic sector, managing contacts, events, memberships, cases, and communications -- used by 14,000+ organisations worldwide.

### Relevant for:
 - All local authority types
 - Parish/town councils
 - Combined authorities

### Sources:
 - [CiviCRM Website](https://civicrm.org/)
 - [CiviCRM GitHub](https://github.com/civicrm/civicrm-core)

### Difficulty of build (10 is hard):
5/10: PHP application integrating with Drupal, WordPress, or Joomla; extensive documentation but requires careful data migration and workflow configuration for council use.

### Why:
Provides a unified view of citizen interactions across services, enabling councils to manage casework, events, memberships, and communications from a single system.

---

## 30. ArkCase -- Case Management for Councillor Casework
An open-source, modular case management platform with FOIA, complaint management, and correspondence modules -- adaptable for councillor constituency casework.

### Relevant for:
 - Metropolitan borough councils
 - Unitary authorities
 - London boroughs
 - County councils

### Sources:
 - [ArkCase Website](https://www.arkcase.com/product/arkcase-open-source-case-management-platform/)
 - [ArkCase FOIA](https://armedia.com/solution/foia/)

### Difficulty of build (10 is hard):
6/10: Java-based enterprise application requiring Solr, ActiveMQ, and PostgreSQL; the modularity helps but initial setup is complex; FOIA module is particularly well-developed.

### Why:
Councillors need to track constituent cases across multiple council departments; ArkCase provides workflow automation, SLA tracking, and audit trails that spreadsheets cannot.

---

## 31. Open311 / Mark-a-Spot -- Civic Issue Tracking
An open standard and Drupal-based platform for location-based civic issue reporting, enabling citizens to report problems and track resolution via a standardised API.

### Relevant for:
 - District councils
 - Unitary authorities
 - Metropolitan borough councils
 - London boroughs

### Sources:
 - [Open311 Website](https://www.open311.org/)
 - [Mark-a-Spot](https://www.mark-a-spot.com/)
 - [GeoReport v2 Specification](https://wiki.open311.org/GeoReport_v2/)

### Difficulty of build (10 is hard):
5/10: Mark-a-Spot is a Drupal distribution with the GeoReport v2 API built in; main effort is configuring service categories and integrating with back-office systems.

### Why:
The standardised Open311 API enables interoperability between citizen-facing apps and council back-office systems, preventing vendor lock-in for issue reporting.

---

## 32. Ushahidi -- Crowdsourced Community Reporting and Mapping
An open-source crowdsourcing and mapping platform enabling communities to submit reports via SMS, email, Twitter, or web, with geographic visualisation and workflow management.

### Relevant for:
 - All local authority types
 - Combined authorities
 - Parish/town councils

### Sources:
 - [Ushahidi Website](https://www.ushahidi.com/)
 - [Ushahidi Wikipedia](https://en.wikipedia.org/wiki/Ushahidi)

### Difficulty of build (10 is hard):
4/10: PHP/Laravel application with Docker deployment; well-documented and battle-tested across 160+ countries; multi-channel input (SMS, email, web) works out of the box.

### Why:
Multi-channel input (SMS, email, social media) ensures even digitally excluded residents can report issues, making it more inclusive than web-only reporting tools.

---

## 33. PlanningAlerts -- Planning Application Notifications
An open-source system that alerts residents about new planning applications near their address, enabling them to comment and engage with the planning process proactively.

### Relevant for:
 - District councils
 - Unitary authorities
 - Metropolitan borough councils
 - London boroughs
 - National park authorities

### Sources:
 - [PlanningAlerts GitHub](https://github.com/openaustralia/planningalerts)
 - [Digital Land - Planning Application Data Projects](https://digital-land.github.io/blog-post/a-short-history-of-planning-application-data-projects/)

### Difficulty of build (10 is hard):
6/10: Ruby on Rails application; the main challenge is building scrapers for UK planning portal data formats and configuring postcode-to-location mapping.

### Why:
Most residents only discover planning applications when building work starts. Proactive alerts democratise planning engagement and reduce costly objections at late stages.

---

## 34. OpenCouncil -- Council Meeting Transparency
An open-source platform for digitising, transcribing, and making council meeting proceedings searchable, helping citizens engage with local government decision-making.

### Relevant for:
 - All local authority types
 - Combined authorities
 - Parish/town councils

### Sources:
 - [OpenCouncil GitHub](https://github.com/schemalabz/opencouncil)
 - [Open Media Foundation](https://open.media/governments/)

### Difficulty of build (10 is hard):
6/10: Requires speech-to-text transcription (achievable via AWS Transcribe), search indexing, and video hosting; the combined pipeline needs careful orchestration.

### Why:
Makes council meetings accessible to residents who cannot attend in person, with searchable transcripts enabling citizens to find discussions on topics they care about.

---

## 35. Jitsi Meet -- Self-Hosted Video Conferencing for Council Meetings
A fully encrypted, open-source video conferencing platform that can be self-hosted for council meetings, committee sessions, and public hearings with recording and livestreaming.

### Relevant for:
 - All local authority types
 - Combined authorities
 - Parish/town councils

### Sources:
 - [Jitsi Website](https://jitsi.org/)
 - [Jitsi Meet GitHub](https://github.com/jitsi/jitsi-meet)

### Difficulty of build (10 is hard):
4/10: Well-documented Linux deployment with Docker support; runs on EC2 instances; Jibri component enables recording and streaming to YouTube/council websites.

### Why:
Eliminates dependency on commercial platforms (Zoom, Teams) for public meetings, giving councils full control over data, recordings, and accessibility features.

---

## 36. 4Minitz -- Collaborative Meeting Minutes
A free, open-source web application for collaborative meeting minutes, enabling real-time minute-taking with action item tracking, topic management, and PDF export.

### Relevant for:
 - All local authority types
 - Parish/town councils
 - Combined authorities

### Sources:
 - [4Minitz Website](https://www.4minitz.com/)
 - [4Minitz GitHub](https://github.com/4minitz/4minitz)

### Difficulty of build (10 is hard):
3/10: Meteor.js application with Docker deployment; lightweight and easy to self-host; no external dependencies beyond MongoDB.

### Why:
Sensitive meeting minutes should not be hosted in third-party clouds; 4Minitz provides self-hosted, collaborative minute-taking with action item tracking built in.

---

## 37. OpenProject -- Meeting and Agenda Management
An open-source project management platform with dedicated meeting management features including structured agendas, minutes capture, action items, and PDF export.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [OpenProject Website](https://www.openproject.org/)
 - [OpenProject Meeting Management](https://www.openproject.org/docs/user-guide/meetings/)

### Difficulty of build (10 is hard):
4/10: Ruby on Rails application with Docker/DEB/RPM packages; community edition is free; integrates meeting management with broader project tracking.

### Why:
Combines meeting management with project tracking, so action items from council meetings are automatically linked to projects and tracked to completion.

---

## 38. Discourse -- Community Discussion Forum
A 100% open-source modern forum platform powering 22,000+ communities, with trust-based moderation, categories, tags, and rich media support for community engagement.

### Relevant for:
 - All local authority types
 - Combined authorities
 - Parish/town councils

### Sources:
 - [Discourse Website](https://www.discourse.org/)
 - [Discourse GitHub](https://github.com/discourse/discourse)

### Difficulty of build (10 is hard):
3/10: Docker-based deployment with excellent documentation; 30-minute installation guide; runs well on a single EC2 instance with PostgreSQL and Redis.

### Why:
Provides a moderated, structured space for community discussion that is more productive than social media, with built-in trust systems that reduce moderation burden.

---

## 39. Rasa -- AI Chatbot for Council Services
An open-source conversational AI framework for building context-aware chatbots that can handle citizen enquiries about council services, bin collections, and planning.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Rasa Open Source](https://rasa.com/open-source/)
 - [Botpress Blog on Open Source Chatbots](https://botpress.com/blog/open-source-chatbots)

### Difficulty of build (10 is hard):
7/10: Python ML framework requiring training data for council-specific intents; needs NLU model training; can integrate with council back-ends via custom actions.

### Why:
Can deflect 40-60% of routine enquiries (bin collection days, opening hours, payment links) from phone lines, freeing staff for complex cases.

---

## 40. Chatwoot -- Citizen Support and Engagement Platform
An AI-powered open-source customer support platform providing live chat, email, social media, and SMS channels for citizen interactions, with canned responses and automation.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Chatwoot Website](https://www.chatwoot.com/)

### Difficulty of build (10 is hard):
4/10: Ruby on Rails application with Docker Compose deployment; supports multiple channels out of the box; integrates with existing council communication channels.

### Why:
Provides a unified inbox for citizen communications across channels (web chat, email, social media), ensuring no enquiry falls through the cracks between teams.

---

## 41. Matomo -- Privacy-First Web Analytics
An open-source, GDPR-compliant web analytics platform providing full data ownership, approved by the French CNIL, and used by the European Commission and 1M+ websites.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Matomo Website](https://matomo.org/)
 - [Matomo for Government](https://matomo.org/analytics-for-government-agencies/)
 - [Matomo on UK Digital Marketplace](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/245080794223711)

### Difficulty of build (10 is hard):
3/10: PHP/MySQL application with one-click installer; runs on a single EC2 instance; already listed on the UK Digital Marketplace for government procurement.

### Why:
Replaces Google Analytics with a privacy-respecting alternative that keeps citizen browsing data under council control, complying with UK GDPR and PECR regulations.

---

## 42. Metabase -- Council Data Dashboard and Reporting
An open-source business intelligence tool that lets non-technical staff explore data and build dashboards, turning council databases into actionable insights without SQL knowledge.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Metabase Website](https://www.metabase.com/)
 - [Metabase GitHub](https://github.com/metabase/metabase)

### Difficulty of build (10 is hard):
3/10: Java application with Docker deployment; connects directly to PostgreSQL, MySQL, or SQL Server databases; no-code query builder makes it accessible to non-technical staff.

### Why:
Enables councils to create KPI dashboards, FOI statistics, and service performance reports without dedicated data analyst time, democratising data access across the organisation.

---

## 43. ORServices -- Community Service Directory
An open-source, smartphone-friendly directory application using Open Referral data standards for health, human, and social services -- enabling citizens to find local support.

### Relevant for:
 - District councils
 - Unitary authorities
 - Metropolitan borough councils
 - County councils

### Sources:
 - [ORServices GitHub](https://github.com/sarapis/orservices)
 - [Open Referral UK](https://openreferraluk.org/)

### Difficulty of build (10 is hard):
4/10: PHP application supporting Open Referral UK data standards; main effort is populating and maintaining the service directory data with local organisations.

### Why:
Uses the Open Referral UK standard adopted by multiple councils, enabling data sharing and preventing duplicate directory maintenance across neighbouring authorities.

---

## 44. OpenVolunteerPlatform -- Volunteer Management
An open-source platform for automating and optimising volunteer coordination for local government and charity organisations, with scheduling, task assignment, and communication.

### Relevant for:
 - District councils
 - Unitary authorities
 - Parish/town councils
 - County councils

### Sources:
 - [OpenVolunteerPlatform GitHub](https://github.com/aerogear/OpenVolunteerPlatform)
 - [Volunteer Management GitHub Topic](https://github.com/topics/volunteer-management)

### Difficulty of build (10 is hard):
5/10: GraphQL/Node.js backend with React frontend; integrates with Keycloak for authentication; requires customisation for council volunteering workflows.

### Why:
Councils coordinate thousands of volunteers for events, emergencies, and community services; this platform replaces fragmented spreadsheet-based tracking.

---

## 45. Coalesce -- Volunteer Recruitment and Onboarding
A 100% open-source volunteer management platform focused on making recruiting, onboarding, and managing volunteers as easy as possible for humanitarian and civic organisations.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Coalesce GitHub](https://github.com/FederationOfTech/Coalesce)

### Difficulty of build (10 is hard):
5/10: Modern web application with streamlined volunteer lifecycle management; requires configuration for council-specific DBS check workflows and role definitions.

### Why:
Streamlines the often bureaucratic volunteer onboarding process (DBS checks, training, induction) that deters potential community volunteers from engaging.

---

## 46. Goteo -- Civic Crowdfunding Platform
An open-source, award-winning civic crowdfunding platform for social impact projects, enabling communities to fund local improvements with matched funding from councils.

### Relevant for:
 - Metropolitan borough councils
 - Unitary authorities
 - London boroughs
 - Combined authorities

### Sources:
 - [Goteo GitHub](https://github.com/GoteoFoundation/goteo)
 - [Goteo Foundation](https://www.goteo.org/)

### Difficulty of build (10 is hard):
5/10: PHP application with MySQL; requires payment gateway integration (Stripe); needs legal framework for handling public funds and match-funding rules.

### Why:
Enables community-led project funding with council match-funding, giving residents ownership of local improvements while leveraging public money to catalyse private contributions.

---

## 47. Open Collective -- Transparent Community Fund Management
An open-source platform for transparent fiscal management of community funds, enabling groups to raise money, manage expenses, and report spending with full transparency.

### Relevant for:
 - Parish/town councils
 - District councils
 - Community councils (Scotland)
 - Neighbourhood forums

### Sources:
 - [Open Collective Website](https://opencollective.com/)
 - [Open Collective GitHub](https://github.com/opencollective)

### Difficulty of build (10 is hard):
6/10: Node.js/React application with PostgreSQL; complex financial management features require careful configuration; payment processing integration needed.

### Why:
Provides radical financial transparency for community funds -- every transaction is public, building trust in how community grants and neighbourhood budgets are spent.

---

## 48. Docassemble -- Guided Document and Form Automation
An open-source expert system for guided interviews that generates documents and forms, enabling councils to create step-by-step application processes in plain English.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Docassemble Website](https://docassemble.org/)
 - [Docassemble on Open Source Legal](https://opensource.legal/projects/docassemble)

### Difficulty of build (10 is hard):
4/10: Python/Docker application with visual interview builder; interview developers need no programming experience; generates PDFs and integrates with document management.

### Why:
Transforms complex council application processes (planning, licensing, benefits) into guided, plain-English interviews that reduce errors and incomplete submissions.

---

## 49. formsflow.ai -- Low-Code Form and Workflow Platform
An open-source platform combining form building (Form.io), workflow automation (Camunda), and analytics for citizen-facing digital services with full case management.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [formsflow.ai Website](https://formsflow.ai/)
 - [Form.io Website](https://form.io/)

### Difficulty of build (10 is hard):
5/10: Docker Compose deployment with Keycloak, Camunda, and Form.io components; each component is well-documented but the integration requires careful configuration.

### Why:
Combines form design, workflow automation, and case management into a single open-source stack, enabling rapid creation of end-to-end digital council services.

---

## 50. Easy!Appointments -- Citizen Appointment Booking
An open-source appointment scheduling application allowing citizens to book appointments with council services via a web interface, with Google Calendar sync and email notifications.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Easy!Appointments Website](https://easyappointments.org/)
 - [Easy!Appointments GitHub](https://github.com/alextselegidis/easyappointments)

### Difficulty of build (10 is hard):
2/10: Simple PHP/MySQL application; runs on basic EC2 with minimal resources; straightforward configuration of services, staff, and working hours.

### Why:
Reduces queue times and no-shows at council offices by enabling online booking for services like housing consultations, planning pre-application meetings, and registration.

---

## 51. BC Queue Management -- Citizen Flow Management
An open-source system designed for government service centres to manage citizen queues, appointments, and flow analytics with digital signage and real-time wait time displays.

### Relevant for:
 - Unitary authorities
 - Metropolitan borough councils
 - London boroughs
 - County councils

### Sources:
 - [BC Queue Management GitHub](https://github.com/bcgov/queue-management)

### Difficulty of build (10 is hard):
5/10: Python/Flask backend with Vue.js frontend; originally built for British Columbia's Service BC centres; needs adaptation for UK council service models.

### Why:
Reduces perceived and actual wait times in council offices while providing management with analytics on service demand patterns and staffing needs.

---

## 52. Xibo -- Community Digital Signage
An open-source digital signage CMS managing content across multiple screens in council buildings, libraries, and community centres for public information and announcements.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Xibo Website](https://xibosignage.com/)
 - [Xibo Open Source](https://xibosignage.com/open-source)

### Difficulty of build (10 is hard):
3/10: Docker-based CMS with players for Windows, Android, and web; straightforward deployment; content scheduling and remote management built in.

### Why:
Replaces expensive proprietary signage solutions for displaying council news, emergency alerts, and community events across libraries, leisure centres, and town halls.

---

## 53. QGIS with PostGIS -- Community Asset Mapping
An open-source GIS platform combined with PostGIS spatial database for mapping community assets, council-owned land, parks, community centres, and local infrastructure.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [QGIS Website](https://www.qgis.org/)
 - [PostGIS Website](https://postgis.net/)
 - [OSGeo Foundation](https://www.osgeo.org/)

### Difficulty of build (10 is hard):
5/10: QGIS Server and PostGIS on RDS provide web map services; QGIS desktop for data editing; main effort is gathering and digitising community asset data.

### Why:
Enables evidence-based decisions about service provision by visualising where community assets, deprivation, and need overlap -- essential for Levelling Up Fund bids.

---

## 54. Make Place -- Participatory Community Mapping
An open-source mapping and survey tool enabling residents to pin comments, ideas, and feedback onto interactive maps of their neighbourhood for community planning exercises.

### Relevant for:
 - District councils
 - Unitary authorities
 - Metropolitan borough councils
 - Parish/town councils

### Sources:
 - [Make Place - Open Lab Newcastle](https://openlab.ncl.ac.uk/research/make-place-an-open-source-mapping-and-survey-tool/)

### Difficulty of build (10 is hard):
4/10: Web application with map-based survey interface; uses OpenStreetMap tiles; needs configuration for local area boundaries and survey questions.

### Why:
Engages residents who would never attend a planning meeting by letting them drop pins on a map and comment -- proven to reach younger and harder-to-engage demographics.

---

## 55. Mapeo -- Offline Participatory Territory Mapping
A mobile and desktop mapping tool for offline data collection, designed for community-led mapping of local assets, environmental concerns, and territorial knowledge.

### Relevant for:
 - Parish/town councils
 - District councils (rural areas)
 - National park authorities
 - County councils

### Sources:
 - [Digital Democracy - Mapeo](https://www.digital-democracy.org/blog/technology-preview-participatory-mapping-in-the-amazon-with-mapeo)
 - [Mapeo on IDB](https://knowledge.iadb.org/en/open-knowledge/code-development/open-source-solution/mapeo)

### Difficulty of build (10 is hard):
4/10: Electron desktop app and mobile app that work entirely offline; peer-to-peer sync; data can later be uploaded to AWS for analysis and sharing.

### Why:
Enables community mapping in rural areas without internet connectivity, perfect for parish councils documenting footpaths, heritage assets, and environmental features.

---

## 56. Democracy Club Data and APIs -- Election Information
Open data and APIs providing polling station locations, candidate information, and election details for every UK election, freely available for council websites and apps.

### Relevant for:
 - All local authority types

### Sources:
 - [Democracy Club Website](https://democracyclub.org.uk/)
 - [Democracy Club Data and APIs](https://democracyclub.org.uk/projects/data/)
 - [WhereDoIVote](https://wheredoivote.co.uk/)

### Difficulty of build (10 is hard):
2/10: API integration only; councils embed the polling station finder and candidate lookup via API calls or iframe; Democracy Club handles the data collection.

### Why:
Councils have a statutory duty to inform electors about polling stations; this API provides a cost-free, volunteer-maintained solution used by the Electoral Commission itself.

---

## 57. ElectionGuard -- Verifiable Election Technology
An open-source SDK from the Election Technology Initiative that enables end-to-end verifiable elections, allowing voters to confirm their ballots were counted without compromising secrecy.

### Relevant for:
 - Combined authorities
 - County councils (mayoral elections)
 - All authorities running referendums

### Sources:
 - [ElectionGuard GitHub](https://github.com/Election-Tech-Initiative/electionguard)
 - [OSET Institute](https://www.osetinstitute.org/)

### Difficulty of build (10 is hard):
8/10: Cryptographic SDK requiring deep security expertise; not a standalone system but components that integrate into existing voting infrastructure; needs extensive testing.

### Why:
Provides mathematical proof that votes are counted correctly, addressing public concerns about election integrity in local referendums and mayoral elections.

---

## 58. Referendum -- Community Decision Platform
An open-source, discussion-based direct democracy platform using range voting for both comments and polls, designed for community decision-making on local issues.

### Relevant for:
 - Parish/town councils
 - Community councils
 - Neighbourhood forums
 - District councils

### Sources:
 - [Referendum GitHub](https://github.com/dessalines/referendum)
 - [SimpleVote GitHub](https://github.com/dessalines/simple-vote)

### Difficulty of build (10 is hard):
3/10: Rust/Actix backend with modern web frontend; lightweight and easy to deploy on EC2; suitable for simple community polls and neighbourhood plan referendums.

### Why:
Provides a quick, low-cost way for parish councils and neighbourhood forums to run informal polls on local issues like playground improvements or traffic calming.

---

## 59. Docling -- Document Processing and Conversion
An open-source document processing toolkit that parses diverse formats (PDF, Word, scanned documents) and converts them into accessible, machine-readable formats for citizen access.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Docling GitHub](https://github.com/docling-project/docling)

### Difficulty of build (10 is hard):
4/10: Python library with CLI; can run as a Lambda function or ECS task for batch processing; handles OCR, table extraction, and format conversion.

### Why:
Councils hold vast archives of inaccessible PDFs and scanned documents; Docling automates conversion to accessible formats, supporting FOI compliance and digital inclusion.

---

## 60. PAVE -- PDF Accessibility Validation and Enhancement
An open-source tool that validates PDF accessibility against WCAG/PDF/UA standards and automatically fixes common accessibility issues like missing tags and reading order.

### Relevant for:
 - All local authority types

### Sources:
 - [PAVE Website](https://pave-pdf.org/?lang=en)

### Difficulty of build (10 is hard):
3/10: Web-based tool; can be self-hosted as part of a document publishing pipeline; automatically remediates common PDF accessibility barriers.

### Why:
Councils publish thousands of PDFs (committee papers, planning documents, policies) that are often inaccessible; PAVE automates remediation that would otherwise cost hours per document.

---

## 61. LAUTI -- Community Event Calendar
An open-source, non-commercial community calendar platform where groups, venues, and individuals can publish events, creating a shared, ad-free local events listing.

### Relevant for:
 - Parish/town councils
 - District councils
 - Unitary authorities
 - Community councils

### Sources:
 - [LAUTI Website](https://lauti.org/)

### Difficulty of build (10 is hard):
3/10: AGPL-licensed web application; straightforward deployment; allows community groups to self-manage their event listings without council staff bottleneck.

### Why:
Replaces fragmented Facebook groups and noticeboards with a single, council-hosted community events platform that is inclusive of residents not on social media.

---

## 62. Carbone -- Document and Report Generation
An open-source template-based document generator that produces PDFs, Word documents, and spreadsheets from data and templates, enabling automated council letter and report production.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [Carbone Website](https://carbone.io/)

### Difficulty of build (10 is hard):
3/10: Node.js library with REST API; template-based approach using standard office document templates; easy to integrate with existing council systems.

### Why:
Automates repetitive document generation (council tax notices, planning decision letters, inspection reports) from templates, saving staff time and ensuring consistency.

---

## 63. GOV.UK Notify Integration -- Multi-Channel Notifications
The open-source government notification service for sending emails, SMS, and letters to citizens, free for public sector organisations with API integration and template management.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [GOV.UK Notify](https://www.notifications.service.gov.uk/)
 - [GOV.UK Notify Features](https://www.notifications.service.gov.uk/features)

### Difficulty of build (10 is hard):
2/10: API integration only; SDKs available for Python, Java, Ruby, Node.js, and .NET; no hosting cost as the service is centrally provided; templates managed via web UI.

### Why:
Free to use with no procurement process, already sending 12 billion+ messages. Councils can send bin collection reminders, planning notifications, and emergency alerts at zero marginal cost.

---

## 64. osTicket -- Citizen Complaint and Service Request Tracking
A widely-used open-source support ticket system adaptable for tracking citizen complaints, service requests, and enquiries with SLA management, auto-routing, and reporting.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [osTicket Website](https://osticket.com/)
 - [Open Source Complaint Management Systems](https://www.softwaresuggest.com/complaint-management-system/free-open-source-softwares)

### Difficulty of build (10 is hard):
3/10: PHP/MySQL application with well-documented installation; extensive plugin ecosystem; SLA rules engine handles escalation and routing for different complaint types.

### Why:
Provides transparent complaint tracking with SLA enforcement, ensuring every citizen complaint is logged, routed, escalated, and resolved within committed timescales.

---

## 65. n8n -- Workflow Automation for Council Services
A fair-code workflow automation platform with 400+ integrations and native AI capabilities, enabling councils to automate cross-system processes without vendor lock-in.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [n8n Website](https://n8n.io/)
 - [n8n GitHub](https://github.com/n8n-io/n8n)

### Difficulty of build (10 is hard):
4/10: Docker-based deployment with visual workflow editor; self-hosted option with SOC 2 compliance; connects council systems (CRM, email, databases) without custom code.

### Why:
Enables non-developers to automate repetitive cross-system tasks (e.g., FOI deadline reminders, planning application status updates, bin collection schedule changes) saving staff hours.

---

## 66. MOSIP -- Citizen Digital Identity Platform
A modular open-source identity platform funded by the Gates Foundation, enabling governments to issue and verify digital identities with biometric and document-based verification.

### Relevant for:
 - Combined authorities
 - County councils
 - Metropolitan borough councils

### Sources:
 - [MOSIP Website](https://www.mosip.io/)
 - [ID PASS](https://www.idpass.org/)

### Difficulty of build (10 is hard):
9/10: Enterprise-grade identity platform with biometric components, PKI infrastructure, and regulatory compliance requirements; designed for national-scale deployment.

### Why:
Digital identity verification is increasingly needed for online council services; an open-source approach avoids dependency on commercial identity providers.

---

## 67. RecordTrac -- Public Records Request Portal
An open-source web portal for making and managing public records requests with automatic routing, real-time status tracking, and full transparency for every request action.

### Relevant for:
 - All local authority types
 - Combined authorities

### Sources:
 - [RecordTrac on Opensource.com](https://opensource.com/government/14/5/recordtrac)
 - [Columbia Journalism Review on RecordTrac](https://www.cjr.org/united_states_project/recordtrac_making_the_foia_process_less_terrible.php)

### Difficulty of build (10 is hard):
4/10: Python/Flask application; straightforward deployment; the transparency model (every action logged publicly) may need adaptation for UK FOI/EIR legal requirements.

### Why:
Centralises FOI handling with public tracking pages for each request, reducing duplicate requests and building trust in council transparency.

---

## 68. Gibbon -- School Governor and Education Platform
A flexible, open-source school management platform supporting communication between governors, teachers, parents, and administrators with role-based access and reporting.

### Relevant for:
 - County councils (education authorities)
 - Unitary authorities
 - Metropolitan borough councils
 - London boroughs

### Sources:
 - [Gibbon Education Website](https://gibbonedu.org/)

### Difficulty of build (10 is hard):
4/10: PHP/MySQL application with Docker deployment; needs configuration for UK education context and governor-specific communication workflows.

### Why:
School governors are critical volunteers in local education; a dedicated platform improves communication, document sharing, and meeting coordination across governing bodies.

---

## 69. OpenStreetMap and HOT Tasking Manager -- Community Infrastructure Mapping
The world's largest community-created geographic dataset with a collaborative tasking manager, enabling organised community mapping of local infrastructure and assets.

### Relevant for:
 - All local authority types
 - Parish/town councils
 - Combined authorities

### Sources:
 - [OpenStreetMap](https://www.openstreetmap.org/)
 - [HOT Tasking Manager](https://www.hotosm.org/)
 - [OpenStreetMap GitHub](https://github.com/openstreetmap)

### Difficulty of build (10 is hard):
3/10: No deployment needed for data contribution; the Tasking Manager can be self-hosted for organised mapping campaigns; OSM data is freely reusable.

### Why:
Community mapping campaigns engage residents in documenting their area (accessibility features, cycle routes, heritage assets) while creating reusable open geographic data.

---

## 70. Anthias -- Raspberry Pi Digital Signage
The world's most popular open-source digital signage project, running on inexpensive Raspberry Pi hardware for community centre, library, and town hall information displays.

### Relevant for:
 - Parish/town councils
 - District councils
 - Community centres
 - Libraries

### Sources:
 - [Anthias Website](https://anthias.screenly.io/)
 - [Anthias GitHub](https://github.com/Screenly/Anthias)

### Difficulty of build (10 is hard):
2/10: Flash an SD card image onto a Raspberry Pi, connect to a screen, and configure via web interface; minimal cost (Pi + screen) and minimal maintenance.

### Why:
At under 50 GBP per display point (Pi + SD card), this is the most cost-effective way for parish councils and community centres to provide dynamic public information.

---

## Summary

This collection of 70 solutions spans the full spectrum of civic technology needs for UK local government:

- **Democratic participation**: Consul, Decidim, Loomio, DemocracyOS, Your Priorities, Pol.is, e-Petitions, Belenios, Referendum, Stanford PB, ElectionGuard
- **Transparency and accountability**: CKAN, TheyWorkForYou, OpenCouncil, Visual Town Budget, Alaveteli, RecordTrac, ArkCase, Democracy Club
- **Citizen reporting and services**: FixMyStreet, Open311, Ushahidi, osTicket, Chatwoot, Rasa, Easy!Appointments, BC Queue Management
- **Digital inclusion and accessibility**: Moodle, Kolibri, NVDA, Pa11y, Axe-core, Tanaguru, PAVE, sign.mt, GenASL, LibreTranslate, Simply Readable
- **Community engagement**: Discourse, Make Place, Mapeo, LAUTI, Goteo, Open Collective, OpenStreetMap, PlanningAlerts
- **Council operations**: LocalGov Drupal, CiviCRM, n8n, Matomo, Metabase, Carbone, Docassemble, formsflow.ai, GOV.UK Notify, Jitsi, 4Minitz, OpenProject, Xibo, Anthias, Gibbon, QGIS, Docling
- **Volunteering and community assets**: OpenVolunteerPlatform, Coalesce, ORServices, MOSIP

All are free/open-source and deployable on AWS infrastructure (EC2, ECS/Fargate, RDS, S3, Lambda, or as containerised workloads).