"""
Scheduled news fetcher for DBD (Department of Business Development)
Automatically fetches latest news from DBD API and saves to Cosmos DB
Runs on a schedule (e.g., every 6 hours)
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict
import azure.functions as func
from news_scraper import (
    scrape_dbd_news, 
    should_store_in_blob, 
    store_content_in_blob, 
    create_content_preview
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_cosmos_container():
    """Get Cosmos DB container for posts"""
    try:
        from azure.cosmos import CosmosClient
        import os
        
        connection_string = os.environ.get('AZURE_COSMOS_CONNECTION_STRING')
        if not connection_string:
            logger.error("AZURE_COSMOS_CONNECTION_STRING not found in environment")
            return None
        
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client('blogdb')
        container = database.get_container_client('posts')
        
        return container
    except Exception as e:
        logger.error(f"Failed to connect to Cosmos DB: {e}")
        return None


def check_article_exists(container, source_url: str) -> bool:
    """Check if an article already exists in the database"""
    try:
        query = "SELECT c.id FROM c WHERE c.source_url = @source_url"
        parameters = [{"name": "@source_url", "value": source_url}]
        
        items = list(container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        
        return len(items) > 0
    except Exception as e:
        logger.error(f"Error checking article existence: {e}")
        return False


def save_articles_to_db(articles: List[Dict], tags: List[str] = None) -> Dict:
    """
    Save fetched articles to Cosmos DB
    
    Args:
        articles: List of article dictionaries from scraper
        tags: Additional tags to add to posts
    
    Returns:
        Dictionary with stats about saved articles
    """
    container = get_cosmos_container()
    if not container:
        logger.error("Cannot save articles: Database not available")
        return {"saved": 0, "skipped": 0, "errors": 0}
    
    if tags is None:
        tags = ['DBD', 'กรมพัฒนาธุรกิจการค้า', 'ข่าวประชาสัมพันธ์']
    
    stats = {'saved': 0, 'skipped': 0, 'errors': 0}
    
    # Get the highest fetch_order currently in database to continue sequence
    try:
        max_order_query = "SELECT VALUE MAX(c.fetch_order) FROM c WHERE c.auto_fetched = true"
        max_order_result = list(container.query_items(
            query=max_order_query,
            enable_cross_partition_query=True
        ))
        current_max_order = max_order_result[0] if max_order_result and max_order_result[0] is not None else 0
    except Exception as e:
        logger.warning(f"Could not get max fetch_order, starting from 0: {e}")
        current_max_order = 0
    
    for idx, article in enumerate(articles):
        try:
            source_url = article['link']
            
            # Check if article already exists
            if check_article_exists(container, source_url):
                logger.info(f"Article already exists, skipping: {article['title'][:50]}...")
                stats['skipped'] += 1
                continue
            
            # Prepare full content with source link
            full_content = article['content'] + f"\n\nอ่านเพิ่มเติม: {source_url}"
            
            # Determine storage strategy based on content size
            if should_store_in_blob(full_content):
                # Store large content in blob storage
                blob_name = f"articles/dbd-{article.get('slug', 'unknown')}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.txt"
                blob_url = store_content_in_blob(full_content, blob_name)
                
                if blob_url:
                    # Store preview in Cosmos DB and reference blob
                    content_preview = create_content_preview(full_content)
                    content_storage = 'blob'
                    content_blob_url = blob_url
                    logger.info(f"Stored large article '{article['title'][:50]}...' in blob storage")
                else:
                    # Fallback to Cosmos DB if blob storage fails
                    content_preview = create_content_preview(full_content)
                    content_storage = 'cosmos'
                    content_blob_url = None
                    logger.warning(f"Blob storage failed for '{article['title'][:50]}...', using Cosmos DB")
            else:
                # Store small content directly in Cosmos DB
                content_preview = full_content
                content_storage = 'cosmos'
                content_blob_url = None
            
            # Calculate reading time
            word_count = len(full_content.split())
            reading_time_minutes = max(1, word_count // 200)
            
            # Calculate fetch_order (higher number = newer/more recent)
            fetch_order = current_max_order + idx + 1
            
            # Create post object
            post_id = str(uuid.uuid4())
            post_data = {
                'id': post_id,
                'title': article['title'][:500],
                'content': content_preview,
                'content_storage': content_storage,
                'content_blob_url': content_blob_url,
                'author': article['source'],
                'author_avatar': 'https://www.dbd.go.th/images/Logo100.png',
                'thumbnail_url': article.get('image_url', ''),
                'video_url': None,
                'source_url': source_url,
                'source': 'dbd.go.th',
                'embed_type': 'preview',
                'iframe_allowed': False,
                'post_type': 'shared',
                'tags': tags,
                'reading_time_minutes': reading_time_minutes,
                'created_at': article.get('created_at', datetime.now(timezone.utc).isoformat()),  # Original publish date
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'auto_fetched': True,  # Mark as automatically fetched
                'fetch_date': datetime.now(timezone.utc).isoformat(),
                'fetch_order': fetch_order,  # Preserve DBD API order
                'original_date_display': article.get('date', '')  # Thai date string for display
            }
            
            # Save to Cosmos DB
            container.create_item(body=post_data)
            logger.info(f"✅ Saved article: {article['title'][:50]}...")
            stats['saved'] += 1
            
        except Exception as e:
            logger.error(f"Error saving article '{article.get('title', 'Unknown')}': {e}")
            stats['errors'] += 1
    
    return stats


def fetch_and_save_dbd_news(limit: int = 10, keyword: str = '') -> Dict:
    """
    Main function to fetch and save DBD news
    
    Args:
        limit: Number of articles to fetch
        keyword: Optional keyword filter
    
    Returns:
        Statistics about the operation
    """
    logger.info(f"Starting automated DBD news fetch (limit: {limit}, keyword: '{keyword}')")
    
    try:
        # Fetch articles from DBD API
        articles = scrape_dbd_news(limit=limit, keyword=keyword)
        
        if not articles:
            logger.warning("No articles fetched from DBD API")
            return {
                "success": False,
                "message": "No articles fetched",
                "stats": {"saved": 0, "skipped": 0, "errors": 0}
            }
        
        logger.info(f"Fetched {len(articles)} articles from DBD API")
        
        # Add keyword as tag if provided
        tags = ['DBD', 'กรมพัฒนาธุรกิจการค้า', 'ข่าวประชาสัมพันธ์']
        if keyword:
            tags.append(keyword)
        
        # Save to database
        stats = save_articles_to_db(articles, tags)
        
        logger.info(f"Completed: {stats['saved']} saved, {stats['skipped']} skipped, {stats['errors']} errors")
        
        return {
            "success": True,
            "message": f"Processed {len(articles)} articles",
            "stats": stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in fetch_and_save_dbd_news: {e}")
        return {
            "success": False,
            "message": str(e),
            "stats": {"saved": 0, "skipped": 0, "errors": 0}
        }


# For testing locally
if __name__ == '__main__':
    logger.info("Testing automated DBD news fetcher...")
    result = fetch_and_save_dbd_news(limit=5)
    
    print("\n" + "="*60)
    print("AUTOMATED NEWS FETCH RESULT")
    print("="*60)
    print(f"Success: {result['success']}")
    print(f"Message: {result['message']}")
    print(f"\nStats:")
    print(f"  - Saved: {result['stats']['saved']}")
    print(f"  - Skipped (already exists): {result['stats']['skipped']}")
    print(f"  - Errors: {result['stats']['errors']}")
    print(f"\nTimestamp: {result.get('timestamp', 'N/A')}")
    print("="*60)
