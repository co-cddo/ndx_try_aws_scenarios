"""
Sample Data Seeder Lambda Function

CloudFormation Custom Resource handler for seeding UK council sample data.
Uses the uk-data-generator Lambda layer for data generation.

Features:
- Deterministic data generation with seed
- Record count validation
- Retry logic for partial failures
- CloudWatch metrics and logging
- 60-second execution time limit
"""

import json
import logging
import time
from urllib.request import Request, urlopen
from typing import Dict, Any, Optional
from uk_data_generator import CouncilDataGenerator

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Execution time limit (45 seconds to allow CloudWatch alarm)
EXECUTION_TIME_LIMIT = 45

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 2


class SeedingError(Exception):
    """Custom exception for seeding failures."""
    pass


def send_response(
    event: Dict[str, Any],
    context: Any,
    response_status: str,
    response_data: Dict[str, Any],
    physical_resource_id: Optional[str] = None,
    reason: Optional[str] = None
) -> None:
    """
    Send CloudFormation custom resource response.

    Args:
        event: CloudFormation event
        context: Lambda context
        response_status: SUCCESS or FAILED
        response_data: Data to return to CloudFormation
        physical_resource_id: Physical resource ID
        reason: Failure reason (if applicable)
    """
    response_url = event['ResponseURL']

    response_body = {
        'Status': response_status,
        'Reason': reason or f'See CloudWatch Log Stream: {context.log_stream_name}',
        'PhysicalResourceId': physical_resource_id or context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': response_data
    }

    json_response_bytes = json.dumps(response_body).encode('utf-8')

    try:
        request = Request(
            response_url,
            data=json_response_bytes,
            headers={
                'Content-Type': '',
                'Content-Length': str(len(json_response_bytes))
            },
            method='PUT'
        )

        with urlopen(request) as response:
            logger.info(f"CloudFormation response status: {response.status}")
    except Exception as e:
        logger.error(f"Failed to send CloudFormation response: {str(e)}")


def validate_record_count(data: Dict[str, Any], expected_count: int) -> bool:
    """
    Validate that generated data has expected record count.

    Args:
        data: Generated dataset
        expected_count: Expected number of records

    Returns:
        True if valid, False otherwise
    """
    try:
        actual_count = data['recordCounts']['total']
        if actual_count < expected_count:
            logger.warning(
                f"Record count mismatch: expected {expected_count}, got {actual_count}"
            )
            return False
        return True
    except KeyError as e:
        logger.error(f"Missing record count field: {str(e)}")
        return False


def seed_data(
    council_name: str,
    region: str,
    data_volume: int,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Generate and seed sample data.

    Args:
        council_name: Name of the council
        region: Geographic region
        data_volume: Number of records to generate
        seed: Random seed for deterministic generation

    Returns:
        Generated dataset

    Raises:
        SeedingError: If seeding fails
    """
    start_time = time.time()

    try:
        # Initialize generator
        generator = CouncilDataGenerator(
            seed=seed,
            council_name=council_name,
            region=region
        )

        # Generate data
        logger.info(f"Generating {data_volume} records for {council_name}")
        data = generator.generate(
            data_volume=data_volume,
            include_service_requests=True
        )

        # Validate data
        generator.validate_data(data)

        # Validate record count
        if not validate_record_count(data, data_volume):
            raise SeedingError("Record count validation failed")

        elapsed_time = time.time() - start_time
        logger.info(f"Data generation completed in {elapsed_time:.2f} seconds")

        # Check execution time
        if elapsed_time > EXECUTION_TIME_LIMIT:
            logger.warning(
                f"Execution time ({elapsed_time:.2f}s) exceeded limit ({EXECUTION_TIME_LIMIT}s)"
            )

        return data

    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"Seeding failed after {elapsed_time:.2f} seconds: {str(e)}")
        raise SeedingError(f"Data seeding failed: {str(e)}")


def seed_with_retry(
    council_name: str,
    region: str,
    data_volume: int,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Seed data with retry logic.

    Args:
        council_name: Name of the council
        region: Geographic region
        data_volume: Number of records to generate
        seed: Random seed for deterministic generation

    Returns:
        Generated dataset

    Raises:
        SeedingError: If all retries fail
    """
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"Seeding attempt {attempt} of {MAX_RETRIES}")
            data = seed_data(council_name, region, data_volume, seed)
            logger.info(f"Seeding successful on attempt {attempt}")
            return data

        except SeedingError as e:
            last_error = e
            logger.warning(f"Attempt {attempt} failed: {str(e)}")

            if attempt < MAX_RETRIES:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                logger.error(f"All {MAX_RETRIES} attempts failed")

    raise SeedingError(f"Seeding failed after {MAX_RETRIES} attempts: {str(last_error)}")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for CloudFormation custom resource.

    Args:
        event: CloudFormation event
        context: Lambda context

    Returns:
        Response data
    """
    logger.info(f"Received event: {json.dumps(event)}")

    request_type = event['RequestType']
    properties = event.get('ResourceProperties', {})

    # Extract parameters
    council_name = properties.get('CouncilName', 'Sample Council')
    region = properties.get('Region', 'Sample Region')
    data_volume = int(properties.get('DataVolume', 100))
    seed = int(properties.get('Seed', 42))

    physical_resource_id = f"SampleData-{council_name.replace(' ', '-')}"

    try:
        if request_type == 'Create' or request_type == 'Update':
            # Seed data with retry logic
            data = seed_with_retry(council_name, region, data_volume, seed)

            # Prepare response data
            response_data = {
                'Status': 'COMPLETE',
                'CouncilName': council_name,
                'Region': region,
                'RecordCounts': data['recordCounts'],
                'GenerationTime': data['metadata']['generationTime'],
                'Message': f"Successfully seeded {data['recordCounts']['total']} records"
            }

            send_response(
                event,
                context,
                'SUCCESS',
                response_data,
                physical_resource_id,
                f"Sample data seeding completed for {council_name}"
            )

            return response_data

        elif request_type == 'Delete':
            # For Delete, just acknowledge (data cleanup handled by scenario teardown)
            response_data = {
                'Status': 'DELETED',
                'Message': 'Sample data cleanup acknowledged'
            }

            send_response(
                event,
                context,
                'SUCCESS',
                response_data,
                physical_resource_id,
                "Sample data deletion acknowledged"
            )

            return response_data

        else:
            raise ValueError(f"Unknown request type: {request_type}")

    except Exception as e:
        logger.error(f"Handler failed: {str(e)}", exc_info=True)

        error_data = {
            'Status': 'FAILED',
            'Error': str(e),
            'Message': f"Sample data seeding failed: {str(e)}"
        }

        send_response(
            event,
            context,
            'FAILED',
            error_data,
            physical_resource_id,
            str(e)
        )

        # Return error but don't raise (response already sent)
        return error_data
