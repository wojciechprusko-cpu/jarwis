import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Sliders,
  Play,
  Check,
  RotateCcw,
  X,
  Mic,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { speechService, VoiceSettings } from '../services/speech';
import { soundFx } from '../services/audio';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTitle?: string;
}

export function VoiceSettingsModal({ isOpen, onClose, userTitle = 'Sir' }: VoiceSettingsModalProps) {
  const [settings, setSettings] = useState<VoiceSettings>(speechService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [testText, setTestText] = useState(
    `Dzień dobry ${userTitle}. Moje moduły wokalne zostały skalibrowane na głęboki, męski tembr głosu o maksymalnej klarowności. Wszystkie systemy Stark OS meldują pełną gotowość.`
  );

  useEffect(() => {
    if (isOpen) {
      setSettings(speechService.getSettings());
      const voices = speechService.getVoices();
      setAvailableVoices(voices);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          setAvailableVoices(speechService.getVoices());
        };
      }
    }
  }, [isOpen, userTitle]);

  if (!isOpen) return null;

  const handlePitchChange = (pitch: number) => {
    const updated = { ...settings, pitch };
    setSettings(updated);
    speechService.saveSettings(updated);
  };

  const handleRateChange = (rate: number) => {
    const updated = { ...settings, rate };
    setSettings(updated);
    speechService.saveSettings(updated);
  };

  const handleVoiceChange = (voiceURI: string) => {
    const updated = { ...settings, selectedVoiceURI: voiceURI };
    setSettings(updated);
    speechService.saveSettings(updated);
    soundFx.playBeep();
  };

  const handleApplyPreset = (preset: 'deep_jarvis' | 'natural_male' | 'british_butler' | 'command_tactical') => {
    let pitch = 0.88;
    let rate = 1.04;

    if (preset === 'deep_jarvis') {
      pitch = 0.86; // Deep, commanding Stark JARVIS baritone
      rate = 1.04;
    } else if (preset === 'natural_male') {
      pitch = 0.92; // Natural conversational male
      rate = 1.02;
    } else if (preset === 'british_butler') {
      pitch = 0.95; // Sophisticated refined butler
      rate = 1.06;
    } else if (preset === 'command_tactical') {
      pitch = 0.82; // Tactical deep authoritative
      rate = 1.08;
    }

    const updated: VoiceSettings = {
      ...settings,
      pitch,
      rate,
      voicePreset: preset,
    };
    setSettings(updated);
    speechService.saveSettings(updated);
    soundFx.playSuccess();
  };

  const handleResetDefaults = () => {
    const defaultSettings: VoiceSettings = {
      pitch: 0.88,
      rate: 1.04,
      selectedVoiceURI: '',
      volume: 1.0,
      voicePreset: 'deep_jarvis',
      speechEngine: 'auto',
    };
    setSettings(defaultSettings);
    speechService.saveSettings(defaultSettings);
    soundFx.playBeep();
  };

  const handleTestSpeech = () => {
    setIsPlayingTest(true);
    speechService.speak(
      testText,
      'pl-PL',
      () => setIsPlayingTest(false),
      () => setIsPlayingTest(false)
    );
  };

  const polishVoices = availableVoices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('pl') ||
      v.name.toLowerCase().includes('polish') ||
      v.name.toLowerCase().includes('polski')
  );

  const englishMaleVoices = availableVoices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('en') &&
      !v.name.toLowerCase().includes('female') &&
      !v.name.toLowerCase().includes('zira') &&
      !v.name.toLowerCase().includes('jenny')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Orbitron'] flex items-center gap-2">
                SYNTEZA GŁOSU JARVISA
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                  MĘSKI & LUDZKI
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Kalibracja barwy głosu, tonacji baritonu i kadencji mowy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> PROFILE AKUSTYCZNE (MĘSKIE & HUMAN)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'deep_jarvis', name: 'Deep Stark', desc: 'Głęboki Bariton JARVIS', pitch: 0.86 },
                { id: 'natural_male', name: 'Naturalny Męski', desc: 'Ciepły ludzki głos', pitch: 0.92 },
                { id: 'british_butler', name: 'Paul Bettany', desc: 'Elegancki brytyjski', pitch: 0.95 },
                { id: 'command_tactical', name: 'Taktyczny', desc: 'Stanowczy dowódca', pitch: 0.82 },
              ].map((p) => {
                const isActive = settings.voicePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPreset(p.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                    {isActive && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
                        <Check className="w-3 h-3" /> Aktywny
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders: Pitch & Rate */}
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {/* Pitch */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Tonacja Głosu (Męski Bariton)
                </span>
                <span className="text-cyan-400 font-bold">
                  {settings.pitch.toFixed(2)} {settings.pitch < 0.9 ? '(Głęboki / Męski)' : '(Standard)'}
                </span>
              </div>
              <input
                type="range"
                min="0.70"
                max="1.15"
                step="0.02"
                value={settings.pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>Bardzo niski / Ultra-Głęboki</span>
                <span>Optymalny Męski (0.86 - 0.90)</span>
                <span>Wyższy</span>
              </div>
            </div>

            {/* Rate */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> Tempo Wypowiedzi (Kadencja)
                </span>
                <span className="text-cyan-400 font-bold">{settings.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.85"
                max="1.30"
                step="0.02"
                value={settings.rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>Spokojne (0.90x)</span>
                <span>Naturalna mowa (1.04x)</span>
                <span>Szybkie (1.25x)</span>
              </div>
            </div>
          </div>

          {/* Speech Engine Configuration for Mobile & Desktop */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-cyan-500/30">
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> SILNIK ROZPOZNAWANIA MOWY (TELEFON & DESKTOP)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                MOBILNY OK
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'auto',
                  title: 'Automatyczny (Zalecany)',
                  desc: 'Gemini na telefonach, Web Speech na desktopie',
                },
                {
                  id: 'gemini_media',
                  title: 'Gemini AI Transcribe',
                  desc: '100% zgodności z iPhone & Android',
                },
                {
                  id: 'web_speech',
                  title: 'Web Speech API',
                  desc: 'Wbudowane API przeglądarki',
                },
              ].map((engine) => {
                const isSelected = (settings.speechEngine || 'auto') === engine.id;
                return (
                  <button
                    key={engine.id}
                    onClick={() => {
                      const updated: VoiceSettings = { ...settings, speechEngine: engine.id as any };
                      setSettings(updated);
                      speechService.saveSettings(updated);
                      soundFx.playBeep();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{engine.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{engine.desc}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              ℹ️ Na telefonach z systemem iOS (Safari) oraz Android silnik Gemini Audio eliminuje blokady autoodtwarzania i błędy Apple Dictation.
            </p>
          </div>

          {/* Voice Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" /> Dedykowany Głos Silnika Przeglądarki
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                {polishVoices.length > 0 ? `${polishVoices.length} głosy PL` : 'Automatyczny dobór'}
              </span>
            </label>

            <select
              value={settings.selectedVoiceURI}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="">-- Automatyczny inteligentny wybór męskiego głosu --</option>
              {polishVoices.length > 0 && (
                <optgroup label="Głosy Języka Polskiego (PL)">
                  {polishVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
              {englishMaleVoices.length > 0 && (
                <optgroup label="Głosy Męskie Angielskie / Brytyjskie (JARVIS Style)">
                  {englishMaleVoices.slice(0, 8).map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Test Live Speech */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-2">
            <div className="text-xs font-mono text-slate-300 flex items-center justify-between">
              <span>Tekst Próbki Audio:</span>
              <button
                onClick={handleResetDefaults}
                className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                title="Przywróć domyślne ustawienia męskiego głosu"
              >
                <RotateCcw className="w-3 h-3" /> Przywróć optymalne
              </button>
            </div>
            <textarea
              rows={2}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleTestSpeech}
                disabled={isPlayingTest}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer transition-all"
              >
                {isPlayingTest ? (
                  <>
                    <Volume2 className="w-4 h-4 animate-bounce" /> Mówię próbkę...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Odtwórz Męski Głos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-500/30 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Optymalizacja: Niski Bariton & Filtry Anty-Robotic</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold transition-colors cursor-pointer"
          >
            Gotowe
          </button>
        </div>
      </div>
    </div>
  );
}
