"""
News scraper for DBD (Department of Business Development) website
Fetches news articles from DBD API: https://www.dbd.go.th/api/frontend/content/category/
Supports multiple categories: Press Release, Activities, etc.
"""

import logging
import re
from datetime import datetime
from typing import List, Dict, Optional
import requests

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
        return datetime.utcnow().isoformat()
    
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
        return datetime.utcnow().isoformat()
        
    except Exception as e:
        logger.warning(f"Failed to parse date '{thai_date}': {e}")
        return datetime.utcnow().isoformat()


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
                    'source': 'กรมพัฒนาธุรกิจการค้า (DBD)'
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


def fetch_news_as_posts(limit: int = 10, keyword: str = '') -> List[Dict]:
    """
    Fetch news and format as post objects for the database
    
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
        
        # Format as post object
        post = {
            'title': article['title'],
            'content': article['content'] + f"\n\nอ่านเพิ่มเติม: {article['link']}",
            'author': 'กรมพัฒนาธุรกิจการค้า (DBD)',
            'author_avatar': 'https://www.dbd.go.th/images/Logo100.png',
            'thumbnail_url': article.get('image_url', ''),
            'tags': tags,
            'source_url': article['link'],
            'is_external': True,  # Mark as external content
            'created_at': article.get('created_at')  # Use article's original date
        }
        posts.append(post)
    
    logger.info(f'Formatted {len(posts)} news articles as posts')
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
