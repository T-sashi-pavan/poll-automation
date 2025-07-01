import React, { useEffect, useRef, useState } from 'react';
import { StartMessage } from 'shared/types/websocket';
import {
  getSelectedMicStream,
  getAvailableMics,
  selectMicDevice
} from '../utils/micManager';

interface GuestRecorderProps {
  guestId: string;
  meetingId: string;
  backendWsUrl: string;
  hostBroadcastSocket: WebSocket; // should be passed from outer context
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
    getAvailableMics().then(setDevices);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'start') {
          handleStartStreaming();
        }
      } catch (err) {
        console.error('Invalid host broadcast message', err);
      }
    };

    hostBroadcastSocket.addEventListener('message', onMessage);
    return () => {
      hostBroadcastSocket.removeEventListener('message', onMessage);
    };
  }, [hostBroadcastSocket, selectedDeviceId]);

  const handleStartStreaming = async () => {
    const stream = await getSelectedMicStream(selectedDeviceId);
    if (!stream) return;

    const ws = new WebSocket(backendWsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      const startMessage: StartMessage = {
        type: 'start',
        guestId,
        meetingId
      };
      ws.send(JSON.stringify(startMessage));

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then((buffer) => {
            ws.send(buffer);
          });
        }
      };

      recorder.start(1000);
      setIsStreaming(true);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
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
          selectMicDevice(id);
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
