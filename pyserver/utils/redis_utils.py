import redis
import json
import os
from typing import Optional, Any, Dict, List
from bson import ObjectId

# Initialize Redis client with Upstash
redis_url = os.getenv('REDIS_URL')
redis_token = os.getenv('REDIS_TOKEN')

# For Upstash Redis, we need to use the URL with the token
if not redis_url or not redis_token:
    raise ValueError("REDIS_URL and REDIS_TOKEN must be set in the environment")

# Extract host and port from the URL
from urllib.parse import urlparse
parsed_url = urlparse(redis_url)

redis_client = redis.Redis(
    host=parsed_url.hostname,
    port=parsed_url.port or 6379,
    password=redis_token,
    ssl=True,  # Enable SSL for Upstash
    ssl_cert_reqs=None,  # Don't verify SSL certificate (useful for self-signed certs)
    decode_responses=True
)
print("*"*10, "Connected to Redis successfully", "*"*10)

def get_notes_cache_key(user_id: str) -> str:
    """Generate cache key for user's notes."""
    return f"user:{user_id}:notes"

async def get_cached_notes(user_id: str) -> Optional[List[Dict[str, Any]]]:
    """Get cached notes for a user."""
    cache_key = get_notes_cache_key(user_id)
    cached_data = redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)
    return None

async def set_cached_notes(user_id: str, notes: List[Dict[str, Any]], expire: int = 3600) -> bool:
    """Cache user's notes with an optional expiration time in seconds."""
    cache_key = get_notes_cache_key(user_id)
    try:
        redis_client.setex(cache_key, expire, json.dumps(notes, default=str))
        return True
    except Exception as e:
        print(f"Error caching notes: {e}")
        return False

async def invalidate_notes_cache(user_id: str) -> bool:
    """Invalidate (delete) the cache for a user's notes."""
    cache_key = get_notes_cache_key(user_id)
    try:
        return bool(redis_client.delete(cache_key))
    except Exception as e:
        print(f"Error invalidating cache: {e}")
        return False
