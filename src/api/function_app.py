import azure.functions as func
import logging
import json
import os
import uuid
from datetime import datetime, timezone
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.cosmos import CosmosClient, exceptions
from azure.ai.projects import AIProjectClient
from text_extraction import extract_companies_and_locations
from news_scraper import get_content_from_blob
from ai_utils import generate_ai_tags

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# CORS headers for cross-origin requests
# Allow specific origins in production, all origins in development
allowed_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "*").split(",")
CORS_HEADERS = {
    'Access-Control-Allow-Origin': allowed_origins[0] if len(allowed_origins) == 1 else "*",
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true' if len(allowed_origins) == 1 else 'false'
}

def create_response(body, status_code=200):
    """Helper function to create HTTP response with CORS headers"""
    return func.HttpResponse(
        body=json.dumps(body) if isinstance(body, dict) else body,
        mimetype="application/json",
        status_code=status_code,
        headers=CORS_HEADERS
    )


# Initialize Cosmos DB client
def get_cosmos_container():
    """Initialize and return Cosmos DB container client"""
    connection_string = os.environ.get("AZURE_COSMOS_CONNECTION_STRING")
    endpoint = os.environ.get("AZURE_COSMOS_ENDPOINT")
    database_name = os.environ.get("AZURE_COSMOS_DATABASE_NAME", "blogdb")
    container_name = "posts"
    
    # Prefer connection string for local development, endpoint for production
    if connection_string:
        logging.info("Using Cosmos DB connection string")
        try:
            client = CosmosClient.from_connection_string(connection_string)
            database = client.get_database_client(database_name)
            container = database.get_container_client(container_name)
            return container
        except Exception as e:
            logging.error(f"Failed to create Cosmos DB client from connection string: {e}")
            return None
    elif endpoint:
        logging.info("Using Cosmos DB endpoint with Managed Identity")
        try:
            # Use Managed Identity for authentication
            credential = DefaultAzureCredential()
            client = CosmosClient(endpoint, credential=credential)
            database = client.get_database_client(database_name)
            container = database.get_container_client(container_name)
            return container
        except Exception as e:
            logging.error(f"Failed to create Cosmos DB client with Managed Identity: {e}")
            return None
    else:
        logging.warning("Neither AZURE_COSMOS_CONNECTION_STRING nor AZURE_COSMOS_ENDPOINT configured")
        return None

# Initialize Azure AI Agent client
def get_ai_agent():
    """Initialize and return Azure AI Agent"""
    ai_endpoint = os.environ.get("AZURE_AI_ENDPOINT")
    project_name = os.environ.get("AZURE_AI_PROJECT_NAME", "project-ja67jva7pfqfc")
    agent_id = os.environ.get("AZURE_AI_AGENT_ID")
    
    logging.info(f"AI Endpoint: {ai_endpoint}")
    logging.info(f"Project Name: {project_name}")
    logging.info(f"Agent ID: {agent_id}")
    
    if not ai_endpoint:
        logging.warning("AZURE_AI_ENDPOINT not configured")
        return None, None
        
    if not agent_id:
        logging.warning("AZURE_AI_AGENT_ID not configured - agent must be created manually first")
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

@app.route(route="health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    """
    Health check endpoint
    GET /api/health
    """
    logging.info('Processing health check request')
    
    try:
        # Basic health check
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "services": {}
        }
        
        # Check Cosmos DB connection
        try:
            container = get_cosmos_container()
            if container:
                health_status["services"]["cosmos_db"] = "connected"
            else:
                health_status["services"]["cosmos_db"] = "not_configured"
        except Exception as e:
            health_status["services"]["cosmos_db"] = f"error: {str(e)}"
        
        # Check AI services
        try:
            project_client, agent = get_ai_agent()
            if project_client and agent:
                health_status["services"]["ai_agent"] = "configured"
            else:
                health_status["services"]["ai_agent"] = "not_configured"
        except Exception as e:
            health_status["services"]["ai_agent"] = f"error: {str(e)}"
        
        return create_response(health_status)
        
    except Exception as e:
        logging.error(f"Error processing health check: {e}")
        return create_response({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }, 500)

@app.route(route="chat", methods=["POST"])
def chat(req: func.HttpRequest) -> func.HttpResponse:
    """
    Chat endpoint for AI-powered conversations with streaming support
    POST /api/chat
    Body: { 
        "message": "user message", 
        "conversation_id": "optional",
        "thread_id": "optional - to continue existing conversation",
        "stream": true/false - whether to stream the response (default: true)
    }
    """
    logging.info('Processing chat request')
    
    try:
        # Parse request body
        req_body = req.get_json()
        user_message = req_body.get('message')
        conversation_id = req_body.get('conversation_id', str(uuid.uuid4()))
        thread_id = req_body.get('thread_id')  # For continuing existing conversations
        stream = req_body.get('stream', True)  # Default to streaming
        
        if not user_message:
            return create_response({"error": "Message is required"}, 400)
        
        # Try to use Azure AI Agent
        project_client, agent = get_ai_agent()
        if project_client and agent:
            try:
                logging.info(f"Using Azure AI Agent: {agent.id}")
                
                # Use existing thread or create new one
                if thread_id:
                    logging.info(f"Continuing conversation with thread: {thread_id}")
                    # Verify thread exists by trying to add message
                    try:
                        # Add the user message to existing thread
                        message = project_client.agents.messages.create(
                            thread_id=thread_id,
                            role="user",
                            content=user_message
                        )
                        logging.info(f"Message added to existing thread: {thread_id}")
                    except Exception as thread_error:
                        logging.warning(f"Failed to use existing thread {thread_id}: {thread_error}")
                        # Create new thread if existing one fails
                        thread = project_client.agents.threads.create()
                        thread_id = thread.id
                        logging.info(f"Created new thread: {thread_id}")
                        
                        # Add the user message to new thread
                        message = project_client.agents.messages.create(
                            thread_id=thread_id,
                            role="user",
                            content=user_message
                        )
                else:
                    # Create a new thread for new conversation
                    thread = project_client.agents.threads.create()
                    thread_id = thread.id
                    logging.info(f"Created new thread: {thread_id}")
                    
                    # Add the user message to the thread
                    message = project_client.agents.messages.create(
                        thread_id=thread_id,
                        role="user",
                        content=user_message
                    )
                    logging.info(f"Message added to new thread")
                
                # NOTE: Azure Functions (Consumption Plan) doesn't support true HTTP streaming
                # We use non-streaming API but format the response as SSE for client-side simulated streaming
                if stream:
                    try:
                        # Use non-streaming API (faster than collecting streaming chunks)
                        run = project_client.agents.runs.create_and_process(
                            thread_id=thread_id,
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
                            thread_id=thread_id,
                            order=ListSortOrder.ASCENDING
                        )
                        
                        # Get the latest assistant message
                        ai_response = None
                        for msg in messages:
                            if msg.role == "assistant" and msg.text_messages:
                                ai_response = msg.text_messages[-1].text.value
                        
                        if not ai_response:
                            ai_response = "No response from agent"
                        
                        # Build SSE-formatted response with simulated chunks for client-side streaming
                        stream_chunks = []
                        
                        # Send initial metadata
                        stream_chunks.append(f"data: {json.dumps({'type': 'metadata', 'conversation_id': conversation_id, 'thread_id': thread_id})}\n\n")
                        
                        # Split response into words for client-side simulated streaming
                        words = ai_response.split(' ')
                        for i, word in enumerate(words):
                            chunk = word + (' ' if i < len(words) - 1 else '')
                            stream_chunks.append(f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n")
                        
                        # Send completion signal
                        stream_chunks.append(f"data: {json.dumps({'type': 'done', 'full_response': ai_response, 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n")
                        
                        # Return streaming response as concatenated string
                        return func.HttpResponse(
                            ''.join(stream_chunks),
                            mimetype="text/event-stream",
                            headers={
                                **CORS_HEADERS,
                                'Cache-Control': 'no-cache',
                                'X-Accel-Buffering': 'no'
                            }
                        )
                        
                    except Exception as stream_error:
                        logging.error(f"Streaming error: {stream_error}", exc_info=True)
                        error_response = f"data: {json.dumps({'type': 'error', 'error': str(stream_error)})}\n\n"
                        return func.HttpResponse(
                            error_response,
                            mimetype="text/event-stream",
                            headers={
                                **CORS_HEADERS,
                                'Cache-Control': 'no-cache',
                                'X-Accel-Buffering': 'no'
                            }
                        )
                else:
                    # Non-streaming response (original behavior)
                    run = project_client.agents.runs.create_and_process(
                        thread_id=thread_id,
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
                        thread_id=thread_id,
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
                        "thread_id": thread_id,
                        "message": user_message,
                        "response": ai_response,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "agent_id": agent.id,
                        "is_new_conversation": thread_id == (thread.id if 'thread' in locals() else None)
                    }
                    return create_response(response_data)
                    
            except Exception as ai_error:
                logging.error(f"Azure AI Agent error: {ai_error}", exc_info=True)
                response_data = {
                    "conversation_id": conversation_id,
                    "message": user_message,
                    "response": f"AI service error: {str(ai_error)}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "error": True
                }
        else:
            # Fallback if AI agent not configured
            logging.error("AI Agent not available - check environment variables and logs above")
            response_data = {
                "conversation_id": conversation_id,
                "message": user_message,
                "response": "Azure AI Agent is not configured. Please set AZURE_AI_AGENT_ID environment variable after creating an agent manually in Azure AI Foundry.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "configured": False
            }
        
        return create_response(response_data)
        
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return create_response({"error": "Invalid JSON in request body"}, 400)
    except Exception as e:
        logging.error(f"Error processing chat request: {e}")
        return create_response({"error": "Internal server error"}, 500)


@app.route(route="chat/history", methods=["GET"])
def get_chat_history(req: func.HttpRequest) -> func.HttpResponse:
    """
    Get chat history for a specific thread
    GET /api/chat/history?thread_id=<thread_id>
    """
    logging.info('Processing chat history request')
    
    try:
        # Get thread_id from query parameters
        thread_id = req.params.get('thread_id')
        
        if not thread_id:
            return create_response({"error": "thread_id parameter is required"}, 400)
        
        # Get AI project client
        ai_endpoint = os.environ.get("AZURE_AI_ENDPOINT")
        project_name = os.environ.get("AZURE_AI_PROJECT_NAME")
        
        if not ai_endpoint or not project_name:
            return create_response({"error": "AI Foundry not configured"}, 400)
        
        try:
            # Construct the project endpoint
            base_endpoint = ai_endpoint.replace(".cognitiveservices.azure.com", ".services.ai.azure.com")
            project_endpoint = f"{base_endpoint}/api/projects/{project_name}"
            
            # Use Managed Identity for authentication
            credential = DefaultAzureCredential()
            project_client = AIProjectClient(
                credential=credential,
                endpoint=project_endpoint
            )
            
            # Get messages from the thread
            from azure.ai.agents.models import ListSortOrder
            messages = project_client.agents.messages.list(
                thread_id=thread_id,
                order=ListSortOrder.ASCENDING
            )
            
            # Format messages for response
            chat_history = []
            for msg in messages:
                if msg.text_messages:
                    chat_history.append({
                        "role": msg.role,
                        "content": msg.text_messages[-1].text.value,
                        "timestamp": msg.created_at.isoformat() if msg.created_at else None
                    })
            
            return create_response({
                "thread_id": thread_id,
                "messages": chat_history,
                "message_count": len(chat_history)
            })
            
        except Exception as e:
            logging.error(f"Failed to get chat history: {e}")
            return create_response({"error": f"Failed to get chat history: {str(e)}"}, 500)
        
    except Exception as e:
        logging.error(f"Error processing chat history request: {e}")
        return create_response({"error": "Internal server error"}, 500)


@app.route(route="agent/create", methods=["POST"])
def create_agent(req: func.HttpRequest) -> func.HttpResponse:
    """
    Create a new AI agent
    POST /api/agent/create
    Body: { "name": "agent name", "instructions": "system instructions", "model": "gpt-4o" }
    """
    logging.info('Processing agent creation request')
    
    try:
        # Parse request body
        req_body = req.get_json()
        agent_name = req_body.get('name', 'Default Agent')
        instructions = req_body.get('instructions', 'You are a helpful assistant.')
        model = req_body.get('model', 'gpt-4o')
        
        # Get AI project client
        ai_endpoint = os.environ.get("AZURE_AI_ENDPOINT")
        project_name = os.environ.get("AZURE_AI_PROJECT_NAME")
        
        if not ai_endpoint or not project_name:
            return create_response({"error": "AI Foundry not configured"}, 400)
        
        try:
            # Construct the project endpoint
            base_endpoint = ai_endpoint.replace(".cognitiveservices.azure.com", ".services.ai.azure.com")
            project_endpoint = f"{base_endpoint}/api/projects/{project_name}"
            
            # Use Managed Identity for authentication
            credential = DefaultAzureCredential()
            project_client = AIProjectClient(
                credential=credential,
                endpoint=project_endpoint
            )
            
            # Create the agent
            from azure.ai.agents.models import Agent
            agent = project_client.agents.create_agent(
                model=model,
                name=agent_name,
                instructions=instructions
            )
            
            logging.info(f"Agent created successfully: {agent.id}")
            
            # Optionally update the Function App setting with the new agent ID
            return create_response({
                "agent_id": agent.id,
                "name": agent.name,
                "instructions": agent.instructions,
                "model": agent.model,
                "message": f"Agent created successfully. Set AZURE_AI_AGENT_ID={agent.id} in Function App settings to use this agent."
            })
            
        except Exception as e:
            logging.error(f"Failed to create agent: {e}")
            return create_response({"error": f"Agent creation failed: {str(e)}"}, 500)
        
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return create_response({"error": "Invalid JSON in request body"}, 400)
    except Exception as e:
        logging.error(f"Error processing agent creation request: {e}")
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
                            "created_at": "2025-10-09T00:00:00Z",
                            "video_url": "",
                            "tags": ["healthcare", "benefits"]
                        },
                        {
                            "id": "2",
                            "title": "Sample Post 2",
                            "content": "Another sample post",
                            "author": "System",
                            "created_at": "2025-10-09T01:00:00Z",
                            "video_url": "",
                            "tags": ["education", "support"]
                        },
                        {
                            "id": "3",
                            "title": "Test Video Post",
                            "content": "This post has a video! Click to watch.",
                            "author": "System",
                            "created_at": "2025-10-20T10:00:00Z",
                            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                            "tags": ["housing", "healthcare"]
                        }
                    ],
                    "total": 3,
                    "source": "mock"
                }
                return create_response(posts_data)
            
            # Fetch posts from Cosmos DB
            try:
                # First try to get all posts and sort in Python
                # (Cosmos DB requires composite index for multi-field ORDER BY)
                query = "SELECT * FROM c"
                items = list(container.query_items(
                    query=query,
                    enable_cross_partition_query=True
                ))
                
                # Sort posts by created_at DESC (latest to oldest)
                def sort_key(post):
                    return post.get('created_at', '1970-01-01T00:00:00Z')
                
                items.sort(key=sort_key, reverse=True)
                
                # Retrieve full content from blob storage if needed
                for post in items:
                    if post.get('content_storage') == 'blob' and post.get('content_blob_url'):
                        full_content = get_content_from_blob(post['content_blob_url'])
                        if full_content:
                            post['content'] = full_content
                            logging.debug(f"Retrieved full content from blob for post: {post.get('title', '')[:50]}...")
                        else:
                            logging.warning(f"Failed to retrieve content from blob for post: {post.get('id')}")
                
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
            author_avatar = req_body.get('author_avatar', '')
            video_url = req_body.get('video_url', '')
            thumbnail_url = req_body.get('thumbnail_url', '')
            tags = req_body.get('tags', [])
            
            if not title or not content:
                return create_response({"error": "Title and content are required"}, 400)
            

            # Use provided created_at if present and valid, else use current UTC time
            created_at = req_body.get('created_at')
            try:
                # Try to parse to ensure it's a valid date
                if created_at:
                    # Accept as string, optionally validate/parse
                    datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                else:
                    created_at = datetime.now(timezone.utc).isoformat()
            except Exception:
                created_at = datetime.now(timezone.utc).isoformat()

            new_post = {
                "id": str(uuid.uuid4()),
                "title": title,
                "content": content,
                "author": author,
                "author_avatar": author_avatar,
                "video_url": video_url,
                "thumbnail_url": thumbnail_url,
                "tags": tags if isinstance(tags, list) else [],
                "created_at": created_at,
                "updated_at": datetime.now(timezone.utc).isoformat()
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


@app.route(route="posts/{id}", methods=["PUT"])
def update_post(req: func.HttpRequest) -> func.HttpResponse:
    """
    Update a post by ID
    PUT /api/posts/{id}
    Body: { "title": "Updated title", "content": "Updated content", "author": "Author name" }
    """
    post_id = req.route_params.get('id')
    logging.info(f'Processing PUT request for post {post_id}')
    
    try:
        # Parse request body
        req_body = req.get_json()
        title = req_body.get('title')
        content = req_body.get('content')
        author = req_body.get('author')
        author_avatar = req_body.get('author_avatar', '')
        video_url = req_body.get('video_url', '')
        thumbnail_url = req_body.get('thumbnail_url', '')
        tags = req_body.get('tags', [])
        
        if not title or not content:
            return create_response({"error": "Title and content are required"}, 400)
        
        # Get Cosmos DB container
        container = get_cosmos_container()
        
        if not container:
            return create_response({"error": "Database not configured"}, 503)
        
        try:
            # Read the existing post
            existing_post = container.read_item(item=post_id, partition_key=post_id)
            
            # Update the post

            existing_post['title'] = title
            existing_post['content'] = content
            existing_post['author'] = author
            existing_post['author_avatar'] = author_avatar
            existing_post['video_url'] = video_url
            existing_post['thumbnail_url'] = thumbnail_url
            existing_post['tags'] = tags if isinstance(tags, list) else []
            # If a new created_at is provided and different, update only created_at; always update updated_at to now
            created_at = req_body.get('created_at')
            if created_at and created_at != existing_post.get('created_at'):
                try:
                    # Validate ISO format
                    datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    existing_post['created_at'] = created_at
                except Exception:
                    pass  # Ignore invalid date, keep existing
            existing_post['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            # Replace the item in Cosmos DB
            updated_item = container.replace_item(
                item=existing_post,
                body=existing_post
            )
            
            logging.info(f"Post {post_id} updated successfully")
            return create_response(updated_item)
            
        except exceptions.CosmosResourceNotFoundError:
            logging.error(f"Post {post_id} not found")
            return create_response({"error": "Post not found"}, 404)
        except exceptions.CosmosHttpResponseError as e:
            logging.error(f"Cosmos DB update error: {e}")
            return create_response({"error": f"Database error: {str(e)}"}, 500)
            
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return create_response({"error": "Invalid JSON in request body"}, 400)
    except Exception as e:
        logging.error(f"Error processing update request: {e}")
        return create_response({"error": "Internal server error"}, 500)


@app.route(route="posts/{id}", methods=["DELETE"])
def delete_post(req: func.HttpRequest) -> func.HttpResponse:
    """
    Delete a post by ID
    DELETE /api/posts/{id}
    """
    post_id = req.route_params.get('id')
    logging.info(f'Processing DELETE request for post {post_id}')
    
    try:
        # Get Cosmos DB container
        container = get_cosmos_container()
        
        if not container:
            return create_response({"error": "Database not configured"}, 503)
        
        try:
            # Delete the post
            container.delete_item(item=post_id, partition_key=post_id)
            
            logging.info(f"Post {post_id} deleted successfully")
            return create_response({
                "message": "Post deleted successfully",
                "id": post_id
            })
            
        except exceptions.CosmosResourceNotFoundError:
            logging.error(f"Post {post_id} not found")
            return create_response({"error": "Post not found"}, 404)
        except exceptions.CosmosHttpResponseError as e:
            logging.error(f"Cosmos DB delete error: {e}")
            return create_response({"error": f"Database error: {str(e)}"}, 500)
            
    except Exception as e:
        logging.error(f"Error processing delete request: {e}")
        return create_response({"error": "Internal server error"}, 500)


@app.route(route="posts/from-url", methods=["POST", "OPTIONS"])
def create_post_from_url(req: func.HttpRequest) -> func.HttpResponse:
    """
    Create a post from a URL by fetching metadata and content
    Supports Open Graph, Twitter Cards, and meta tags extraction
    """
    logging.info('Processing request to create post from URL')
    
    # Handle CORS preflight
    if req.method == "OPTIONS":
        return func.HttpResponse(status_code=200, headers=CORS_HEADERS)
    
    try:
        import requests
        from bs4 import BeautifulSoup
        from urllib.parse import urljoin, urlparse
        
        req_body = req.get_json()
        url = req_body.get('url')
        tags = req_body.get('tags', [])
        author_override = req_body.get('author')
        embed_type = req_body.get('embed_type', 'preview')  # preview, iframe, or screenshot
        
        if not url:
            return create_response({"error": "URL is required"}, 400)
        
        # Validate URL
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return create_response({"error": "Invalid URL format"}, 400)
        except Exception:
            return create_response({"error": "Invalid URL"}, 400)
        
        # Special handling for DBD website (uses JavaScript rendering, but has API)
        if 'dbd.go.th' in parsed.netloc and '/news/' in parsed.path:
            try:
                from news_scraper import fetch_dbd_article_by_slug
                
                # Extract slug from URL (e.g., /news/1924102568 -> 1924102568)
                slug = parsed.path.split('/news/')[-1].strip('/')
                
                if slug:
                    logging.info(f"Detected DBD article URL, using API scraper for slug: {slug}")
                    article = fetch_dbd_article_by_slug(slug)
                    
                    if article:
                        # Use article data from API
                        title = article['title']
                        content = article['content'][:300] + ('...' if len(article['content']) > 300 else '')
                        image_url = article.get('image_url')
                        site_name = article['source']
                        publish_date = article.get('created_at')
                        author_avatar = 'https://www.dbd.go.th/images/Logo100.png'
                        
                        # Estimate reading time
                        word_count = len(article['content'].split())
                        reading_time_minutes = max(1, word_count // 200)
                        
                        # Create post with DBD tags
                        container = get_cosmos_container()
                        if not container:
                            return create_response({"error": "Database not available"}, 503)
                        
                        post_id = str(uuid.uuid4())
                        post_data = {
                            'id': post_id,
                            'title': title[:500],
                            'content': content,
                            'author': site_name,
                            'author_avatar': author_avatar,
                            'thumbnail_url': image_url,
                            'video_url': None,
                            'source_url': url,
                            'source': parsed.netloc,
                            'embed_type': 'preview',
                            'iframe_allowed': False,
                            'post_type': 'shared',
                            'tags': list(set((tags if isinstance(tags, list) else []) + ['DBD', 'กรมพัฒนาธุรกิจการค้า', 'ข่าวประชาสัมพันธ์'])),
                            'reading_time_minutes': reading_time_minutes,
                            'created_at': publish_date or datetime.now(timezone.utc).isoformat(),
                            'updated_at': datetime.now(timezone.utc).isoformat(),
                        }
                        
                        created_item = container.create_item(body=post_data)
                        logging.info(f"Created DBD post from API: {post_id}")
                        
                        return create_response({
                            "message": "Post created successfully from DBD API",
                            "post": created_item,
                            "iframe_allowed": False,
                            "embed_type": "preview",
                            "extraction_notes": None
                        }, 201)
                    else:
                        logging.warning(f"DBD article not found in API, falling back to HTML scraping")
            except Exception as e:
                logging.error(f"Error using DBD API scraper: {e}, falling back to HTML scraping")
        
        # Standard HTML scraping for other sites
        # Fetch the webpage
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; VincentBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
            response.raise_for_status()
            response.encoding = response.apparent_encoding or 'utf-8'
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching URL: {e}")
            return create_response({"error": f"Failed to fetch URL: {str(e)}"}, 400)
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract metadata with fallbacks
        def get_meta_content(names):
            """Try multiple meta tag names and return first found"""
            for name in names:
                # Try property attribute (Open Graph)
                tag = soup.find('meta', property=name)
                if tag and tag.get('content'):
                    return tag.get('content').strip()
                # Try name attribute (Twitter, standard)
                tag = soup.find('meta', attrs={'name': name})
                if tag and tag.get('content'):
                    return tag.get('content').strip()
            return None
        
        # Extract title
        title = (
            get_meta_content(['og:title', 'twitter:title']) or
            (soup.find('title').get_text().strip() if soup.find('title') else None) or
            (soup.find('h1').get_text().strip() if soup.find('h1') else None) or
            (soup.find('h2').get_text().strip() if soup.find('h2') else None)
        )
        
        # Clean up title if it's generic or includes site name repetitively
        if title:
            # Remove common patterns like "Site Name | Page Title" or "Page Title - Site Name"
            for sep in [' | ', ' - ', ' – ', ' : ']:
                if sep in title:
                    parts = title.split(sep)
                    # Take the longest part (usually the actual title)
                    title = max(parts, key=len).strip()
                    break
        
        # If still no good title, use domain + ID or last path segment
        if not title or len(title) < 3:
            # Use the site name + article ID for reference
            article_id = parsed.path.split('/')[-1] if parsed.path.split('/')[-1] else 'article'
            title = f'{parsed.netloc.replace("www.", "").replace(".go.th", "").replace(".com", "").upper()} Article #{article_id}'
        
        # Extract description
        description = (
            get_meta_content(['og:description', 'twitter:description', 'description']) or
            ''
        )
        
        # Extract image
        image_url = get_meta_content(['og:image', 'twitter:image', 'twitter:image:src'])
        if image_url and not image_url.startswith('http'):
            image_url = urljoin(url, image_url)
        
        # Fallback: Find first large image if no OG image
        if not image_url:
            for img in soup.find_all('img'):
                src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                if src:
                    # Skip small images (icons, logos, avatars)
                    width = img.get('width', '')
                    height = img.get('height', '')
                    
                    # Skip if dimensions indicate small image
                    if width and str(width).isdigit() and int(width) < 200:
                        continue
                    if height and str(height).isdigit() and int(height) < 200:
                        continue
                    
                    # Skip common icon/logo patterns
                    if any(pattern in src.lower() for pattern in ['logo', 'icon', 'avatar', 'profile']):
                        continue
                    
                    # Convert relative URL to absolute
                    full_url = urljoin(url, src)
                    
                    # Verify it's a valid image URL
                    if full_url.startswith('http') and any(ext in full_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                        image_url = full_url
                        break
        
        # If still no image, use a placeholder based on site domain
        if not image_url:
            # You can optionally generate a placeholder or use site favicon as fallback
            logging.info(f"No image found for {url}, will use site icon")
        
        # Extract favicon for author avatar
        author_avatar = None
        favicon = soup.find('link', rel=['icon', 'shortcut icon', 'apple-touch-icon'])
        if favicon and favicon.get('href'):
            author_avatar = urljoin(url, favicon.get('href'))
        else:
            # Fallback to /favicon.ico
            author_avatar = urljoin(url, '/favicon.ico')
        
        # Extract site name/author
        site_name = (
            get_meta_content(['og:site_name', 'twitter:site']) or
            author_override or
            parsed.netloc
        )
        
        # Extract article publish date
        publish_date = get_meta_content(['article:published_time', 'datePublished'])
        
        # Try to extract main content
        content = description
        if not content:
            # Try to find article body in various common patterns
            selectors = [
                ('article', None),
                ('main', None),
                ('div', ['content', 'post-content', 'article-content', 'entry-content', 'post-body', 'article-body', 'news-content']),
                ('section', ['content', 'article']),
            ]
            
            article = None
            for tag, classes in selectors:
                if classes:
                    article = soup.find(tag, class_=classes)
                else:
                    article = soup.find(tag)
                if article:
                    break
            
            if article:
                # Get first paragraph or first 300 characters for preview
                paragraphs = article.find_all('p')
                if paragraphs:
                    # Get first meaningful paragraph (skip empty ones)
                    for p in paragraphs:
                        text = p.get_text(strip=True)
                        if len(text) > 50:  # Skip short paragraphs
                            content = text[:300] + ('...' if len(text) > 300 else '')
                            break
                else:
                    # Fallback to plain text
                    content = article.get_text(separator=' ', strip=True)[:300] + '...'
        
        # If still no content, create a generic description
        if not content:
            content = f'Article from {site_name}. Click to read the full article on their website.'
        
        # Estimate reading time (Google News shows this)
        word_count = len(content.split()) if content else 0
        reading_time_minutes = max(1, word_count // 200)  # Average 200 words per minute
        
        # Extract keywords for auto-tagging (optional - can be enhanced with NLP)
        keywords = get_meta_content(['keywords', 'news_keywords'])
        auto_tags = []
        if keywords:
            auto_tags = [k.strip() for k in keywords.split(',')[:5]]  # First 5 keywords
        
        # Merge provided tags with auto-tags
        all_tags = list(set((tags if isinstance(tags, list) else []) + auto_tags))
        
        # Check if iframe embedding is allowed
        iframe_allowed = True
        x_frame_options = response.headers.get('X-Frame-Options', '').upper()
        csp = response.headers.get('Content-Security-Policy', '').lower()
        
        if x_frame_options in ['DENY', 'SAMEORIGIN'] or 'frame-ancestors' in csp:
            iframe_allowed = False
        
        # Determine final embed type
        final_embed_type = embed_type
        if embed_type == 'iframe' and not iframe_allowed:
            final_embed_type = 'preview'
            logging.info(f"iFrame embedding not allowed for {url}, falling back to preview")
        
        # Create post object
        container = get_cosmos_container()
        if not container:
            return create_response({"error": "Database not available"}, 503)
        
        post_id = str(uuid.uuid4())
        post_data = {
            'id': post_id,
            'title': title[:500],  # Limit title length
            'content': content[:5000] if content else description[:5000],  # Limit content length
            'author': site_name,
            'author_avatar': author_avatar,
            'thumbnail_url': image_url,
            'video_url': None,
            'source_url': response.url,  # Use final URL after redirects
            'source': parsed.netloc,
            'embed_type': final_embed_type,
            'iframe_allowed': iframe_allowed,
            'post_type': 'shared',
            'tags': all_tags,
            'reading_time_minutes': reading_time_minutes,
            'created_at': publish_date or datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
        
        # Save to Cosmos DB
        try:
            created_item = container.create_item(body=post_data)
            logging.info(f"Created post from URL: {post_id}")
            
            # Determine if extraction quality was good
            extraction_notes = []
            if not image_url:
                extraction_notes.append("No image found - site may use JavaScript rendering")
            if not content or content == f'Article from {site_name}. Click to read the full article on their website.':
                extraction_notes.append("Limited content extracted - site may use JavaScript rendering")
            
            return create_response({
                "message": "Post created successfully",
                "post": created_item,
                "iframe_allowed": iframe_allowed,
                "embed_type": final_embed_type,
                "extraction_notes": extraction_notes if extraction_notes else None
            }, 201)
            
        except exceptions.CosmosResourceExistsError:
            return create_response({"error": "Post with this ID already exists"}, 409)
        except Exception as e:
            logging.error(f"Error saving post: {e}")
            return create_response({"error": f"Failed to save post: {str(e)}"}, 500)
        
    except ImportError as e:
        logging.error(f"Missing required library: {e}")
        return create_response({"error": "Server configuration error"}, 500)
    except Exception as e:
        logging.error(f"Error creating post from URL: {e}")
        import traceback
        traceback.print_exc()
        return create_response({"error": str(e)}, 500)


@app.route(route="companies", methods=["GET"])
def get_companies(req: func.HttpRequest) -> func.HttpResponse:
    """
    Get extracted companies from CosmosDB
    GET /api/companies
    Query parameters:
    - limit: Number of companies to return (default: 10, max: 100)
    """
    logging.info('Processing companies request')
    
    try:
        # Get limit from query parameters
        limit = int(req.params.get('limit', '10'))
        limit = min(max(1, limit), 100)  # Between 1 and 100
        
        # Import the companies container function
        from text_extraction import get_companies_container
        
        container = get_companies_container()
        
        if not container:
            return create_response({"error": "Companies database not configured"}, 503)
        
        try:
            # Query individual company documents ordered by creation date (most recent first)
            query = f"SELECT * FROM c ORDER BY c.created_at DESC OFFSET 0 LIMIT {limit}"
            items = list(container.query_items(
                query=query,
                enable_cross_partition_query=True
            ))
            
            # Transform to match expected format (each item is already a company document)
            companies_data = {
                "companies": items,
                "total": len(items),
                "limit": limit,
                "source": "cosmos_db",
                "container": "company_extractions"
            }
            
            return create_response(companies_data)
            
        except exceptions.CosmosHttpResponseError as e:
            logging.error(f"Cosmos DB query error: {e}")
            return create_response({"error": f"Database error: {str(e)}"}, 500)
            
    except ValueError as e:
        return create_response({"error": "Invalid limit parameter"}, 400)
    except Exception as e:
        logging.error(f"Error processing extractions request: {e}")
        return create_response({"error": "Internal server error"}, 500)


@app.route(route="charts/generate", methods=["POST"])
def generate_chart(req: func.HttpRequest) -> func.HttpResponse:
    """
    Generate chart configuration from natural language prompts using Azure OpenAI
    POST /api/charts/generate
    Body: { "prompt": "show me top 10 companies by valuation" }
    """
    logging.info('Processing chart generation request')
    
    try:
        # Parse request body
        req_body = req.get_json()
        prompt = req_body.get('prompt')
        
        if not prompt:
            return create_response({"error": "Prompt is required"}, 400)
        
        # Get Azure OpenAI client
        ai_client = get_ai_client()
        if not ai_client:
            return create_response({"error": "Azure OpenAI not configured"}, 503)
        
        # Get companies data for context
        from text_extraction import get_companies_container
        container = get_companies_container()
        
        if not container:
            return create_response({"error": "Companies database not configured"}, 503)
        
        try:
            # Get recent companies for analysis
            query = "SELECT * FROM c ORDER BY c.created_at DESC OFFSET 0 LIMIT 100"
            companies = list(container.query_items(
                query=query,
                enable_cross_partition_query=True
            ))
            
            # Prepare context for AI
            companies_context = []
            for company in companies[:50]:  # Limit to 50 for context
                companies_context.append({
                    "name": company.get("company_name", ""),
                    "location": company.get("location", ""),
                    "valuation": company.get("asset_valuation", ""),
                    "created_at": company.get("created_at", "")
                })
            
            # Create AI prompt for chart generation
            system_prompt = """
You are an expert data analyst specializing in creating chart configurations from natural language requests.
Given a user's request and company data, generate a chart configuration in JSON format.

Available chart types: bar, line, area, pie, scatter, heatmap
Available data fields: name, location, valuation, created_at

Advanced filtering capabilities:
- Location filters: "in Bangkok", "from Chiang Mai", "companies in [location]"
- Valuation filters: "over 100 million", "under 50 million", "between 10M and 500M", "valuation > 100"
- Date filters: "from last month", "in 2024", "recent", "this year"
- Combination filters: "companies in Bangkok with valuations over 100 million baht"

Chart configuration format:
{
  "type": "chart_type",
  "title": "Chart Title",
  "data": [array of data points],
  "dataKey": "field_for_values",
  "xAxisKey": "field_for_x_axis" (optional),
  "yAxisKey": "field_for_y_axis" (optional),
  "filters": {
    "location": ["Bangkok", "Chiang Mai"], // array of locations to include
    "valuation_min": 100, // minimum valuation in millions
    "valuation_max": 500, // maximum valuation in millions
    "date_from": "2024-01-01", // ISO date string
    "date_to": "2024-12-31" // ISO date string
  },
  "aggregations": {optional aggregations}
}

Examples:
- "show top 10 companies by valuation" -> bar chart with top 10 by valuation
- "companies by location" -> bar chart grouped by location
- "timeline of extractions" -> area chart over time
- "companies in Bangkok with valuations over 100 million baht" -> filtered bar chart
- "show me companies from Chiang Mai under 50 million" -> filtered results
- "valuation distribution for companies created this year" -> filtered histogram

Return only valid JSON, no explanations.
"""
            
            user_prompt = f"""
User request: {prompt}

Available companies data (first 50):
{json.dumps(companies_context, indent=2, ensure_ascii=False)}

Generate the appropriate chart configuration.
"""
            
            # Call Azure OpenAI
            response = ai_client.chat.completions.create(
                model="gpt-4o",  # or your deployed model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=1000,
                temperature=0.1  # Low temperature for consistent results
            )
            
            # Parse the response
            chart_config_str = response.choices[0].message.content.strip()
            
            # Clean up the response (remove markdown code blocks if present)
            if chart_config_str.startswith("```json"):
                chart_config_str = chart_config_str[7:]
            if chart_config_str.endswith("```"):
                chart_config_str = chart_config_str[:-3]
            
            chart_config_str = chart_config_str.strip()
            
            try:
                chart_config = json.loads(chart_config_str)
                
                # Validate the chart configuration
                required_fields = ["type", "title", "data"]
                for field in required_fields:
                    if field not in chart_config:
                        raise ValueError(f"Missing required field: {field}")
                
                # Process the data based on the configuration
                processed_config = process_chart_data(chart_config, companies)
                
                return create_response({
                    "success": True,
                    "chart": processed_config,
                    "prompt": prompt,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
            except json.JSONDecodeError as e:
                logging.error(f"Invalid JSON from AI: {chart_config_str}")
                return create_response({"error": f"Invalid chart configuration: {str(e)}"}, 500)
            except ValueError as e:
                logging.error(f"Invalid chart config: {str(e)}")
                return create_response({"error": f"Invalid chart configuration: {str(e)}"}, 400)
                
        except Exception as e:
            logging.error(f"Database error: {e}")
            return create_response({"error": f"Database error: {str(e)}"}, 500)
        
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return create_response({"error": "Invalid JSON in request body"}, 400)
    except Exception as e:
        logging.error(f"Error processing chart generation request: {e}")
        return create_response({"error": "Internal server error"}, 500)


def process_chart_data(chart_config, companies):
    """
    Process and validate chart data based on the AI-generated configuration
    Apply filters to the data before generating chart data points
    """
    chart_type = chart_config["type"]
    data_key = chart_config.get("dataKey", "")
    x_axis_key = chart_config.get("xAxisKey", "")
    y_axis_key = chart_config.get("yAxisKey", "")
    filters = chart_config.get("filters", {})

    # Apply filters to companies data
    filtered_companies = apply_filters(companies, filters)

    # If AI provided data, use it; otherwise generate based on type
    if "data" in chart_config and chart_config["data"]:
        # Validate and clean the AI-provided data
        processed_data = []
        for item in chart_config["data"]:
            if isinstance(item, dict):
                processed_data.append(item)
        chart_config["data"] = processed_data
    else:
        # Generate data based on chart type and available fields
        if chart_type == "bar":
            if "valuation" in data_key.lower() or "top" in chart_config["title"].lower():
                # Top companies by valuation
                valuation_data = []
                for company in filtered_companies:
                    valuation_str = company.get("asset_valuation", "")
                    if valuation_str:
                        # Extract numeric value
                        import re
                        match = re.search(r'(\d+(?:\.\d+)?)', valuation_str)
                        if match:
                            value = float(match.group(1))
                            valuation_data.append({
                                "name": company.get("company_name", "")[:20] + "..." if len(company.get("company_name", "")) > 20 else company.get("company_name", ""),
                                "valuation": value,
                                "fullName": company.get("company_name", "")
                            })

                # Sort by valuation descending and take top 10
                valuation_data.sort(key=lambda x: x["valuation"], reverse=True)
                chart_config["data"] = valuation_data[:10]
                chart_config["dataKey"] = "valuation"
                chart_config["xAxisKey"] = "name"

            elif "location" in chart_config["title"].lower():
                # Companies by location
                location_counts = {}
                for company in filtered_companies:
                    location = company.get("location", "Unknown")
                    location_counts[location] = location_counts.get(location, 0) + 1

                chart_config["data"] = [
                    {"location": loc, "count": count}
                    for loc, count in sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]
                ]
                chart_config["dataKey"] = "count"
                chart_config["xAxisKey"] = "location"

        elif chart_type in ["area", "line"]:
            if "timeline" in chart_config["title"].lower() or "time" in chart_config["title"].lower():
                # Timeline data
                from collections import defaultdict
                timeline_data = defaultdict(int)

                for company in filtered_companies:
                    date_str = company.get("created_at", "")
                    if date_str:
                        # Extract date part
                        date = date_str.split("T")[0]
                        timeline_data[date] += 1

                chart_config["data"] = [
                    {"date": date, "count": count}
                    for date, count in sorted(timeline_data.items())
                ]
                chart_config["dataKey"] = "count"
                chart_config["xAxisKey"] = "date"

        elif chart_type == "pie":
            # Pie chart for location distribution
            location_counts = {}
            for company in filtered_companies:
                location = company.get("location", "Unknown")
                location_counts[location] = location_counts.get(location, 0) + 1

            chart_config["data"] = [
                {"location": loc, "count": count}
                for loc, count in sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            ]
            chart_config["dataKey"] = "count"
            chart_config["xAxisKey"] = "location"

        elif chart_type == "scatter":
            # Scatter plot for valuation vs some other metric
            scatter_data = []
            for company in filtered_companies:
                valuation_str = company.get("asset_valuation", "")
                if valuation_str:
                    import re
                    match = re.search(r'(\d+(?:\.\d+)?)', valuation_str)
                    if match:
                        value = float(match.group(1))
                        scatter_data.append({
                            "name": company.get("company_name", "")[:15] + "..." if len(company.get("company_name", "")) > 15 else company.get("company_name", ""),
                            "valuation": value,
                            "location": company.get("location", "Unknown"),
                            "x": value,  # Use valuation as x-axis
                            "y": value  # Could be enhanced to use other metrics
                        })

            chart_config["data"] = scatter_data[:20]  # Limit for readability
            chart_config["dataKey"] = "valuation"
            chart_config["xAxisKey"] = "x"
            chart_config["yAxisKey"] = "y"

    return chart_config


def apply_filters(companies, filters):
    """
    Apply filters to the companies data
    """
    if not filters:
        return companies

    filtered_companies = companies.copy()

    # Location filter
    if "location" in filters and filters["location"]:
        locations = [loc.lower() for loc in filters["location"]]
        filtered_companies = [
            company for company in filtered_companies
            if company.get("location", "").lower() in locations
        ]

    # Valuation filters
    valuation_min = filters.get("valuation_min")
    valuation_max = filters.get("valuation_max")

    if valuation_min is not None or valuation_max is not None:
        filtered_companies = [
            company for company in filtered_companies
            if _company_matches_valuation_filter(company, valuation_min, valuation_max)
        ]

    # Date filters
    date_from = filters.get("date_from")
    date_to = filters.get("date_to")

    if date_from or date_to:
        filtered_companies = [
            company for company in filtered_companies
            if _company_matches_date_filter(company, date_from, date_to)
        ]

    return filtered_companies


def _company_matches_valuation_filter(company, min_val, max_val):
    """
    Check if company matches valuation filter
    """
    valuation_str = company.get("asset_valuation", "")
    if not valuation_str:
        return False

    import re
    match = re.search(r'(\d+(?:\.\d+)?)', valuation_str)
    if not match:
        return False

    try:
        valuation = float(match.group(1))

        if min_val is not None and valuation < min_val:
            return False
        if max_val is not None and valuation > max_val:
            return False

        return True
    except (ValueError, TypeError):
        return False


def _company_matches_date_filter(company, date_from, date_to):
    """
    Check if company matches date filter
    """
    created_at = company.get("created_at", "")
    if not created_at:
        return False

    try:
        # Extract date part if it's a full ISO string
        if "T" in created_at:
            company_date_str = created_at.split("T")[0]
        else:
            company_date_str = created_at

        from datetime import datetime
        company_date = datetime.fromisoformat(company_date_str).date()

        if date_from:
            from datetime import datetime
            filter_date_from = datetime.fromisoformat(date_from).date()
            if company_date < filter_date_from:
                return False

        if date_to:
            from datetime import datetime
            filter_date_to = datetime.fromisoformat(date_to).date()
            if company_date > filter_date_to:
                return False

        return True
    except (ValueError, TypeError):
        return False


# Scheduled timer function to auto-fetch DBD news
@app.timer_trigger(schedule="0 0 */6 * * *", arg_name="myTimer", run_on_startup=False,
              use_monitor=False) 
def scheduled_dbd_news_fetch(myTimer: func.TimerRequest) -> None:
    """
    Scheduled function to automatically fetch latest DBD news
    Runs every 6 hours (0 0 */6 * * *)
    
    Schedule format (CRON): second minute hour day month dayOfWeek
    Examples:
    - "0 0 */6 * * *"   - Every 6 hours
    - "0 0 */12 * * *"  - Every 12 hours
    - "0 0 8 * * *"     - Every day at 8:00 AM
    - "0 0 8,20 * * *"  - Every day at 8:00 AM and 8:00 PM
    """
    from scheduled_news_fetcher import fetch_and_save_dbd_news
    
    logging.info('🤖 Scheduled DBD news fetch triggered')
    
    if myTimer.past_due:
        logging.info('⏰ Timer is past due, running now')
    
    try:
        # Fetch latest 10 articles
        result = fetch_and_save_dbd_news(limit=10, keyword='')
        
        if result['success']:
            logging.info(f"✅ Automated fetch successful: {result['stats']['saved']} new articles saved")
        else:
            logging.error(f"❌ Automated fetch failed: {result['message']}")
            
    except Exception as e:
        logging.error(f"❌ Error in scheduled news fetch: {e}")


# Manual trigger endpoint for news fetching
@app.route(route="news/fetch", methods=["GET", "OPTIONS"])
def manual_news_fetch(req: func.HttpRequest) -> func.HttpResponse:
    """
    Manually trigger DBD news fetch
    Query parameters:
    - limit: Number of articles to fetch (default: 10, max: 50)
    - keyword: Optional keyword filter (e.g., 'SME', 'นอมินี')
    - save: Whether to save to database (default: true)
    """
    logging.info('Manual DBD news fetch requested')
    
    # Handle CORS preflight
    if req.method == "OPTIONS":
        return func.HttpResponse(status_code=200, headers=CORS_HEADERS)
    
    try:
        from scheduled_news_fetcher import fetch_and_save_dbd_news, scrape_dbd_news
        
        # Get parameters
        limit = int(req.params.get('limit', '10'))
        keyword = req.params.get('keyword', '')
        save = req.params.get('save', 'true').lower() == 'true'
        
        # Validate limit
        limit = min(max(1, limit), 50)  # Between 1 and 50
        
        logging.info(f"Fetching {limit} articles with keyword: '{keyword}', save: {save}")
        
        if save:
            # Fetch and save to database
            result = fetch_and_save_dbd_news(limit=limit, keyword=keyword)
            
            return create_response({
                "success": result['success'],
                "message": result['message'],
                "saved": result['stats']['saved'],
                "skipped": result['stats']['skipped'],
                "errors": result['stats']['errors'],
                "total": result['stats']['saved'] + result['stats']['skipped'],
                "timestamp": result.get('timestamp')
            })
        else:
            # Just fetch and return (preview mode)
            articles = scrape_dbd_news(limit=limit, keyword=keyword)
            
            return create_response({
                "success": True,
                "message": f"Fetched {len(articles)} articles (preview mode, not saved)",
                "total": len(articles),
                "articles": articles[:5]  # Return first 5 as preview
            })
            
    except ValueError as e:
        return create_response({"error": "Invalid parameters", "details": str(e)}, 400)
    except Exception as e:
        logging.error(f"Error in manual news fetch: {e}")
        return create_response({"error": str(e)}, 500)
