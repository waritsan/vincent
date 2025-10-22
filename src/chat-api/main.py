from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import logging
import os
import uuid
from datetime import datetime
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log startup time
import time
startup_time = time.time()
logger.info(f'🏁 Application starting at {startup_time}')

app = FastAPI(title="Chat API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    thread_id: Optional[str] = None
    stream: bool = True

class ChatResponse(BaseModel):
    conversation_id: str
    thread_id: str
    message: str
    response: str
    timestamp: str
    agent_id: Optional[str] = None
    is_new_conversation: Optional[bool] = None

# Initialize Azure AI Agent client
def get_ai_agent():
    """Initialize and return Azure AI Agent"""
    init_start = time.time()
    logger.info(f'⚙️  Initializing AI Agent client at {init_start - startup_time:.2f}s after startup')
    
    ai_endpoint = os.environ.get("AZURE_AI_ENDPOINT")
    project_name = os.environ.get("AZURE_AI_PROJECT_NAME", "project-ja67jva7pfqfc")
    agent_id = os.environ.get("AZURE_AI_AGENT_ID")
    
    logger.info(f"AI Endpoint: {ai_endpoint}")
    logger.info(f"Project Name: {project_name}")
    logger.info(f"Agent ID: {agent_id}")
    
    if not ai_endpoint:
        logger.warning("AZURE_AI_ENDPOINT not configured")
        return None, None
        
    if not agent_id:
        logger.warning("AZURE_AI_AGENT_ID not configured")
        return None, None
    
    try:
        # Use Managed Identity for authentication (same as Azure Functions)
        auth_start = time.time()
        credential = DefaultAzureCredential()
        logger.info(f'🔑 Credential initialized in {time.time() - auth_start:.2f}s')
        
        # Build the correct project endpoint URL
        # Convert from https://cog-xxx.cognitiveservices.azure.com/
        # To: https://cog-xxx.services.ai.azure.com/api/projects/project-name
        if 'cognitiveservices.azure.com' in ai_endpoint:
            base = ai_endpoint.replace('cognitiveservices.azure.com', 'services.ai.azure.com')
            base = base.rstrip('/')
            project_endpoint = f"{base}/api/projects/{project_name}"
        else:
            project_endpoint = ai_endpoint
        
        logger.info(f"Project Endpoint: {project_endpoint}")
        
        # Create AI Project Client using ONLY endpoint parameter (like Azure Functions)
        client_start = time.time()
        project_client = AIProjectClient(
            credential=credential,
            endpoint=project_endpoint
        )
        
        logger.info(f"✅ AIProjectClient created in {time.time() - client_start:.2f}s")
        
        # Get the agent
        agent_get_start = time.time()
        agent = project_client.agents.get_agent(agent_id)
        
        logger.info(f"✅ Agent retrieved in {time.time() - agent_get_start:.2f}s: {agent.id}")
        logger.info(f'🎯 Total AI Agent init time: {time.time() - init_start:.2f}s')
        
        return project_client, agent
    except Exception as e:
        logger.error(f"Failed to create Azure AI Agent client: {e}", exc_info=True)
        return None, None

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "chat-api",
        "version": "1.0.0"
    }

@app.get("/api/debug/env")
async def debug_env():
    """Debug endpoint to see environment variables"""
    return {
        "env_vars": {
            "AZURE_AI_ENDPOINT": os.environ.get("AZURE_AI_ENDPOINT", "NOT SET"),
            "AZURE_AI_PROJECT_NAME": os.environ.get("AZURE_AI_PROJECT_NAME", "NOT SET"),
            "AZURE_AI_AGENT_ID": os.environ.get("AZURE_AI_AGENT_ID", "NOT SET"),
            "AZURE_CLIENT_ID": os.environ.get("AZURE_CLIENT_ID", "NOT SET"),
            "AZURE_SUBSCRIPTION_ID": os.environ.get("AZURE_SUBSCRIPTION_ID", "NOT SET"),
            "AZURE_RESOURCE_GROUP_NAME": os.environ.get("AZURE_RESOURCE_GROUP_NAME", "NOT SET"),
        },
        "all_env_keys": list(os.environ.keys())
    }

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Chat endpoint with TRUE HTTP streaming support
    """
    import time
    start_time = time.time()
    logger.info(f'🚀 Chat request received at {start_time}')
    
    # Generate IDs
    conversation_id = request.conversation_id or str(uuid.uuid4())
    thread_id = request.thread_id
    
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # Get AI Agent
    agent_start = time.time()
    project_client, agent = get_ai_agent()
    logger.info(f'⚙️  AI Agent retrieved in {time.time() - agent_start:.2f}s')
    
    if not project_client or not agent:
        raise HTTPException(
            status_code=503,
            detail="Azure AI Agent is not configured. Please set AZURE_AI_AGENT_ID environment variable."
        )
    
    try:
        logger.info(f"Using Azure AI Agent: {agent.id}")
        
        # Use existing thread or create new one
        if thread_id:
            logger.info(f"Continuing conversation with thread: {thread_id}")
            try:
                # Add the user message to existing thread
                message = project_client.agents.messages.create(
                    thread_id=thread_id,
                    role="user",
                    content=request.message
                )
                logger.info(f"Message added to existing thread: {thread_id}")
            except Exception as thread_error:
                logger.warning(f"Failed to use existing thread {thread_id}: {thread_error}")
                # Create new thread if existing one fails
                thread = project_client.agents.threads.create()
                thread_id = thread.id
                logger.info(f"Created new thread: {thread_id}")
                
                # Add the user message to new thread
                message = project_client.agents.messages.create(
                    thread_id=thread_id,
                    role="user",
                    content=request.message
                )
        else:
            # Create a new thread for new conversation
            thread = project_client.agents.threads.create()
            thread_id = thread.id
            logger.info(f"Created new thread: {thread_id}")
            
            # Add the user message to the thread
            message = project_client.agents.messages.create(
                thread_id=thread_id,
                role="user",
                content=request.message
            )
            logger.info(f"Message added to new thread")
        
        # TRUE STREAMING IMPLEMENTATION
        if request.stream:
            async def generate_stream():
                """Generator function for streaming response"""
                try:
                    stream_start = time.time()
                    logger.info(f'🌊 Starting stream generation at {stream_start - start_time:.2f}s')
                    
                    # Send initial metadata
                    yield f"data: {json.dumps({'type': 'metadata', 'conversation_id': conversation_id, 'thread_id': thread_id})}\n\n"
                    
                    accumulated_text = ""
                    first_chunk_sent = False
                    
                    # Create and stream the run - THIS IS TRUE STREAMING!
                    ai_stream_start = time.time()
                    logger.info(f'🤖 Initiating Azure AI Agent stream at {ai_stream_start - start_time:.2f}s')
                    
                    with project_client.agents.runs.stream(
                        thread_id=thread_id,
                        agent_id=agent.id
                    ) as agent_stream:
                        for event_type, event_data, _ in agent_stream:
                            # Handle text delta events (streaming chunks)
                            if event_type == "thread.message.delta":
                                if not first_chunk_sent:
                                    first_chunk_time = time.time()
                                    logger.info(f'✨ First chunk received at {first_chunk_time - start_time:.2f}s (AI processing: {first_chunk_time - ai_stream_start:.2f}s)')
                                    first_chunk_sent = True
                                    
                                if event_data and 'delta' in event_data:
                                    delta = event_data['delta']
                                    if 'content' in delta:
                                        for content in delta['content']:
                                            if content.get('type') == 'text' and 'text' in content:
                                                chunk = content['text']['value']
                                                accumulated_text += chunk
                                                # Send chunk immediately - TRUE STREAMING!
                                                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                    
                    completion_time = time.time()
                    logger.info(f'✅ Stream complete at {completion_time - start_time:.2f}s total')
                    
                    # Send completion signal
                    yield f"data: {json.dumps({'type': 'done', 'full_response': accumulated_text, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
                    
                except Exception as e:
                    logger.error(f"Streaming error: {e}", exc_info=True)
                    yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                }
            )
        else:
            # Non-streaming response
            run = project_client.agents.runs.create_and_process(
                thread_id=thread_id,
                agent_id=agent.id
            )
            logger.info(f"Run completed: {run.id}, status: {run.status}")
            
            # Check for errors
            if run.status == "failed":
                logger.error(f"Run failed: {run.last_error}")
                raise HTTPException(status_code=500, detail=f"Agent run failed: {run.last_error}")
            
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
            
            return ChatResponse(
                conversation_id=conversation_id,
                thread_id=thread_id,
                message=request.message,
                response=ai_response,
                timestamp=datetime.utcnow().isoformat(),
                agent_id=agent.id,
                is_new_conversation=(thread_id == thread.id if 'thread' in locals() else False)
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Azure AI Agent error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
