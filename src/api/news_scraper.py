"""
News scraper for DBD (Department of Business Development) website
Fetches news articles from DBD API: https://www.dbd.go.th/api/frontend/content/category/
Supports multiple categories: Press Release, Activities, etc.
"""

import logging
import re
import os
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple
import requests
from azure.storage.blob import BlobServiceClient
from ai_utils import generate_ai_tags

logger = logging.getLogger(__name__)


def clean_html_text(html_text: str) -> str:
    """Remove HTML tags and clean up text content"""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', html_text)
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove &nbsp; entities
    text = text.replace('&nbsp;', ' ')
    return text.strip()


def parse_thai_date(thai_date: str) -> str:
    """
    Convert Thai date format to ISO format
    Input: "22 ตุลาคม 2568" or "October 22, 2025"
    Output: "2025-10-22T00:00:00Z"
    """
    if not thai_date:
        return datetime.now(timezone.utc).isoformat()
    
    try:
        # Thai month names mapping
        thai_months = {
            'มกราคม': 1, 'กุมภาพันธ์': 2, 'มีนาคม': 3, 'เมษายน': 4,
            'พฤษภาคม': 5, 'มิถุนายน': 6, 'กรกฎาคม': 7, 'สิงหาคม': 8,
            'กันยายน': 9, 'ตุลาคม': 10, 'พฤศจิกายน': 11, 'ธันวาคม': 12
        }
        
        # English month names (some DBD articles use English dates)
        english_months = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
        }
        
        # Try to parse Thai format: "22 ตุลาคม 2568"
        parts = thai_date.strip().split()
        if len(parts) == 3:
            day = int(parts[0])
            month_name = parts[1]
            year = int(parts[2])
            
            # Check if it's Thai month
            if month_name in thai_months:
                month = thai_months[month_name]
                # Convert Buddhist year to Gregorian (subtract 543)
                if year > 2500:
                    year -= 543
            # Check if it's English month
            elif month_name in english_months:
                month = english_months[month_name]
            else:
                raise ValueError(f"Unknown month: {month_name}")
            
            # Create datetime object
            date_obj = datetime(year, month, day)
            return date_obj.isoformat() + 'Z'
        
        # Try to parse English format: "October 22, 2025"
        if ',' in thai_date:
            date_obj = datetime.strptime(thai_date, '%B %d, %Y')
            return date_obj.isoformat() + 'Z'
        
        # Fallback
        return datetime.now(timezone.utc).isoformat()
        
    except Exception as e:
        logger.warning(f"Failed to parse date '{thai_date}': {e}")
        return datetime.now(timezone.utc).isoformat()


def get_blob_service_client() -> Optional[BlobServiceClient]:
    """Get Azure Blob Storage service client"""
    try:
        connection_string = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
        if not connection_string:
            logger.warning("AZURE_STORAGE_CONNECTION_STRING not found")
            return None
        
        return BlobServiceClient.from_connection_string(connection_string)
    except Exception as e:
        logger.error(f"Failed to create blob service client: {e}")
        return None


def store_content_in_blob(content: str, blob_name: str) -> Optional[str]:
    """
    Store content in Azure Blob Storage
    
    Args:
        content: The content to store
        blob_name: Name of the blob (e.g., 'articles/article-123.txt')
    
    Returns:
        Blob URL if successful, None otherwise
    """
    try:
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            return None
        
        # Get blob client
        blob_client = blob_service_client.get_blob_client(
            container="articles", 
            blob=blob_name
        )
        
        # Upload content
        blob_client.upload_blob(content, overwrite=True)
        
        logger.info(f"Stored content in blob: {blob_name}")
        return blob_client.url
        
    except Exception as e:
        logger.error(f"Failed to store content in blob '{blob_name}': {e}")
        return None


def get_content_from_blob(blob_url: str) -> Optional[str]:
    """
    Retrieve content from Azure Blob Storage
    
    Args:
        blob_url: The blob URL
    
    Returns:
        Content string if successful, None otherwise
    """
    try:
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            return None
        
        # Parse blob URL to get container and blob name
        # URL format: https://account.blob.core.windows.net/container/blob
        url_parts = blob_url.split('/')
        container_name = url_parts[-2]
        blob_name = url_parts[-1]
        
        blob_client = blob_service_client.get_blob_client(
            container=container_name, 
            blob=blob_name
        )
        
        # Download content
        download_stream = blob_client.download_blob()
        content = download_stream.readall().decode('utf-8')
        
        return content
        
    except Exception as e:
        logger.error(f"Failed to retrieve content from blob '{blob_url}': {e}")
        return None


def should_store_in_blob(content: str, threshold_kb: int = 5) -> bool:
    """
    Determine if content should be stored in blob storage based on size
    
    Args:
        content: The content to check
        threshold_kb: Size threshold in KB (default: 5KB)
    
    Returns:
        True if content should be stored in blob, False otherwise
    """
    content_size_kb = len(content.encode('utf-8')) / 1024
    return content_size_kb >= threshold_kb


def create_content_preview(content: str, max_length: int = 500) -> str:
    """
    Create a preview of the content for storage in Cosmos DB
    
    Args:
        content: Full content
        max_length: Maximum preview length
    
    Returns:
        Content preview
    """
    if len(content) <= max_length:
        return content
    
    # Try to cut at word boundary
    preview = content[:max_length]
    last_space = preview.rfind(' ')
    
    if last_space > max_length * 0.8:  # If space is not too far back
        preview = preview[:last_space]
    
    return preview + "..."


def scrape_dbd_news(limit: int = 10, keyword: str = '') -> List[Dict]:
    """
    Fetch news from DBD API
    
    Args:
        limit: Number of articles to fetch (default: 10)
        keyword: Optional keyword to filter articles (e.g., 'นอมินี', 'SME', 'แฟรนไชส์')
    
    Returns:
        List of news articles with title, content, link, date, image_url, and source
    """
    # Build URL with optional keyword parameter
    url = f'https://www.dbd.go.th/api/frontend/content/category/1656067670544?page=1&limit={limit}&slug=1656067670544'
    if keyword:
        import urllib.parse
        encoded_keyword = urllib.parse.quote(keyword)
        url += f'&keyword={encoded_keyword}'
    
    try:
        logger.info(f'Fetching news from DBD API with keyword: "{keyword if keyword else "none"}"')
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'th',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.dbd.go.th/news/1656067670544/list',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('statusCode') != 200:
            logger.error(f"API returned error: {data.get('message')}")
            return []
        
        articles = []
        results = data.get('data', {}).get('result', [])
        total = data.get('data', {}).get('total', 0)
        
        logger.info(f'Found {total} total articles, fetching {len(results)} results')
        
        for item in results[:limit]:
            try:
                # Extract article data
                title = item.get('title', '').strip()
                intro = item.get('intro', '').strip()
                text = item.get('text', '')
                slug = item.get('slug', '')
                date = item.get('date', '')
                thumbnail = item.get('thumbnail', '')
                
                # Clean HTML from text content
                content_text = clean_html_text(text) if text else intro
                
                # Build article URL
                article_url = f'https://www.dbd.go.th/news/{slug}' if slug else 'https://www.dbd.go.th'
                
                # Parse the date to ISO format
                iso_date = parse_thai_date(date)
                
                article = {
                    'title': title,
                    'content': content_text,
                    'link': article_url,
                    'date': date,  # Original date string for display
                    'created_at': iso_date,  # Parsed ISO date for database
                    'image_url': thumbnail if thumbnail else '',
                    'source': 'กรมพัฒนาธุรกิจการค้า (DBD)',
                    'slug': slug
                }
                
                articles.append(article)
                logger.debug(f'Extracted article: {title[:50]}...')
                
            except Exception as e:
                logger.error(f'Error parsing article: {e}')
                continue
        
        logger.info(f'Successfully scraped {len(articles)} articles from DBD API')
        return articles
        
    except requests.exceptions.RequestException as e:
        logger.error(f'Error fetching from DBD API: {e}')
        return []
    except Exception as e:
        logger.error(f'Unexpected error in scrape_dbd_news: {e}')
        return []


def fetch_dbd_article_by_slug(slug: str) -> Optional[Dict]:
    """
    Fetch a single DBD article by its slug/ID
    
    Args:
        slug: Article slug or ID (e.g., '1924102568')
    
    Returns:
        Article dictionary or None if not found
    """
    try:
        logger.info(f'Fetching DBD article with slug: {slug}')
        
        # Fetch recent articles and search for matching slug
        articles = scrape_dbd_news(limit=50)  # Fetch more to increase chance of finding it
        
        for article in articles:
            if article.get('slug') == slug or slug in article.get('link', ''):
                logger.info(f'Found matching article: {article["title"]}')
                return article
        
        # If not found in recent articles, try the article detail API
        detail_url = f'https://www.dbd.go.th/api/frontend/content/{slug}'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
            'Accept': 'application/json',
        }
        
        response = requests.get(detail_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('statusCode') == 200 and data.get('data'):
            item = data['data']
            
            title = item.get('title', '').strip()
            intro = item.get('intro', '').strip()
            text = item.get('text', '')
            date = item.get('date', '')
            thumbnail = item.get('thumbnail', '')
            
            content_text = clean_html_text(text) if text else intro
            article_url = f'https://www.dbd.go.th/news/{slug}'
            iso_date = parse_thai_date(date)
            
            return {
                'title': title,
                'content': content_text,
                'link': article_url,
                'date': date,
                'created_at': iso_date,
                'image_url': thumbnail if thumbnail else '',
                'source': 'กรมพัฒนาธุรกิจการค้า (DBD)',
                'slug': slug
            }
        
        logger.warning(f'Article with slug {slug} not found in DBD API')
        return None
        
    except Exception as e:
        logger.error(f'Error fetching DBD article by slug: {e}')
        return None


def fetch_news_as_posts(limit: int = 10, keyword: str = '') -> List[Dict]:
    """
    Fetch news and format as post objects for the database with hybrid storage
    
    Args:
        limit: Number of articles to fetch
        keyword: Optional keyword to filter articles
    
    Returns:
        List of post objects with all required fields
    """
    news_articles = scrape_dbd_news(limit, keyword)
    
    posts = []
    for article in news_articles:
        # Base tags
        tags = ['ข่าวประชาสัมพันธ์', 'DBD', 'กรมพัฒนาธุรกิจการค้า']
        
        # Add keyword as a tag if provided
        if keyword and keyword not in tags:
            tags.append(keyword)
        
        # Generate AI-powered tags for this article
        try:
            ai_tags = generate_ai_tags(full_content, article.get('title', ''))
            if ai_tags:
                # Add AI-generated tags, avoiding duplicates
                for tag in ai_tags:
                    if tag not in tags:
                        tags.append(tag)
                logger.info(f"Generated AI tags for '{article['title'][:30]}...': {ai_tags}")
            else:
                logger.info(f"No AI tags generated for '{article['title'][:30]}...', using base tags")
        except Exception as e:
            logger.warning(f"Failed to generate AI tags for '{article['title'][:30]}...': {e}")
        
        # Prepare full content with source link
        full_content = article['content'] + f"\n\nอ่านเพิ่มเติม: {article['link']}"
        
        # Determine storage strategy based on content size
        if should_store_in_blob(full_content):
            # Store large content in blob storage
            blob_name = f"articles/dbd-{article.get('slug', 'unknown')}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.txt"
            blob_url = store_content_in_blob(full_content, blob_name)
            
            if blob_url:
                # Store preview in Cosmos DB and reference blob
                post = {
                    'title': article['title'],
                    'content': create_content_preview(full_content),
                    'content_blob_url': blob_url,
                    'content_storage': 'blob',  # Mark storage type
                    'author': 'กรมพัฒนาธุรกิจการค้า (DBD)',
                    'author_avatar': 'https://www.dbd.go.th/images/Logo100.png',
                    'thumbnail_url': article.get('image_url', ''),
                    'tags': tags,
                    'source_url': article['link'],
                    'is_external': True,  # Mark as external content
                    'created_at': article.get('created_at')  # Use article's original date
                }
                logger.info(f"Stored large article '{article['title'][:50]}...' in blob storage")
            else:
                # Fallback to Cosmos DB if blob storage fails
                post = {
                    'title': article['title'],
                    'content': full_content,
                    'content_storage': 'cosmos',
                    'author': 'กรมพัฒนาธุรกิจการค้า (DBD)',
                    'author_avatar': 'https://www.dbd.go.th/images/Logo100.png',
                    'thumbnail_url': article.get('image_url', ''),
                    'tags': tags,
                    'source_url': article['link'],
                    'is_external': True,
                    'created_at': article.get('created_at')
                }
                logger.warning(f"Blob storage failed for '{article['title'][:50]}...', stored in Cosmos DB")
        else:
            # Store small content directly in Cosmos DB
            post = {
                'title': article['title'],
                'content': full_content,
                'content_storage': 'cosmos',
                'author': 'กรมพัฒนาธุรกิจการค้า (DBD)',
                'author_avatar': 'https://www.dbd.go.th/images/Logo100.png',
                'thumbnail_url': article.get('image_url', ''),
                'tags': tags,
                'source_url': article['link'],
                'is_external': True,
                'created_at': article.get('created_at')
            }
        
        posts.append(post)
    
    logger.info(f'Formatted {len(posts)} news articles as posts with hybrid storage')
    return posts


if __name__ == '__main__':
    # Test the scraper
    logging.basicConfig(level=logging.INFO)
    
    print("Testing DBD news scraper with API...")
    print("=" * 50)
    
    articles = scrape_dbd_news(limit=5)
    
    if articles:
        print(f"\nSuccessfully fetched {len(articles)} articles\n")
        
        for i, article in enumerate(articles, 1):
            print(f"{i}. {article['title']}")
            print(f"   Date: {article['date']}")
            print(f"   Link: {article['link']}")
            print(f"   Image: {article['image_url'][:60]}..." if article['image_url'] else "   No image")
            print(f"   Content: {article['content'][:100]}...")
            print()
    else:
        print("No articles fetched. Check logs for errors.")
    
    print("\nTesting post formatting...")
    print("=" * 50)
    
    posts = fetch_news_as_posts(limit=3)
    if posts:
        print(f"\nFormatted {len(posts)} posts\n")
        print(f"First post structure:")
        print(f"  - Title: {posts[0]['title'][:50]}...")
        print(f"  - Author: {posts[0]['author']}")
        print(f"  - Tags: {posts[0]['tags']}")
        print(f"  - External: {posts[0]['is_external']}")
