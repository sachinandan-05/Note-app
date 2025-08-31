import json
import logging
import uuid
from typing import Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect
import jwt
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# utils/websocket_manager.py
import uuid
import logging
from typing import Dict, Optional
from starlette.websockets import WebSocket, WebSocketState

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Supports multiple concurrent WebSocket connections per user.
    - connect() returns a connection_id and stores ws under user_id.
    - disconnect() can remove a specific connection_id (recommended)
      or all connections for a user.
    - send_to_user() sends to all of a user's active connections.
    - broadcast_all() sends to every connected user.
    All socket closes are guarded to avoid double-close errors.
    """

    def __init__(self) -> None:
        # user_id -> { connection_id: WebSocket }
        self._by_user: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        # NOTE: Do NOT call websocket.accept() here if you already accept in your route.
        cid = str(uuid.uuid4())
        self._by_user.setdefault(user_id, {})[cid] = websocket
        logger.info(f"New WebSocket connection: {user_id} (connection_id: {cid})")
        return cid

    async def _safe_close(self, ws: WebSocket, user_id: str, cid: str) -> None:
        try:
            # Guard against double-close
            if (ws.client_state != WebSocketState.DISCONNECTED and
                ws.application_state != WebSocketState.DISCONNECTED):
                await ws.close(code=1000)  # Normal closure
        except Exception as e:
            # Just log; Starlette might already have sent a close frame
            logger.error(f"Error closing connection for {user_id} ({cid}): {e}")

    async def disconnect(self, user_id: str, connection_id: Optional[str] = None, *, close: bool = True) -> None:
        """
        Remove a connection (preferred) or all connections for a user.
        Set close=False when you're being called from a WebSocketDisconnect path.
        """
        if user_id not in self._by_user:
            return

        if connection_id is None:
            # Remove ALL connections for this user
            conns = self._by_user.pop(user_id, {})
            for cid, ws in list(conns.items()):
                if close:
                    await self._safe_close(ws, user_id, cid)
            logger.info(f"Disconnected ALL for {user_id} (count={len(conns)})")
            return

        ws = self._by_user[user_id].pop(connection_id, None)
        if not self._by_user[user_id]:
            self._by_user.pop(user_id, None)

        if ws and close:
            await self._safe_close(ws, user_id, connection_id)

        logger.info(f"Disconnected: {user_id} (connection_id: {connection_id})")

    def has_user(self, user_id: str) -> bool:
        return user_id in self._by_user and bool(self._by_user[user_id])

    async def send_to_user(self, user_id: str, message: dict, exclude_connection_id: Optional[str] = None) -> None:
        """
        Fan-out to ALL active sockets of this user (Electron + Browser, etc).
        If one socket fails, it's pruned.
        """
        conns = self._by_user.get(user_id, {})
        dead = []
        for cid, ws in list(conns.items()):
            if cid == exclude_connection_id:
                continue
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {user_id} ({cid}): {e}")
                dead.append((user_id, cid, ws))
        # Cleanup dead sockets without double-close (Starlette likely closed them)
        for uid, cid, ws in dead:
            await self.disconnect(uid, cid, close=False)

    async def broadcast_all(self, message: dict, exclude_user_id: Optional[str] = None) -> None:
        """
        Global broadcast (rarely needed for user data).
        """
        for user_id in list(self._by_user.keys()):
            if user_id == exclude_user_id:
                continue
            await self.send_to_user(user_id, message)

# Global instance
manager = ConnectionManager()
