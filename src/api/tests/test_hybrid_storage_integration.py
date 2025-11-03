"""
Integration test for hybrid storage end-to-end functionality
"""
import pytest
from unittest.mock import patch, MagicMock
import json


class TestHybridStorageIntegration:
    """Integration tests for the complete hybrid storage workflow"""

    @patch('scheduled_news_fetcher.scrape_dbd_news')
    @patch('scheduled_news_fetcher.should_store_in_blob')
    @patch('scheduled_news_fetcher.store_content_in_blob')
    @patch('scheduled_news_fetcher.create_content_preview')
    @patch('scheduled_news_fetcher.get_cosmos_container')
    @patch('scheduled_news_fetcher.check_article_exists')
    def test_end_to_end_hybrid_storage_workflow(self, mock_check_exists, mock_get_container,
                                               mock_create_preview, mock_store_blob,
                                               mock_should_store, mock_scrape):
        """Test the complete workflow from scraping to storage to retrieval"""

        # Step 1: Mock news scraping returns large article
        large_content = "This is a very large article content that exceeds 5KB. " * 200  # ~10KB
        mock_scrape.return_value = [{
            'title': 'Large DBD News Article',
            'content': large_content,
            'link': 'https://dbd.go.th/news/large-article',
            'created_at': '2025-01-01T00:00:00Z',
            'slug': 'large-article-2025',
            'source': 'กรมพัฒนาธุรกิจการค้า (DBD)'
        }]

        # Step 2: Mock hybrid storage decisions
        mock_should_store.return_value = True  # Large content should go to blob
        blob_url = "https://teststorage.blob.core.windows.net/articles/dbd-large-article-2025.txt"
        mock_store_blob.return_value = blob_url
        mock_create_preview.return_value = "This is a very large article content that exceeds 5KB..."

        # Step 3: Mock Cosmos DB operations
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        mock_check_exists.return_value = False  # Article doesn't exist yet

        # Import and run the scheduled fetcher
        from scheduled_news_fetcher import fetch_and_save_dbd_news

        result = fetch_and_save_dbd_news(limit=1)

        # Verify the workflow succeeded
        assert result['success'] is True
        assert result['stats']['saved'] == 1

        # Verify blob storage was used
        mock_store_blob.assert_called_once()
        args, kwargs = mock_store_blob.call_args
        blob_name = args[1]
        assert "articles/dbd-" in blob_name and blob_name.endswith(".txt")

        # Verify Cosmos DB storage with hybrid fields
        mock_container.create_item.assert_called_once()
        saved_item = mock_container.create_item.call_args[1]['body']

        assert saved_item['title'] == 'Large DBD News Article'
        assert saved_item['content'] == "This is a very large article content that exceeds 5KB..."
        assert saved_item['content_storage'] == 'blob'
        assert saved_item['content_blob_url'] == blob_url
        assert saved_item['auto_fetched'] is True

    @patch('function_app.get_cosmos_container')
    @patch('function_app.get_content_from_blob')
    def test_api_retrieval_with_hybrid_storage(self, mock_get_blob_content, mock_get_container):
        """Test API retrieval of posts with hybrid storage"""

        # Mock Cosmos DB returns posts with hybrid storage
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container

        mock_items = [
            {
                'id': '1',
                'title': 'Small Article',
                'content': 'Full content stored in Cosmos DB',
                'content_storage': 'cosmos',
                'created_at': '2025-01-01T00:00:00Z'
            },
            {
                'id': '2',
                'title': 'Large Article',
                'content': 'Preview content...',
                'content_storage': 'blob',
                'content_blob_url': 'https://test.blob.core.windows.net/articles/article2.txt',
                'created_at': '2025-01-02T00:00:00Z'
            }
        ]

        mock_container.query_items.return_value = mock_items

        # Mock blob content retrieval
        mock_get_blob_content.return_value = "Full large content retrieved from blob storage"

        # Test API retrieval
        from function_app import posts
        from azure.functions import HttpRequest

        req = MagicMock(spec=HttpRequest)
        req.method = 'GET'

        response = posts(req)

        assert response.status_code == 200
        response_data = json.loads(response.get_body())

        posts_data = response_data['posts']
        assert len(posts_data) == 2

        # Verify small content (cosmos) is unchanged
        small_post = next(p for p in posts_data if p['id'] == '1')
        assert small_post['content'] == 'Full content stored in Cosmos DB'

        # Verify large content (blob) is retrieved and replaced
        large_post = next(p for p in posts_data if p['id'] == '2')
        assert large_post['content'] == "Full large content retrieved from blob storage"

        # Verify blob retrieval was called
        mock_get_blob_content.assert_called_once_with('https://test.blob.core.windows.net/articles/article2.txt')

    def test_storage_cost_optimization(self):
        """Test that the hybrid approach optimizes storage costs"""
        from news_scraper import should_store_in_blob

        # Small content should stay in Cosmos DB (cheaper for small data)
        small_content = "Short article content"
        assert not should_store_in_blob(small_content)

        # Large content should go to Blob Storage (cheaper for large data)
        large_content = "A" * 10000  # 10KB
        assert should_store_in_blob(large_content)

        # Test the boundary - content around 5KB should go to blob
        boundary_content = "A" * 5120  # 5KB
        assert should_store_in_blob(boundary_content)