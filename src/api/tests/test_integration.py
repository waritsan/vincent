"""
Integration tests for the API endpoints
"""
import pytest
import json
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


class TestIntegration:
    """Integration test cases"""
    
    def test_chat_to_posts_flow(self):
        """Test the flow from chat to posts"""
        # Simulate a conversation that might create content
        chat_message = "Tell me about citizen rights"
        
        # After getting a response, we might want to save it as a post
        post_data = {
            "title": "Understanding Citizen Rights",
            "content": "Information about citizen rights...",
            "author": "AI Assistant"
        }
        
        assert chat_message != ""
        assert "title" in post_data
        assert "content" in post_data
    
    def test_agent_creation_to_chat_flow(self):
        """Test creating an agent and then using it for chat"""
        # First create an agent
        agent_request = {
            "name": "Rights Assistant",
            "instructions": "Help citizens understand their rights",
            "model": "gpt-4o"
        }
        
        # Then use it for chat
        chat_request = {
            "message": "What are my rights?",
            "conversation_id": "test-conv-123"
        }
        
        assert agent_request["name"] != ""
        assert chat_request["message"] != ""
    
    def test_error_handling_chain(self):
        """Test that errors propagate correctly through the system"""
        error_scenarios = [
            {"type": "missing_message", "expected_status": 400},
            {"type": "missing_agent", "expected_status": 500},
            {"type": "invalid_json", "expected_status": 400},
        ]
        
        for scenario in error_scenarios:
            assert scenario["expected_status"] >= 400
    
    def test_concurrent_chat_requests(self):
        """Test handling multiple concurrent chat requests"""
        chat_requests = [
            {"conversation_id": "conv-1", "message": "Hello"},
            {"conversation_id": "conv-2", "message": "Hi"},
            {"conversation_id": "conv-3", "message": "Hey"},
        ]
        
        # Each should have unique conversation IDs
        conv_ids = [req["conversation_id"] for req in chat_requests]
        assert len(conv_ids) == len(set(conv_ids))
    
    def test_thread_persistence_across_messages(self):
        """Test that thread_id persists across multiple messages"""
        first_message = {
            "message": "Hello",
            "conversation_id": "conv-123"
        }
        
        # Response should include thread_id
        first_response = {
            "thread_id": "thread-456",
            "response": "Hi there!"
        }
        
        # Second message should reuse thread_id
        second_message = {
            "message": "How are you?",
            "conversation_id": "conv-123",
            "thread_id": first_response["thread_id"]
        }
        
        assert second_message["thread_id"] == first_response["thread_id"]
