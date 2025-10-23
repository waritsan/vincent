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
                        stream_chunks.append(f"data: {json.dumps({'type': 'done', 'full_response': ai_response, 'timestamp': datetime.utcnow().isoformat()})}\n\n")
                        
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
                        "timestamp": datetime.utcnow().isoformat(),
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
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": True
                }
        else:
            # Fallback if AI agent not configured
            logging.error("AI Agent not available - check environment variables and logs above")
            response_data = {
                "conversation_id": conversation_id,
                "message": user_message,
                "response": "Azure AI Agent is not configured. Please set AZURE_AI_AGENT_ID environment variable after creating an agent manually in Azure AI Foundry.",
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
            author_avatar = req_body.get('author_avatar', '')
            video_url = req_body.get('video_url', '')
            thumbnail_url = req_body.get('thumbnail_url', '')
            tags = req_body.get('tags', [])
            
            if not title or not content:
                return create_response({"error": "Title and content are required"}, 400)
            
            # Create new post
            new_post = {
                "id": str(uuid.uuid4()),
                "title": title,
                "content": content,
                "author": author,
                "author_avatar": author_avatar,
                "video_url": video_url,
                "thumbnail_url": thumbnail_url,
                "tags": tags if isinstance(tags, list) else [],
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
            existing_post['updated_at'] = datetime.utcnow().isoformat()
            
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


@app.route(route="news/fetch", methods=["GET"])
def fetch_news(req: func.HttpRequest) -> func.HttpResponse:
    """
    Fetch news from DBD website and return as posts
    GET /api/news/fetch?limit=10&save=false
    """
    logging.info('Processing news fetch request')
    
    try:
        from news_scraper import fetch_news_as_posts
        
        # Get query parameters
        limit = int(req.params.get('limit', '10'))
        save_to_db = req.params.get('save', 'false').lower() == 'true'
        
        # Fetch news
        news_posts = fetch_news_as_posts(limit)
        
        if not news_posts:
            return create_response({"error": "Failed to fetch news", "posts": []}, 500)
        
        # Optionally save to database
        saved_posts = []
        if save_to_db:
            container = get_cosmos_container()
            if container:
                for post in news_posts:
                    try:
                        # Add required fields
                        post['id'] = str(uuid.uuid4())
                        post['created_at'] = datetime.utcnow().isoformat()
                        post['updated_at'] = datetime.utcnow().isoformat()
                        
                        # Save to Cosmos DB
                        created_item = container.create_item(body=post)
                        saved_posts.append(created_item)
                    except Exception as e:
                        logging.error(f"Error saving post: {e}")
                        continue
                
                return create_response({
                    "message": f"Fetched and saved {len(saved_posts)} news articles",
                    "posts": saved_posts,
                    "total": len(saved_posts)
                })
        
        # Return without saving
        return create_response({
            "message": f"Fetched {len(news_posts)} news articles",
            "posts": news_posts,
            "total": len(news_posts)
        })
        
    except ImportError as e:
        logging.error(f"Failed to import news_scraper: {e}")
        return create_response({"error": "News scraper not available"}, 503)
    except Exception as e:
        logging.error(f"Error fetching news: {e}")
        return create_response({"error": str(e)}, 500)


@app.route(route="health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint"""
    return create_response({"status": "healthy", "version": "1.0.0"})
