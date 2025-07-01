import os
import json
import asyncio
from dotenv import load_dotenv
from fastapi import WebSocket
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

async def handle_client(websocket: WebSocket):
    state = ClientState()

    while True:
        try:
            message = await websocket.receive()

            # Handle text-based start message
            if "text" in message:
                try:
                    data = json.loads(message["text"])
                    if data.get("type") == "start":
                        state.guest_id = data.get("guestId")
                        state.meeting_id = data.get("meetingId")
                        state.started = True
                        continue
                except json.JSONDecodeError:
                    continue  # Ignore invalid JSON

            # Handle binary audio stream
            elif "bytes" in message and state.started:
                state.audio_buffer.write(message["bytes"])

                # Wait for buffer duration (simulate collection time)
                await asyncio.sleep(CHUNK_DURATION)

                # Transcribe the audio chunk
                state.audio_buffer.seek(0)
                segments, _ = model.transcribe(state.audio_buffer, language="en")
                full_text = " ".join([seg.text for seg in segments])

                # Send transcript back
                await websocket.send_text(json.dumps({
                    "type": "transcription",
                    "text": full_text,
                    "start": state.start_time,
                    "end": state.end_time,
                    "guestId": state.guest_id,
                    "meetingId": state.meeting_id
                }))

                # Advance time window & reset buffer
                state.start_time += CHUNK_DURATION
                state.end_time += CHUNK_DURATION
                state.audio_buffer = BytesIO()

        except Exception as e:
            print(f"WebSocket connection error: {e}")
            break
