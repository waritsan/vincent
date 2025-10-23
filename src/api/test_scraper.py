"""
Test script for news scraper
"""
import sys
sys.path.append('/Users/waritsan/Developer/vincent/src/api')

from news_scraper import scrape_dbd_news, fetch_news_as_posts

print("Testing DBD News Scraper...\n")
print("=" * 60)

# Test basic scraping
print("\n1. Testing scrape_dbd_news()...")
news = scrape_dbd_news(limit=3)
print(f"   Found {len(news)} articles")

if news:
    print("\n   First article:")
    for key, value in news[0].items():
        print(f"   - {key}: {value[:100] if isinstance(value, str) and len(value) > 100 else value}")

# Test post formatting
print("\n2. Testing fetch_news_as_posts()...")
posts = fetch_news_as_posts(limit=3)
print(f"   Created {len(posts)} posts")

if posts:
    print("\n   First post:")
    for key, value in posts[0].items():
        if key == 'tags':
            print(f"   - {key}: {value}")
        else:
            print(f"   - {key}: {value[:100] if isinstance(value, str) and len(value) > 100 else value}")

print("\n" + "=" * 60)
print("✅ Test complete!")
