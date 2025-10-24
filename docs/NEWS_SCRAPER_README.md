# DBD News Scraper Feature

## Overview
Automatically fetch and import news articles from the Department of Business Development (DBD) Thailand website into your blog system.

## How It Works

### API Endpoint
The scraper uses the official DBD JSON API:
```
https://www.dbd.go.th/api/frontend/content/category/1656067670544?page=1&limit=12&slug=1656067670544
```

### Implementation
- **File**: `src/api/news_scraper.py`
- **Method**: Direct API calls using `requests` library
- **Processing**: Cleans HTML tags, truncates content, formats as post objects

### Features
- ✅ Fetches real-time news from DBD official API
- ✅ Cleans HTML content automatically
- ✅ Supports Thai language text
- ✅ Includes thumbnail images
- ✅ Adds DBD logo as author avatar
- ✅ Tags posts automatically
- ✅ Marks as external content

## Usage

### From Admin Dashboard
1. Navigate to admin page (`/admin`)
2. Click the **"📰 Fetch DBD News"** button in the header
3. The system will fetch 5 latest articles and save them to your database
4. You'll see a success message with the count of imported articles
5. The posts list refreshes automatically

### From API Directly
```bash
# Fetch only (preview, not saved)
GET /api/news/fetch?limit=10

# Fetch and save to database
GET /api/news/fetch?limit=10&save=true
```

### From Python (Test Locally)
```bash
cd src/api
python3 news_scraper.py
```

## Response Format

### API Response
```json
{
  "message": "Fetched and saved 5 news articles",
  "posts": [...],
  "total": 5
}
```

### Post Structure
```python
{
  'title': 'Article title in Thai or English',
  'content': 'Article intro/summary (truncated to 500 chars)...\n\nอ่านเพิ่มเติม: [link]',
  'author': 'กรมพัฒนาธุรกิจการค้า (DBD)',
  'author_avatar': 'https://www.dbd.go.th/images/Logo100.png',
  'thumbnail_url': 'https://www.dbd.go.th/data-storage/image/...',
  'tags': ['ข่าวประชาสัมพันธ์', 'DBD', 'กรมพัฒนาธุรกิจการค้า'],
  'source_url': 'https://www.dbd.go.th/news/[slug]',
  'is_external': True
}
```

## Example Articles

The API returns various types of DBD news:
- **Training Seminars**: Accounting, business management courses
- **Business Statistics**: Monthly registration reports
- **Policy Announcements**: New regulations, standards
- **Event Updates**: Awards, partnerships, campaigns
- **Industry Reports**: Market analysis, trends

Sample titles:
- "Department of Business Development (DBD) will organize a workshop on e-Foreign Business service system"
- "ขอเชิญชวนสมาคมการค้า/หอการค้า ยื่นงบการเงินผ่านระบบ DBD e-Filing"
- "กรมพัฒน์ฯ จับมือแม็คโคร จัดอบรม Smart Restaurant Plus 3"

## Testing

### Local Test
```bash
# Test the scraper directly
cd src/api
python3 news_scraper.py

# Expected output:
# - Fetches 5 articles
# - Shows titles, dates, links
# - Displays formatted post structure
```

### API Test
```bash
# Fetch without saving
curl http://localhost:7071/api/news/fetch?limit=3

# Fetch and save
curl http://localhost:7071/api/news/fetch?limit=3&save=true
```

## Configuration

### Adjust Fetch Limit
In admin UI button:
```typescript
fetch(`${apiUrl}/api/news/fetch?limit=5&save=true`)
```

Change `limit=5` to any number (API supports up to 12 per page).

### Content Truncation
In `news_scraper.py`:
```python
if len(content_text) > 500:
    content_text = content_text[:500] + '...'
```

Adjust the `500` character limit as needed.

## Dependencies

```txt
requests>=2.31.0
```

(BeautifulSoup and lxml were removed as they're no longer needed)

## Troubleshooting

### No Articles Fetched
- Check API is accessible: `curl https://www.dbd.go.th/api/frontend/content/category/1656067670544`
- Verify Azure Function logs for errors
- Check network connectivity

### Thai Text Garbled
- Ensure response encoding is UTF-8
- Check database collation supports Thai characters

### Images Not Loading
- Verify thumbnail URLs are accessible
- Check CORS settings if loading from frontend
- Images are hosted on `www.dbd.go.th` domain

## Future Enhancements

Potential improvements:
- [ ] Add pagination support (fetch from multiple pages)
- [ ] Schedule automatic imports (daily/weekly)
- [ ] Deduplicate existing articles before import
- [ ] Add category filtering
- [ ] Support multiple news sources
- [ ] Add date range filters
- [ ] Implement incremental updates (only fetch new articles)

## API Changes

If DBD changes their API format:
1. Update the URL in `scrape_dbd_news()` function
2. Adjust field mapping in the parsing loop
3. Test with `python3 news_scraper.py`
4. Update this documentation

## Support

For issues or questions:
- Check Azure Function logs: `azd monitor --logs`
- Review API response: Visit URL directly in browser
- Test scraper locally: `python3 news_scraper.py`
- Check GitHub commits for recent changes
