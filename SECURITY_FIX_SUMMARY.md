# 🔒 Security Fix: Removed Hardcoded URLs

## ✅ What Was Fixed

### Problem
- Hardcoded Azure Function App URLs in frontend code
- Fallback URLs exposed in source code
- Security risk and lack of flexibility

### Solution
- Removed all hardcoded URLs
- Environment variable validation
- Proper configuration guide
- Automated setup script

## 📝 Changes Made

### 1. **AIChat.tsx** - Removed Hardcoded Fallback
**Before:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://func-ja67jva7pfqfc.azurewebsites.net';
```

**After:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
}
```

### 2. **BlogPosts.tsx** - Removed Hardcoded Fallback
**Before:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://func-ja67jva7pfqfc.azurewebsites.net';
```

**After:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
}
```

### 3. **.env.local.example** - Updated Template
**Before:**
```bash
NEXT_PUBLIC_API_URL=https://func-ja67jva7pfqfc.azurewebsites.net
```

**After:**
```bash
# For local development, use: http://localhost:7071
# For production, use your Azure Function App URL from: azd env get-values | grep AZURE_FUNCTION_URI
NEXT_PUBLIC_API_URL=http://localhost:7071
```

### 4. **New Files Created**

#### `ENVIRONMENT_CONFIG.md`
- Comprehensive configuration guide
- Security best practices
- Troubleshooting steps
- Different setups for dev/prod

#### `scripts/setup-env.sh`
- Automated environment setup
- Fetches URLs from Azure
- Updates `.env.local` automatically
- Safe and reusable

## 🔒 Security Improvements

### ✅ Benefits

1. **No Hardcoded URLs**
   - All URLs come from environment variables
   - No sensitive data in source code
   - Can't accidentally expose production URLs

2. **Environment Validation**
   - Code checks if env var is set
   - Fails fast with clear error message
   - Prevents runtime issues in production

3. **Flexible Configuration**
   - Easy to switch between dev/prod
   - Can use different URLs per environment
   - No code changes needed

4. **Automated Setup**
   - Script fetches URLs from Azure
   - Updates configuration automatically
   - Reduces human error

## 📋 Files Modified

- ✅ `src/web/src/app/components/AIChat.tsx`
- ✅ `src/web/src/app/components/BlogPosts.tsx`
- ✅ `src/web/.env.local.example`
- ✅ `ENVIRONMENT_CONFIG.md` (NEW)
- ✅ `scripts/setup-env.sh` (NEW)

## 🚀 How to Use

### For Local Development

1. Copy the example file:
```bash
cp src/web/.env.local.example src/web/.env.local
```

2. The default points to localhost:
```bash
NEXT_PUBLIC_API_URL=http://localhost:7071
```

3. Start dev server:
```bash
cd src/web && npm run dev
```

### For Production Configuration

**Option 1: Automated (Recommended)**
```bash
./scripts/setup-env.sh
```

**Option 2: Manual**
```bash
# Get Function App URL
azd env get-values | grep AZURE_FUNCTION_URI

# Update src/web/.env.local
NEXT_PUBLIC_API_URL=https://func-<your-id>.azurewebsites.net
```

## 🧪 Testing

### Verify Environment Variable is Required

1. Delete `.env.local`:
```bash
rm src/web/.env.local
```

2. Start dev server:
```bash
npm run dev
```

3. Try to load the page - you should see:
```
Error: API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.
```

4. Restore `.env.local`:
```bash
cp src/web/.env.local.example src/web/.env.local
```

## ✅ Security Checklist

- ✅ No hardcoded URLs in code
- ✅ `.env.local` in `.gitignore`
- ✅ `.env.local.example` has safe defaults
- ✅ Environment variables validated at runtime
- ✅ Clear error messages for misconfiguration
- ✅ Automated setup script available
- ✅ Documentation updated

## 📚 Additional Resources

- `ENVIRONMENT_CONFIG.md` - Full configuration guide
- `scripts/setup-env.sh` - Automated setup
- `.env.local.example` - Template file

## ⚠️ Important Notes

### DO NOT Commit
- ❌ `.env.local` (contains actual URLs)
- ❌ Any file with production URLs
- ❌ API keys or secrets

### DO Commit
- ✅ `.env.local.example` (template only)
- ✅ Configuration documentation
- ✅ Setup scripts

### For Team Members

When cloning the repo, they should:
1. Copy `.env.local.example` to `.env.local`
2. Run `./scripts/setup-env.sh` to auto-configure
3. Or manually set `NEXT_PUBLIC_API_URL`

---

**Status:** ✅ Hardcoded URLs Removed  
**Security:** ✅ Improved  
**Ready for Review:** Yes - waiting for your approval to commit
