# AI Chat Performance Analysis

## Current Setup

### Architecture
- **Frontend**: Next.js app (localhost:3001)
- **Chat Backend**: Azure Container Apps (eastus2 region)
- **AI Provider**: Azure AI Agent (streaming enabled)
- **Connection**: Frontend → Azure Container Apps → Azure AI Agent

### Environment Configuration
```bash
NEXT_PUBLIC_CHAT_API_URL=https://ca-chatapi-ja67jva7pfqfc.ashycliff-dde1592b.eastus2.azurecontainerapps.io
```

## Potential Performance Issues

### 1. **Cold Start Delays** ⏱️
**Problem**: Azure Container Apps may scale to zero when idle, causing 5-30 second delays on first request.

**Solutions**:
```bash
# In Azure Portal, set minimum replicas to 1
az containerapp update \
  --name ca-chatapi \
  --resource-group <your-rg> \
  --min-replicas 1
```

### 2. **Network Latency** 🌐
**Problem**: 
- Your local dev is in your region
- Azure Container Apps in eastus2
- Round-trip latency adds delay

**Current Flow**:
```
Local (your location) 
  → Azure eastus2 (chat-api container) 
    → Azure AI Agent 
      → Response back
```

**Solutions**:
- Run chat API locally for development
- Deploy to region closer to you
- Use Azure Front Door for CDN

### 3. **Azure AI Agent Processing Time** 🤖
**Problem**: AI model inference takes time (typically 2-10 seconds)

**What's Normal**:
- Simple queries: 2-4 seconds
- Complex queries: 5-10 seconds
- First message in thread: +1-2 seconds (thread creation)

**This is expected** and can't be significantly improved without changing models.

### 4. **Frontend Streaming Delay** 📡
**Current Implementation**:
```typescript
// 20ms delay between chunks for smooth effect
await new Promise(resolve => setTimeout(resolve, 20));
```

**Impact**: Artificial smoothing adds minimal delay but improves UX

## Quick Performance Tests

### Test 1: Check Cold Start
Run this in terminal:
```bash
# Time the first request
time curl https://ca-chatapi-ja67jva7pfqfc.ashycliff-dde1592b.eastus2.azurecontainerapps.io/api/health

# Time second request immediately after
time curl https://ca-chatapi-ja67jva7pfqfc.ashycliff-dde1592b.eastus2.azurecontainerapps.io/api/health
```

If first request is >5 seconds and second is <1 second, you have cold start issues.

### Test 2: Run Chat API Locally
```bash
cd src/chat-api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Then update `.env.local`:
```bash
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000
```

This eliminates network latency and cold starts.

## Recommended Optimizations

### Immediate (Development)
1. **Run chat API locally** during development
2. **Keep browser dev tools Network tab open** to see actual response times
3. **Check Azure Container Apps logs** for actual processing time

### Short-term (Production)
1. **Set minimum replicas to 1** to prevent cold starts
2. **Enable keep-alive** in Container Apps
3. **Add health check endpoint** warming

### Long-term
1. **Consider using Azure OpenAI directly** instead of AI Agent if not using specialized features
2. **Implement response caching** for common queries
3. **Add Redis cache** for thread/conversation data
4. **Use Azure Front Door** for global distribution

## Debugging Steps

### 1. Check Network Time
Open Browser DevTools → Network tab → Find the chat request:
- **Waiting (TTFB)**: Time to first byte (includes cold start + AI processing)
- **Content Download**: Streaming time

### 2. Check Backend Logs
```bash
# Check Container Apps logs
az containerapp logs show \
  --name ca-chatapi \
  --resource-group <your-rg> \
  --follow
```

Look for:
- `Processing chat request` timestamp
- `Run completed` timestamp
- Time difference = actual AI processing time

### 3. Compare Local vs Production
Test same query:
- With local chat-api: Should be 2-5 seconds
- With Azure Container Apps: Should be +1-3 seconds for network
- If Azure is >10 seconds slower, investigate cold start

## What's Actually Slow?

Based on the code:

✅ **Working Well**:
- True HTTP streaming (not mock)
- Efficient event processing
- Proper async/await patterns

❓ **Likely Culprits**:
1. **Cold start** (most likely if first message is slow)
2. **Network latency** (if consistently 2-3 seconds slower than local)
3. **AI Agent itself** (if even local is slow, this is the bottleneck)

## Measure Real Performance

Add this to frontend to see timing:
```typescript
// In AIChat.tsx sendMessage function
const startTime = Date.now();
const response = await fetch(`${apiUrl}/api/chat`, {...});
console.log(`Time to start response: ${Date.now() - startTime}ms`);

// After streaming completes
console.log(`Total chat time: ${Date.now() - startTime}ms`);
```

## Expected Performance Benchmarks

- **Cold start**: 5-30 seconds (first request after idle)
- **Warm start**: <1 second to begin streaming
- **AI response time**: 2-10 seconds (depends on query complexity)
- **Total time (warm)**: 3-11 seconds from send to complete

If you're seeing >15 seconds consistently, something needs investigation.
