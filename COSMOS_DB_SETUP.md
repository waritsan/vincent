# Azure Cosmos DB Setup - Serverless (Cheapest Plan)

## ✅ Successfully Deployed!

**Cosmos DB Account:** `cosmos-ja67jva7pfqfc`  
**Endpoint:** `https://cosmos-ja67jva7pfqfc.documents.azure.com:443/`  
**Database:** `blogdb`  
**Container:** `posts` (partition key: `/id`)

## 💰 Why Serverless is the Cheapest Option

### Serverless Mode Benefits:
1. **No minimum cost** - Only pay for Request Units (RUs) and storage you actually use
2. **Automatic scaling** - Scales from 0 to any level automatically
3. **No provisioned throughput** - No need to pre-allocate capacity
4. **Perfect for development** - Ideal for low-traffic apps and testing

### Cost Comparison:

| Mode | Monthly Cost (Est.) | Best For |
|------|---------------------|----------|
| **Serverless** | **~$0.25/GB storage + $0.28 per million RUs** | Development, low-traffic apps |
| Provisioned (400 RU/s) | ~$24/month minimum | Production apps with predictable traffic |
| Free Tier | First 1000 RU/s free | Single-region, 1 account per subscription |

**For your blog app with low traffic, serverless will likely cost < $5/month!**

## 🔐 Security Configuration

### Authentication:
- ✅ **Managed Identity** - Function App authenticates using its managed identity
- ✅ **RBAC Role** - Assigned "Cosmos DB Built-in Data Contributor" role
- ✅ **No connection strings** - Secure, key-less authentication

### Access Control:
```bicep
// Role Assignment in infra/main.bicep
roleDefinitionId: '${cosmosDb.outputs.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002'
// Cosmos DB Built-in Data Contributor
```

## 📦 Database Structure

```
cosmos-ja67jva7pfqfc/
└── blogdb/
    └── posts/  (container)
        ├── Partition Key: /id
        └── No throughput provisioned (serverless)
```

## 🔌 Function App Integration

The Function App has these environment variables set automatically:

```bash
AZURE_COSMOS_ENDPOINT="https://cosmos-ja67jva7pfqfc.documents.azure.com:443/"
AZURE_COSMOS_DATABASE_NAME="blogdb"
```

## 📝 Using Cosmos DB in Python Code

### Install SDK:
```bash
pip install azure-cosmos azure-identity
```

### Sample Code for Function App:

```python
import os
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential

# Get config from environment
endpoint = os.environ["AZURE_COSMOS_ENDPOINT"]
database_name = os.environ["AZURE_COSMOS_DATABASE_NAME"]

# Authenticate with Managed Identity
credential = DefaultAzureCredential()
client = CosmosClient(endpoint, credential=credential)

# Get database and container
database = client.get_database_client(database_name)
container = database.get_container_client("posts")

# Create a post
new_post = {
    "id": "post-1",
    "title": "My First Post",
    "content": "Hello Cosmos DB!",
    "author": "Vincent",
    "created_at": "2025-10-11T00:00:00Z"
}
container.create_item(body=new_post)

# Query posts
query = "SELECT * FROM c WHERE c.author = @author"
params = [{"name": "@author", "value": "Vincent"}]
posts = list(container.query_items(
    query=query,
    parameters=params,
    enable_cross_partition_query=True
))
```

## 🚀 Next Steps

### 1. Update Function App Code

Add Cosmos DB SDK to `src/api/requirements.txt`:
```txt
azure-cosmos==4.5.1
azure-identity==1.15.0
```

### 2. Update `/api/posts` Endpoint

Replace the mock data with actual Cosmos DB queries:
```python
@app.route(route="posts", methods=["GET", "POST"])
def posts(req: func.HttpRequest) -> func.HttpResponse:
    # Initialize Cosmos DB client
    endpoint = os.environ["AZURE_COSMOS_ENDPOINT"]
    database_name = os.environ["AZURE_COSMOS_DATABASE_NAME"]
    
    credential = DefaultAzureCredential()
    client = CosmosClient(endpoint, credential=credential)
    database = client.get_database_client(database_name)
    container = database.get_container_client("posts")
    
    if req.method == "GET":
        # Query all posts
        posts = list(container.query_items(
            query="SELECT * FROM c ORDER BY c.created_at DESC",
            enable_cross_partition_query=True
        ))
        return create_response({"posts": posts, "total": len(posts)})
    
    elif req.method == "POST":
        # Create new post
        req_body = req.get_json()
        new_post = {
            "id": str(uuid.uuid4()),
            "title": req_body.get("title"),
            "content": req_body.get("content"),
            "author": req_body.get("author", "Anonymous"),
            "created_at": datetime.utcnow().isoformat()
        }
        container.create_item(body=new_post)
        return create_response(new_post, 201)
```

### 3. Deploy the Updated Code

```bash
azd deploy
```

## 📊 Monitoring Costs

### View Cosmos DB Metrics:
1. Go to Azure Portal
2. Navigate to your Cosmos DB account: `cosmos-ja67jva7pfqfc`
3. Click **Metrics** → View RU consumption
4. Click **Cost Management** → View actual costs

### Estimated Usage for a Blog:
- **Storage**: ~10 MB = ~$0.003/month
- **Reads**: 1000 requests/day = ~30K/month = ~0.03 million RUs = ~$0.01/month
- **Writes**: 10 posts/day = ~300/month = ~0.0003 million RUs = ~$0.0001/month

**Total estimated cost: < $0.10/month for low traffic!**

## 🔧 Infrastructure Files

### Created Files:
- `infra/core/database/cosmos/cosmos-serverless.bicep` - Serverless Cosmos DB module
- Updated `infra/main.bicep` - Added Cosmos DB and role assignment

### Configuration:
```bicep
capabilities: [ 
  { 
    name: 'EnableServerless' // This enables serverless mode
  } 
]
```

## 📚 Resources

- [Cosmos DB Serverless](https://learn.microsoft.com/azure/cosmos-db/serverless)
- [Cosmos DB Pricing](https://azure.microsoft.com/pricing/details/cosmos-db/)
- [Python SDK Documentation](https://learn.microsoft.com/azure/cosmos-db/nosql/quickstart-python)
- [RBAC for Cosmos DB](https://learn.microsoft.com/azure/cosmos-db/how-to-setup-rbac)

---

**Status:** ✅ Deployed and Ready to Use  
**Cost:** ~$0.10-5/month (depending on traffic)  
**Authentication:** Managed Identity (secure, no keys)
