# Azure Functions API

This is a Python-based Azure Functions project with Azure AI Foundry integration.

## Endpoints

### Chat API
- **POST** `/api/chat`
- Chat endpoint for AI-powered conversations
- Request body:
  ```json
  {
    "message": "Your message here",
    "conversation_id": "optional-conversation-id"
  }
  ```

### Posts API
- **GET** `/api/posts` - List all posts
- **POST** `/api/posts` - Create a new post
- Request body for POST:
  ```json
  {
    "title": "Post Title",
    "content": "Post content here",
    "author": "Author Name"
  }
  ```

### Health Check
- **GET** `/api/health` - Health check endpoint

## Setup

### 1. Create a virtual environment
```bash
cd src/api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Azure AI Foundry
Update `local.settings.json` with your Azure AI credentials:
```json
{
  "Values": {
    "AZURE_AI_ENDPOINT": "https://your-ai-endpoint.cognitiveservices.azure.com/",
    "AZURE_AI_PROJECT_NAME": "your-project-name",
    "AZURE_AI_DEPLOYMENT_NAME": "your-deployment-name"
  }
}
```

### 4. Run locally
```bash
func start
```

The API will be available at `http://localhost:7071/api/`

## Deployment

This project is configured to work with Azure Developer CLI (azd).

To deploy:
```bash
azd up
```

## Development

- **Python Version**: 3.9+ recommended
- **Azure Functions Runtime**: v4
- **Programming Model**: v2 (decorator-based)

## Next Steps

1. Configure Azure AI Foundry connection
2. Add database integration for posts persistence
3. Implement authentication/authorization
4. Add conversation history management for chat
5. Add error handling and logging improvements
