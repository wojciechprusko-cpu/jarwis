import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
  Zap,
  Radio,
  Send,
  X,
  Smartphone,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { JarvisState } from '../types';

interface MobileVoiceDockProps {
  jarvisState: JarvisState;
  transcript: string;
  lastResponse: string;
  isConversationMode: boolean;
  isVoiceMuted: boolean;
  audioLevel: number; // 0 to 100
  onToggleVoice: () => void;
  onToggleConversationMode: () => void;
  onToggleMute: () => void;
  onStopSpeaking: () => void;
  onSendCommand: (cmd: string) => void;
  onCancelListening: () => void;
}

export function MobileVoiceDock({
  jarvisState,
  transcript,
  lastResponse,
  isConversationMode,
  isVoiceMuted,
  audioLevel,
  onToggleVoice,
  onToggleConversationMode,
  onToggleMute,
  onStopSpeaking,
  onSendCommand,
  onCancelListening,
}: MobileVoiceDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pressTimerRef = useRef<any>(null);
  const isPressingRef = useRef(false);

  const isListening = jarvisState === 'listening';
  const isProcessing = jarvisState === 'processing';
  const isSpeaking = jarvisState === 'speaking';

  // Quick prompt suggestions for mobile thumbs
  const mobileQuickPrompts = [
    '📊 Zdaj raport na dzisiaj',
    'Cześć Jarvis!',
    'Jaka jest godzina?',
    'Status systemów',
    'Jaka jest pogoda?',
    'Włącz moją muzykę',
    'Co pamiętasz?',
    'Kim jesteś?',
  ];

  // Handle push-to-talk press
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isPressingRef.current = true;
    pressTimerRef.current = setTimeout(() => {
      // If held for > 300ms, push-to-talk mode activated
      if (!isListening && isPressingRef.current) {
        onToggleVoice();
      }
    }, 250);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    // If was in push-to-talk hold and currently listening, stop and send
    if (isPressingRef.current && isListening) {
      onToggleVoice();
    }
    isPressingRef.current = false;
  };

  return (
    <div
      id="jarvis-mobile-voice-dock"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden pointer-events-none"
    >
      <div className="max-w-md mx-auto px-3 pb-3 pointer-events-auto">
        {/* Main Dock Container */}
        <div className="bg-slate-950/95 border border-cyan-500/40 rounded-3xl shadow-[0_-10px_35px_rgba(6,182,212,0.25)] backdrop-blur-xl overflow-hidden transition-all duration-300">
          
          {/* Top Status & Expand Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-['Orbitron']">
              <span
                className={`w-2 h-2 rounded-full ${
                  isListening
                    ? 'bg-red-500 animate-ping'
                    : isSpeaking
                    ? 'bg-emerald-400 animate-pulse'
                    : isProcessing
                    ? 'bg-purple-400 animate-spin'
                    : 'bg-cyan-400'
                }`}
              />
              <span className="font-bold text-[11px] tracking-wide text-cyan-300">
                {isListening
                  ? 'SŁUCHAM CIĘ...'
                  : isSpeaking
                  ? 'JARVIS ODPOWIADA'
                  : isProcessing
                  ? 'PRZETWARZAM...'
                  : 'JARVIS MOBILNY // GOTOWY'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Hands-Free Dialog Mode Toggle */}
              <button
                onClick={onToggleConversationMode}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                  isConversationMode
                    ? 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-cyan-300'
                }`}
                title="Przełącz ciągły tryb rozmowy (dialog bez klikania)"
              >
                {isConversationMode ? 'Dialog: WŁ' : 'Pojedyncza'}
              </button>

              {/* Mute Toggle */}
              <button
                onClick={onToggleMute}
                className={`p-1.5 rounded-lg border transition-all ${
                  isVoiceMuted
                    ? 'bg-red-950/40 border-red-500/40 text-red-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
                title={isVoiceMuted ? 'Dźwięk wyciszony' : 'Dźwięk aktywny'}
              >
                {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Expand Toggle */}
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 transition-colors"
                title="Więcej opcji mobilnych"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Live Transcript / Speech Wave Banner */}
          {(isListening || transcript) && (
            <div className="px-4 py-2.5 bg-slate-900/90 border-b border-cyan-500/20 text-xs">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Rozpoznana mowa (AI Whisper/Gemini):
                </span>
                <span className="text-emerald-400 font-mono">Auto-detekcja ciszy aktywna</span>
              </div>
              <p className="font-medium text-slate-100 italic min-h-[1.25rem]">
                {transcript ? `"${transcript}"` : 'Mów teraz do telefonu...'}
              </p>
            </div>
          )}

          {/* Central Touch Interaction Area */}
          <div className="p-3 flex items-center justify-between gap-3">
            
            {/* Left Button: Cancel or Quick Help */}
            <div className="flex-1 flex justify-start">
              {isListening ? (
                <button
                  onClick={onCancelListening}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Anuluj</span>
                </button>
              ) : isSpeaking ? (
                <button
                  onClick={onStopSpeaking}
                  className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 text-red-400" />
                  <span>Przerwij</span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-400 flex flex-col justify-center">
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Mobilny Stark OS
                  </span>
                  <span className="text-[9px] text-slate-500">Dotknij lub przytrzymaj</span>
                </div>
              )}
            </div>

            {/* Central Master Microphone Trigger Button */}
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Soundwave Halo during listening */}
              {isListening && (
                <>
                  <div
                    className="absolute inset-0 -m-3 rounded-full bg-cyan-500/20 animate-ping pointer-events-none"
                    style={{
                      transform: `scale(${1 + (audioLevel / 100) * 0.8})`,
                      opacity: Math.max(0.2, audioLevel / 100),
                    }}
                  />
                  <div
                    className="absolute inset-0 -m-1.5 rounded-full border border-cyan-400/60 pointer-events-none"
                    style={{
                      transform: `scale(${1 + (audioLevel / 100) * 0.4})`,
                    }}
                  />
                </>
              )}

              <button
                id="btn-mobile-master-mic"
                type="button"
                onClick={onToggleVoice}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                className={`relative w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer active:scale-95 shadow-xl ${
                  isListening
                    ? 'bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.7)] ring-4 ring-red-400/40'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.6)] ring-2 ring-emerald-400/40'
                    : isProcessing
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(147,51,234,0.6)] ring-2 ring-purple-400/40 animate-pulse'
                    : 'bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] ring-2 ring-cyan-300'
                }`}
                title={
                  isListening
                    ? 'Mówię... Dotknij, aby zakończyć i wysłać'
                    : 'Dotknij, aby mówić do Jarvisa (lub przytrzymaj)'
                }
              >
                {isListening ? (
                  <>
                    <Mic className="w-7 h-7 text-white animate-bounce" />
                    {/* Live Volume dB Mini Meter */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-white transition-all duration-75"
                          style={{
                            height: `${Math.max(3, (audioLevel / 100) * 12 * (i % 2 === 0 ? 1 : 0.7))}px`,
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : isSpeaking ? (
                  <Volume2 className="w-7 h-7 text-white animate-pulse" />
                ) : isProcessing ? (
                  <Sparkles className="w-7 h-7 text-white animate-spin" />
                ) : (
                  <Mic className="w-7 h-7 text-slate-950 drop-shadow" />
                )}
              </button>
            </div>

            {/* Right Button: Send Immediately or Quick Command */}
            <div className="flex-1 flex justify-end">
              {isListening ? (
                <button
                  onClick={onToggleVoice}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <span>Wyślij</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                >
                  <span>Komendy</span>
                  <ChevronUp className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

          </div>

          {/* Expanded Quick Commands Drawer for Mobile */}
          {isExpanded && (
            <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 bg-slate-900/40 animate-fade-in">
              <div className="text-[10px] text-slate-400 mb-1.5 font-semibold flex items-center justify-between">
                <span>Szybkie pytania głosem lub kliknięciem:</span>
                <span className="text-cyan-400 font-mono">10X Turbo</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {mobileQuickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      onSendCommand(prompt);
                      setIsExpanded(false);
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/50 text-[11px] text-slate-200 hover:text-cyan-300 transition-colors active:scale-95"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
