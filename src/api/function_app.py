import azure.functions as func
import logging
import json
import os
from datetime import datetime
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Initialize Azure AI client
def get_ai_client():
    """Initialize and return Azure OpenAI client"""
    endpoint = os.environ.get("AZURE_AI_ENDPOINT")
    
    if not endpoint:
        logging.warning("AZURE_AI_ENDPOINT not configured")
        return None
    
    try:
        # Use Managed Identity for authentication
        credential = DefaultAzureCredential()
        token_provider = get_bearer_token_provider(
            credential,
            "https://cognitiveservices.azure.com/.default"
        )
        
        client = AzureOpenAI(
            azure_endpoint=endpoint,
            azure_ad_token_provider=token_provider,
            api_version="2024-10-21"
        )
        return client
    except Exception as e:
        logging.error(f"Failed to create Azure OpenAI client: {e}")
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
        
        # Try to use Azure AI Foundry
        client = get_ai_client()
        if client:
            try:
                deployment_name = os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o")
                logging.info(f"Calling Azure OpenAI with deployment: {deployment_name}")
                
                completion = client.chat.completions.create(
                    model=deployment_name,
                    messages=[
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.7,
                    max_tokens=800
                )
                
                ai_response = completion.choices[0].message.content
                
                response_data = {
                    "conversation_id": conversation_id,
                    "message": user_message,
                    "response": ai_response,
                    "timestamp": datetime.utcnow().isoformat(),
                    "model": deployment_name
                }
            except Exception as ai_error:
                logging.error(f"Azure AI error: {ai_error}")
                response_data = {
                    "conversation_id": conversation_id,
                    "message": user_message,
                    "response": f"AI service error: {str(ai_error)}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": True
                }
        else:
            # Fallback if AI client not configured
            response_data = {
                "conversation_id": conversation_id,
                "message": user_message,
                "response": "Azure AI Foundry is not configured. Set AZURE_AI_ENDPOINT environment variable.",
                "timestamp": datetime.utcnow().isoformat(),
                "configured": False
            }
        
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
