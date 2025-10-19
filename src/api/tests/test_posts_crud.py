"""
Tests for the posts UPDATE and DELETE endpoints
"""
import pytest
import json
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import azure.functions as func
from function_app import update_post, delete_post


class TestUpdatePost:
    """Test cases for updating posts"""
    
    @patch('function_app.get_cosmos_container')
    def test_update_post_success(self, mock_get_container):
        """Test successful post update"""
        # Mock Cosmos DB container
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        
        # Mock existing post
        existing_post = {
            'id': 'test-id-123',
            'title': 'Old Title',
            'content': 'Old content',
            'author': 'Old Author',
            'created_at': '2025-01-01T00:00:00Z'
        }
        mock_container.read_item.return_value = existing_post
        
        # Mock updated post
        updated_post = existing_post.copy()
        updated_post['title'] = 'New Title'
        updated_post['content'] = 'New content'
        updated_post['author'] = 'New Author'
        mock_container.replace_item.return_value = updated_post
        
        # Create request
        req = func.HttpRequest(
            method='PUT',
            body=json.dumps({
                'title': 'New Title',
                'content': 'New content',
                'author': 'New Author'
            }).encode('utf-8'),
            url='/api/posts/test-id-123',
            route_params={'id': 'test-id-123'}
        )
        
        # Call function
        response = update_post(req)
        
        # Verify response
        assert response.status_code == 200
        response_data = json.loads(response.get_body().decode())
        assert response_data['title'] == 'New Title'
        assert response_data['content'] == 'New content'
    
    @patch('function_app.get_cosmos_container')
    def test_update_post_missing_title(self, mock_get_container):
        """Test update with missing title"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        
        req = func.HttpRequest(
            method='PUT',
            body=json.dumps({
                'content': 'New content',
                'author': 'Author'
            }).encode('utf-8'),
            url='/api/posts/test-id',
            route_params={'id': 'test-id'}
        )
        
        response = update_post(req)
        
        assert response.status_code == 400
        response_data = json.loads(response.get_body().decode())
        assert 'error' in response_data
    
    @patch('function_app.get_cosmos_container')
    def test_update_post_not_found(self, mock_get_container):
        """Test updating non-existent post"""
        from azure.cosmos import exceptions
        
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        mock_container.read_item.side_effect = exceptions.CosmosResourceNotFoundError(message="Not found")
        
        req = func.HttpRequest(
            method='PUT',
            body=json.dumps({
                'title': 'Title',
                'content': 'Content',
                'author': 'Author'
            }).encode('utf-8'),
            url='/api/posts/non-existent',
            route_params={'id': 'non-existent'}
        )
        
        response = update_post(req)
        
        assert response.status_code == 404
        response_data = json.loads(response.get_body().decode())
        assert 'error' in response_data
        assert 'not found' in response_data['error'].lower()
    
    @patch('function_app.get_cosmos_container')
    def test_update_post_no_database(self, mock_get_container):
        """Test update when database not configured"""
        mock_get_container.return_value = None
        
        req = func.HttpRequest(
            method='PUT',
            body=json.dumps({
                'title': 'Title',
                'content': 'Content',
                'author': 'Author'
            }).encode('utf-8'),
            url='/api/posts/test-id',
            route_params={'id': 'test-id'}
        )
        
        response = update_post(req)
        
        assert response.status_code == 503
        response_data = json.loads(response.get_body().decode())
        assert 'error' in response_data


class TestDeletePost:
    """Test cases for deleting posts"""
    
    @patch('function_app.get_cosmos_container')
    def test_delete_post_success(self, mock_get_container):
        """Test successful post deletion"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        mock_container.delete_item.return_value = None
        
        req = func.HttpRequest(
            method='DELETE',
            body=None,
            url='/api/posts/test-id-123',
            route_params={'id': 'test-id-123'}
        )
        
        response = delete_post(req)
        
        assert response.status_code == 200
        response_data = json.loads(response.get_body().decode())
        assert 'message' in response_data
        assert response_data['id'] == 'test-id-123'
        assert 'deleted successfully' in response_data['message'].lower()
    
    @patch('function_app.get_cosmos_container')
    def test_delete_post_not_found(self, mock_get_container):
        """Test deleting non-existent post"""
        from azure.cosmos import exceptions
        
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        mock_container.delete_item.side_effect = exceptions.CosmosResourceNotFoundError(message="Not found")
        
        req = func.HttpRequest(
            method='DELETE',
            body=None,
            url='/api/posts/non-existent',
            route_params={'id': 'non-existent'}
        )
        
        response = delete_post(req)
        
        assert response.status_code == 404
        response_data = json.loads(response.get_body().decode())
        assert 'error' in response_data
        assert 'not found' in response_data['error'].lower()
    
    @patch('function_app.get_cosmos_container')
    def test_delete_post_no_database(self, mock_get_container):
        """Test delete when database not configured"""
        mock_get_container.return_value = None
        
        req = func.HttpRequest(
            method='DELETE',
            body=None,
            url='/api/posts/test-id',
            route_params={'id': 'test-id'}
        )
        
        response = delete_post(req)
        
        assert response.status_code == 503
        response_data = json.loads(response.get_body().decode())
        assert 'error' in response_data
        assert 'not configured' in response_data['error'].lower()
    
    @patch('function_app.get_cosmos_container')
    def test_delete_post_database_error(self, mock_get_container):
        """Test delete with database error"""
        from azure.cosmos import exceptions
        
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        mock_container.delete_item.side_effect = exceptions.CosmosHttpResponseError(message="DB error")
        
        req = func.HttpRequest(
            method='DELETE',
            body=None,
            url='/api/posts/test-id',
            route_params={'id': 'test-id'}
        )
        
        response = delete_post(req)
        
        assert response.status_code == 500
        response_data = json.loads(response.get_body().decode())
        assert 'error' in response_data
