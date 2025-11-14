"""
YouTube video fetcher for The Globe Online channel
Automatically fetches latest videos from YouTube channel and saves to JSON file
Runs on a schedule (e.g., daily)
"""

import logging
import json
import os
from datetime import datetime, timezone
from typing import List, Dict
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# YouTube API configuration
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
CHANNEL_HANDLE = '@TheGlobeOnline'  # The channel handle
CHANNEL_ID = 'UCExKeTHM9MU91X7nls4JrSA'  # Known channel ID for @TheGlobeOnline

def get_youtube_service():
    """Get YouTube API service"""
    if not YOUTUBE_API_KEY:
        logger.error("YOUTUBE_API_KEY not found in environment variables")
        return None
    
    try:
        return build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    except Exception as e:
        logger.error(f"Failed to create YouTube service: {e}")
        return None

def get_channel_id_from_handle(youtube, handle: str) -> str:
    """Get channel ID from channel handle"""
    try:
        # Remove @ if present
        handle = handle.lstrip('@')
        
        # Search for the channel
        request = youtube.search().list(
            part='snippet',
            q=handle,
            type='channel',
            maxResults=1
        )
        response = request.execute()
        
        if response['items']:
            channel_id = response['items'][0]['snippet']['channelId']
            logger.info(f"Found channel ID for @{handle}: {channel_id}")
            return channel_id
        else:
            logger.error(f"Channel @{handle} not found")
            return None
            
    except HttpError as e:
        logger.error(f"YouTube API error getting channel ID: {e}")
        return None
    except Exception as e:
        logger.error(f"Error getting channel ID: {e}")
        return None

def fetch_latest_videos(youtube, channel_id: str, max_results: int = 3) -> List[Dict]:
    """Fetch latest videos from a YouTube channel"""
    try:
        # Get channel uploads playlist ID
        channel_request = youtube.channels().list(
            part='contentDetails',
            id=channel_id
        )
        channel_response = channel_request.execute()
        
        if not channel_response['items']:
            logger.error(f"Channel {channel_id} not found")
            return []
        
        uploads_playlist_id = channel_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        
        # Get latest videos from uploads playlist
        playlist_request = youtube.playlistItems().list(
            part='snippet',
            playlistId=uploads_playlist_id,
            maxResults=max_results
        )
        playlist_response = playlist_request.execute()
        
        videos = []
        for item in playlist_response['items']:
            snippet = item['snippet']
            video_id = snippet['resourceId']['videoId']
            
            # Get additional video details
            video_request = youtube.videos().list(
                part='statistics,contentDetails',
                id=video_id
            )
            video_response = video_request.execute()
            
            if video_response['items']:
                video_stats = video_response['items'][0]
                
                video_data = {
                    'video_id': video_id,
                    'title': snippet['title'],
                    'description': snippet['description'][:200] + '...' if len(snippet['description']) > 200 else snippet['description'],
                    'thumbnail_url': snippet['thumbnails'].get('maxres', snippet['thumbnails'].get('high', snippet['thumbnails'].get('default', {}))).get('url', ''),
                    'published_at': snippet['publishedAt'],
                    'url': f'https://www.youtube.com/watch?v={video_id}',
                    'embed_url': f'https://www.youtube.com/embed/{video_id}',
                    'channel_title': snippet['channelTitle'],
                    'view_count': video_stats.get('statistics', {}).get('viewCount', '0'),
                    'like_count': video_stats.get('statistics', {}).get('likeCount', '0'),
                    'duration': video_stats.get('contentDetails', {}).get('duration', ''),
                    'fetched_at': datetime.now(timezone.utc).isoformat()
                }
                videos.append(video_data)
        
        logger.info(f"Fetched {len(videos)} videos from channel {channel_id}")
        return videos
        
    except HttpError as e:
        logger.error(f"YouTube API error fetching videos: {e}")
        return []
    except Exception as e:
        logger.error(f"Error fetching videos: {e}")
        return []

def save_videos_to_json(videos: List[Dict], file_path: str = '/Users/waritsan/Developer/vincent/src/web/public/youtube_videos.json') -> bool:
    """Save videos to JSON file"""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        data = {
            'videos': videos,
            'last_updated': datetime.now(timezone.utc).isoformat(),
            'channel': CHANNEL_HANDLE,
            'count': len(videos)
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved {len(videos)} videos to {file_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving videos to JSON: {e}")
        return False

def fetch_and_save_youtube_videos(limit: int = 3) -> Dict:
    """
    Main function to fetch and save YouTube videos
    
    Args:
        limit: Number of videos to fetch
    
    Returns:
        Statistics about the operation
    """
    logger.info(f"Starting YouTube video fetch (limit: {limit})")
    
    try:
        youtube = get_youtube_service()
        if not youtube:
            logger.warning("YouTube API not configured, using sample data")
            # Return sample data for development
            sample_videos = [
                {
                    'video_id': 'dQw4w9WgXcQ',
                    'title': 'Sample YouTube Video 1 - The Globe Online',
                    'description': 'This is a sample video. Please configure YOUTUBE_API_KEY to fetch real videos.',
                    'thumbnail_url': 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                    'published_at': '2024-11-10T10:00:00Z',
                    'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'embed_url': 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    'channel_title': 'The Globe Online',
                    'view_count': '1000000',
                    'like_count': '50000',
                    'duration': 'PT4M13S',
                    'fetched_at': datetime.now(timezone.utc).isoformat()
                },
                {
                    'video_id': '9bZkp7q19f0',
                    'title': 'Sample YouTube Video 2 - The Globe Online',
                    'description': 'Another sample video for testing the carousel.',
                    'thumbnail_url': 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
                    'published_at': '2024-11-12T15:30:00Z',
                    'url': 'https://www.youtube.com/watch?v=9bZkp7q19f0',
                    'embed_url': 'https://www.youtube.com/embed/9bZkp7q19f0',
                    'channel_title': 'The Globe Online',
                    'view_count': '500000',
                    'like_count': '25000',
                    'duration': 'PT6M45S',
                    'fetched_at': datetime.now(timezone.utc).isoformat()
                },
                {
                    'video_id': 'jNQXAC9IVRw',
                    'title': 'Sample YouTube Video 3 - The Globe Online',
                    'description': 'Third sample video for the carousel.',
                    'thumbnail_url': 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
                    'published_at': '2024-11-13T08:15:00Z',
                    'url': 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
                    'embed_url': 'https://www.youtube.com/embed/jNQXAC9IVRw',
                    'channel_title': 'The Globe Online',
                    'view_count': '750000',
                    'like_count': '35000',
                    'duration': 'PT3M22S',
                    'fetched_at': datetime.now(timezone.utc).isoformat()
                }
            ]
            
            videos = sample_videos[:limit]
            saved = save_videos_to_json(videos)
            
            if saved:
                return {
                    "success": True,
                    "message": f"Saved {len(videos)} sample videos (API not configured)",
                    "videos": videos,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to save sample videos",
                    "videos": videos
                }
        
        # Use the known channel ID
        channel_id = CHANNEL_ID
        
        # Fetch videos
        videos = fetch_latest_videos(youtube, channel_id, limit)
        
        if not videos:
            logger.warning("No videos fetched from YouTube")
            return {
                "success": False,
                "message": "No videos fetched",
                "videos": []
            }
        
        # Save to JSON
        saved = save_videos_to_json(videos)
        
        if saved:
            logger.info(f"Successfully saved {len(videos)} YouTube videos")
            return {
                "success": True,
                "message": f"Fetched and saved {len(videos)} videos",
                "videos": videos,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            return {
                "success": False,
                "message": "Failed to save videos to JSON",
                "videos": videos
            }
        
    except Exception as e:
        logger.error(f"Error in fetch_and_save_youtube_videos: {e}")
        return {
            "success": False,
            "message": str(e),
            "videos": []
        }

# For testing locally
if __name__ == '__main__':
    logger.info("Testing YouTube video fetcher...")
    result = fetch_and_save_youtube_videos(limit=3)
    
    print("\n" + "="*60)
    print("YOUTUBE VIDEO FETCH RESULT")
    print("="*60)
    print(f"Success: {result['success']}")
    print(f"Message: {result['message']}")
    print(f"Videos fetched: {len(result.get('videos', []))}")
    if result.get('videos'):
        for i, video in enumerate(result['videos'], 1):
            print(f"\nVideo {i}:")
            print(f"  Title: {video['title']}")
            print(f"  URL: {video['url']}")
            print(f"  Published: {video['published_at']}")
    print(f"\nTimestamp: {result.get('timestamp', 'N/A')}")
    print("="*60)