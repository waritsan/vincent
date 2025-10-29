"""
Tests for the charts/generate endpoint
"""
import pytest
import json
import azure.functions as func
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from function_app import generate_chart, create_response


class TestChartsGenerateEndpoint:
    """Test cases for the charts generate endpoint"""

    @patch('function_app.get_ai_client')
    @patch('text_extraction.get_companies_container')
    def test_generate_chart_successful_request(self, mock_get_container, mock_get_ai_client):
        """Test successful chart generation request"""
        # Mock AI client
        mock_ai_client = MagicMock()
        mock_get_ai_client.return_value = mock_ai_client

        # Mock AI response
        mock_response = MagicMock()
        mock_response.choices[0].message.content = '''
        {
            "type": "bar",
            "title": "Top Companies by Valuation",
            "data": [
                {"name": "Company A", "valuation": 100},
                {"name": "Company B", "valuation": 80}
            ],
            "dataKey": "valuation",
            "xAxisKey": "name"
        }
        '''
        mock_ai_client.chat.completions.create.return_value = mock_response

        # Mock companies container
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container

        mock_companies = [
            {
                "id": "company_1",
                "company_name": "Company A",
                "asset_valuation": "100 million baht",
                "location": "Bangkok",
                "created_at": "2025-10-29T10:00:00Z"
            },
            {
                "id": "company_2",
                "company_name": "Company B",
                "asset_valuation": "80 million baht",
                "location": "Chiang Mai",
                "created_at": "2025-10-29T11:00:00Z"
            }
        ]
        mock_container.query_items.return_value = mock_companies

        # Create request
        req_body = {"prompt": "show me top companies by valuation"}
        req = func.HttpRequest(
            method='POST',
            body=json.dumps(req_body).encode(),
            url='/api/charts/generate',
            params={}
        )

        # Call the function
        response = generate_chart(req)

        # Verify response
        assert response.status_code == 200

        response_data = json.loads(response.get_body().decode())
        assert "success" in response_data
        assert response_data["success"] is True
        assert "chart" in response_data
        assert "prompt" in response_data
        assert response_data["prompt"] == "show me top companies by valuation"

    @patch('function_app.get_ai_client')
    def test_generate_chart_missing_ai_client(self, mock_get_ai_client):
        """Test chart generation when AI client is not configured"""
        mock_get_ai_client.return_value = None

        req_body = {"prompt": "show me a chart"}
        req = func.HttpRequest(
            method='POST',
            body=json.dumps(req_body).encode(),
            url='/api/charts/generate',
            params={}
        )

        response = generate_chart(req)

        assert response.status_code == 503
        response_data = json.loads(response.get_body().decode())
        assert "error" in response_data
        assert "Azure OpenAI not configured" in response_data["error"]

    @patch('text_extraction.get_companies_container')
    @patch('function_app.get_ai_client')
    def test_generate_chart_missing_companies_database(self, mock_get_ai_client, mock_get_container):
        """Test chart generation when companies database is not configured"""
        mock_ai_client = MagicMock()
        mock_get_ai_client.return_value = mock_ai_client
        mock_get_container.return_value = None

        req_body = {"prompt": "show me companies"}
        req = func.HttpRequest(
            method='POST',
            body=json.dumps(req_body).encode(),
            url='/api/charts/generate',
            params={}
        )

        response = generate_chart(req)

        assert response.status_code == 503
        response_data = json.loads(response.get_body().decode())
        assert "error" in response_data
        assert "Companies database not configured" in response_data["error"]

    def test_generate_chart_missing_prompt(self):
        """Test chart generation with missing prompt"""
        req_body = {}  # No prompt
        req = func.HttpRequest(
            method='POST',
            body=json.dumps(req_body).encode(),
            url='/api/charts/generate',
            params={}
        )

        response = generate_chart(req)

        assert response.status_code == 400
        response_data = json.loads(response.get_body().decode())
        assert "error" in response_data
        assert "Prompt is required" in response_data["error"]

    def test_generate_chart_invalid_json(self):
        """Test chart generation with invalid JSON"""
        req = func.HttpRequest(
            method='POST',
            body=b'invalid json',
            url='/api/charts/generate',
            params={}
        )

        response = generate_chart(req)

        assert response.status_code == 400
        response_data = json.loads(response.get_body().decode())
        assert "error" in response_data
        assert "Invalid JSON" in response_data["error"]

    @patch('function_app.get_ai_client')
    @patch('text_extraction.get_companies_container')
    def test_generate_chart_ai_returns_invalid_json(self, mock_get_container, mock_get_ai_client):
        """Test chart generation when AI returns invalid JSON"""
        mock_ai_client = MagicMock()
        mock_get_ai_client.return_value = mock_ai_client

        # Mock AI response with invalid JSON
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "This is not valid JSON"
        mock_ai_client.chat.completions.create.return_value = mock_response

        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        mock_container.query_items.return_value = []

        req_body = {"prompt": "show me a chart"}
        req = func.HttpRequest(
            method='POST',
            body=json.dumps(req_body).encode(),
            url='/api/charts/generate',
            params={}
        )

        response = generate_chart(req)

        assert response.status_code == 500
        response_data = json.loads(response.get_body().decode())
        assert "error" in response_data

    @patch('function_app.get_ai_client')
    @patch('text_extraction.get_companies_container')
    def test_generate_chart_ai_returns_malformed_chart_config(self, mock_get_container, mock_get_ai_client):
        """Test chart generation when AI returns malformed chart configuration"""
        mock_ai_client = MagicMock()
        mock_get_ai_client.return_value = mock_ai_client

        # Mock AI response with JSON but missing required fields
        mock_response = MagicMock()
        mock_response.choices[0].message.content = '{"type": "bar"}'  # Missing title and data
        mock_ai_client.chat.completions.create.return_value = mock_response

        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        mock_container.query_items.return_value = []

        req_body = {"prompt": "show me a chart"}
        req = func.HttpRequest(
            method='POST',
            body=json.dumps(req_body).encode(),
            url='/api/charts/generate',
            params={}
        )

        response = generate_chart(req)

        assert response.status_code == 400
        response_data = json.loads(response.get_body().decode())
        assert "error" in response_data

    @patch('function_app.get_ai_client')
    @patch('text_extraction.get_companies_container')
    def test_generate_chart_with_filters(self, mock_get_container, mock_get_ai_client):
        """Test chart generation with filters applied"""
        mock_ai_client = MagicMock()
        mock_get_ai_client.return_value = mock_ai_client

        # Mock AI response with filters
        mock_response = MagicMock()
        mock_response.choices[0].message.content = '''
        {
            "type": "bar",
            "title": "Companies in Bangkok",
            "data": [
                {"name": "Company A", "valuation": 100}
            ],
            "dataKey": "valuation",
            "xAxisKey": "name",
            "filters": {
                "location": ["Bangkok"]
            }
        }
        '''
        mock_ai_client.chat.completions.create.return_value = mock_response

        mock_container = MagicMock()
        mock_get_container.return_value = mock_container

        mock_companies = [
            {
                "id": "company_1",
                "company_name": "Company A",
                "location": "Bangkok",
                "asset_valuation": "100 million baht",
                "created_at": "2025-10-29T10:00:00Z"
            },
            {
                "id": "company_2",
                "company_name": "Company B",
                "location": "Chiang Mai",
                "asset_valuation": "80 million baht",
                "created_at": "2025-10-29T11:00:00Z"
            }
        ]
        mock_container.query_items.return_value = mock_companies

        req_body = {"prompt": "show me companies in Bangkok"}
        req = func.HttpRequest(
            method='POST',
            body=json.dumps(req_body).encode(),
            url='/api/charts/generate',
            params={}
        )

        response = generate_chart(req)

        assert response.status_code == 200
        response_data = json.loads(response.get_body().decode())
        assert response_data["success"] is True
        assert "filters" in response_data["chart"]
        assert response_data["chart"]["filters"]["location"] == ["Bangkok"]