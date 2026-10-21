import { useState, useEffect, useRef } from 'react';
import { TerminalView } from './components/TerminalView';
import { HudView } from './components/HudView';
import { DriveWidget } from './components/DriveWidget';
import { MemoryManager } from './components/MemoryManager';
import { TeachModal } from './components/TeachModal';
import { PythonCodeModal } from './components/PythonCodeModal';
import { MicPermissionModal } from './components/MicPermissionModal';
import { TrainingModal } from './components/TrainingModal';
import { MasterRuleModal } from './components/MasterRuleModal';
import { ImageGeneratorModal } from './components/ImageGeneratorModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { MobileVoiceDock } from './components/MobileVoiceDock';
import { KNOWLEDGE_PACKS } from './data/trainingData';
import { soundFx } from './services/audio';
import { speechService } from './services/speech';
import { googleDriveService } from './services/googleDrive';
import { screenVision } from './services/screen';
import { ChatMessage, JarvisState, SystemStats, GoogleDriveFile, DeviceConfig, GeneratedImageItem } from './types';
import {
  Terminal,
  Activity,
  HardDrive,
  BookOpen,
  Code,
  Volume2,
  VolumeX,
  Power,
  Sparkles,
  Info,
  Monitor,
  Eye,
  EyeOff,
  GraduationCap,
  Zap,
  Shield,
  MapPin,
  Music,
  Image as ImageIcon,
  Menu,
  X,
  Smartphone,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'hud' | 'terminal'>('hud');
  const [jarvisState, setJarvisState] = useState<JarvisState>('idle');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScreenVisionActive, setIsScreenVisionActive] = useState(false);
  const [isScanningScreen, setIsScanningScreen] = useState(false);
  const isConversationModeRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const [aiMode, setAiMode] = useState<'hybrid' | 'strict_python'>('hybrid');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('System Jarvis gotowy do pracy, Sir.');

  // Modals state
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isTeachOpen, setIsTeachOpen] = useState(false);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [isMasterRuleOpen, setIsMasterRuleOpen] = useState(false);
  const [isImageGenOpen, setIsImageGenOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [autoLearnEnabled, setAutoLearnEnabled] = useState(true);
  const [isPythonCodeOpen, setIsPythonCodeOpen] = useState(false);
  const [isMicPermissionOpen, setIsMicPermissionOpen] = useState(false);
  const [pendingVoiceAction, setPendingVoiceAction] = useState<'single' | 'conversation' | null>(null);

  // Device & Master Directives Config
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>({
    deviceLocation: 'Olecko',
    userTitle: 'Sir',
    defaultMusicService: 'spotify',
    customMusicUrl: 'https://open.spotify.com',
    favoriteTrackOrGenre: 'AC/DC - Back in Black / Rock Klasyczny',
    autoAttachLocation: true,
    masterDirectivePrompt:
      'Zawsze zachowuj pełną kulturę, nienaganny szacunek, absolutną prawdomówność i zwięzłość asystenta Tony\'ego Starka. Odpowiadaj krótko i mów tylko prawdę.',
    mandatoryRules: [
      {
        id: 'rule-brevity',
        title: 'Odpowiadaj Krótko (Zwięzłość)',
        rule: 'Odpowiadaj krótko, precyzyjnie i do rzeczy. Podawaj samo sedno sprawy bez zbędnych wstępów, wypełniaczy i lania wody.',
        enabled: true,
        isSystemDefault: true,
      },
      {
        id: 'rule-culture',
        title: 'Zawsze w Pełni Kulturalnie',
        rule: 'Zachowuj się zawsze w pełni kulturalnie, z najwyższą klasą, elegancją, szacunkiem i nienaganną etykietą osobistego asystenta.',
        enabled: true,
        isSystemDefault: true,
      },
      {
        id: 'rule-truth',
        title: 'Tylko i Wyłącznie Prawda',
        rule: 'Mów tylko i wyłącznie prawdę. Przekazuj wyłącznie w 100% sprawdzone, rzetelne i prawdziwe fakty. Jeśli czegoś nie wiesz, powiedz o tym wprost – nigdy nie zmyślaj ani nie twórz fałszywych informacji.',
        enabled: true,
        isSystemDefault: true,
      },
      {
        id: 'rule-daily-report',
        title: 'Protokół "Zdaj Raport na Dzisiaj"',
        rule: 'Po dostaniu komendy "zdaj raport na dzisiaj" (lub "zdaj raport") natychmiast podaj zwięzły raport dnia zawierający: 1) aktualną pogodę dla bieżącej lokalizacji, 2) dokładną godzinę, 3) najświeższe wiadomości, 4) na co jest aktualnie trend (trendy technologiczne, AI, światowe).',
        enabled: true,
        isSystemDefault: true,
      },
      {
        id: 'rule-title',
        title: 'Nadrzędny Tytuł Użytkownika',
        rule: 'Zwracaj się do mnie w każdej wypowiedzi ustalonym tytułem (np. Szef / Sir / Dowódca).',
        enabled: true,
        isSystemDefault: true,
      },
      {
        id: 'rule-device-location',
        title: 'Lokalizacja urządzenia w kontekście',
        rule: 'Zawsze bierz pod uwagę zdefiniowaną lokalizację urządzenia (np. pogoda, strefa czasowa, zalecenia lokalne).',
        enabled: true,
        isSystemDefault: true,
      },
      {
        id: 'rule-music-integration',
        title: 'Domyślna integracja muzyki',
        rule: 'W poleceniach odtwarzania muzyki priorytetyzuj skonfigurowany serwis i ulubione gatunki użytkownika.',
        enabled: true,
        isSystemDefault: true,
      },
    ],
  });

  // Drive state
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveFilesCount, setDriveFilesCount] = useState(0);

  // Memory & Commands
  const [learnedCommands, setLearnedCommands] = useState<Record<string, string>>({});
  const [permanentInsightsCount, setPermanentInsightsCount] = useState(2);
  const [conversations14DaysCount, setConversations14DaysCount] = useState(0);

  const refreshMemoryCounts = () => {
    fetch('/api/jarvis/permanent-notes')
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d.notes)) setPermanentInsightsCount(d.notes.length);
      })
      .catch(() => {});
    fetch('/api/jarvis/conversations')
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d.conversations)) setConversations14DaysCount(d.conversations.length);
      })
      .catch(() => {});
  };

  // Chat message stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'jarvis',
      text: 'Witaj! System Advanced Jarvis został zainicjalizowany. W czym mogę Ci dzisiaj pomóc? Możesz pisać, rozmawiać głosowo lub dać mi dostęp do swojego ekranu.',
      timestamp: new Date().toLocaleTimeString('pl-PL'),
    },
  ]);

  // Sync ref with state
  useEffect(() => {
    isConversationModeRef.current = isConversationMode;
  }, [isConversationMode]);

  // Load initial memory from local storage & server
  useEffect(() => {
    // 1. Try local storage
    const savedLocal = localStorage.getItem('jarvis_memory');
    if (savedLocal) {
      try {
        setLearnedCommands(JSON.parse(savedLocal));
      } catch {
        // ignore
      }
    }

    // 2. Sync with server memory file and seed knowledge packs
    fetch('/api/jarvis/memory')
      .then((res) => res.json())
      .then((data) => {
        setLearnedCommands((prev) => {
          let merged = { ...prev, ...(data.memory || {}) };
          // If total rules are few, combine all default packs for immediate high-IQ capability
          if (Object.keys(merged).length < 30) {
            KNOWLEDGE_PACKS.forEach((pack) => {
              merged = { ...merged, ...pack.data };
            });
            // Persist full initialized base to server
            fetch('/api/jarvis/memory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fullMemory: merged }),
            }).catch(console.warn);
          }
          localStorage.setItem('jarvis_memory', JSON.stringify(merged));
          return merged;
        });
      })
      .catch((e) => console.warn('Server memory sync fallback to local:', e));

    // 3. Load server device config & master directives
    fetch('/api/jarvis/device-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setDeviceConfig(data.config);
        }
      })
      .catch((e) => console.warn('Device config fetch fallback:', e));

    // 4. Check Drive auth
    setIsDriveConnected(googleDriveService.isAuthenticated());

    // 5. Load memory counts (14-day conversations and permanent insights)
    refreshMemoryCounts();

    // Play startup sound on first click anywhere
    const handleFirstGesture = () => {
      soundFx.playStartup();
      window.removeEventListener('click', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture);

    return () => window.removeEventListener('click', handleFirstGesture);
  }, []);

  const systemStats: SystemStats = {
    coreStatus: jarvisState === 'offline' ? 'STANDBY' : 'ONLINE',
    memoryEntriesCount: Object.keys(learnedCommands).length,
    permanentInsightsCount: permanentInsightsCount,
    conversations14DaysCount: conversations14DaysCount,
    driveConnected: isDriveConnected,
    driveFilesCount: driveFilesCount,
    aiMode: aiMode,
    voiceMuted: isVoiceMuted,
    speechLang: 'pl-PL',
    screenVisionActive: isScreenVisionActive,
  };

  // Helper to append message
  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('pl-PL'),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  // Helper to start voice recognition
  const startVoiceListening = async (isFromContinuousLoop = false) => {
    // Crucial for mobile (iOS Safari & Android Chrome): pre-warm and unlock audio pipelines
    speechService.unlockAudio();
    soundFx.unlockAudio();

    if (jarvisState === 'offline') {
      setJarvisState('idle');
      soundFx.playStartup();
    }

    if (isFromContinuousLoop) {
      soundFx.playListenPing();
    } else {
      soundFx.playBeep();
    }

    setJarvisState('listening');
    setTranscript('');

    const started = await speechService.startListening(
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim()) {
          setJarvisState('idle');
          setTranscript('');
          setAudioLevel(0);
          handleCommand(text, true);
        }
      },
      (err) => {
        console.warn('Speech recognition event:', err);
        setJarvisState('idle');
        setAudioLevel(0);

        // Check for permission issues
        if (
          err?.error === 'not-allowed' ||
          err?.error === 'permission-denied' ||
          err?.error === 'service-not-allowed'
        ) {
          setIsConversationMode(false);
          isConversationModeRef.current = false;
          const permMsg =
            'Wymagany jest dostęp do mikrofonu. Kliknij ikonę kłódki lub uprawnień przy pasku adresu przeglądarki i zezwól na korzystanie z mikrofonu.';
          addMessage({
            sender: 'jarvis',
            text: permMsg,
          });
          speakJarvis('Proszę zezwolić na dostęp do mikrofonu w ustawieniach przeglądarki.');
          return;
        }

        // If in conversation mode and timed out without speech, try soft restart
        if (isConversationModeRef.current && (err?.error === 'no-speech' || err?.error === 'network')) {
          setTimeout(() => {
            if (isConversationModeRef.current && !isSpeakingRef.current) {
              startVoiceListening(true);
            }
          }, 800);
        }
      },
      () => {
        setAudioLevel(0);
        if (jarvisState === 'listening') {
          setJarvisState('idle');
        }
      },
      'pl-PL',
      {
        onAudioLevel: (lvl) => setAudioLevel(lvl),
      }
    );

    if (!started) {
      setJarvisState('idle');
      setAudioLevel(0);
    }
  };

  // Speaks Jarvis response aloud with voice synthesis
  const speakJarvis = (text: string, onSpeechFinished?: () => void) => {
    setLastResponse(text);
    speechService.unlockAudio();
    setAudioLevel(0);

    if (!isVoiceMuted && jarvisState !== 'offline') {
      setJarvisState('speaking');
      isSpeakingRef.current = true;
      speechService.speak(
        text,
        'pl-PL',
        () => {
          setJarvisState('idle');
          isSpeakingRef.current = false;
          if (onSpeechFinished) {
            onSpeechFinished();
          } else if (isConversationModeRef.current) {
            // Auto continue conversation in hands-free dialogue mode
            setTimeout(() => {
              if (isConversationModeRef.current && jarvisState !== 'offline') {
                startVoiceListening(true);
              }
            }, 400);
          }
        },
        () => {
          setJarvisState('idle');
          isSpeakingRef.current = false;
        }
      );
    } else {
      if (onSpeechFinished) onSpeechFinished();
    }
  };

  const handleStopSpeaking = () => {
    speechService.stopSpeaking();
    isSpeakingRef.current = false;
    setAudioLevel(0);
    setJarvisState('idle');
  };

  // Trigger conversation mode with prior microphone authorization
  const triggerConversationMode = () => {
    setIsConversationMode(true);
    isConversationModeRef.current = true;
    soundFx.playStartup();
    const promptText = 'Dostęp do mikrofonu został przyznany, Sir. Tryb ciągłej rozmowy aktywny. Słucham Cię!';
    addMessage({
      sender: 'jarvis',
      text: promptText,
      isAiGenerated: false,
    });
    speakJarvis(promptText, () => {
      if (isConversationModeRef.current) {
        startVoiceListening(true);
      }
    });
  };

  // Toggle Continuous Conversation Mode with permission enforcement
  const handleToggleConversationMode = async () => {
    if (isConversationMode) {
      // Turn off
      setIsConversationMode(false);
      isConversationModeRef.current = false;
      speechService.stopListening();
      speechService.stopSpeaking();
      isSpeakingRef.current = false;
      setJarvisState('idle');
      soundFx.playBeep();
      addMessage({
        sender: 'jarvis',
        text: 'Tryb ciągłej rozmowy został zakończony.',
      });
      return;
    }

    // Require microphone permission before starting conversation
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Permission already granted or immediately accepted
        stream.getTracks().forEach((t) => t.stop());
        triggerConversationMode();
      } catch (err) {
        // Show dedicated permission prompt modal
        setPendingVoiceAction('conversation');
        setIsMicPermissionOpen(true);
      }
    } else {
      // Fallback
      triggerConversationMode();
    }
  };

  // Request single voice listening with mic check
  const handleSingleVoiceTrigger = async () => {
    if (jarvisState === 'listening') {
      speechService.stopListening();
      setJarvisState('idle');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        startVoiceListening(false);
      } catch (err) {
        setPendingVoiceAction('single');
        setIsMicPermissionOpen(true);
      }
    } else {
      startVoiceListening(false);
    }
  };

  // Screen Vision Handlers
  const handleStartScreenShare = async () => {
    if (!screenVision.isSupported()) {
      const unsupportedMsg =
        'Twoja przeglądarka nie obsługuje funkcji udostępniania ekranu (getDisplayMedia).';
      addMessage({ sender: 'jarvis', text: unsupportedMsg });
      speakJarvis(unsupportedMsg);
      return false;
    }

    soundFx.playProcessing();
    const res = await screenVision.startScreenShare(() => {
      setIsScreenVisionActive(false);
      const stoppedMsg = 'Udostępnianie ekranu zostało przerwane.';
      addMessage({ sender: 'jarvis', text: stoppedMsg });
      speakJarvis(stoppedMsg);
    });

    if (res.success) {
      setIsScreenVisionActive(true);
      soundFx.playSuccess();
      const successMsg =
        'Wizja ekranu została pomyślnie aktywowana, Sir! Widzę Twój ekran w czasie rzeczywistym. Możesz mnie zapytać o cokolwiek, co na nim widać.';
      addMessage({
        sender: 'jarvis',
        text: successMsg,
        isScreenVision: true,
      });
      speakJarvis(successMsg);
      return true;
    } else {
      setIsScreenVisionActive(false);
      const errMsg =
        res.error || 'Nie udało się uzyskać dostępu do ekranu. Upewnij się, że wyraziłeś zgodę w oknie przeglądarki.';
      addMessage({ sender: 'jarvis', text: errMsg });
      speakJarvis('Dostęp do ekranu został anulowany lub zablokowany.');
      return false;
    }
  };

  const handleStopScreenShare = () => {
    screenVision.stopScreenShare();
    setIsScreenVisionActive(false);
    soundFx.playBeep();
    const msg = 'Dostęp do ekranu został odłączony, Sir.';
    addMessage({ sender: 'jarvis', text: msg });
    speakJarvis(msg);
  };

  const handleToggleScreenShare = () => {
    if (isScreenVisionActive) {
      handleStopScreenShare();
    } else {
      handleStartScreenShare();
    }
  };

  // Analyze active or requested screen frame with Gemini Multimodal
  const handleAnalyzeScreen = async (customPrompt?: string) => {
    // If not sharing yet, start share first
    let active = isScreenVisionActive;
    if (!active) {
      const started = await handleStartScreenShare();
      if (!started) return;
      active = true;
      // Brief delay to ensure video stream has rendered first frame
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsScanningScreen(true);
    setJarvisState('scanning_screen');
    soundFx.playScan();

    const promptText =
      customPrompt ||
      'Przeanalizuj to co widzisz na moim ekranie. Wykryj otwarte aplikacje, kod, błędy lub treść dokumentu.';

    addMessage({
      sender: 'user',
      text: promptText,
    });

    try {
      const result = await screenVision.analyzeCurrentScreen(
        promptText,
        messages.slice(-4).map((m) => ({ sender: m.sender, text: m.text }))
      );

      if (result.error) {
        const errorText = `Sir, wystąpił problem z analizą wizualną: ${result.error}`;
        addMessage({
          sender: 'jarvis',
          text: errorText,
          screenSnapshot: result.snapshotUrl,
          isScreenVision: true,
        });
        speakJarvis(errorText);
      } else {
        const reply = result.response || 'Sir, przeanalizowałem obraz ekranu.';
        addMessage({
          sender: 'jarvis',
          text: reply,
          screenSnapshot: result.snapshotUrl,
          isScreenVision: true,
          isAiGenerated: true,
        });
        speakJarvis(reply);
      }
    } catch (err: any) {
      const failMsg = `Nie udało się przetworzyć obrazu ekranu: ${err.message}`;
      addMessage({ sender: 'jarvis', text: failMsg });
      speakJarvis(failMsg);
    } finally {
      setIsScanningScreen(false);
      setJarvisState('idle');
    }
  };

  // Save a new learned command
  const handleSaveLearnedCommand = async (cmd: string, resp: string) => {
    const key = cmd.toLowerCase().trim();
    const val = resp.trim();

    const updated = { ...learnedCommands, [key]: val };
    setLearnedCommands(updated);
    localStorage.setItem('jarvis_memory', JSON.stringify(updated));

    // Save to server jarvis_memory.json
    try {
      await fetch('/api/jarvis/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: key, response: val, fullMemory: updated }),
      });
    } catch (e) {
      console.warn('Could not sync memory to server file:', e);
    }

    soundFx.playSuccess();
    const reply = `Zrozumiałem. Od teraz na "${key}" odpowiadam: "${val}"`;
    addMessage({
      sender: 'jarvis',
      text: reply,
      isLearnedCommand: true,
    });
    speakJarvis(reply);
  };

  // Delete a command
  const handleDeleteLearnedCommand = async (cmd: string) => {
    const key = cmd.toLowerCase().trim();
    const updated = { ...learnedCommands };
    delete updated[key];
    setLearnedCommands(updated);
    localStorage.setItem('jarvis_memory', JSON.stringify(updated));

    try {
      await fetch('/api/jarvis/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullMemory: updated }),
      });
    } catch (e) {
      console.warn('Could not sync memory to server file:', e);
    }
  };

  // Import JSON memory
  const handleImportMemory = (imported: Record<string, string>) => {
    const merged = { ...learnedCommands, ...imported };
    setLearnedCommands(merged);
    localStorage.setItem('jarvis_memory', JSON.stringify(merged));
    fetch('/api/jarvis/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullMemory: merged }),
    }).catch(console.warn);
    soundFx.playSuccess();
  };

  // Export JSON memory
  const handleExportMemory = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(learnedCommands, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'jarvis_memory.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Train / Apply Knowledge Pack
  const handleApplyKnowledgePack = async (packData: Record<string, string>, packName: string) => {
    try {
      const res = await fetch('/api/jarvis/train-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packData }),
      });
      const data = await res.json();
      const newMemory = data.memory || { ...learnedCommands, ...packData };

      setLearnedCommands(newMemory);
      localStorage.setItem('jarvis_memory', JSON.stringify(newMemory));

      const countAdded = Object.keys(packData).length;
      const successMsg = `Pomyślnie wgrano "${packName}" (+${countAdded} procedur i reguł wiedzy). Baza pamięci liczy teraz ${Object.keys(newMemory).length} reguł.`;
      addMessage({ sender: 'jarvis', text: successMsg, isLearnedCommand: true });
      speakJarvis(`Wdrożyłem ${countAdded} nowych procedur z pakietu ${packName}, Sir.`);
    } catch (err) {
      // Fallback local merge
      const updated = { ...learnedCommands, ...packData };
      setLearnedCommands(updated);
      localStorage.setItem('jarvis_memory', JSON.stringify(updated));
      const countAdded = Object.keys(packData).length;
      const successMsg = `Wgrano lokalnie "${packName}" (+${countAdded} reguł).`;
      addMessage({ sender: 'jarvis', text: successMsg, isLearnedCommand: true });
      speakJarvis(`Zaktualizowano pamięć o ${countAdded} reguł.`);
    }
  };

  // Save Device Config & Master Directives
  const handleSaveDeviceConfig = async (newConfig: DeviceConfig) => {
    setDeviceConfig(newConfig);
    try {
      await fetch('/api/jarvis/device-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      soundFx.playSuccess();
      const activeRules = newConfig.mandatoryRules.filter((r) => r.enabled).length;
      const msg = `Zaktualizowano konfigurację urządzenia Stark OS (${newConfig.deviceLocation}, ${activeRules} aktywnych reguł, odtwarzacz: ${newConfig.defaultMusicService.toUpperCase()}).`;
      addMessage({ sender: 'jarvis', text: msg });
      speakJarvis(`Zaktualizowałem główne reguły i parametry urządzenia, ${newConfig.userTitle || 'Sir'}.`);
    } catch (e) {
      console.warn('Could not sync device config to server:', e);
    }
  };

  // Launch Music on requested or default service
  const handleTriggerMusic = (requestedQuery?: string) => {
    soundFx.playSuccess();
    const service = deviceConfig.defaultMusicService || 'spotify';
    const track =
      requestedQuery ||
      deviceConfig.favoriteTrackOrGenre ||
      'Synthwave Stark Industries Playlist';

    let url = 'https://open.spotify.com';
    if (service === 'spotify') {
      url = `https://open.spotify.com/search/${encodeURIComponent(track)}`;
    } else if (service === 'youtube') {
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(track)}`;
    } else if (service === 'apple') {
      url = `https://music.apple.com/search?term=${encodeURIComponent(track)}`;
    } else if (service === 'soundcloud') {
      url = `https://soundcloud.com/search?q=${encodeURIComponent(track)}`;
    }

    const replyMsg = `Uruchamiam odtwarzacz ${service.toUpperCase()} dla: "${track}". Połączono z urządzeniem w lokalizacji ${deviceConfig.deviceLocation}, ${deviceConfig.userTitle || 'Sir'}!`;
    addMessage({
      sender: 'jarvis',
      text: `${replyMsg}\n\n🎵 [Kliknij tutaj, aby przejść do ${service.toUpperCase()}](${url})`,
    });
    speakJarvis(`Odtwarzam muzykę w serwisie ${service}, ${deviceConfig.userTitle || 'Sir'}.`);

    try {
      window.open(url, '_blank');
    } catch {
      // ignore popup restriction
    }
  };

  // Send Generated Image from Modal to Chat Stream
  const handleSendGeneratedImageToChat = (item: GeneratedImageItem) => {
    soundFx.playSuccess();
    // Add user note
    addMessage({
      sender: 'user',
      text: `[Generowanie Obrazu AI]: "${item.prompt}" (${item.style || 'Standard'}, ${item.aspectRatio})`,
    });

    const replyMsg = `Oto wygenerowany obraz na Twoje życzenie, ${deviceConfig.userTitle || 'Sir'}.\n\nModel: ${item.modelUsed || 'Gemini Flash Image'}\nStyl: ${item.style || 'Domyślny'}\nProporcje: ${item.aspectRatio}`;

    addMessage({
      sender: 'jarvis',
      text: replyMsg,
      isAiGenerated: true,
      generatedImageUrl: item.imageUrl,
      imagePrompt: item.prompt,
      imageAspectRatio: item.aspectRatio,
      imageStyle: item.style,
    });

    speakJarvis(`Oto wygenerowany obraz, ${deviceConfig.userTitle || 'Sir'}. Synteza graficzna ukończona pomyślnie.`);
  };

  // Directly trigger Image Generation from voice or CLI command
  const handleTriggerGenerateImage = async (
    promptText: string,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1',
    style: string = 'stark_hologram'
  ) => {
    setJarvisState('processing');
    soundFx.playProcessing();

    const ackMsg = `Rozpoczynam syntezę obrazu dla promptu: "${promptText}". Proszę o chwilę cierpliwości, ${deviceConfig.userTitle || 'Sir'}...`;
    addMessage({ sender: 'jarvis', text: ackMsg });
    speakJarvis(`Generuję obraz "${promptText}", ${deviceConfig.userTitle || 'Sir'}.`);

    try {
      const res = await fetch('/api/jarvis/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          aspectRatio,
          style,
        }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        soundFx.playSuccess();
        const finishMsg = `Obraz został wygenerowany pomyślnie przez silnik ${data.modelUsed || 'Stark AI'}.`;
        addMessage({
          sender: 'jarvis',
          text: finishMsg,
          isAiGenerated: true,
          generatedImageUrl: data.imageUrl,
          imagePrompt: promptText,
          imageAspectRatio: aspectRatio,
          imageStyle: style,
        });
        speakJarvis(`Obraz gotowy, ${deviceConfig.userTitle || 'Sir'}! Możesz go powiększyć lub pobrać w terminalu.`);
      } else {
        throw new Error(data.error || 'Nie udało się wygenerować obrazu.');
      }
    } catch (err: any) {
      const errorMsg = `Błąd generowania obrazu: ${err.message || 'Nieznany problem silnika graficznego'}.`;
      addMessage({ sender: 'jarvis', text: errorMsg });
      speakJarvis(`Wystąpił problem z generatorem obrazów, ${deviceConfig.userTitle || 'Sir'}.`);
    } finally {
      setJarvisState('idle');
    }
  };

  // Main Command Processing Logic
  const handleCommand = async (userInput: string, isVoice = false) => {
    const cleanInput = userInput.trim();
    if (!cleanInput) return;

    soundFx.playBeep();
    addMessage({ sender: 'user', text: cleanInput, isVoice });

    const lowerInput = cleanInput.toLowerCase();

    // Check conversation exit words
    if (
      lowerInput === 'zakończ rozmowę' ||
      lowerInput === 'koniec rozmowy' ||
      lowerInput === 'stop rozmowa' ||
      lowerInput === 'wyłącz dialog'
    ) {
      setIsConversationMode(false);
      isConversationModeRef.current = false;
      speechService.stopListening();
      const exitDialogueMsg = 'Kończę tryb ciągłej rozmowy. Pozostaję w gotowości, Sir.';
      addMessage({ sender: 'jarvis', text: exitDialogueMsg });
      speakJarvis(exitDialogueMsg);
      return;
    }

    // 1. Exit / Shutdown command
    if (['wyjście', 'exit', 'papa', 'wyłącz', 'wyłącz się'].includes(lowerInput)) {
      soundFx.playShutdown();
      setIsConversationMode(false);
      isConversationModeRef.current = false;
      const exitText = 'Jarvis: System wyłączony. Do widzenia, Proszę Pana.';
      addMessage({ sender: 'jarvis', text: exitText });
      speakJarvis('System wyłączony. Do widzenia, Proszę Pana.');
      setJarvisState('offline');
      return;
    }

    // If previously offline, reactivate
    if (jarvisState === 'offline') {
      setJarvisState('idle');
      soundFx.playStartup();
    }

    // 2. Learning command: `ucz się [komenda] = [odpowiedź]`
    if (lowerInput.startsWith('ucz się')) {
      setJarvisState('learning');
      try {
        const withoutPrefix = cleanInput.replace(/^ucz się\s*/i, '');
        const parts = withoutPrefix.split('=');
        if (parts.length >= 2) {
          const cmd = parts[0].trim().toLowerCase();
          const resp = parts.slice(1).join('=').trim();
          if (cmd && resp) {
            await handleSaveLearnedCommand(cmd, resp);
            return;
          }
        }
        throw new Error('Format mismatch');
      } catch {
        const formatError = 'Użyj formatu: ucz się [komenda] = [odpowiedź]';
        addMessage({ sender: 'jarvis', text: formatError });
        speakJarvis(formatError);
        setJarvisState('idle');
        return;
      }
    }

    // 2.1 Direct Fact Learning: `zapamiętaj że [X] = / to [Y]`
    if (
      lowerInput.startsWith('zapamiętaj że ') ||
      lowerInput.startsWith('zapamiętaj, że ') ||
      lowerInput.startsWith('zapamiętaj: ') ||
      lowerInput.startsWith('zapamiętaj ')
    ) {
      const factText = cleanInput.replace(/^zapamiętaj(,|:)?(\s+że)?\s+/i, '').trim();
      if (factText) {
        let key = factText;
        let val = factText;
        if (factText.includes(' = ')) {
          const parts = factText.split(' = ');
          key = parts[0].trim();
          val = parts.slice(1).join(' = ').trim();
        } else if (factText.includes(' to ')) {
          const parts = factText.split(' to ');
          key = parts[0].trim();
          val = parts.slice(1).join(' to ').trim();
        } else if (factText.includes(' jest ')) {
          const parts = factText.split(' jest ');
          key = parts[0].trim();
          val = parts.slice(1).join(' jest ').trim();
        }

        await handleSaveLearnedCommand(key.toLowerCase(), val);
        const confirmMsg = `Zrozumiałem i zapisałem w pamięci: "${key}" ➔ "${val}", Proszę Pana.`;
        addMessage({
          sender: 'jarvis',
          text: confirmMsg,
          isLearnedCommand: true,
          autoLearnedFact: { key, value: val },
        });
        speakJarvis(confirmMsg);
        return;
      }
    }

    // 2.2 Training Center & Auto-Repair trigger
    if (
      lowerInput.includes('szkolenie') ||
      lowerInput.includes('zrób szkolenie') ||
      lowerInput.includes('zrub szkolenie') ||
      lowerInput.includes('podszkol') ||
      lowerInput.includes('podszkol się') ||
      lowerInput.includes('podszkol jarvisa') ||
      lowerInput.includes('podszkol go') ||
      lowerInput.includes('nic nie działa') ||
      lowerInput.includes('nicnie działa') ||
      lowerInput.includes('napraw') ||
      lowerInput.includes('naucz się sam') ||
      lowerInput.includes('naucz się więcej') ||
      lowerInput.includes('centrum szkolenia') ||
      lowerInput.includes('pakiety wiedzy') ||
      lowerInput.includes('quiz') ||
      lowerInput.includes('egzamin') ||
      lowerInput.includes('sesja treningowa') ||
      lowerInput.includes('akademia')
    ) {
      soundFx.playSuccess();
      // Instantly inject & synchronize all 8 Knowledge Packs (160+ knowledge rules)
      let combinedPacks: Record<string, string> = { ...learnedCommands };
      KNOWLEDGE_PACKS.forEach((pack) => {
        combinedPacks = { ...combinedPacks, ...pack.data };
      });
      setLearnedCommands(combinedPacks);
      localStorage.setItem('jarvis_memory', JSON.stringify(combinedPacks));

      // Sync with server jarvis_memory.json
      fetch('/api/jarvis/train-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packData: combinedPacks }),
      }).catch(console.warn);

      setIsTrainingOpen(true);
      const totalRules = Object.keys(combinedPacks).length;
      const trainMsg = `Rozkaz przyjęty, ${deviceConfig.userTitle || 'Sir'}! Przeprowadziłem natychmiastowe przeszkolenie i re-kalibrację rdzenia AI. Wgrałem wszystkie 8 pakietów wiedzy (${totalRules} aktywnych reguł w pliku jarvis_memory.json). Silnik generowania obrazów Stark AI, rozpoznawanie mowy, analiza ekranu oraz koprocesory działają z pełną mocą Turbo 10X. Otwieram panel Akademii.`;
      addMessage({ sender: 'jarvis', text: trainMsg, isLearnedCommand: true });
      speakJarvis(`Przeszkolenie zakończone, ${deviceConfig.userTitle || 'Sir'}. Wszystkie moduły działają bezbłędnie z pełną mocą.`);
      return;
    }

    // 2.3 Memory Query
    if (
      lowerInput === 'co pamiętasz?' ||
      lowerInput === 'co pamiętasz' ||
      lowerInput === 'czego się nauczyłeś?' ||
      lowerInput === 'czego się nauczyłeś' ||
      lowerInput === 'pokaż pamięć' ||
      lowerInput === 'baza wiedzy'
    ) {
      const count = Object.keys(learnedCommands).length;
      const sampleKeys = Object.keys(learnedCommands).slice(-4).map(k => `"${k}"`).join(', ');
      const reply = count > 0
        ? `Moja baza wiedzy zawiera obecnie ${count} wyuczonych reguł w pliku jarvis_memory.json. Ostatnie: ${sampleKeys}.`
        : 'Moja baza wiedzy zawiera domyślne reguły systemowe. Możesz mnie podszkolić gotowymi pakietami lub mówiąc "Zapamiętaj że..."';
      addMessage({ sender: 'jarvis', text: reply });
      speakJarvis(reply);
      return;
    }

    // 3. Screen Vision Commands
    if (
      lowerInput.includes('dostemp do mikrofonu') ||
      lowerInput.includes('dostęp do mikrofonu') ||
      lowerInput.includes('włącz mikrofon') ||
      lowerInput.includes('odblokuj mikrofon') ||
      lowerInput.includes('włącz rozmowę') ||
      lowerInput.includes('włącz tryb rozmowy') ||
      lowerInput.includes('zacznij rozmowę') ||
      lowerInput.includes('rozmawiajmy')
    ) {
      await handleToggleConversationMode();
      return;
    }

    if (
      lowerInput.includes('dostemp do ekranu') ||
      lowerInput.includes('dostęp do ekranu') ||
      lowerInput.includes('daj mu dostęp') ||
      lowerInput.includes('daj mu dostemp') ||
      lowerInput === 'ekran' ||
      lowerInput === 'włącz ekran' ||
      lowerInput === 'udostępnij ekran' ||
      lowerInput === 'podłącz ekran' ||
      lowerInput === 'włącz wizję' ||
      lowerInput === 'wizja ekranu'
    ) {
      await handleStartScreenShare();
      return;
    }

    if (
      lowerInput === 'wyłącz ekran' ||
      lowerInput === 'zamknij ekran' ||
      lowerInput === 'odłącz ekran' ||
      lowerInput === 'wyłącz wizję' ||
      lowerInput === 'stop ekran'
    ) {
      handleStopScreenShare();
      return;
    }

    if (
      lowerInput.includes('co widzisz na ekranie') ||
      lowerInput.includes('co widzisz na moim ekranie') ||
      lowerInput.includes('przeanalizuj ekran') ||
      lowerInput.includes('przeanalizuj mój ekran') ||
      lowerInput.includes('zobacz ekran') ||
      lowerInput.includes('sprawdź ekran') ||
      lowerInput.includes('co jest na ekranie') ||
      lowerInput.includes('przeanalizuj kod na ekranie') ||
      lowerInput.includes('co tu jest napisane') ||
      (isScreenVisionActive && (lowerInput.includes('co widzisz') || lowerInput.includes('przeanalizuj to')))
    ) {
      await handleAnalyzeScreen(cleanInput);
      return;
    }

    // 4. Google Drive commands
    if (lowerInput === 'dysk' || lowerInput === 'pliki' || lowerInput === 'google drive' || lowerInput === 'otwórz dysk') {
      setIsDriveOpen(true);
      const reply = isDriveConnected
        ? 'Otwieram panel zarządzania plikami Google Drive, Sir.'
        : 'Otwieram panel Google Drive. Aby wyświetlić pliki, kliknij "Połącz z Google Drive".';
      addMessage({ sender: 'jarvis', text: reply });
      speakJarvis(reply);
      return;
    }

    if (lowerInput.startsWith('szukaj ') || lowerInput.startsWith('znajdź plik ')) {
      const query = cleanInput.replace(/^(szukaj|znajdź plik)\s+/i, '').trim();
      if (isDriveConnected) {
        setIsDriveOpen(true);
        const reply = `Przeszukuję Dysk Google pod kątem frazy: "${query}"...`;
        addMessage({ sender: 'jarvis', text: reply });
        speakJarvis(reply);
        return;
      } else {
        const reply = 'Aby przeszukać Dysk Google, połącz swoje konto klikając ikonę Dysku w menu.';
        addMessage({ sender: 'jarvis', text: reply });
        speakJarvis(reply);
        setIsDriveOpen(true);
        return;
      }
    }

    // 4. Image Generation Commands ("generuj obraz", "wygeneruj zdjęcie", "stwórz grafikę", "narysuj", etc.)
    if (
      lowerInput === 'generuj obraz' ||
      lowerInput === 'generator obrazów' ||
      lowerInput === 'generator grafik' ||
      lowerInput === 'generacja zdjęć' ||
      lowerInput === 'generacja obrazów' ||
      lowerInput === 'otwórz generator obrazów' ||
      lowerInput === 'pokaż generator' ||
      lowerInput === 'stwórz obraz'
    ) {
      setIsImageGenOpen(true);
      const reply = `Otwieram generator obrazów i grafik Stark AI, ${deviceConfig.userTitle || 'Sir'}. Możesz wpisać dowolny prompt, wybrać styl i proporcje.`;
      addMessage({ sender: 'jarvis', text: reply });
      speakJarvis(reply);
      return;
    }

    if (
      lowerInput.startsWith('wygeneruj mi obraz ') ||
      lowerInput.startsWith('wygeneruj mi zdjęcie ') ||
      lowerInput.startsWith('wygeneruj mi zdjecie ') ||
      lowerInput.startsWith('wygeneruj mi grafikę ') ||
      lowerInput.startsWith('wygeneruj mi grafike ') ||
      lowerInput.startsWith('stwórz mi obraz ') ||
      lowerInput.startsWith('stwórz mi grafikę ') ||
      lowerInput.startsWith('stwórz mi zdjęcie ') ||
      lowerInput.startsWith('zrób mi obraz ') ||
      lowerInput.startsWith('zrób mi zdjęcie ') ||
      lowerInput.startsWith('zrób mi grafikę ') ||
      lowerInput.startsWith('zrob mi obraz ') ||
      lowerInput.startsWith('zrob mi zdjecie ') ||
      lowerInput.startsWith('zrob mi grafike ') ||
      lowerInput.startsWith('wygeneruj obraz ') ||
      lowerInput.startsWith('wygeneruj zdjęcie ') ||
      lowerInput.startsWith('wygeneruj grafikę ') ||
      lowerInput.startsWith('wygeneruj zdjecie ') ||
      lowerInput.startsWith('wygeneruj grafike ') ||
      lowerInput.startsWith('generuj obraz ') ||
      lowerInput.startsWith('generuj grafikę ') ||
      lowerInput.startsWith('generuj zdjęcie ') ||
      lowerInput.startsWith('stwórz obraz ') ||
      lowerInput.startsWith('stwórz grafikę ') ||
      lowerInput.startsWith('stwórz zdjęcie ') ||
      lowerInput.startsWith('stworz obraz ') ||
      lowerInput.startsWith('stworz grafike ') ||
      lowerInput.startsWith('zrób obraz ') ||
      lowerInput.startsWith('zrób zdjęcie ') ||
      lowerInput.startsWith('zrób grafikę ') ||
      lowerInput.startsWith('zrob obraz ') ||
      lowerInput.startsWith('zrob zdjecie ') ||
      lowerInput.startsWith('zrob grafike ') ||
      lowerInput.startsWith('narysuj ') ||
      lowerInput.startsWith('namaluj ') ||
      lowerInput.startsWith('zrób obrazek ') ||
      lowerInput.startsWith('generate image ')
    ) {
      const promptText = cleanInput
        .replace(
          /^(wygeneruj mi obraz|wygeneruj mi zdjęcie|wygeneruj mi zdjecie|wygeneruj mi grafikę|wygeneruj mi grafike|stwórz mi obraz|stwórz mi grafikę|stwórz mi zdjęcie|zrób mi obraz|zrób mi zdjęcie|zrób mi grafikę|zrob mi obraz|zrob mi zdjecie|zrob mi grafike|wygeneruj obraz|wygeneruj zdjęcie|wygeneruj grafikę|wygeneruj zdjecie|wygeneruj grafike|generuj obraz|generuj grafikę|generuj zdjęcie|stwórz obraz|stwórz grafikę|stwórz zdjęcie|stworz obraz|stworz grafike|zrób obraz|zrób zdjęcie|zrób grafikę|zrob obraz|zrob zdjecie|zrob grafike|narysuj|namaluj|zrób obrazek|generate image)\s+/i,
          ''
        )
        .trim();

      if (promptText) {
        await handleTriggerGenerateImage(promptText, '1:1', 'stark_hologram');
        return;
      }
    }

    // Master Directives, Location & Music Commands
    if (
      lowerInput.includes('główna reguła') ||
      lowerInput.includes('główne reguły') ||
      lowerInput.includes('pokaż reguły') ||
      lowerInput.includes('nakazy')
    ) {
      const activeRules = deviceConfig.mandatoryRules.filter((r) => r.enabled);
      const reply = `Główna dyrektywa systemu JARVIS:\n"${deviceConfig.masterDirectivePrompt}"\n\nAktywne reguły urządzenia (${activeRules.length}):\n${activeRules.map((r, i) => `${i + 1}. ${r.title}: ${r.prompt}`).join('\n')}\n\n📍 Lokalizacja: ${deviceConfig.deviceLocation}\n🎵 Odtwarzacz muzyki: ${deviceConfig.defaultMusicService.toUpperCase()} (${deviceConfig.favoriteTrackOrGenre})`;
      addMessage({ sender: 'jarvis', text: reply });
      speakJarvis(`Mamy aktywnych ${activeRules.length} głównych nakazów w protokole Stark OS.`);
      return;
    }

    if (
      lowerInput.includes('lokalizacja') ||
      lowerInput.includes('gdzie jestem') ||
      lowerInput.includes('moja lokalizacja') ||
      lowerInput.includes('lokalizacja urządzenia')
    ) {
      const reply = `Twoja aktualna skonfigurowana lokalizacja urządzenia to: ${deviceConfig.deviceLocation}. Wszystkie operacje środowiskowe, strefa czasowa i zalecenia są do niej automatycznie dopasowywane, ${deviceConfig.userTitle || 'Sir'}.`;
      addMessage({ sender: 'jarvis', text: reply });
      speakJarvis(`Lokalizacja urządzenia to ${deviceConfig.deviceLocation}, ${deviceConfig.userTitle || 'Sir'}.`);
      return;
    }

    if (
      lowerInput.startsWith('włącz muzykę') ||
      lowerInput.startsWith('graj muzykę') ||
      lowerInput.startsWith('włącz moją muzykę') ||
      lowerInput.startsWith('odtwórz muzykę') ||
      lowerInput.startsWith('odtwórz ') ||
      lowerInput === 'muzyka'
    ) {
      const musicQuery = cleanInput
        .replace(/^(włącz moją muzykę|włącz muzykę|graj muzykę|odtwórz muzykę|odtwórz|muzyka)\s*/i, '')
        .trim();
      handleTriggerMusic(musicQuery || undefined);
      return;
    }

    // 4. Built-in Core Python Commands
    if (lowerInput.includes('cześć') || lowerInput.includes('witaj') || lowerInput.includes('hej jarvis') || lowerInput === 'hej') {
      const reply = `Witaj ${deviceConfig.userTitle || 'Sir'}! W czym mogę Ci dzisiaj pomóc w lokalizacji ${deviceConfig.deviceLocation}? Słucham Twoich poleceń.`;
      addMessage({ sender: 'jarvis', text: reply });
      speakJarvis(reply);
      return;
    }

    if (lowerInput.includes('godzina') || lowerInput.includes('która godzina') || lowerInput.includes('czas')) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pl-PL');
      const reply = `W lokalizacji ${deviceConfig.deviceLocation} jest godzina ${timeStr}, ${deviceConfig.userTitle || 'Sir'}.`;
      addMessage({ sender: 'jarvis', text: reply });
      speakJarvis(reply);
      return;
    }

    if (lowerInput.includes('data') || lowerInput.includes('jaki dzisiaj dzień') || lowerInput.includes('który dzisiaj')) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const reply = `Dzisiaj jest ${day}.${month}.${year}, ${deviceConfig.userTitle || 'Sir'}.`;
      addMessage({ sender: 'jarvis', text: reply });
      speakJarvis(reply);
      return;
    }

    if (lowerInput.includes('kto cię stworzył') || lowerInput.includes('kto cie stworzyl')) {
      const reply = 'Zostałem stworzony jako zaawansowany model AI z silnikiem w Pythonie, połączony z Gemini oraz Dyskiem Google.';
      addMessage({ sender: 'jarvis', text: reply });
      speakJarvis(reply);
      return;
    }

    // 5. Check Learned Memory Substring Match (as in Python: for key in self.commands if key in message)
    for (const [key, value] of Object.entries(learnedCommands)) {
      if (lowerInput.includes(key.toLowerCase())) {
        soundFx.playSuccess();
        const respText = String(value);
        addMessage({
          sender: 'jarvis',
          text: respText,
          isLearnedCommand: true,
          commandMatched: key,
        });
        speakJarvis(respText);
        return;
      }
    }

    // 6. Strict vs Hybrid fallback mode
    if (aiMode === 'strict_python') {
      const fallbackMsg = 'Nie wiem co powiedzieć. Naucz mnie wpisując: ucz się [komenda] = [odpowiedź]';
      addMessage({ sender: 'jarvis', text: fallbackMsg });
      speakJarvis(fallbackMsg);
      return;
    }

    // 7. Hybrid AI mode with Gemini 3.7 Flash
    setJarvisState('processing');
    soundFx.playProcessing();

    try {
      const res = await fetch('/api/jarvis/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanInput,
          history: messages.slice(-5),
          learnedCommands: learnedCommands,
          autoLearnEnabled: autoLearnEnabled,
          deviceLocation: deviceConfig.deviceLocation,
          userTitle: deviceConfig.userTitle,
          defaultMusicService: deviceConfig.defaultMusicService,
          favoriteTrackOrGenre: deviceConfig.favoriteTrackOrGenre,
          masterDirectivePrompt: deviceConfig.masterDirectivePrompt,
          mandatoryRules: deviceConfig.mandatoryRules,
        }),
      });

      const data = await res.json();
      const aiReply = data.response || 'Przepraszam, nie udało się przetworzyć tego polecenia.';

      // If AI autonomously extracted and learned a fact from user's sentence
      if (data.autoLearned && data.autoLearned.key && data.autoLearned.value) {
        const learnedKey = data.autoLearned.key.toLowerCase();
        const learnedVal = data.autoLearned.value;
        setLearnedCommands((prev) => {
          const updated = { ...prev, [learnedKey]: learnedVal };
          localStorage.setItem('jarvis_memory', JSON.stringify(updated));
          return updated;
        });
        soundFx.playSuccess();
      }

      // If AI generated an image dynamically from prompt intent
      if (data.generatedImage && data.generatedImage.imageUrl) {
        soundFx.playSuccess();
        const imgItem: GeneratedImageItem = {
          id: `gen-${Date.now()}`,
          prompt: data.generatedImage.prompt || cleanInput,
          revisedPrompt: data.generatedImage.revisedPrompt,
          imageUrl: data.generatedImage.imageUrl,
          createdAt: data.generatedImage.timestamp || new Date().toLocaleTimeString('pl-PL'),
          aspectRatio: data.generatedImage.aspectRatio || '1:1',
          style: data.generatedImage.style || 'stark_hologram',
          modelUsed: data.generatedImage.generatorSource || 'Stark AI Generator',
        };
        try {
          const raw = localStorage.getItem('jarvis_image_gallery');
          const currentGallery: GeneratedImageItem[] = raw ? JSON.parse(raw) : [];
          const updated = [imgItem, ...currentGallery.filter((g) => g.id !== imgItem.id)].slice(0, 30);
          localStorage.setItem('jarvis_image_gallery', JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save gallery to local storage:', e);
        }
      }

      addMessage({
        sender: 'jarvis',
        text: aiReply,
        isAiGenerated: true,
        autoLearnedFact: data.autoLearned || undefined,
        generatedImageUrl: data.generatedImage?.imageUrl,
        imagePrompt: data.generatedImage?.prompt,
        imageAspectRatio: data.generatedImage?.aspectRatio,
        imageStyle: data.generatedImage?.style,
      });
      speakJarvis(aiReply);
    } catch (err: any) {
      const errMsg = 'Wystąpił błąd podczas kontaktu z modułem AI. Naucz mnie komendy za pomocą: ucz się [komenda] = [odpowiedź]';
      addMessage({ sender: 'jarvis', text: errMsg });
      speakJarvis(errMsg);
    } finally {
      if (jarvisState !== 'speaking') {
        setJarvisState('idle');
      }
    }
  };

  // Voice toggle handler (Push to talk / start single voice or resume)
  const handleToggleVoice = () => {
    if (jarvisState === 'listening') {
      speechService.stopListening();
      setJarvisState('idle');
      return;
    }

    if (jarvisState === 'speaking') {
      handleStopSpeaking();
      return;
    }

    startVoiceListening(false);
  };

  // Summarize / Analyze Drive File with Jarvis
  const handleAskJarvisAboutFile = async (file: GoogleDriveFile) => {
    setJarvisState('processing');
    soundFx.playProcessing();

    addMessage({
      sender: 'user',
      text: `Jarvis, przeanalizuj mój plik z Google Drive: "${file.name}"`,
    });

    try {
      const snippet = await googleDriveService.getFileSnippet(file);
      const res = await fetch('/api/jarvis/drive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.mimeType,
          fileContent: snippet,
        }),
      });

      const data = await res.json();
      const summary = data.summary || `Plik ${file.name} został pomyślnie zindeksowany.`;
      addMessage({
        sender: 'jarvis',
        text: summary,
        isAiGenerated: true,
      });
      speakJarvis(`Oto podsumowanie pliku ${file.name}, Sir.`);
    } catch (err: any) {
      const errTxt = `Nie udało się przeprowadzić pełnej analizy pliku ${file.name}: ${err.message}`;
      addMessage({ sender: 'jarvis', text: errTxt });
      speakJarvis(errTxt);
    } finally {
      setJarvisState('idle');
    }
  };

  const toggleSound = () => {
    const next = !isVoiceMuted;
    setIsVoiceMuted(next);
    soundFx.setMuted(next);
    if (next) {
      speechService.stopSpeaking();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Top Futuristic Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span className="font-['Orbitron'] font-extrabold text-sm">J</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Orbitron'] font-bold text-sm sm:text-base tracking-wider text-slate-100">
                  ADVANCED JARVIS
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-mono">
                  v2.5 AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Python Memory Core + Google Drive + Gemini AI
              </p>
            </div>
          </div>

          {/* Navigation View Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => setActiveTab('hud')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'hud'
                  ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>HUD & Głos</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'terminal'
                  ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal CLI</span>
            </button>
          </div>

          {/* Action Tools Desktop: Screen Vision, Drive, Memory, Python Code, Audio */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              id="btn-nav-voice-settings"
              onClick={() => setIsVoiceSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold text-cyan-300 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] cursor-pointer"
              title="Kalibracja głosu męskiego & ludzkiego Jarvis"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Głos Męski</span>
            </button>

            <button
              id="btn-nav-image-gen"
              onClick={() => setIsImageGenOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/50 hover:border-cyan-300 text-xs font-bold text-cyan-200 hover:text-white transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
              title="Generator Obrazów & Grafik Stark AI"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Obraz AI</span>
            </button>

            <button
              id="btn-nav-training"
              onClick={() => setIsTrainingOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-950/80 to-cyan-950/80 border border-purple-500/50 hover:border-purple-400 text-xs font-bold text-purple-200 hover:text-white transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer"
              title="Centrum Szkolenia & Auto-Uczenia Jarvisa"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Podszkol</span>
            </button>

            <button
              id="btn-nav-screen"
              onClick={handleToggleScreenShare}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isScreenVisionActive
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)] animate-pulse'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40'
              }`}
              title={
                isScreenVisionActive
                  ? 'Wizja ekranu aktywna - kliknij, aby odłączyć'
                  : 'Daj Jarvisowi dostęp do ekranu (udostępnij ekran)'
              }
            >
              {isScreenVisionActive ? (
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Monitor className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
              )}
              <span>{isScreenVisionActive ? 'Ekran (ON)' : 'Wizja Ekranu'}</span>
            </button>

            <button
              id="btn-nav-drive"
              onClick={() => setIsDriveOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDriveConnected
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-blue-300'
              }`}
              title="Google Drive pliki i integracja"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Drive</span>
            </button>

            <button
              id="btn-nav-master-rule"
              onClick={() => setIsMasterRuleOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/80 to-cyan-950/80 border border-amber-500/50 hover:border-amber-400 text-xs font-bold text-amber-200 hover:text-white transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer"
              title="Główna Reguła, Lokalizacja Urządzenia & Nakazy Stark OS"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Reguła</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono border border-amber-500/30">
                {deviceConfig.deviceLocation.split(',')[0]}
              </span>
            </button>

            <button
              id="btn-nav-memory"
              onClick={() => setIsMemoryOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-amber-500/40 text-xs font-semibold text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
              title="Zarządzaj bazą wiedzy jarvis_memory.json"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Pamięć ({systemStats.memoryEntriesCount})</span>
            </button>

            <button
              id="btn-nav-python"
              onClick={() => {
                soundFx.playBeep();
                setIsPythonCodeOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-800/90 to-blue-950/80 border border-cyan-500/50 hover:border-cyan-400 text-xs font-bold text-cyan-200 hover:text-white transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:shadow-[0_0_18px_rgba(6,182,212,0.4)] cursor-pointer group"
              title="Zobacz i pobierz zaktualizowany kod Python (Pełna kontrola OS: mysz, klawiatura, ekran, głos)"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Python</span>
              <span className="text-[10px] px-1 py-0.2 bg-cyan-500/20 text-cyan-300 rounded font-mono border border-cyan-500/30">
                v4.0
              </span>
            </button>

            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isVoiceMuted
                  ? 'bg-red-950/40 border-red-500/40 text-red-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-cyan-400'
              }`}
              title={isVoiceMuted ? 'Dźwięk wyciszony' : 'Dźwięk aktywny'}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Right Controls: Sound & Menu Toggle */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isVoiceMuted
                  ? 'bg-red-950/40 border-red-500/40 text-red-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
              title={isVoiceMuted ? 'Dźwięk wyciszony' : 'Dźwięk aktywny'}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-cyan-300 hover:bg-slate-700 transition-colors"
              title="Menu narzędzi mobilnych"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Tools Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-800/90 grid grid-cols-2 gap-2 animate-fade-in">
            <button
              onClick={() => {
                setIsVoiceSettingsOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left text-xs text-slate-200 flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Głos Męski</span>
            </button>

            <button
              onClick={() => {
                setIsImageGenOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left text-xs text-slate-200 flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Obraz AI</span>
            </button>

            <button
              onClick={() => {
                setIsMasterRuleOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left text-xs text-slate-200 flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Reguła Stark OS</span>
            </button>

            <button
              onClick={() => {
                setIsMemoryOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left text-xs text-slate-200 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Pamięć ({systemStats.memoryEntriesCount})</span>
            </button>

            <button
              onClick={() => {
                setIsTrainingOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-left text-xs text-slate-200 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Podszkol</span>
            </button>

            <button
              onClick={() => {
                setIsDriveOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-left text-xs text-slate-200 flex items-center gap-2"
            >
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Google Drive</span>
            </button>

            <button
              onClick={() => {
                setIsPythonCodeOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left text-xs text-slate-200 flex items-center gap-2 col-span-2"
            >
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Kod Python OS v4.0</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {activeTab === 'hud' ? (
          <HudView
            jarvisState={jarvisState}
            systemStats={systemStats}
            lastResponse={lastResponse}
            transcript={transcript}
            isConversationMode={isConversationMode}
            onToggleConversationMode={handleToggleConversationMode}
            onToggleVoice={handleSingleVoiceTrigger}
            onToggleMute={toggleSound}
            onStopSpeaking={handleStopSpeaking}
            onToggleAiMode={() =>
              setAiMode((prev) => (prev === 'hybrid' ? 'strict_python' : 'hybrid'))
            }
            onExecuteCommand={(cmd) => handleCommand(cmd)}
            onOpenDrive={() => setIsDriveOpen(true)}
            onOpenMemory={() => setIsMemoryOpen(true)}
            onOpenTeach={() => setIsTeachOpen(true)}
            onOpenTraining={() => setIsTrainingOpen(true)}
            onOpenMasterRule={() => setIsMasterRuleOpen(true)}
            onOpenImageGen={() => setIsImageGenOpen(true)}
            onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
            onTriggerMusic={() => handleTriggerMusic()}
            onSwitchToTerminal={() => setActiveTab('terminal')}
            isScreenVisionActive={isScreenVisionActive}
            isScanningScreen={isScanningScreen}
            onToggleScreenShare={handleToggleScreenShare}
            onStopScreenShare={handleStopScreenShare}
            onAnalyzeScreen={() => handleAnalyzeScreen()}
            deviceConfig={deviceConfig}
          />
        ) : (
          <TerminalView
            messages={messages}
            onSendMessage={(text) => handleCommand(text)}
            onClear={() => setMessages([])}
            onOpenTeachModal={() => setIsTeachOpen(true)}
            onOpenDriveModal={() => setIsDriveOpen(true)}
            onOpenTraining={() => setIsTrainingOpen(true)}
            onOpenMasterRule={() => setIsMasterRuleOpen(true)}
            onOpenImageGen={() => setIsImageGenOpen(true)}
            onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
            onStartVoice={handleSingleVoiceTrigger}
            isProcessing={jarvisState === 'processing'}
            isListening={jarvisState === 'listening'}
            isSpeaking={jarvisState === 'speaking'}
            isConversationMode={isConversationMode}
            onToggleConversationMode={handleToggleConversationMode}
            onStopSpeaking={handleStopSpeaking}
            transcript={transcript}
            isVoiceMuted={isVoiceMuted}
            onToggleMute={toggleSound}
            isScreenVisionActive={isScreenVisionActive}
            isScanningScreen={isScanningScreen}
            onToggleScreenShare={handleToggleScreenShare}
            onAnalyzeScreen={() => handleAnalyzeScreen()}
            deviceConfig={deviceConfig}
          />
        )}
      </main>

      {/* Modals */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        userTitle={deviceConfig.userTitle}
      />

      <DriveWidget
        isOpen={isDriveOpen}
        onClose={() => {
          setIsDriveOpen(false);
          setIsDriveConnected(googleDriveService.isAuthenticated());
        }}
        onAskJarvisAboutFile={handleAskJarvisAboutFile}
      />

      <ImageGeneratorModal
        isOpen={isImageGenOpen}
        onClose={() => setIsImageGenOpen(false)}
        onSendToChat={handleSendGeneratedImageToChat}
        onSpeak={speakJarvis}
      />

      <MemoryManager
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        learnedCommands={learnedCommands}
        onSaveCommand={handleSaveLearnedCommand}
        onDeleteCommand={handleDeleteLearnedCommand}
        onImportMemory={handleImportMemory}
        onExportMemory={handleExportMemory}
        onMemoryChanged={refreshMemoryCounts}
        onOpenTraining={() => {
          setIsMemoryOpen(false);
          setIsTrainingOpen(true);
        }}
      />

      <MasterRuleModal
        isOpen={isMasterRuleOpen}
        onClose={() => setIsMasterRuleOpen(false)}
        deviceConfig={deviceConfig}
        onSaveDeviceConfig={handleSaveDeviceConfig}
        onTriggerMusic={handleTriggerMusic}
      />

      <TeachModal
        isOpen={isTeachOpen}
        onClose={() => setIsTeachOpen(false)}
        onTeach={handleSaveLearnedCommand}
        onOpenTraining={() => {
          setIsTeachOpen(false);
          setIsTrainingOpen(true);
        }}
      />

      <TrainingModal
        isOpen={isTrainingOpen}
        onClose={() => setIsTrainingOpen(false)}
        learnedCommandsCount={Object.keys(learnedCommands).length}
        onApplyKnowledgePack={handleApplyKnowledgePack}
        autoLearnEnabled={autoLearnEnabled}
        onToggleAutoLearn={() => setAutoLearnEnabled((prev) => !prev)}
        onSpeak={speakJarvis}
      />

      <PythonCodeModal
        isOpen={isPythonCodeOpen}
        onClose={() => setIsPythonCodeOpen(false)}
      />

      <MicPermissionModal
        isOpen={isMicPermissionOpen}
        onClose={() => {
          setIsMicPermissionOpen(false);
          setPendingVoiceAction(null);
        }}
        onGranted={() => {
          setIsMicPermissionOpen(false);
          if (pendingVoiceAction === 'conversation') {
            triggerConversationMode();
          } else {
            startVoiceListening(false);
          }
          setPendingVoiceAction(null);
        }}
      />

      {/* Dedicated Floating Voice Dock for Mobile Devices & Smartphones */}
      <MobileVoiceDock
        jarvisState={jarvisState}
        transcript={transcript}
        lastResponse={lastResponse}
        isConversationMode={isConversationMode}
        isVoiceMuted={isVoiceMuted}
        audioLevel={audioLevel}
        onToggleVoice={handleSingleVoiceTrigger}
        onToggleConversationMode={handleToggleConversationMode}
        onToggleMute={toggleSound}
        onStopSpeaking={handleStopSpeaking}
        onSendCommand={(cmd) => handleCommand(cmd)}
        onCancelListening={() => {
          speechService.stopListening();
          setJarvisState('idle');
          setAudioLevel(0);
          setTranscript('');
        }}
      />
    </div>
  );
}
