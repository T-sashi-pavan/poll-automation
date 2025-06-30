import React, { useState, useRef } from "react";
import { MicrophoneStreamer } from "../utils/microphoneStream";
import type { TranscriptionResult } from "@shared/types";

const LiveTranscriptionComponent: React.FC = () => {
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Idle"); // ✅ status state
  const streamerRef = useRef<MicrophoneStreamer | null>(null);

  const meetingId = "live_meeting_123"; // Replace with dynamic ID
  const speaker = "Host"; // Replace with dynamic speaker name

  const handleTranscription = (data: TranscriptionResult) => {
    console.log("Received transcription:", data.text);
    setTranscriptions((prev) => [...prev, data.text]);
    // You can also trigger poll generation based on keywords here
  };

  const handleStreamEnd = () => {
    console.log("Live stream ended.");
    setIsRecording(false);
    setStatus("Idle"); // ✅ reset status when stream ends
  };

  const handleError = (error: Error | Event | unknown) => {
    console.error("Streaming error:", error);
    setIsRecording(false);
    setStatus("Error");
  };

  const startRecording = async () => {
    setTranscriptions([]);
    setStatus("Connecting...");
    streamerRef.current = new MicrophoneStreamer({
      websocketUrl: "ws://localhost:3000",
      meetingId: meetingId,
      proposedSpeakerName: speaker,
      onTranscription: handleTranscription,
      onStatus: (msg) => {
        console.log("Status:", msg);
        setStatus(msg); // ✅ update live status
      },
      onError: (err) => handleError(err),
      onStreamEnd: handleStreamEnd,
    });

    await streamerRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    streamerRef.current?.stop();
    setIsRecording(false);
    setStatus("Stopped");
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "auto" }}>
      <h1>🎙️ Live Host Transcription</h1>
      <p>Status: <strong>{status}</strong></p> {/* ✅ Display status */}
      <button onClick={startRecording} disabled={isRecording}>
        Start Speaking
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Speaking
      </button>
      <div>
        <h2>Transcriptions:</h2>
        {transcriptions.length === 0 && (
          <p>No speech detected yet or recording not started.</p>
        )}
        {transcriptions.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </div>
    </div>
  );
};

export default LiveTranscriptionComponent;
