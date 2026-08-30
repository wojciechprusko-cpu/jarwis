import React, { useRef, useEffect, useState } from 'react';
import {
  Monitor,
  Scan,
  Sparkles,
  Eye,
  EyeOff,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Camera,
  Layers,
} from 'lucide-react';
import { screenVision } from '../services/screen';

interface ScreenVisionWidgetProps {
  isActive: boolean;
  isScanning: boolean;
  onToggleScreenShare: () => void;
  onAnalyzeScreen: (prompt?: string) => void;
  onStopScreenShare: () => void;
}

export function ScreenVisionWidget({
  isActive,
  isScanning,
  onToggleScreenShare,
  onAnalyzeScreen,
  onStopScreenShare,
}: ScreenVisionWidgetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      const stream = screenVision.getMediaStream();
      if (stream && videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isActive]);

  const handleQuickScan = (promptText?: string) => {
    const frame = screenVision.captureFrame();
    if (frame) {
      setLastSnapshot(frame.dataUrl);
    }
    onAnalyzeScreen(promptText || customPrompt || 'Przeanalizuj to co widzisz na moim ekranie.');
    setCustomPrompt('');
  };

  return (
    <div
      id="jarvis-screen-vision-card"
      className={`rounded-xl border transition-all overflow-hidden ${
        isActive
          ? 'bg-slate-900/90 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
          : 'bg-slate-900/60 border-slate-800'
      }`}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide text-slate-100 font-['Rajdhani'] uppercase">
                Jarvis Optical Vision (Ekran)
              </h3>
              {isActive ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Wizja Aktywna
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full">
                  Rozłączony
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isActive
                ? 'Jarvis ma dostęp do Twojego ekranu i analizuje go w czasie rzeczywistym'
                : 'Udostępnij ekran, aby Jarvis mógł widzieć Twój pulpit, kod i aplikacje'}
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-screen-share"
          onClick={onToggleScreenShare}
          disabled={isScanning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
            isActive
              ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
          }`}
        >
          {isActive ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Odłącz Ekran</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Daj dostęp do ekranu</span>
            </>
          )}
        </button>
      </div>

      {/* Body Area */}
      <div className="p-4 space-y-3">
        {isActive ? (
          <div>
            {/* Live Video Feed Preview with Sci-Fi Scan Grid */}
            <div className="relative rounded-lg overflow-hidden border border-cyan-500/30 bg-black aspect-video max-h-52 w-full flex items-center justify-center group shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain bg-slate-950"
              />

              {/* Holographic Scan Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_50%,rgba(6,182,212,0.1)_100%)]" />
              <div className="absolute inset-0 pointer-events-none border border-cyan-500/20" />

              {/* Scanning Laser Line */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-[scan_2s_ease-in-out_infinite]" />
              )}

              {/* Sci-Fi HUD Corner Brackets */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

              {/* Status Badge */}
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5 bg-slate-950/85 px-2.5 py-1 rounded text-[11px] text-cyan-300 font-['Fira_Code'] border border-cyan-500/30">
                <Scan className={`w-3 h-3 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{isScanning ? 'Skanowanie Gemini AI...' : 'Wizja 1080p aktywna'}</span>
              </div>
            </div>

            {/* Quick Action Chips for Screen Analysis */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                id="btn-scan-screen-general"
                onClick={() => handleQuickScan('Przeanalizuj dokładnie to co widzisz na ekranie i podsumuj to.')}
                disabled={isScanning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Co widzisz na ekranie?</span>
              </button>

              <button
                id="btn-scan-screen-code"
                onClick={() =>
                  handleQuickScan(
                    'Sprawdź widoczny na ekranie kod lub terminal pod kątem błędów, ostrzeżeń i optymalizacji.'
                  )
                }
                disabled={isScanning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Przeanalizuj kod / błędy</span>
              </button>

              <button
                id="btn-scan-screen-summary"
                onClick={() =>
                  handleQuickScan('Streść w punktach najważniejsze informacje widoczne na otwartej stronie/dokumencie.')
                }
                disabled={isScanning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Streść dokument / www</span>
              </button>
            </div>

            {/* Custom Question for Screen */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPrompt.trim()) {
                    handleQuickScan(customPrompt);
                  }
                }}
                placeholder="Zadaj Jarvisowi pytanie o to, co jest na Twoim ekranie..."
                disabled={isScanning}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-600"
              />
              <button
                onClick={() => handleQuickScan(customPrompt)}
                disabled={isScanning || !customPrompt.trim()}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Zapytaj</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-950/50 border border-dashed border-slate-800 text-center">
            <Monitor className="w-8 h-8 text-cyan-400/60 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-200">
              Jarvis Vision jest gotowy do odbioru obrazu
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-3">
              Gdy nadasz mu dostęp do ekranu (cały pulpit, wybrane okno aplikacji lub kartę przeglądarki),
              Jarvis będzie widział Twój ekran i odpowiadał na pytania głosem lub tekstem.
            </p>
            <button
              onClick={onToggleScreenShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>Włącz Wizję Ekranu dla Jarvisa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
