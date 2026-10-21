import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Send,
  Trash2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Mic,
  MicOff,
  HardDrive,
  Radio,
  Volume2,
  VolumeX,
  MessageSquare,
  Square,
  Monitor,
  Eye,
  EyeOff,
  Camera,
  Scan,
  Maximize2,
  X,
  GraduationCap,
  BrainCircuit,
  Zap,
  Shield,
  MapPin,
  Music,
  Image as ImageIcon,
  Download,
  Pin,
  Clock,
} from 'lucide-react';
import { ChatMessage, DeviceConfig } from '../types';

interface TerminalViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClear: () => void;
  onOpenTeachModal: () => void;
  onOpenDriveModal: () => void;
  onOpenTraining?: () => void;
  onOpenMasterRule?: () => void;
  onOpenImageGen?: () => void;
  onOpenVoiceSettings?: () => void;
  deviceConfig?: DeviceConfig;
  onStartVoice: () => void;
  isProcessing: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isConversationMode: boolean;
  isScreenVisionActive: boolean;
  isScanningScreen: boolean;
  onToggleScreenShare: () => void;
  onAnalyzeScreen: (prompt?: string) => void;
  onToggleConversationMode: () => void;
  onStopSpeaking: () => void;
  transcript: string;
  isVoiceMuted: boolean;
  onToggleMute: () => void;
}

export function TerminalView({
  messages,
  onSendMessage,
  onClear,
  onOpenTeachModal,
  onOpenDriveModal,
  onOpenTraining,
  onOpenMasterRule,
  onOpenImageGen,
  onOpenVoiceSettings,
  deviceConfig,
  onStartVoice,
  isProcessing,
  isListening,
  isSpeaking,
  isConversationMode,
  isScreenVisionActive,
  isScanningScreen,
  onToggleScreenShare,
  onAnalyzeScreen,
  onToggleConversationMode,
  onStopSpeaking,
  transcript,
  isVoiceMuted,
  onToggleMute,
}: TerminalViewProps) {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Command history for up/down arrows
  const userHistory = messages.filter((m) => m.sender === 'user').map((m) => m.text);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, transcript, isScanningScreen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
    setHistoryIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (userHistory.length === 0) return;
      const nextIndex = historyIndex === null ? userHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(userHistory[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= userHistory.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(userHistory[nextIndex] || '');
      }
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickCommands = [
    { label: '📊 zdaj raport na dzisiaj', cmd: 'zdaj raport na dzisiaj' },
    { label: '🛡️ reguły', cmd: 'pokaż główne reguły' },
    { label: '📍 lokalizacja', cmd: 'jaka jest moja lokalizacja?' },
    { label: '🎵 muzyka', cmd: 'włącz moją muzykę' },
    { label: 'cześć', cmd: 'cześć' },
    { label: 'godzina', cmd: 'godzina' },
    { label: '🔥 slang: rizz & sigma', cmd: 'co oznacza rizz, sigma i rel?' },
    { label: '⚡ podszkol się', cmd: 'podszkol się' },
    { label: '🧠 co pamiętasz?', cmd: 'co pamiętasz?' },
    { label: 'co widzisz na ekranie', cmd: 'co widzisz na ekranie' },
    { label: 'dysk (Google Drive)', cmd: 'dysk' },
    { label: 'ucz się...', cmd: 'ucz się ' },
  ];

  return (
    <div
      id="jarvis-terminal-panel"
      className="flex flex-col h-full bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md font-['Fira_Code']"
    >
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40 inline-block" />
          </div>
          <span className="flex items-center gap-1.5 font-semibold text-slate-300 ml-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            python3 advanced_jarvis.py
          </span>
          {isConversationMode && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 text-[10px] animate-pulse">
              <Radio className="w-3 h-3 text-red-400 animate-spin" />
              Tryb Rozmowy Aktywny
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Settings Button */}
          {onOpenVoiceSettings && (
            <button
              id="btn-terminal-voice-settings"
              onClick={onOpenVoiceSettings}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-cyan-300 text-[11px] font-sans font-medium transition-all cursor-pointer"
              title="Kalibracja głosu męskiego & ludzkiego Jarvis"
            >
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span className="hidden lg:inline">Głos Męski</span>
            </button>
          )}

          {/* Master Rule & Device Config Button */}
          {onOpenMasterRule && (
            <button
              id="btn-terminal-master-rule"
              onClick={onOpenMasterRule}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 text-[11px] font-sans font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer"
              title="Główna Reguła, Lokalizacja & Odtwarzacz Muzyki"
            >
              <Shield className="w-3 h-3 text-cyan-400" />
              <span className="hidden md:inline">Reguła & Urządzenie</span>
            </button>
          )}

          {/* Training Button */}
          {onOpenTraining && (
            <button
              id="btn-terminal-training"
              onClick={onOpenTraining}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 text-[11px] font-sans font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)] cursor-pointer"
              title="Centrum Szkolenia & Auto-Uczenia Jarvisa"
            >
              <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
              <span className="hidden md:inline">Podszkol</span>
            </button>
          )}

          {/* Screen Share Button */}
          <button
            id="btn-terminal-screen"
            onClick={onToggleScreenShare}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-all cursor-pointer ${
              isScreenVisionActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-cyan-300 hover:border-cyan-500/50'
            }`}
            title={
              isScreenVisionActive
                ? 'Wizja ekranu aktywna (kliknij, aby odłączyć)'
                : 'Daj Jarvisowi dostęp do ekranu'
            }
          >
            {isScreenVisionActive ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden lg:inline">Ekran aktywny</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden lg:inline">Dostęp do ekranu</span>
              </>
            )}
          </button>

          <button
            id="btn-quick-conversation"
            onClick={onToggleConversationMode}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-all cursor-pointer ${
              isConversationMode
                ? 'bg-red-600/30 text-red-300 border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title={
              isConversationMode
                ? 'Wyłącz tryb ciągłej rozmowy'
                : 'Włącz tryb ciągłej rozmowy głosowej (Jarvis słucha i mówi do Ciebie)'
            }
          >
            <MessageSquare className={`w-3.5 h-3.5 ${isConversationMode ? 'text-red-400' : 'text-cyan-400'}`} />
            <span className="hidden md:inline">
              {isConversationMode ? 'Zakończ rozmowę' : 'Tryb Dialogu'}
            </span>
          </button>

          <button
            id="btn-quick-image-gen"
            onClick={onOpenImageGen}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
            title="Otwórz generator obrazów i grafik Stark AI"
          >
            <ImageIcon className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Generuj Obraz</span>
          </button>

          <button
            id="btn-quick-teach"
            onClick={onOpenTeachModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
            title="Dodaj nową komendę do pamięci"
          >
            <BookOpen className="w-3 h-3" />
            <span>Ucz się</span>
          </button>

          <button
            id="btn-quick-drive"
            onClick={onOpenDriveModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-colors cursor-pointer"
            title="Otwórz pliki Google Drive"
          >
            <HardDrive className="w-3 h-3" />
            <span>Dysk</span>
          </button>

          <button
            id="btn-toggle-sound"
            onClick={onToggleMute}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isVoiceMuted ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
            title={isVoiceMuted ? 'Włącz głos Jarvisa' : 'Wycisz głos Jarvisa'}
          >
            {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-terminal-clear"
            onClick={onClear}
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Wyczyść terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-sm scroll-smooth">
        {/* Startup banner */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-cyan-500/20 text-cyan-400 text-xs leading-relaxed">
          <p className="font-bold text-cyan-300 font-['Orbitron']">--- Jarvis System Aktywny [v2.5 Python Engine] ---</p>
          <p className="text-slate-400 mt-1">
            Komendy specjalne: <span className="text-amber-400 font-semibold">'wyjście'</span>,{' '}
            <span className="text-cyan-300 font-semibold">'ucz się [komenda] = [odpowiedź]'</span>,{' '}
            <span className="text-blue-300 font-semibold">'dysk'</span>,{' '}
            <span className="text-purple-300 font-semibold">'szukaj [nazwa]'</span>.
          </p>
          <p className="text-slate-300 mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span>Kliknij ikonę mikrofonu lub <strong>'Tryb Dialogu'</strong>, aby rozmawiać na głos z Jarvisem!</span>
          </p>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="group relative transition-all">
            {msg.sender === 'user' ? (
              <div className="flex items-start gap-2 text-slate-200">
                <span className="text-emerald-400 font-bold select-none shrink-0">Ty &gt;</span>
                <div className="flex-1 break-words font-medium">
                  {msg.text.startsWith('ucz się') ? (
                    <span>
                      <span className="text-amber-400 font-semibold">ucz się </span>
                      {msg.text.replace(/^ucz się\s*/i, '')}
                    </span>
                  ) : (
                    msg.text
                  )}
                  {msg.isVoice && (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-red-400/90 font-sans px-1.5 py-0.2 bg-red-950/40 border border-red-500/30 rounded">
                      <Mic className="w-2.5 h-2.5" /> głosowo
                    </span>
                  )}
                </div>
              </div>
            ) : msg.sender === 'jarvis' ? (
              <div className="flex items-start gap-2 text-cyan-300 pl-2 border-l-2 border-cyan-500/40 py-0.5">
                <span className="text-cyan-400 font-bold select-none shrink-0">Jarvis:</span>
                <div className="flex-1 break-words whitespace-pre-wrap leading-relaxed text-slate-100 space-y-2">
                  {/* Screen snapshot attachment if visual vision was used */}
                  {msg.screenSnapshot && (
                    <div className="relative inline-block rounded-lg overflow-hidden border border-cyan-500/40 group/snap bg-black/60 my-1 max-w-sm">
                      <img
                        src={msg.screenSnapshot}
                        alt="Zrzut ekranu Jarvis Vision"
                        referrerPolicy="no-referrer"
                        className="max-h-48 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setPreviewImage(msg.screenSnapshot || null)}
                      />
                      <div
                        onClick={() => setPreviewImage(msg.screenSnapshot || null)}
                        className="absolute bottom-1 right-1 bg-slate-950/80 hover:bg-cyan-950 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer border border-cyan-500/30"
                      >
                        <Maximize2 className="w-2.5 h-2.5" /> Powiększ
                      </div>
                    </div>
                  )}

                  {/* Generated Image Attachment if Image Generator was used */}
                  {msg.generatedImageUrl && (
                    <div className="relative inline-block rounded-xl overflow-hidden border border-cyan-500/40 group/img bg-slate-950/90 my-2 max-w-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                      <div className="p-2 border-b border-cyan-500/20 bg-slate-900/60 flex items-center justify-between text-[11px] font-mono text-cyan-300">
                        <span className="flex items-center gap-1.5 font-bold">
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span>STARK AI IMAGE SYNTHESIS</span>
                        </span>
                        {msg.imageStyle && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[9px]">
                            {msg.imageStyle}
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <img
                          src={msg.generatedImageUrl}
                          alt={msg.imagePrompt || 'Wygenerowany obraz'}
                          referrerPolicy="no-referrer"
                          className="max-h-72 w-full object-contain rounded cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setPreviewImage(msg.generatedImageUrl || null)}
                        />
                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={msg.generatedImageUrl}
                            download={`jarvis-generated-${Date.now()}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-950/90 hover:bg-cyan-950 text-cyan-300 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 border border-cyan-500/40 shadow-md"
                            title="Pobierz obraz"
                          >
                            <Download className="w-3 h-3" /> Pobierz
                          </a>
                          <button
                            onClick={() => setPreviewImage(msg.generatedImageUrl || null)}
                            className="bg-slate-950/90 hover:bg-cyan-950 text-cyan-300 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 border border-cyan-500/40 shadow-md"
                            title="Powiększ obraz"
                          >
                            <Maximize2 className="w-3 h-3" /> Powiększ
                          </button>
                        </div>
                      </div>
                      {msg.imagePrompt && (
                        <div className="p-2 text-[11px] text-slate-300 font-sans border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
                          <span className="truncate italic">"{msg.imagePrompt}"</span>
                          {msg.imageAspectRatio && (
                            <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                              {msg.imageAspectRatio}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>{msg.text}</div>

                  {msg.autoLearnedFact && (
                    <div className="p-2.5 rounded-lg bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-500/40 text-xs text-purple-200 flex items-start gap-2 shadow-sm font-sans animate-fade-in">
                      <BrainCircuit className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[11px] text-purple-300 font-['Orbitron'] flex items-center gap-1.5">
                          <span>AUTONOMICZNIE ZAPAMIĘTANO NOWY FAKT</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 border border-purple-400/40 text-purple-200">
                            AUTO-LEARN
                          </span>
                        </div>
                        <div className="mt-1 text-slate-300">
                          <code className="text-cyan-300 font-mono font-semibold">{msg.autoLearnedFact.key}</code>
                          <span className="text-slate-400"> ➔ </span>
                          <span className="text-emerald-300 font-medium">"{msg.autoLearnedFact.value}"</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-0.5">
                    {msg.isScreenVision && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-sans px-1.5 py-0.5 bg-cyan-950/50 border border-cyan-500/40 rounded">
                        <Monitor className="w-2.5 h-2.5 text-cyan-400" /> Jarvis Vision
                      </span>
                    )}
                    {msg.isLearnedCommand && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-sans px-1.5 py-0.5 bg-amber-950/40 border border-amber-500/30 rounded">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> z pamięci
                      </span>
                    )}
                    {msg.isAiGenerated && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-300 font-sans px-1.5 py-0.5 bg-purple-950/40 border border-purple-500/30 rounded">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400" /> Gemini AI
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-sans px-1.5 py-0.5 bg-slate-900 border border-slate-700/60 rounded">
                      <Clock className="w-2.5 h-2.5 text-cyan-400" /> 14 dni pamięci
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={async () => {
                      try {
                        await fetch('/api/jarvis/permanent-notes', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: `Wskazówka Jarvisa (${msg.timestamp || 'Czat'})`,
                            content: msg.text,
                            type: 'tip',
                            category: 'Wskazówki',
                          }),
                        });
                        setCopiedId(`pin-${msg.id}`);
                        setTimeout(() => setCopiedId(null), 2000);
                      } catch (e) {
                        console.warn('Pin error:', e);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-amber-300 transition-colors"
                    title="Zapisz tę odpowiedź jako trwałą wskazówkę (zostaje na stałe)"
                  >
                    {copiedId === `pin-${msg.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Pin className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </button>
                  <button
                    onClick={() => copyText(msg.id, msg.text)}
                    className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                    title="Kopiuj odpowiedź"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic pl-6 py-0.5">
                [System: {msg.text}]
              </div>
            )}
          </div>
        ))}

        {isScanningScreen && (
          <div className="flex items-center gap-2 text-cyan-400 pl-2 border-l-2 border-cyan-500/60 py-1 animate-pulse bg-cyan-950/30 rounded-r-lg p-2">
            <Scan className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="font-bold">Jarvis Vision:</span>
            <span className="text-xs text-cyan-200">
              Analizuję zawartość Twojego ekranu przez Gemini Multimodal...
            </span>
          </div>
        )}

        {isProcessing && !isScanningScreen && (
          <div className="flex items-center gap-2 text-purple-400 pl-2 border-l-2 border-purple-500/40 py-1 animate-pulse">
            <span className="font-bold">Jarvis:</span>
            <span className="text-xs text-slate-400">Przetwarzanie zapytania i analiza pamięci...</span>
          </div>
        )}

        {isSpeaking && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-semibold">Jarvis mówi do Ciebie...</span>
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 bg-cyan-400 rounded animate-bounce" />
                <span className="w-1 h-4 bg-cyan-300 rounded animate-bounce [animation-delay:0.15s]" />
                <span className="w-1 h-2.5 bg-cyan-400 rounded animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
            <button
              onClick={onStopSpeaking}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
            >
              <Square className="w-3 h-3 text-red-400" /> Przerwij
            </button>
          </div>
        )}

        {isListening && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs animate-pulse">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-red-400 animate-bounce" />
              <span className="font-semibold font-sans">
                {isConversationMode ? 'Tryb Rozmowy: Słucham Cię... powiedz coś!' : 'Słucham...'}
              </span>
              {transcript && (
                <span className="text-white italic bg-slate-900 px-2 py-0.5 rounded border border-red-500/30">
                  "{transcript}"
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] text-slate-400">Audio input aktywny</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions chips */}
      <div className="px-4 py-1.5 bg-slate-900/50 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-500 shrink-0 font-sans">Szybkie komendy:</span>
        {quickCommands.map((qc) => (
          <button
            key={qc.cmd}
            onClick={() => {
              if (qc.cmd === 'ucz się ') {
                setInput('ucz się ');
                inputRef.current?.focus();
              } else {
                onSendMessage(qc.cmd);
              }
            }}
            className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
          >
            {qc.label}
          </button>
        ))}
      </div>

      {/* Input Form matching Python `Ty > ` */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 relative mb-24 lg:mb-0">
        <span className="text-emerald-400 font-bold text-sm select-none pl-1">Ty &gt;</span>
        <input
          ref={inputRef}
          id="terminal-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isConversationMode
              ? 'Tryb dialogu aktywny... mów do mikrofonu lub wpisz wiadomość...'
              : "Wpisz komendę (np. 'godzina', 'data' lub 'ucz się komenda = odpowiedź')..."
          }
          disabled={isProcessing}
          className="flex-1 bg-transparent border-none text-slate-100 text-sm focus:outline-none placeholder:text-slate-600 font-['Fira_Code']"
          autoFocus
        />

        {/* Selected target element: Voice and conversation trigger button */}
        <button
          type="button"
          id="btn-terminal-mic"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onStartVoice();
          }}
          aria-label="Włącz mikrofon i rozmawiaj z Jarvisem"
          className={`p-2.5 rounded-lg border transition-all relative group flex items-center justify-center cursor-pointer select-none active:scale-95 ${
            isListening
              ? 'bg-red-600 text-white border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse ring-2 ring-red-400'
              : isConversationMode
              ? 'bg-red-950/90 text-red-300 border-red-500 hover:bg-red-900 ring-1 ring-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-cyan-300 hover:border-cyan-500/60 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]'
          }`}
          title={
            isListening
              ? 'Słucham... Kliknij, aby zatrzymać nagrywanie'
              : isConversationMode
              ? 'Rozmowa aktywna - kliknij, aby mówić lub zakończyć'
              : 'Mów do Jarvisa (kliknij, aby włączyć mikrofon)'
          }
        >
          {isListening ? (
            <div className="relative flex items-center justify-center">
              <Mic className="w-4 h-4 text-white animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
            </div>
          ) : (
            <Mic
              className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                isConversationMode ? 'text-red-400' : 'text-slate-300 group-hover:text-cyan-300'
              }`}
            />
          )}
        </button>

        <button
          type="submit"
          id="btn-terminal-send"
          disabled={!input.trim() || isProcessing}
          className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-slate-950 font-bold transition-all shadow-md cursor-pointer"
          title="Wyślij komendę"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Screen Snapshot Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-cyan-500/50 rounded-xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 border-b border-slate-800 text-xs text-cyan-300">
              <span className="flex items-center gap-1.5 font-['Orbitron']">
                <Monitor className="w-4 h-4 text-cyan-400" />
                Jarvis Optical Frame Capture
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 max-h-[80vh] overflow-auto flex items-center justify-center bg-black">
              <img
                src={previewImage}
                alt="Zrzut ekranu"
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

