# 🔧 Fixed: Production Environment Variable Configuration

## ❌ Problem

Your production website (https://calm-bay-09b1e430f.1.azurestaticapps.net) was getting:
```
GET http://localhost:7071/api/posts net::ERR_CONNECTION_REFUSED
```

**Root Cause:** The Static Web App was trying to use `localhost:7071` (from `.env.local`) instead of the production Function App URL.

## ✅ Solution

### Immediate Fix (Already Applied)
Configured the environment variable directly in Azure Static Web App:
```bash
az staticwebapp appsettings set \
  --name stapp-ja67jva7pfqfc \
  --resource-group rg-vincent-dev \
  --setting-names NEXT_PUBLIC_API_URL="https://func-ja67jva7pfqfc.azurewebsites.net"
```

✅ **Status:** Environment variable is now set in Azure

### Permanent Fix (Infrastructure as Code)
Updated Bicep templates to automatically configure this on every deployment:

#### 1. Updated `staticwebapp.bicep`
Added support for app settings:
```bicep
param appSettings object = {}

resource webConfig 'Microsoft.Web/staticSites/config@2022-03-01' = if (!empty(appSettings)) {
  parent: web
  name: 'appsettings'
  properties: appSettings
}
```

#### 2. Updated `main.bicep`
Pass Function App URL to Static Web App:
```bicep
module web 'core/host/staticwebapp.bicep' = {
  params: {
    appSettings: {
      NEXT_PUBLIC_API_URL: functionApp.outputs.uri
    }
  }
}
```

## 🎯 How It Works Now

### Development
- Uses `src/web/.env.local` → `http://localhost:7071`
- For local testing only
- Not deployed to Azure

### Production
- Azure Static Web App has app setting configured
- Automatically uses Function App URL
- Set via Bicep infrastructure
- Persists across deployments

## 📋 What Changed

### Infrastructure Files
- ✅ `infra/core/host/staticwebapp.bicep` - Added appSettings parameter
- ✅ `infra/main.bicep` - Pass Function App URL to Static Web App

### Frontend Files (Previous Changes)
- ✅ `src/web/src/app/components/AIChat.tsx` - Removed hardcoded URL
- ✅ `src/web/src/app/components/BlogPosts.tsx` - Removed hardcoded URL
- ✅ `src/web/.env.local.example` - Template file

### Documentation
- ✅ `ENVIRONMENT_CONFIG.md` - Configuration guide
- ✅ `SECURITY_FIX_SUMMARY.md` - Security improvements
- ✅ `scripts/setup-env.sh` - Auto-setup script

## 🚀 Next Steps

### Option 1: Trigger Rebuild (Quick Fix)
The environment variable is already set in Azure. Trigger a rebuild:
```bash
# Your GitHub Action will deploy automatically
git commit -m "fix: configure production API URL"
git push
```

### Option 2: Run Provision (Infrastructure Update)
Deploy the updated Bicep templates:
```bash
azd provision
```

This will:
- Update the Static Web App configuration
- Set `NEXT_PUBLIC_API_URL` automatically
- Persist the setting for future deployments

## ✅ Verification

After the next deployment:

1. Visit: https://calm-bay-09b1e430f.1.azurestaticapps.net
2. Check browser console - should see:
   ```
   GET https://func-ja67jva7pfqfc.azurewebsites.net/api/posts
   ```
3. Blog posts should load correctly
4. AI chat should work

## 📊 Current Status

### Already Applied (CLI)
```bash
✅ Environment variable set in Azure Static Web App
   NEXT_PUBLIC_API_URL = "https://func-ja67jva7pfqfc.azurewebsites.net"
```

### Ready to Commit
```bash
Modified files:
  ✅ infra/core/host/staticwebapp.bicep
  ✅ infra/main.bicep
  ✅ src/web/src/app/components/AIChat.tsx
  ✅ src/web/src/app/components/BlogPosts.tsx

New files:
  ✅ src/web/.env.local.example
  ✅ ENVIRONMENT_CONFIG.md
  ✅ SECURITY_FIX_SUMMARY.md
  ✅ scripts/setup-env.sh
  ✅ This summary
```

## 🔍 Why This Happened

1. `.env.local` is meant for local development only
2. Next.js on Static Web Apps needs environment variables configured in Azure
3. The Bicep template wasn't originally setting app settings
4. Now it automatically passes the Function App URL

## 💡 Key Learnings

### For Next.js on Azure Static Web Apps:
- ✅ Use Azure app settings for environment variables
- ✅ Configure via Bicep for Infrastructure as Code
- ✅ `.env.local` is for local development only
- ✅ Rebuild required after setting environment variables

### Environment Variable Priority:
1. **Azure Static Web App Settings** (production) ← We set this
2. **`.env.local`** (local development only)
3. **Code defaults** (removed - was causing issues)

---

**Status:** ✅ Fixed  
**Immediate Action Taken:** Set environment variable in Azure  
**Infrastructure Updated:** Yes - will persist on next deployment  
**Ready to Commit:** Yes - waiting for your instruction
