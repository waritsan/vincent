# Quick Start - Chat API with Streaming

## Deploy Everything
```bash
azd up
```

## Test Chat API
```bash
# Health check
curl https://ca-chatapi-ja67jva7pfqfc.ashycliff-dde1592b.eastus2.azurecontainerapps.io/api/health

# Chat with streaming
curl -X POST https://ca-chatapi-ja67jva7pfqfc.ashycliff-dde1592b.eastus2.azurecontainerapps.io/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","thread_id":null}' \
  --no-buffer
```

## View Logs
```bash
az containerapp logs show \
  --name ca-chatapi-ja67jva7pfqfc \
  --resource-group rg-vincent-dev \
  --tail 50 \
  --follow
```

## Required Roles (Managed Identity)
At AI Services resource level:
- Azure AI Developer
- Cognitive Services User

## Environment Variables (Container App)
- `AZURE_AI_ENDPOINT`: https://cog-ja67jva7pfqfc.cognitiveservices.azure.com/
- `AZURE_AI_PROJECT_NAME`: project-ja67jva7pfqfc
- `AZURE_AI_AGENT_ID`: asst_VF1pUCg1iH9WkKtnhbd3Lq09
- `AZURE_CLIENT_ID`: (set automatically by managed identity)
- `AZURE_SUBSCRIPTION_ID`: (set automatically)
- `AZURE_RESOURCE_GROUP_NAME`: (set automatically)

## Frontend Testing
https://calm-bay-09b1e430f.1.azurestaticapps.net/

Open the chat and you should see streaming responses in real-time!

## Troubleshooting
If chat API returns "not configured":
1. Check role assignments are at resource level (not resource group)
2. Restart container: `az containerapp revision restart --name ca-chatapi-ja67jva7pfqfc --resource-group rg-vincent-dev --revision <latest>`
3. Wait 5 minutes for RBAC propagation
