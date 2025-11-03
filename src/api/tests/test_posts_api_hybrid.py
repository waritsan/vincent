"""
Tests for posts API endpoint with hybrid storage
"""
import pytest
from unittest.mock import patch, MagicMock
import json


class TestPostsAPIHybrid:
    """Test posts API endpoint with hybrid storage"""

    @patch('function_app.get_cosmos_container')
    @patch('function_app.get_content_from_blob')
    def test_get_posts_with_blob_content(self, mock_get_blob_content, mock_get_container):
        """Test retrieving posts where some content is stored in blob storage"""
        # Mock Cosmos DB container
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container

        # Mock posts data - one with blob storage, one with cosmos storage
        mock_items = [
            {
                'id': '1',
                'title': 'Article with blob content',
                'content': 'Preview content...',
                'content_storage': 'blob',
                'content_blob_url': 'https://test.blob.core.windows.net/articles/article1.txt',
                'author': 'Test Author',
                'created_at': '2025-01-01T00:00:00Z'
            },
            {
                'id': '2',
                'title': 'Article with cosmos content',
                'content': 'Full content stored in cosmos',
                'content_storage': 'cosmos',
                'author': 'Test Author',
                'created_at': '2025-01-02T00:00:00Z'
            }
        ]

        # Mock query_items to return the items
        mock_container.query_items.return_value = mock_items

        # Mock blob content retrieval
        mock_get_blob_content.return_value = "Full content retrieved from blob storage"

        # Import and create mock request
        from function_app import posts
        from azure.functions import HttpRequest

        # Create mock request
        req = MagicMock(spec=HttpRequest)
        req.method = 'GET'

        # Call the function
        response = posts(req)

        # Verify response
        assert response.status_code == 200
        response_data = json.loads(response.get_body())

        assert 'posts' in response_data
        assert len(response_data['posts']) == 2

        # Check that blob content was retrieved and replaced
        posts_data = response_data['posts']
        blob_post = next(p for p in posts_data if p['id'] == '1')
        cosmos_post = next(p for p in posts_data if p['id'] == '2')

        assert blob_post['content'] == "Full content retrieved from blob storage"
        assert cosmos_post['content'] == "Full content stored in cosmos"

        # Verify blob content retrieval was called
        mock_get_blob_content.assert_called_once_with('https://test.blob.core.windows.net/articles/article1.txt')

    @patch('function_app.get_cosmos_container')
    @patch('function_app.get_content_from_blob')
    def test_get_posts_blob_content_failure(self, mock_get_blob_content, mock_get_container):
        """Test retrieving posts when blob content retrieval fails"""
        # Mock Cosmos DB container
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container

        # Mock post with blob storage
        mock_items = [{
            'id': '1',
            'title': 'Article with blob content',
            'content': 'Preview content...',
            'content_storage': 'blob',
            'content_blob_url': 'https://test.blob.core.windows.net/articles/article1.txt',
            'author': 'Test Author',
            'created_at': '2025-01-01T00:00:00Z'
        }]

        mock_container.query_items.return_value = mock_items

        # Mock blob content retrieval failure
        mock_get_blob_content.return_value = None

        # Import and test
        from function_app import posts
        from azure.functions import HttpRequest

        req = MagicMock(spec=HttpRequest)
        req.method = 'GET'

        response = posts(req)

        # Verify response still works but logs warning
        assert response.status_code == 200
        response_data = json.loads(response.get_body())

        posts_data = response_data['posts']
        assert len(posts_data) == 1
        assert posts_data[0]['content'] == 'Preview content...'  # Falls back to preview

    @patch('function_app.get_cosmos_container')
    @patch('function_app.get_content_from_blob')
    def test_get_posts_no_hybrid_storage(self, mock_get_blob_content, mock_get_container):
        """Test retrieving posts that don't use hybrid storage"""
        # Mock Cosmos DB container
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container

        # Mock posts without hybrid storage fields
        mock_items = [{
            'id': '1',
            'title': 'Regular Article',
            'content': 'Full content',
            'author': 'Test Author',
            'created_at': '2025-01-01T00:00:00Z'
        }]

        mock_container.query_items.return_value = mock_items

        # Import and test
        from function_app import posts
        from azure.functions import HttpRequest

        req = MagicMock(spec=HttpRequest)
        req.method = 'GET'

        response = posts(req)

        # Verify response
        assert response.status_code == 200
        response_data = json.loads(response.get_body())

        posts_data = response_data['posts']
        assert len(posts_data) == 1
        assert posts_data[0]['content'] == 'Full content'

        # Should not attempt blob retrieval
        mock_get_blob_content.assert_not_called()

    @patch('function_app.get_cosmos_container')
    def test_get_posts_cosmos_unavailable(self, mock_get_container):
        """Test posts retrieval when Cosmos DB is unavailable"""
        mock_get_container.return_value = None

        from function_app import posts
        from azure.functions import HttpRequest

        req = MagicMock(spec=HttpRequest)
        req.method = 'GET'

        response = posts(req)

        # Should return mock data
        assert response.status_code == 200
        response_data = json.loads(response.get_body())

        assert 'posts' in response_data
        assert response_data['source'] == 'mock'