from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from utils.db import notes_collection
from models.note import Note
import jwt
import os

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
def add_note(note: Note, payload: dict = Depends(verify_jwt)):
    note_data = {
        "title": note.title,
        "content": note.content,
        "userId": payload["_id"]  # same key as Node.js
    }
    result = notes_collection.insert_one(note_data)
    return {"id": str(result.inserted_id), "message": "Note added"}

# Fetch notes (with pagination)
@router.get("/")
def get_notes(skip: int = 0, limit: int = 20, payload: dict = Depends(verify_jwt)):
    user_id = payload["_id"]
    notes_cursor = notes_collection.find({"userId": user_id}).skip(skip).limit(limit)
    notes = []
    for note in notes_cursor:
        notes.append(Note(
            title=note["title"],
            content=note["content"],
            id=str(note["_id"])
        ))
    return notes
