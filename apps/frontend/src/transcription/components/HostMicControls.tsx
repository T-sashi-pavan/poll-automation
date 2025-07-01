import React, { useRef, useState } from 'react';
import type { StartMessage } from '@poll-automation/types';
import { getSelectedMicStream } from '../utils/micManager';

interface HostMicControlsProps {
  meetingId: string;
  backendWsUrl: string;
}

const HostMicControls: React.FC<HostMicControlsProps> = ({ meetingId, backendWsUrl }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startStreaming = async () => {
    const stream = await getSelectedMicStream();
    if (!stream) {
      console.error('No microphone stream available.');
      return;
    }

    const ws = new WebSocket(backendWsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      const startMessage: StartMessage = {
        type: 'start',
        guestId: 'host',
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
      stopStreaming();
    };
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setIsStreaming(false);
  };

  return (
    <div>
      <button onClick={isStreaming ? stopStreaming : startStreaming}>
        {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
      </button>
    </div>
  );
};

export default HostMicControls;
