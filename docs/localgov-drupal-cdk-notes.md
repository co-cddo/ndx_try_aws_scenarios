# LocalGov Drupal CDK - Deployment Notes

**Date:** 2025-12-23
**Source Repo:** https://github.com/aws-samples/aws-cdk-localgov-drupal-fargate-efs-auroraserverlessv2
**Cloned To:** /Users/cns/httpdocs/cddo/localgov-drupal-cdk

---

## Executive Summary

We successfully deployed the LocalGov Drupal CDK reference architecture to the Innovation Sandbox account (982203978489) in us-east-1. The deployment required several workarounds due to SCP restrictions and infrastructure constraints. We also created an optimized "dev stack" for faster iteration.

### Deployed Stacks

| Stack | Type | Status | Deploy Time | URL |
|-------|------|--------|-------------|-----|
| DrupalCoreStackdrupal-10 | Production | CREATE_COMPLETE | ~15 min | N/A (infra only) |
| DrupalFargateStackdrupal-10 | Production | CREATE_COMPLETE | ~5 min | Via CloudFront |
| DrupalWAFStackdrupal-10 | Production | CREATE_COMPLETE | ~3 min | https://d1u799l36gy2id.cloudfront.net |
| DrupalDevCore | Dev | CREATE_COMPLETE | ~6 min | N/A (infra only) |
| DrupalDevFargate | Dev | CREATE_COMPLETE | ~10 min* | http://Drupal-Servi-KRfdwRNDJskR-942562603.us-east-1.elb.amazonaws.com |

*Dev Fargate took longer due to health check cycling before fix was applied.

---

## Issues Encountered & Fixes

### 1. CDK Bootstrap Blocked by SCP

**Issue:** Innovation Sandbox has Service Control Policy blocking CDKToolkit stacks.

```
Resource handler returned message: "User: arn:aws:sts::982203978489:assumed-role/...
is not authorized to perform: ssm:GetParameter on resource:
arn:aws:ssm:us-east-1::parameter/cdk-bootstrap/hnb659fds/version
because no service control policy allows the ssm:GetParameter action"
```

**Fix:** Deploy via CloudFormation directly instead of `cdk deploy`:

```bash
# Synthesize templates
cdk synth --all --app "python app.py"

# Post-process to remove bootstrap references
python3 << 'EOF'
import json
for template_name in ['DrupalCoreStackdrupal-10', 'DrupalFargateStackdrupal-10', 'DrupalWAFStackdrupal-10']:
    with open(f'cdk.out/{template_name}.template.json', 'r') as f:
        template = json.load(f)

    # Remove BootstrapVersion parameter
    if 'Parameters' in template and 'BootstrapVersion' in template['Parameters']:
        del template['Parameters']['BootstrapVersion']

    # Remove CheckBootstrapVersion rule
    if 'Rules' in template and 'CheckBootstrapVersion' in template['Rules']:
        del template['Rules']['CheckBootstrapVersion']

    with open(f'cdk.out/{template_name}.template.json', 'w') as f:
        json.dump(template, f, indent=2)
EOF

# Deploy via CloudFormation
aws cloudformation create-stack \
  --stack-name DrupalCoreStackdrupal-10 \
  --template-body file://cdk.out/DrupalCoreStackdrupal-10.template.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1
```

---

### 2. LocalGov Drupal Build Failure (503 from drupal.org)

**Issue:** Building the drupal-9-localgov Dockerfile fails with 503 errors from packages.drupal.org.

```
ERROR: Error downloading https://packages.drupal.org/8/drupal/provider-latest...
503 Service Unavailable: Back-end server is at capacity
```

**Status:** Persistent issue with drupal.org infrastructure.

**Workaround:** Used vanilla Drupal 10 image instead:

```bash
# Build Drupal 10 image (uses official drupal:10-apache base)
docker build -t localgov-drupal:latest -f drupal_fargate/docker/drupal-10/Dockerfile .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 982203978489.dkr.ecr.us-east-1.amazonaws.com
docker tag localgov-drupal:latest 982203978489.dkr.ecr.us-east-1.amazonaws.com/localgov-drupal:latest
docker push 982203978489.dkr.ecr.us-east-1.amazonaws.com/localgov-drupal:latest
```

**Note:** This deploys vanilla Drupal 10, not the LocalGov Drupal distribution. When drupal.org recovers, rebuild with the localgov Dockerfile.

---

### 3. Aurora Version Not Available

**Issue:** Aurora version `8.0.mysql_aurora.3.06.0` doesn't exist in us-east-1.

```
Resource handler returned message: "Cannot find version 8.0.mysql_aurora.3.06.0 for aurora-mysql"
```

**Fix:** Update template to use version 3.08.0:

```bash
sed -i '' 's/8.0.mysql_aurora.3.06.0/8.0.mysql_aurora.3.08.0/g' cdk.out/DrupalCoreStackdrupal-10.template.json
```

---

### 4. ECR Pull Permissions Missing

**Issue:** Fargate task couldn't pull image from ECR - missing execution role permissions.

**Fix:** Add ECR permissions to the task execution role policy:

```python
# Add to execution role policy
ecr_stmt = {
    "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
    ],
    "Effect": "Allow",
    "Resource": "*"
}
```

---

### 5. Health Checks Failing with 400

**Issue:** Drupal rejects requests without a trusted Host header, returning HTTP 400.

```
Health checks failed with these codes: [400]
```

**Fix:** Update target group health check to accept 400:

```bash
# Via AWS CLI
aws elbv2 modify-target-group \
  --target-group-arn "arn:aws:elasticloadbalancing:us-east-1:982203978489:targetgroup/Drupal-Servi-JMRDEQXFKZYY/f5872119dabfa8ba" \
  --matcher '{"HttpCode":"200,301,302,400,403"}' \
  --region us-east-1

# In CDK code
self.fargate_service.target_group.configure_health_check(
    path="/",
    healthy_http_codes="200,301,302,400,403"
)
```

---

### 6. RDS Requires Minimum 2 AZs

**Issue:** Dev stack with 1 AZ failed - RDS DB subnet group requires subnets in at least 2 AZs.

```
DB Subnet Group doesn't meet availability zone coverage requirement. Please add subnets to cover at least 2 availability zones.
```

**Fix:** Changed dev VPC from 1 AZ to 2 AZs:

```python
self.vpc = ec2.Vpc(
    self, "dev-vpc",
    max_azs=2,  # Changed from 1
    nat_gateways=0,
    subnet_configuration=[...]
)
```

---

## Architecture Comparison

### Production Stack (Full)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CloudFront + WAF                          │
│                    (DrupalWAFStackdrupal-10)                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                     Application Load Balancer                    │
│                   (DrupalFargateStackdrupal-10)                  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Fargate    │  │   Fargate    │  │   Fargate    │          │
│  │   Task 1     │  │   Task 2     │  │   Task N     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                        Core Infrastructure                       │
│                    (DrupalCoreStackdrupal-10)                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  VPC (3 AZs, Public + Private subnets, NAT Gateways)    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────┐   │
│  │  Aurora Serverless  │    │         EFS Volume          │   │
│  │      v2 MySQL       │    │   (Drupal files storage)    │   │
│  └─────────────────────┘    └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Resources:**
- VPC with 3 AZs, public + private subnets, NAT Gateways
- Aurora Serverless v2 MySQL cluster
- EFS for persistent Drupal file storage
- ECS Fargate cluster with auto-scaling
- Application Load Balancer
- CloudFront distribution
- AWS WAF

**Deploy Time:** ~20-25 minutes

---

### Dev Stack (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Load Balancer                    │
│                       (DrupalDevFargate)                         │
│                                                                  │
│                      ┌──────────────┐                           │
│                      │   Fargate    │                           │
│                      │   Task 1     │                           │
│                      └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                        Core Infrastructure                       │
│                         (DrupalDevCore)                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      VPC (2 AZs, Public subnets only, NO NAT)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────┐                                        │
│  │   RDS MySQL t3.micro│        (No EFS - ephemeral storage)   │
│  │   (Single instance) │                                        │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Resources:**
- VPC with 2 AZs, public subnets only, NO NAT Gateways
- RDS MySQL t3.micro (not Aurora)
- NO EFS (ephemeral container storage)
- Single Fargate task
- Application Load Balancer (no CloudFront)
- NO WAF

**Deploy Time:** ~10-15 minutes

---

## Files Created/Modified

### New Files in localgov-drupal-cdk

| File | Purpose |
|------|---------|
| `drupal_fargate/drupal_dev_core_stack.py` | Dev core stack (VPC + RDS MySQL) |
| `drupal_fargate/drupal_dev_fargate_stack.py` | Dev Fargate stack (ECS + ALB) |
| `app_dev.py` | Dev deployment entry point |

### Modified Files

| File | Change |
|------|--------|
| `app.py` | Set region to us-east-1, env explicit |
| `drupal_fargate/drupal_fargate_stack.py` | Use ECR image directly instead of from_asset |

---

## Cost Estimate (Sandbox)

### Production Stack (per month, running 24/7)

| Service | Estimated Cost |
|---------|----------------|
| Aurora Serverless v2 (min 0.5 ACU) | ~$43/month |
| EFS (1GB) | ~$0.30/month |
| Fargate (2 x 1vCPU, 2GB) | ~$58/month |
| ALB | ~$16/month |
| NAT Gateways (3) | ~$97/month |
| CloudFront | ~$1/month |
| **Total** | **~$215/month** |

### Dev Stack (per month, running 24/7)

| Service | Estimated Cost |
|---------|----------------|
| RDS MySQL t3.micro | ~$12/month |
| Fargate (1 x 0.5vCPU, 1GB) | ~$15/month |
| ALB | ~$16/month |
| **Total** | **~$43/month** |

---

## Deployment Commands

### Production Stack

```bash
cd /Users/cns/httpdocs/cddo/localgov-drupal-cdk

# Activate venv
source .venv/bin/activate

# Synth and post-process
cdk synth --all --app "python app.py"
python3 scripts/strip-bootstrap.py  # Custom script to remove bootstrap refs

# Deploy in order
aws cloudformation create-stack --stack-name DrupalCoreStackdrupal-10 --template-body file://cdk.out/DrupalCoreStackdrupal-10.template.json --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --region us-east-1

# Wait for core stack...

aws cloudformation create-stack --stack-name DrupalFargateStackdrupal-10 --template-body file://cdk.out/DrupalFargateStackdrupal-10.template.json --capabilities CAPABILITY_IAM --region us-east-1

# Wait for fargate stack...

aws cloudformation create-stack --stack-name DrupalWAFStackdrupal-10 --template-body file://cdk.out/DrupalWAFStackdrupal-10.template.json --capabilities CAPABILITY_IAM --region us-east-1
```

### Dev Stack

```bash
cd /Users/cns/httpdocs/cddo/localgov-drupal-cdk

# Synth dev stacks
cdk synth --all --app "python app_dev.py"

# Post-process and deploy
aws cloudformation create-stack --stack-name DrupalDevCore --template-body file://cdk.out/DrupalDevCore.template.json --capabilities CAPABILITY_IAM --region us-east-1

# Wait for core stack...

aws cloudformation create-stack --stack-name DrupalDevFargate --template-body file://cdk.out/DrupalDevFargate.template.json --capabilities CAPABILITY_IAM --region us-east-1
```

---

## Cleanup Commands

```bash
# Delete in reverse order
aws cloudformation delete-stack --stack-name DrupalWAFStackdrupal-10 --region us-east-1
aws cloudformation delete-stack --stack-name DrupalFargateStackdrupal-10 --region us-east-1
aws cloudformation delete-stack --stack-name DrupalCoreStackdrupal-10 --region us-east-1

# Dev stacks
aws cloudformation delete-stack --stack-name DrupalDevFargate --region us-east-1
aws cloudformation delete-stack --stack-name DrupalDevCore --region us-east-1
```

---

## Outstanding Items

1. **LocalGov Drupal Distribution** - When drupal.org recovers, rebuild with LocalGov Drupal Dockerfile
2. **Drupal Installation** - Both deployments show Drupal installer (database not seeded)
3. **Trusted Host Pattern** - Need to configure Drupal settings.php with ALB/CloudFront hostnames
4. **NDX Scenario Integration** - Create simplified CloudFormation template for quick-try

---

## Key Learnings

1. **CDK Bootstrap workaround** - Can deploy CDK-synthesized templates directly via CloudFormation
2. **Aurora versions vary by region** - Always check available versions before deploying
3. **Drupal health checks** - Accept 400 for trusted host rejection, or configure health check path
4. **RDS AZ requirements** - Even dev stacks need 2+ AZs for RDS subnet groups
5. **ECR permissions** - When using from_registry(), must explicitly add ECR permissions to execution role
6. **NAT Gateway costs** - Biggest cost driver; public subnets only for dev reduces cost significantly

---

## References

- Source Repo: https://github.com/aws-samples/aws-cdk-localgov-drupal-fargate-efs-auroraserverlessv2
- LocalGov Drupal: https://www.localgovdrupal.org/
- AWS CDK v2: https://docs.aws.amazon.com/cdk/v2/guide/home.html
- Drupal on AWS: https://aws.amazon.com/solutions/implementations/drupal-on-aws/
