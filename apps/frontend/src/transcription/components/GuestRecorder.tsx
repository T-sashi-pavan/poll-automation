import React, { useEffect, useRef, useState } from 'react';
import type { StartMessage } from '@poll-automation/types';
import {
  getSelectedMicStream,
  getMicrophones,
  selectMicrophone
} from '../utils/micManager';

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then((buffer) => {
            ws.send(buffer);
            console.log('[GuestRecorder] Sent buffer of size', buffer.byteLength);
          });
        }
      };

      recorder.start(3000);
      setIsStreaming(true);
      console.log('[GuestRecorder] MediaRecorder started');
    };

    ws.onerror = (err) => {
      console.error('[GuestRecorder] WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('[GuestRecorder] WebSocket closed');
      setIsStreaming(false);
    };
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

      {isStreaming && <p>Recording in progress...</p>}
    </div>
  );
};

export default GuestRecorder;
