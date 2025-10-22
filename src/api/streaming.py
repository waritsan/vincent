from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from azure.ai.agents.models import ListSortOrder
import time

project = AIProjectClient(
    credential=DefaultAzureCredential(),
    endpoint="https://cog-ja67jva7pfqfc.services.ai.azure.com/api/projects/project-ja67jva7pfqfc")

agent = project.agents.get_agent("asst_VF1pUCg1iH9WkKtnhbd3Lq09")

thread = project.agents.threads.create()
print(f"Created thread, ID: {thread.id}")

thread = project.agents.threads.create()
print(f"Created thread, ID: {thread.id}")

message = project.agents.messages.create(
    thread_id=thread.id,
    role="user",
    content="Hi security-agent, tell me a short story"
)

# ========================================
# Test 1: Streaming Response
# ========================================
print("\n" + "="*50)
print("TEST 1: STREAMING RESPONSE")
print("="*50 + "\n")

start_streaming = time.time()
first_chunk_time = None
accumulated_text = ""

with project.agents.runs.stream(
    thread_id=thread.id,
    agent_id=agent.id
) as stream:
    for event_type, event_data, _ in stream:
        # Handle text delta events (streaming chunks)
        if event_type == "thread.message.delta":
            if event_data and 'delta' in event_data:
                delta = event_data['delta']
                if 'content' in delta:
                    for content in delta['content']:
                        if content.get('type') == 'text' and 'text' in content:
                            chunk = content['text']['value']
                            if first_chunk_time is None:
                                first_chunk_time = time.time()
                            accumulated_text += chunk
                            print(chunk, end='', flush=True)
        
        # Handle run completion
        elif event_type == "thread.run.completed":
            end_streaming = time.time()

streaming_total_time = end_streaming - start_streaming
time_to_first_chunk = first_chunk_time - start_streaming if first_chunk_time else 0

print("\n\n" + "="*50)
print("STREAMING RESULTS:")
print("="*50)
print(f"⏱️  Time to first chunk: {time_to_first_chunk:.3f} seconds")
print(f"⏱️  Total time: {streaming_total_time:.3f} seconds")
print(f"📝 Total characters: {len(accumulated_text)}")

# ========================================
# Test 2: Non-Streaming (Complete) Response
# ========================================
print("\n" + "="*50)
print("TEST 2: NON-STREAMING (COMPLETE) RESPONSE")
print("="*50 + "\n")

# Create new thread for fair comparison
thread2 = project.agents.threads.create()
message2 = project.agents.messages.create(
    thread_id=thread2.id,
    role="user",
    content="Hi security-agent, tell me a short story"
)

start_complete = time.time()

run = project.agents.runs.create_and_process(
    thread_id=thread2.id,
    agent_id=agent.id
)

end_complete = time.time()

if run.status == "failed":
    print(f"Run failed: {run.last_error}")
else:
    messages = project.agents.messages.list(thread_id=thread2.id, order=ListSortOrder.ASCENDING)
    complete_response = ""
    for msg in messages:
        if msg.role == "assistant" and msg.text_messages:
            complete_response = msg.text_messages[-1].text.value
            print(complete_response)
    
    complete_total_time = end_complete - start_complete
    
    print("\n" + "="*50)
    print("NON-STREAMING RESULTS:")
    print("="*50)
    print(f"⏱️  Total time: {complete_total_time:.3f} seconds")
    print(f"📝 Total characters: {len(complete_response)}")

# ========================================
# Comparison
# ========================================
print("\n" + "="*50)
print("COMPARISON")
print("="*50)
print(f"\n🚀 Streaming advantages:")
print(f"   • First chunk appears in: {time_to_first_chunk:.3f}s")
print(f"   • User sees content immediately (better UX)")
print(f"   • Perceived as faster even if total time is similar")
print(f"\n⏰ Total completion times:")
print(f"   • Streaming: {streaming_total_time:.3f}s")
print(f"   • Non-streaming: {complete_total_time:.3f}s")
print(f"   • Difference: {abs(streaming_total_time - complete_total_time):.3f}s")

if streaming_total_time < complete_total_time:
    print(f"   • Streaming was {complete_total_time - streaming_total_time:.3f}s faster")
else:
    print(f"   • Non-streaming was {streaming_total_time - complete_total_time:.3f}s faster")

print(f"\n💡 Key insight:")
print(f"   The total time is similar, but streaming provides")
print(f"   content {time_to_first_chunk:.3f}s earlier, making the")
print(f"   experience feel much faster to users!")
print("="*50 + "\n")