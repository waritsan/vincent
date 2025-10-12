# 🚀 Quick Start - Cosmos DB Ready to Use!

## TL;DR - It Just Works™

Your Cosmos DB is **already set up and ready**! No manual configuration needed.

## ✅ What's Already Done

```bash
✓ Cosmos DB Account (serverless - cheapest!)
✓ Database: blogdb
✓ Container: posts (partition key: /id)
✓ Managed Identity enabled
✓ RBAC permissions configured
✓ Environment variables set
```

## 📝 Use It Right Now

### 1. Install Dependencies

```bash
cd src/api
pip install azure-cosmos azure-identity
```

Or add to `requirements.txt`:
```txt
azure-cosmos>=4.5.0
azure-identity>=1.15.0
```

### 2. Use in Your Code

```python
import os
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential

# Already configured by azd up!
endpoint = os.environ["AZURE_COSMOS_ENDPOINT"]
db_name = os.environ["AZURE_COSMOS_DATABASE_NAME"]

# Auto-authenticates with managed identity
client = CosmosClient(endpoint, DefaultAzureCredential())
database = client.get_database_client(db_name)
container = database.get_container_client("posts")

# Use it!
container.create_item({"id": "1", "title": "Hello!"})
posts = list(container.read_all_items())
```

### 3. Deploy

```bash
azd deploy
```

Done! 🎉

## 🔍 Verify Setup

```bash
# Run verification script
./scripts/verify-cosmos-setup.sh

# Or check manually
azd env get-values | grep COSMOS
```

## 💰 Cost

Serverless = Pay only for what you use
- Low traffic blog: **< $1/month**
- No minimum charges
- Scales automatically

## 📚 More Info

- **Full Details:** `COSMOS_DB_SETUP.md`
- **Automation Details:** `AUTOMATED_COSMOS_SETUP.md`
- **Verification Results:** `VERIFICATION_RESULTS.md`

## 🎯 That's It!

No setup needed. Just write your code and deploy! 🚀
