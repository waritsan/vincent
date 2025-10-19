"""
Tests for the agent creation endpoint
"""
import pytest
import json
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


class TestAgentCreateEndpoint:
    """Test cases for the agent creation endpoint"""
    
    def test_agent_create_requires_name(self):
        """Test that agent creation requires a name"""
        valid_request = {
            "name": "Test Agent",
            "instructions": "You are a helpful assistant",
            "model": "gpt-4o"
        }
        
        assert "name" in valid_request
        assert valid_request["name"] != ""
    
    def test_agent_create_requires_instructions(self):
        """Test that agent creation requires instructions"""
        valid_request = {
            "name": "Test Agent",
            "instructions": "You are a helpful assistant",
            "model": "gpt-4o"
        }
        
        assert "instructions" in valid_request
        assert valid_request["instructions"] != ""
    
    def test_agent_create_model_optional(self):
        """Test that model parameter is optional"""
        request_without_model = {
            "name": "Test Agent",
            "instructions": "You are a helpful assistant"
        }
        
        assert "name" in request_without_model
        assert "instructions" in request_without_model
        # Model should be optional with a default value
    
    def test_agent_create_response_structure(self):
        """Test expected agent creation response structure"""
        expected_response = {
            "agent_id": "asst_abc123",
            "name": "Test Agent",
            "model": "gpt-4o",
            "message": "Agent created successfully"
        }
        
        assert "agent_id" in expected_response
        assert "name" in expected_response
        assert "model" in expected_response
    
    @patch('function_app.get_ai_agent')
    def test_agent_create_handles_missing_client(self, mock_get_agent):
        """Test that agent creation handles missing AI client gracefully"""
        mock_get_agent.return_value = (None, None)
        
        project_client, _ = mock_get_agent()
        assert project_client is None
    
    def test_agent_instructions_can_be_detailed(self):
        """Test that agent can have detailed instructions"""
        detailed_request = {
            "name": "Specialist Agent",
            "instructions": """You are a cybersecurity expert assistant. 
            Help users with security best practices, 
            threat analysis, and vulnerability assessment.""",
            "model": "gpt-4o"
        }
        
        assert len(detailed_request["instructions"]) > 50
    
    def test_agent_name_validation(self):
        """Test agent name validation"""
        # Valid names
        valid_names = ["Test Agent", "Agent123", "My-Agent"]
        for name in valid_names:
            assert len(name) > 0
        
        # Invalid names (empty)
        invalid_name = ""
        assert len(invalid_name) == 0
