# Local Development Guide

## 🚀 Running the Azure Functions API Locally

### Prerequisites

- Python 3.11 or higher
- Azure Functions Core Tools v4
- Install dependencies: `pip install -r src/api/requirements.txt`

### Start the Function App

```bash
cd src/api
func start
```

The API will be available at **http://localhost:7071**

### Available Endpoints

| Endpoint | Method | Description | Example |
|----------|--------|-------------|---------|
| `/api/health` | GET | Health check | `curl http://localhost:7071/api/health` |
| `/api/posts` | GET | Get all posts | `curl http://localhost:7071/api/posts` |
| `/api/posts` | POST | Create a post | `curl -X POST http://localhost:7071/api/posts -H "Content-Type: application/json" -d '{"title":"Test","content":"Content","author":"Me"}'` |
| `/api/chat` | POST | AI chat | `curl -X POST http://localhost:7071/api/chat -H "Content-Type: application/json" -d '{"message":"Hello"}'` |

### Test All Endpoints

Run the automated test script:

```bash
./test-local-api.sh
```

### Expected Output

```json
// GET /api/health
{
  "status": "healthy",
  "version": "1.0.0"
}

// GET /api/posts
{
  "posts": [
    {
      "id": "1",
      "title": "Sample Post 1",
      "content": "This is a sample post",
      "author": "System",
      "created_at": "2025-10-09T00:00:00Z"
    }
  ],
  "total": 2
}

// POST /api/posts
{
  "id": "new-id",
  "title": "Your Title",
  "content": "Your Content",
  "author": "Your Name",
  "created_at": "2025-10-11T04:43:00.000000"
}

// POST /api/chat (without AI configured)
{
  "conversation_id": "default",
  "message": "Hello",
  "response": "Azure AI Foundry is not configured. Set AZURE_AI_ENDPOINT environment variable.",
  "timestamp": "2025-10-11T04:43:00.000000",
  "configured": false
}
```

## 🔧 Configuration

### Local Settings

The file `src/api/local.settings.json` contains local environment variables:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "AZURE_AI_ENDPOINT": "",
    "AZURE_AI_DEPLOYMENT_NAME": ""
  }
}
```

### Connect to Azure AI Locally

To test the `/api/chat` endpoint with actual AI responses:

1. Get your Azure AI endpoint:
   ```bash
   azd env get-values | grep AZURE_AI_ENDPOINT
   ```

2. Update `local.settings.json`:
   ```json
   {
     "Values": {
       "AZURE_AI_ENDPOINT": "https://cog-xxx.cognitiveservices.azure.com/",
       "AZURE_AI_DEPLOYMENT_NAME": "gpt-4o"
     }
   }
   ```

3. Authenticate with Azure:
   ```bash
   az login
   ```

4. Restart the function app:
   ```bash
   func start
   ```

Now the chat endpoint will use your deployed Azure AI Foundry instance!

## 🧪 Development Workflow

### 1. Start Functions API
```bash
cd src/api
func start
```
This runs on **http://localhost:7071**

### 2. Start Next.js Frontend
```bash
cd src/web
npm run dev
```
This runs on **http://localhost:3000** (or 3001 if 3000 is busy)

### 3. Configure Frontend to Use Local API

Update `src/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:7071
```

### 4. Test the Full Stack

Open http://localhost:3000 and see your blog posts loaded from the local API!

## 📝 Making Changes

### Edit Function Code

1. Modify `src/api/function_app.py`
2. Save the file
3. The function app will **automatically reload** (hot reload is enabled)
4. Test your changes immediately

### Add New Endpoints

```python
@app.route(route="my-endpoint", methods=["GET"])
def my_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps({"message": "Hello!"}),
        mimetype="application/json"
    )
```

Save and test:
```bash
curl http://localhost:7071/api/my-endpoint
```

## 🐛 Troubleshooting

### Port 7071 Already in Use

```bash
# Find the process
lsof -i :7071

# Kill it
kill -9 <PID>

# Or use a different port
func start --port 7072
```

### Python Version Issues

The function app requires Python 3.11. Check your version:
```bash
python3 --version
```

### Module Not Found

Install dependencies:
```bash
cd src/api
pip install -r requirements.txt
```

### Function App Won't Start

1. Check `local.settings.json` exists in `src/api/`
2. Verify Python runtime is installed
3. Run `func --version` to check Azure Functions Core Tools

## 🔄 Hot Reload

The Azure Functions runtime supports **hot reload** by default. Changes to Python files will automatically reload the function app without restarting.

## 📊 Viewing Logs

Function execution logs appear in the terminal where you ran `func start`:

```
[2025-10-11T04:42:43.251Z] Executing 'Functions.health'
[2025-10-11T04:42:43.281Z] Executed 'Functions.health' (Succeeded, Duration=40ms)
```

For more detailed logs, use:
```bash
func start --verbose
```

## ✅ Verification Checklist

- [ ] Function app starts without errors
- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] Posts endpoint returns sample posts
- [ ] Creating a post works (POST /api/posts)
- [ ] Chat endpoint returns response (even if AI not configured)
- [ ] Frontend can fetch data from local API
