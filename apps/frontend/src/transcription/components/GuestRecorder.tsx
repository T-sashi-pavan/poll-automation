import React, { useEffect, useRef, useState } from 'react';
import type { StartMessage } from '@poll-automation/types';
import {
  getSelectedMicStream,
  getMicrophones,
  selectMicrophone
} from '../utils/micManager';
import { encodeWAV } from '../utils/wavEncoder';


interface GuestRecorderProps {
  guestId: string;
  meetingId: string;
  backendWsUrl: string;
  hostBroadcastSocket: WebSocket;
}

const GuestRecorder: React.FC<GuestRecorderProps> = ({
  guestId,
  meetingId,
  backendWsUrl,
  hostBroadcastSocket
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
const CHUNK_INTERVAL = parseInt(import.meta.env.VITE_CHUNK_INTERVAL || '30000');


  useEffect(() => {
    getMicrophones().then((mics) => {
      setDevices(mics);
      console.log('[GuestRecorder] Found mics:', mics);
    });
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'start') {
          console.log('[GuestRecorder] Received start broadcast from host');
          handleStartStreaming();
        }
      } catch (err) {
        console.error('[GuestRecorder] Invalid broadcast message:', err);
      }
    };

    hostBroadcastSocket.addEventListener('message', onMessage);
    return () => {
      hostBroadcastSocket.removeEventListener('message', onMessage);
    };
  }, [hostBroadcastSocket, selectedDeviceId]);

  const handleStartStreaming = async () => {
    if (!selectedDeviceId) {
      console.warn('[GuestRecorder] No microphone selected');
      return;
    }

    console.log('[GuestRecorder] Starting stream using:', selectedDeviceId);

    await selectMicrophone(selectedDeviceId);
    const stream = getSelectedMicStream();
    if (!stream) {
      console.error('[GuestRecorder] No stream from selected mic');
      return;
    }

    const ws = new WebSocket(backendWsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[GuestRecorder] WebSocket opened');
      const startMessage: StartMessage = {
        type: 'start',
        guestId,
        meetingId
      };
      ws.send(JSON.stringify(startMessage));
      console.log('[GuestRecorder] Sent start message:', startMessage);

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        audioBufferRef.current.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // flush every 3s
      chunkIntervalRef.current = setInterval(() => {
        const allSamples = Float32Array.from(audioBufferRef.current.flat());
        if (allSamples.length > 0) {
          const wavBuffer = encodeWAV(allSamples, 16000);
          ws.send(wavBuffer);
          console.log('[GuestRecorder] Sent chunk', wavBuffer.byteLength);
          audioBufferRef.current = [];
        }
      },CHUNK_INTERVAL);

      setIsStreaming(true);
    };

    ws.onerror = (err) => {
      console.error('[GuestRecorder] WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('[GuestRecorder] WebSocket closed');
      stopStreaming();
    };
  };

  const stopStreaming = () => {
  if (!wsRef.current) return;

  if (audioBufferRef.current.length > 0) {
    const allSamples = Float32Array.from(audioBufferRef.current.flat());
    const wavBuffer = encodeWAV(allSamples, 16000);
    wsRef.current.send(wavBuffer);
    console.log('[GuestRecorder] Final chunk sent on stop');
    audioBufferRef.current = [];
  }

  wsRef.current.send(JSON.stringify({ type: "stop" }));
  console.log('[GuestRecorder] Sent stop signal');

  wsRef.current.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "done") {
        console.log('[GuestRecorder] Done received, closing socket.');
        wsRef.current?.close();
        setIsStreaming(false);
      }
    } catch (_) {}
  });
};



  return (
    <div>
      <label>Select Microphone:</label>
      <select
        value={selectedDeviceId || ''}
        onChange={(e) => {
          const id = e.target.value;
          setSelectedDeviceId(id);
          console.log('[GuestRecorder] Selected mic:', id);
        }}
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Mic ${device.deviceId}`}
          </option>
        ))}
      </select>

      <button onClick={stopStreaming} disabled={!isStreaming}>
        Stop Streaming
      </button>

      {isStreaming && <p>Recording in progress...</p>}
    </div>
  );
};

export default GuestRecorder;
