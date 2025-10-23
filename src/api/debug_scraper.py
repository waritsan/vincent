"""
Debug script to see the HTML structure
"""
import requests
from bs4 import BeautifulSoup

url = "https://www.dbd.go.th/news/pr-news/list"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print("Fetching page...")
response = requests.get(url, headers=headers, timeout=10)
print(f"Status: {response.status_code}")

soup = BeautifulSoup(response.content, 'html.parser')

# Find all links
all_links = soup.find_all('a')
print(f"\nTotal links found: {len(all_links)}")

# Find news links
news_links = [a for a in all_links if a.get('href', '').startswith('/news/')]
print(f"News links found: {len(news_links)}")

if news_links:
    print("\nFirst 3 news links:")
    for i, link in enumerate(news_links[:3], 1):
        print(f"\n{i}. HREF: {link.get('href', 'N/A')}")
        print(f"   TEXT: {link.get_text(strip=True)[:100]}")
        print(f"   Has IMG: {link.find('img') is not None}")
        if link.parent:
            print(f"   Parent tag: {link.parent.name}")
