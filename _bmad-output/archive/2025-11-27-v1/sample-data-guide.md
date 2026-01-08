# Sample Data Framework - Developer Guide

Version: 1.0.0
Last Updated: 2025-11-28

## Overview

The UK Council Sample Data Framework provides realistic, deterministic sample data generation for all NDX:Try AWS Scenarios. All data is clearly marked as synthetic and contains no real PII.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Data Generators](#data-generators)
4. [Lambda Layer Usage](#lambda-layer-usage)
5. [CloudFormation Integration](#cloudformation-integration)
6. [Data Schemas](#data-schemas)
7. [Configuration](#configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Quick Start

### For Scenario Developers

1. **Add Lambda Layer to your scenario stack:**

```yaml
Parameters:
  UKDataGeneratorLayerArn:
    Type: String
    Description: ARN of UK Data Generator layer
    Default: !ImportValue uk-data-generator-layer-LayerArn
```

2. **Add Custom Resource for data seeding:**

```yaml
Resources:
  SampleData:
    Type: Custom::SampleDataSeeder
    Properties:
      ServiceToken: !ImportValue sample-data-seeder-SeederFunctionArn
      CouncilName: Birmingham City Council
      Region: West Midlands
      DataVolume: 100
      Seed: 42
```

3. **Use generated data in your resources:**

```yaml
Outputs:
  SeedingStatus:
    Value: !GetAtt SampleData.Status
    Description: Sample data seeding status

  RecordCount:
    Value: !GetAtt SampleData.RecordCounts.total
    Description: Total records generated
```

### For Local Development

```python
from uk_data_generator import CouncilDataGenerator

# Initialize generator
generator = CouncilDataGenerator(
    seed=42,
    council_name="Birmingham City Council",
    region="West Midlands"
)

# Generate data
data = generator.generate(data_volume=100)

# Access residents
for resident in data['residents']:
    print(f"{resident['name']['fullName']} - {resident['address']['postcode']}")

# Access service requests
for request in data['serviceRequests']:
    print(f"{request['reference']} - {request['category']}")
```

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudFormation Stack                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Custom::SampleDataSeeder Resource              │ │
│  └───────────────────────┬────────────────────────────────┘ │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               SampleDataSeeder Lambda Function               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           UK Data Generator Lambda Layer               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Name         │  │ Address      │  │ Service      │ │ │
│  │  │ Generator    │  │ Generator    │  │ Generator    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Generated Sample Data                      │
│  - UK Names (50 unique combinations)                         │
│  - UK Addresses (valid postcodes)                            │
│  - Service Requests (4 categories)                           │
│  - All marked with [SAMPLE] identifier                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Stack Creation**: CloudFormation creates Custom Resource
2. **Lambda Invocation**: Custom Resource triggers SampleDataSeeder Lambda
3. **Data Generation**: Lambda uses uk-data-generator layer to create data
4. **Validation**: Lambda validates record counts
5. **Response**: Lambda sends SUCCESS/FAILED to CloudFormation
6. **Stack Completion**: CloudFormation completes with outputs

## Data Generators

### UKNameGenerator

Generates realistic UK names with proper gender distribution.

**Features:**
- 50 male first names, 50 female first names
- 30 common UK surnames
- Unique name combinations
- Gender-aware selection
- SAMPLE markers

**Usage:**

```python
from uk_data_generator import UKNameGenerator

generator = UKNameGenerator(seed=42)

# Generate single name
name = generator.generate_name()
# Returns: {
#   "firstName": "James",
#   "lastName": "Smith",
#   "fullName": "James Smith",
#   "gender": "male",
#   "sampleMarker": "SAMPLE"
# }

# Generate specific gender
male_name = generator.generate_name(gender='male')
female_name = generator.generate_name(gender='female')

# Generate multiple names
names = generator.generate_names(50)
```

### UKAddressGenerator

Generates valid UK addresses with proper postcode formats.

**Features:**
- Valid UK postcode patterns (B12 3AB, M1 4BN, LS6 2QR)
- 3 cities: Birmingham, Manchester, Leeds
- Realistic street combinations
- District assignment
- SAMPLE markers

**Usage:**

```python
from uk_data_generator import UKAddressGenerator

generator = UKAddressGenerator(seed=42)

# Generate random address
address = generator.generate_address()
# Returns: {
#   "addressLine1": "123 High Street",
#   "addressLine2": "Edgbaston",
#   "city": "Birmingham",
#   "postcode": "B12 3AB",
#   "formattedAddress": "123 High Street, Edgbaston, Birmingham, B12 3AB",
#   "sampleMarker": "SAMPLE"
# }

# Generate city-specific address
birmingham_address = generator.generate_address(city_name="Birmingham")
manchester_address = generator.generate_address(city_name="Manchester")
leeds_address = generator.generate_address(city_name="Leeds")

# Generate multiple addresses
addresses = generator.generate_addresses(100)
```

### CouncilServiceGenerator

Generates council service requests across 4 categories.

**Features:**
- 4 categories: Waste & Recycling, Highways, Housing, Council Tax
- 4 request types per category
- Status tracking (new, in_progress, resolved)
- Priority levels (low, medium, high)
- Timestamps
- Reference numbers with SAMPLE markers

**Usage:**

```python
from uk_data_generator import CouncilServiceGenerator

generator = CouncilServiceGenerator(seed=42)

# Generate single request
request = generator.generate_request()
# Returns: {
#   "reference": "[SAMPLE] WR-202511-00001",
#   "category": "Waste & Recycling",
#   "requestType": "Missed bin collection",
#   "status": "new",
#   "priority": "medium",
#   "submittedAt": "2025-11-01T10:30:00",
#   "lastUpdated": "2025-11-15T14:20:00",
#   "sampleMarker": "SAMPLE"
# }

# Generate category-specific request
waste_request = generator.generate_request(category="Waste & Recycling")

# Generate with distribution
distribution = {
    "Waste & Recycling": 30,
    "Highways": 25,
    "Housing": 25,
    "Council Tax": 20
}
requests = generator.generate_requests(100, category_distribution=distribution)
```

### CouncilDataGenerator

Main orchestrator for comprehensive data generation.

**Features:**
- Combines all generators
- Deterministic with seed
- Configurable council context
- Volume controls
- Data validation
- Complete resident records

**Usage:**

```python
from uk_data_generator import CouncilDataGenerator

generator = CouncilDataGenerator(
    seed=42,
    council_name="Birmingham City Council",
    region="West Midlands"
)

# Generate complete dataset
data = generator.generate(
    data_volume=100,
    include_service_requests=True
)

# Access generated data
print(f"Generated {data['recordCounts']['total']} records")
print(f"Generation time: {data['metadata']['generationTime']} seconds")

# Validate data
is_valid = generator.validate_data(data)
```

## Lambda Layer Usage

### Adding Layer to Lambda Function

```yaml
Resources:
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: python3.12
      Handler: index.handler
      Layers:
        - !Ref UKDataGeneratorLayer
      Code:
        ZipFile: |
          from uk_data_generator import CouncilDataGenerator

          def handler(event, context):
              generator = CouncilDataGenerator(seed=42)
              data = generator.generate(data_volume=100)
              return data
```

### Layer Structure

```
uk-data-generator/
└── python/
    └── lib/
        └── python3.12/
            └── site-packages/
                └── uk_data_generator/
                    ├── __init__.py
                    ├── config.py
                    └── generators.py
```

## CloudFormation Integration

### Custom Resource Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| CouncilName | String | Sample Council | Council name for context |
| Region | String | Sample Region | Geographic region |
| DataVolume | Number | 100 | Number of resident records |
| Seed | Number | 42 | Random seed for deterministic generation |

### Custom Resource Outputs

| Output | Description |
|--------|-------------|
| Status | COMPLETE/PARTIAL/FAILED |
| RecordCounts.residents | Number of resident records |
| RecordCounts.serviceRequests | Number of service requests |
| RecordCounts.total | Total records generated |
| GenerationTime | Time taken in seconds |

### Example Stack

```yaml
AWSTemplateFormatVersion: '2010-09-09'

Parameters:
  UKDataGeneratorLayerArn:
    Type: String
  SampleDataSeederFunctionArn:
    Type: String

Resources:
  SampleData:
    Type: Custom::SampleDataSeeder
    Properties:
      ServiceToken: !Ref SampleDataSeederFunctionArn
      CouncilName: Birmingham City Council
      Region: West Midlands
      DataVolume: 100
      Seed: 42

  MyTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-residents'
      # ... table configuration

Outputs:
  SeedingStatus:
    Value: !GetAtt SampleData.Status

  DataReady:
    Value: !If
      - !Equals [!GetAtt SampleData.Status, 'COMPLETE']
      - 'Ready'
      - 'Not Ready'
```

## Data Schemas

### Complete Dataset Schema

```json
{
  "metadata": {
    "councilName": "Birmingham City Council",
    "region": "West Midlands",
    "generatedAt": "2025-11-28T10:00:00Z",
    "generationTime": 1.23,
    "seed": 42,
    "dataVolume": 100,
    "sampleMarker": "SAMPLE",
    "version": "1.0.0"
  },
  "residents": [...],
  "serviceRequests": [...],
  "recordCounts": {
    "residents": 100,
    "serviceRequests": 100,
    "total": 200
  }
}
```

See [schemas/sample-data.schema.json](../schemas/sample-data.schema.json) for complete JSON Schema.

## Configuration

### Scenario-Specific Configurations

Configuration is stored in `src/_data/sample-data-config.yaml`:

```yaml
scenarios:
  council-chatbot:
    configuration:
      councilName: "Birmingham City Council"
      region: "West Midlands"
      dataVolume: 100
      seed: 42
```

### Data Volume Limits

For cost control:

```yaml
limits:
  maxResidents: 1000
  maxServiceRequests: 1000
  maxDocuments: 500
  maxSensorReadings: 10000
```

### Performance Targets

```yaml
performance:
  maxSeedingTime: 60      # seconds
  warningThreshold: 45    # seconds
  retryAttempts: 3
  retryDelay: 2          # seconds
```

## Testing

### Unit Tests

```bash
cd tests
python3 test_uk_data_generator.py
```

Tests cover:
- Name generation (50 unique names)
- Address generation (valid postcodes)
- Service request generation (4 categories, 100 records)
- Deterministic generation
- Sample markers
- No real PII
- Generation time (<60s)
- Record count validation

### Integration Tests

```bash
# Deploy layer
cd cloudformation/layers/uk-data-generator
./deploy.sh

# Deploy seeder
cd ../functions/sample-data-seeder
./deploy.sh

# Test with sample stack
aws cloudformation create-stack \
  --stack-name test-sample-data \
  --template-file test-stack.yaml
```

## Troubleshooting

### Generation Timeout

**Problem**: Seeding exceeds 60 seconds

**Solutions**:
1. Reduce DataVolume parameter
2. Increase Lambda memory (faster execution)
3. Check CloudWatch Logs for slow operations

### Invalid Postcode Format

**Problem**: Postcode validation fails

**Solution**: Postcodes follow pattern: `PREFIX + DISTRICT + SPACE + SECTOR + UNIT`
- Birmingham: `B12 3AB`
- Manchester: `M1 4BN`
- Leeds: `LS6 2QR`

### Record Count Mismatch

**Problem**: Validation fails on record count

**Solutions**:
1. Check CloudWatch Logs for generation errors
2. Verify layer is properly attached
3. Test layer independently
4. Check memory limits

### Sample Markers Missing

**Problem**: Data doesn't have SAMPLE markers

**Solution**: All generated data includes:
- `sampleMarker: "SAMPLE"` in all records
- `[SAMPLE]` prefix in reference numbers
- Check validation in tests

## Best Practices

1. **Always use deterministic seeds** for testing
2. **Validate record counts** before returning SUCCESS
3. **Monitor CloudWatch alarms** for performance
4. **Test with realistic data volumes** before deployment
5. **Include sample markers** in all generated data
6. **Document scenario-specific configurations** in YAML
7. **Keep generation time under 45 seconds** for early warning

## Support

For issues or questions:
- Check CloudWatch Logs for detailed error messages
- Review test output for validation failures
- Consult [AWS Documentation](https://docs.aws.amazon.com/)
- Contact NDX Partnership support

## License

MIT License - Part of NDX:Try AWS Scenarios project
