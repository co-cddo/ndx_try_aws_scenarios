# Sample Data Seeder Lambda Function

CloudFormation Custom Resource for automated UK council sample data seeding.

## Overview

This Lambda function acts as a CloudFormation Custom Resource that automatically seeds
realistic UK council sample data when a scenario stack is deployed.

## Features

- **CloudFormation Integration**: Triggered automatically during stack creation
- **Retry Logic**: 3 automatic retries for transient failures
- **Validation**: Record count validation before SUCCESS response
- **Monitoring**: CloudWatch alarms for execution time and errors
- **Deterministic**: Same seed produces identical data
- **60-Second Limit**: Completes within CloudFormation timeout

## Architecture

```
CloudFormation Stack
       │
       ▼
Custom::SampleDataSeeder
       │
       ▼
Lambda Function (with uk-data-generator layer)
       │
       ▼
Generate & Validate Data
       │
       ▼
Send SUCCESS/FAILED to CloudFormation
```

## Usage in Scenario Stacks

### 1. Reference the Layer

```yaml
Parameters:
  UKDataGeneratorLayerArn:
    Type: String
    Description: ARN of UK Data Generator layer
```

### 2. Add Custom Resource

```yaml
Resources:
  SampleData:
    Type: Custom::SampleDataSeeder
    Properties:
      ServiceToken: !GetAtt SampleDataSeederFunction.Arn
      CouncilName: Birmingham City Council
      Region: West Midlands
      DataVolume: 100
      Seed: 42
```

### 3. Use Outputs

```yaml
Outputs:
  SeedingStatus:
    Value: !GetAtt SampleData.Status

  RecordCount:
    Value: !GetAtt SampleData.RecordCounts.total
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| CouncilName | String | Sample Council | Council name for context |
| Region | String | Sample Region | Geographic region |
| DataVolume | Number | 100 | Number of resident records |
| Seed | Number | 42 | Random seed for deterministic generation |

## CloudWatch Alarms

### Execution Time Warning
- Triggers if seeding exceeds 45 seconds
- Allows 15-second buffer before 60-second timeout
- Useful for capacity planning

### Error Alarm
- Triggers on any function error
- Indicates seeding failure
- Check CloudWatch Logs for details

## CloudWatch Logs

Function logs include:
- Data generation progress
- Retry attempts
- Validation results
- Timing metrics
- Error details

Log group: `/aws/lambda/{FunctionName}`

## Deployment

### Deploy Layer First

```bash
cd cloudformation/layers/uk-data-generator
./deploy.sh
```

### Deploy Seeder Function

```bash
cd cloudformation/functions/sample-data-seeder
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name sample-data-seeder \
  --parameter-overrides \
    UKDataGeneratorLayerArn=arn:aws:lambda:region:account:layer:uk-data-generator:1 \
  --capabilities CAPABILITY_IAM
```

## Response Format

### SUCCESS Response

```json
{
  "Status": "COMPLETE",
  "CouncilName": "Birmingham City Council",
  "Region": "West Midlands",
  "RecordCounts": {
    "residents": 100,
    "serviceRequests": 100,
    "total": 200
  },
  "GenerationTime": 1.23,
  "Message": "Successfully seeded 200 records"
}
```

### FAILED Response

```json
{
  "Status": "FAILED",
  "Error": "Record count validation failed",
  "Message": "Sample data seeding failed: Record count validation failed"
}
```

## Troubleshooting

### Timeout Errors

If seeding times out:
1. Check CloudWatch Logs for slow operations
2. Reduce DataVolume parameter
3. Increase Lambda timeout (max 900s)
4. Increase Lambda memory (faster execution)

### Validation Failures

If record count validation fails:
1. Check CloudWatch Logs for generation errors
2. Verify layer is properly attached
3. Test layer independently
4. Check for memory limits

### Retry Failures

If all 3 retries fail:
1. Check CloudWatch Logs for error pattern
2. Verify IAM permissions
3. Check layer compatibility
4. Test with smaller DataVolume

## Testing

### Unit Tests

```bash
cd tests
python -m pytest test_seeder.py -v
```

### Integration Test

```bash
aws cloudformation create-stack \
  --stack-name test-seeder \
  --template-file template.yaml \
  --parameters file://test-params.json \
  --capabilities CAPABILITY_IAM
```

## License

MIT License - Part of NDX:Try AWS Scenarios project
