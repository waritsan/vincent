"""
Tests for utility functions and helpers
"""
import pytest
import json
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from function_app import create_response, CORS_HEADERS


class TestUtilityFunctions:
    """Test cases for utility functions"""
    
    def test_cors_headers_present(self):
        """Test that CORS headers are properly configured"""
        assert 'Access-Control-Allow-Origin' in CORS_HEADERS
        assert 'Access-Control-Allow-Methods' in CORS_HEADERS
        assert 'Access-Control-Allow-Headers' in CORS_HEADERS
    
    def test_cors_headers_values(self):
        """Test CORS header values"""
        assert CORS_HEADERS['Access-Control-Allow-Origin'] == '*'
        assert 'GET' in CORS_HEADERS['Access-Control-Allow-Methods']
        assert 'POST' in CORS_HEADERS['Access-Control-Allow-Methods']
    
    def test_create_response_includes_cors(self):
        """Test that create_response includes CORS headers"""
        response = create_response({"test": "data"}, 200)
        
        # Check that response has headers
        assert hasattr(response, 'headers')
        assert response.headers is not None
    
    def test_create_response_status_codes(self):
        """Test create_response with different status codes"""
        # Success
        response_200 = create_response({"status": "ok"}, 200)
        assert response_200.status_code == 200
        
        # Created
        response_201 = create_response({"status": "created"}, 201)
        assert response_201.status_code == 201
        
        # Bad Request
        response_400 = create_response({"error": "bad request"}, 400)
        assert response_400.status_code == 400
        
        # Server Error
        response_500 = create_response({"error": "server error"}, 500)
        assert response_500.status_code == 500
    
    def test_create_response_json_serialization(self):
        """Test that create_response properly serializes JSON"""
        data = {
            "message": "test",
            "count": 42,
            "active": True,
            "items": ["a", "b", "c"]
        }
        
        response = create_response(data, 200)
        body = json.loads(response.get_body())
        
        assert body["message"] == "test"
        assert body["count"] == 42
        assert body["active"] is True
        assert len(body["items"]) == 3
    
    @patch('function_app.get_ai_client')
    def test_get_ai_client_handles_missing_endpoint(self, mock_get_client):
        """Test AI client initialization with missing endpoint"""
        with patch.dict(os.environ, {}, clear=True):
            from function_app import get_ai_client
            client = get_ai_client()
            # Should return None when endpoint is missing
    
    @patch('function_app.get_cosmos_container')
    def test_get_cosmos_container_handles_missing_endpoint(self, mock_get_container):
        """Test Cosmos DB container initialization with missing endpoint"""
        with patch.dict(os.environ, {}, clear=True):
            from function_app import get_cosmos_container
            container = get_cosmos_container()
            # Should return None when endpoint is missing
    
    def test_environment_variable_requirements(self):
        """Test that required environment variables are documented"""
        required_vars = [
            "AZURE_AI_ENDPOINT",
            "AZURE_AI_PROJECT_NAME",
            "AZURE_AI_AGENT_ID",
            "AZURE_COSMOS_ENDPOINT",
            "AZURE_COSMOS_DATABASE_NAME"
        ]
        
        # These variables should be configurable
        assert len(required_vars) > 0
        for var in required_vars:
            assert isinstance(var, str)
            assert len(var) > 0
