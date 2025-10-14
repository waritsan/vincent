import azure.functions as func
import logging
import json
import os
import uuid
from datetime import datetime
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.cosmos import CosmosClient, exceptions
from azure.ai.projects import AIProjectClient

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# CORS headers for local development
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

def create_response(body, status_code=200):
    """Helper function to create HTTP response with CORS headers"""
    return func.HttpResponse(
        body=json.dumps(body) if isinstance(body, dict) else body,
        mimetype="application/json",
        status_code=status_code,
        headers=CORS_HEADERS
    )

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

# Initialize Cosmos DB client
def get_cosmos_container():
    """Initialize and return Cosmos DB container client"""
    endpoint = os.environ.get("AZURE_COSMOS_ENDPOINT")
    database_name = os.environ.get("AZURE_COSMOS_DATABASE_NAME", "blogdb")
    container_name = "posts"
    
    if not endpoint:
        logging.warning("AZURE_COSMOS_ENDPOINT not configured")
        return None
    
    try:
        # Use Managed Identity for authentication
        credential = DefaultAzureCredential()
        client = CosmosClient(endpoint, credential=credential)
        database = client.get_database_client(database_name)
        container = database.get_container_client(container_name)
        return container
    except Exception as e:
        logging.error(f"Failed to create Cosmos DB client: {e}")
        return None

# Initialize Azure AI Agent client
def get_ai_agent():
    """Initialize and return Azure AI Agent"""
    ai_endpoint = os.environ.get("AZURE_AI_ENDPOINT")
    project_name = os.environ.get("AZURE_AI_PROJECT_NAME", "project-ja67jva7pfqfc")
    agent_id = os.environ.get("AZURE_AI_AGENT_ID", "asst_VF1pUCg1iH9WkKtnhbd3Lq09")
    
    logging.info(f"AI Endpoint: {ai_endpoint}")
    logging.info(f"Project Name: {project_name}")
    logging.info(f"Agent ID: {agent_id}")
    
    if not ai_endpoint:
        logging.warning("AZURE_AI_ENDPOINT not configured")
        return None, None
    
    try:
        # Construct the project endpoint
        # Format: https://{account}.services.ai.azure.com/api/projects/{project_name}
        base_endpoint = ai_endpoint.replace(".cognitiveservices.azure.com", ".services.ai.azure.com")
        project_endpoint = f"{base_endpoint}/api/projects/{project_name}"
        
        logging.info(f"Project Endpoint: {project_endpoint}")
        
        # Use Managed Identity for authentication
        credential = DefaultAzureCredential()
        project_client = AIProjectClient(
            credential=credential,
            endpoint=project_endpoint
        )
        
        logging.info("AIProjectClient created successfully")
        
        # Get the agent
        agent = project_client.agents.get_agent(agent_id)
        
        logging.info(f"Agent retrieved: {agent.id}")
        
        return project_client, agent
    except Exception as e:
        logging.error(f"Failed to create Azure AI Agent client: {e}", exc_info=True)
        return None, None

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
        conversation_id = req_body.get('conversation_id', str(uuid.uuid4()))
        
        if not user_message:
            return create_response({"error": "Message is required"}, 400)
        
        # Try to use Azure AI Agent
        project_client, agent = get_ai_agent()
        if project_client and agent:
            try:
                logging.info(f"Using Azure AI Agent: {agent.id}")
                
                # Create a thread using the correct namespace
                thread = project_client.agents.threads.create()
                logging.info(f"Thread created: {thread.id}")
                
                # Add the user message to the thread
                message = project_client.agents.messages.create(
                    thread_id=thread.id,
                    role="user",
                    content=user_message
                )
                logging.info(f"Message added to thread")
                
                # Run the agent using the runs namespace
                run = project_client.agents.runs.create_and_process(
                    thread_id=thread.id,
                    agent_id=agent.id
                )
                logging.info(f"Run completed: {run.id}, status: {run.status}")
                
                # Check for errors
                if run.status == "failed":
                    logging.error(f"Run failed: {run.last_error}")
                    raise Exception(f"Agent run failed: {run.last_error}")
                
                # Get the agent's response
                from azure.ai.agents.models import ListSortOrder
                messages = project_client.agents.messages.list(
                    thread_id=thread.id,
                    order=ListSortOrder.ASCENDING
                )
                
                # Get the latest assistant message
                ai_response = None
                for msg in messages:
                    if msg.role == "assistant" and msg.text_messages:
                        ai_response = msg.text_messages[-1].text.value
                
                if not ai_response:
                    ai_response = "No response from agent"
                
                response_data = {
                    "conversation_id": conversation_id,
                    "thread_id": thread.id,
                    "message": user_message,
                    "response": ai_response,
                    "timestamp": datetime.utcnow().isoformat(),
                    "agent_id": agent.id
                }
            except Exception as ai_error:
                logging.error(f"Azure AI Agent error: {ai_error}")
                response_data = {
                    "conversation_id": conversation_id,
                    "message": user_message,
                    "response": f"AI service error: {str(ai_error)}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": True
                }
        else:
            # Fallback if AI agent not configured
            logging.error("AI Agent not available - check environment variables and logs above")
            response_data = {
                "conversation_id": conversation_id,
                "message": user_message,
                "response": "Azure AI Agent is not configured. Check AZURE_AI_ENDPOINT, AZURE_AI_PROJECT_NAME, and AZURE_AI_AGENT_ID environment variables. See function logs for details.",
                "timestamp": datetime.utcnow().isoformat(),
                "configured": False
            }
        
        return create_response(response_data)
        
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return create_response({"error": "Invalid JSON in request body"}, 400)
    except Exception as e:
        logging.error(f"Error processing chat request: {e}")
        return create_response({"error": "Internal server error"}, 500)


@app.route(route="posts", methods=["GET", "POST"])
def posts(req: func.HttpRequest) -> func.HttpResponse:
    """
    Posts endpoint for managing blog posts
    GET /api/posts - List all posts
    POST /api/posts - Create a new post
    Body: { "title": "Post title", "content": "Post content", "author": "Author name" }
    """
    logging.info(f'Processing {req.method} request for posts')
    
    try:
        # Get Cosmos DB container
        container = get_cosmos_container()
        
        if req.method == "GET":
            if not container:
                # Fallback to mock data if Cosmos DB is not configured
                logging.warning("Cosmos DB not configured, returning mock data")
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
                    "total": 2,
                    "source": "mock"
                }
                return create_response(posts_data)
            
            # Fetch posts from Cosmos DB
            try:
                query = "SELECT * FROM c ORDER BY c.created_at DESC"
                items = list(container.query_items(
                    query=query,
                    enable_cross_partition_query=True
                ))
                
                posts_data = {
                    "posts": items,
                    "total": len(items),
                    "source": "cosmos_db"
                }
                
                return create_response(posts_data)
            except exceptions.CosmosHttpResponseError as e:
                logging.error(f"Cosmos DB query error: {e}")
                return create_response({"error": f"Database error: {str(e)}"}, 500)
        
        elif req.method == "POST":
            # Parse request body
            req_body = req.get_json()
            title = req_body.get('title')
            content = req_body.get('content')
            author = req_body.get('author', 'Anonymous')
            
            if not title or not content:
                return create_response({"error": "Title and content are required"}, 400)
            
            # Create new post
            new_post = {
                "id": str(uuid.uuid4()),
                "title": title,
                "content": content,
                "author": author,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if not container:
                # If Cosmos DB not configured, return the post without saving
                logging.warning("Cosmos DB not configured, post not saved")
                new_post["saved"] = False
                return create_response(new_post, 201)
            
            # Save to Cosmos DB
            try:
                created_item = container.create_item(body=new_post)
                created_item["saved"] = True
                return create_response(created_item, 201)
            except exceptions.CosmosHttpResponseError as e:
                logging.error(f"Cosmos DB create error: {e}")
                return create_response({"error": f"Database error: {str(e)}"}, 500)
            
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return create_response({"error": "Invalid JSON in request body"}, 400)
    except Exception as e:
        logging.error(f"Error processing posts request: {e}")
        return create_response({"error": "Internal server error"}, 500)


@app.route(route="health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint"""
    return create_response({"status": "healthy", "version": "1.0.0"})
