#!/usr/bin/env python3
"""
Script to delete all auto-fetched posts from Cosmos DB
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

# Query all auto-fetched posts
query = "SELECT c.id, c.title FROM c WHERE c.auto_fetched = true"
items = list(container.query_items(
    query=query,
    enable_cross_partition_query=True
))

print(f"Found {len(items)} auto-fetched posts to delete")

# Delete each post
deleted = 0
for item in items:
    try:
        container.delete_item(item=item['id'], partition_key=item['id'])
        print(f"✅ Deleted: {item['title'][:50]}...")
        deleted += 1
    except Exception as e:
        print(f"❌ Failed to delete {item['id']}: {e}")

print(f"\n✅ Successfully deleted {deleted} out of {len(items)} posts")
