#!/bin/bash

# Local Azure Functions API Testing Script
# Make sure the function app is running with: cd src/api && func start

echo "🧪 Testing Local Azure Functions API"
echo "======================================"
echo ""

BASE_URL="http://localhost:7071"

# Test 1: Health Check
echo "1️⃣ Testing Health Endpoint..."
echo "GET $BASE_URL/api/health"
curl -s "$BASE_URL/api/health" | jq
echo ""

# Test 2: Get Posts
echo "2️⃣ Testing Get Posts..."
echo "GET $BASE_URL/api/posts"
curl -s "$BASE_URL/api/posts" | jq
echo ""

# Test 3: Create a Post
echo "3️⃣ Testing Create Post..."
echo "POST $BASE_URL/api/posts"
curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Local Test Post",
    "content": "This post was created via local API testing",
    "author": "Local Developer"
  }' | jq
echo ""

# Test 4: Chat (without AI - will show fallback message)
echo "4️⃣ Testing Chat Endpoint (Local - No AI)..."
echo "POST $BASE_URL/api/chat"
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from local development!",
    "conversation_id": "test-123"
  }' | jq
echo ""

echo "✅ All tests completed!"
echo ""
echo "💡 Note: The chat endpoint won't connect to Azure AI when running locally"
echo "   unless you configure AZURE_AI_ENDPOINT in local.settings.json"
