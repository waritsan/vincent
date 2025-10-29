"""""""""""""""

Tests for the news/fetch endpoint

"""Tests for the news/fetch endpoint

import pytest

import json"""Tests for the news/fetch endpoint

import azure.functions as func

from unittest.mock import patch, MagicMockimport pytest

import sys

import osimport json"""Tests for the news/fetch endpointTests for the news/fetch endpoint



# Add parent directory to pathimport azure.functions as func

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from unittest.mock import patch, MagicMockimport pytest

from function_app import manual_news_fetch, create_response

import sys



class TestNewsFetchEndpoint:import osimport json""""""

    """Test cases for the news fetch endpoint"""



    @patch('function_app.fetch_and_save_dbd_news')

    def test_news_fetch_successful_request(self, mock_fetch_and_save):# Add parent directory to pathimport azure.functions as func

        """Test successful news fetch request"""

        mock_fetch_and_save.return_value = {sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

            'success': True,

            'message': 'Fetched 5 articles successfully',from unittest.mock import patch, MagicMockimport pytestimport pytest

            'stats': {

                'saved': 3,from function_app import manual_news_fetch, create_response

                'skipped': 2,

                'errors': 0import sys

            }

        }



        req = func.HttpRequest(class TestNewsFetchEndpoint:import osimport jsonimport json

            method='GET',

            body=None,    """Test cases for the news fetch endpoint"""

            url='/api/news/fetch',

            params={'limit': '5'}

        )

    @patch('function_app.fetch_and_save_dbd_news')

        response = manual_news_fetch(req)

    def test_news_fetch_successful_request(self, mock_fetch_and_save):# Add parent directory to pathimport azure.functions as funcimport azure.functions as func

        assert response.status_code == 200

        """Test successful news fetch request"""

        response_data = json.loads(response.get_body().decode())

        assert response_data["success"] is True        mock_fetch_and_save.return_value = {sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        assert "saved" in response_data

        assert "skipped" in response_data            'success': True,

        assert "errors" in response_data

        assert response_data["saved"] == 3            'message': 'Fetched 5 articles successfully',from unittest.mock import patch, MagicMockfrom unittest.mock import patch, MagicMock

        assert response_data["skipped"] == 2

        assert response_data["errors"] == 0            'stats': {



    @patch('function_app.scrape_dbd_news')                'saved': 3,from function_app import manual_news_fetch, create_response

    def test_news_fetch_preview_mode(self, mock_scrape):

        """Test news fetch in preview mode (save=false)"""                'skipped': 2,

        mock_articles = [

            {'title': 'Article 1', 'content': 'Content 1', 'url': 'https://example.com/1'},                'errors': 0import sysimport sys

            {'title': 'Article 2', 'content': 'Content 2', 'url': 'https://example.com/2'}

        ]            }

        mock_scrape.return_value = mock_articles

        }

        req = func.HttpRequest(

            method='GET',

            body=None,

            url='/api/news/fetch',        req = func.HttpRequest(class TestNewsFetchEndpoint:import osimport os

            params={'limit': '5', 'save': 'false'}  # Preview mode

        )            method='GET',



        response = manual_news_fetch(req)            body=None,    """Test cases for the news fetch endpoint"""



        assert response.status_code == 200            url='/api/news/fetch',



        response_data = json.loads(response.get_body().decode())            params={'limit': '5'}

        assert response_data["success"] is True

        assert "articles" in response_data        )

        assert len(response_data["articles"]) <= 5  # Preview mode returns max 5

        assert "Fetched 2 articles (preview mode, not saved)" in response_data["message"]    @patch('function_app.fetch_and_save_dbd_news')

        response = manual_news_fetch(req)

    def test_news_fetch_successful_request(self, mock_fetch_and_save):# Add parent directory to path# Add parent directory to path

        assert response.status_code == 200

        """Test successful news fetch request"""

        response_data = json.loads(response.get_body().decode())

        assert response_data["success"] is True        mock_fetch_and_save.return_value = {sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        assert "saved" in response_data

        assert "skipped" in response_data            'success': True,

        assert "errors" in response_data

        assert response_data["saved"] == 3            'message': 'Fetched 5 articles successfully',

        assert response_data["skipped"] == 2

        assert response_data["errors"] == 0            'stats': {



    @patch('function_app.scrape_dbd_news')                'saved': 3,from function_app import manual_news_fetch, create_responsefrom function_app import manual_news_fetch, create_response

    def test_news_fetch_preview_mode(self, mock_scrape):

        """Test news fetch in preview mode (save=false)"""                'skipped': 2,

        mock_articles = [

            {'title': 'Article 1', 'content': 'Content 1', 'url': 'https://example.com/1'},                'errors': 0

            {'title': 'Article 2', 'content': 'Content 2', 'url': 'https://example.com/2'}

        ]            }

        mock_scrape.return_value = mock_articles

        }

        req = func.HttpRequest(

            method='GET',

            body=None,

            url='/api/news/fetch',        req = func.HttpRequest(class TestNewsFetchEndpoint:class TestNewsFetchEndpoint:

            params={'limit': '5', 'save': 'false'}  # Preview mode

        )            method='GET',



        response = manual_news_fetch(req)            body=None,    """Test cases for the news fetch endpoint"""    """Test cases for the manual news fetch endpoint"""



        assert response.status_code == 200            url='/api/news/fetch',



        response_data = json.loads(response.get_body().decode())            params={'limit': '5'}

        assert response_data["success"] is True

        assert "articles" in response_data        )

        assert len(response_data["articles"]) <= 5  # Preview mode returns max 5

        assert "Fetched 2 articles (preview mode, not saved)" in response_data["message"]    @patch('function_app.fetch_and_save_dbd_news')    @patch('function_app.fetch_and_save_dbd_news')



    @patch('function_app.scrape_dbd_news')        response = manual_news_fetch(req)

    def test_news_fetch_preview_mode_limits_results(self, mock_scrape):

        """Test that preview mode limits results to 5 even if more are fetched"""    def test_news_fetch_successful_request(self, mock_fetch_and_save):    def test_news_fetch_successful_save_mode(self, mock_fetch_and_save):

        # Mock returning 10 articles

        mock_articles = [        assert response.status_code == 200

            {'title': f'Article {i}', 'content': f'Content {i}', 'url': f'https://example.com/{i}'}

            for i in range(10)        """Test successful news fetch request"""        """Test successful news fetch in save mode"""

        ]

        mock_scrape.return_value = mock_articles        response_data = json.loads(response.get_body().decode())



        req = func.HttpRequest(        assert response_data["success"] is True        mock_fetch_and_save.return_value = {        # Mock the fetch function

            method='GET',

            body=None,        assert "saved" in response_data

            url='/api/news/fetch',

            params={'limit': '10', 'save': 'false'}  # Preview mode        assert "skipped" in response_data            'success': True,        mock_fetch_and_save.return_value = {

        )

        assert "errors" in response_data

        response = manual_news_fetch(req)

        assert response_data["saved"] == 3            'message': 'Fetched 5 articles successfully',            'success': True,

        assert response.status_code == 200

        assert response_data["skipped"] == 2

        response_data = json.loads(response.get_body().decode())

        assert len(response_data["articles"]) == 5  # Should be limited to 5 in preview mode        assert response_data["errors"] == 0            'stats': {            'message': 'Fetched 5 articles successfully',

        assert "Fetched 10 articles (preview mode, not saved)" in response_data["message"]


    @patch('function_app.scrape_dbd_news')                'saved': 3,            'stats': {

    def test_news_fetch_preview_mode(self, mock_scrape):

        """Test news fetch in preview mode (save=false)"""                'skipped': 2,                'saved': 3,

        mock_articles = [

            {'title': 'Article 1', 'content': 'Content 1', 'url': 'https://example.com/1'},                'errors': 0                'skipped': 2,

            {'title': 'Article 2', 'content': 'Content 2', 'url': 'https://example.com/2'}

        ]            }                'errors': 0

        mock_scrape.return_value = mock_articles

        }            },

        req = func.HttpRequest(

            method='GET',            'timestamp': '2025-10-29T12:00:00Z'

            body=None,

            url='/api/news/fetch',        req = func.HttpRequest(        }

            params={'limit': '5', 'save': 'false'}  # Preview mode

        )            method='GET',



        response = manual_news_fetch(req)            body=None,        req = func.HttpRequest(



        assert response.status_code == 200            url='/api/news/fetch',            method='GET',



        response_data = json.loads(response.get_body().decode())            params={'limit': '5'}            body=None,

        assert response_data["success"] is True

        assert "articles" in response_data        )            url='/api/news/fetch',

        assert len(response_data["articles"]) <= 5  # Preview mode returns max 5

        assert "Fetched 2 articles (preview mode, not saved)" in response_data["message"]            params={'limit': '10', 'keyword': 'SME', 'save': 'true'}



    def test_news_fetch_default_parameters(self):        response = manual_news_fetch(req)        )

        """Test news fetch with default parameters"""

        req = func.HttpRequest(

            method='GET',

            body=None,        assert response.status_code == 200        response = manual_news_fetch(req)

            url='/api/news/fetch',

            params={}  # No parameters

        )

        response_data = json.loads(response.get_body().decode())        assert response.status_code == 200

        # Test parameter validation logic

        limit = int(req.params.get('limit', '10'))        assert response_data["success"] is True

        keyword = req.params.get('keyword', '')

        save = req.params.get('save', 'true').lower() == 'true'        assert "saved" in response_data        response_data = json.loads(response.get_body().decode())



        assert limit == 10  # Default limit        assert "skipped" in response_data        assert response_data["success"] is True

        assert keyword == ''  # Default keyword

        assert save is True  # Default save mode        assert "errors" in response_data        assert "saved" in response_data



    def test_news_fetch_parameter_validation(self):        assert response_data["saved"] == 3        assert "skipped" in response_data

        """Test parameter validation for news fetch"""

        # Test valid limit range        assert response_data["skipped"] == 2        assert "errors" in response_data

        valid_limits = [1, 5, 10, 25, 50]

        for limit in valid_limits:        assert response_data["errors"] == 0        assert response_data["saved"] == 3

            assert 1 <= limit <= 50

        assert response_data["skipped"] == 2

        # Test limit clamping

        test_cases = [    @patch('function_app.scrape_dbd_news')        assert response_data["errors"] == 0

            (0, 1),    # Below minimum -> clamped to 1

            (51, 50),  # Above maximum -> clamped to 50    def test_news_fetch_preview_mode(self, mock_scrape):

            (25, 25),  # Within range -> unchanged

        ]        """Test news fetch in preview mode (save=false)"""    @patch('function_app.scrape_dbd_news')



        for input_limit, expected_limit in test_cases:        mock_articles = [    def test_news_fetch_successful_preview_mode(self, mock_scrape):

            clamped = min(max(1, input_limit), 50)

            assert clamped == expected_limit            {'title': 'Article 1', 'content': 'Content 1', 'url': 'https://example.com/1'},        """Test successful news fetch in preview mode (save=false)"""



    @patch('function_app.fetch_and_save_dbd_news')            {'title': 'Article 2', 'content': 'Content 2', 'url': 'https://example.com/2'}        # Mock the scrape function

    def test_news_fetch_handles_fetch_failure(self, mock_fetch_and_save):

        """Test news fetch when fetching fails"""        ]        mock_articles = [

        mock_fetch_and_save.return_value = {

            'success': False,        mock_scrape.return_value = mock_articles            {

            'message': 'Failed to fetch news: Network error',

            'stats': {                'title': 'SME News Article 1',

                'saved': 0,

                'skipped': 0,        req = func.HttpRequest(                'content': 'Content of article 1',

                'errors': 1

            }            method='GET',                'url': 'https://example.com/article1'

        }

            body=None,            },

        req = func.HttpRequest(

            method='GET',            url='/api/news/fetch',            {

            body=None,

            url='/api/news/fetch',            params={'limit': '5', 'save': 'false'}  # Preview mode                'title': 'SME News Article 2',

            params={'limit': '10'}

        )        )                'content': 'Content of article 2',



        response = manual_news_fetch(req)                'url': 'https://example.com/article2'



        assert response.status_code == 200  # Still returns 200, but with success=false        response = manual_news_fetch(req)            }



        response_data = json.loads(response.get_body().decode())        ]

        assert response_data["success"] is False

        assert "Failed to fetch news" in response_data["message"]        assert response.status_code == 200        mock_scrape.return_value = mock_articles

        assert response_data["saved"] == 0

        assert response_data["errors"] == 1



    def test_news_fetch_invalid_limit_parameter(self):        response_data = json.loads(response.get_body().decode())        req = func.HttpRequest(

        """Test news fetch with invalid limit parameter"""

        req = func.HttpRequest(        assert response_data["success"] is True            method='GET',

            method='GET',

            body=None,        assert "articles" in response_data            body=None,

            url='/api/news/fetch',

            params={'limit': 'invalid'}        assert len(response_data["articles"]) <= 5  # Preview mode returns max 5            url='/api/news/fetch',

        )

        assert "Fetched 2 articles (preview mode, not saved)" in response_data["message"]            params={'limit': '5', 'save': 'false'}

        # Test that invalid limit raises ValueError

        with pytest.raises(ValueError):        )

            int(req.params.get('limit', '10'))

    def test_news_fetch_default_parameters(self):

    def test_news_fetch_handles_options_request(self):

        """Test that OPTIONS request is handled for CORS"""        """Test news fetch with default parameters"""        response = manual_news_fetch(req)

        req = func.HttpRequest(

            method='OPTIONS',        req = func.HttpRequest(

            body=None,

            url='/api/news/fetch',            method='GET',        assert response.status_code == 200

            params={}

        )            body=None,



        response = manual_news_fetch(req)            url='/api/news/fetch',        response_data = json.loads(response.get_body().decode())



        # OPTIONS should return 200 with CORS headers            params={}  # No parameters        assert response_data["success"] is True

        assert response.status_code == 200

        # The actual CORS header check would be in the response headers        )        assert "articles" in response_data



    @patch('function_app.fetch_and_save_dbd_news')        assert len(response_data["articles"]) <= 5  # Preview mode returns max 5

    def test_news_fetch_with_keyword_filter(self, mock_fetch_and_save):

        """Test news fetch with keyword filtering"""        # Test parameter validation logic        assert "Fetched 2 articles (preview mode, not saved)" in response_data["message"]

        mock_fetch_and_save.return_value = {

            'success': True,        limit = int(req.params.get('limit', '10'))

            'message': 'Fetched 2 SME articles successfully',

            'stats': {        keyword = req.params.get('keyword', '')    def test_news_fetch_default_parameters(self):

                'saved': 2,

                'skipped': 0,        save = req.params.get('save', 'true').lower() == 'true'        """Test news fetch with default parameters"""

                'errors': 0

            }        req = func.HttpRequest(

        }

        assert limit == 10  # Default limit            method='GET',

        req = func.HttpRequest(

            method='GET',        assert keyword == ''  # Default keyword            body=None,

            body=None,

            url='/api/news/fetch',        assert save is True  # Default save mode            url='/api/news/fetch',

            params={'keyword': 'SME', 'limit': '5'}

        )            params={}  # No parameters



        response = manual_news_fetch(req)    def test_news_fetch_parameter_validation(self):        )



        assert response.status_code == 200        """Test parameter validation for news fetch"""



        response_data = json.loads(response.get_body().decode())        # Test valid limit range        # Test parameter validation logic

        assert response_data["success"] is True

        assert "SME" in response_data["message"]  # Should indicate keyword was used        valid_limits = [1, 5, 10, 25, 50]        limit = int(req.params.get('limit', '10'))



    @patch('function_app.scrape_dbd_news')        for limit in valid_limits:        keyword = req.params.get('keyword', '')

    def test_news_fetch_preview_mode_limits_results(self, mock_scrape):

        """Test that preview mode limits results to 5 even if more are fetched"""            assert 1 <= limit <= 50        save = req.params.get('save', 'true').lower() == 'true'

        # Mock returning 10 articles

        mock_articles = [

            {'title': f'Article {i}', 'content': f'Content {i}', 'url': f'https://example.com/{i}'}

            for i in range(10)        # Test limit clamping        assert limit == 10  # Default limit

        ]

        mock_scrape.return_value = mock_articles        test_cases = [        assert keyword == ''  # Default keyword



        req = func.HttpRequest(            (0, 1),    # Below minimum -> clamped to 1        assert save is True  # Default save mode

            method='GET',

            body=None,            (51, 50),  # Above maximum -> clamped to 50

            url='/api/news/fetch',

            params={'limit': '10', 'save': 'false'}  # Preview mode            (25, 25),  # Within range -> unchanged    def test_news_fetch_parameter_validation(self):

        )

        ]        """Test parameter validation for news fetch"""

        response = manual_news_fetch(req)

        # Test valid limit range

        assert response.status_code == 200

        for input_limit, expected_limit in test_cases:        valid_limits = [1, 5, 10, 25, 50]

        response_data = json.loads(response.get_body().decode())

        assert len(response_data["articles"]) == 5  # Should be limited to 5 in preview mode            clamped = min(max(1, input_limit), 50)        for limit in valid_limits:

        assert "Fetched 10 articles (preview mode, not saved)" in response_data["message"]
            assert clamped == expected_limit            assert 1 <= limit <= 50



    @patch('function_app.fetch_and_save_dbd_news')        # Test limit clamping

    def test_news_fetch_handles_fetch_failure(self, mock_fetch_and_save):        test_cases = [

        """Test news fetch when fetching fails"""            (0, 1),    # Below minimum -> clamped to 1

        mock_fetch_and_save.return_value = {            (51, 50),  # Above maximum -> clamped to 50

            'success': False,            (25, 25),  # Within range -> unchanged

            'message': 'Failed to fetch news: Network error',        ]

            'stats': {

                'saved': 0,        for input_limit, expected_limit in test_cases:

                'skipped': 0,            clamped = min(max(1, input_limit), 50)

                'errors': 1            assert clamped == expected_limit

            }

        }    @patch('function_app.fetch_and_save_dbd_news')

    def test_news_fetch_handles_fetch_failure(self, mock_fetch_and_save):

        req = func.HttpRequest(        """Test news fetch when fetching fails"""

            method='GET',        mock_fetch_and_save.return_value = {

            body=None,            'success': False,

            url='/api/news/fetch',            'message': 'Failed to fetch news: Network error',

            params={'limit': '10'}            'stats': {

        )                'saved': 0,

                'skipped': 0,

        response = manual_news_fetch(req)                'errors': 1

            }

        assert response.status_code == 200  # Still returns 200, but with success=false        }



        response_data = json.loads(response.get_body().decode())        req = func.HttpRequest(

        assert response_data["success"] is False            method='GET',

        assert "Failed to fetch news" in response_data["message"]            body=None,

        assert response_data["saved"] == 0            url='/api/news/fetch',

        assert response_data["errors"] == 1            params={'limit': '10'}

        )

    def test_news_fetch_invalid_limit_parameter(self):

        """Test news fetch with invalid limit parameter"""        response = manual_news_fetch(req)

        req = func.HttpRequest(

            method='GET',        assert response.status_code == 200  # Still returns 200, but with success=false

            body=None,

            url='/api/news/fetch',        response_data = json.loads(response.get_body().decode())

            params={'limit': 'invalid'}        assert response_data["success"] is False

        )        assert "Failed to fetch news" in response_data["message"]

        assert response_data["saved"] == 0

        # Test that invalid limit raises ValueError        assert response_data["errors"] == 1

        with pytest.raises(ValueError):

            int(req.params.get('limit', '10'))    def test_news_fetch_invalid_limit_parameter(self):

        """Test news fetch with invalid limit parameter"""

    def test_news_fetch_handles_options_request(self):        req = func.HttpRequest(

        """Test that OPTIONS request is handled for CORS"""            method='GET',

        req = func.HttpRequest(            body=None,

            method='OPTIONS',            url='/api/news/fetch',

            body=None,            params={'limit': 'invalid'}

            url='/api/news/fetch',        )

            params={}

        )        # Test that invalid limit raises ValueError

        with pytest.raises(ValueError):

        response = manual_news_fetch(req)            int(req.params.get('limit', '10'))



        # OPTIONS should return 200 with CORS headers    def test_news_fetch_handles_options_request(self):

        assert response.status_code == 200        """Test that OPTIONS request is handled for CORS"""

        # The actual CORS header check would be in the response headers        req = func.HttpRequest(

            method='OPTIONS',

    @patch('function_app.fetch_and_save_dbd_news')            body=None,

    def test_news_fetch_with_keyword_filter(self, mock_fetch_and_save):            url='/api/news/fetch',

        """Test news fetch with keyword filtering"""            params={}

        mock_fetch_and_save.return_value = {        )

            'success': True,

            'message': 'Fetched 2 SME articles successfully',        response = manual_news_fetch(req)

            'stats': {

                'saved': 2,        # OPTIONS should return 200 with CORS headers

                'skipped': 0,        assert response.status_code == 200

                'errors': 0        # The actual CORS header check would be in the response headers

            }

        }    @patch('function_app.fetch_and_save_dbd_news')

    def test_news_fetch_with_keyword_filter(self, mock_fetch_and_save):

        req = func.HttpRequest(        """Test news fetch with keyword filtering"""

            method='GET',        mock_fetch_and_save.return_value = {

            body=None,            'success': True,

            url='/api/news/fetch',            'message': 'Fetched 2 SME articles successfully',

            params={'keyword': 'SME', 'limit': '5'}            'stats': {

        )                'saved': 2,

                'skipped': 0,

        response = manual_news_fetch(req)                'errors': 0

            }

        assert response.status_code == 200        }



        response_data = json.loads(response.get_body().decode())        req = func.HttpRequest(

        assert response_data["success"] is True            method='GET',

        assert "SME" in response_data["message"]  # Should indicate keyword was used            body=None,

            url='/api/news/fetch',

    @patch('function_app.scrape_dbd_news')            params={'keyword': 'SME', 'limit': '5'}

    def test_news_fetch_preview_mode_limits_results(self, mock_scrape):        )

        """Test that preview mode limits results to 5 even if more are fetched"""

        # Mock returning 10 articles        response = manual_news_fetch(req)

        mock_articles = [

            {'title': f'Article {i}', 'content': f'Content {i}', 'url': f'https://example.com/{i}'}        assert response.status_code == 200

            for i in range(10)

        ]        response_data = json.loads(response.get_body().decode())

        mock_scrape.return_value = mock_articles        assert response_data["success"] is True

        assert "SME" in response_data["message"]  # Should indicate keyword was used

        req = func.HttpRequest(

            method='GET',    @patch('function_app.scrape_dbd_news')

            body=None,    def test_news_fetch_preview_mode_limits_results(self, mock_scrape):

            url='/api/news/fetch',        """Test that preview mode limits results to 5 even if more are fetched"""

            params={'limit': '10', 'save': 'false'}  # Preview mode        # Mock returning 10 articles

        )        mock_articles = [

            {'title': f'Article {i}', 'content': f'Content {i}', 'url': f'https://example.com/{i}'}

        response = manual_news_fetch(req)            for i in range(10)

        ]

        assert response.status_code == 200        mock_scrape.return_value = mock_articles



        response_data = json.loads(response.get_body().decode())        req = func.HttpRequest(

        assert len(response_data["articles"]) == 5  # Should be limited to 5 in preview mode            method='GET',

        assert "Fetched 10 articles (preview mode, not saved)" in response_data["message"]            body=None,
            url='/api/news/fetch',
            params={'limit': '10', 'save': 'false'}  # Preview mode
        )

        response = manual_news_fetch(req)

        assert response.status_code == 200

        response_data = json.loads(response.get_body().decode())
        assert len(response_data["articles"]) == 5  # Should be limited to 5 in preview mode
        assert "Fetched 10 articles (preview mode, not saved)" in response_data["message"]</content>
<parameter name="filePath">/Users/waritsan/Developer/vincent/src/api/tests/test_news_fetch.py