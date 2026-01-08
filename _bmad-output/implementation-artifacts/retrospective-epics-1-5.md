# Sprint Retrospective: Epics 1-5

**Date:** 2026-01-02
**Project:** NDX Try AWS Scenarios - LocalGov Drupal AI Demo
**Completed Epics:** 1, 2, 3, 4, 5

## Summary

Epics 1-5 delivered a fully functional AI-enhanced LocalGov Drupal demonstration environment deployed on AWS. The system includes dynamic council generation, AI-powered content editing, accessibility enhancements, and guided walkthrough experiences.

## Completed Features

### Epic 1: Deployable LocalGov Drupal Foundation
- **12 stories completed**
- AWS CDK infrastructure with VPC, ALB, ECS Fargate, RDS Aurora, EFS
- Docker container with LocalGov Drupal 11.x
- Automated Drupal initialization with WaitCondition
- Demo banner module for fictional council disclosure
- First-login welcome experience with guided tour

### Epic 2: Guided Walkthrough Experience
- **10 stories completed**
- Portal scenario landing pages
- Deployment progress and credentials components
- Walkthrough overlay system in Drupal
- Progress tracking system
- Playwright screenshot foundation
- Basic evidence pack generation

### Epic 3: AI-Powered Content Editing
- **8 stories completed**
- ndx_aws_ai module with AWS SDK integration
- Amazon Bedrock service (Nova Pro/Lite models)
- AI toolbar buttons via form_alter hook
- AI Writing Assistant dialog with prompt templates
- Readability Simplification with reading age targeting
- AI preview modal with diff highlighting

### Epic 4: AI Accessibility Enhancements
- **9 stories completed**
- Amazon Polly TTS with 7 language neural voices
- Amazon Translate for 75+ languages
- Amazon Textract document extraction
- Nova 2 Omni vision service for image analysis
- Automatic alt text generation on media upload
- Listen to Page TTS button
- Content Translation widget
- PDF-to-Web conversion

### Epic 5: Dynamic Council Generation
- **10 stories completed (1 optional backlog)**
- Council identity generator with realistic names/descriptions
- Content generation orchestrator with template system
- Image specification collector
- Batch image generation via Nova Canvas
- Drush command with 5-phase execution
- Navigation menu configuration
- Homepage views and blocks (services, news, quick actions)

## What Went Well

1. **AWS SDK Integration**: Clean service architecture with proper dependency injection, rate limiting, and error handling.

2. **Form_alter Approach**: Pivoting from CKEditor5 plugin (requiring webpack) to form_alter approach was pragmatic and delivered the same UX.

3. **Code Quality**: Consistent use of PHP 8.1+ features, proper typing, interfaces, and value objects.

4. **Image Generation**: Nova Canvas integration produced high-quality heraldic council logos and service images.

5. **Infrastructure as Code**: CDK constructs are modular and reusable with proper security configurations.

## Challenges Encountered

1. **CKEditor5 ES Modules**: Initial attempt to create a CKEditor5 plugin failed because it requires webpack bundling not available in the container build. Solution: Used form_alter approach instead.

2. **ECS Task Definition Updates**: New Docker images weren't automatically picked up due to pinned digest references. Solution: Force new deployment via CDK or ECS update-service.

3. **LocalGov Drupal Views**: Finding correct view IDs and display IDs for programmatic block creation required investigation of the admin interface.

4. **Block Placement**: Understanding LocalGov theme regions and visibility conditions for homepage-only blocks.

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Form_alter over CKEditor5 plugin | Avoids webpack build complexity, provides equivalent UX |
| Nova Canvas over Titan Image | Better quality for heraldic/artistic images |
| Nova Pro/Lite over Claude | AWS-native, simpler IAM, sufficient for content tasks |
| Service/Interface pattern | Clean testability, mockable dependencies |
| Value objects for results | Immutable, type-safe return values |

## Metrics

| Metric | Value |
|--------|-------|
| Total Stories Completed | 49 |
| Epics Completed | 5 |
| PHP Services Created | 15+ |
| JavaScript Components | 8 |
| AWS Services Integrated | Bedrock, Polly, Translate, Textract, S3, ECS, RDS, EFS |
| Generated Content (per council) | ~42 pages, ~27 images |

## Recommendations for Epic 6

1. **Integration Testing**: Add Playwright tests for AI features to catch regressions.

2. **Error Messaging**: Improve user-facing error messages when AWS services fail.

3. **Loading States**: Add better loading indicators for AI operations.

4. **Screenshot Pipeline**: Automate screenshot capture for all AI feature demonstrations.

5. **Evidence Pack**: Include AI interaction examples in PDF export.

## Action Items

- [ ] Consider adding unit tests for JavaScript components
- [ ] Document AWS service quotas and costs
- [ ] Add monitoring/alerting for AI service failures
- [ ] Review Bedrock model costs and consider caching strategies

## Team Notes

The AI-enhanced LocalGov Drupal demonstration is feature-complete for the core MVP. Epic 6 focuses on polish, integration testing, and enhanced documentation. The system is deployed and validated at:

**URL:** http://ndxdrupal-alb-production-1636052025.us-east-1.elb.amazonaws.com

---

*Retrospective completed: 2026-01-02*
