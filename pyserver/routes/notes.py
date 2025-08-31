from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer
from utils.db import notes_collection
from models.note import Note
from utils.redis_utils import get_cached_notes, set_cached_notes, invalidate_notes_cache
from utils.websocket_manager import manager
import jwt, os, logging, asyncio
from datetime import datetime, timezone
from bson.objectid import ObjectId
from fastapi import APIRouter

router = APIRouter()

logger = logging.getLogger(__name__)

security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "secrethrejnrsibrgjfskib")
ALGORITHM = "HS256"


# ---------------- JWT verification ----------------
def verify_jwt(token=Depends(security)):
    try:
        payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
#for testing

@router.get("/test")
async def test():
    return {"message": "Hello World"}
    

# ---------------- Add note ----------------
@router.post("/notes")
async def add_note(note: Note, payload: dict = Depends(verify_jwt)):
    user_id = payload["_id"]
    try:
        note_data = {
            "title": note.title,
            "content": note.content,
            "userId": user_id,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        result = notes_collection.insert_one(note_data)
        invalidate_notes_cache(user_id)

        new_note = {
            "id": str(result.inserted_id),
            "title": note.title,
            "content": note.content,
            "userId": user_id,
            "createdAt": note_data["createdAt"]
        }

        # Broadcast
        await manager.send_to_user(user_id, {
            "type": "note_added",
            "data": new_note,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        return {"message": "Note added successfully", "note": new_note}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- Get notes ----------------
@router.get("/notes")
def get_notes(skip: int = 0, limit: int = 20, payload: dict = Depends(verify_jwt)):
    user_id = payload["_id"]
    cached_notes = get_cached_notes(user_id)
    if cached_notes is not None:
        return cached_notes

    notes_cursor = notes_collection.find({"userId": user_id}).skip(skip).limit(limit)
    notes = [{"id": str(note["_id"]), "title": note["title"], "content": note["content"]} for note in notes_cursor]

    if notes:
        set_cached_notes(user_id, notes)
    return notes

# ---------------- Delete note ----------------
@router.delete("/notes/{note_id}")
async def delete_note(note_id: str, payload: dict = Depends(verify_jwt)):
    user_id = payload["_id"]

    try:
        note_oid = ObjectId(note_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note ID format")

    note = notes_collection.find_one({"_id": note_oid, "userId": user_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    notes_collection.delete_one({"_id": note_oid, "userId": user_id})
    invalidate_notes_cache(user_id)

    await manager.send_to_user(user_id, {
        "type": "note_deleted",
        "data": {"id": note_id},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Note deleted successfully"}

# ---------------- WebSocket ----------------
from fastapi import WebSocket, WebSocketDisconnect
# ...
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str, userId: str):
    # verify token -> user_id (omitted here)
    await websocket.accept()
    connection_id = await manager.connect(websocket, userId)
    try:
        while True:
            _ = await websocket.receive_json()
            # handle messages...
    except WebSocketDisconnect:
        pass
    finally:
        # Starlette already closed the socket on disconnect, so avoid double-close
        await manager.disconnect(userId, connection_id, close=False)
