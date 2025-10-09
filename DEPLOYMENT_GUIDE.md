# Vincent Project - Azure Functions API Setup

## ✅ What's Been Created

### 1. **Azure Functions Project** (`src/api/`)
   - **Language**: Python 3.11
   - **Runtime**: Azure Functions v4
   - **Programming Model**: v2 (decorator-based)

### 2. **API Endpoints**

   #### `/api/chat` (POST)
   - AI-powered chat endpoint ready for Azure AI Foundry integration
   - Request body:
     ```json
     {
       "message": "Your message here",
       "conversation_id": "optional-conversation-id"
     }
     ```

   #### `/api/posts` (GET, POST)
   - **GET**: List all posts
   - **POST**: Create a new post
     ```json
     {
       "title": "Post Title",
       "content": "Post content",
       "author": "Author Name"
     }
     ```

   #### `/api/health` (GET)
   - Health check endpoint

### 3. **Infrastructure** (Bicep)
   - ✅ Azure Functions App with Python 3.11 runtime
   - ✅ App Service Plan (Consumption/Dynamic tier)
   - ✅ Storage Account (for Azure Functions state)
   - ✅ Application Insights (monitoring)
   - ✅ Log Analytics Workspace
   - ✅ Static Web App (for Next.js frontend)

### 4. **Configuration Files**
   - `requirements.txt` - Python dependencies
   - `host.json` - Azure Functions host configuration
   - `local.settings.json` - Local environment variables
   - `function_app.py` - Main function app with all endpoints

## 🚀 How to Deploy

### Option 1: Full Deployment (Recommended)
```bash
# From the root directory
azd up
```
This will:
1. Provision all Azure resources
2. Build the Next.js web app
3. Deploy the Python Functions API
4. Deploy the Static Web App

### Option 2: Step by Step
```bash
# 1. Provision infrastructure
azd provision

# 2. Deploy services
azd deploy
```

## 🧪 Local Development

### Test Functions Locally

1. **Navigate to the API directory**:
   ```bash
   cd src/api
   ```

2. **Activate virtual environment** (already created):
   ```bash
   source .venv/bin/activate
   ```

3. **Start the Functions runtime**:
   ```bash
   func start
   ```

4. **Test the endpoints**:
   ```bash
   # Health check
   curl http://localhost:7071/api/health

   # Chat endpoint
   curl -X POST http://localhost:7071/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello!", "conversation_id": "test-123"}'

   # Get posts
   curl http://localhost:7071/api/posts

   # Create post
   curl -X POST http://localhost:7071/api/posts \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Post", "content": "Test content", "author": "Me"}'
   ```

## 🔧 Azure AI Foundry Integration

To enable Azure AI Foundry:

1. **Create an Azure AI Foundry project** in the Azure Portal

2. **Update `local.settings.json`** for local development:
   ```json
   {
     "Values": {
       "AZURE_AI_ENDPOINT": "https://your-ai-endpoint.cognitiveservices.azure.com/",
       "AZURE_AI_PROJECT_NAME": "your-project-name",
       "AZURE_AI_DEPLOYMENT_NAME": "your-deployment-name"
     }
   }
   ```

3. **For production**, update `infra/main.bicep` to add the AI Foundry connection:
   - The infrastructure already has placeholders for these settings
   - You can add Azure AI resources to your Bicep templates

4. **Uncomment the AI code** in `function_app.py`:
   - The chat endpoint has commented code showing how to integrate with Azure AI
   - Uncomment and customize based on your needs

## 📦 Project Structure

```
vincent/
├── azure.yaml              # azd configuration (updated with 'api' service)
├── infra/
│   ├── main.bicep         # Main infrastructure (updated with Functions)
│   └── core/
│       ├── host/
│       │   └── functions.bicep
│       ├── storage/
│       │   └── storage-account.bicep  # NEW
│       └── monitor/
│           └── monitoring.bicep
└── src/
    ├── api/               # NEW - Azure Functions
    │   ├── function_app.py
    │   ├── requirements.txt
    │   ├── host.json
    │   ├── local.settings.json
    │   └── README.md
    └── web/               # Next.js frontend
        └── ...
```

## 🔗 Next Steps

1. **Deploy to Azure**:
   ```bash
   azd up
   ```

2. **Get the Function App URL**:
   ```bash
   azd env get-values | grep AZURE_FUNCTION_URI
   ```

3. **Configure Azure AI Foundry**:
   - Create an AI project in Azure Portal
   - Update environment variables
   - Test the chat endpoint

4. **Connect Frontend to API**:
   - Update your Next.js app to call the API endpoints
   - Use the Function App URL from step 2

5. **Add Database** (optional):
   - Consider adding Cosmos DB for posts persistence
   - Update the Bicep templates to include database resources

## 📝 Notes

- The Python virtual environment is already set up in `src/api/.venv`
- All dependencies are installed
- Azure Functions Core Tools is required for local testing (install with `npm install -g azure-functions-core-tools@4`)
- The infrastructure uses a Consumption (Y1) plan for cost efficiency
- Application Insights is configured for monitoring and logging

## 🆘 Troubleshooting

If `func start` doesn't work:
```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

If deployment fails:
```bash
# Check azd logs
azd deploy --debug

# Verify infrastructure
azd provision
```
