#!/usr/bin/env python3
"""
Test script to verify Cosmos DB connection and CRUD operations
"""
import os
import sys
from datetime import datetime
from azure.cosmos import CosmosClient, exceptions
from azure.identity import DefaultAzureCredential

def test_cosmos_connection():
    """Test Cosmos DB connection and basic operations"""
    
    # Get environment variables
    endpoint = os.environ.get("AZURE_COSMOS_ENDPOINT")
    database_name = os.environ.get("AZURE_COSMOS_DATABASE_NAME", "blogdb")
    
    if not endpoint:
        print("❌ AZURE_COSMOS_ENDPOINT not set")
        print("Run: azd env get-values | grep COSMOS")
        return False
    
    print(f"🔍 Testing Cosmos DB connection...")
    print(f"   Endpoint: {endpoint}")
    print(f"   Database: {database_name}")
    print()
    
    try:
        # Initialize client with managed identity
        print("🔐 Authenticating with Managed Identity...")
        credential = DefaultAzureCredential()
        client = CosmosClient(endpoint, credential=credential)
        print("✅ Client created successfully")
        
        # Get database
        print(f"📊 Getting database '{database_name}'...")
        database = client.get_database_client(database_name)
        print("✅ Database client obtained")
        
        # Get container
        print("📦 Getting container 'posts'...")
        container = database.get_container_client("posts")
        print("✅ Container client obtained")
        
        # Test CREATE
        print("\n📝 Testing CREATE operation...")
        test_post = {
            "id": f"test-{int(datetime.utcnow().timestamp())}",
            "title": "Test Post - Cosmos DB Connection",
            "content": "This is a test post to verify Cosmos DB integration works!",
            "author": "System Test",
            "created_at": datetime.utcnow().isoformat(),
            "is_test": True
        }
        
        created = container.create_item(body=test_post)
        print(f"✅ Created post with ID: {created['id']}")
        
        # Test READ
        print("\n📖 Testing READ operation...")
        read_post = container.read_item(item=created['id'], partition_key=created['id'])
        print(f"✅ Read post: {read_post['title']}")
        
        # Test QUERY
        print("\n🔍 Testing QUERY operation...")
        query = "SELECT * FROM c WHERE c.is_test = true ORDER BY c.created_at DESC"
        items = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        print(f"✅ Found {len(items)} test post(s)")
        
        # Test UPDATE
        print("\n✏️  Testing UPDATE operation...")
        read_post['content'] = "Updated content - test successful!"
        read_post['updated_at'] = datetime.utcnow().isoformat()
        updated = container.replace_item(item=read_post['id'], body=read_post)
        print(f"✅ Updated post: {updated['id']}")
        
        # Test DELETE
        print("\n🗑️  Testing DELETE operation...")
        container.delete_item(item=created['id'], partition_key=created['id'])
        print(f"✅ Deleted test post: {created['id']}")
        
        print("\n🎉 All tests passed!")
        print("\n✅ Cosmos DB is fully functional and ready to use!")
        return True
        
    except exceptions.CosmosHttpResponseError as e:
        print(f"\n❌ Cosmos DB error: {e}")
        print(f"   Status code: {e.status_code}")
        print(f"   Message: {e.message}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_cosmos_connection()
    sys.exit(0 if success else 1)
