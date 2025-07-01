import os
import json
import asyncio
from dotenv import load_dotenv
from fastapi import WebSocket
from faster_whisper import WhisperModel
from typing import Optional
from io import BytesIO

load_dotenv()

CHUNK_DURATION = int(os.getenv("CHUNK_DURATION", "30"))  # seconds
MODEL_NAME = os.getenv("MODEL", "medium")
SILENCE_THRESHOLD = int(os.getenv("SILENCE_THRESHOLD", "5000"))  # bytes

model = WhisperModel(MODEL_NAME, compute_type="float16")

class ClientState:
    def __init__(self):
        self.guest_id: Optional[str] = None
        self.meeting_id: Optional[str] = None
        self.audio_buffer = BytesIO()
        self.start_time = 0
        self.end_time = CHUNK_DURATION
        self.started = False
        self.queue: asyncio.Queue = asyncio.Queue()

async def process_audio(state: ClientState, websocket: WebSocket):
    while True:
        try:
            # Wait for audio chunk
            audio_chunk = await state.queue.get()
            state.audio_buffer.write(audio_chunk)
            print(f"[{state.guest_id}] Received {len(audio_chunk)} bytes")

            # Wait for collection duration
            await asyncio.sleep(CHUNK_DURATION)

            # Check silence
            state.audio_buffer.seek(0)
            buffer_size = state.audio_buffer.getbuffer().nbytes
            if buffer_size < SILENCE_THRESHOLD:
                print(f"[{state.guest_id}] Skipping silent or too short chunk ({buffer_size} bytes)")
                state.audio_buffer = BytesIO()
                state.start_time += CHUNK_DURATION
                state.end_time += CHUNK_DURATION
                continue

            # Transcribe
            segments, _ = model.transcribe(state.audio_buffer, language="en")
            full_text = " ".join([seg.text for seg in segments])

            print(f"[{state.guest_id}] Transcribed: {full_text}")

            # Send result
            await websocket.send_text(json.dumps({
                "type": "transcription",
                "text": full_text,
                "start": state.start_time,
                "end": state.end_time,
                "guestId": state.guest_id,
                "meetingId": state.meeting_id
            }))

            # Reset buffer and time
            state.audio_buffer = BytesIO()
            state.start_time += CHUNK_DURATION
            state.end_time += CHUNK_DURATION

        except Exception as e:
            print(f"[{state.guest_id}] Error during processing: {e}")
            break

async def handle_client(websocket: WebSocket):
    state = ClientState()

    try:
        # Start audio processing task
        processor = asyncio.create_task(process_audio(state, websocket))

        while True:
            message = await websocket.receive()

            # Handle control messages
            if "text" in message:
                try:
                    data = json.loads(message["text"])
                    if data.get("type") == "start":
                        state.guest_id = data.get("guestId")
                        state.meeting_id = data.get("meetingId")
                        state.started = True
                        print(f"[{state.guest_id}] Started session for meeting {state.meeting_id}")
                        continue
                except json.JSONDecodeError:
                    continue

            # Handle audio stream
            elif "bytes" in message and state.started:
                await state.queue.put(message["bytes"])

    except Exception as e:
        print(f"[{state.guest_id}] WebSocket connection error: {e}")
    finally:
        await websocket.close()
