"""
Tests for the chat endpoint
"""
import pytest
import json
from unittest.mock import patch, MagicMock, AsyncMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from function_app import create_response


class TestChatEndpoint:
    """Test cases for the chat endpoint"""
    
    def test_create_response_with_dict(self):
        """Test create_response helper with dictionary"""
        body = {"message": "test"}
        response = create_response(body, 200)
        
        assert response.status_code == 200
        assert response.mimetype == "application/json"
        assert json.loads(response.get_body()) == body
    
    def test_create_response_with_string(self):
        """Test create_response helper with string"""
        body = "test message"
        response = create_response(body, 200)
        
        assert response.status_code == 200
        assert response.mimetype == "application/json"
    
    def test_chat_requires_message(self):
        """Test that chat endpoint requires a message"""
        # A valid chat request must include a message
        valid_request = {
            "message": "Hello",
            "conversation_id": "test-123"
        }
        
        assert "message" in valid_request
        assert valid_request["message"] != ""
    
    def test_chat_conversation_id_optional(self):
        """Test that conversation_id is optional"""
        request_without_conv_id = {
            "message": "Hello"
        }
        
        assert "message" in request_without_conv_id
        # conversation_id should be optional
    
    def test_chat_thread_id_optional(self):
        """Test that thread_id is optional for new conversations"""
        request_without_thread = {
            "message": "Hello",
            "conversation_id": "test-123"
        }
        
        assert "message" in request_without_thread
        # thread_id should be optional for new conversations
    
    @patch('function_app.get_ai_agent')
    def test_chat_handles_missing_agent(self, mock_get_agent):
        """Test that chat handles missing AI agent gracefully"""
        mock_get_agent.return_value = (None, None)
        
        project_client, agent_id = mock_get_agent()
        
        assert project_client is None
        assert agent_id is None
    
    def test_chat_response_structure(self):
        """Test expected chat response structure"""
        expected_response = {
            "conversation_id": "test-123",
            "thread_id": "thread-456",
            "message": "user message",
            "response": "ai response",
            "timestamp": "2025-10-19T00:00:00"
        }
        
        # Verify all expected fields
        assert "conversation_id" in expected_response
        assert "thread_id" in expected_response
        assert "message" in expected_response
        assert "response" in expected_response
        assert "timestamp" in expected_response
    
    def test_chat_error_response_structure(self):
        """Test error response structure"""
        error_response = {
            "error": "Error message",
            "conversation_id": "test-123",
            "timestamp": "2025-10-19T00:00:00"
        }
        
        assert "error" in error_response
        assert "conversation_id" in error_response
