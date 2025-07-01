import os
import asyncio
import websockets
import json
from websockets.server import WebSocketServerProtocol
from dotenv import load_dotenv
from faster_whisper import WhisperModel
from typing import Optional
from io import BytesIO

load_dotenv()

# Configurations
CHUNK_DURATION = int(os.getenv("CHUNK_DURATION", "30"))  # in seconds
MODEL_NAME = os.getenv("MODEL", "medium")

# Load Whisper model once
model = WhisperModel(MODEL_NAME, compute_type="float16")

class ClientState:
    def __init__(self):
        self.guest_id: Optional[str] = None
        self.meeting_id: Optional[str] = None
        self.audio_buffer = BytesIO()
        self.start_time = 0
        self.end_time = CHUNK_DURATION
        self.started = False

async def handle_client(websocket: WebSocketServerProtocol):
    state = ClientState()

    try:
        async for message in websocket:
            if isinstance(message, str):
                data = json.loads(message)
                if data.get("type") == "start":
                    state.guest_id = data.get("guestId")
                    state.meeting_id = data.get("meetingId")
                    state.started = True
                    continue
            elif isinstance(message, bytes) and state.started:
                state.audio_buffer.write(message)

                # Wait for CHUNK_DURATION worth of audio (trigger after delay)
                await asyncio.sleep(CHUNK_DURATION)

                # Transcribe current audio chunk
                state.audio_buffer.seek(0)
                segments, _ = model.transcribe(state.audio_buffer, language="en")

                # Join all segment texts
                full_text = " ".join([seg.text for seg in segments])

                await websocket.send(json.dumps({
                    "type": "transcription",
                    "text": full_text,
                    "start": state.start_time,
                    "end": state.end_time,
                    "guestId": state.guest_id,
                    "meetingId": state.meeting_id
                }))

                # Prepare for next chunk
                state.start_time += CHUNK_DURATION
                state.end_time += CHUNK_DURATION
                state.audio_buffer = BytesIO()  # clear buffer

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

# Entry point to start the server
async def main():
    host = os.getenv("WS_HOST", "0.0.0.0")
    port = int(os.getenv("WS_PORT", "8001"))

    async with websockets.serve(handle_client, host, port):
        print(f"Whisper WebSocket server listening on {host}:{port}")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
