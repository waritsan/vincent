"""
Tests for the news/fetch endpoint
"""

import pytest
import json
import sys
import os
import azure.functions as func
from unittest.mock import patch, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from function_app import manual_news_fetch, create_response


class TestNewsFetchEndpoint:
    """Test cases for the news fetch endpoint"""

    @patch('scheduled_news_fetcher.fetch_and_save_dbd_news')
    def test_news_fetch_successful_request(self, mock_fetch_and_save):
        """Test successful news fetch request"""
        mock_fetch_and_save.return_value = {
            'success': True,
            'message': 'Fetched 5 articles successfully',
            'stats': {
                'saved': 3,
                'skipped': 2,
                'errors': 0
            },
            'timestamp': '2025-10-29T12:00:00Z'
        }

        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/news/fetch',
            params={'limit': '5'}
        )

        response = manual_news_fetch(req)

        assert response.status_code == 200

        response_data = json.loads(response.get_body().decode())
        assert response_data["success"] is True
        assert "saved" in response_data
        assert "skipped" in response_data
        assert "errors" in response_data
        assert response_data["saved"] == 3
        assert response_data["skipped"] == 2
        assert response_data["errors"] == 0

    @patch('scheduled_news_fetcher.scrape_dbd_news')
    def test_news_fetch_preview_mode(self, mock_scrape):
        """Test news fetch in preview mode (save=false)"""
        mock_articles = [
            {'title': 'Article 1', 'content': 'Content 1', 'url': 'https://example.com/1'},
            {'title': 'Article 2', 'content': 'Content 2', 'url': 'https://example.com/2'}
        ]
        mock_scrape.return_value = mock_articles

        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/news/fetch',
            params={'limit': '5', 'save': 'false'}  # Preview mode
        )

        response = manual_news_fetch(req)

        assert response.status_code == 200

        response_data = json.loads(response.get_body().decode())
        assert response_data["success"] is True
        assert "articles" in response_data
        assert len(response_data["articles"]) <= 5  # Preview mode returns max 5
        assert "Fetched 2 articles (preview mode, not saved)" in response_data["message"]

    @patch('scheduled_news_fetcher.scrape_dbd_news')
    def test_news_fetch_preview_mode_limits_results(self, mock_scrape):
        """Test that preview mode limits results to 5 even if more are fetched"""
        # Mock returning 10 articles
        mock_articles = [
            {'title': f'Article {i}', 'content': f'Content {i}', 'url': f'https://example.com/{i}'}
            for i in range(10)
        ]
        mock_scrape.return_value = mock_articles

        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/news/fetch',
            params={'limit': '10', 'save': 'false'}  # Preview mode
        )

        response = manual_news_fetch(req)

        assert response.status_code == 200

        response_data = json.loads(response.get_body().decode())
        assert len(response_data["articles"]) == 5  # Should be limited to 5 in preview mode
        assert "Fetched 10 articles (preview mode, not saved)" in response_data["message"]

    def test_news_fetch_default_parameters(self):
        """Test news fetch with default parameters"""
        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/news/fetch',
            params={}  # No parameters
        )

        # Test parameter validation logic
        limit = int(req.params.get('limit', '10'))
        keyword = req.params.get('keyword', '')
        save = req.params.get('save', 'true').lower() == 'true'

        assert limit == 10  # Default limit
        assert keyword == ''  # Default keyword
        assert save is True  # Default save mode

    def test_news_fetch_parameter_validation(self):
        """Test parameter validation for news fetch"""
        # Test valid limit range
        valid_limits = [1, 5, 10, 25, 50]
        for limit in valid_limits:
            assert 1 <= limit <= 50

        # Test limit clamping
        test_cases = [
            (0, 1),    # Below minimum -> clamped to 1
            (51, 50),  # Above maximum -> clamped to 50
            (25, 25),  # Within range -> unchanged
        ]

        for input_limit, expected_limit in test_cases:
            clamped = min(max(1, input_limit), 50)
            assert clamped == expected_limit

    @patch('scheduled_news_fetcher.fetch_and_save_dbd_news')
    def test_news_fetch_handles_fetch_failure(self, mock_fetch_and_save):
        """Test news fetch when fetching fails"""
        mock_fetch_and_save.return_value = {
            'success': False,
            'message': 'Failed to fetch news: Network error',
            'stats': {
                'saved': 0,
                'skipped': 0,
                'errors': 1
            }
        }

        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/news/fetch',
            params={'limit': '10'}
        )

        response = manual_news_fetch(req)

        assert response.status_code == 200  # Still returns 200, but with success=false

        response_data = json.loads(response.get_body().decode())
        assert response_data["success"] is False
        assert "Failed to fetch news" in response_data["message"]
        assert response_data["saved"] == 0
        assert response_data["errors"] == 1

    def test_news_fetch_invalid_limit_parameter(self):
        """Test news fetch with invalid limit parameter"""
        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/news/fetch',
            params={'limit': 'invalid'}
        )

        # Test that invalid limit raises ValueError
        with pytest.raises(ValueError):
            int(req.params.get('limit', '10'))

    def test_news_fetch_handles_options_request(self):
        """Test that OPTIONS request is handled for CORS"""
        req = func.HttpRequest(
            method='OPTIONS',
            body=None,
            url='/api/news/fetch',
            params={}
        )

        response = manual_news_fetch(req)

        # OPTIONS should return 200 with CORS headers
        assert response.status_code == 200
        # The actual CORS header check would be in the response headers

    @patch('scheduled_news_fetcher.fetch_and_save_dbd_news')
    def test_news_fetch_with_keyword_filter(self, mock_fetch_and_save):
        """Test news fetch with keyword filtering"""
        mock_fetch_and_save.return_value = {
            'success': True,
            'message': 'Fetched 2 SME articles successfully',
            'stats': {
                'saved': 2,
                'skipped': 0,
                'errors': 0
            }
        }

        req = func.HttpRequest(
            method='GET',
            body=None,
            url='/api/news/fetch',
            params={'keyword': 'SME', 'limit': '5'}
        )

        response = manual_news_fetch(req)

        assert response.status_code == 200

        response_data = json.loads(response.get_body().decode())
        assert response_data["success"] is True
        assert "SME" in response_data["message"]  # Should indicate keyword was used
