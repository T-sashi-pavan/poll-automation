import os
import json
import asyncio
from dotenv import load_dotenv
from fastapi import WebSocket
from faster_whisper import WhisperModel
from typing import Optional
from io import BytesIO
import sys
sys.stdout.reconfigure(encoding='utf-8')

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
    print("[Processor] process_audio() started")

    while True:
        try:
            audio_chunk = await state.queue.get()

            if len(audio_chunk) > 0:
                state.audio_buffer.write(audio_chunk)
                print(f"📦 [{state.guest_id}] Buffer size: {state.audio_buffer.getbuffer().nbytes} bytes")

            current_size = state.audio_buffer.getbuffer().nbytes
            if current_size < SILENCE_THRESHOLD:
                continue  # Wait for more data

            # Sleep briefly to collect any trailing bytes (optional)
            await asyncio.sleep(0.5)

            state.audio_buffer.seek(0)
            print(f"🎧 [{state.guest_id}] Transcribing {current_size} bytes")

            segments, _ = model.transcribe(state.audio_buffer, language="en")
            full_text = " ".join([seg.text for seg in segments]).strip()

            if full_text:
                print(f"📝 [{state.guest_id}] Transcription: {full_text}")
                await websocket.send_text(json.dumps({
                    "type": "transcription",
                    "text": full_text,
                    "start": state.start_time,
                    "end": state.end_time,
                    "guestId": state.guest_id,
                    "meetingId": state.meeting_id
                }))

            # Update window
            state.start_time += CHUNK_DURATION
            state.end_time += CHUNK_DURATION
            state.audio_buffer = BytesIO()

        except Exception as e:
            print(f"💥 [{state.guest_id}] Error during processing: {e}")
            break


async def handle_client(websocket: WebSocket):
    print("⚡ handle_client() triggered")
    state = ClientState()

    try:
        processor = asyncio.create_task(process_audio(state, websocket))
        print("🔁 Processor task started")

        while True:
            message = await websocket.receive()
            if "text" in message:
                print("📝 Received text message")
            elif "bytes" in message:
                print(f"🔊 Binary audio received, length: {len(message['bytes'])} bytes")


            if "text" in message:
                print("📝 Received text message")
                try:
                    data = json.loads(message["text"])
                    print("📦 Parsed JSON:", data)

                    if data.get("type") == "start":
                        state.guest_id = data.get("guestId")
                        state.meeting_id = data.get("meetingId")
                        state.started = True
                        print(f"✅ [{state.guest_id}] Session started for meeting {state.meeting_id}")
                        await websocket.send_text(json.dumps({"type": "ack", "message": "Session started"}))
                        continue
                except json.JSONDecodeError:
                    print("❌ Invalid JSON message")
                    continue

            elif "bytes" in message:
                print(f"🔊 Binary audio received, length: {len(message['bytes'])} bytes")

                if not state.started:
                    print("⚠️ Audio received before 'start' message. Skipping.")
                    continue

                await state.queue.put(message["bytes"])
                print(f"📤 Audio pushed to queue for guest {state.guest_id}")

    except Exception as e:
        print(f"💥 [{state.guest_id}] WebSocket error: {e}")

    finally:
        try:
            if websocket.application_state.value != 3:
                await websocket.close()
                print(f"🔒 [{state.guest_id}] WebSocket closed")
        except RuntimeError as e:
            print(f"❗[{state.guest_id}] Close error: {e}")

