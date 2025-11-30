---
title: Cost Analysis & Tracking
layout: page
description: Track and optimize your AWS deployment costs
---

## AWS Cost Explorer

After deploying a scenario, use AWS Cost Explorer to track actual costs and compare them against projections.

### Getting Started

1. Sign in to the [AWS Management Console](https://console.aws.amazon.com/)
2. Navigate to **Billing and Cost Management**
3. Select **Cost Explorer** from the menu
4. Filter by service, region, or tags to isolate scenario costs

### Filtering by NDX:Try Scenarios

All NDX:Try CloudFormation templates include standardized tags for cost tracking:

- **Project**: `ndx-try`
- **Scenario**: `{scenario-id}` (e.g., `council-chatbot`)
- **Environment**: `evaluation`
- **ManagedBy**: `cloudformation`

To filter Cost Explorer by NDX:Try scenarios:

1. In Cost Explorer, click **Add filter**
2. Select **Tag** > **Project**
3. Enter value: `ndx-try`
4. (Optional) Add additional filter for specific scenario: **Tag** > **Scenario** > `council-chatbot`

This will show only costs associated with your NDX:Try deployments.

## Cost Comparison Worksheet

Use this template to compare projected vs actual costs for your deployed scenario.

### Monthly Cost Tracking

| Category | Projected (Monthly) | Actual (Month 1) | Variance | Notes |
|----------|---------------------|------------------|----------|-------|
| Compute (EC2/Lambda) | £___ | £___ | £___ | |
| Storage (S3/EBS) | £___ | £___ | £___ | |
| Data Transfer | £___ | £___ | £___ | |
| Database (RDS/DynamoDB) | £___ | £___ | £___ | |
| AI/ML Services | £___ | £___ | £___ | |
| Other Services | £___ | £___ | £___ | |
| **Total** | **£___** | **£___** | **£___** | |

### Cost Per Transaction/User

For operational budgeting, calculate cost per transaction:

| Metric | Value | Calculation |
|--------|-------|-------------|
| Monthly Cost | £___ | From table above |
| Monthly Transactions | ___ | From CloudWatch metrics |
| Cost Per Transaction | £___ | Monthly Cost / Monthly Transactions |
| Projected Annual Cost | £___ | Monthly Cost × 12 |

## Cost Optimization Tips

Apply these five optimization strategies to reduce AWS costs while maintaining performance:

### 1. Right-size Resources

**What to do**: Review CPU, memory, and network utilization in CloudWatch and downsize over-provisioned instances.

**How to implement**:
- Navigate to EC2 > Instances > Select instance > Monitoring tab
- Review CPU, network, and disk metrics over 2+ weeks
- If average CPU < 40%, consider smaller instance type
- Use AWS Compute Optimizer for automated recommendations

**Potential savings**: 20-40% on compute costs

### 2. Use Reserved Instances for Predictable Workloads

**What to do**: For workloads running 24/7, commit to 1 or 3-year Reserved Instance terms for significant discounts.

**How to implement**:
- Navigate to EC2 > Reserved Instances > Purchase Reserved Instances
- Choose 1-year (save ~40%) or 3-year (save ~60%) term
- Select "Standard" for maximum savings or "Convertible" for flexibility
- Start with partial coverage (50%) to test before full commitment

**Potential savings**: 40-72% on committed resources

### 3. Enable Auto-Scaling

**What to do**: Scale resources down during off-hours (nights, weekends) and up during peak usage.

**How to implement**:
- Create Auto Scaling schedule for EC2 instances
- Example: Scale to 2 instances 8am-6pm weekdays, 0 instances nights/weekends
- For Lambda, costs auto-scale (you only pay per invocation)
- Use EventBridge to stop/start RDS instances on schedule

**Potential savings**: 50-70% for non-24/7 workloads

### 4. Review Storage Classes

**What to do**: Move infrequently accessed data to lower-cost storage tiers.

**How to implement**:
- S3: Enable S3 Intelligent-Tiering or create lifecycle policies
  - Move to S3 Standard-IA after 30 days (50% cheaper)
  - Move to S3 Glacier after 90 days (80% cheaper)
- EBS: Delete unused snapshots, use gp3 instead of gp2
- Enable S3 Storage Lens for access pattern analysis

**Potential savings**: 50-90% on archived data

### 5. Set Budget Alerts

**What to do**: Configure AWS Budgets to notify you when costs exceed thresholds, preventing bill shock.

**How to implement**:
1. Navigate to **Billing** > **Budgets** > **Create budget**
2. Choose **Cost budget**
3. Set budgeted amount (e.g., £100/month for evaluation)
4. Configure alerts:
   - 50% of budget (forecasted)
   - 80% of budget (actual)
   - 100% of budget (actual)
5. Enter email addresses for notifications
6. Add **Tag filter** for Project: `ndx-try` to track only evaluation costs

**Potential savings**: Prevents runaway costs, enables proactive optimization

## Cost Estimation Before Deployment

Before deploying a scenario, estimate costs using:

### AWS Pricing Calculator

Use the [AWS Pricing Calculator](https://calculator.aws/#/) to model scenario costs:

1. Visit [https://calculator.aws/#/](https://calculator.aws/#/)
2. Click **Create estimate**
3. Add services used in your scenario (e.g., Lambda, S3, Bedrock)
4. Configure usage assumptions:
   - Lambda: Invocations per month, average duration, memory
   - S3: Storage amount (GB), number of requests
   - Bedrock: Model, tokens per request, requests per month
5. Review **Total estimated cost** for monthly and annual projections
6. Save estimate link to share with finance team

### Scenario Cost Estimates

Cost estimates for each scenario are provided on scenario detail pages. These are based on:

- **Light usage**: 100 transactions/day
- **Medium usage**: 500 transactions/day
- **Heavy usage**: 2,000+ transactions/day

Actual costs will vary based on your usage patterns.

## Understanding Your AWS Bill

Your AWS bill includes several components:

| Bill Component | Description | Optimization Strategy |
|----------------|-------------|----------------------|
| **EC2 Instances** | Virtual servers (charged per hour) | Right-size, use Reserved Instances, auto-scale |
| **Lambda Invocations** | Function executions + duration | Optimize code, reduce cold starts |
| **S3 Storage** | Data storage + requests | Use lifecycle policies, enable Intelligent-Tiering |
| **Data Transfer** | Data moving out of AWS | Use CloudFront CDN, minimize cross-region transfers |
| **RDS Databases** | Managed database instances | Right-size, use Reserved Instances, enable backups only when needed |
| **AI/ML Services** | Bedrock, Transcribe, etc. | Batch requests, cache results |

## Cost Monitoring Checklist

Use this checklist to maintain cost control:

- [ ] Configure budget alerts for each scenario deployment
- [ ] Review Cost Explorer weekly for first month
- [ ] Tag all resources with Project: `ndx-try` and Scenario: `{scenario-id}`
- [ ] Set up auto-scaling or scheduled shutdown for non-production resources
- [ ] Delete resources after evaluation completes
- [ ] Document actual costs in monthly report template

## External Resources

- [AWS Pricing Calculator](https://calculator.aws/#/) - Estimate costs before deployment
- [AWS Cost Explorer User Guide](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html) - Official documentation
- [AWS Well-Architected Cost Optimization Pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html) - Best practices
- [AWS Free Tier](https://aws.amazon.com/free/) - Eligible services and limits
- [AWS Cost Anomaly Detection](https://aws.amazon.com/aws-cost-management/aws-cost-anomaly-detection/) - Automated cost monitoring

## Cleanup After Evaluation

**Important**: To avoid ongoing costs, delete CloudFormation stacks when evaluation is complete:

1. Navigate to **CloudFormation** > **Stacks**
2. Select your NDX:Try stack
3. Click **Delete**
4. Confirm deletion
5. Wait 5-10 minutes for all resources to be removed
6. Verify in Cost Explorer that costs stop accruing

## Questions?

For questions about cost tracking or optimization, please [contact us](/contact/).
