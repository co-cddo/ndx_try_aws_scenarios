# AI-Enhanced LocalGov Drupal on AWS - Architecture

## Executive Summary

This architecture defines the **LocalGov Drupal** scenario for NDX:Try AWS Scenarios - a flagship demonstration of 7 AWS AI services integrated into UK council content management. The architecture enables one-click deployment of a fully functional LocalGov Drupal CMS with dynamically generated unique council content, all running on serverless AWS infrastructure.

**Key Characteristics:**
- **Infrastructure as Code**: CDK (TypeScript) synthesized to CloudFormation
- **Serverless**: Aurora Serverless v2, Fargate, scale-to-zero capable
- **AI-Native**: 7 AI features via Amazon Bedrock (Nova 2), Polly, Translate, Rekognition, Textract
- **Open Source**: Container images on ghcr.io, full codebase on GitHub
- **Cost-Optimized**: <$2 per 90-minute demo session

---

## Decision Summary

| Category | Decision | Rationale |
|----------|----------|-----------|
| **I1: IaC Approach** | CDK (TypeScript) → CloudFormation | Type safety, better DX, synthesize for distribution |
| **I2: Stack Structure** | CDK Constructs → single stack | Organized code, simple deployment |
| **I3: VPC** | Default VPC, single AZ | Fast deployment, no NAT costs, adequate for demo |
| **I4: Container Source** | ghcr.io direct pull | Open source, no ECR setup needed |
| **A1: Initialization** | Entrypoint + WaitCondition + status page | Clear progress, stack complete = ready |
| **A2: AI Integration** | Native Drupal modules | Leverage ecosystem, single codebase |
| **A3: Content Timing** | Images specified throughout, batch at end | Context-aware generation |
| **A4: Database Setup** | Drush + DeploymentMode + ECS Exec | Dev flexibility, production reliability |
| **S1: AI Models** | Nova 2 Pro/Lite/Omni | Latest models, no fallback needed |
| **S2: Image Generation** | Nova 2 Omni with style consistency | Built-in image gen, character consistency |
| **S3: Alt-text** | Nova 2 Omni vision | Natural language descriptions |
| **S4: TTS** | Polly Neural, 7 languages | British voices, multilingual UK councils |
| **P1: Screenshots** | New Playwright pipeline | Fresh approach for Drupal UI |
| **P2: Scenario Pages** | New enhanced template | Flagship quality |
| **P3: Deployment** | Existing NDX:Try system | Proven infrastructure |

---

## Project Structure

```
cloudformation/scenarios/localgov-drupal/
├── cdk/                                # Infrastructure as Code
│   ├── bin/
│   │   └── app.ts                      # CDK app entry point
│   ├── lib/
│   │   ├── localgov-drupal-stack.ts    # Main stack
│   │   └── constructs/
│   │       ├── networking.ts           # Security groups
│   │       ├── database.ts             # Aurora Serverless v2
│   │       ├── storage.ts              # EFS, S3
│   │       ├── compute.ts              # Fargate, ALB
│   │       └── outputs.ts              # CloudFormation outputs
│   ├── package.json
│   ├── tsconfig.json
│   └── cdk.json
│
├── docker/                             # Container image
│   ├── Dockerfile
│   ├── entrypoint.sh                   # Init + service startup
│   ├── config/
│   │   ├── php.ini
│   │   ├── nginx.conf
│   │   └── drupal.settings.php
│   └── scripts/
│       ├── init-drupal.sh              # Drush commands
│       ├── wait-for-db.sh              # Aurora readiness
│       └── status-page.php             # Progress display
│
├── drupal/                             # Drupal codebase
│   ├── composer.json
│   ├── composer.lock
│   ├── config/sync/                    # Exported Drupal config
│   ├── web/
│   │   ├── modules/custom/
│   │   │   ├── ndx_aws_ai/             # AI service integration
│   │   │   ├── ndx_council_generator/  # Content generation
│   │   │   └── ndx_demo_banner/        # Demo warning banner
│   │   └── themes/custom/
│   │       └── ndx_localgov/           # Theme customizations
│   └── drush/
│
├── tests/                              # Scenario tests
│   ├── cdk/                            # CDK snapshot tests
│   ├── drupal/                         # PHP unit tests
│   └── playwright/                     # E2E screenshot tests
│
├── template.yaml                       # Synthesized CloudFormation
└── README.md

src/scenarios/localgov-drupal/          # Portal pages
├── index.njk
├── walkthrough.njk
├── architecture.njk
├── explore.njk
├── experiment.njk
├── understand.njk
├── extend.njk
├── _data/localgov-drupal.yaml
└── screenshots/*.png
```

---

## Technology Stack Details

### Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **IaC** | AWS CDK | 2.x | Infrastructure definition |
| **IaC Output** | CloudFormation | - | Deployment template |
| **Container** | Docker | - | Application packaging |
| **Registry** | ghcr.io | - | Container distribution |
| **CMS** | Drupal | 10.x | Content management |
| **Distribution** | LocalGov Drupal | 3.x | UK council patterns |
| **Runtime** | PHP | 8.2 | Application runtime |
| **Web Server** | Nginx | - | HTTP server |
| **Portal** | Eleventy | 3.x | Documentation site |

### AWS Services

| Service | Usage | Configuration |
|---------|-------|---------------|
| **Fargate** | Container hosting | 0.5 vCPU, 1GB RAM |
| **Aurora Serverless v2** | MySQL database | 0.5-2 ACU, scale-to-zero |
| **EFS** | Drupal file storage | Encrypted, single AZ |
| **ALB** | Load balancer | HTTPS, single AZ |
| **Secrets Manager** | Credentials | DB password, Drupal admin |
| **CloudWatch Logs** | Logging | 7-day retention |
| **Bedrock** | AI text/image | Nova 2 Pro, Lite, Omni |
| **Polly** | Text-to-speech | Neural, 7 languages |
| **Translate** | Translation | 75+ languages |
| **Rekognition** | Image analysis | DetectLabels |
| **Textract** | PDF extraction | AnalyzeDocument |

---

## Integration Points

### AWS Service Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                         Drupal (Fargate)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ndx_aws_ai Module                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │BedrockService│ │PollyService │ │TranslateService│     │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘        │   │
│  │         │               │               │                │   │
│  └─────────┼───────────────┼───────────────┼────────────────┘   │
│            │               │               │                    │
└────────────┼───────────────┼───────────────┼────────────────────┘
             │               │               │
             ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Amazon Bedrock │ │  Amazon Polly   │ │ Amazon Translate│
│  Nova 2 Pro     │ │  Neural voices  │ │  75+ languages  │
│  Nova 2 Lite    │ │  EN,CY,FR,RO,   │ │                 │
│  Nova 2 Omni    │ │  ES,CS,PL       │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Data Flow

```
Deployment Flow:
────────────────
NDX:Try Portal → CloudFormation → AWS Resources → Drupal Ready
                      │
                      ├─► Default VPC (existing)
                      ├─► Security Groups
                      ├─► Aurora Serverless v2
                      ├─► EFS
                      ├─► ALB
                      └─► Fargate Task
                              │
                              ├─► Pull ghcr.io image
                              ├─► Wait for Aurora
                              ├─► drush site:install
                              ├─► drush config:import
                              ├─► drush localgov:generate-council
                              │       │
                              │       ├─► Generate council identity
                              │       ├─► Generate content pages
                              │       ├─► Collect image specs
                              │       ├─► Batch generate images (Nova 2 Omni)
                              │       └─► Insert images into content
                              │
                              ├─► cfn-signal SUCCESS
                              └─► Start PHP-FPM + Nginx

Content Generation Flow:
────────────────────────
Council Identity (Nova 2 Pro)
    │
    ├─► Name: "Westbridge District Council"
    ├─► Region: "East Midlands"
    ├─► Theme: "Historic market town"
    └─► Population: "45,000"
           │
           ▼
Content Pages (Nova 2 Pro)
    │
    ├─► Homepage + hero image spec
    ├─► Service pages (15-20) + image specs
    ├─► Guide pages (5-8) + image specs
    ├─► News articles (5) + image specs
    └─► Directory entries (10-15)
           │
           ▼
Image Generation (Nova 2 Omni)
    │
    ├─► Council logo
    ├─► Hero banners (3-4)
    ├─► Service illustrations (15-20)
    ├─► Councillor headshots (8)
    └─► Location photos (10-15)
           │
           ▼
Final Assembly
    │
    └─► Link images to Drupal media entities
```

---

## Implementation Patterns

### CDK Construct Pattern

```typescript
// lib/constructs/database.ts
export interface DatabaseConstructProps {
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
  deploymentMode: string;
}

export class DatabaseConstruct extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    this.secret = new secretsmanager.Secret(this, 'DbSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'drupal' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    this.cluster = new rds.DatabaseCluster(this, 'Aurora', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      vpc: props.vpc,
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(this.secret),
      defaultDatabaseName: 'drupal',
      enableDataApi: true,
      storageEncrypted: true,
    });
  }
}
```

### Drupal Service Pattern

```php
// web/modules/custom/ndx_aws_ai/src/Service/BedrockService.php
namespace Drupal\ndx_aws_ai\Service;

use Aws\BedrockRuntime\BedrockRuntimeClient;
use Psr\Log\LoggerInterface;

class BedrockService {

  private BedrockRuntimeClient $client;
  private LoggerInterface $logger;

  public function __construct(LoggerInterface $logger) {
    $this->logger = $logger;
    $this->client = new BedrockRuntimeClient([
      'region' => 'us-east-1',
      'version' => 'latest',
    ]);
  }

  public function generateContent(string $prompt, string $model = 'nova-2-pro'): string {
    $modelId = $this->getModelId($model);

    $this->logger->info('Bedrock request', [
      'model' => $model,
      'prompt_length' => strlen($prompt),
    ]);

    try {
      $response = $this->client->invokeModel([
        'modelId' => $modelId,
        'body' => json_encode([
          'messages' => [
            ['role' => 'user', 'content' => [['text' => $prompt]]]
          ],
          'inferenceConfig' => [
            'maxTokens' => 4096,
            'temperature' => 0.7,
          ],
        ]),
      ]);

      $result = json_decode($response['body'], true);
      $content = $result['output']['message']['content'][0]['text'];

      $this->logger->info('Bedrock response', [
        'model' => $model,
        'tokens_used' => $result['usage']['totalTokens'] ?? 0,
      ]);

      return $content;

    } catch (BedrockException $e) {
      $this->logger->error('Bedrock error', [
        'error' => $e->getMessage(),
        'model' => $model,
      ]);
      throw $e;
    }
  }

  private function getModelId(string $model): string {
    return match($model) {
      'nova-2-pro' => 'amazon.nova-pro-v2:0',
      'nova-2-lite' => 'amazon.nova-lite-v2:0',
      'nova-2-omni' => 'amazon.nova-omni-v2:0',
      default => throw new \InvalidArgumentException("Unknown model: $model"),
    };
  }
}
```

### Drush Command Pattern

```php
// web/modules/custom/ndx_council_generator/src/Commands/GenerateCouncilCommands.php
namespace Drupal\ndx_council_generator\Commands;

use Drush\Commands\DrushCommands;
use Drush\Attributes as CLI;
use Drupal\ndx_council_generator\Generator\CouncilIdentityGenerator;
use Drupal\ndx_council_generator\Generator\ContentGenerator;
use Drupal\ndx_council_generator\Generator\ImageGenerator;

class GenerateCouncilCommands extends DrushCommands {

  public function __construct(
    private CouncilIdentityGenerator $identityGenerator,
    private ContentGenerator $contentGenerator,
    private ImageGenerator $imageGenerator,
  ) {
    parent::__construct();
  }

  #[CLI\Command(name: 'localgov:generate-council', aliases: ['lgc'])]
  #[CLI\Option(name: 'debug', description: 'Enable debug output')]
  #[CLI\Option(name: 'dry-run', description: 'Show what would be generated')]
  public function generateCouncil(array $options = ['debug' => false, 'dry-run' => false]): void {
    $this->logger()->notice('Starting council generation...');

    // Phase 1: Generate identity
    $identity = $this->identityGenerator->generate();
    $this->logger()->notice('Council: {name} ({theme})', [
      'name' => $identity->name,
      'theme' => $identity->theme,
    ]);

    if ($options['dry-run']) {
      $this->output()->writeln(print_r($identity, true));
      return;
    }

    // Phase 2: Generate content with image specs
    $content = $this->contentGenerator->generate($identity);
    $this->logger()->notice('Generated {count} content items', [
      'count' => count($content->pages),
    ]);

    // Phase 3: Batch generate images
    $images = $this->imageGenerator->generateBatch($content->imageSpecs);
    $this->logger()->notice('Generated {count} images', [
      'count' => count($images),
    ]);

    // Phase 4: Insert images into content
    $this->contentGenerator->attachImages($content, $images);

    $this->logger()->success('Council generation complete!');
  }
}
```

---

## Consistency Rules

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| CDK Constructs | PascalCase | `LocalGovDrupalStack` |
| CDK files | kebab-case.ts | `localgov-drupal-stack.ts` |
| CloudFormation resources | PascalCase with prefix | `NdxDrupalFargateService` |
| Drupal modules | snake_case | `ndx_aws_ai` |
| Drupal classes | PascalCase | `BedrockService` |
| Drupal files | PascalCase.php | `BedrockService.php` |
| Docker scripts | kebab-case.sh | `init-drupal.sh` |
| Environment vars | UPPER_SNAKE | `DEPLOYMENT_MODE` |
| CloudWatch logs | /ndx-try/drupal/* | `/ndx-try/drupal/init` |

### Code Organization

- **CDK**: One construct per AWS service group
- **Drupal modules**: One module per feature area
- **Services**: Single responsibility, dependency injected
- **Commands**: One command class per workflow

### Error Handling

```php
// Pattern: Try → Catch specific → Log → Fallback or rethrow
try {
  $result = $this->service->operation();
} catch (ThrottlingException $e) {
  $this->logger->warning('Throttled, retrying', ['attempt' => $attempt]);
  sleep(pow(2, $attempt));
  // Retry logic
} catch (ServiceException $e) {
  $this->logger->error('Service error', ['error' => $e->getMessage()]);
  return $this->getFallback();
}
```

### Logging Strategy

```php
// All logs include context for debugging
$this->logger->info('Operation started', [
  'operation' => 'generate_content',
  'council_id' => $councilId,
  'model' => $modelId,
]);

$this->logger->info('Operation complete', [
  'operation' => 'generate_content',
  'duration_ms' => $duration,
  'tokens_used' => $tokens,
  'items_created' => $count,
]);
```

---

## Data Architecture

### Database Schema (Aurora MySQL)

LocalGov Drupal uses standard Drupal schema plus custom tables:

```sql
-- Council identity (custom)
CREATE TABLE ndx_council_identity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  theme ENUM('urban', 'rural', 'coastal', 'historic'),
  population INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image specs (custom)
CREATE TABLE ndx_image_specs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  council_id INT,
  spec_id VARCHAR(50),
  prompt TEXT,
  size VARCHAR(20),
  usage_context VARCHAR(100),
  generated_url VARCHAR(500),
  FOREIGN KEY (council_id) REFERENCES ndx_council_identity(id)
);

-- Standard Drupal tables: node, users, file_managed, etc.
```

### File Storage (EFS)

```
/var/www/drupal/sites/default/files/
├── council-assets/
│   ├── logo.png
│   ├── hero/
│   ├── services/
│   ├── councillors/
│   └── locations/
├── tts-cache/           # Polly audio cache
├── pdf-uploads/         # User PDF uploads
└── generated/           # AI-generated content cache
```

---

## Security Architecture

### IAM Roles

```yaml
FargateTaskRole:
  Policies:
    - bedrock:InvokeModel
        Resource:
          - arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-*
    - polly:SynthesizeSpeech
    - translate:TranslateText
    - rekognition:DetectLabels
    - textract:AnalyzeDocument
    - s3:GetObject, s3:PutObject
        Resource: arn:aws:s3:::ndx-drupal-*/*
    - secretsmanager:GetSecretValue
        Resource: arn:aws:secretsmanager:*:*:secret:ndx-drupal-*
    - logs:CreateLogStream, logs:PutLogEvents

FargateExecutionRole:
  Policies:
    - ecr:GetAuthorizationToken (for ghcr.io via ECR pull-through)
    - logs:CreateLogGroup
```

### Network Security

```
Security Groups:
┌─────────────────────────────────────────────────────────┐
│ ALB Security Group                                       │
│   Inbound: 443 from 0.0.0.0/0                           │
│   Outbound: 80 to Fargate SG                            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Fargate Security Group                                   │
│   Inbound: 80 from ALB SG only                          │
│   Outbound: 443 to 0.0.0.0/0 (AWS APIs)                 │
│   Outbound: 3306 to Aurora SG                           │
│   Outbound: 2049 to EFS SG                              │
└─────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌──────────────────────┐    ┌──────────────────────┐
│ Aurora Security Group│    │ EFS Security Group   │
│   Inbound: 3306 from │    │   Inbound: 2049 from │
│   Fargate SG only    │    │   Fargate SG only    │
└──────────────────────┘    └──────────────────────┘
```

### Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| Aurora password | Secrets Manager | Auto (30 days) |
| Drupal admin password | Secrets Manager | None (demo) |

---

## Performance Considerations

### Deployment Timeline

```
CloudFormation Parse          ~10s
Security Groups               ~30s
Aurora Serverless v2          ~5-7 min  ← Bottleneck
EFS                           ~1 min
ALB                           ~2 min
Fargate Service               ~2 min
Container Pull (ghcr.io)      ~60s
Drupal Init + Content Gen     ~3-5 min

Total: 12-18 minutes
```

### Runtime Performance

| Operation | Target | Approach |
|-----------|--------|----------|
| Page load | <3s | OPcache, Drupal cache, CDN-ready |
| AI feature response | <5s | Async where possible, loading indicators |
| Aurora cold start | 15-30s | Accept for cost savings, retry logic |
| TTS generation | <3s | Cache generated audio |

### Cost Optimization

| Resource | Configuration | Est. Cost/90min |
|----------|---------------|-----------------|
| Aurora Serverless v2 | 0.5-2 ACU | ~$0.09-0.18 |
| Fargate | 0.5 vCPU, 1GB | ~$0.04 |
| ALB | Hourly + LCU | ~$0.02 |
| EFS | <1GB | ~$0.00 |
| Bedrock (Nova 2 Pro) | ~100K tokens | ~$0.73 |
| Bedrock (Nova 2 Omni) | ~30 images | ~$0.92 |
| Polly | Per request | ~$0.01 |
| **Total** | | **~$1.80-2.00** |

---

## Deployment Architecture

### CloudFormation Parameters

```yaml
Parameters:
  DeploymentMode:
    Type: String
    Default: production
    AllowedValues: [development, production]
    Description: Development allows errors for debugging

  CouncilTheme:
    Type: String
    Default: random
    AllowedValues: [random, urban, rural, coastal, historic]
    Description: Council character theme
```

### CloudFormation Outputs

```yaml
Outputs:
  DrupalURL:
    Description: Drupal admin URL (ready when stack completes)
    Value: !Sub "https://${ALB.DNSName}"

  AdminUsername:
    Description: Drupal admin username
    Value: admin

  AdminPassword:
    Description: Drupal admin password (retrieve from Secrets Manager)
    Value: !Sub "{{resolve:secretsmanager:${AdminSecret}:SecretString:password}}"

  CouncilName:
    Description: Generated council name
    Value: !GetAtt InitFunction.CouncilName

  InitializationLogs:
    Description: View initialization progress
    Value: !Sub "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#logsV2:log-groups/log-group/${InitLogGroup}"
```

---

## Development Environment

### Prerequisites

- Node.js 20+
- PHP 8.2+
- Composer 2.x
- Docker
- AWS CLI configured
- CDK CLI (`npm install -g aws-cdk`)

### Local Development

```bash
# Clone and setup
git clone https://github.com/your-org/ndx_try_aws_scenarios.git
cd ndx_try_aws_scenarios/cloudformation/scenarios/localgov-drupal

# CDK development
cd cdk
npm install
npm run build
cdk synth > ../template.yaml

# Drupal development
cd ../drupal
composer install
# Use DDEV or Lando for local Drupal

# Docker build
cd ../docker
docker build -t localgov-drupal .

# Run tests
cd ../tests
npm test              # CDK tests
./vendor/bin/phpunit  # Drupal tests
npx playwright test   # E2E tests
```

### Remote Development (ECS Exec)

```bash
# Deploy with development mode
aws cloudformation create-stack \
  --stack-name ndx-drupal-dev \
  --template-body file://template.yaml \
  --parameters ParameterKey=DeploymentMode,ParameterValue=development

# Get task ID
TASK_ID=$(aws ecs list-tasks --cluster ndx-drupal --query 'taskArns[0]' --output text | cut -d'/' -f3)

# ECS Exec into container
aws ecs execute-command \
  --cluster ndx-drupal \
  --task $TASK_ID \
  --container drupal \
  --interactive \
  --command "/bin/bash"

# Inside container
drush status
drush localgov:generate-council --debug
tail -f /var/log/init.log
```

---

## Architecture Decision Records (ADRs)

### ADR-001: CDK over Raw CloudFormation

**Context**: Need to define complex infrastructure with multiple interdependent resources.

**Decision**: Use AWS CDK (TypeScript) and synthesize to CloudFormation for distribution.

**Consequences**:
- (+) Type safety and IDE support
- (+) L2/L3 constructs reduce boilerplate
- (+) Easier testing with assertions
- (-) Requires build step
- (-) CDK version management

### ADR-002: Default VPC over Custom VPC

**Context**: Need networking for Fargate, Aurora, EFS.

**Decision**: Use default VPC with public subnets, single AZ.

**Consequences**:
- (+) Faster deployment (no VPC creation)
- (+) No VPC quota concerns
- (+) No NAT Gateway costs
- (-) Less isolation
- (-) Assumes default VPC exists

### ADR-003: Drupal Modules over Lambda Endpoints

**Context**: Need to integrate 7 AI services with Drupal CMS.

**Decision**: Use native Drupal modules with AWS SDK for PHP.

**Consequences**:
- (+) Leverage Drupal ecosystem
- (+) Single codebase
- (+) Native entity/field integration
- (-) PHP AWS SDK (less common)
- (-) Harder to test in isolation

### ADR-004: Nova 2 Models without Fallback

**Context**: Nova 2 Pro is in preview, may not be GA.

**Decision**: Target Nova 2 models only, update when GA, no fallback.

**Consequences**:
- (+) Simpler codebase
- (+) Latest capabilities
- (-) Blocked if Nova 2 unavailable
- (-) May need update when GA

### ADR-005: ghcr.io over ECR

**Context**: Need container registry for Drupal image.

**Decision**: Use GitHub Container Registry (ghcr.io) with direct Fargate pull.

**Consequences**:
- (+) Fully open source workflow
- (+) No ECR setup in user accounts
- (+) GitHub Actions integration
- (-) External dependency
- (-) Slightly slower than ECR in same region

---

## 7 AI Features Summary

| Feature | AWS Service | Model/API | Drupal Integration |
|---------|-------------|-----------|-------------------|
| **AI Content Editor** | Bedrock | Nova 2 Pro | CKEditor plugin |
| **Simplify for Readability** | Bedrock | Nova 2 Lite | Content action button |
| **Auto Alt Text** | Bedrock | Nova 2 Omni vision | Media upload hook |
| **Listen to Page** | Polly | Neural (7 languages) | Page template widget |
| **Real-time Translation** | Translate | TranslateText | Language selector |
| **PDF to Web Summary** | Textract + Bedrock | + Nova 2 Pro | File upload form |
| **Bedrock-Enhanced Search** | Bedrock | Nova 2 Lite | Search API integration |

---

_Generated by BMAD Architecture Workflow_
_Date: 2025-12-29_
_For: AI-Enhanced LocalGov Drupal on AWS Scenario_
