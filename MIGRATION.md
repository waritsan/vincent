# Migration Summary: Chat API to Azure Container Apps

## ✅ What Was Done

### 1. Created New Chat API Service
- **Location:** `/src/chat-api/`
- **Framework:** FastAPI (async Python)
- **Features:** TRUE HTTP streaming with Server-Sent Events

### 2. Infrastructure Files Created
- `src/chat-api/Dockerfile` - Container image definition
- `src/chat-api/main.py` - FastAPI app with streaming
- `src/chat-api/requirements.txt` - Python dependencies
- `infra/core/host/chat-api.bicep` - Container App definition
- `infra/core/security/managed-identity.bicep` - Identity for Container App

### 3. Updated Files
- `infra/main.bicep` - Added Container Apps resources
- `azure.yaml` - Added chat-api service
- `src/web/src/app/components/AIChat.tsx` - Uses new Chat API URL

### 4. Architecture Changes

**Before:**
```
Frontend → Azure Functions → AI Agent
          (No true streaming)
```

**After:**
```
Frontend → Azure Functions → Cosmos DB, Posts
        ↘ Container Apps → AI Agent (TRUE streaming!)
```

## 🚀 Deployment Steps

### Step 1: Deploy Infrastructure

```bash
cd /Users/waritsan/Developer/vincent
azd up
```

This will:
1. Create Container Registry
2. Create Container Apps Environment
3. Build Docker image
4. Push to registry
5. Deploy container with scale-to-zero
6. Set up managed identity
7. Configure CORS

### Step 2: Verify Deployment

```bash
# Get chat API URL
azd env get-values | grep AZURE_CHAT_API_URI

# Test health endpoint
curl https://<chat-api-url>/health

# Test chat with streaming
curl -X POST https://<chat-api-url>/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "stream": true}'
```

### Step 3: Update Frontend

The frontend automatically uses the new chat API if `NEXT_PUBLIC_CHAT_API_URL` is set (done in predeploy hook).

## 📊 Comparison

| Feature | Azure Functions | Container Apps |
|---------|----------------|----------------|
| **Streaming** | ❌ Simulated (45s wait) | ✅ TRUE (real-time) |
| **Framework** | Flask-like | FastAPI/ASGI |
| **Cold Start** | ~0.5s | ~1-2s |
| **Scale to Zero** | ✅ Yes | ✅ Yes |
| **Free Tier** | ✅ 1M requests | ❌ No |
| **Cost (1K req/mo)** | $0 | ~$0.11 |
| **Cost (10K req/mo)** | $0 | ~$1.12 |

## 💰 Cost Breakdown

### Container Apps (Serverless)
- **vCPU:** $0.000012 per vCPU-second
- **Memory:** $0.0000015 per GB-second  
- **Requests:** $0.40 per million

### Example: 1,000 requests/month
- Each request: 15 seconds
- Resources: 0.5 vCPU, 1 GB memory

```
vCPU:    1000 × 15s × 0.5 × $0.000012 = $0.09
Memory:  1000 × 15s × 1GB × $0.0000015 = $0.02
Requests: 0.001M × $0.40 = $0.0004
────────────────────────────────────────────
TOTAL: ~$0.11/month
```

## 🎯 Key Benefits

### 1. TRUE Streaming
- Chunks appear in **real-time** as AI generates them
- No 45-second buffering delay
- Better user experience

### 2. Serverless Cost Model
- **Scale to zero** when idle
- Only pay when processing requests
- Minimal cost at low traffic

### 3. Modern Architecture
- **FastAPI** with async/await
- **ASGI** server (Uvicorn)
- Better performance and scalability

### 4. Separation of Concerns
- **Functions** - Simple CRUD operations
- **Container Apps** - Complex streaming

## 🔧 Configuration

### Environment Variables (Auto-set)
- `AZURE_AI_ENDPOINT` - AI Foundry endpoint
- `AZURE_AI_PROJECT_NAME` - Project name
- `AZURE_AI_AGENT_ID` - Agent ID
- `AZURE_CLIENT_ID` - Managed identity

### Scaling Configuration
```bicep
scale: {
  minReplicas: 0        // Scale to zero!
  maxReplicas: 10       // Max 10 instances
  rules: [
    {
      name: 'http-scaling'
      http: {
        metadata: {
          concurrentRequests: '10'  // 10 requests per instance
        }
      }
    }
  ]
}
```

### Resource Limits
```
CPU: 0.5 vCPU
Memory: 1 GB
```

## 📝 API Changes

### Request (Same)
```json
{
  "message": "Hello!",
  "conversation_id": "optional",
  "thread_id": "optional",
  "stream": true
}
```

### Response (TRUE Streaming!)

**Before (Functions):**
- Wait 45 seconds
- Receive all chunks at once
- Frontend simulates streaming

**After (Container Apps):**
- Receive chunks in **real-time**
- Each chunk appears as AI generates it
- TRUE Server-Sent Events

## 🔍 Monitoring

### View Logs
```bash
az containerapp logs show \
  --name <app-name> \
  --resource-group <rg-name> \
  --follow
```

### Check Scaling
```bash
az containerapp replica list \
  --name <app-name> \
  --resource-group <rg-name>
```

### Monitor Costs
- Azure Portal → Container Apps → Metrics
- Track: Requests, CPU%, Memory%, Replica count

## 🚨 Important Notes

### 1. Agent ID Required
After first deployment, set the agent ID:
```bash
az containerapp update \
  --name <app-name> \
  --resource-group <rg-name> \
  --set-env-vars AZURE_AI_AGENT_ID=asst_xxx
```

### 2. CORS Configuration
In production, update `main.py`:
```python
allow_origins=["https://your-domain.com"]  # Not "*"
```

### 3. Cold Start
First request after idle period:
- Functions: ~0.5s
- Container Apps: ~1-2s

### 4. Other Endpoints Stay on Functions
- `/api/posts` - Still on Functions
- `/api/health` - Still on Functions
- Only `/api/chat` moved to Container Apps

## ✅ Testing Checklist

After deployment:
- [ ] Health endpoint responds
- [ ] Chat endpoint accepts requests
- [ ] Streaming works (see chunks appear)
- [ ] Thread persistence works
- [ ] Frontend connects to correct URL
- [ ] Scale to zero works (check replicas after 5 min idle)
- [ ] Other Functions endpoints still work

## 📚 Next Steps

1. **Deploy:** Run `azd up`
2. **Test:** Verify streaming works
3. **Monitor:** Check logs and metrics
4. **Optimize:** Adjust scaling rules if needed
5. **Secure:** Update CORS for production

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Chat responses appear **word-by-word** in real-time
- ✅ No 45-second wait before first word
- ✅ Costs stay under $1/month at low traffic
- ✅ Application scales to zero after idle period
- ✅ Other endpoints (posts) still work normally

---

**Questions?** Check `src/chat-api/README.md` for detailed documentation.
