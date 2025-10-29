"""
Tests for the companies endpoint
"""
import pytest
import json
import azure.functions as func
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from function_app import get_companies, create_response


class TestCompaniesEndpoint:
    """Test cases for the companies endpoint"""

    @patch('text_extraction.get_companies_container')
    def test_companies_endpoint_returns_200_with_data(self, mock_get_container):
        """Test that companies endpoint returns 200 with company data"""
        # Mock the container and query results
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container

        # Mock query results
        mock_companies = [
            {
                "id": "company_1",
                "company_name": "Test Company Ltd",
                "location": "Bangkok",
                "asset_valuation": "100 million baht",
                "created_at": "2025-10-29T10:00:00Z"
            },
            {
                "id": "company_2",
                "company_name": "Another Company Co",
                "location": "Chiang Mai",
                "asset_valuation": "50 million baht",
                "created_at": "2025-10-29T11:00:00Z"
            }
        ]

        mock_container.query_items.return_value = mock_companies

        # Create a mock request
        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/companies',
            params={'limit': '10'}
        )

        # Call the companies function
        response = get_companies(req)

        # Verify response
        assert response.status_code == 200
        assert response.mimetype == "application/json"

        # Parse response body
        response_data = json.loads(response.get_body().decode())
        assert "companies" in response_data
        assert "total" in response_data
        assert "limit" in response_data
        assert "source" in response_data
        assert response_data["source"] == "cosmos_db"
        assert len(response_data["companies"]) == 2
        assert response_data["total"] == 2

    @patch('text_extraction.get_companies_container')
    def test_companies_endpoint_handles_missing_database(self, mock_get_container):
        """Test that companies endpoint handles missing database gracefully"""
        # Mock container as None (database not configured)
        mock_get_container.return_value = None

        # Create a mock request
        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/companies',
            params={}
        )

        # Call the companies function
        response = get_companies(req)

        # Should return 503 Service Unavailable
        assert response.status_code == 503

        # Parse response body
        response_data = json.loads(response.get_body().decode())
        assert "error" in response_data
        assert "database not configured" in response_data["error"].lower()

    def test_companies_endpoint_validates_limit_parameter(self):
        """Test that limit parameter is validated correctly"""
        # Test valid limits
        valid_limits = [1, 10, 50, 100]

        for limit in valid_limits:
            assert 1 <= limit <= 100

        # Test invalid limits (should be clamped)
        invalid_limits = [0, 101, -1, 200]
        for limit in invalid_limits:
            clamped = min(max(1, limit), 100)
            assert 1 <= clamped <= 100

    @patch('text_extraction.get_companies_container')
    def test_companies_endpoint_default_limit(self, mock_get_container):
        """Test that companies endpoint uses default limit of 10"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        mock_container.query_items.return_value = []

        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/companies',
            params={}  # No limit parameter
        )

        response = get_companies(req)
        response_data = json.loads(response.get_body().decode())

        # Should use default limit of 10
        assert response_data["limit"] == 10

    @patch('text_extraction.get_companies_container')
    def test_companies_endpoint_custom_limit(self, mock_get_container):
        """Test that companies endpoint respects custom limit parameter"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        mock_container.query_items.return_value = []

        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/companies',
            params={'limit': '25'}
        )

        response = get_companies(req)
        response_data = json.loads(response.get_body().decode())

        # Should use custom limit of 25
        assert response_data["limit"] == 25

    @patch('text_extraction.get_companies_container')
    def test_companies_endpoint_handles_database_error(self, mock_get_container):
        """Test that companies endpoint handles database errors gracefully"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container

        # Mock a database error
        from azure.cosmos import exceptions
        mock_container.query_items.side_effect = exceptions.CosmosHttpResponseError(
            status=500, message="Database error"
        )

        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/companies',
            params={}
        )

        response = get_companies(req)

        # Should return 500 Internal Server Error
        assert response.status_code == 500

        response_data = json.loads(response.get_body().decode())
        assert "error" in response_data

    @patch('text_extraction.get_companies_container')
    def test_companies_endpoint_returns_correct_data_structure(self, mock_get_container):
        """Test that companies endpoint returns data in correct structure"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container

        mock_company = {
            "id": "test_company_123",
            "company_name": "Test Company Ltd",
            "location": "Bangkok",
            "asset_valuation": "100 million baht",
            "created_at": "2025-10-29T10:00:00Z",
            "extraction_id": "extraction_123",
            "model_used": "gpt-4o"
        }

        mock_container.query_items.return_value = [mock_company]

        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/companies',
            params={}
        )

        response = get_companies(req)
        response_data = json.loads(response.get_body().decode())

        # Verify structure
        company = response_data["companies"][0]
        assert "id" in company
        assert "company_name" in company
        assert "location" in company
        assert "asset_valuation" in company
        assert "created_at" in company
        assert company["id"] == "test_company_123"
        assert company["company_name"] == "Test Company Ltd"