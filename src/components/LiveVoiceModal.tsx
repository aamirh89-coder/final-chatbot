import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, Activity } from 'lucide-react';
import { AppSettings } from '../types';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSendPrompt: (prompt: string) => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSendPrompt,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('Tap microphone to start real-time speech interaction');

  if (!isOpen) return null;

  const toggleMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isActive) {
      setIsActive(false);
      setStatusMessage('Voice interaction paused.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsActive(true);
        setStatusMessage('Listening to your voice... Speak naturally.');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsActive(false);
        setStatusMessage('Microphone disconnected or permission denied.');
      };

      recognition.onend = () => {
        setIsActive(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Live voice error:', err);
      setIsActive(false);
    }
  };

  const handleSendToChat = () => {
    if (transcript.trim()) {
      onSendPrompt(transcript.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 shadow-2xl p-6 flex flex-col items-center text-center space-y-6 overflow-hidden">
        {/* Glow halo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-secondary-container/30 via-primary-container/20 to-tertiary/20 blur-3xl rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
          aria-label="Close voice modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-xs font-mono text-tertiary border border-outline-variant/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini Live Audio Bridge</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Gemini Live</h2>
          <p className="text-xs text-on-surface-variant font-mono">{settings.model}</p>
        </div>

        {/* Visual Pulse Orb */}
        <div className="relative w-36 h-36 flex items-center justify-center my-2">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-tr from-secondary via-primary to-tertiary opacity-40 blur-2xl transition-all duration-700 ${
              isActive ? 'scale-125 animate-pulse' : 'scale-90'
            }`}
          />
          <div
            className={`relative w-28 h-28 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/20 shadow-2xl transition-all duration-300 ${
              isActive ? 'ring-4 ring-tertiary/40' : ''
            }`}
          >
            {isActive ? (
              <Activity className="w-12 h-12 text-tertiary animate-pulse" />
            ) : (
              <Volume2 className="w-12 h-12 text-outline" />
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-1.5 max-w-xs">
          <p className="text-xs font-mono text-primary font-medium">{statusMessage}</p>
          {transcript && (
            <div className="p-3 rounded-xl bg-surface-container-lowest text-left text-xs font-mono text-on-surface border border-outline-variant/20 max-h-24 overflow-y-auto">
              "{transcript}"
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isActive
                ? 'bg-error text-on-error shadow-error/30 animate-pulse'
                : 'bg-gradient-to-tr from-secondary-container via-primary-container to-tertiary text-on-primary shadow-primary/30 hover:opacity-95 active:scale-95'
            }`}
            title={isActive ? 'Mute microphone' : 'Start listening'}
          >
            {isActive ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {transcript && (
            <button
              onClick={handleSendToChat}
              className="px-4 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-md hover:opacity-95 transition-all"
            >
              Send to Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
