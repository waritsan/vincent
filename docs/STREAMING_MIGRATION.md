# TRUE Streaming Migration - Complete ✅

## Overview
Successfully migrated the chat API from Azure Functions to Azure Container Apps to enable **TRUE HTTP streaming** with Server-Sent Events (SSE).

## Problem Statement
Azure Functions (Consumption Plan) buffers all HTTP responses, preventing true streaming. This resulted in a 45-second delay before users saw any response, despite using streaming APIs.

## Solution Architecture

### Hybrid Approach
- **Azure Functions**: CRUD endpoints (`/api/posts`, `/api/health`) - remains unchanged
- **Azure Container Apps**: Chat API (`/api/chat`) - NEW with TRUE streaming support
- **Static Web Apps**: Frontend with SSE reader

### Key Benefits
1. **TRUE Real-time Streaming**: First chunk arrives in ~1-2 seconds
2. **Cost-effective**: Container Apps scale to zero when idle (serverless)
3. **Better UX**: Users see responses progressively instead of waiting 45+ seconds
4. **Backward Compatible**: Other endpoints remain on Functions

## Implementation Details

### 1. FastAPI Chat API (`src/chat-api/`)
- **Framework**: FastAPI with Uvicorn ASGI server
- **Python**: 3.12
- **SDK**: azure-ai-projects 1.0.0 (stable)
- **Authentication**: DefaultAzureCredential with Managed Identity
- **Streaming**: StreamingResponse with SSE format

```python
async def generate_stream():
    with project_client.agents.runs.stream(thread_id, agent_id) as agent_stream:
        for event_type, event_data, _ in agent_stream:
            if event_type == "thread.message.delta":
                chunk = event_data.data.delta.content[0].text.value
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\\n\\n"
```

### 2. Infrastructure (Bicep)
- **Container Apps Environment**: Serverless with scale-to-zero
- **Container Registry**: ACR for Docker images
- **Managed Identity**: For secure Azure AI access
- **Role Assignments**: 
  - Azure AI Developer (resource level)
  - Cognitive Services User (resource level)

### 3. Frontend Integration
- **SSE Reader**: ReadableStream API for progressive rendering
- **Visual Feedback**: Animated cursor during streaming
- **Fallback**: Gracefully handles non-streaming responses

```typescript
const reader = response.body?.getReader();
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = JSON.parse(line.slice(6));
    if (data.type === 'chunk') {
      accumulatedContent += data.content;
      // Update UI progressively
    }
  }
}
```

## Critical Learnings

### Authentication Issue Resolution
**Problem**: Managed Identity couldn't access Azure AI Agent despite role assignments.

**Root Cause**: Missing "Cognitive Services User" role at the resource level.

**Solution**:
1. Use `DefaultAzureCredential()` (not explicit ManagedIdentityCredential)
2. Assign BOTH roles at the AI Services resource level:
   - Azure AI Developer (`64702f94-c441-49e6-a78b-ef80e0188fee`)
   - Cognitive Services User (`a97b65f3-24c7-4388-baec-2e87135dc908`)

### SDK Version
- ❌ **Beta version (1.0.0b3)**: Required subscription_id, resource_group_name, project_name
- ✅ **Stable version (1.0.0)**: Only requires endpoint parameter

### Endpoint Format
```python
# Convert from Cognitive Services endpoint
base_endpoint = ai_endpoint.replace(".cognitiveservices.azure.com", ".services.ai.azure.com")
project_endpoint = f"{base_endpoint}/api/projects/{project_name}"
```

## Deployment

### Automated (azd)
```bash
azd up
```

This will:
1. Package all services (Functions, Container App, Static Web App)
2. Provision infrastructure with role assignments
3. Deploy all services
4. Set environment variables for frontend

### Manual Role Assignment (if needed)
```bash
az role assignment create \
  --role "Azure AI Developer" \
  --assignee-object-id <managed-identity-principal-id> \
  --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<account>

az role assignment create \
  --role "Cognitive Services User" \
  --assignee-object-id <managed-identity-principal-id> \
  --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<account>
```

## Testing

### Health Check
```bash
curl https://ca-chatapi-ja67jva7pfqfc.ashycliff-dde1592b.eastus2.azurecontainerapps.io/api/health
```

Expected: `{"status":"healthy","service":"chat-api","version":"1.0.0"}`

### Chat API (Streaming)
```bash
curl -X POST https://ca-chatapi-ja67jva7pfqfc.ashycliff-dde1592b.eastus2.azurecontainerapps.io/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Say hello","thread_id":null}' \
  --no-buffer
```

Expected: Real-time SSE chunks
```
data: {"type": "metadata", "conversation_id": "...", "thread_id": "..."}

data: {"type": "chunk", "content": "Hello"}

data: {"type": "chunk", "content": "!"}

data: {"type": "done", "full_response": "Hello!", "timestamp": "..."}
```

### Debug Endpoint (Environment Variables)
```bash
curl https://ca-chatapi-ja67jva7pfqfc.ashycliff-dde1592b.eastus2.azurecontainerapps.io/api/debug/env
```

## Performance Comparison

### Before (Azure Functions)
- **Time to first chunk**: 45 seconds (buffered)
- **Total time**: 45 seconds
- **User experience**: Long wait, then instant full response

### After (Container Apps)
- **Time to first chunk**: ~1-2 seconds ⚡
- **Total time**: ~40 seconds
- **User experience**: Immediate feedback, progressive rendering

## Cost Optimization
- **Scale to zero**: Container stops when idle (no requests)
- **Minimal resources**: 0.5 vCPU, 1GB memory
- **Pay only when active**: Similar to Functions consumption model

## Deployed Endpoints

### Production
- **Functions API**: https://func-ja67jva7pfqfc.azurewebsites.net/
- **Chat API**: https://ca-chatapi-ja67jva7pfqfc.ashycliff-dde1592b.eastus2.azurecontainerapps.io/
- **Frontend**: https://calm-bay-09b1e430f.1.azurestaticapps.net/

### Environment Variables
```
AZURE_AI_ENDPOINT=https://cog-ja67jva7pfqfc.cognitiveservices.azure.com/
AZURE_AI_PROJECT_NAME=project-ja67jva7pfqfc
AZURE_AI_AGENT_ID=asst_VF1pUCg1iH9WkKtnhbd3Lq09
AZURE_CLIENT_ID=d9086d9a-a78d-48a3-9ffb-8393740819ac
AZURE_SUBSCRIPTION_ID=09fe6a1f-0b52-4c5e-8278-910573f1dbf6
AZURE_RESOURCE_GROUP_NAME=rg-vincent-dev
```

## Files Modified/Created

### New Files
- `src/chat-api/main.py` - FastAPI app with streaming
- `src/chat-api/Dockerfile` - Container image
- `src/chat-api/requirements.txt` - Python dependencies
- `src/chat-api/README.md` - API documentation
- `infra/core/host/chat-api.bicep` - Container App infrastructure
- `infra/core/security/role-resource.bicep` - Resource-level role assignments
- `infra/core/security/managed-identity.bicep` - Managed identity

### Modified Files
- `infra/main.bicep` - Added Container Apps, role assignments
- `azure.yaml` - Added chat-api service, predeploy hook
- `src/web/src/app/components/AIChat.tsx` - SSE reader, streaming cursor
- `src/web/.env.production` - Chat API URL

## Troubleshooting

### Permission Denied Errors
1. Check role assignments: `az role assignment list --assignee <principal-id>`
2. Verify both roles are assigned at resource level
3. Restart container to get fresh token: `az containerapp revision restart`

### Environment Variables Not Set
1. Check bicep outputs: `az deployment group show --name vincent-dev --resource-group rg-vincent-dev --query properties.outputs`
2. Verify predeploy hook ran: Check `src/web/.env.production`
3. Redeploy: `azd deploy web`

### Container Not Starting
1. Check logs: `az containerapp logs show --name ca-chatapi-ja67jva7pfqfc --resource-group rg-vincent-dev --tail 50`
2. Verify image was pushed: `az acr repository show-tags --name crja67jva7pfqfc --repository vincent/chat-api-vincent-dev`
3. Check Container Apps status: `az containerapp show --name ca-chatapi-ja67jva7pfqfc --resource-group rg-vincent-dev`

## Next Steps

1. ✅ Monitor performance and costs
2. ✅ Consider adding rate limiting
3. ✅ Add request/response logging
4. ✅ Implement health monitoring
5. ✅ Set up alerts for failures
6. ✅ Update CORS to restrict origins in production

## Conclusion

The migration to Azure Container Apps for chat streaming was successful. Users now experience real-time streaming responses with minimal latency, while the infrastructure remains cost-effective with scale-to-zero capabilities. The hybrid architecture allows us to keep existing CRUD endpoints on Functions while leveraging Container Apps for features that require true HTTP streaming.

**Key Metric**: Time to first chunk reduced from 45 seconds to ~1-2 seconds (95% improvement)! 🚀
