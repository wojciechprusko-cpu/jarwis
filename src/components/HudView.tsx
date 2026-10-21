import { useState, useEffect } from 'react';
import { ArcReactor } from './ArcReactor';
import { JarvisState, SystemStats, DeviceConfig } from '../types';
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
  MapPin,
  Music,
  Shield,
  Sliders,
  Play,
  Image as ImageIcon,
} from 'lucide-react';

interface HudViewProps {
  jarvisState: JarvisState;
  systemStats: SystemStats;
  lastResponse: string;
  transcript: string;
  isConversationMode: boolean;
  isScreenVisionActive: boolean;
  isScanningScreen: boolean;
  deviceConfig?: DeviceConfig;
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
  onOpenMasterRule?: () => void;
  onOpenImageGen?: () => void;
  onOpenVoiceSettings?: () => void;
  onTriggerMusic?: () => void;
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
  deviceConfig,
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
  onOpenMasterRule,
  onOpenImageGen,
  onOpenVoiceSettings,
  onTriggerMusic,
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

  const activeRulesCount =
    deviceConfig?.mandatoryRules?.filter((r) => r.enabled).length || 5;

  return (
    <div id="jarvis-hud-container" className="flex flex-col h-full space-y-4">
      {/* Top Telemetry Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Turbo 10X Compute Power Card */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/80 via-slate-900/90 to-blue-950/80 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between text-xs text-cyan-300">
            <span className="flex items-center gap-1 font-['Orbitron'] font-bold">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> MOC 10X
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              TURBO
            </span>
          </div>
          <div className="mt-1 text-sm sm:text-base font-bold font-['Orbitron'] text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>128 TFLOPS</span>
          </div>
          <div className="text-[10px] text-cyan-400 font-mono mt-0.5 truncate">
            Gemini 3.6 Flash (~140ms)
          </div>
        </div>

        {/* Masculine Voice Calibration Card */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-['Orbitron']">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> GŁÓS JARVISA
            </span>
            {onOpenVoiceSettings && (
              <button
                onClick={onOpenVoiceSettings}
                className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 transition-colors cursor-pointer"
              >
                Ustaw
              </button>
            )}
          </div>
          <div className="mt-1 text-sm sm:text-base font-bold font-['Orbitron'] text-cyan-300">
            Męski Bariton
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Ludzka kadencja (pitch 0.88)
          </div>
        </div>

        {/* Master Directives Card */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-['Orbitron']">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> GŁÓWNA REGUŁA
            </span>
            <button
              onClick={onOpenMasterRule}
              className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 transition-colors cursor-pointer"
            >
              Opcje
            </button>
          </div>
          <div className="mt-1 text-sm sm:text-base font-bold font-['Orbitron'] text-cyan-300">
            {activeRulesCount} nakazów
          </div>
          <button
            onClick={onOpenMasterRule}
            className="text-[11px] text-cyan-400/80 hover:text-cyan-300 underline mt-0.5 block text-left cursor-pointer"
          >
            Edytuj reguły Stark OS
          </button>
        </div>

        {/* Dual-Tier Memory Card */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-['Orbitron']">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> PAMIĘĆ & WIEDZA
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30 font-mono">
              14D+STAŁE
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2 font-['Orbitron']">
            <span className="text-base sm:text-lg font-bold text-amber-300">
              {systemStats.permanentInsightsCount ?? 2} <span className="text-[10px] text-amber-400/80 font-normal">stałych</span>
            </span>
            <span className="text-xs text-cyan-400 font-mono">
              / {systemStats.conversations14DaysCount ?? 0} <span className="text-[10px] text-slate-400">w 14d</span>
            </span>
          </div>
          <button
            onClick={onOpenMemory}
            className="text-[11px] text-amber-400/80 hover:text-amber-300 underline mt-0.5 block text-left cursor-pointer truncate"
          >
            Wskazówki & bufor 2 tyg.
          </button>
        </div>

        {/* AI Engine & Music Card */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-['Orbitron']">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> SILNIK & MUZYKA
            </span>
            <button
              onClick={onToggleAiMode}
              className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30 hover:bg-purple-900 transition-colors cursor-pointer"
            >
              Tryb
            </button>
          </div>
          <div className="mt-1 text-xs sm:text-sm font-bold font-['Orbitron'] text-purple-300 truncate">
            {systemStats.aiMode === 'hybrid' ? 'Gemini 3.6 Turbo' : 'Tylko Reguły'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            Audio: <span className="text-purple-300 font-semibold">{deviceConfig?.defaultMusicService.toUpperCase() || 'SPOTIFY'}</span>
          </div>
        </div>

        {/* Clock Card */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-['Orbitron']">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> CZAS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-['Orbitron'] text-cyan-300 tracking-wider">
            {liveClock || '--:--:--'}
          </div>
          <div className="text-[10px] text-slate-400 capitalize truncate mt-0.5">{liveDate}</div>
        </div>

      </div>

      {/* Main Visual Core Stage */}
      <div className="flex-1 min-h-[300px] sm:min-h-[360px] rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 p-4 sm:p-6 flex flex-col items-center justify-between relative overflow-hidden backdrop-blur-lg shadow-2xl pb-24 lg:pb-6">
        {/* Futuristic grid background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Top Control Header in Core Stage */}
        <div className="w-full flex items-center justify-between gap-2 z-10 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-['Orbitron']">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="hidden xs:inline text-[11px] font-bold text-cyan-300">STARK PROTOCOL 4.2</span>
            <span className="xs:hidden text-[10px] font-bold text-cyan-300">JARVIS 4.2</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Master Rule Quick Button */}
            {onOpenMasterRule && (
              <button
                onClick={onOpenMasterRule}
                className="px-2 sm:px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Otwórz konfigurację głównej reguły, lokalizacji i muzyki"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Reguła & Urządzenie</span>
              </button>
            )}

          {/* Screen Vision Quick Toggle */}
          <button
            onClick={onToggleScreenShare}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              systemStats.voiceMuted
                ? 'bg-red-950/40 border-red-500/40 text-red-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-cyan-400'
            }`}
            title={systemStats.voiceMuted ? 'Dźwięk wyciszony' : 'Dźwięk aktywny'}
          >
            {systemStats.voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        
        {/* Master Rule Quick Card */}
        <button
          onClick={onOpenMasterRule}
          className="p-3 rounded-xl bg-slate-900/70 hover:bg-cyan-950/50 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)]"
        >
          <div className="text-xs text-cyan-400 font-['Orbitron'] flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> GŁÓWNA REGUŁA
          </div>
          <div className="text-xs font-semibold text-slate-200 mt-1 flex items-center justify-between">
            <span>Ustawienia & Nakazy</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Image Gen Quick Card */}
        <button
          onClick={onOpenImageGen}
          className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/60 via-slate-900/80 to-blue-950/60 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-500/40 hover:border-cyan-300 text-left transition-all group cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          <div className="text-xs text-cyan-300 font-['Orbitron'] flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> GENERUJ OBRAZ
          </div>
          <div className="text-xs font-bold text-white mt-1 flex items-center justify-between">
            <span>Synteza Stark AI</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        {/* Music Quick Card */}
        <button
          onClick={onTriggerMusic || (() => onExecuteCommand('włącz moją muzykę'))}
          className="p-3 rounded-xl bg-slate-900/70 hover:bg-purple-950/50 border border-purple-500/30 hover:border-purple-400 text-left transition-all group cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.15)]"
        >
          <div className="text-xs text-purple-400 font-['Orbitron'] flex items-center gap-1">
            <Music className="w-3.5 h-3.5" /> MOJA MUZYKA
          </div>
          <div className="text-xs font-semibold text-slate-200 mt-1 flex items-center justify-between">
            <span>{deviceConfig?.defaultMusicService.toUpperCase() || 'SPOTIFY'}</span>
            <Play className="w-3 h-3 text-purple-400 fill-purple-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>

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
          <div className="text-xs text-slate-400 group-hover:text-cyan-400 font-['Orbitron']">CZAS & LOKACJA</div>
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
          onClick={onSwitchToTerminal}
          className="p-3 rounded-xl bg-slate-900/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-left transition-all group cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="text-xs text-cyan-400/80 group-hover:text-cyan-400 font-['Orbitron']">KONSOLA CLI</div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center justify-between">
            Terminal
            <Terminal className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>
    </div>
  );
}
