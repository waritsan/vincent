"""
News scraper for DBD (Department of Business Development) website
Fetches news articles from https://www.dbd.go.th/news/pr-news/list

NOTE: The DBD website uses JavaScript to load content dynamically.
This current implementation provides mock data for demonstration.
For production, consider using Selenium or an API if available.
"""

import logging
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Mock news data (fallback when scraping fails)
def get_mock_dbd_news(limit: int = 10) -> List[Dict]:
    """
    Generate mock DBD news for demonstration
    In production, this should be replaced with actual scraping using Selenium
    or integration with DBD API if available
    """
    mock_news = [
        {
            'title': 'ขอเชิญชวนบุคลากรสำนักงานบัญชีเข้าร่วมโครงการอบรมบ่มเพาะต้นกล้าสำนักงานบัญชีคุณภาพ',
            'content': 'กรมพัฒนาธุรกิจการค้า ขอเชิญชวนบุคลากรสำนักงานบัญชีเข้าร่วม "โครงการอบรมบ่มเพาะต้นกล้าสำนักงานบัญชีคุณภาพ" เพื่อยกระดับมาตรฐานการให้บริการด้านบัญชี',
            'link': 'https://www.dbd.go.th/news/1761101527987',
            'date': (datetime.now() - timedelta(days=1)).strftime('%d %B %Y'),
            'image_url': 'https://www.dbd.go.th/storage/news/accounting-seminar.jpg',
            'source': 'กรมพัฒนาธุรกิจการค้า (DBD)'
        },
        {
            'title': 'ขอเชิญเข้าร่วมอบรม "อ่านงบเป็น เห็นทางรอด: ยกระดับธรรมาภิบาล SMEs ด้วยการวิเคราะห์งบการเงิน"',
            'content': 'กรมพัฒนาธุรกิจการค้า เชิญผู้ประกอบการ SMEs เข้าร่วมอบรมวิเคราะห์งบการเงิน เพื่อยกระดับธรรมาภิบาลและการบริหารจัดการ',
            'link': 'https://www.dbd.go.th/news/1760926413244',
            'date': (datetime.now() - timedelta(days=3)).strftime('%d %B %Y'),
            'image_url': 'https://www.dbd.go.th/storage/news/financial-analysis.jpg',
            'source': 'กรมพัฒนาธุรกิจการค้า (DBD)'
        },
        {
            'title': 'ประกาศรายชื่อธุรกิจแฟรนไชส์ที่ผ่านเกณฑ์มาตรฐานคุณภาพการบริหารจัดการธุรกิจแฟรนไชส์',
            'content': 'กรมพัฒนาธุรกิจการค้า ประกาศรายชื่อธุรกิจแฟรนไชส์ที่ผ่านเกณฑ์มาตรฐานคุณภาพการบริหารจัดการธุรกิจแฟรนไชส์ (Franchise Standard) ปี 2568',
            'link': 'https://www.dbd.go.th/news/1760434199555',
            'date': (datetime.now() - timedelta(days=7)).strftime('%d %B %Y'),
            'image_url': 'https://www.dbd.go.th/storage/news/franchise-standard.jpg',
            'source': 'กรมพัฒนาธุรกิจการค้า (DBD)'
        },
        {
            'title': 'สร้างธุรกิจ SME เข้าสู่เกณฑ์มาตรฐานธรรมาภิบาลธุรกิจ ประจำปีงบประมาณ 2569',
            'content': 'กรมพัฒนาธุรกิจการค้า เปิดรับสมัครโครงการพัฒนาธรรมาภิบาลสำหรับ SME เพื่อยกระดับความโปร่งใสและมาตรฐานการดำเนินธุรกิจ',
            'link': 'https://www.dbd.go.th/news/1759303451015',
            'date': (datetime.now() - timedelta(days=14)).strftime('%d %B %Y'),
            'image_url': 'https://www.dbd.go.th/storage/news/sme-governance.jpg',
            'source': 'กรมพัฒนาธุรกิจการค้า (DBD)'
        },
        {
            'title': '8 ภารกิจเร่งด่วน กรมพัฒนาธุรกิจการค้า',
            'content': 'กรมพัฒนาธุรกิจการค้า ประกาศ 8 ภารกิจเร่งด่วน เพื่อขับเคลื่อนการพัฒนาธุรกิจและเศรษฐกิจของประเทศไทย',
            'link': 'https://www.dbd.go.th/news/1759282644915',
            'date': (datetime.now() - timedelta(days=14)).strftime('%d %B %Y'),
            'image_url': 'https://www.dbd.go.th/storage/news/urgent-missions.jpg',
            'source': 'กรมพัฒนาธุรกิจการค้า (DBD)'
        }
    ]
    
    return mock_news[:limit]

def scrape_dbd_news(limit: int = 10) -> List[Dict]:
    """
    Scrape news from DBD website
    
    NOTE: The DBD website loads content dynamically with JavaScript.
    Currently returns mock data. For production, use Selenium or API integration.
    
    Args:
        limit: Maximum number of news articles to fetch
        
    Returns:
        List of news articles with title, content, link, date, image
    """
    try:
        url = "https://www.dbd.go.th/news/pr-news/list"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        logger.info(f"Attempting to fetch news from {url}")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try to find news links
        all_links = soup.find_all('a', href=re.compile(r'/news/\d+'))
        
        logger.info(f"Found {len(all_links)} news links from scraping")
        
        # If scraping fails (JavaScript-loaded content), use mock data
        if len(all_links) == 0:
            logger.warning("No news links found - website may use JavaScript. Using mock data.")
            return get_mock_dbd_news(limit)
        
        # Process scraped data
        news_articles = []
        seen_links = set()
        
        for link_elem in all_links:
            try:
                if len(news_articles) >= limit:
                    break
                    
                link = link_elem.get('href', '')
                if link in seen_links:
                    continue
                seen_links.add(link)
                
                if not link.startswith('http'):
                    link = f"https://www.dbd.go.th{link}"
                
                title = link_elem.get_text(strip=True)
                if not title or len(title) < 10:
                    continue
                
                # Extract image
                image_url = ''
                img_elem = link_elem.find('img')
                if img_elem:
                    img_src = img_elem.get('src', '')
                    if img_src and not img_src.startswith('http'):
                        image_url = f"https://www.dbd.go.th{img_src}"
                    else:
                        image_url = img_src
                
                article = {
                    'title': title,
                    'content': f'ข่าวประชาสัมพันธ์จากกรมพัฒนาธุรกิจการค้า เรื่อง "{title}"',
                    'link': link,
                    'date': datetime.now().strftime('%d %B %Y'),
                    'image_url': image_url,
                    'source': 'กรมพัฒนาธุรกิจการค้า (DBD)'
                }
                
                news_articles.append(article)
                
            except Exception as e:
                logger.error(f"Error parsing news item: {e}")
                continue
        
        if news_articles:
            logger.info(f"Successfully scraped {len(news_articles)} news articles")
            return news_articles
        else:
            logger.warning("Scraping returned no results. Using mock data.")
            return get_mock_dbd_news(limit)
        
    except requests.RequestException as e:
        logger.error(f"Error fetching news from DBD website: {e}. Using mock data.")
        return get_mock_dbd_news(limit)
    except Exception as e:
        logger.error(f"Unexpected error scraping news: {e}. Using mock data.")
        return get_mock_dbd_news(limit)


def convert_thai_date_to_iso(thai_date: str) -> str:
    """
    Convert Thai date format to ISO format
    Example: "22 ตุลาคม 2568" -> "2025-10-22"
    """
    thai_months = {
        'มกราคม': 1, 'กุมภาพันธ์': 2, 'มีนาคม': 3, 'เมษายน': 4,
        'พฤษภาคม': 5, 'มิถุนายน': 6, 'กรกฎาคม': 7, 'สิงหาคม': 8,
        'กันยายน': 9, 'ตุลาคม': 10, 'พฤศจิกายน': 11, 'ธันวาคม': 12
    }
    
    try:
        # Parse Thai date format: "22 ตุลาคม 2568"
        parts = thai_date.split()
        if len(parts) == 3:
            day = int(parts[0])
            month = thai_months.get(parts[1], 1)
            year = int(parts[2]) - 543  # Convert Buddhist year to Gregorian
            
            return datetime(year, month, day).isoformat()
    except Exception as e:
        logger.error(f"Error converting date {thai_date}: {e}")
    
    return datetime.now().isoformat()


def fetch_news_as_posts(limit: int = 10) -> List[Dict]:
    """
    Fetch news and format as post objects ready for database
    
    Returns:
        List of post objects compatible with the posts API
    """
    news_articles = scrape_dbd_news(limit)
    posts = []
    
    for article in news_articles:
        post = {
            'title': article['title'],
            'content': article['content'] + f"\n\nอ่านเพิ่มเติม: {article['link']}",
            'author': article['source'],
            'author_avatar': 'https://www.dbd.go.th/images/Logo100.png',
            'thumbnail_url': article.get('image_url', ''),
            'video_url': '',
            'tags': ['ข่าวประชาสัมพันธ์', 'DBD', 'กรมพัฒนาธุรกิจการค้า'],
            'source_url': article['link'],
            'is_external': True
        }
        posts.append(post)
    
    return posts
