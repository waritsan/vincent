# 🔧 Environment Configuration Guide

## Overview

This project uses environment variables to avoid hardcoding sensitive URLs and configuration data.

## Required Environment Variables

### Frontend (Next.js)

**File:** `src/web/.env.local`

```bash
# Azure Functions API URL
NEXT_PUBLIC_API_URL=<your-api-url>
```

### How to Set Up

#### 1. For Local Development

```bash
cd src/web
cp .env.local.example .env.local
```

The default `.env.local` should contain:
```bash
NEXT_PUBLIC_API_URL=http://localhost:7071
```

#### 2. For Production Deployment

**Option A: Manual Configuration**

1. Get your Function App URL:
```bash
azd env get-values | grep AZURE_FUNCTION_URI
```

2. Update `src/web/.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://func-<your-unique-id>.azurewebsites.net
```

**Option B: Automated Setup Script**

Create `scripts/setup-env.sh`:
```bash
#!/bin/bash
# Extract Function App URL from azd environment
FUNCTION_URI=$(azd env get-values | grep AZURE_FUNCTION_URI | cut -d'=' -f2 | tr -d '"')

# Update .env.local
cat > src/web/.env.local << EOF
# Azure Functions API URL (Generated automatically)
NEXT_PUBLIC_API_URL=${FUNCTION_URI}
EOF

echo "✅ Environment configured with API URL: ${FUNCTION_URI}"
```

Then run:
```bash
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh
```

#### 3. For Static Web App Deployment

Azure Static Web Apps can use environment variables during build:

1. In Azure Portal, go to your Static Web App
2. Navigate to **Configuration** → **Application settings**
3. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://func-<your-id>.azurewebsites.net`

Or via Azure CLI:
```bash
STATIC_WEB_APP_NAME=$(azd env get-values | grep AZURE_STATIC_WEB_APP_NAME | cut -d'=' -f2 | tr -d '"')
FUNCTION_URI=$(azd env get-values | grep AZURE_FUNCTION_URI | cut -d'=' -f2 | tr -d '"')
RESOURCE_GROUP=$(az group list --query "[?contains(name, 'vincent')].name" -o tsv)

az staticwebapp appsettings set \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names NEXT_PUBLIC_API_URL=$FUNCTION_URI
```

## Security Best Practices

### ✅ DO

- ✅ Use environment variables for all URLs and configuration
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Provide `.env.local.example` without sensitive data
- ✅ Document required environment variables
- ✅ Use different values for dev/staging/prod environments
- ✅ Validate environment variables at runtime

### ❌ DON'T

- ❌ Hardcode URLs in source code
- ❌ Commit `.env.local` to git
- ❌ Include production URLs in `.env.local.example`
- ❌ Share `.env.local` files publicly
- ❌ Use hardcoded fallback URLs in production code
- ❌ Store secrets or API keys in environment variables (use Azure Key Vault)

## Troubleshooting

### Error: "API URL not configured"

**Cause:** `NEXT_PUBLIC_API_URL` is not set.

**Solution:**
1. Check if `.env.local` exists:
```bash
ls -la src/web/.env.local
```

2. If not, copy from example:
```bash
cp src/web/.env.local.example src/web/.env.local
```

3. Verify the value:
```bash
cat src/web/.env.local
```

4. Restart the dev server:
```bash
npm run dev
```

### Environment Variable Not Loading

**Next.js Requirements:**
- Must start with `NEXT_PUBLIC_` to be available in browser
- Restart dev server after changing `.env.local`
- For production builds, rebuild with `npm run build`

**Verify it's loaded:**
```typescript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

### Different Values for Dev/Prod

**Development (`.env.local`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:7071
```

**Production (Azure Static Web App Configuration):**
```bash
NEXT_PUBLIC_API_URL=https://func-<your-id>.azurewebsites.net
```

## Validation

### Frontend Code Example

Both `AIChat.tsx` and `BlogPosts.tsx` now validate the environment variable:

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
}

const response = await fetch(`${apiUrl}/api/posts`);
```

This ensures:
- ✅ No hardcoded URLs
- ✅ Clear error message if misconfigured
- ✅ Fail fast during development
- ✅ Easy debugging

## Additional Resources

### Azure Environment Values

Get all environment variables from Azure:
```bash
azd env get-values
```

Get specific values:
```bash
azd env get-values | grep FUNCTION
azd env get-values | grep COSMOS
azd env get-values | grep STATIC
```

### Next.js Environment Variables

Official documentation:
https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

### Azure Static Web Apps Configuration

Official documentation:
https://learn.microsoft.com/azure/static-web-apps/application-settings

## Quick Reference

| Environment | File/Location | Value |
|-------------|---------------|-------|
| **Local Dev** | `src/web/.env.local` | `http://localhost:7071` |
| **Azure Static Web App** | Portal Configuration | Function App URL from `azd` |
| **Azure Function App** | Managed by Bicep | Cosmos DB endpoint, etc. |

---

**Last Updated:** October 13, 2025  
**Status:** No hardcoded URLs in codebase ✅
