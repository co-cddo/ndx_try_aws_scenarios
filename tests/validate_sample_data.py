#!/usr/bin/env python3
"""
Sample Data Validation Script

Validates generated sample data against JSON schema and acceptance criteria.
Usage: python3 validate_sample_data.py [data-file.json]
"""

import json
import sys
import os
from pathlib import Path

# Add the layer to Python path
sys.path.insert(0, os.path.join(
    os.path.dirname(__file__),
    '../cloudformation/layers/uk-data-generator/python/lib/python3.12/site-packages'
))

from uk_data_generator import CouncilDataGenerator
from uk_data_generator.config import SAMPLE_DATA_MARKER


def validate_sample_markers(data):
    """Validate that all data has sample markers (AC-3.1.5)"""
    errors = []

    # Check metadata
    if data.get('metadata', {}).get('sampleMarker') != SAMPLE_DATA_MARKER:
        errors.append("Missing sample marker in metadata")

    # Check residents
    for i, resident in enumerate(data.get('residents', [])):
        if resident.get('sampleMarker') != SAMPLE_DATA_MARKER:
            errors.append(f"Resident {i}: missing sample marker")
        if not resident.get('residentId', '').startswith('[SAMPLE]'):
            errors.append(f"Resident {i}: ID doesn't start with [SAMPLE]")

        # Check name
        if resident.get('name', {}).get('sampleMarker') != SAMPLE_DATA_MARKER:
            errors.append(f"Resident {i} name: missing sample marker")

        # Check address
        if resident.get('address', {}).get('sampleMarker') != SAMPLE_DATA_MARKER:
            errors.append(f"Resident {i} address: missing sample marker")

    # Check service requests
    for i, request in enumerate(data.get('serviceRequests', [])):
        if request.get('sampleMarker') != SAMPLE_DATA_MARKER:
            errors.append(f"Service request {i}: missing sample marker")
        if not request.get('reference', '').startswith('[SAMPLE]'):
            errors.append(f"Service request {i}: reference doesn't start with [SAMPLE]")

    return errors


def validate_no_real_pii(data):
    """Validate no real PII is present (AC-3.1.6)"""
    # This is a basic check - in production, you'd have more sophisticated PII detection
    errors = []

    suspicious_patterns = [
        '@gmail.com', '@outlook.com', '@hotmail.com',  # Real email patterns
        '+44 7',  # UK mobile patterns with country code
        'NI ', 'National Insurance',  # NI numbers
    ]

    # Also check for phone patterns not in timestamps
    import re
    data_str = json.dumps(data)

    # Check for phone patterns (avoid matching dates like 2025-11-07)
    phone_pattern = re.compile(r'\b0[0-9]{10}\b')  # UK phone number pattern
    if phone_pattern.search(data_str):
        errors.append("Potential phone number detected")

    # Check other patterns
    data_str_lower = data_str.lower()
    for pattern in suspicious_patterns:
        if pattern.lower() in data_str_lower:
            errors.append(f"Potential real PII detected: {pattern}")

    return errors


def validate_record_counts(data, expected_volume):
    """Validate record counts (AC-3.1.9)"""
    errors = []

    record_counts = data.get('recordCounts', {})

    if record_counts.get('residents') != expected_volume:
        errors.append(
            f"Resident count mismatch: expected {expected_volume}, "
            f"got {record_counts.get('residents')}"
        )

    if record_counts.get('serviceRequests') != expected_volume:
        errors.append(
            f"Service request count mismatch: expected {expected_volume}, "
            f"got {record_counts.get('serviceRequests')}"
        )

    expected_total = expected_volume * 2
    if record_counts.get('total') != expected_total:
        errors.append(
            f"Total count mismatch: expected {expected_total}, "
            f"got {record_counts.get('total')}"
        )

    return errors


def validate_generation_time(data):
    """Validate generation time (AC-3.1.4)"""
    errors = []

    generation_time = data.get('metadata', {}).get('generationTime')

    if generation_time is None:
        errors.append("Missing generation time in metadata")
    elif generation_time > 60:
        errors.append(f"Generation time ({generation_time}s) exceeds 60 seconds")

    return errors


def validate_service_categories(data):
    """Validate service request categories (AC-3.1.3)"""
    errors = []

    expected_categories = {
        "Waste & Recycling",
        "Highways",
        "Housing",
        "Council Tax"
    }

    categories = set(r['category'] for r in data.get('serviceRequests', []))

    if categories != expected_categories:
        missing = expected_categories - categories
        extra = categories - expected_categories

        if missing:
            errors.append(f"Missing categories: {missing}")
        if extra:
            errors.append(f"Unexpected categories: {extra}")

    return errors


def main():
    """Main validation function"""
    if len(sys.argv) > 1:
        # Validate from file
        data_file = sys.argv[1]
        print(f"Validating data from: {data_file}")

        with open(data_file, 'r') as f:
            data = json.load(f)

        expected_volume = data.get('metadata', {}).get('dataVolume', 100)
    else:
        # Generate test data
        print("No file provided. Generating test data...")
        generator = CouncilDataGenerator(
            seed=42,
            council_name="Test Council",
            region="Test Region"
        )
        data = generator.generate(data_volume=100)
        expected_volume = 100

    print("\nValidating sample data...")
    print("=" * 60)

    all_errors = []

    # Run validations
    print("\n[1/5] Checking sample markers (AC-3.1.5)...")
    errors = validate_sample_markers(data)
    if errors:
        all_errors.extend(errors)
        for error in errors:
            print(f"  ❌ {error}")
    else:
        print("  ✓ All sample markers present")

    print("\n[2/5] Checking for real PII (AC-3.1.6)...")
    errors = validate_no_real_pii(data)
    if errors:
        all_errors.extend(errors)
        for error in errors:
            print(f"  ❌ {error}")
    else:
        print("  ✓ No real PII detected")

    print("\n[3/5] Validating record counts (AC-3.1.9)...")
    errors = validate_record_counts(data, expected_volume)
    if errors:
        all_errors.extend(errors)
        for error in errors:
            print(f"  ❌ {error}")
    else:
        print(f"  ✓ Record counts correct ({expected_volume} residents, "
              f"{expected_volume} service requests)")

    print("\n[4/5] Checking generation time (AC-3.1.4)...")
    errors = validate_generation_time(data)
    if errors:
        all_errors.extend(errors)
        for error in errors:
            print(f"  ❌ {error}")
    else:
        gen_time = data['metadata']['generationTime']
        print(f"  ✓ Generation completed in {gen_time:.2f}s (< 60s)")

    print("\n[5/5] Validating service categories (AC-3.1.3)...")
    errors = validate_service_categories(data)
    if errors:
        all_errors.extend(errors)
        for error in errors:
            print(f"  ❌ {error}")
    else:
        print("  ✓ All 4 service categories present")

    # Summary
    print("\n" + "=" * 60)
    if all_errors:
        print(f"\n❌ VALIDATION FAILED: {len(all_errors)} error(s) found")
        sys.exit(1)
    else:
        print("\n✓ VALIDATION PASSED: All checks successful!")
        print(f"\nData summary:")
        print(f"  - Council: {data['metadata']['councilName']}")
        print(f"  - Region: {data['metadata']['region']}")
        print(f"  - Residents: {data['recordCounts']['residents']}")
        print(f"  - Service Requests: {data['recordCounts']['serviceRequests']}")
        print(f"  - Total Records: {data['recordCounts']['total']}")
        print(f"  - Generation Time: {data['metadata']['generationTime']:.2f}s")
        sys.exit(0)


if __name__ == '__main__':
    main()
