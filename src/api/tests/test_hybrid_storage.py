"""
Tests for hybrid storage functionality
"""
import pytest
from unittest.mock import patch, MagicMock
from news_scraper import (
    should_store_in_blob,
    create_content_preview,
    store_content_in_blob,
    get_content_from_blob,
    get_blob_service_client
)


class TestHybridStorageUtils:
    """Test utility functions for hybrid storage"""

    def test_should_store_in_blob_small_content(self):
        """Test that small content is not stored in blob"""
        small_content = "This is a small article" * 10  # ~250 bytes
        assert should_store_in_blob(small_content) is False

    def test_should_store_in_blob_large_content(self):
        """Test that large content is stored in blob"""
        large_content = "This is a large article content " * 1000  # ~30KB
        assert should_store_in_blob(large_content) is True

    def test_should_store_in_blob_boundary_case(self):
        """Test boundary case around 5KB threshold"""
        # Create content around 5KB (5120 bytes = 5KB)
        boundary_content = "A" * 5120  # Exactly 5KB
        assert should_store_in_blob(boundary_content) is True

        # Create content just under 5KB
        under_boundary = "A" * 5119  # Just under 5KB
        assert should_store_in_blob(under_boundary) is False

    def test_create_content_preview_short_content(self):
        """Test preview creation for short content"""
        short_content = "This is short content"
        preview = create_content_preview(short_content)
        assert preview == short_content

    def test_create_content_preview_long_content(self):
        """Test preview creation for long content"""
        long_content = "This is a very long article content that should be truncated. " * 50
        preview = create_content_preview(long_content, max_length=100)

        assert len(preview) <= 103  # Allow some buffer for "..."
        assert preview.endswith("...")

    def test_create_content_preview_word_boundary(self):
        """Test that preview cuts at word boundary when possible"""
        content = "This is a very long sentence that should be cut properly at the word boundary."
        preview = create_content_preview(content, max_length=30)

        # Should not cut in the middle of a word
        assert not preview.rstrip("...").endswith(" be")
        assert preview.endswith("...")

    @patch('news_scraper.BlobServiceClient')
    def test_get_blob_service_client_success(self, mock_blob_service):
        """Test successful blob service client creation"""
        mock_client = MagicMock()
        mock_blob_service.from_connection_string.return_value = mock_client

        with patch.dict('os.environ', {'AZURE_STORAGE_CONNECTION_STRING': 'test-connection-string'}):
            client = get_blob_service_client()
            assert client == mock_client
            mock_blob_service.from_connection_string.assert_called_once_with('test-connection-string')

    @patch('news_scraper.BlobServiceClient')
    def test_get_blob_service_client_no_connection_string(self, mock_blob_service):
        """Test blob service client creation without connection string"""
        with patch.dict('os.environ', {}, clear=True):
            client = get_blob_service_client()
            assert client is None
            mock_blob_service.from_connection_string.assert_not_called()

    @patch('news_scraper.get_blob_service_client')
    def test_store_content_in_blob_success(self, mock_get_client):
        """Test successful content storage in blob"""
        mock_client = MagicMock()
        mock_blob_client = MagicMock()
        mock_client.get_blob_client.return_value = mock_blob_client
        mock_blob_client.url = "https://test.blob.core.windows.net/container/test-blob.txt"
        mock_get_client.return_value = mock_client

        result = store_content_in_blob("test content", "test-blob.txt")

        assert result == "https://test.blob.core.windows.net/container/test-blob.txt"
        mock_client.get_blob_client.assert_called_once_with(container="articles", blob="test-blob.txt")
        mock_blob_client.upload_blob.assert_called_once_with("test content", overwrite=True)

    @patch('news_scraper.get_blob_service_client')
    def test_store_content_in_blob_no_client(self, mock_get_client):
        """Test content storage when blob client is not available"""
        mock_get_client.return_value = None

        result = store_content_in_blob("test content", "test-blob.txt")

        assert result is None

    @patch('news_scraper.get_blob_service_client')
    def test_get_content_from_blob_success(self, mock_get_client):
        """Test successful content retrieval from blob"""
        mock_client = MagicMock()
        mock_blob_client = MagicMock()
        mock_download_stream = MagicMock()
        mock_client.get_blob_client.return_value = mock_blob_client
        mock_blob_client.download_blob.return_value = mock_download_stream
        mock_download_stream.readall.return_value = b"test content"
        mock_get_client.return_value = mock_client

        result = get_content_from_blob("https://test.blob.core.windows.net/container/test-blob.txt")

        assert result == "test content"
        mock_client.get_blob_client.assert_called_once_with(container="container", blob="test-blob.txt")

    @patch('news_scraper.get_blob_service_client')
    def test_get_content_from_blob_no_client(self, mock_get_client):
        """Test content retrieval when blob client is not available"""
        mock_get_client.return_value = None

        result = get_content_from_blob("https://test.blob.core.windows.net/container/test-blob.txt")

        assert result is None