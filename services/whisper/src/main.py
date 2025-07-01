from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from src.websocket.endpoint import handle_client
print("✅ FASTAPI MAIN.PY BOOTED")

load_dotenv()
app = FastAPI()

@app.websocket("/")
async def websocket_endpoint(ws: WebSocket):
    print("WebSocket endpoint hit")  # Confirm the route is active
    await ws.accept()
    try:
        print("⚡ Launching handler...")
        await handle_client(ws)
    except WebSocketDisconnect:
        print("Client disconnected")
