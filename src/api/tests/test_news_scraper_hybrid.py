"""
Tests for news scraper with hybrid storage functionality
"""
import pytest
from unittest.mock import patch, MagicMock
from news_scraper import fetch_news_as_posts, should_store_in_blob, store_content_in_blob


class TestNewsScraperHybrid:
    """Test news scraper with hybrid storage"""

    @patch('news_scraper.scrape_dbd_news')
    @patch('news_scraper.should_store_in_blob')
    @patch('news_scraper.store_content_in_blob')
    def test_fetch_news_as_posts_small_content(self, mock_store_blob, mock_should_store, mock_scrape):
        """Test fetching news with small content (stored in Cosmos DB)"""
        # Mock scraped article
        mock_scrape.return_value = [{
            'title': 'Test Article',
            'content': 'Short content',
            'link': 'https://example.com/article1',
            'created_at': '2025-01-01T00:00:00Z'
        }]

        # Mock that content should not be stored in blob
        mock_should_store.return_value = False

        result = fetch_news_as_posts(limit=1)

        assert len(result) == 1
        post = result[0]
        assert post['title'] == 'Test Article'
        assert post['content'] == 'Short content\n\nอ่านเพิ่มเติม: https://example.com/article1'
        assert post['content_storage'] == 'cosmos'
        assert 'content_blob_url' not in post

        # Should not attempt to store in blob
        mock_store_blob.assert_not_called()

    @patch('news_scraper.scrape_dbd_news')
    @patch('news_scraper.should_store_in_blob')
    @patch('news_scraper.store_content_in_blob')
    @patch('news_scraper.create_content_preview')
    def test_fetch_news_as_posts_large_content_success(self, mock_create_preview, mock_store_blob,
                                                       mock_should_store, mock_scrape):
        """Test fetching news with large content successfully stored in blob"""
        # Mock scraped article with large content
        large_content = "Large content " * 1000
        mock_scrape.return_value = [{
            'title': 'Large Test Article',
            'content': large_content,
            'link': 'https://example.com/article2',
            'created_at': '2025-01-01T00:00:00Z',
            'slug': 'test-slug'
        }]

        # Mock that content should be stored in blob
        mock_should_store.return_value = True

        # Mock successful blob storage
        blob_url = "https://test.blob.core.windows.net/articles/test-blob.txt"
        mock_store_blob.return_value = blob_url

        # Mock content preview
        mock_create_preview.return_value = "Preview content..."

        result = fetch_news_as_posts(limit=1)

        assert len(result) == 1
        post = result[0]
        assert post['title'] == 'Large Test Article'
        assert post['content'] == "Preview content..."
        assert post['content_storage'] == 'blob'
        assert post['content_blob_url'] == blob_url

        # Should attempt to store in blob
        mock_store_blob.assert_called_once()
        args, kwargs = mock_store_blob.call_args
        assert "articles/dbd-test-slug-" in args[1]  # blob name contains slug

    @patch('news_scraper.scrape_dbd_news')
    @patch('news_scraper.should_store_in_blob')
    @patch('news_scraper.store_content_in_blob')
    @patch('news_scraper.create_content_preview')
    def test_fetch_news_as_posts_large_content_blob_failure(self, mock_create_preview, mock_store_blob,
                                                           mock_should_store, mock_scrape):
        """Test fetching news with large content when blob storage fails"""
        # Mock scraped article with large content
        large_content = "Large content " * 1000
        full_content_with_link = large_content + "\n\nอ่านเพิ่มเติม: https://example.com/article3"

        mock_scrape.return_value = [{
            'title': 'Large Test Article',
            'content': large_content,
            'link': 'https://example.com/article3',
            'created_at': '2025-01-01T00:00:00Z'
        }]

        # Mock that content should be stored in blob
        mock_should_store.return_value = True

        # Mock blob storage failure
        mock_store_blob.return_value = None

        result = fetch_news_as_posts(limit=1)

        assert len(result) == 1
        post = result[0]
        assert post['title'] == 'Large Test Article'
        assert post['content'] == full_content_with_link  # Full content as fallback
        assert post['content_storage'] == 'cosmos'  # Fallback to cosmos
        assert 'content_blob_url' not in post

    @patch('news_scraper.scrape_dbd_news')
    def test_fetch_news_as_posts_with_keyword(self, mock_scrape):
        """Test fetching news with keyword filtering"""
        mock_scrape.return_value = [{
            'title': 'SME Article',
            'content': 'Content about SMEs',
            'link': 'https://example.com/sme',
            'created_at': '2025-01-01T00:00:00Z'
        }]

        with patch('news_scraper.should_store_in_blob', return_value=False):
            result = fetch_news_as_posts(limit=1, keyword='SME')

        assert len(result) == 1
        post = result[0]
        assert 'SME' in post['tags']
        assert post['tags'] == ['ข่าวประชาสัมพันธ์', 'DBD', 'กรมพัฒนาธุรกิจการค้า', 'SME']

    @patch('news_scraper.scrape_dbd_news')
    def test_fetch_news_as_posts_empty_results(self, mock_scrape):
        """Test fetching news when no articles are found"""
        mock_scrape.return_value = []

        result = fetch_news_as_posts(limit=1)

        assert result == []