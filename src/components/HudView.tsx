import { useState, useEffect } from 'react';
import { ArcReactor } from './ArcReactor';
import { JarvisState, SystemStats } from '../types';
import { ScreenVisionWidget } from './ScreenVisionWidget';
import {
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  HardDrive,
  Clock,
  BookOpen,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Monitor,
  GraduationCap,
  Zap,
} from 'lucide-react';

interface HudViewProps {
  jarvisState: JarvisState;
  systemStats: SystemStats;
  lastResponse: string;
  transcript: string;
  isConversationMode: boolean;
  isScreenVisionActive: boolean;
  isScanningScreen: boolean;
  onToggleConversationMode: () => void;
  onToggleVoice: () => void;
  onToggleMute: () => void;
  onStopSpeaking: () => void;
  onToggleAiMode: () => void;
  onExecuteCommand: (cmd: string) => void;
  onToggleScreenShare: () => void;
  onAnalyzeScreen: (prompt?: string) => void;
  onStopScreenShare: () => void;
  onOpenDrive: () => void;
  onOpenMemory: () => void;
  onOpenTeach: () => void;
  onOpenTraining?: () => void;
  onSwitchToTerminal: () => void;
}

export function HudView({
  jarvisState,
  systemStats,
  lastResponse,
  transcript,
  isConversationMode,
  isScreenVisionActive,
  isScanningScreen,
  onToggleConversationMode,
  onToggleVoice,
  onToggleMute,
  onStopSpeaking,
  onToggleAiMode,
  onExecuteCommand,
  onToggleScreenShare,
  onAnalyzeScreen,
  onStopScreenShare,
  onOpenDrive,
  onOpenMemory,
  onOpenTeach,
  onOpenTraining,
  onSwitchToTerminal,
}: HudViewProps) {
  const [liveClock, setLiveClock] = useState('');
  const [liveDate, setLiveDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('pl-PL'));
      setLiveDate(
        now.toLocaleDateString('pl-PL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="jarvis-hud-container" className="flex flex-col h-full space-y-4">
      {/* Top Telemetry Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-['Orbitron']">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> CZAS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold font-['Orbitron'] text-cyan-300 tracking-wider">
            {liveClock || '--:--:--'}
          </div>
          <div className="text-[11px] text-slate-400 capitalize truncate mt-0.5">{liveDate}</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-['Orbitron']">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> PAMIĘĆ
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
              JSON
            </span>
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold font-['Orbitron'] text-amber-300">
            {systemStats.memoryEntriesCount} <span className="text-xs font-normal text-slate-400">komend</span>
          </div>
          <button
            onClick={onOpenMemory}
            className="text-[11px] text-amber-400/80 hover:text-amber-300 underline mt-0.5 block text-left"
          >
            Zarządzaj bazą wiedzy
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-['Orbitron']">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" /> GOOGLE DRIVE
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                systemStats.driveConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'
              }`}
            />
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold text-slate-200 truncate">
            {systemStats.driveConnected ? (
              <span className="text-emerald-400 flex items-center gap-1">
                Połączono ({systemStats.driveFilesCount} plików)
              </span>
            ) : (
              <span className="text-slate-400">Niepołączony</span>
            )}
          </div>
          <button
            onClick={onOpenDrive}
            className="text-[11px] text-blue-400/80 hover:text-blue-300 underline mt-0.5 block text-left"
          >
            {systemStats.driveConnected ? 'Przeglądaj pliki dysku' : 'Połącz z kontem Google'}
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-['Orbitron']">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> SILNIK AI
            </span>
            <button
              onClick={onToggleAiMode}
              className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30 hover:bg-purple-900 transition-colors"
            >
              Zmień tryb
            </button>
          </div>
          <div className="mt-1 text-sm sm:text-base font-bold font-['Orbitron'] text-purple-300 truncate">
            {systemStats.aiMode === 'hybrid' ? 'Gemini 3.7 + Python' : 'Tylko Reguły Python'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {systemStats.aiMode === 'hybrid' ? 'Autonomiczne odpowiedzi' : 'Ścisłe dopasowanie reguł'}
          </div>
        </div>
      </div>

      {/* Main Visual Core Stage */}
      <div className="flex-1 min-h-[300px] sm:min-h-[360px] rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 p-6 flex flex-col items-center justify-between relative overflow-hidden backdrop-blur-lg shadow-2xl">
        {/* Futuristic grid background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Ambient Corner Decors */}
        <div className="absolute top-3 left-4 flex items-center gap-2 text-xs text-slate-500 font-['Orbitron']">
          <ShieldCheck className="w-4 h-4 text-cyan-500" />
          <span>JARVIS PROTOCOL 4.2</span>
        </div>

        <div className="absolute top-3 right-4 flex items-center gap-2">
          {/* Screen Vision Quick Toggle */}
          <button
            onClick={onToggleScreenShare}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isScreenVisionActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40'
            }`}
            title={isScreenVisionActive ? 'Wizja ekranu jest aktywna (kliknij, aby rozłączyć)' : 'Daj Jarvisowi dostęp do ekranu'}
          >
            <Monitor className={`w-3.5 h-3.5 ${isScreenVisionActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>{isScreenVisionActive ? 'Ekran połączony' : 'Dostęp do ekranu'}</span>
          </button>

          <button
            id="btn-hud-conversation-mode"
            onClick={onToggleConversationMode}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
              isConversationMode
                ? 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40'
            }`}
            title={
              isConversationMode
                ? 'Rozmowa głosowa jest aktywna (kliknij, aby zatrzymać)'
                : 'Wymaga dostępu do mikrofonu — włącz ciągłą rozmowę głosową z Jarvisem'
            }
          >
            <Mic className={`w-3.5 h-3.5 ${isConversationMode ? 'text-red-400' : 'text-cyan-400'}`} />
            <span>{isConversationMode ? 'Rozmowa aktywna' : 'Włącz Rozmowę (Mikrofon)'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition-all ${
              systemStats.voiceMuted
                ? 'bg-red-950/40 border-red-500/40 text-red-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-cyan-400'
            }`}
            title={systemStats.voiceMuted ? 'Dźwięk wyciszony' : 'Dźwięk aktywny'}
          >
            {systemStats.voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Central Arc Reactor */}
        <div className="my-auto py-4 flex flex-col items-center">
          <ArcReactor state={jarvisState} onClick={onToggleVoice} size="lg" />

          {/* Voice transcript display */}
          {transcript && (
            <div className="mt-8 px-4 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-sm max-w-lg text-center animate-fade-in shadow-lg">
              <span className="text-xs text-slate-400 block font-sans">Rozpoznana mowa:</span>
              <span className="font-semibold italic">"{transcript}"</span>
            </div>
          )}
        </div>

        {/* Bottom Dialogue Box */}
        <div className="w-full max-w-2xl mt-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-slate-100 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-cyan-400 mb-1 font-['Orbitron'] font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                KOMUNIKAT JARVISA
              </span>
              <span className="text-[11px] text-slate-500 font-sans">Głos & Synteza mowy</span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-200 whitespace-pre-wrap">
              {lastResponse ||
                'Witaj! System Jarvis jest w pełnej gotowości. Możesz ze mną porozmawiać klikając reaktor, wpisując komendę lub dając mi dostęp do swojego ekranu.'}
            </p>
          </div>
        </div>
      </div>

      {/* Screen Vision Interactive Module */}
      <ScreenVisionWidget
        isActive={isScreenVisionActive}
        isScanning={isScanningScreen}
        onToggleScreenShare={onToggleScreenShare}
        onAnalyzeScreen={onAnalyzeScreen}
        onStopScreenShare={onStopScreenShare}
      />

      {/* Quick Action Matrix Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <button
          onClick={() => onExecuteCommand('cześć')}
          className="p-3 rounded-xl bg-slate-900/70 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
        >
          <div className="text-xs text-slate-400 group-hover:text-cyan-400 font-['Orbitron']">POWITANIE</div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center justify-between">
            "Cześć Jarvis"
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={() => onExecuteCommand('godzina')}
          className="p-3 rounded-xl bg-slate-900/70 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
        >
          <div className="text-xs text-slate-400 group-hover:text-cyan-400 font-['Orbitron']">CZAS SYSTEMOWY</div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center justify-between">
            "Która godzina?"
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={onOpenTraining || onOpenTeach}
          className="p-3 rounded-xl bg-gradient-to-br from-purple-950/50 via-slate-900/80 to-cyan-950/40 hover:from-purple-950/80 hover:to-cyan-950/70 border border-purple-500/40 hover:border-purple-400 text-left transition-all group shadow-[0_0_15px_rgba(168,85,247,0.2)] cursor-pointer"
        >
          <div className="text-xs text-purple-300 group-hover:text-purple-200 font-['Orbitron'] flex items-center gap-1">
            <Zap className="w-3 h-3 text-purple-400 animate-pulse" /> SZKOLENIE AI
          </div>
          <div className="text-sm font-bold text-slate-100 mt-0.5 flex items-center justify-between">
            Podszkol Jarvisa
            <GraduationCap className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={onOpenTeach}
          className="p-3 rounded-xl bg-slate-900/70 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
        >
          <div className="text-xs text-amber-400/80 group-hover:text-amber-400 font-['Orbitron']">NAUKA REGUŁ</div>
          <div className="text-sm font-semibold text-amber-200 mt-0.5 flex items-center justify-between">
            "Ucz się..."
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={onSwitchToTerminal}
          className="p-3 rounded-xl bg-slate-900/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-left transition-all group cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="text-xs text-cyan-400/80 group-hover:text-cyan-400 font-['Orbitron']">KONSOLA CLI</div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center justify-between">
            Otwórz Terminal
            <Terminal className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>
    </div>
  );
}
