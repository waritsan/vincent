# 🚀 Quick Deployment Guide

## Summary
Migrate chat API from Azure Functions (simulated streaming) to Azure Container Apps (TRUE streaming) while keeping other endpoints on Functions.

## 📋 Prerequisites
- ✅ Azure CLI installed
- ✅ Azure Developer CLI (azd) installed
- ✅ Docker installed
- ✅ Logged in to Azure: `az login`

## 🎯 One-Command Deployment

```bash
cd /Users/waritsan/Developer/vincent
azd up
```

That's it! This will:
1. ✅ Create Container Registry
2. ✅ Create Container Apps Environment  
3. ✅ Build Docker image
4. ✅ Push to registry
5. ✅ Deploy chat API with serverless (scale-to-zero)
6. ✅ Deploy Functions (existing endpoints)
7. ✅ Deploy Static Web App (frontend)
8. ✅ Configure all connections

## ⏱️ Expected Time
- First deployment: ~10-15 minutes
- Subsequent deployments: ~3-5 minutes

## ✅ Verify Deployment

### 1. Check URLs
```bash
azd env get-values | grep URI
```

You should see:
```
AZURE_FUNCTION_URI=https://func-xxx.azurewebsites.net
AZURE_CHAT_API_URI=https://chatapi-xxx.xxx.azurecontainerapps.io
AZURE_STATIC_WEB_APP_URI=https://calm-bay-xxx.azurestaticapps.net
```

### 2. Test Chat API (TRUE Streaming!)
```bash
CHAT_URL=$(azd env get-value AZURE_CHAT_API_URI)

curl -X POST $CHAT_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a short story", "stream": true}'
```

You should see chunks appear **in real-time**! 🎉

### 3. Test Functions (Other Endpoints)
```bash
FUNC_URL=$(azd env get-value AZURE_FUNCTION_URI)

curl $FUNC_URL/api/posts
```

### 4. Open Frontend
```bash
WEB_URL=$(azd env get-value AZURE_STATIC_WEB_APP_URI)
open $WEB_URL
```

Try the chat widget - messages should stream word-by-word!

## 🔄 Update Deployment

To deploy only chat API (after code changes):
```bash
azd deploy chat-api
```

To deploy only functions:
```bash
azd deploy api
```

To deploy everything:
```bash
azd deploy
```

## 🐛 Troubleshooting

### Issue: Container not starting
```bash
# View logs
az containerapp logs show \
  --name $(azd env get-value AZURE_CHAT_API_NAME) \
  --resource-group $(azd env get-value AZURE_RESOURCE_GROUP) \
  --follow
```

### Issue: Streaming not working
Check CORS settings in `src/chat-api/main.py`:
```python
allow_origins=["*"]  # Should allow your frontend domain
```

### Issue: 401 Unauthorized
Verify managed identity has permissions:
```bash
# Get identity
IDENTITY_ID=$(azd env get-value AZURE_CHAT_API_IDENTITY_ID)

# Check role assignments
az role assignment list --assignee $IDENTITY_ID
```

### Issue: High costs
Check if scaling to zero:
```bash
# Should show 0 replicas after 5 min idle
az containerapp replica list \
  --name $(azd env get-value AZURE_CHAT_API_NAME) \
  --resource-group $(azd env get-value AZURE_RESOURCE_GROUP)
```

## 📊 Monitor Costs

1. Open Azure Portal
2. Go to Container Apps → Your app
3. Click "Metrics"
4. Monitor:
   - Requests count
   - CPU Usage %
   - Memory Usage %
   - Replica count

**Expected: ~$0.11/month for 1,000 requests**

## 🎯 Success Indicators

✅ **Working correctly if:**
1. Chat responses stream **word-by-word** (not all at once)
2. No 45-second wait before seeing content
3. Replica count = 0 when idle (after 5 minutes)
4. Other endpoints (posts) still work
5. Costs < $1/month at low traffic

## 📚 Additional Resources

- **Detailed docs:** `src/chat-api/README.md`
- **Migration guide:** `MIGRATION.md`
- **Architecture:** See diagrams in MIGRATION.md

## 🆘 Need Help?

Check the logs:
```bash
# Container App logs
az containerapp logs show --name <app-name> --resource-group <rg-name> --follow

# Function App logs  
az functionapp log tail --name <func-name> --resource-group <rg-name>
```

---

**Ready to deploy?** Run `azd up` and watch the magic happen! ✨
