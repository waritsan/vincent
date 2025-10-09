import azure.functions as func
import logging
import json
import os
from datetime import datetime
from azure.ai.inference import ChatCompletionsClient
from azure.identity import DefaultAzureCredential
from azure.core.credentials import AzureKeyCredential

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Initialize Azure AI client
def get_ai_client():
    """Initialize and return Azure AI Inference client"""
    endpoint = os.environ.get("AZURE_AI_ENDPOINT")
    
    # Use DefaultAzureCredential for production, or AzureKeyCredential for development
    try:
        credential = DefaultAzureCredential()
        return ChatCompletionsClient(endpoint=endpoint, credential=credential)
    except Exception as e:
        logging.warning(f"Failed to use DefaultAzureCredential: {e}")
        return None

@app.route(route="chat", methods=["POST"])
def chat(req: func.HttpRequest) -> func.HttpResponse:
    """
    Chat endpoint for AI-powered conversations
    POST /api/chat
    Body: { "message": "user message", "conversation_id": "optional" }
    """
    logging.info('Processing chat request')
    
    try:
        # Parse request body
        req_body = req.get_json()
        user_message = req_body.get('message')
        conversation_id = req_body.get('conversation_id', 'default')
        
        if not user_message:
            return func.HttpResponse(
                json.dumps({"error": "Message is required"}),
                mimetype="application/json",
                status_code=400
            )
        
        # TODO: Integrate with Azure AI Foundry
        # For now, return a mock response
        response_data = {
            "conversation_id": conversation_id,
            "message": user_message,
            "response": "This is a placeholder response. Configure AZURE_AI_ENDPOINT to enable AI features.",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Example of how to use Azure AI client when configured:
        # client = get_ai_client()
        # if client:
        #     response = client.complete(
        #         messages=[{"role": "user", "content": user_message}],
        #         model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME")
        #     )
        #     response_data["response"] = response.choices[0].message.content
        
        return func.HttpResponse(
            json.dumps(response_data),
            mimetype="application/json",
            status_code=200
        )
        
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON in request body"}),
            mimetype="application/json",
            status_code=400
        )
    except Exception as e:
        logging.error(f"Error processing chat request: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            mimetype="application/json",
            status_code=500
        )


@app.route(route="posts", methods=["GET", "POST"])
def posts(req: func.HttpRequest) -> func.HttpResponse:
    """
    Posts endpoint for managing blog posts or content
    GET /api/posts - List all posts
    POST /api/posts - Create a new post
    Body: { "title": "Post title", "content": "Post content", "author": "Author name" }
    """
    logging.info(f'Processing {req.method} request for posts')
    
    try:
        if req.method == "GET":
            # TODO: Fetch posts from database
            # For now, return mock data
            posts_data = {
                "posts": [
                    {
                        "id": "1",
                        "title": "Sample Post 1",
                        "content": "This is a sample post",
                        "author": "System",
                        "created_at": "2025-10-09T00:00:00Z"
                    },
                    {
                        "id": "2",
                        "title": "Sample Post 2",
                        "content": "Another sample post",
                        "author": "System",
                        "created_at": "2025-10-09T01:00:00Z"
                    }
                ],
                "total": 2
            }
            
            return func.HttpResponse(
                json.dumps(posts_data),
                mimetype="application/json",
                status_code=200
            )
        
        elif req.method == "POST":
            # Parse request body
            req_body = req.get_json()
            title = req_body.get('title')
            content = req_body.get('content')
            author = req_body.get('author', 'Anonymous')
            
            if not title or not content:
                return func.HttpResponse(
                    json.dumps({"error": "Title and content are required"}),
                    mimetype="application/json",
                    status_code=400
                )
            
            # TODO: Save to database
            # For now, return the created post
            new_post = {
                "id": "new-id",
                "title": title,
                "content": content,
                "author": author,
                "created_at": datetime.utcnow().isoformat()
            }
            
            return func.HttpResponse(
                json.dumps(new_post),
                mimetype="application/json",
                status_code=201
            )
            
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON in request body"}),
            mimetype="application/json",
            status_code=400
        )
    except Exception as e:
        logging.error(f"Error processing posts request: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            mimetype="application/json",
            status_code=500
        )


@app.route(route="health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint"""
    return func.HttpResponse(
        json.dumps({"status": "healthy", "version": "1.0.0"}),
        mimetype="application/json",
        status_code=200
    )
