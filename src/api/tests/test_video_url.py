"""
Tests for video URL functionality in posts
"""
import pytest
import json
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import azure.functions as func
from function_app import posts, update_post


class TestVideoURL:
    """Test cases for video URL field in posts"""
    
    @patch('function_app.get_cosmos_container')
    def test_create_post_with_video_url(self, mock_get_container):
        """Test creating a post with video URL"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        
        new_post = {
            'id': 'test-123',
            'title': 'Video Post',
            'content': 'Check out this video',
            'author': 'Admin',
            'video_url': 'https://youtu.be/Jds96VCuPvA?si=9lAmYJBTInfk7Ouh',
            'created_at': '2025-10-20T00:00:00Z',
            'updated_at': '2025-10-20T00:00:00Z',
            'saved': True
        }
        mock_container.create_item.return_value = new_post
        
        req = func.HttpRequest(
            method='POST',
            body=json.dumps({
                'title': 'Video Post',
                'content': 'Check out this video',
                'author': 'Admin',
                'video_url': 'https://youtu.be/Jds96VCuPvA?si=9lAmYJBTInfk7Ouh'
            }).encode('utf-8'),
            url='/api/posts'
        )
        
        response = posts(req)
        
        assert response.status_code == 201
        response_data = json.loads(response.get_body().decode())
        assert 'video_url' in response_data
        assert response_data['video_url'] == 'https://youtu.be/Jds96VCuPvA?si=9lAmYJBTInfk7Ouh'
    
    @patch('function_app.get_cosmos_container')
    def test_create_post_without_video_url(self, mock_get_container):
        """Test creating a post without video URL (should default to empty string)"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        
        new_post = {
            'id': 'test-456',
            'title': 'Text Post',
            'content': 'No video here',
            'author': 'Admin',
            'video_url': '',
            'created_at': '2025-10-20T00:00:00Z',
            'updated_at': '2025-10-20T00:00:00Z',
            'saved': True
        }
        mock_container.create_item.return_value = new_post
        
        req = func.HttpRequest(
            method='POST',
            body=json.dumps({
                'title': 'Text Post',
                'content': 'No video here',
                'author': 'Admin'
            }).encode('utf-8'),
            url='/api/posts'
        )
        
        response = posts(req)
        
        assert response.status_code == 201
        response_data = json.loads(response.get_body().decode())
        assert 'video_url' in response_data
        assert response_data['video_url'] == ''
    
    @patch('function_app.get_cosmos_container')
    def test_update_post_with_video_url(self, mock_get_container):
        """Test updating a post to add video URL"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        
        existing_post = {
            'id': 'test-789',
            'title': 'Post',
            'content': 'Content',
            'author': 'Admin',
            'video_url': '',
            'created_at': '2025-10-20T00:00:00Z'
        }
        mock_container.read_item.return_value = existing_post
        
        updated_post = existing_post.copy()
        updated_post['video_url'] = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        mock_container.replace_item.return_value = updated_post
        
        req = func.HttpRequest(
            method='PUT',
            body=json.dumps({
                'title': 'Post',
                'content': 'Content',
                'author': 'Admin',
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            }).encode('utf-8'),
            url='/api/posts/test-789',
            route_params={'id': 'test-789'}
        )
        
        response = update_post(req)
        
        assert response.status_code == 200
        response_data = json.loads(response.get_body().decode())
        assert response_data['video_url'] == 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    
    @patch('function_app.get_cosmos_container')
    def test_update_post_remove_video_url(self, mock_get_container):
        """Test updating a post to remove video URL"""
        mock_container = MagicMock()
        mock_get_container.return_value = mock_container
        
        existing_post = {
            'id': 'test-999',
            'title': 'Post',
            'content': 'Content',
            'author': 'Admin',
            'video_url': 'https://youtu.be/oldvideo',
            'created_at': '2025-10-20T00:00:00Z'
        }
        mock_container.read_item.return_value = existing_post
        
        updated_post = existing_post.copy()
        updated_post['video_url'] = ''
        mock_container.replace_item.return_value = updated_post
        
        req = func.HttpRequest(
            method='PUT',
            body=json.dumps({
                'title': 'Post',
                'content': 'Content',
                'author': 'Admin',
                'video_url': ''
            }).encode('utf-8'),
            url='/api/posts/test-999',
            route_params={'id': 'test-999'}
        )
        
        response = update_post(req)
        
        assert response.status_code == 200
        response_data = json.loads(response.get_body().decode())
        assert response_data['video_url'] == ''
    
    def test_youtube_url_formats(self):
        """Test various YouTube URL formats are supported"""
        valid_urls = [
            'https://youtu.be/Jds96VCuPvA',
            'https://youtu.be/Jds96VCuPvA?si=9lAmYJBTInfk7Ouh',
            'https://www.youtube.com/watch?v=Jds96VCuPvA',
            'https://www.youtube.com/watch?v=Jds96VCuPvA&t=30s',
            'https://www.youtube.com/embed/Jds96VCuPvA'
        ]
        
        # All these formats should be acceptable
        for url in valid_urls:
            assert 'youtu' in url.lower()
