Now I have enough research to compile a comprehensive list. Let me produce the final output.

Here are **35 unique ideas** for ISB blueprint scenarios covering Education, Libraries, Leisure, Parks, and Community Services for UK councils:

---

**1. Koha Library Management System on AWS**
- **Description:** Deploy Koha, the world's first open-source integrated library system, on AWS using pre-built AMIs and CloudFormation. Provides cataloguing, circulation, acquisitions, serials management, and patron self-service for public libraries.
- **Relevant for:** All councils with library services (county, unitary, metropolitan borough, London borough)
- **Source:** [Koha on AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-ks6dw2ppvgskk), [GitHub](https://github.com/Koha-community/Koha), [KohaSupport](https://kohasupport.com/)
- **Difficulty:** 3
- **Why:** Koha already has AWS AMIs and CloudFormation templates, making it one of the easiest library scenarios to package as a blueprint.

---

**2. Evergreen ILS on Containerised AWS Infrastructure**
- **Description:** Deploy the Evergreen Integrated Library System using Docker containers on ECS Fargate, with RDS PostgreSQL backend. Evergreen is built for large-scale consortia and supports multi-branch library networks with advanced cataloguing and circulation.
- **Relevant for:** County councils, large unitary authorities managing multiple library branches
- **Source:** [Evergreen ILS](https://evergreen-ils.org/), [Docker Image](https://hub.docker.com/r/mobiusoffice/evergreen-ils), [GitHub](https://github.com/evergreen-library-system/Evergreen)
- **Difficulty:** 6
- **Why:** Multi-branch library networks need robust ILS systems, and Evergreen's Docker support makes containerised AWS deployment feasible.

---

**3. Libki Public PC Booking & Kiosk Management**
- **Description:** Deploy Libki, an open-source computer reservation and time management system designed for library public access PCs. Provides web-based admin, time-limited sessions, reservations, and usage reporting. Run on EC2 or ECS with RDS MySQL.
- **Relevant for:** All councils with public library PC suites
- **Source:** [Libki](https://libki.org/), [GitHub](https://github.com/Libki)
- **Difficulty:** 4
- **Why:** Every public library in England provides free PC access, and Libki directly addresses the need for session management and booking without expensive proprietary software.

---

**4. Library Simplified / SimplyE Digital Lending Platform**
- **Description:** Deploy the open-source Library Simplified Circulation Manager on AWS to provide a unified e-book and audiobook lending interface across multiple content providers. Includes patron authentication, DRM management, and a mobile-friendly reading experience.
- **Relevant for:** All councils with library services commissioning e-lending
- **Source:** [Library Simplified](https://librarysimplified.org/), [GitHub](https://github.com/NYPL-Simplified)
- **Difficulty:** 7
- **Why:** UK public libraries spend millions on e-lending platforms like BorrowBox; an open-source alternative could significantly reduce costs and increase digital inclusion.

---

**5. LibreBooking Room & Resource Scheduling for Libraries and Community Centres**
- **Description:** Deploy LibreBooking, an open-source resource scheduling platform, to manage meeting room hire, study space reservations, and equipment loans across libraries and community centres. Mobile-friendly interface with calendar views and approval workflows.
- **Relevant for:** All councils managing bookable community spaces
- **Source:** [GitHub](https://github.com/LibreBooking/app)
- **Difficulty:** 3
- **Why:** Room booking is one of the most common council digital services, and LibreBooking's mature codebase with Docker support makes for a quick deployment.

---

**6. Gibbon School Management Platform**
- **Description:** Deploy Gibbon, a flexible open-source school management platform, on AWS using Docker with RDS MySQL. Covers admissions, student records, attendance tracking, timetabling, grade books, behaviour tracking, and parent/teacher communication.
- **Relevant for:** Academy trusts, free schools, local authority maintained schools, education departments
- **Source:** [Gibbon](https://gibbonedu.org/), [GitHub](https://github.com/GibbonEdu/core), [Docker](https://github.com/matiaspagano/gibbon-docker)
- **Difficulty:** 4
- **Why:** Gibbon's comprehensive feature set with Docker deployment support and auto-installation makes it an excellent school administration platform for councils to evaluate.

---

**7. School Attendance Data Dashboard (DfE Pattern)**
- **Description:** Build a serverless school attendance monitoring dashboard using the DfE's open-source attendance data dashboard as a reference. Use Lambda, DynamoDB, and QuickSight to visualise daily attendance, persistent absence, and trends across a local authority's schools.
- **Relevant for:** County councils, unitary authorities, metropolitan boroughs (education functions)
- **Source:** [DfE attendance-data-dashboard](https://github.com/dfe-analytical-services/attendance-data-dashboard), [GOV.UK guidance](https://www.gov.uk/government/publications/monitor-your-school-attendance-user-guide)
- **Difficulty:** 5
- **Why:** The DfE now requires daily attendance data sharing; councils need local dashboards to identify and intervene on persistent absence early.

---

**8. SEND EHC Plan Case Management Workflow**
- **Description:** Build a serverless SEND case management system using Step Functions for EHC plan workflow orchestration (20-week statutory timeline), DynamoDB for case data, S3 for document storage, and Cognito for multi-agency access (education, health, social care). GOV.UK-styled frontend.
- **Relevant for:** County councils, unitary authorities, metropolitan boroughs (all with SEND responsibilities)
- **Source:** [AWS Step Functions human approval pattern](https://docs.aws.amazon.com/step-functions/latest/dg/tutorial-human-approval.html), [aws-samples/contact-form-processing](https://github.com/aws-samples/contact-form-processing-with-synchronous-express-workflows)
- **Difficulty:** 8
- **Why:** SEND is the single biggest area of council overspend nationally; automating the 20-week EHC assessment timeline with proper multi-agency workflow would be transformational.

---

**9. Free School Meals Eligibility Self-Service Checker**
- **Description:** Build a GOV.UK-styled serverless eligibility checker using API Gateway, Lambda, and Step Functions that allows parents to check FSM eligibility based on benefit criteria. Integrates with the DfE's Eligibility Checking Service API. Frontend hosted on S3/CloudFront.
- **Relevant for:** County councils, unitary authorities, metropolitan boroughs, London boroughs
- **Source:** [DfE ECS](https://fsm.education.gov.uk/fsm.laportal/), [LGfL FSM Checker](https://pps.lgfl.org.uk/), [aws-samples form handler](https://github.com/jbesw/aws-serverless-form-handler)
- **Difficulty:** 6
- **Why:** Automating FSM eligibility checking is a government priority with the push for auto-enrolment; a self-service tool reduces administrative burden and increases take-up.

---

**10. School Transport Route Optimisation Platform**
- **Description:** Adapt the open-source BusPlan route optimiser using OpenTripPlanner and OptaPlanner to optimise home-to-school transport routes. Deploy on AWS with ECS for the route engine, RDS PostgreSQL/PostGIS for spatial data, and a web frontend for route management.
- **Relevant for:** County councils, unitary authorities (home-to-school transport duty)
- **Source:** [BusPlan](https://github.com/azavea/bus-plan), [OpenTripPlanner](https://www.opentripplanner.org/)
- **Difficulty:** 8
- **Why:** Home-to-school transport is one of the fastest-growing cost pressures on councils, with some spending over 50 million pounds annually; even small optimisation savings are significant.

---

**11. AI-Powered Educational Content Generator with Q&A Bot**
- **Description:** Deploy the AWS sample that uses Amazon Bedrock to automatically generate structured course materials (outlines, content, quizzes) and provides students with an AI chatbot for course-related queries. Fully serverless with CDK deployment.
- **Relevant for:** Education departments, schools, academy trusts, adult learning services
- **Source:** [GitHub](https://github.com/aws-samples/educational-course-content-generator-with-qna-bot-using-bedrock)
- **Difficulty:** 4
- **Why:** An official AWS sample with CDK deployment makes this straightforward to package, and it demonstrates practical AI use in education for resource-stretched teachers.

---

**12. Leisure Centre & Sports Facility Booking Platform**
- **Description:** Build a serverless booking platform using API Gateway, Lambda, DynamoDB, and Cognito for leisure centre class booking, court/pitch hire, and membership management. Includes payment integration via Stripe, calendar views, and waitlist management.
- **Relevant for:** District councils, unitary authorities, parish/town councils operating leisure facilities
- **Source:** [GYM One](https://github.com/mayerbalintdev/GYM-One), [Swimming Pool Reservation](https://github.com/shehand/swimming-pool-res), [AWS SAGA booking pattern](https://cdkpatterns.com/)
- **Difficulty:** 7
- **Why:** Many councils are bringing leisure services back in-house and need affordable digital booking systems to replace expensive incumbent platforms like Legend or Gladstone.

---

**13. Swimming Lesson Management & Progression Tracking**
- **Description:** Build a serverless application for managing swimming lesson programmes including class scheduling, pupil progression through Learn to Swim stages, instructor allocation, waiting list management, and parent communication. Uses DynamoDB, Lambda, and SES for notifications.
- **Relevant for:** District councils, unitary authorities, town councils operating swimming pools
- **Source:** [Fitness Class Booking System](https://github.com/Gunjan1116/Fitness-Class-Booking-System), [Classroom Bookings](https://github.com/classroombookings/classroombookings)
- **Difficulty:** 6
- **Why:** Swimming lessons are the highest-revenue programme for most council leisure centres; better digital management directly improves retention and income.

---

**14. OpenTreeMap Urban Tree Inventory & Management**
- **Description:** Deploy OpenTreeMap on AWS for crowdsourced tree inventory, ecosystem services calculations, and urban forestry analysis. Uses EC2/ECS with PostGIS and GeoServer for spatial data, S3 for imagery, and provides public-facing maps showing tree locations, species, and carbon sequestration data.
- **Relevant for:** All councils with tree management responsibilities (district, county, unitary, London borough, metropolitan borough)
- **Source:** [OpenTreeMap](https://opentreemap.github.io/), [GitHub](https://github.com/OpenTreeMap/otm-core)
- **Difficulty:** 6
- **Why:** Councils have a statutory duty to manage trees, and post-Ash Dieback the need for comprehensive tree inventories has never been greater.

---

**15. Playground Inspection & Asset Tracking System**
- **Description:** Build a mobile-first field inspection application using ODK (Open Data Kit) for data collection on Android devices, with AWS backend (API Gateway, Lambda, S3, DynamoDB) for storing inspection records, photos, and condition assessments. Includes dashboards for compliance tracking and maintenance scheduling.
- **Relevant for:** District councils, parish/town councils, unitary authorities managing playgrounds
- **Source:** [ODK](https://getodk.org/), [AWS IoT asset management](https://aws.amazon.com/solutions/iot/asset-management/)
- **Difficulty:** 6
- **Why:** Councils face legal liability for playground safety; digital inspection tracking replaces error-prone paper systems and provides audit trails for insurance purposes.

---

**16. Sunrise Cemetery Management System on AWS**
- **Description:** Deploy Sunrise CMS, the open-source web-based cemetery management application, on AWS. Manages burial records, plot allocation, memorial permits, deed management, and public genealogy searches. Containerised deployment on ECS with RDS.
- **Relevant for:** District councils, parish/town councils, unitary authorities, metropolitan boroughs
- **Source:** [Sunrise CMS](https://github.com/cityssm/sunrise-cms)
- **Difficulty:** 4
- **Why:** Many councils still manage cemetery records on paper or aging spreadsheets; Sunrise was built by a Canadian municipality specifically for this purpose.

---

**17. Decidim Participatory Democracy & Community Consultation Platform**
- **Description:** Deploy Decidim, the open-source participatory democracy framework used by 250+ cities worldwide, on AWS using Elastic Beanstalk or ECS. Supports public consultations, participatory budgeting, citizen proposals, community assemblies, and digital voting on local issues.
- **Relevant for:** All councils undertaking public consultation
- **Source:** [Decidim](https://decidim.org/), [GitHub](https://github.com/decidim/decidim), [AWS deployment guide](https://github.com/Platoniq/decidim-install)
- **Difficulty:** 5
- **Why:** Councils spend heavily on consultation platforms like Citizen Space and Commonplace; Decidim is proven at scale by Barcelona and offers identical features for free.

---

**18. Omeka Digital Collections & Exhibition Platform for Museums**
- **Description:** Deploy Omeka S on AWS for managing and publishing museum collections, archive catalogues, and digital exhibitions online. Uses EC2/ECS with RDS MySQL and S3 for media storage. Supports Dublin Core metadata, IIIF image serving, and customisable exhibition themes.
- **Relevant for:** County councils, unitary authorities, district councils operating museums and heritage services
- **Source:** [Omeka](https://omeka.org/), [GitHub](https://github.com/omeka/omeka-s)
- **Difficulty:** 4
- **Why:** Many council museums have thousands of uncatalogued items; Omeka provides a standards-compliant platform for digitisation without the cost of proprietary collection management systems.

---

**19. AtoM Archives & Records Access Platform**
- **Description:** Deploy Access to Memory (AtoM) on AWS for managing archival descriptions using international standards (ISAD(G), ISAAR). Provides public discovery interface, hierarchical descriptions, digital object management, and authority records. Docker deployment on ECS with RDS MySQL.
- **Relevant for:** County councils, London boroughs, metropolitan boroughs with archive services
- **Source:** [AtoM](https://www.accesstomemory.org/), [GitHub](https://github.com/artefactual/atom), [Docker Compose docs](https://www.accesstomemory.org/en/docs/2.9/dev-manual/env/compose/)
- **Difficulty:** 5
- **Why:** The National Archives requires local authority record offices to use archival standards; AtoM is the leading open-source platform purpose-built for this requirement.

---

**20. Arches Heritage Asset Management Platform**
- **Description:** Deploy Arches, the open-source heritage data management platform developed by the Getty Conservation Institute and used by Historic England for the Greater London Historic Environment Record. Manages listed buildings, conservation areas, scheduled monuments, and archaeological sites with full GIS integration.
- **Relevant for:** County councils, unitary authorities, district councils (conservation and planning functions)
- **Source:** [Arches Project](https://www.archesproject.org/), [GitHub](https://github.com/archesproject/arches)
- **Difficulty:** 7
- **Why:** Historic England already uses Arches for the London HER; offering it as a blueprint would give smaller councils access to the same enterprise-grade heritage management platform.

---

**21. MRBS Meeting Room Booking System for Council Offices**
- **Description:** Deploy the Meeting Room Booking System (MRBS) on AWS for managing bookable spaces across council offices, including hot-desking, meeting rooms, and shared facilities. Containerised deployment with RDS backend and LDAP/Active Directory integration for staff authentication.
- **Relevant for:** All councils managing office estate
- **Source:** [MRBS](https://github.com/meeting-room-booking-system/mrbs-code)
- **Difficulty:** 3
- **Why:** Post-COVID hybrid working has made room booking essential for every council; MRBS is mature, battle-tested, and trivially simple to deploy.

---

**22. OpenVolunteerPlatform for Community Volunteering Coordination**
- **Description:** Deploy the OpenVolunteerPlatform for managing volunteer recruitment, assignment, scheduling, and communication. Features GraphQL backend, offline-capable client (Offix), and SSO authentication. Deploy on AWS with AppSync, DynamoDB, and Cognito.
- **Relevant for:** All councils with community development and volunteering functions
- **Source:** [GitHub](https://github.com/aerogear/OpenVolunteerPlatform)
- **Difficulty:** 5
- **Why:** Council volunteering programmes (libraries, parks friends groups, community responders) are growing rapidly and need proper coordination platforms beyond spreadsheets.

---

**23. Gandhi Open-Source Grants Management System**
- **Description:** Deploy Gandhi, the open-source grants management platform, for managing community grants applications, assessment, award, and monitoring. Built with Node.js, uses RethinkDB and Redis. Supports configurable application forms, reviewer workflows, and reporting.
- **Relevant for:** All councils administering community grants, arts funding, or neighbourhood funds
- **Source:** [GitHub](https://github.com/mike-marcacci/gandhi)
- **Difficulty:** 5
- **Why:** Most councils administer multiple grant schemes (community, arts, neighbourhood) using manual processes; a purpose-built platform improves transparency and reduces administration.

---

**24. Hi.Events Community Events & Ticketing Platform**
- **Description:** Deploy Hi.Events, an open-source event management and ticketing platform, for council-run events including festivals, exhibitions, community workshops, and sports events. Self-hosted on AWS with ECS, RDS, and S3. Supports ticket sales, attendee management, and event promotion.
- **Relevant for:** All councils running public events (district, unitary, parish, town)
- **Source:** [Hi.Events](https://hi.events/open-source-event-ticketing), [GitHub](https://github.com/HiEventsDev/Hi.Events)
- **Difficulty:** 4
- **Why:** Councils pay significant commissions to Eventbrite and similar platforms for community events; a self-hosted alternative eliminates per-ticket fees entirely.

---

**25. AWS Bedrock RAG Knowledge Base for Council Policy Q&A**
- **Description:** Deploy the AWS Bedrock RAG sample to create an AI-powered question-answering system for council policy documents, committee reports, planning guidance, and service information. Citizens and staff can ask natural language questions and get sourced answers. Fully serverless CDK deployment.
- **Relevant for:** All councils
- **Source:** [amazon-bedrock-rag](https://github.com/aws-samples/amazon-bedrock-rag), [Bedrock Chat](https://github.com/aws-samples/bedrock-chat), [RAG CDK blog](https://aws.amazon.com/blogs/machine-learning/build-an-end-to-end-rag-solution-using-knowledge-bases-for-amazon-bedrock-and-the-aws-cdk/)
- **Difficulty:** 4
- **Why:** Councils publish thousands of pages of policy and guidance that residents struggle to navigate; RAG-powered Q&A transforms access to information and reduces contact centre volume.

---

**26. Citizen Damage Reporting with AI Image Classification**
- **Description:** Deploy the AWS sample that allows citizens to submit photos of damaged public property (potholes, broken playground equipment, graffiti, fly-tipping) through a mobile web app. Uses Rekognition for automatic damage classification and routes reports to the appropriate council department.
- **Relevant for:** All councils with environmental maintenance and highways responsibilities
- **Source:** [aws-serverless-deep-learning-suggestions](https://github.com/aws-samples/aws-serverless-deep-learning-suggestions)
- **Difficulty:** 5
- **Why:** An official AWS sample specifically designed for government damage reporting, demonstrating practical AI use for citizen service improvement.

---

**27. GeoNature Biodiversity & Nature Reserve Management**
- **Description:** Deploy GeoNature, the open-source biodiversity data management platform, on AWS for managing species records, habitat surveys, and protected site monitoring across council-managed nature reserves, SSSIs, and local wildlife sites. Includes mobile field recording, spatial analysis, and reporting.
- **Relevant for:** County councils, unitary authorities, district councils with nature reserve responsibilities
- **Source:** [GeoNature](https://github.com/PnX-SI/GeoNature), [Indicia wildlife recording](https://www.gbif.org/tool/81491/indicia-the-open-source-wildlife-recording-toolkit)
- **Difficulty:** 7
- **Why:** The Environment Act 2021 requires councils to achieve Biodiversity Net Gain; proper species and habitat data management is now a legal necessity.

---

**28. Allotment Management & Waiting List System**
- **Description:** Build a serverless allotment management system with DynamoDB, Lambda, API Gateway, and SES for managing plot allocation, tenant records, rent collection, waiting lists, and vacancy notifications. GOV.UK-styled self-service portal for residents to join waiting lists and manage their tenancy.
- **Relevant for:** District councils, parish/town councils, unitary authorities
- **Source:** [GOV.UK Apply for an allotment](https://www.gov.uk/apply-allotment), [AWS serverless form handler](https://github.com/jbesw/aws-serverless-form-handler)
- **Difficulty:** 5
- **Why:** Allotment waiting lists of 5+ years are common across the UK; digital management with automated notifications improves fairness and reduces administration.

---

**29. Smart Building Energy & Environmental Monitoring for Council Estate**
- **Description:** Deploy the AWS Smart and Sustainable Buildings guidance to monitor energy consumption, temperature, CO2, and humidity across council buildings using IoT sensors. Uses IoT Core, Lambda, Timestream, and Managed Grafana for real-time dashboards and automated environmental controls.
- **Relevant for:** All councils managing property estate (offices, leisure centres, libraries, community centres)
- **Source:** [AWS Smart Buildings Guidance](https://github.com/aws-solutions-library-samples/guidance-for-smart-and-sustainable-buildings-on-aws), [IoT energy monitoring](https://github.com/aws-samples/iot-x-energy-monitoring)
- **Difficulty:** 6
- **Why:** Councils have net-zero targets and rising energy costs; IoT monitoring provides the data foundation for reducing emissions and energy spend across the estate.

---

**30. CiviCRM Constituent Relationship Management for Community Services**
- **Description:** Deploy CiviCRM on AWS for managing citizen interactions, case tracking, event management, mailing lists, and community group relationships. Integrates with WordPress or Drupal CMS. Containerised deployment on ECS with RDS MySQL.
- **Relevant for:** All councils with community development, outreach, or voluntary sector liaison functions
- **Source:** [CiviCRM](https://civicrm.org/), [GitHub](https://github.com/civicrm/civicrm-core)
- **Difficulty:** 5
- **Why:** CiviCRM is the most widely deployed open-source CRM for the public and third sector, with proven case management capabilities that map directly to council community services.

---

**31. OSCaR Youth Services Case Management**
- **Description:** Deploy OSCaR (Open Source Case management and Record keeping) on AWS for managing youth services caseloads including youth offending, targeted youth support, NEET tracking, and early help. Includes assessment tools, action planning, outcome tracking, and multi-agency information sharing.
- **Relevant for:** County councils, unitary authorities, metropolitan boroughs (youth services)
- **Source:** [OSCaR](https://oscarhq.com/), [GitHub](https://github.com/Children-in-Families/oscar-web)
- **Difficulty:** 6
- **Why:** Youth services have been severely cut across councils; an affordable case management system helps remaining teams work more effectively with vulnerable young people.

---

**32. Serverless Document Processing Pipeline for Council Post**
- **Description:** Deploy the AWS Textract serverless document processing sample to digitise and classify incoming council correspondence, planning applications, FOI requests, and complaints. Uses Textract for OCR, Comprehend for classification, Step Functions for routing, and DynamoDB for metadata storage.
- **Relevant for:** All councils processing paper correspondence and applications
- **Source:** [Textract large-scale processing](https://github.com/aws-samples/amazon-textract-serverless-large-scale-document-processing), [Textract + Comprehend + Step Functions](https://github.com/aws-samples/amazon-textract-comprehend-stepfunctions-example)
- **Difficulty:** 5
- **Why:** Official AWS samples with CDK that directly address the council challenge of digitising and routing the thousands of documents received daily.

---

**33. IIIF Digital Image Viewer for Heritage Collections**
- **Description:** Build a serverless IIIF (International Image Interoperability Framework) image serving platform using S3 for image storage, Lambda for IIIF Image API compliance, CloudFront for delivery, and Mirador as the open-source viewer. Enables museums and archives to publish high-resolution zoomable images of collections online.
- **Relevant for:** County councils, London boroughs, metropolitan boroughs with museum and archive collections
- **Source:** [Mirador](https://projectmirador.org/), [IIIF](https://iiif.io/), [GitHub](https://github.com/IIIF/awesome-iiif)
- **Difficulty:** 5
- **Why:** IIIF is the international standard for sharing cultural heritage images; a serverless implementation makes it affordable for councils with small museum services.

---

**34. Parks & Open Spaces GIS Asset Register**
- **Description:** Build a serverless geospatial asset register using Amazon Location Service, DynamoDB, Lambda, and a React frontend for mapping and managing council parks assets including benches, bins, paths, sports pitches, flower beds, and water features. Mobile field workers update asset condition via a Progressive Web App.
- **Relevant for:** District councils, unitary authorities, parish/town councils managing open spaces
- **Source:** [AWS geospatial sample](https://github.com/aws-samples/sample-geospatial-generative-ai), [Amazon Location Service](https://aws.amazon.com/location/)
- **Difficulty:** 7
- **Why:** Most councils lack a comprehensive spatial register of parks assets; this directly supports maintenance scheduling, capital planning, and Green Flag Award applications.

---

**35. Community Asset Transfer Register & Application Portal**
- **Description:** Build a GOV.UK-styled self-service portal using API Gateway, Lambda, DynamoDB, S3, and Step Functions for community groups to browse available council assets, submit transfer applications, and track progress. Includes officer assessment workflows, committee approval stages, and public register of transferred assets.
- **Relevant for:** All councils managing community asset transfers (particularly in Scotland where registers are mandatory)
- **Source:** [Community Asset Transfer guidance](https://mycommunity.org.uk/an-overview-of-community-asset-transfer-cat), [AWS contact form processing sample](https://github.com/aws-samples/contact-form-processing-with-synchronous-express-workflows)
- **Difficulty:** 6
- **Why:** The Localism Act 2011 gives communities the right to bid for council assets, but most councils manage the process manually; a digital portal improves transparency and speeds up transfers.

---

Sources used across this research:
- [Koha on AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-ks6dw2ppvgskk)
- [Koha Installation Guide on AWS](https://blog.fastcurveservices.com/koha-installation-guide-on-aws/)
- [Evergreen ILS](https://evergreen-ils.org/)
- [Evergreen Docker](https://hub.docker.com/r/mobiusoffice/evergreen-ils)
- [Libki Kiosk Management](https://libki.org/)
- [Library Simplified](https://librarysimplified.org/)
- [LibreBooking](https://github.com/LibreBooking/app)
- [Gibbon Education](https://gibbonedu.org/)
- [DfE attendance dashboard](https://github.com/dfe-analytical-services/attendance-data-dashboard)
- [DfE Digital GitHub](https://github.com/dfe-digital)
- [AWS Step Functions human approval](https://docs.aws.amazon.com/step-functions/latest/dg/tutorial-human-approval.html)
- [LGfL FSM Checker](https://pps.lgfl.org.uk/)
- [BusPlan](https://github.com/azavea/bus-plan)
- [OpenTripPlanner](https://www.opentripplanner.org/)
- [AWS educational content generator](https://github.com/aws-samples/educational-course-content-generator-with-qna-bot-using-bedrock)
- [GYM One](https://github.com/mayerbalintdev/GYM-One)
- [OpenTreeMap](https://github.com/OpenTreeMap/otm-core)
- [ODK](https://getodk.org/)
- [Sunrise CMS](https://github.com/cityssm/sunrise-cms)
- [Decidim](https://decidim.org/)
- [Omeka](https://omeka.org/)
- [AtoM](https://www.accesstomemory.org/)
- [Arches Project](https://www.archesproject.org/)
- [MRBS](https://github.com/meeting-room-booking-system/mrbs-code)
- [OpenVolunteerPlatform](https://github.com/aerogear/OpenVolunteerPlatform)
- [Gandhi grants](https://github.com/mike-marcacci/gandhi)
- [Hi.Events](https://github.com/HiEventsDev/Hi.Events)
- [AWS Bedrock RAG](https://github.com/aws-samples/amazon-bedrock-rag)
- [AWS damage reporting](https://github.com/aws-samples/aws-serverless-deep-learning-suggestions)
- [GeoNature](https://github.com/PnX-SI/GeoNature)
- [AWS Smart Buildings](https://github.com/aws-solutions-library-samples/guidance-for-smart-and-sustainable-buildings-on-aws)
- [CiviCRM](https://civicrm.org/)
- [OSCaR](https://github.com/Children-in-Families/oscar-web)
- [AWS Textract processing](https://github.com/aws-samples/amazon-textract-serverless-large-scale-document-processing)
- [Mirador IIIF viewer](https://projectmirador.org/)
- [Amazon Location Service](https://aws.amazon.com/location/)
- [AWS contact form processing](https://github.com/aws-samples/contact-form-processing-with-synchronous-express-workflows)