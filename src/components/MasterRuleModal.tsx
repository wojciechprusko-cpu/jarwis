import React, { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Music,
  Sliders,
  Plus,
  Trash2,
  Check,
  Zap,
  Sparkles,
  ExternalLink,
  Navigation,
  Globe,
  Radio,
  X,
  RefreshCw,
  Play
} from 'lucide-react';
import { DeviceConfig, MasterDirective } from '../types';
import { soundFx } from '../services/audio';

interface MasterRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceConfig: DeviceConfig;
  onSaveDeviceConfig: (newConfig: DeviceConfig) => void;
  onTriggerMusic?: () => void;
}

export const DEFAULT_MANDATORY_RULES: MasterDirective[] = [
  {
    id: 'rule-title',
    title: 'Nadrzędny Tytuł Użytkownika',
    rule: 'Zwracaj się do mnie w każdej wypowiedzi ustalonym tytułem (np. Szef / Sir / Dowódca).',
    enabled: true,
    isSystemDefault: true,
  },
  {
    id: 'rule-location',
    title: 'Uwzględnianie Lokalizacji Urządzenia',
    rule: 'Zawsze automatycznie bierz pod uwagę bieżącą lokalizację mojego urządzenia przy pytaniach o pogodę, strefę czasową, wiadomości i otoczenie bez konieczności dopytywania.',
    enabled: true,
    isSystemDefault: true,
  },
  {
    id: 'rule-music',
    title: 'Domyślny Odtwarzacz & Ulubiona Muzyka',
    rule: 'Gdy proszę o włączenie muzyki lub mojej playlisty, odwołuj się do skonfigurowanego serwisu muzycznego i moich ulubionych utworów.',
    enabled: true,
    isSystemDefault: true,
  },
  {
    id: 'rule-stark-tone',
    title: 'Charyzma & Styl Stark Industries',
    rule: 'Odpowiadaj z błyskotliwą inteligencją, lojalnością i wyrafinowanym humorem asystenta Tony\'ego Starka.',
    enabled: true,
    isSystemDefault: true,
  },
  {
    id: 'rule-precision',
    title: 'Precyzja Inżynieryjna & Zero Lania Wody',
    rule: 'Przekazuj konkretne, sprawdzone fakty techniczne i naukowe, eliminując zbędne wypełniacze.',
    enabled: true,
    isSystemDefault: true,
  },
];

const PRESETS = [
  {
    name: 'Tony Stark Master Vibe',
    title: 'Sir',
    directive: 'Zachowuj niezrównaną inteligencję inżyniera Stark Industries, wyrafinowany humor, lojalność i charyzmę. Zwracaj się do mnie "Sir".',
    music: 'AC/DC - Back in Black & Rock Klasyczny',
  },
  {
    name: 'Szef & Dowództwo',
    title: 'Szefie',
    directive: 'Zwracaj się do mnie "Szefie". Działaj natychmiastowo, raportuj statusy i wykonuj polecenia w trybie wojskowym/dowódczym.',
    music: 'Epic Orchestral / Hans Zimmer & Synthwave',
  },
  {
    name: 'Gen-Z & Slang Internetowy',
    title: 'Mistrzu',
    directive: 'Używaj współczesnego slangu młodzieżowego (baza, rizz, sigma, rel, slay, gigachad, essa). Bądź maksymalnie wyluzowany i zabawny.',
    music: 'Trending Phonk & Hip-Hop',
  },
  {
    name: 'Ścisły Ekspert AI / Python',
    title: 'Inżynierze',
    directive: 'Skupiaj się na czystym kodzie, algorytmach, architekturze systemów i precyzyjnych danych. Zero zbędnych uprzejmości.',
    music: 'Cyberpunk 2077 / Deep Focus Ambient',
  },
];

export function MasterRuleModal({
  isOpen,
  onClose,
  deviceConfig,
  onSaveDeviceConfig,
  onTriggerMusic,
}: MasterRuleModalProps) {
  const [config, setConfig] = useState<DeviceConfig>(deviceConfig);
  const [activeTab, setActiveTab] = useState<'rules' | 'location' | 'music' | 'directive'>('rules');
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locSuccessMsg, setLocSuccessMsg] = useState('');

  useEffect(() => {
    setConfig(deviceConfig);
  }, [deviceConfig, isOpen]);

  if (!isOpen) return null;

  const handleToggleRule = (id: string) => {
    const updated = config.mandatoryRules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    const newConf = { ...config, mandatoryRules: updated };
    setConfig(newConf);
    onSaveDeviceConfig(newConf);
    soundFx.playBeep();
  };

  const handleAddCustomRule = () => {
    if (!newRuleTitle.trim() || !newRuleContent.trim()) return;

    const newRule: MasterDirective = {
      id: `custom-${Date.now()}`,
      title: newRuleTitle.trim(),
      rule: newRuleContent.trim(),
      enabled: true,
      isSystemDefault: false,
    };

    const newConf = {
      ...config,
      mandatoryRules: [...config.mandatoryRules, newRule],
    };
    setConfig(newConf);
    onSaveDeviceConfig(newConf);
    setNewRuleTitle('');
    setNewRuleContent('');
    soundFx.playSuccess();
  };

  const handleDeleteRule = (id: string) => {
    const updated = config.mandatoryRules.filter((r) => r.id !== id);
    const newConf = { ...config, mandatoryRules: updated };
    setConfig(newConf);
    onSaveDeviceConfig(newConf);
    soundFx.playBeep();
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    const newConf: DeviceConfig = {
      ...config,
      userTitle: preset.title,
      masterDirectivePrompt: preset.directive,
      favoriteTrackOrGenre: preset.music,
    };
    setConfig(newConf);
    onSaveDeviceConfig(newConf);
    soundFx.playSuccess();
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokalizacja nie jest wspierana przez Twoją przeglądarkę.');
      return;
    }

    setIsLocating(true);
    setLocSuccessMsg('');
    soundFx.playProcessing();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Attempt reverse geocoding via free openstreetmap nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state ||
            `Współrzędne: ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          const country = data.address?.country || 'Polska';
          const fullLoc = `${city}, ${country}`;

          const newConf: DeviceConfig = {
            ...config,
            deviceLocation: fullLoc,
            autoAttachLocation: true,
          };
          setConfig(newConf);
          onSaveDeviceConfig(newConf);
          setLocSuccessMsg(`Wykryto pomyślnie: ${fullLoc}`);
          soundFx.playSuccess();
        } catch {
          const fallbackLoc = `Koordynaty GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          const newConf: DeviceConfig = {
            ...config,
            deviceLocation: fallbackLoc,
            autoAttachLocation: true,
          };
          setConfig(newConf);
          onSaveDeviceConfig(newConf);
          setLocSuccessMsg(`Zapisano koordynaty: ${fallbackLoc}`);
          soundFx.playSuccess();
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setLocSuccessMsg('Nie udało się pobrać współrzędnych (brak uprawnień lub błąd GPS).');
      },
      { timeout: 8000 }
    );
  };

  const handleOpenMusicService = () => {
    if (onTriggerMusic) {
      onTriggerMusic();
      return;
    }

    let url = 'https://open.spotify.com';
    if (config.defaultMusicService === 'youtube') {
      url = config.favoriteTrackOrGenre
        ? `https://music.youtube.com/search?q=${encodeURIComponent(config.favoriteTrackOrGenre)}`
        : 'https://music.youtube.com';
    } else if (config.defaultMusicService === 'apple') {
      url = 'https://music.apple.com';
    } else if (config.defaultMusicService === 'custom' && config.customMusicUrl) {
      url = config.customMusicUrl;
    } else {
      url = config.favoriteTrackOrGenre
        ? `https://open.spotify.com/search/${encodeURIComponent(config.favoriteTrackOrGenre)}`
        : 'https://open.spotify.com';
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Orbitron'] text-cyan-300 tracking-wide">
                  GŁÓWNA REGUŁA & KONFIGURACJA URZĄDZENIA
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase font-mono">
                  Mandatory Rules
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nadrzędne wytyczne, lokalizacja urządzenia i serwis muzyczny narzucane do każdego polecenia JARVIS-a
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-slate-950 text-cyan-300 border-t border-x border-cyan-500/40 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Wymagane Reguły ({config.mandatoryRules.filter((r) => r.enabled).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('location')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'location'
                ? 'bg-slate-950 text-cyan-300 border-t border-x border-cyan-500/40 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Lokalizacja Urządzenia</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'music'
                ? 'bg-slate-950 text-cyan-300 border-t border-x border-cyan-500/40 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4 text-purple-400" />
            <span>Muzyka & Odtwarzacz</span>
          </button>

          <button
            onClick={() => setActiveTab('directive')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'directive'
                ? 'bg-slate-950 text-cyan-300 border-t border-x border-cyan-500/40 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Główny Prompt & Presety</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* TAB 1: MANDATORY RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 font-['Orbitron']">
                    BEZWZGLĘDNE REGUŁY JARVISA (MANDATORY DIRECTIVES)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Każda włączona reguła jest wstrzykiwana bezpośrednio do rdzenia każdego zapytania asystenta.
                  </p>
                </div>
                <div className="text-xs font-mono text-cyan-400 px-3 py-1 rounded bg-cyan-950/50 border border-cyan-500/30">
                  Aktywne: {config.mandatoryRules.filter((r) => r.enabled).length} / {config.mandatoryRules.length}
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-3">
                {config.mandatoryRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                      rule.enabled
                        ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                        : 'bg-slate-950/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="mt-1 w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-cyan-400 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-200 font-['Orbitron']">
                            {rule.title}
                          </span>
                          {rule.isSystemDefault && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              Systemowa
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{rule.rule}</p>
                      </div>
                    </div>

                    {!rule.isSystemDefault && (
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Usuń tę regułę"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom Rule Form */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 font-['Orbitron']">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>DODAJ WŁASNĄ WYMAGANĄ REGUŁĘ</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Tytuł reguły (np. Format odpowiedzi)"
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    className="sm:col-span-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    placeholder="Dokładna treść nakazu (np. Zawsze podawaj 3 kluczowe punkty w odpowiedzi)"
                    value={newRuleContent}
                    onChange={(e) => setNewRuleContent(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  onClick={handleAddCustomRule}
                  disabled={!newRuleTitle.trim() || !newRuleContent.trim()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Dodaj i Wymuś Regułę</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DEVICE LOCATION */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 font-['Orbitron'] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  LOKALIZACJA TWOJEGO URZĄDZENIA
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  JARVIS będzie automatycznie wykorzystywał tę lokalizację przy każdym pytaniu o pogodę, czas, okoliczne obiekty i nawigację.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Bieżąca Lokalizacja Urządzenia (Miasto / Kraj / Współrzędne):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.deviceLocation}
                      onChange={(e) => {
                        const newConf = { ...config, deviceLocation: e.target.value };
                        setConfig(newConf);
                        onSaveDeviceConfig(newConf);
                      }}
                      placeholder="np. Warszawa, Polska"
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-medium"
                    />
                    <button
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="px-3 py-2 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/40 text-emerald-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Automatycznie pobierz współrzędne z przeglądarki"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Szukam...' : 'Wykryj GPS'}</span>
                    </button>
                  </div>
                  {locSuccessMsg && (
                    <div className="text-xs text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded border border-emerald-500/30">
                      {locSuccessMsg}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Automatyczne przekazywanie lokalizacji
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Dołączaj lokalizację do każdego zapytania AI
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.autoAttachLocation}
                      onChange={(e) => {
                        const newConf = { ...config, autoAttachLocation: e.target.checked };
                        setConfig(newConf);
                        onSaveDeviceConfig(newConf);
                      }}
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <span className="text-slate-300 font-semibold block">Przykładowe pytania wykorzystujące lokalizację:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
                      <li>"Jaka jest dzisiaj pogoda?"</li>
                      <li>"Czy jutro będzie padać w mojej okolicy?"</li>
                      <li>"Która jest u mnie godzina?"</li>
                      <li>"Poleć dobre restauracje w pobliżu"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MUSIC & MEDIA */}
          {activeTab === 'music' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 font-['Orbitron'] flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-400" />
                  ODTWARZACZ MUZYCZNY & DOMYŚLNA PLAYLISTA
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Skonfiguruj swój ulubiony serwis (Spotify, YouTube Music, Apple Music lub własny link) i ulubiony gatunek, by JARVIS natychmiast reagował na komendy "włącz muzykę", "puść playlistę".
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Preferowany Serwis Muzyczny:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'spotify', label: 'Spotify', icon: '🟢' },
                      { id: 'youtube', label: 'YouTube Music', icon: '🔴' },
                      { id: 'apple', label: 'Apple Music', icon: '🍎' },
                      { id: 'custom', label: 'Własny Link / Radio', icon: '📻' },
                    ].map((srv) => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => {
                          const newConf: DeviceConfig = {
                            ...config,
                            defaultMusicService: srv.id as any,
                          };
                          setConfig(newConf);
                          onSaveDeviceConfig(newConf);
                        }}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                          config.defaultMusicService === srv.id
                            ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{srv.icon}</span>
                        <span>{srv.label}</span>
                      </button>
                    ))}
                  </div>

                  {config.defaultMusicService === 'custom' && (
                    <div className="space-y-1 mt-2">
                      <label className="text-[11px] text-slate-400">Własny adres URL playlisty / streamu:</label>
                      <input
                        type="text"
                        placeholder="https://soundcloud.com/... lub link radia"
                        value={config.customMusicUrl}
                        onChange={(e) => {
                          const newConf = { ...config, customMusicUrl: e.target.value };
                          setConfig(newConf);
                          onSaveDeviceConfig(newConf);
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Ulubiony Wykonawca, Gatunek lub Tytuł Playlisty:
                  </label>
                  <input
                    type="text"
                    placeholder="np. AC/DC, Synthwave, Cyberpunk, Hans Zimmer"
                    value={config.favoriteTrackOrGenre}
                    onChange={(e) => {
                      const newConf = { ...config, favoriteTrackOrGenre: e.target.value };
                      setConfig(newConf);
                      onSaveDeviceConfig(newConf);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />

                  <div className="pt-2">
                    <button
                      onClick={handleOpenMusicService}
                      className="w-full py-2.5 px-4 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    >
                      <Play className="w-4 h-4 text-purple-300 fill-purple-300" />
                      <span>Testuj Odtworzenie: {config.defaultMusicService.toUpperCase()}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MASTER DIRECTIVE & PRESETS */}
          {activeTab === 'directive' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 font-['Orbitron'] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  GŁÓWNA REGULA SYSTEMOWA & TYTUŁ UŻYTKOWNIKA
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Zdefiniuj nadrzędny systemowy prompt oraz tytuł, jakim JARVIS ma się do Ciebie zwracać.
                </p>
              </div>

              {/* User Title */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Jak JARVIS ma się do Ciebie zwracać? (Forma zwrotu):
                </label>
                <div className="flex gap-2">
                  {['Sir', 'Szefie', 'Panie Stark', 'Dowódco', 'Mistrzu'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const newConf = { ...config, userTitle: t };
                        setConfig(newConf);
                        onSaveDeviceConfig(newConf);
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        config.userTitle === t
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Własny tytuł..."
                    value={config.userTitle}
                    onChange={(e) => {
                      const newConf = { ...config, userTitle: e.target.value };
                      setConfig(newConf);
                      onSaveDeviceConfig(newConf);
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Master Prompt Textarea */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Nadrzędny Prompt Systemowy (Master Directive):
                </label>
                <textarea
                  rows={3}
                  value={config.masterDirectivePrompt}
                  onChange={(e) => {
                    const newConf = { ...config, masterDirectivePrompt: e.target.value };
                    setConfig(newConf);
                    onSaveDeviceConfig(newConf);
                  }}
                  placeholder="np. Zawsze zachowuj pełną lojalność, precyzję, inteligencję i elegancję asystenta Tony'ego Starka..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed font-mono"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase font-['Orbitron']">
                  SZYBKIE PRESETY OSOBOWOŚCI I ZASAD
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleApplyPreset(p)}
                      className="p-3 rounded-xl bg-slate-900/60 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200 font-['Orbitron']">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-500">Tytuł: {p.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {p.directive}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Wszystkie reguły są automatycznie zapisywane w pamięci Stark OS</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] font-['Orbitron'] tracking-wider"
          >
            ZATWIERDŹ I ZAMKNIJ
          </button>
        </div>

      </div>
    </div>
  );
}
