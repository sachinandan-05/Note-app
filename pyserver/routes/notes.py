from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from utils.db import notes_collection
from models.note import Note
from utils.redis_utils import get_cached_notes, set_cached_notes, invalidate_notes_cache
import jwt
import os
from bson.objectid import ObjectId
from typing import List, Dict, Any


router = APIRouter()
security = HTTPBearer()

# Make sure this matches your Node.js JWT_SECRET
JWT_SECRET = os.getenv("JWT_SECRET", "secrethrejnrsibrgjfskib")
ALGORITHM = "HS256"
print("*"*10,JWT_SECRET,"*"*10)


def verify_jwt(token=Depends(security)):
    try:
        payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        # payload will have {"_id": "<user_id>"}
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Add note
@router.post("/")
async def add_note(note: Note, payload: dict = Depends(verify_jwt)):
    user_id = payload["_id"]
    note_data = {
        "title": note.title,
        "content": note.content,
        "userId": user_id
    }
    result = notes_collection.insert_one(note_data)
    
    # Invalidate the cache for this user's notes
    await invalidate_notes_cache(user_id)
    
    return {"id": str(result.inserted_id), "message": "Note added"}

# Fetch notes (with pagination and Redis caching)
@router.get("/")
async def get_notes(skip: int = 0, limit: int = 20, payload: dict = Depends(verify_jwt)):
    user_id = payload["_id"]
    
    # Try to get notes from cache first
    cached_notes = await get_cached_notes(user_id)
    if cached_notes is not None:
        return cached_notes
    
    # If not in cache, fetch from database
    notes_cursor = notes_collection.find({"userId": user_id}).skip(skip).limit(limit)
    notes = []
    for note in notes_cursor:
        notes.append({
            "title": note["title"],
            "content": note["content"],
            "id": str(note["_id"])
        })
    
    # Cache the results for future requests
    if notes:
        await set_cached_notes(user_id, notes)
    
    return notes


@router.delete("/{note_id}")
async def delete_note(note_id: str, payload: dict = Depends(verify_jwt)):
    user_id = payload["_id"]

    # Check cached notes for the user
    cached_notes = await get_cached_notes(user_id)
    if cached_notes:
        updated_notes = [note for note in cached_notes if note.get("id") != note_id]
        await set_cached_notes(user_id, updated_notes)

    # Delete from MongoDB
    result = notes_collection.delete_one({
        "_id": ObjectId(note_id),
        "userId": user_id
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")

    return {"message": "Note deleted"}
