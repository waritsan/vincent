# Automated DBD News Fetcher Setup

This system automatically fetches the latest news from the Department of Business Development (DBD) and saves them to your Cosmos DB.

## 🎯 Features

- ✅ **Scheduled Auto-Fetch**: Runs every 6 hours automatically
- ✅ **Duplicate Detection**: Skips articles that already exist in database
- ✅ **Perfect Metadata**: Uses DBD API for complete data extraction
- ✅ **Manual Trigger**: Can be triggered manually via HTTP endpoint
- ✅ **Keyword Filtering**: Optional keyword-based article filtering
- ✅ **Statistics Tracking**: Reports saved, skipped, and error counts

## 📋 Components

### 1. `scheduled_news_fetcher.py`
Core automation logic:
- Fetches articles from DBD API
- Checks for duplicates
- Saves to Cosmos DB
- Tracks statistics

### 2. Azure Timer Function (in `function_app.py`)
- **Function Name**: `scheduled_dbd_news_fetch`
- **Schedule**: Every 6 hours (0 0 */6 * * *)
- **Auto-runs**: Yes (when deployed to Azure)

### 3. Manual Trigger Endpoint
- **URL**: `/api/news/fetch`
- **Method**: GET
- **Parameters**:
  - `limit`: Number of articles (1-50, default: 10)
  - `keyword`: Filter keyword (optional)
  - `save`: Save to DB (default: true)

## 🚀 Quick Start

### Local Testing

1. **Set environment variable**:
```bash
export COSMOS_CONNECTION_STRING="your_connection_string_here"
```

2. **Test the fetcher**:
```bash
cd src/api
python3 scheduled_news_fetcher.py
```

3. **Test via HTTP endpoint** (with Azure Functions running):
```bash
# Fetch and save 5 articles
curl "http://localhost:7071/api/news/fetch?limit=5&save=true"

# Preview without saving
curl "http://localhost:7071/api/news/fetch?limit=10&save=false"

# Fetch with keyword filter
curl "http://localhost:7071/api/news/fetch?limit=10&keyword=SME"
```

### Azure Deployment

1. **Deploy Azure Functions**:
```bash
cd src/api
func azure functionapp publish <your-function-app-name>
```

2. **Verify timer is running**:
- Go to Azure Portal → Your Function App
- Check "Functions" → "scheduled_dbd_news_fetch"
- View "Monitor" tab for execution logs

3. **Manual trigger in Azure**:
```bash
curl "https://<your-app>.azurewebsites.net/api/news/fetch?limit=10"
```

## ⚙️ Configuration

### Change Schedule

Edit the schedule in `function_app.py`:

```python
@app.timer_trigger(schedule="0 0 */6 * * *", ...)  # Current: Every 6 hours
```

**Common schedules** (CRON format: `second minute hour day month dayOfWeek`):
- `"0 0 */6 * * *"` - Every 6 hours
- `"0 0 */12 * * *"` - Every 12 hours (twice daily)
- `"0 0 8 * * *"` - Daily at 8:00 AM
- `"0 0 8,20 * * *"` - Daily at 8:00 AM and 8:00 PM
- `"0 0 8 * * 1-5"` - Weekdays at 8:00 AM
- `"0 */30 * * * *"` - Every 30 minutes

### Change Article Limit

Edit in `function_app.py`:

```python
result = fetch_and_save_dbd_news(limit=10, keyword='')  # Change limit here
```

### Add Keyword Filter

```python
result = fetch_and_save_dbd_news(limit=10, keyword='SME')  # Filter by keyword
```

## 📊 Monitoring

### Check Logs

**Local**:
```bash
# Watch logs while running
func start
```

**Azure**:
- Azure Portal → Function App → Monitor
- Application Insights → Logs
- Search for "Scheduled DBD news fetch"

### Example Log Output

```
✅ Automated fetch successful: 8 new articles saved
   - Saved: 8
   - Skipped: 2 (already exists)
   - Errors: 0
```

## 🔧 Troubleshooting

### No Articles Saved

**Problem**: "Saved: 0, Skipped: 0"
**Solution**: Check COSMOS_CONNECTION_STRING environment variable

```bash
# Verify locally
echo $COSMOS_CONNECTION_STRING

# Verify in Azure
az functionapp config appsettings list --name <app-name> --resource-group <rg-name>
```

### All Articles Skipped

**Problem**: "Saved: 0, Skipped: 10"
**Solution**: Articles already exist in database (working as expected!)

### Timer Not Running

**Problem**: No scheduled executions in Azure
**Solution**: 
1. Check Function App is running (not stopped)
2. Verify timer trigger is enabled
3. Check Application Insights for errors

## 📱 Frontend Integration

### Refresh Button (Already Exists)

In the admin panel, there's already a "📰 Fetch DBD News" button:

```typescript
onClick={async () => {
  const response = await fetch(`${apiUrl}/api/news/fetch?limit=5&save=true`);
  // Shows success message and refreshes posts
}}
```

### Show Auto-Fetched Indicator

Posts fetched automatically have `auto_fetched: true` flag.

You can add a badge in `BlogPosts.tsx`:

```typescript
{post.auto_fetched && (
  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
    🤖 Auto-fetched
  </span>
)}
```

## 📈 Statistics

### View Fetch Stats

Query Cosmos DB for statistics:

```sql
SELECT 
  COUNT(1) as total_auto_fetched,
  COUNT(CASE WHEN c.created_at > DateTimeAdd("hh", -24, GetCurrentDateTime()) THEN 1 END) as last_24h
FROM c
WHERE c.auto_fetched = true
```

### Admin Dashboard Stats

Add to admin page:

```typescript
const autoFetchedCount = posts.filter(p => p.auto_fetched).length;
// Display: "Auto-fetched: {autoFetchedCount} posts"
```

## 🎯 Best Practices

1. **Start Conservative**: Begin with 6-hour intervals, adjust based on DBD's update frequency
2. **Monitor Duplicates**: If skipped count is always 10, reduce fetch frequency
3. **Use Keywords**: Filter by topic to avoid irrelevant content
4. **Check Limits**: DBD API might have rate limits, don't set too aggressive schedules
5. **Backup Manual Fetch**: Keep manual trigger for urgent updates

## 🔄 Workflow

```
Every 6 hours:
  ↓
scheduled_dbd_news_fetch() triggered
  ↓
Fetch 10 latest articles from DBD API
  ↓
For each article:
  - Check if exists in DB (by source_url)
  - If new: Save with tags, metadata, DBD logo
  - If exists: Skip
  ↓
Log statistics: X saved, Y skipped
  ↓
Users see new articles in frontend automatically!
```

## 📞 Manual Operations

### Force Immediate Fetch

```bash
# Via Azure Functions Core Tools
cd src/api
func start

# In another terminal
curl "http://localhost:7071/api/news/fetch?limit=20&save=true"
```

### Clear Old Articles

If you want to test re-fetching:

```sql
-- In Cosmos DB Data Explorer
DELETE c FROM c WHERE c.source_url LIKE '%dbd.go.th%'
```

### Backfill Historical Articles

```bash
# Fetch more articles (up to 50)
curl "http://localhost:7071/api/news/fetch?limit=50&save=true"
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Timer function appears in Azure Portal
- [ ] COSMOS_CONNECTION_STRING is set
- [ ] Manual fetch works: `/api/news/fetch?limit=5`
- [ ] Articles appear in admin panel
- [ ] Duplicate detection works (re-run shows skipped)
- [ ] Logs show execution every 6 hours
- [ ] Frontend displays DBD articles with proper metadata

## 🎉 Result

You now have **fully automated news aggregation**! DBD articles automatically appear in your system every 6 hours with:
- ✅ Perfect metadata and images
- ✅ Proper tagging and categorization
- ✅ Duplicate prevention
- ✅ Zero manual intervention needed

Your app is now a **real-time news aggregator**! 🚀
