# CORS Configuration for Azure Functions

## Issue
When running the Next.js frontend (localhost:3000) and Azure Functions API (localhost:7071) locally, browsers block API requests due to Cross-Origin Resource Sharing (CORS) policy.

**Error:**
```
Failed to load resource: Origin http://localhost:3000 is not allowed by Access-Control-Allow-Origin
```

## Solution
Added CORS headers to all API responses in the Azure Functions app.

### Changes Made

**File:** `src/api/function_app.py`

1. **Added CORS headers constant:**
```python
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

2. **Created helper function:**
```python
def create_response(body, status_code=200):
    """Helper function to create HTTP response with CORS headers"""
    return func.HttpResponse(
        body=json.dumps(body) if isinstance(body, dict) else body,
        mimetype="application/json",
        status_code=status_code,
        headers=CORS_HEADERS
    )
```

3. **Updated all endpoints to use the helper:**
- `/api/chat` - Uses `create_response()` for all responses
- `/api/posts` - Uses `create_response()` for all responses
- `/api/health` - Uses `create_response()` for all responses

## Verification

Test CORS headers are present:

```bash
curl -s http://localhost:7071/api/health -i | grep -i "access-control"
```

**Expected output:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Production Configuration

### For Azure Deployment

The CORS configuration with `Access-Control-Allow-Origin: *` is suitable for:
- ✅ Local development
- ✅ Testing environments
- ⚠️ **NOT recommended for production** (security risk)

### Production Best Practice

For production deployment, you should restrict CORS to specific origins:

```python
# Get the allowed origin from environment variable
allowed_origin = os.environ.get('ALLOWED_ORIGIN', 'https://your-static-web-app.azurestaticapps.net')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': allowed_origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

Or configure CORS in Azure Function App settings:

```bash
az functionapp cors add \
  --name <function-app-name> \
  --resource-group <resource-group> \
  --allowed-origins https://your-static-web-app.azurestaticapps.net
```

### Alternative: Azure Portal Configuration

1. Go to Azure Portal → Function App
2. Navigate to **API** → **CORS**
3. Add allowed origins:
   - For development: `http://localhost:3000`
   - For production: `https://your-static-web-app.azurestaticapps.net`

## Testing the Full Stack

### 1. Start Function App
```bash
cd src/api
func start
```
Running on: http://localhost:7071

### 2. Start Next.js Frontend
```bash
cd src/web
npm run dev
```
Running on: http://localhost:3000

### 3. Configure Frontend
`src/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:7071
```

### 4. Test in Browser
Open http://localhost:3000 and verify:
- ✅ Blog posts load from API
- ✅ No CORS errors in console
- ✅ Data displays correctly

## Troubleshooting

### Still getting CORS errors?

1. **Hard refresh the browser:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache:** Sometimes old responses are cached
3. **Check the terminal:** Verify function app reloaded after changes
4. **Verify environment variable:** Check `NEXT_PUBLIC_API_URL` in `.env.local`

### Function app not reloading?

Restart the function app:
```bash
# Stop the current process (Ctrl+C)
# Restart
cd src/api && func start
```

## Security Note

**Important:** The current configuration (`Access-Control-Allow-Origin: *`) allows requests from ANY origin. This is:
- ✅ **Good for local development**
- ❌ **BAD for production**

Always restrict CORS to specific trusted origins in production environments.
