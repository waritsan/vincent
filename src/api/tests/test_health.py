"""
Tests for the health endpoint
"""
import pytest
import json
import azure.functions as func
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from function_app import health, create_response, CORS_HEADERS


class TestHealthEndpoint:
    """Test cases for the health check endpoint"""
    
    def test_health_endpoint_returns_200(self):
        """Test that health endpoint returns 200 status"""
        # Create a mock request
        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/health',
            params={}
        )
        
        # Call the health function directly
        response = health(req)
        
        # Verify response
        assert response.status_code == 200
        assert response.mimetype == "application/json"
        
        # Parse response body
        response_data = json.loads(response.get_body().decode())
        assert "status" in response_data
        assert response_data["status"] == "healthy"
    
    def test_health_response_structure(self):
        """Test that health endpoint returns proper JSON structure"""
        # Create a mock request
        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/health',
            params={}
        )
        
        # Call the health function
        response = health(req)
        response_data = json.loads(response.get_body().decode())
        
        # Verify structure
        assert 'status' in response_data
        assert 'version' in response_data
        assert response_data['version'] == '1.0.0'
    
    def test_health_endpoint_cors_headers(self):
        """Test that health endpoint includes CORS headers"""
        # Verify CORS headers are configured
        from function_app import CORS_HEADERS
        
        assert 'Access-Control-Allow-Origin' in CORS_HEADERS
        assert 'Access-Control-Allow-Methods' in CORS_HEADERS
        assert 'Access-Control-Allow-Headers' in CORS_HEADERS
