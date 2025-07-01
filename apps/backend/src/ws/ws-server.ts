import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { IncomingMessage } from 'http';
import {
  ClientToServerMessage,
  ServerToClientMessage,
  TranscriptionResponse,
  StartMessage
} from 'shared/types/websocket';
import { forwardToLLMBuffer } from '../services/llm-forwarder';

dotenv.config();

const PORT = Number(process.env.BACKEND_WS_PORT || 8080);
const WHISPER_WS_URL = process.env.WHISPER_WS_URL || 'ws://localhost:8001';

interface ClientSession {
  frontendSocket: WebSocket;
  whisperSocket: WebSocket;
  guestId: string;
  meetingId: string;
}

const wss = new WebSocketServer({ port: PORT });
console.log(`Backend WebSocket server listening on port ${PORT}`);

wss.on('connection', (frontendSocket: WebSocket, req: IncomingMessage) => {
  let session: ClientSession | null = null;

  frontendSocket.on('message', async (data: WebSocket.RawData, isBinary) => {
    try {
      // Handle start message (text)
      if (!isBinary) {
        const msg: StartMessage = JSON.parse(data.toString());

        if (msg.type === 'start' && msg.guestId && msg.meetingId) {
          // Connect to Whisper socket
          const whisperSocket = new WebSocket(WHISPER_WS_URL);

          whisperSocket.on('open', () => {
            // Send start message to whisper
            const startMsg = JSON.stringify({
              type: 'start',
              guestId: msg.guestId,
              meetingId: msg.meetingId
            });
            whisperSocket.send(startMsg);
          });

          whisperSocket.on('message', (whisperData) => {
            const transcript: TranscriptionResponse = JSON.parse(whisperData.toString());

            const forwardMsg: ServerToClientMessage = {
              type: 'transcription',
              text: transcript.text,
              start: transcript.start,
              end: transcript.end,
              guestId: transcript.guestId,
              meetingId: transcript.meetingId
            };

            // Relay to frontend
            if (frontendSocket.readyState === WebSocket.OPEN) {
              frontendSocket.send(JSON.stringify(forwardMsg));
            }

            // Forward to LLM processor
            forwardToLLMBuffer(forwardMsg);
          });

          whisperSocket.on('error', (err) => {
            console.error('Whisper socket error:', err);
          });

          session = {
            frontendSocket,
            whisperSocket,
            guestId: msg.guestId,
            meetingId: msg.meetingId
          };
        }
      } else if (session?.whisperSocket?.readyState === WebSocket.OPEN) {
        // Forward binary audio to Whisper
        session.whisperSocket.send(data, { binary: true });
      }
    } catch (err) {
      console.error('WebSocket error:', err);
    }
  });

  frontendSocket.on('close', () => {
    session?.whisperSocket?.close();
  });
});
