#!/bin/bash

# Test automated DBD news fetcher
# This script helps you test the automated news system locally

echo "🤖 DBD Automated News Fetcher - Test Script"
echo "=============================================="
echo ""

# Check if local.settings.json exists
if [ ! -f "local.settings.json" ]; then
    echo "❌ Error: local.settings.json not found"
    echo "   Please create it with your COSMOS_CONNECTION_STRING"
    exit 1
fi

# Extract connection string
CONNECTION_STRING=$(grep -o '"COSMOS_CONNECTION_STRING"[^,}]*' local.settings.json | sed 's/"COSMOS_CONNECTION_STRING": *"\([^"]*\)".*/\1/' | head -1)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Error: COSMOS_CONNECTION_STRING not found in local.settings.json"
    echo "   Please add it to the 'Values' section"
    exit 1
fi

echo "✅ Found Cosmos DB connection string"
echo ""

# Export environment variable
export COSMOS_CONNECTION_STRING="$CONNECTION_STRING"

# Ask user what to test
echo "What would you like to test?"
echo ""
echo "1) Test fetcher (fetch 5 articles and save to DB)"
echo "2) Preview only (fetch 10 articles without saving)"
echo "3) Fetch with keyword (e.g., 'SME', 'นอมินี')"
echo "4) Backfill (fetch 30 articles)"
echo ""
read -p "Choose option (1-4): " option

case $option in
    1)
        echo ""
        echo "🔄 Fetching and saving 5 articles..."
        python3 scheduled_news_fetcher.py
        ;;
    2)
        echo ""
        echo "🔄 Preview mode: Fetching 10 articles (not saving)..."
        python3 -c "
from news_scraper import scrape_dbd_news
articles = scrape_dbd_news(limit=10)
print(f'\n✅ Fetched {len(articles)} articles\n')
for i, a in enumerate(articles, 1):
    print(f'{i}. {a[\"title\"][:80]}...')
    print(f'   Image: {\"Yes\" if a.get(\"image_url\") else \"No\"}')
    print(f'   Date: {a.get(\"date\", \"N/A\")}')
    print()
"
        ;;
    3)
        echo ""
        read -p "Enter keyword (e.g., 'SME', 'นอมินี'): " keyword
        echo ""
        echo "🔄 Fetching articles with keyword: $keyword"
        python3 -c "
from scheduled_news_fetcher import fetch_and_save_dbd_news
result = fetch_and_save_dbd_news(limit=10, keyword='$keyword')
print('\n' + '='*60)
print('RESULT')
print('='*60)
print(f'Success: {result[\"success\"]}')
print(f'Message: {result[\"message\"]}')
print(f'Saved: {result[\"stats\"][\"saved\"]}')
print(f'Skipped: {result[\"stats\"][\"skipped\"]}')
print(f'Errors: {result[\"stats\"][\"errors\"]}')
print('='*60)
"
        ;;
    4)
        echo ""
        echo "🔄 Backfilling: Fetching 30 articles..."
        python3 -c "
from scheduled_news_fetcher import fetch_and_save_dbd_news
result = fetch_and_save_dbd_news(limit=30)
print('\n' + '='*60)
print('BACKFILL RESULT')
print('='*60)
print(f'Success: {result[\"success\"]}')
print(f'Message: {result[\"message\"]}')
print(f'Saved: {result[\"stats\"][\"saved\"]}')
print(f'Skipped: {result[\"stats\"][\"skipped\"]}')
print(f'Errors: {result[\"stats\"][\"errors\"]}')
print('='*60)
"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Test completed!"
echo ""
echo "💡 Tip: Check your admin panel at http://localhost:3001/admin"
echo "   to see the fetched articles with DBD logo and tags."
