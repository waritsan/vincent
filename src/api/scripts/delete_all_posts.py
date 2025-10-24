#!/usr/bin/env python3
"""
Script to delete ALL posts from Cosmos DB
⚠️ WARNING: This will permanently delete all posts!
"""
import os
import json
from azure.cosmos import CosmosClient

# Read connection string from local.settings.json
with open('local.settings.json', 'r') as f:
    settings = json.load(f)
    connection_string = settings['Values']['AZURE_COSMOS_CONNECTION_STRING']

# Connect to Cosmos DB
client = CosmosClient.from_connection_string(connection_string)
database = client.get_database_client('blogdb')
container = database.get_container_client('posts')

# Query all posts
query = "SELECT c.id, c.title FROM c"
items = list(container.query_items(
    query=query,
    enable_cross_partition_query=True
))

print(f"⚠️  Found {len(items)} posts to delete")
print("="*60)

if len(items) == 0:
    print("No posts found in database.")
    exit(0)

# Show confirmation
print("\nPosts to be deleted:")
for i, item in enumerate(items[:10], 1):
    print(f"  {i}. {item['title'][:60]}...")
if len(items) > 10:
    print(f"  ... and {len(items) - 10} more")

print("\n⚠️  WARNING: This action cannot be undone!")
response = input(f"\nType 'DELETE ALL {len(items)} POSTS' to confirm: ")

if response != f"DELETE ALL {len(items)} POSTS":
    print("\n❌ Deletion cancelled.")
    exit(0)

# Delete each post
print(f"\n🗑️  Deleting {len(items)} posts...")
deleted = 0
failed = 0

for item in items:
    try:
        container.delete_item(item=item['id'], partition_key=item['id'])
        print(f"✅ Deleted: {item['title'][:50]}...")
        deleted += 1
    except Exception as e:
        print(f"❌ Failed to delete {item['id']}: {e}")
        failed += 1

print("\n" + "="*60)
print(f"✅ Successfully deleted {deleted} posts")
if failed > 0:
    print(f"❌ Failed to delete {failed} posts")
print("="*60)
