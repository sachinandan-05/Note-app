import json
import logging
import uuid
from typing import Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect
import jwt
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_ids: Dict[str, str] = {}  # user_id -> connection_id

    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        """
        Store the WebSocket connection and return a unique connection ID.
        If user already has a connection, it will be replaced.
        """
        # Generate a unique connection ID
        connection_id = str(uuid.uuid4())
        
        # Close existing connection if any
        await self.disconnect(user_id)
        
        # Store the new connection
        self.active_connections[connection_id] = websocket
        self.connection_ids[user_id] = connection_id
        
        logger.info(f"New WebSocket connection: {user_id} (connection_id: {connection_id})")
        return connection_id

    async def disconnect(self, user_id: str) -> None:
        """Safely close and remove a connection"""
        if user_id not in self.connection_ids:
            return
            
        connection_id = self.connection_ids[user_id]
        ws = self.active_connections.pop(connection_id, None)
        self.connection_ids.pop(user_id, None)
        
        if ws:
            try:
                await ws.close(code=1000)  # Normal closure
            except Exception as e:
                logger.error(f"Error closing connection for {user_id}: {e}")
        
        logger.info(f"Disconnected: {user_id} (connection_id: {connection_id})")

    def get_websocket(self, user_id: str) -> Optional[WebSocket]:
        """Get WebSocket for a user"""
        connection_id = self.connection_ids.get(user_id)
        if connection_id:
            return self.active_connections.get(connection_id)
        return None

    async def send_personal_message(self, message: dict, user_id: str) -> bool:
        """Send message to a specific user"""
        ws = self.get_websocket(user_id)
        if not ws:
            return False
            
        try:
            await ws.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending message to {user_id}: {e}")
            await self.disconnect(user_id)
            return False

    async def broadcast(self, message: dict, exclude_user_id: str = None) -> None:
        """Send message to all connected users, optionally excluding one"""
        for user_id in list(self.connection_ids.keys()):
            if user_id == exclude_user_id:
                continue
            await self.send_personal_message(message, user_id)

# Global WebSocket manager instance
manager = ConnectionManager()

# JWT secret - should match the one in your main application
JWT_SECRET = "your_jwt_secret_here"

def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("_id")
        return str(user_id) if user_id else None
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None
