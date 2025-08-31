import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routes import notes
from utils.websocket_manager import manager
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Notes Service")

# allow frontend origin
origins = [
    "http://localhost:5173",   
    "http://127.0.0.1:5173",
    "ws://localhost:8001",
    "ws://127.0.0.1:8001",
    "app://.",  # For Electron app
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/ping")
def ping():
    return {"message": "pong"}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None, userId: str = None):
    if not token or not userId:
        await websocket.close(code=1008)  # Policy violation
        return

    logger.info(f"New WebSocket connection attempt for user {userId}")
    
    try:
        # Accept the WebSocket connection
        await websocket.accept()
        logger.info(f"WebSocket connection accepted for user {userId}")
        
        # Register the connection with the manager
        await manager.connect(websocket, userId)
        logger.info(f"User {userId} connected successfully")
        
        try:
            # Keep the connection alive and handle incoming messages
            while True:
                try:
                    # Wait for any message from client
                    data = await websocket.receive_text()
                    logger.debug(f"Received message from user {userId}: {data}")
                    
                    # Handle ping/pong for keep-alive
                    if data.strip().lower() == 'ping':
                        logger.debug(f"Received ping from user {userId}, sending pong")
                        await websocket.send_json({"type": "pong", "data": "pong"})
                        
                except WebSocketDisconnect:
                    logger.info(f"Client {userId} disconnected")
                    break
                except Exception as e:
                    logger.error(f"Error in WebSocket connection for {userId}: {str(e)}")
                    break
                    
        except Exception as e:
            logger.error(f"Error in WebSocket message loop for {userId}: {str(e)}")
            
    except Exception as e:
        logger.error(f"WebSocket connection error for {userId}: {str(e)}")
    finally:
        # Ensure the connection is removed from the manager
        await manager.disconnect(userId)
        logger.info(f"Connection cleanup complete for user {userId}")
        
app.include_router(notes.router)



