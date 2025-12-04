# UK Data Generator Lambda Layer

Version: 1.0.0

## Overview

Lambda Layer providing realistic UK council sample data generation for AWS scenarios.
All generated data is deterministic, clearly marked as synthetic, and contains no real PII.

## Features

- **UK Name Generator**: Realistic UK names with proper gender distribution
- **UK Address Generator**: Valid UK addresses with proper postcode formats
- **Council Service Generator**: Service requests across 4 council categories
- **Deterministic Generation**: Same seed produces identical data for testing
- **SAMPLE Markers**: All data clearly identified as synthetic
- **No Real PII**: Algorithmically generated data only

## Layer Structure

```
uk-data-generator/
├── python/
│   └── lib/
│       └── python3.12/
│           └── site-packages/
│               └── uk_data_generator/
│                   ├── __init__.py
│                   ├── config.py
│                   └── generators.py
├── requirements.txt
└── README.md
```

## Usage in Lambda Functions

1. Add layer to Lambda function CloudFormation:

```yaml
Resources:
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: python3.12
      Layers:
        - !Ref UKDataGeneratorLayer
```

2. Import and use in Lambda handler:

```python
from uk_data_generator import CouncilDataGenerator

def lambda_handler(event, context):
    generator = CouncilDataGenerator(
        seed=42,
        council_name="Birmingham City Council",
        region="West Midlands"
    )

    data = generator.generate(data_volume=100)
    return {
        'statusCode': 200,
        'body': data
    }
```

## Deployment

### Package Layer

```bash
cd cloudformation/layers/uk-data-generator
zip -r uk-data-generator.zip python/
```

### Deploy with CloudFormation

```bash
aws cloudformation deploy \
  --template-file layer.yaml \
  --stack-name uk-data-generator-layer \
  --region us-east-1
```

## API Reference

### CouncilDataGenerator

Main orchestrator class for data generation.

**Constructor:**
```python
CouncilDataGenerator(
    seed: Optional[int] = None,
    council_name: str = "Sample Council",
    region: str = "Sample Region"
)
```

**Methods:**

- `generate(data_volume: int, include_service_requests: bool) -> Dict`
- `generate_resident(resident_id: int) -> Dict`
- `validate_data(data: Dict) -> bool`

### UKNameGenerator

Generate realistic UK names.

**Methods:**

- `generate_name(gender: Optional[str]) -> Dict`
- `generate_names(count: int) -> List[Dict]`

### UKAddressGenerator

Generate valid UK addresses.

**Methods:**

- `generate_address(city_name: Optional[str]) -> Dict`
- `generate_addresses(count: int) -> List[Dict]`

### CouncilServiceGenerator

Generate council service requests.

**Methods:**

- `generate_request(category: Optional[str], index: int) -> Dict`
- `generate_requests(count: int, category_distribution: Optional[Dict]) -> List[Dict]`

## Data Schemas

### Name Record
```json
{
  "firstName": "James",
  "lastName": "Smith",
  "fullName": "James Smith",
  "gender": "male",
  "sampleMarker": "SAMPLE"
}
```

### Address Record
```json
{
  "addressLine1": "123 High Street",
  "addressLine2": "Edgbaston",
  "city": "Birmingham",
  "postcode": "B12 3AB",
  "formattedAddress": "123 High Street, Edgbaston, Birmingham, B12 3AB",
  "sampleMarker": "SAMPLE"
}
```

### Service Request Record
```json
{
  "reference": "[SAMPLE] WR-202511-00001",
  "category": "Waste & Recycling",
  "requestType": "Missed bin collection",
  "status": "new",
  "priority": "medium",
  "submittedAt": "2025-11-01T10:30:00",
  "lastUpdated": "2025-11-15T14:20:00",
  "sampleMarker": "SAMPLE"
}
```

## Testing

Unit tests verify:
- Name uniqueness and distribution
- Valid postcode formats
- Service request distribution
- Deterministic generation
- Sample marker presence

## License

MIT License - Part of NDX:Try AWS Scenarios project
