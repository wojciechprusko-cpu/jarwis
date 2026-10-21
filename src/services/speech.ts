// Speech Synthesis and Speech Recognition Service for Jarvis with Deep Masculine Human Voice Tuning
// Specially enhanced for 100% reliability on Mobile Phones (iOS Safari, Android Chrome, mobile webviews, tablets)

export interface SpeechRecognitionResultEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

export interface VoiceSettings {
  pitch: number; // default 0.88 for deep masculine tone
  rate: number; // default 1.04 for crisp, human cadence
  selectedVoiceURI: string;
  volume: number; // 0 to 1
  voicePreset: 'deep_jarvis' | 'natural_male' | 'british_butler' | 'command_tactical';
  speechEngine: 'auto' | 'gemini_media' | 'web_speech'; // 'auto' uses gemini_media on mobile for 100% stability
}

export interface ListeningOptions {
  forceEngine?: 'gemini_media' | 'web_speech';
  autoSilenceMs?: number; // ms of silence after speech to auto-submit (default 1500)
  onAudioLevel?: (level: number) => void; // 0 to 100 for live waveform visualization
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  pitch: 0.88,
  rate: 1.04,
  selectedVoiceURI: '',
  volume: 1.0,
  voicePreset: 'deep_jarvis',
  speechEngine: 'auto',
};

// Helper: check if running on a mobile phone or tablet device
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  const hasTouch = 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  return mobileRegex.test(ua) || (hasTouch && isSmallScreen);
}

// Helper: check specifically for iOS WebKit (iPhone / iPad Safari or Chrome iOS)
export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveTimer: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioAnimFrame: number | null = null;
  private silenceTimer: any = null;
  private hasSpoken: boolean = false;
  private settings: VoiceSettings = DEFAULT_VOICE_SETTINGS;
  private audioUnlocked: boolean = false;
  private audioLevelListener: ((level: number) => void) | null = null;

  constructor() {
    this.loadSettings();
    if (typeof window !== 'undefined') {
      this.initVoices();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
    }
  }

  private loadSettings() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('jarvis_voice_settings');
        if (stored) {
          this.settings = { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(stored) };
        }
      } catch (e) {
        console.warn('Failed to load voice settings:', e);
      }
    }
  }

  public saveSettings(newSettings: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jarvis_voice_settings', JSON.stringify(this.settings));
      } catch (e) {
        console.warn('Failed to save voice settings:', e);
      }
    }
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  // Pre-warms / unlocks AudioContext and SpeechSynthesis on user touch/click
  // This is MANDATORY for iOS Safari & Android Chrome which block audio without a prior gesture
  public unlockAudio() {
    if (typeof window === 'undefined') return;

    try {
      // 1. Unlock Web Audio API context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const testCtx = new AudioCtx();
        if (testCtx.state === 'suspended') {
          testCtx.resume().catch(() => {});
        }
        const osc = testCtx.createOscillator();
        const gain = testCtx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(testCtx.destination);
        osc.start(0);
        osc.stop(0.01);
      }

      // 2. Unlock SpeechSynthesis on iOS / Android
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
        const silentUtterance = new SpeechSynthesisUtterance(' ');
        silentUtterance.volume = 0.001;
        window.speechSynthesis.speak(silentUtterance);
      }

      // 3. Force populate voices
      this.initVoices();
      this.audioUnlocked = true;
    } catch (e) {
      console.warn('Audio unlock warning:', e);
    }
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  public getPolishVoices(): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    return all.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('pl') ||
        v.name.toLowerCase().includes('polish') ||
        v.name.toLowerCase().includes('polski')
    );
  }

  // Find the best human masculine voice candidate
  public getBestMasculineVoice(lang: string = 'pl-PL'): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    // Check if user manually picked a voice URI
    if (this.settings.selectedVoiceURI) {
      const explicit = voices.find((v) => v.voiceURI === this.settings.selectedVoiceURI);
      if (explicit) return explicit;
    }

    const isPl = lang.toLowerCase().startsWith('pl');
    const langFiltered = voices.filter((v) =>
      isPl
        ? v.lang.toLowerCase().startsWith('pl') ||
          v.name.toLowerCase().includes('polish') ||
          v.name.toLowerCase().includes('polski')
        : v.lang.toLowerCase().startsWith('en')
    );

    // Filter keywords
    const maleKeywords = [
      'marek',
      'jan',
      'jacek',
      'piotr',
      'krzysztof',
      'adam',
      'daniel',
      'paul',
      'george',
      'david',
      'brian',
      'guy',
      'male',
      'męski',
      'meski',
      'natural',
      'neural',
      'online',
      'wavenet',
    ];

    const femaleKeywords = [
      'paulina',
      'ewa',
      'zofia',
      'agnieszka',
      'maja',
      'zira',
      'jenny',
      'emma',
      'female',
      'kobiecy',
      'daria',
      'helena',
    ];

    // 1. First priority: Language matching male voice
    const maleMatch = langFiltered.find((v) => {
      const lower = v.name.toLowerCase();
      const isFemale = femaleKeywords.some((f) => lower.includes(f));
      if (isFemale) return false;
      return maleKeywords.some((m) => lower.includes(m));
    });
    if (maleMatch) return maleMatch;

    // 2. Second priority: Non-female language voice
    const nonFemale = langFiltered.find((v) => {
      const lower = v.name.toLowerCase();
      return !femaleKeywords.some((f) => lower.includes(f));
    });
    if (nonFemale) return nonFemale;

    // 3. Third priority: Any voice for that language (e.g. iOS Siri Polish voice)
    if (langFiltered.length > 0) return langFiltered[0];

    // 4. Fallback to English Male (like Paul Bettany JARVIS)
    const enMale = voices.find((v) => {
      const lower = v.name.toLowerCase();
      return (
        v.lang.toLowerCase().startsWith('en') &&
        maleKeywords.some((m) => lower.includes(m)) &&
        !femaleKeywords.some((f) => lower.includes(f))
      );
    });
    if (enMale) return enMale;

    return voices[0] || null;
  }

  public speak(
    text: string,
    lang: string = 'pl-PL',
    onEnd?: () => void,
    onError?: () => void
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return false;
    }

    try {
      this.stopSpeaking();

      // Clean markdown tags, emojis, and symbols for crisp human speech
      const cleanText = text
        .replace(/[*_#`~[\]()]/g, '')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return false;
      }

      // Ensure speech synthesis is resumed (crucial on iOS Safari and Chrome Android)
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;

      // Apply masculine deep pitch and crisp human tempo
      utterance.pitch = this.settings.pitch || 0.88;
      utterance.rate = this.settings.rate || 1.04;
      utterance.volume = this.settings.volume ?? 1.0;

      const selectedVoice = this.getBestMasculineVoice(lang);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      this.currentUtterance = utterance;
      // Prevent iOS garbage collection bug by pinning to window
      (window as any).__jarvis_current_utterance = utterance;

      let hasFinished = false;
      const finishOnce = (isError = false) => {
        if (hasFinished) return;
        hasFinished = true;
        this.clearKeepAlive();
        this.currentUtterance = null;
        (window as any).__jarvis_current_utterance = null;
        if (isError) {
          if (onError) onError();
          else if (onEnd) onEnd();
        } else {
          if (onEnd) onEnd();
        }
      };

      utterance.onend = () => {
        finishOnce(false);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis event:', e);
        finishOnce(true);
      };

      // Keep alive mechanism for long speeches in Chromium & iOS
      this.clearKeepAlive();
      this.keepAliveTimer = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }
      }, 5000);

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      this.clearKeepAlive();
      console.error('Speech synthesis error:', err);
      if (onEnd) onEnd();
      return false;
    }
  }

  private clearKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  public stopSpeaking() {
    this.clearKeepAlive();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    if (typeof window !== 'undefined') {
      (window as any).__jarvis_current_utterance = null;
    }
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  public isMediaRecorderSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(navigator?.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined');
  }

  // Request explicit mic permission
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      this.unlockAudio();
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Microphone permission request failed:', err);
      return false;
    }
  }

  // Best supported audio MIME type across iOS Safari, Android Chrome, desktop
  public getSupportedMimeType(): string {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];
    for (const t of candidates) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  // Primary speech recognition entry point with automatic mobile optimization
  public async startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void,
    lang: string = 'pl-PL',
    options?: ListeningOptions
  ): Promise<boolean> {
    this.unlockAudio();
    this.stopListening();

    const isMobile = isMobileDevice();
    const effectiveEngine = options?.forceEngine || this.settings.speechEngine || 'auto';

    // On mobile devices, or when explicitly chosen, MediaRecorder + Gemini Transcribe is 100% resilient
    // Web Speech API on iOS Safari frequently throws 'service-not-allowed' or 'network'
    const shouldUseMediaRecorderFirst =
      effectiveEngine === 'gemini_media' ||
      (effectiveEngine === 'auto' && isMobile) ||
      !this.isSpeechRecognitionSupported();

    if (shouldUseMediaRecorderFirst && this.isMediaRecorderSupported()) {
      return await this.startMediaRecorder(onResult, onError, onEnd, options);
    }

    // Try Web Speech API for desktop or when requested
    if (this.isSpeechRecognitionSupported()) {
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // On mobile, continuous MUST be false or iOS/Android will crash or abort
        this.recognition.continuous = !isMobile;
        this.recognition.interimResults = true;
        this.recognition.lang = lang;

        this.recognition.onstart = () => {
          this.isListening = true;
        };

        this.recognition.onresult = (event: SpeechRecognitionResultEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = 0; i < Object.keys(event.results).length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              finalTranscript += res[0].transcript;
            } else {
              interimTranscript += res[0].transcript;
            }
          }

          const transcript = finalTranscript || interimTranscript;
          const isFinal = Boolean(finalTranscript);
          onResult(transcript, isFinal);
        };

        this.recognition.onerror = async (event: any) => {
          this.isListening = false;
          console.warn('Web Speech API error, falling back to MediaRecorder:', event);

          // If Web Speech API fails on mobile/desktop, seamlessly switch to MediaRecorder!
          if (this.isMediaRecorderSupported()) {
            const fbStarted = await this.startMediaRecorder(onResult, onError, onEnd, options);
            if (fbStarted) return;
          }
          onError(event);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          onEnd();
        };

        this.recognition.start();
        this.isListening = true;
        return true;
      } catch (err) {
        this.isListening = false;
        console.warn('Web Speech API start error, falling back to MediaRecorder:', err);
      }
    }

    // Fallback: Use MediaRecorder with audio transcription
    if (this.isMediaRecorderSupported()) {
      return await this.startMediaRecorder(onResult, onError, onEnd, options);
    }

    onError({
      error: 'not-supported',
      message: 'Mikrofon nie jest obsługiwany w tej przeglądarce.',
    });
    return false;
  }

  // Resilient MediaRecorder implementation with live audio level visualization & auto-silence VAD
  private async startMediaRecorder(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void,
    options?: ListeningOptions
  ): Promise<boolean> {
    try {
      this.stopListening();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      this.audioChunks = [];
      this.hasSpoken = false;

      const mimeType = this.getSupportedMimeType();
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      this.mediaRecorder = new MediaRecorder(stream, recorderOptions);

      // Setup Web Audio Analyser for live visual waveform & silence detection
      this.setupAudioAnalyser(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.isListening = false;
        this.cleanupAnalyser();

        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStream = null;
        }

        if (this.audioChunks.length === 0) {
          onEnd();
          return;
        }

        const effectiveMime = this.mediaRecorder?.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: effectiveMime });
        this.audioChunks = [];

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const raw = reader.result as string;
            const base64Data = raw ? raw.split(',')[1] : null;
            if (!base64Data) {
              onEnd();
              return;
            }

            try {
              const res = await fetch('/api/jarvis/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Data, mimeType: effectiveMime }),
              });
              const data = await res.json();
              if (data.transcript && data.transcript.trim()) {
                onResult(data.transcript.trim(), true);
              } else {
                onError({ error: 'no-speech', message: 'Nie wykryto mowy.' });
              }
            } catch (err) {
              onError(err);
            } finally {
              onEnd();
            }
          };
        } catch (err) {
          onError(err);
          onEnd();
        }
      };

      // Start recording.
      // On iOS Safari, passing a timeslice can break MP4 chunk headers, so we don't pass timeslice on iOS.
      if (isIOS()) {
        this.mediaRecorder.start();
      } else {
        this.mediaRecorder.start(1000);
      }

      this.isListening = true;
      return true;
    } catch (err: any) {
      this.isListening = false;
      this.cleanupAnalyser();
      console.warn('startMediaRecorder error:', err);
      onError({ error: 'permission-denied', message: err?.message || 'Brak dostępu do mikrofonu' });
      return false;
    }
  }

  // Setup Web Audio Analyser for live dB volume tracking & silence detection
  private setupAudioAnalyser(stream: MediaStream, options?: ListeningOptions) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const autoSilenceMs = options?.autoSilenceMs ?? 1600;
      let lastSpeechTime = Date.now();

      const checkVolume = () => {
        if (!this.analyser || !this.isListening) return;

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Normalize 0 to 100
        const level = Math.min(100, Math.round((avg / 128) * 100));

        if (options?.onAudioLevel) {
          options.onAudioLevel(level);
        }
        if (this.audioLevelListener) {
          this.audioLevelListener(level);
        }

        // Voice Activity Detection (VAD)
        if (level > 15) {
          this.hasSpoken = true;
          lastSpeechTime = Date.now();
        } else if (this.hasSpoken && Date.now() - lastSpeechTime > autoSilenceMs) {
          // Auto-silence reached after user spoke: stop and transcribe!
          this.stopListening();
          return;
        }

        this.audioAnimFrame = requestAnimationFrame(checkVolume);
      };

      this.audioAnimFrame = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn('Audio analyser setup warning:', e);
    }
  }

  private cleanupAnalyser() {
    if (this.audioAnimFrame) {
      cancelAnimationFrame(this.audioAnimFrame);
      this.audioAnimFrame = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close().catch(() => {});
      } catch (e) {}
      this.audioCtx = null;
    }
    this.analyser = null;
    this.hasSpoken = false;
    if (this.audioLevelListener) {
      this.audioLevelListener(0);
    }
  }

  public setAudioLevelListener(listener: ((level: number) => void) | null) {
    this.audioLevelListener = listener;
  }

  public stopListening() {
    this.cleanupAnalyser();

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.isListening = false;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechService();
