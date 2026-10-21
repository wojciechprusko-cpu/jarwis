import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Copy,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
  Wand2,
  Check,
  Send,
  Layers,
  Ratio,
  Palette,
  Eye,
  Sliders,
  Share2,
  Compass,
} from 'lucide-react';
import { GeneratedImageItem, DeviceConfig } from '../types';
import { soundFx } from '../services/audio';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (item: GeneratedImageItem) => void;
  deviceConfig?: DeviceConfig;
  onSpeak?: (text: string) => void;
}

const STYLES = [
  { id: 'stark_hologram', name: 'Stark Hologram 3D', icon: '🔷', desc: 'Niebiesko-złoty interfejs HUD i schematy' },
  { id: 'photorealistic', name: 'Fotorealizm 8K', icon: '📸', desc: 'Ultra-realistyczne oświetlenie i tekstury' },
  { id: 'cinematic_marvel', name: 'Kinowy Marvel', icon: '🎬', desc: 'Epicki kadr filmowy z dramatycznym światłem' },
  { id: 'cyberpunk', name: 'Cyberpunk & Neon', icon: '🌆', desc: 'Futurystyczne miasto w deszczu z neonami' },
  { id: 'blueprint_schematic', name: 'Blueprint / CAD', icon: '📐', desc: 'Techniczny schemat inżynieryjny' },
  { id: 'concept_art', name: 'Concept Art', icon: '🎨', desc: 'Cyfrowe malarstwo artystyczne' },
  { id: 'anime_mecha', name: 'Anime Sci-Fi', icon: '⚡', desc: 'Dynamiczny styl anime & mecha' },
];

const RATIOS = [
  { id: '1:1', name: '1:1 (Kwadrat)', ratioClass: 'aspect-square', label: '1:1' },
  { id: '16:9', name: '16:9 (Krajobraz / Monitor)', ratioClass: 'aspect-video', label: '16:9' },
  { id: '9:16', name: '9:16 (Pion / Telefon)', ratioClass: 'aspect-[9/16]', label: '9:16' },
  { id: '4:3', name: '4:3 (Klasyczny)', ratioClass: 'aspect-[4/3]', label: '4:3' },
  { id: '3:4', name: '3:4 (Portret)', ratioClass: 'aspect-[3/4]', label: '3:4' },
];

const PRESETS = [
  'Pancerz Iron Man Mark 85 w locie nad ośnieżonymi szczytami gór',
  'Holograficzny stół laboratoryjny Stark Industries z modelem nowego reaktora',
  'Futurystyczny widok Warszawy nocą w stylu cyberpunk 2099',
  'Pancerz Hulkbuster przygotowujący się do skoku w hangarze',
  'Reaktor łukowy z pulsującą błękitną plazmą w zbliżeniu makro',
  'Laboratorium badawcze Stark Tower z widokiem na zachód słońca',
  'Supersamochód koncepcyjny z napędem antygrawitacyjnym w tunelu aerodynamicznym',
  'Kosmiczna stacja orbitalna Stark Industries z widokiem na Ziemię',
];

export function ImageGeneratorModal({
  isOpen,
  onClose,
  onSendToChat,
  deviceConfig,
  onSpeak,
}: ImageGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('stark_hologram');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<GeneratedImageItem | null>(null);
  const [history, setHistory] = useState<GeneratedImageItem[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = (customPrompt || prompt).trim();
    if (!textToUse) return;

    setIsGenerating(true);
    setErrorMsg(null);
    soundFx.playProcessing();

    try {
      const response = await fetch('/api/jarvis/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse,
          aspectRatio: selectedRatio,
          style: selectedStyle,
          userTitle: deviceConfig?.userTitle || 'Sir',
          deviceLocation: deviceConfig?.deviceLocation || 'Warszawa',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Nie udało się wygenerować obrazu.');
      }

      const newItem: GeneratedImageItem = {
        id: `img-${Date.now()}`,
        imageUrl: data.imageUrl,
        prompt: data.prompt,
        revisedPrompt: data.revisedPrompt,
        style: data.style,
        aspectRatio: data.aspectRatio,
        createdAt: data.timestamp || new Date().toLocaleTimeString('pl-PL'),
        modelUsed: data.modelUsed,
      };

      setCurrentResult(newItem);
      setHistory((prev) => [newItem, ...prev.slice(0, 15)]);
      soundFx.playSuccess();

      if (onSpeak) {
        onSpeak(`Obraz został pomyślnie wygenerowany, ${deviceConfig?.userTitle || 'Sir'}.`);
      }
    } catch (err: any) {
      console.error('Image Generation error:', err);
      soundFx.playAlert();
      setErrorMsg(err.message || 'Wystąpił błąd podczas generowania grafiki.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    soundFx.playBeep();
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownload = (item: GeneratedImageItem) => {
    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `jarvis-stark-gen-${Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundFx.playBeep();
  };

  const handleSendAndClose = (item: GeneratedImageItem) => {
    onSendToChat(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-orbitron text-cyan-300 tracking-wider">
                  STARK HOLOGRAPHIC IMAGE GENERATOR
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-400 rounded-full">
                  GEMINI AI NEURAL VISION
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Moduł syntezy wizualnej i renderowania scen wysokiej rozdzielczości
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zamknij"
          >
            ✕
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Controls & Prompt */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-cyan-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5" /> OPIS OBRAZU (PROMPT)
                </span>
                <span className="text-slate-400 text-[11px] font-normal">
                  {prompt.length}/500 znaków
                </span>
              </label>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleGenerate();
                    }
                  }}
                  placeholder="Opisz dokładnie, co Jarvis ma wygenerować (np. 'Pancerz Iron Man Mark 85 na tle warszawskiego wieżowca w nocy')..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-sm text-slate-100 placeholder-slate-500 resize-none font-sans transition-all shadow-inner"
                />
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-cyan-400" /> Szybkie inspiracje Stark OS:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(preset);
                        soundFx.playBeep();
                      }}
                      className="px-2.5 py-1 text-[11px] bg-slate-800/80 hover:bg-cyan-950/80 hover:border-cyan-500/50 border border-slate-700 text-slate-300 hover:text-cyan-300 rounded-lg text-left transition-all truncate max-w-full"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Style Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 font-mono">
                <Palette className="w-3.5 h-3.5" /> STYL ARTYSTYCZNY
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedStyle(style.id);
                      soundFx.playBeep();
                    }}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col gap-0.5 ${
                      selectedStyle === style.id
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-200">
                      <span>{style.icon}</span>
                      <span className="truncate">{style.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{style.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 font-mono">
                <Ratio className="w-3.5 h-3.5" /> PROPORCJE OBRAZU (ASPECT RATIO)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => {
                      setSelectedRatio(ratio.id);
                      soundFx.playBeep();
                    }}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      selectedRatio === ratio.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-mono">{ratio.label}</div>
                    <div className="text-[9px] text-slate-500 truncate">{ratio.name.split(' ')[1] || ''}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-300 font-mono">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Generate Action Button */}
            <button
              id="btn-trigger-image-generate"
              disabled={isGenerating || !prompt.trim()}
              onClick={() => handleGenerate()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold font-orbitron tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>RENDEROWANIE PRZEZ JARVIS...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950 fill-current" />
                  <span>SYNTEZUJ OBRAZ STARK AI</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Visual Preview & Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 font-mono flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> PODGLĄD RENDERU
              </span>
              {currentResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(currentResult)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-colors"
                    title="Pobierz plik PNG"
                  >
                    <Download className="w-3 h-3 text-cyan-400" /> Pobierz
                  </button>
                  <button
                    onClick={() => handleCopyLink(currentResult.imageUrl)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-colors"
                    title="Kopiuj link do obrazu"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    {copiedUrl ? 'Skopiowano!' : 'Kopiuj'}
                  </button>
                  <button
                    onClick={() => handleSendAndClose(currentResult)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-medium rounded-lg transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    title="Wyślij wygenerowany obraz do konwersacji z JARVIS"
                  >
                    <Send className="w-3 h-3 text-cyan-400" /> Do czatu
                  </button>
                </div>
              )}
            </div>

            {/* Display Canvas Box */}
            <div className="relative w-full aspect-square max-h-[380px] bg-slate-950/80 border border-cyan-500/30 rounded-2xl overflow-hidden flex items-center justify-center p-2 group shadow-inner">
              {/* Hologram Grid Backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-amber-500/30 border-b-amber-400 animate-spin [animation-direction:reverse]" />
                    <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-orbitron text-cyan-300">
                      GENEROWANIE PROCESU WIZYJNEGO
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Łączenie sieci neuronowej z modułem optyki Stark...
                    </p>
                  </div>
                </div>
              ) : currentResult ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                  <img
                    src={currentResult.imageUrl}
                    alt={currentResult.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-xl transition-all duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="font-semibold text-white truncate">{currentResult.prompt}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-cyan-400 font-mono">
                      <span>Styl: {currentResult.style}</span>
                      <span>•</span>
                      <span>Format: {currentResult.aspectRatio}</span>
                      <span>•</span>
                      <span>{currentResult.createdAt}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-6 text-center z-10 text-slate-500">
                  <ImageIcon className="w-12 h-12 text-slate-600 stroke-[1.5]" />
                  <p className="text-xs font-mono">
                    Wpisz polecenie lub wybierz preset po lewej stronie i naciśnij SYNTEZUJ OBRAZ.
                  </p>
                </div>
              )}
            </div>

            {/* Recent History Gallery */}
            {history.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 font-mono flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" /> HISTORIA SESJI ({history.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 pr-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentResult(item);
                        soundFx.playBeep();
                      }}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border transition-all ${
                        currentResult?.id === item.id
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                      title={item.prompt}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-cyan-500/20 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Zintegrowany z modułem głosu & lokalizacją: {deviceConfig?.deviceLocation || 'Warszawa'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Zamknij panel
          </button>
        </div>
      </div>
    </div>
  );
}
