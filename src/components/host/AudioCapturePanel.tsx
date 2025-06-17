// src/components/host/AudioCapturePanel.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Settings, Volume2, Waves } from 'lucide-react';
import GlassCard from '../GlassCard';
import toast from 'react-hot-toast';

// --- Type Definitions ---
interface PollData {
    question: string;
    options: string[];
}

interface AudioCapturePanelProps {
  onPollGenerated: (poll: PollData, originalTranscript: string) => void;
}
interface AudioDevice {
  deviceId: string;
  label: string;
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

// --- The Merged and Corrected Component ---
const AudioCapturePanel: React.FC<AudioCapturePanelProps> = ({ onPollGenerated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  
  useEffect(() => {
    const SpeechRecognition = (window as IWindow).SpeechRecognition || (window as IWindow).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        // Use a functional update to ensure we're always appending to the latest state
        setTranscript(prev => prev + finalTranscript);
      };

      recognition.onerror = (event: any) => {
        toast.error(`Speech recognition error: ${event.error}`);
        if(isRecording) stopRecording(); // Ensure UI updates on error
      };
      
      recognitionRef.current = recognition;
    } else {
      toast.error("Speech Recognition not supported in this browser.");
    }
    
    getAudioDevices();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      recognitionRef.current?.stop();
    };
  }, []); // Empty dependency array is correct, it sets up the instance once.

  const getAudioDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
      setDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDevice) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      toast.error('Unable to access audio devices. Please grant permission.');
    }
  };
  
  const updateAudioLevel = () => {
    if (analyserRef.current && audioContextRef.current && audioContextRef.current.state === 'running') {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const startRecording = async () => {
    if (!recognitionRef.current) return toast.error("Speech Recognition not available.");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDevice ? { exact: selectedDevice } : undefined }
      });
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      updateAudioLevel();

      recognitionRef.current.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Could not start recording. Check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (audioContextRef.current) audioContextRef.current.close().catch();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    setAudioLevel(0);
    setIsRecording(false);
    toast.success('Recording stopped');
  };

  const clearTranscript = () => {
    setTranscript('');
    toast.success('Transcript cleared');
  };

  const handleGeneratePoll = async () => {
    if (!transcript.trim()) {
        toast.error("Please provide some text first.");
        return;
    }
    setIsGenerating(true);
    const generationToast = toast.loading('Generating poll...');
    try {
        const response = await fetch('http://localhost:5000/api/generate-poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "An unknown error occurred.");
        toast.success('Poll generated!', { id: generationToast });
        onPollGenerated(data, transcript);
        setTranscript('');
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate poll.";
        toast.error(message, { id: generationToast });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Audio Capture</h1>
        <p className="text-gray-300">Capture audio or paste text to generate interactive polls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* --- UI Section --- All this JSX is correct and can remain the same --- */}
        <GlassCard className="p-6 col-span-1">
          <div className="text-center">
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 mx-auto transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500/20 border-2 border-red-500 text-red-400 animate-pulse' 
                  : 'bg-electric-cyan/20 border-2 border-electric-cyan text-electric-cyan hover:bg-electric-cyan/30'
              }`}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </motion.button>
            <h3 className="text-xl font-semibold text-white mb-2">{isRecording ? 'Recording...' : 'Ready to Record'}</h3>
            <p className="text-gray-300 text-sm mb-4">{isRecording ? 'Click to stop' : 'Click the mic to start'}</p>
            <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6 col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Waves className="w-5 h-5 mr-2 text-electric-cyan" /> Audio Level
          </h3>
          <div className="space-y-4">
            <div className="progress-bar h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="progress-fill h-full bg-electric-cyan"
                animate={{ width: `${audioLevel * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
            <div className="flex justify-center">
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-r from-electric-cyan to-vibrant-magenta flex items-center justify-center"
                animate={{ scale: 1 + audioLevel * 0.3, opacity: 0.7 + audioLevel * 0.3 }}
                transition={{ duration: 0.1 }}
              >
                <Volume2 className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            <p className="text-center text-gray-300 text-sm">{isRecording ? 'Listening...' : 'Microphone inactive'}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Session Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Words:</span>
              <span className="text-white font-medium">{transcript.split(' ').filter(Boolean).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className={isRecording ? "text-green-400 font-medium" : "text-gray-400 font-medium"}>
                {isRecording ? "Active" : "Idle"}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      <AnimatePresence>{showSettings && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6"><GlassCard className="p-6"><h3 className="text-lg font-semibold text-white mb-4">Audio Settings</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-300 mb-2">Microphone Device</label><select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} className="glass-input w-full" disabled={isRecording}>{devices.map(device => (<option key={device.deviceId} value={device.deviceId}>{device.label}</option>))}</select></div></div></GlassCard></motion.div>)}</AnimatePresence>

      {/* --- THIS IS THE FIXED SECTION --- */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Live Transcript</h3>
          <button onClick={clearTranscript} className="btn-secondary text-sm" disabled={!transcript}>Clear</button>
        </div>

        {/* --- FIX: Replaced <p> with <textarea> and added onChange --- */}
        <textarea
          className="bg-charcoal/30 rounded-lg p-4 w-full text-white leading-relaxed min-h-32 max-h-64 overflow-y-auto"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={isRecording ? 'Listening for speech...' : 'Start recording or paste text here'}
        />
        
        <div className="mt-4">
          <button
            onClick={handleGeneratePoll}
            className="btn-primary w-full"
            disabled={isGenerating || !transcript.trim()} // No need to check for isRecording, can generate from pasted text.
          >
            {isGenerating ? 'Generating Poll...' : 'Create Poll from Transcript'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default AudioCapturePanel;