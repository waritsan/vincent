# Chat API - Azure Container Apps with TRUE Streaming

This is a FastAPI-based chat service deployed to Azure Container Apps with serverless (scale-to-zero) configuration and **TRUE HTTP streaming** support.

## Features

- ✅ **True HTTP Streaming** - Real Server-Sent Events (SSE)
- ✅ **Serverless** - Scales to zero when idle
- ✅ **FastAPI** - Modern async Python framework
- ✅ **Azure AI Agents** - Powered by Azure AI Foundry
- ✅ **Managed Identity** - Secure authentication

## Architecture

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       │ /api/posts, /api/health     /api/chat (streaming)
       │                                     │
┌──────▼──────────┐              ┌──────────▼────────────┐
│ Azure Functions │              │  Container Apps       │
│  (Consumption)  │              │  (Serverless)         │
│                 │              │                       │
│ • Posts CRUD    │              │ • TRUE SSE streaming  │
│ • Health checks │              │ • FastAPI/ASGI        │
│ • Cosmos DB     │              │ • Scale-to-zero       │
└─────────────────┘              │ • Azure AI Agents     │
                                 └───────────────────────┘
```

## Why Hybrid Approach?

### Azure Functions
- ✅ **Free tier** - 1M requests/month
- ✅ **Simple** - No Docker needed
- ✅ **Fast cold start** - ~0.5s
- ❌ **No streaming** - Buffers entire response

### Container Apps
- ✅ **TRUE streaming** - Real-time SSE
- ✅ **FastAPI** - Modern async Python
- ✅ **Serverless** - Scale to zero
- ⚠️ **Small cost** - ~$0.10-1/month at low traffic
- ⚠️ **Cold start** - ~1-2s

## Local Development

### Prerequisites
- Python 3.12+
- Azure CLI
- Docker (for testing container)

### Setup

1. **Install dependencies:**
```bash
cd src/chat-api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. **Set environment variables:**
```bash
export AZURE_AI_ENDPOINT="https://cog-xxx.cognitiveservices.azure.com"
export AZURE_AI_PROJECT_NAME="project-xxx"
export AZURE_AI_AGENT_ID="asst_xxx"
```

3. **Run locally:**
```bash
uvicorn main:app --reload --port 8000
```

4. **Test streaming:**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "stream": true}'
```

## Docker Testing

### Build and run:
```bash
docker build -t chat-api .
docker run -p 8000:8000 \
  -e AZURE_AI_ENDPOINT="..." \
  -e AZURE_AI_PROJECT_NAME="..." \
  -e AZURE_AI_AGENT_ID="..." \
  chat-api
```

## Deployment

### First Time Setup

1. **Deploy infrastructure:**
```bash
cd /Users/waritsan/Developer/vincent
azd up
```

This will:
- Create Container Apps Environment
- Create Container Registry
- Create Managed Identity
- Build and push Docker image
- Deploy chat API with scale-to-zero

2. **Verify deployment:**
```bash
azd env get-values
```

Look for `AZURE_CHAT_API_URI` - this is your chat API endpoint.

3. **Test streaming:**
```bash
CHAT_API_URL=$(azd env get-value AZURE_CHAT_API_URI)

curl -X POST $CHAT_API_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a story", "stream": true}'
```

### Subsequent Deployments

```bash
azd deploy chat-api
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_AI_ENDPOINT` | Azure AI Foundry endpoint | ✅ |
| `AZURE_AI_PROJECT_NAME` | AI project name | ✅ |
| `AZURE_AI_AGENT_ID` | Agent ID | ✅ |
| `AZURE_CLIENT_ID` | Managed Identity client ID | Auto-set |

## API Endpoints

### POST /api/chat

Stream chat responses with Server-Sent Events.

**Request:**
```json
{
  "message": "Hello!",
  "conversation_id": "conv-123",  // Optional
  "thread_id": "thread-456",      // Optional
  "stream": true                  // true = SSE, false = JSON
}
```

**Response (SSE):**
```
data: {"type": "metadata", "conversation_id": "...", "thread_id": "..."}

data: {"type": "chunk", "content": "Hello"}

data: {"type": "chunk", "content": " there"}

data: {"type": "done", "full_response": "Hello there", "timestamp": "..."}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "chat-api",
  "version": "1.0.0"
}
```

## Monitoring

### View logs:
```bash
az containerapp logs show \
  --name $(azd env get-value AZURE_CHAT_API_NAME) \
  --resource-group $(azd env get-value AZURE_RESOURCE_GROUP) \
  --follow
```

### Check scaling:
```bash
az containerapp replica list \
  --name $(azd env get-value AZURE_CHAT_API_NAME) \
  --resource-group $(azd env get-value AZURE_RESOURCE_GROUP)
```

## Cost Optimization

### Serverless Configuration
```bicep
scale: {
  minReplicas: 0  // Scale to zero when idle
  maxReplicas: 10 // Max instances
  rules: [
    {
      name: 'http-scaling'
      http: {
        metadata: {
          concurrentRequests: '10'
        }
      }
    }
  ]
}
```

### Expected Costs (Low Traffic)

**1,000 requests/month:**
- vCPU: $0.09
- Memory: $0.02
- Requests: $0.0004
- **Total: ~$0.11/month**

**10,000 requests/month:**
- vCPU: $0.90
- Memory: $0.22
- Requests: $0.004
- **Total: ~$1.12/month**

## Troubleshooting

### Container not starting
```bash
az containerapp logs show --name <app-name> --resource-group <rg-name>
```

### Streaming not working
Check CORS settings in `main.py`:
```python
allow_origins=["*"]  # Change to specific domain in production
```

### Authentication failures
Verify managed identity has access:
```bash
az role assignment list --assignee <principal-id>
```

## Next Steps

1. ✅ Deploy with `azd up`
2. ✅ Test streaming endpoint
3. ✅ Update frontend to use `NEXT_PUBLIC_CHAT_API_URL`
4. ✅ Monitor costs in Azure Portal
5. ✅ Set up alerts for scaling events

## References

- [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Server-Sent Events](https://developer.mozilla.org/docs/Web/API/Server-sent_events)
- [Azure AI Foundry](https://learn.microsoft.com/azure/ai-studio/)
