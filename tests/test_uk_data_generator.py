"""
Unit tests for UK Data Generator

Tests all generators for correctness, determinism, and UK data validity.
"""

import unittest
import re
import sys
import os
from datetime import datetime

# Add the layer to Python path for testing
sys.path.insert(0, os.path.join(
    os.path.dirname(__file__),
    '../cloudformation/layers/uk-data-generator/python/lib/python3.12/site-packages'
))

from uk_data_generator import (
    UKNameGenerator,
    UKAddressGenerator,
    CouncilServiceGenerator,
    CouncilDataGenerator
)
from uk_data_generator.config import (
    UK_FIRST_NAMES,
    UK_SURNAMES,
    SAMPLE_DATA_MARKER
)


class TestUKNameGenerator(unittest.TestCase):
    """Test UK name generation (AC-3.1.1, AC-3.1.6, AC-3.1.8)"""

    def test_generate_single_name(self):
        """Test single name generation"""
        generator = UKNameGenerator(seed=42)
        name = generator.generate_name()

        self.assertIn('firstName', name)
        self.assertIn('lastName', name)
        self.assertIn('fullName', name)
        self.assertIn('gender', name)
        self.assertIn('sampleMarker', name)

        # Verify sample marker (AC-3.1.6)
        self.assertEqual(name['sampleMarker'], SAMPLE_DATA_MARKER)

        # Verify name is from configured lists (AC-3.1.6 - no real PII)
        self.assertIn(name['firstName'], UK_FIRST_NAMES['male'] + UK_FIRST_NAMES['female'])
        self.assertIn(name['lastName'], UK_SURNAMES)

    def test_generate_male_name(self):
        """Test male name generation"""
        generator = UKNameGenerator(seed=42)
        name = generator.generate_name(gender='male')

        self.assertEqual(name['gender'], 'male')
        self.assertIn(name['firstName'], UK_FIRST_NAMES['male'])

    def test_generate_female_name(self):
        """Test female name generation"""
        generator = UKNameGenerator(seed=42)
        name = generator.generate_name(gender='female')

        self.assertEqual(name['gender'], 'female')
        self.assertIn(name['firstName'], UK_FIRST_NAMES['female'])

    def test_generate_50_unique_names(self):
        """Test generating 50 unique names (AC-3.1.1)"""
        generator = UKNameGenerator(seed=42)
        names = generator.generate_names(50)

        self.assertEqual(len(names), 50)

        # Check uniqueness
        full_names = [n['fullName'] for n in names]
        unique_names = set(full_names)
        self.assertEqual(len(unique_names), 50, "Names should be unique")

        # Verify all have sample markers
        for name in names:
            self.assertEqual(name['sampleMarker'], SAMPLE_DATA_MARKER)

    def test_deterministic_generation(self):
        """Test deterministic generation with seed (AC-3.1.8)"""
        generator1 = UKNameGenerator(seed=42)
        generator2 = UKNameGenerator(seed=42)

        names1 = generator1.generate_names(10)
        names2 = generator2.generate_names(10)

        # Same seed should produce identical results
        for i in range(10):
            self.assertEqual(names1[i]['fullName'], names2[i]['fullName'])

    def test_different_seeds_produce_different_results(self):
        """Test that different seeds produce different results"""
        generator1 = UKNameGenerator(seed=42)
        generator2 = UKNameGenerator(seed=99)

        names1 = generator1.generate_names(10)
        names2 = generator2.generate_names(10)

        # Different seeds should produce different results
        differences = sum(1 for i in range(10) if names1[i]['fullName'] != names2[i]['fullName'])
        self.assertGreater(differences, 0, "Different seeds should produce different names")


class TestUKAddressGenerator(unittest.TestCase):
    """Test UK address generation (AC-3.1.2, AC-3.1.6, AC-3.1.8)"""

    # Valid UK postcode pattern regex
    POSTCODE_PATTERN = re.compile(r'^[A-Z]{1,2}\d{1,2}\s\d[A-Z]{2}$')

    def test_generate_single_address(self):
        """Test single address generation"""
        generator = UKAddressGenerator(seed=42)
        address = generator.generate_address()

        self.assertIn('addressLine1', address)
        self.assertIn('addressLine2', address)
        self.assertIn('city', address)
        self.assertIn('postcode', address)
        self.assertIn('formattedAddress', address)
        self.assertIn('sampleMarker', address)

        # Verify sample marker (AC-3.1.6)
        self.assertEqual(address['sampleMarker'], SAMPLE_DATA_MARKER)

    def test_valid_postcode_format(self):
        """Test valid UK postcode format (AC-3.1.2)"""
        generator = UKAddressGenerator(seed=42)

        # Generate 20 addresses and check all postcodes
        for _ in range(20):
            address = generator.generate_address()
            postcode = address['postcode']

            # Verify format (e.g., B12 3AB, M1 4BN, LS6 2QR)
            self.assertIsNotNone(
                self.POSTCODE_PATTERN.match(postcode),
                f"Invalid postcode format: {postcode}"
            )

    def test_birmingham_postcode(self):
        """Test Birmingham postcode generation"""
        generator = UKAddressGenerator(seed=42)
        address = generator.generate_address(city_name="Birmingham")

        self.assertEqual(address['city'], "Birmingham")
        self.assertTrue(address['postcode'].startswith('B'))

    def test_manchester_postcode(self):
        """Test Manchester postcode generation"""
        generator = UKAddressGenerator(seed=42)
        address = generator.generate_address(city_name="Manchester")

        self.assertEqual(address['city'], "Manchester")
        self.assertTrue(address['postcode'].startswith('M'))

    def test_leeds_postcode(self):
        """Test Leeds postcode generation"""
        generator = UKAddressGenerator(seed=42)
        address = generator.generate_address(city_name="Leeds")

        self.assertEqual(address['city'], "Leeds")
        self.assertTrue(address['postcode'].startswith('LS'))

    def test_deterministic_address_generation(self):
        """Test deterministic address generation (AC-3.1.8)"""
        generator1 = UKAddressGenerator(seed=42)
        generator2 = UKAddressGenerator(seed=42)

        addresses1 = generator1.generate_addresses(10)
        addresses2 = generator2.generate_addresses(10)

        # Same seed should produce identical results
        for i in range(10):
            self.assertEqual(addresses1[i]['postcode'], addresses2[i]['postcode'])
            self.assertEqual(addresses1[i]['formattedAddress'], addresses2[i]['formattedAddress'])


class TestCouncilServiceGenerator(unittest.TestCase):
    """Test council service request generation (AC-3.1.3, AC-3.1.6, AC-3.1.8)"""

    def test_generate_single_request(self):
        """Test single service request generation"""
        generator = CouncilServiceGenerator(seed=42)
        request = generator.generate_request()

        self.assertIn('reference', request)
        self.assertIn('category', request)
        self.assertIn('requestType', request)
        self.assertIn('status', request)
        self.assertIn('priority', request)
        self.assertIn('submittedAt', request)
        self.assertIn('lastUpdated', request)
        self.assertIn('sampleMarker', request)

        # Verify sample marker (AC-3.1.6)
        self.assertEqual(request['sampleMarker'], SAMPLE_DATA_MARKER)
        self.assertIn('[SAMPLE]', request['reference'])

    def test_generate_100_requests(self):
        """Test generating 100 service requests (AC-3.1.3)"""
        generator = CouncilServiceGenerator(seed=42)
        requests = generator.generate_requests(100)

        self.assertEqual(len(requests), 100)

        # Verify all have sample markers
        for request in requests:
            self.assertEqual(request['sampleMarker'], SAMPLE_DATA_MARKER)

    def test_four_categories(self):
        """Test all 4 service categories are represented (AC-3.1.3)"""
        generator = CouncilServiceGenerator(seed=42)
        requests = generator.generate_requests(100)

        categories = set(r['category'] for r in requests)

        # Should have all 4 categories
        expected_categories = {
            "Waste & Recycling",
            "Highways",
            "Housing",
            "Council Tax"
        }

        self.assertEqual(categories, expected_categories)

    def test_category_distribution(self):
        """Test distribution with specific category counts"""
        generator = CouncilServiceGenerator(seed=42)
        distribution = {
            "Waste & Recycling": 30,
            "Highways": 25,
            "Housing": 25,
            "Council Tax": 20
        }

        requests = generator.generate_requests(100, category_distribution=distribution)

        # Verify counts per category
        for category, expected_count in distribution.items():
            actual_count = sum(1 for r in requests if r['category'] == category)
            self.assertEqual(actual_count, expected_count)

    def test_deterministic_service_generation(self):
        """Test deterministic service request generation (AC-3.1.8)"""
        generator1 = CouncilServiceGenerator(seed=42)
        generator2 = CouncilServiceGenerator(seed=42)

        requests1 = generator1.generate_requests(10)
        requests2 = generator2.generate_requests(10)

        # Same seed should produce identical results
        for i in range(10):
            self.assertEqual(requests1[i]['reference'], requests2[i]['reference'])
            self.assertEqual(requests1[i]['category'], requests2[i]['category'])


class TestCouncilDataGenerator(unittest.TestCase):
    """Test comprehensive data generation (AC-3.1.4, AC-3.1.5, AC-3.1.8, AC-3.1.9)"""

    def test_generate_complete_dataset(self):
        """Test complete dataset generation"""
        generator = CouncilDataGenerator(
            seed=42,
            council_name="Birmingham City Council",
            region="West Midlands"
        )

        data = generator.generate(data_volume=100)

        self.assertIn('metadata', data)
        self.assertIn('residents', data)
        self.assertIn('serviceRequests', data)
        self.assertIn('recordCounts', data)

        # Verify metadata
        self.assertEqual(data['metadata']['councilName'], "Birmingham City Council")
        self.assertEqual(data['metadata']['region'], "West Midlands")
        self.assertEqual(data['metadata']['seed'], 42)
        self.assertEqual(data['metadata']['sampleMarker'], SAMPLE_DATA_MARKER)

    def test_record_counts(self):
        """Test record count validation (AC-3.1.9)"""
        generator = CouncilDataGenerator(seed=42)
        data = generator.generate(data_volume=100)

        # Verify record counts
        self.assertEqual(len(data['residents']), 100)
        self.assertEqual(len(data['serviceRequests']), 100)
        self.assertEqual(data['recordCounts']['residents'], 100)
        self.assertEqual(data['recordCounts']['serviceRequests'], 100)
        self.assertEqual(data['recordCounts']['total'], 200)

    def test_generation_time_limit(self):
        """Test generation completes within time limit (AC-3.1.4)"""
        generator = CouncilDataGenerator(seed=42)

        start_time = datetime.now()
        data = generator.generate(data_volume=100)
        elapsed_time = (datetime.now() - start_time).total_seconds()

        # Should complete within 60 seconds
        self.assertLess(elapsed_time, 60, "Generation should complete within 60 seconds")

        # Verify generation time is recorded
        self.assertIn('generationTime', data['metadata'])
        self.assertLess(data['metadata']['generationTime'], 60)

    def test_sample_markers_everywhere(self):
        """Test sample markers are present everywhere (AC-3.1.5)"""
        generator = CouncilDataGenerator(seed=42)
        data = generator.generate(data_volume=10)

        # Check metadata
        self.assertEqual(data['metadata']['sampleMarker'], SAMPLE_DATA_MARKER)

        # Check all residents
        for resident in data['residents']:
            self.assertEqual(resident['sampleMarker'], SAMPLE_DATA_MARKER)
            self.assertIn('[SAMPLE]', resident['residentId'])
            self.assertEqual(resident['name']['sampleMarker'], SAMPLE_DATA_MARKER)
            self.assertEqual(resident['address']['sampleMarker'], SAMPLE_DATA_MARKER)

        # Check all service requests
        for request in data['serviceRequests']:
            self.assertEqual(request['sampleMarker'], SAMPLE_DATA_MARKER)
            self.assertIn('[SAMPLE]', request['reference'])

    def test_data_validation(self):
        """Test data validation"""
        generator = CouncilDataGenerator(seed=42)
        data = generator.generate(data_volume=50)

        # Should pass validation
        is_valid = generator.validate_data(data)
        self.assertTrue(is_valid)

    def test_deterministic_complete_generation(self):
        """Test deterministic complete dataset generation (AC-3.1.8)"""
        generator1 = CouncilDataGenerator(seed=42, council_name="Test Council")
        generator2 = CouncilDataGenerator(seed=42, council_name="Test Council")

        data1 = generator1.generate(data_volume=20)
        data2 = generator2.generate(data_volume=20)

        # Should produce identical results
        for i in range(20):
            self.assertEqual(
                data1['residents'][i]['residentId'],
                data2['residents'][i]['residentId']
            )
            self.assertEqual(
                data1['residents'][i]['name']['fullName'],
                data2['residents'][i]['name']['fullName']
            )


if __name__ == '__main__':
    unittest.main(verbosity=2)
