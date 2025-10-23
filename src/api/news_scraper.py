"""
News scraper for DBD (Department of Business Development) website
Fetches news articles from DBD API: https://www.dbd.go.th/api/frontend/content/category/1656067670544
"""

import logging
import re
from datetime import datetime
from typing import List, Dict
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


def scrape_dbd_news(limit: int = 10) -> List[Dict]:
    """
    Fetch news from DBD API
    Returns a list of news articles with title, content, link, date, image_url, and source
    """
    url = f'https://www.dbd.go.th/api/frontend/content/category/1656067670544?page=1&limit={limit}&slug=1656067670544'
    
    try:
        logger.info(f'Fetching news from DBD API: {url}')
        
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
        
        logger.info(f'Found {len(results)} articles from API')
        
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
                # Truncate to reasonable length for post content
                if len(content_text) > 500:
                    content_text = content_text[:500] + '...'
                
                # Build article URL
                article_url = f'https://www.dbd.go.th/news/{slug}' if slug else 'https://www.dbd.go.th'
                
                article = {
                    'title': title,
                    'content': content_text,
                    'link': article_url,
                    'date': date,
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


def fetch_news_as_posts(limit: int = 10) -> List[Dict]:
    """
    Fetch news and format as post objects for the database
    Returns a list of post objects with all required fields
    """
    news_articles = scrape_dbd_news(limit)
    
    posts = []
    for article in news_articles:
        # Format as post object
        post = {
            'title': article['title'],
            'content': article['content'] + f"\n\nอ่านเพิ่มเติม: {article['link']}",
            'author': 'กรมพัฒนาธุรกิจการค้า (DBD)',
            'author_avatar': 'https://www.dbd.go.th/images/Logo100.png',
            'thumbnail_url': article.get('image_url', ''),
            'tags': ['ข่าวประชาสัมพันธ์', 'DBD', 'กรมพัฒนาธุรกิจการค้า'],
            'source_url': article['link'],
            'is_external': True  # Mark as external content
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
