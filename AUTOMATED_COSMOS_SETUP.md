# ✅ Cosmos DB Automated Setup Checklist

## What Happens When You Run `azd up`?

Your Cosmos DB will be **100% ready to use** with zero manual configuration! Here's what happens automatically:

### 1️⃣ Infrastructure Provisioning (via Bicep)

```bash
azd up
# or
azd provision
```

**Automatically creates:**
- ✅ Cosmos DB account (serverless mode)
- ✅ Database: `blogdb`
- ✅ Container: `posts` (partition key: `/id`)
- ✅ Function App with managed identity enabled
- ✅ RBAC role assignment (Cosmos DB Built-in Data Contributor)
- ✅ Environment variables in Function App

### 2️⃣ What Gets Configured Automatically

#### Cosmos DB Account
```bicep
✅ Serverless capability enabled
✅ Session consistency level
✅ Single region (East US 2)
✅ TLS 1.2 minimum
✅ Public network access enabled
```

#### Database & Container
```bicep
✅ Database: blogdb
✅ Container: posts
   ├── Partition key: /id
   └── No throughput (serverless auto-scales)
```

#### Security (RBAC)
```bicep
✅ Function App identity: System-assigned managed identity
✅ Role: Cosmos DB Built-in Data Contributor
   ├── Full CRUD permissions
   ├── Can read, write, delete documents
   └── No manual key management needed
```

#### Function App Settings
```bicep
✅ AZURE_COSMOS_ENDPOINT: https://cosmos-xxx.documents.azure.com:443/
✅ AZURE_COSMOS_DATABASE_NAME: blogdb
✅ Managed identity enabled
```

## 🎯 Zero Manual Steps Required!

**Before deployment (what you DON'T need to do):**
- ❌ Create database manually in portal
- ❌ Create containers manually
- ❌ Copy connection strings
- ❌ Configure access keys
- ❌ Set up environment variables
- ❌ Assign RBAC roles manually

**After `azd up` completes:**
- ✅ Database ready
- ✅ Container ready
- ✅ Security configured
- ✅ Function App connected
- ✅ Ready to deploy code!

## 🧪 Verify Everything Works

Run the verification script:

```bash
./scripts/verify-cosmos-setup.sh
```

**Expected output:**
```
✅ Cosmos DB Endpoint: https://cosmos-xxx.documents.azure.com:443/
✅ Database Name: blogdb
✅ Function App: func-xxx
✅ Managed Identity Principal ID: xxx-xxx-xxx
✅ Database 'blogdb' exists
✅ Container 'posts' exists
✅ Role assignment exists for Function App
✅ Function App has correct Cosmos DB configuration

🎉 Cosmos DB Setup Verification Complete!
```

## 📦 Infrastructure Files Responsible

### `infra/main.bicep`
```bicep
// 1. Creates Cosmos DB
module cosmosDb 'core/database/cosmos/cosmos-serverless.bicep' = {
  name: 'cosmosdb'
  scope: rg
  params: {
    name: '${abbrs.documentDBDatabaseAccounts}${resourceToken}'
    location: location
    tags: tags
    kind: 'GlobalDocumentDB'
    databaseName: 'blogdb'        // ← Auto-creates database
    containers: [                   // ← Auto-creates containers
      {
        name: 'posts'
        partitionKeyPath: '/id'
      }
    ]
  }
}

// 2. Grants Function App access
module cosmosDbRoleAssignment 'core/database/cosmos/sql/cosmos-sql-role-assign.bicep' = {
  name: 'cosmosdb-role-assignment'
  scope: rg
  params: {
    accountName: cosmosDb.outputs.name
    roleDefinitionId: '${cosmosDb.outputs.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002'
    principalId: functionApp.outputs.identityPrincipalId  // ← Auto-assigns role
  }
}

// 3. Configures Function App environment
module functionApp 'core/host/functions.bicep' = {
  params: {
    managedIdentity: true          // ← Enables managed identity
    appSettings: {
      AZURE_COSMOS_ENDPOINT: cosmosDb.outputs.endpoint              // ← Auto-configured
      AZURE_COSMOS_DATABASE_NAME: cosmosDb.outputs.databaseName     // ← Auto-configured
    }
  }
}
```

### `infra/core/database/cosmos/cosmos-serverless.bicep`
```bicep
// Creates Cosmos account with serverless
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-08-15' = {
  properties: {
    capabilities: [
      { name: 'EnableServerless' }  // ← Serverless = cheapest
    ]
  }
}

// Auto-creates database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-08-15' = {
  parent: cosmosAccount
  name: databaseName
}

// Auto-creates containers
resource sqlContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-08-15' = [
  for container in containers: {
    parent: database
    name: container.name
    properties: {
      resource: {
        partitionKey: {
          paths: [container.partitionKeyPath]
        }
      }
    }
  }
]
```

## 🚀 Complete Deployment Flow

### Fresh Deployment (New Environment)

```bash
# 1. Initialize and deploy everything
azd up

# What happens:
# ✅ Creates resource group
# ✅ Deploys all Bicep modules
# ✅ Creates Cosmos DB + database + containers
# ✅ Configures Function App with managed identity
# ✅ Assigns RBAC roles
# ✅ Sets environment variables
# ✅ Deploys Function App code
# ✅ Deploys Static Web App
# 
# Duration: ~3-4 minutes
# Manual steps: ZERO!
```

### Verify Setup

```bash
# 2. Verify everything is ready
./scripts/verify-cosmos-setup.sh

# 3. Check environment variables
azd env get-values | grep COSMOS
```

### Your Code Just Works!

```python
# src/api/function_app.py
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential

# These are automatically set by azd up!
endpoint = os.environ["AZURE_COSMOS_ENDPOINT"]
database_name = os.environ["AZURE_COSMOS_DATABASE_NAME"]

# This uses managed identity automatically!
credential = DefaultAzureCredential()
client = CosmosClient(endpoint, credential=credential)

# Database and container already exist!
database = client.get_database_client(database_name)
container = database.get_container_client("posts")

# Start using immediately - no setup needed!
container.create_item({"id": "1", "title": "Hello World"})
```

## 📊 What You Get Out-of-the-Box

| Feature | Status | Configuration Required |
|---------|--------|----------------------|
| Cosmos DB Account | ✅ Created | None |
| Database (blogdb) | ✅ Created | None |
| Container (posts) | ✅ Created | None |
| Serverless Pricing | ✅ Enabled | None |
| Managed Identity | ✅ Enabled | None |
| RBAC Role | ✅ Assigned | None |
| Environment Variables | ✅ Set | None |
| Security (TLS 1.2) | ✅ Enabled | None |
| **Ready to Use** | ✅ **YES** | **ZERO!** |

## 🔄 Redeployment (Updates)

```bash
# Update infrastructure only
azd provision

# Update code only
azd deploy

# Update everything
azd up
```

**All Cosmos DB settings persist!** Your database won't be recreated unless you change the resource name.

## 🎉 Summary

**Running `azd up` gives you:**
1. ✅ Fully configured Cosmos DB (serverless)
2. ✅ Database and containers ready
3. ✅ Secure authentication (managed identity)
4. ✅ Function App connected and configured
5. ✅ All environment variables set
6. ✅ RBAC permissions assigned
7. ✅ **Zero manual configuration needed!**

**Your next step:** Just write your Python code and it will work immediately! 🚀

---

**Last verified:** October 11, 2025  
**Cosmos DB Template:** `infra/core/database/cosmos/cosmos-serverless.bicep`  
**Automation:** 100% via Infrastructure as Code (Bicep)
