# services/whisper/src/main.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from src.websocket.endpoint import handle_client

load_dotenv()
app = FastAPI()

@app.websocket("/")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        await handle_client(ws)
    except WebSocketDisconnect:
        print("Client disconnected")
