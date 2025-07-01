import React, { useEffect, useState } from 'react';
import { TranscriptionResult } from 'shared/types/websocket';

interface LiveTranscriptFeedProps {
  backendWsUrl: string;
}

interface GroupedTranscript {
  guestId: string;
  entries: { start: number; end: number; text: string }[];
}

const LiveTranscriptFeed: React.FC<LiveTranscriptFeedProps> = ({ backendWsUrl }) => {
  const [transcripts, setTranscripts] = useState<GroupedTranscript[]>([]);

  useEffect(() => {
    const socket = new WebSocket(backendWsUrl);
    socket.onmessage = (event) => {
      try {
        const data: TranscriptionResult = JSON.parse(event.data);
        if (data.type === 'transcription') {
          setTranscripts((prev) => {
            const updated = [...prev];
            const index = updated.findIndex((g) => g.guestId === data.guestId);

            const entry = {
              start: data.start,
              end: data.end,
              text: data.text
            };

            if (index !== -1) {
              updated[index].entries.push(entry);
            } else {
              updated.push({
                guestId: data.guestId,
                entries: [entry]
              });
            }

            return updated;
          });
        }
      } catch (err) {
        console.error('Invalid transcript data:', err);
      }
    };

    return () => {
      socket.close();
    };
  }, [backendWsUrl]);

  return (
    <div>
      <h2>Live Transcripts</h2>
      {transcripts.map((group) => (
        <div key={group.guestId} style={{ marginBottom: '1rem' }}>
          <h4>🗣️ {group.guestId}</h4>
          {group.entries.map((entry, idx) => (
            <div key={idx} style={{ fontSize: '0.9rem', marginLeft: '1rem' }}>
              <strong>
                [{entry.start}s - {entry.end}s]
              </strong>{' '}
              {entry.text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default LiveTranscriptFeed;
