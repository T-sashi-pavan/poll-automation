import React, { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "../../components/GlassCard";

const GuestPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get("meetingId") || "N/A";
  const displayName = searchParams.get("displayName") || "N/A";

  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsRecording(true);
      setIsMuted(false);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    setIsRecording(false);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <GlassCard className="p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
          <div className="text-white flex flex-col items-center text-center gap-6">
            <h1 className="text-3xl font-bold">🎙️ Guest Voice Input</h1>

            <div className="space-y-2 text-sm sm:text-base">
              <p><span className="text-gray-400 font-medium">Meeting ID:</span> {meetingId}</p>
              <p><span className="text-gray-400 font-medium">Your Display ID:</span> {displayName}</p>
              <p>
                <span className="text-gray-400 font-medium">Status:</span>{" "}
                {isRecording ? (
                  <span className="text-green-400">Recording</span>
                ) : (
                  <span className="text-yellow-400">Idle</span>
                )}
              </p>
              {isRecording && (
                <p>
                  <span className="text-gray-400 font-medium">Mic:</span>{" "}
                  {isMuted ? (
                    <span className="text-red-400">Muted</span>
                  ) : (
                    <span className="text-blue-400">Unmuted</span>
                  )}
                </p>
              )}
            </div>

            {/* Controls: Always visible Mute/Unmute + optional Record buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              {/* Optional Start/Stop Recording Buttons */}
              {/* You can remove this block anytime in future */}
              {isRecording ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg shadow"
                >
                  <MicOff className="w-4 h-4" />
                  Stop Recording
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow"
                >
                  <Mic className="w-4 h-4" />
                  Start Recording
                </motion.button>
              )}

              {/* ✅ Always show Mute/Unmute */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                disabled={!mediaStreamRef.current} // disable if no mic stream
                className={`flex items-center gap-2 ${isMuted
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-blue-600 hover:bg-blue-700"
                  } text-white px-5 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </motion.button>
            </div>


            <p className="text-xs text-gray-400 pt-4 border-t border-white/10">
              Ensure microphone access is granted in your browser. Audio is streamed live for transcription.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default GuestPage;
