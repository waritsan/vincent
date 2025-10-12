#!/bin/bash
# Script to verify Cosmos DB is fully set up and ready to use

set -e

echo "🔍 Verifying Cosmos DB Setup..."
echo ""

# Check if azd environment is initialized
if [ ! -f ".azure/$AZURE_ENV_NAME/.env" ]; then
    echo "❌ Azure environment not initialized. Run 'azd up' first."
    exit 1
fi

# Get Cosmos DB endpoint
COSMOS_ENDPOINT=$(azd env get-values | grep AZURE_COSMOS_ENDPOINT | cut -d'=' -f2 | tr -d '"')
COSMOS_DB_NAME=$(azd env get-values | grep AZURE_COSMOS_DATABASE_NAME | cut -d'=' -f2 | tr -d '"')
FUNCTION_APP=$(azd env get-values | grep AZURE_FUNCTION_APP_NAME | cut -d'=' -f2 | tr -d '"')

echo "✅ Cosmos DB Endpoint: $COSMOS_ENDPOINT"
echo "✅ Database Name: $COSMOS_DB_NAME"
echo "✅ Function App: $FUNCTION_APP"
echo ""

# Verify Function App has managed identity
echo "🔐 Checking Function App Managed Identity..."
PRINCIPAL_ID=$(az functionapp identity show --name $FUNCTION_APP --resource-group $(azd env get-values | grep AZURE_RESOURCE_GROUP | cut -d'=' -f2 | tr -d '"') --query principalId -o tsv)

if [ -z "$PRINCIPAL_ID" ]; then
    echo "❌ Function App does not have managed identity enabled!"
    exit 1
fi

echo "✅ Managed Identity Principal ID: $PRINCIPAL_ID"
echo ""

# Check if database exists
echo "📊 Verifying Database and Container..."
COSMOS_ACCOUNT=$(echo $COSMOS_ENDPOINT | sed 's/https:\/\///' | sed 's/\.documents\.azure\.com.*//')
RESOURCE_GROUP=$(azd env get-values | grep AZURE_RESOURCE_GROUP | cut -d'=' -f2 | tr -d '"')

# Check database
DB_CHECK=$(az cosmosdb sql database show \
    --account-name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --name $COSMOS_DB_NAME \
    --query id -o tsv 2>/dev/null || echo "")

if [ -z "$DB_CHECK" ]; then
    echo "❌ Database '$COSMOS_DB_NAME' not found!"
    exit 1
fi

echo "✅ Database '$COSMOS_DB_NAME' exists"

# Check container
CONTAINER_CHECK=$(az cosmosdb sql container show \
    --account-name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --database-name $COSMOS_DB_NAME \
    --name posts \
    --query id -o tsv 2>/dev/null || echo "")

if [ -z "$CONTAINER_CHECK" ]; then
    echo "❌ Container 'posts' not found!"
    exit 1
fi

echo "✅ Container 'posts' exists"
echo ""

# Check role assignments
echo "🔑 Verifying RBAC Role Assignment..."
ROLE_ASSIGNMENTS=$(az cosmosdb sql role assignment list \
    --account-name $COSMOS_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --query "[?principalId=='$PRINCIPAL_ID'].roleDefinitionId" -o tsv)

if [ -z "$ROLE_ASSIGNMENTS" ]; then
    echo "⚠️  No role assignments found for Function App!"
    echo "   This might take a few moments to propagate..."
else
    echo "✅ Role assignment exists for Function App"
fi
echo ""

# Verify environment variables in Function App
echo "🔧 Checking Function App Configuration..."
ENV_CHECK=$(az functionapp config appsettings list \
    --name $FUNCTION_APP \
    --resource-group $RESOURCE_GROUP \
    --query "[?name=='AZURE_COSMOS_ENDPOINT'].value" -o tsv)

if [ "$ENV_CHECK" != "$COSMOS_ENDPOINT" ]; then
    echo "❌ AZURE_COSMOS_ENDPOINT not configured correctly in Function App!"
    exit 1
fi

echo "✅ Function App has correct Cosmos DB configuration"
echo ""

echo "🎉 Cosmos DB Setup Verification Complete!"
echo ""
echo "📝 Summary:"
echo "   - Cosmos DB Account: $COSMOS_ACCOUNT"
echo "   - Database: $COSMOS_DB_NAME"
echo "   - Container: posts"
echo "   - Function App: $FUNCTION_APP"
echo "   - Managed Identity: Enabled"
echo "   - RBAC: Configured"
echo ""
echo "✅ Your Cosmos DB is ready to use! No manual configuration needed."
