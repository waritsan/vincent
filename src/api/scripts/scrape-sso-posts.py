#!/usr/bin/env python3
"""
SSO Posts Scraper - Fetch posts from Social Security Office website
and add them to Cosmos DB with tags 'ประกันสังคม' and 'สวัสดิการ'
"""

import os
import sys
import time
import json
from datetime import datetime
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from azure.cosmos import CosmosClient, exceptions

# Configuration
SSO_URL = 'https://www.sso.go.th/wpr/main/privilege/%E0%B8%81%E0%B8%AD%E0%B8%87%E0%B8%97%E0%B8%B8%E0%B8%99%E0%B9%80%E0%B8%87%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%94%E0%B9%81%E0%B8%97%E0%B8%99_category_list-text-photo_1_126_0'

HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://www.sso.go.th/wpr/main/custom/custom_detail_detail_1_125_0/85'
}

# Cosmos DB configuration from environment variables
COSMOS_CONNECTION_STRING = os.environ.get('COSMOS_CONNECTION_STRING')
COSMOS_ENDPOINT = os.environ.get('COSMOS_ENDPOINT')
COSMOS_KEY = os.environ.get('COSMOS_KEY')
DATABASE_ID = os.environ.get('COSMOS_DATABASE_ID', 'vincent-db')
CONTAINER_ID = os.environ.get('COSMOS_CONTAINER_ID', 'posts')


def fetch_sso_posts():
    """Fetch posts list from SSO website"""
    print('Fetching posts from SSO website...')
    
    try:
        response = requests.get(SSO_URL, headers=HEADERS, timeout=30)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        soup = BeautifulSoup(response.text, 'html.parser')
        posts = []
        
        # Try multiple selector patterns
        selectors = [
            '.article-item',
            '.post-item',
            '.privilege-item',
            '.news-item',
            '.list-group-item',
            '.card',
            'article',
            '.content-item'
        ]
        
        for selector in selectors:
            items = soup.select(selector)
            if items:
                print(f'Found {len(items)} items with selector: {selector}')
                
                for item in items:
                    # Extract title
                    title_elem = item.find(['h2', 'h3', 'h4', 'h5']) or item.find(class_=['title', 'headline'])
                    if not title_elem:
                        title_elem = item.find('a')
                    
                    title = title_elem.get_text(strip=True) if title_elem else ''
                    
                    # Extract link
                    link_elem = item.find('a')
                    link = link_elem.get('href') if link_elem else None
                    if link:
                        link = urljoin('https://www.sso.go.th', link)
                    
                    # Extract image
                    img_elem = item.find('img')
                    image = img_elem.get('src') if img_elem else None
                    if image:
                        image = urljoin('https://www.sso.go.th', image)
                    
                    # Extract content/description
                    content_elem = item.find(['p', 'div'], class_=['description', 'excerpt', 'content'])
                    content = content_elem.get_text(strip=True) if content_elem else title
                    
                    if title and len(title) > 10:
                        posts.append({
                            'title': title,
                            'content': content,
                            'link': link,
                            'thumbnail_url': image
                        })
                
                if posts:
                    break
        
        # If still no posts, try generic list items
        if not posts:
            print('Trying generic list items...')
            items = soup.find_all(['li', 'tr'])
            for item in items:
                link_elem = item.find('a')
                if link_elem:
                    title = link_elem.get_text(strip=True)
                    link = urljoin('https://www.sso.go.th', link_elem.get('href', ''))
                    
                    if title and len(title) > 10:
                        posts.append({
                            'title': title,
                            'content': title,
                            'link': link,
                            'thumbnail_url': None
                        })
        
        print(f'Found {len(posts)} posts')
        return posts
        
    except Exception as e:
        print(f'Error fetching SSO posts: {e}')
        raise


def fetch_post_detail(url):
    """Fetch full content from post detail page"""
    print(f'Fetching detail from: {url}')
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try to find main content
        content_selectors = [
            '.content',
            '.article-content',
            '.post-content',
            '.detail',
            'article',
            'main',
            '.main-content'
        ]
        
        content = ''
        for selector in content_selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                content = content_elem.get_text(strip=True, separator='\n')
                if len(content) > 100:
                    break
        
        # Extract images
        images = []
        for img in soup.find_all('img'):
            src = img.get('src')
            if src:
                images.append(urljoin('https://www.sso.go.th', src))
        
        return {
            'content': content,
            'images': images
        }
        
    except Exception as e:
        print(f'Error fetching detail from {url}: {e}')
        return {'content': '', 'images': []}


def add_post_to_cosmos(container, post):
    """Add a post to Cosmos DB"""
    try:
        post_data = {
            'id': f"sso-{int(time.time())}-{os.urandom(4).hex()}",
            'title': post['title'],
            'content': post['content'],
            'author': 'สำนักงานประกันสังคม',
            'author_avatar': 'https://www.sso.go.th/assets/images/logo-sso.png',
            'thumbnail_url': post.get('thumbnail_url') or 'https://www.sso.go.th/assets/images/default-image.jpg',
            'video_url': None,
            'created_at': datetime.utcnow().isoformat(),
            'tags': ['ประกันสังคม', 'สวัสดิการ'],
            'source_url': post.get('link'),
            'source': 'sso.go.th'
        }
        
        container.create_item(body=post_data)
        print(f"✓ Added post: {post['title']}")
        return True
        
    except exceptions.CosmosResourceExistsError:
        print(f"⊗ Post already exists: {post['title']}")
        return False
    except Exception as e:
        print(f"✗ Error adding post: {post['title']} - {e}")
        return False


def main():
    print('=' * 60)
    print('SSO Posts Scraper - Adding to Cosmos DB')
    print('=' * 60)
    print()
    
    # Check Cosmos DB credentials
    if not COSMOS_CONNECTION_STRING and (not COSMOS_ENDPOINT or not COSMOS_KEY):
        print('Error: Cosmos DB credentials not configured.')
        print('Please set COSMOS_CONNECTION_STRING or (COSMOS_ENDPOINT and COSMOS_KEY) environment variables')
        sys.exit(1)
    
    try:
        # Initialize Cosmos DB client
        print('Connecting to Cosmos DB...')
        if COSMOS_CONNECTION_STRING:
            client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)
        else:
            client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
        database = client.get_database_client(DATABASE_ID)
        container = database.get_container_client(CONTAINER_ID)
        print('Connected to Cosmos DB')
        print()
        
        # Fetch posts from SSO
        posts = fetch_sso_posts()
        
        if not posts:
            print('No posts found. The page structure might have changed.')
            print('Please check the HTML structure manually.')
            return
        
        print()
        print('Posts found:')
        for i, post in enumerate(posts, 1):
            print(f"{i}. {post['title']}")
        
        print()
        print('Fetching full content for each post...')
        
        # Fetch full content for each post
        for post in posts:
            if post.get('link'):
                detail = fetch_post_detail(post['link'])
                if detail['content']:
                    post['content'] = detail['content']
                if detail['images'] and not post.get('thumbnail_url'):
                    post['thumbnail_url'] = detail['images'][0]
                
                # Add delay to avoid overwhelming the server
                time.sleep(1)
        
        print()
        print('Adding posts to Cosmos DB...')
        print()
        
        # Add posts to Cosmos DB
        success_count = 0
        for post in posts:
            if add_post_to_cosmos(container, post):
                success_count += 1
            
            # Add delay between insertions
            time.sleep(0.5)
        
        print()
        print('=' * 60)
        print(f'Summary: {success_count} out of {len(posts)} posts added successfully')
        print('=' * 60)
        
    except Exception as e:
        print(f'Fatal error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

