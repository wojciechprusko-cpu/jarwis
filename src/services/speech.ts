// Speech Synthesis and Speech Recognition Service for Jarvis

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

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveTimer: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoices();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
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

      // Clean markdown tags or symbols for cleaner speech
      const cleanText = text
        .replace(/[*_#`~[\]()]/g, '')
        .replace(/https?:\/\/\S+/g, 'link')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return false;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = 1.05; // futuristic crisp cadence
      utterance.pitch = 0.95; // Jarvis authoritative tone
      this.currentUtterance = utterance;

      const voices = this.getVoices();
      const polishVoices = this.getPolishVoices();
      if (polishVoices.length > 0) {
        utterance.voice = polishVoices[0];
      } else {
        const matching = voices.find((v) =>
          v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2))
        );
        if (matching) utterance.voice = matching;
      }

      utterance.onend = () => {
        this.clearKeepAlive();
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.clearKeepAlive();
        this.currentUtterance = null;
        console.warn('Speech synthesis event:', e);
        if (onError) onError();
        else if (onEnd) onEnd();
      };

      // Keep alive mechanism for long speeches in Chromium
      this.clearKeepAlive();
      this.keepAliveTimer = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }
      }, 10000);

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
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Microphone permission request failed:', err);
      return false;
    }
  }

  public async startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void,
    lang: string = 'pl-PL'
  ): Promise<boolean> {
    // If Web Speech API is supported, use it for zero-latency live streaming
    if (this.isSpeechRecognitionSupported()) {
      try {
        this.stopListening();

        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
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

        this.recognition.onerror = (event: any) => {
          this.isListening = false;
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
        console.warn('Web Speech API failed, falling back to MediaRecorder:', err);
      }
    }

    // Fallback: Use MediaRecorder with audio transcription
    if (this.isMediaRecorderSupported()) {
      return await this.startMediaRecorder(onResult, onError, onEnd);
    }

    onError({
      error: 'not-supported',
      message: 'Mikrofon nie jest obsługiwany w tej przeglądarce.',
    });
    return false;
  }

  // Fallback MediaRecorder implementation
  private async startMediaRecorder(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): Promise<boolean> {
    try {
      this.stopListening();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;
      this.audioChunks = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.isListening = false;
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStream = null;
        }

        if (this.audioChunks.length === 0) {
          onEnd();
          return;
        }

        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.audioChunks = [];

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            if (!base64Data) {
              onEnd();
              return;
            }

            try {
              const res = await fetch('/api/jarvis/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Data, mimeType }),
              });
              const data = await res.json();
              if (data.transcript) {
                onResult(data.transcript, true);
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

      this.mediaRecorder.start(250);
      this.isListening = true;
      return true;
    } catch (err: any) {
      this.isListening = false;
      onError({ error: 'permission-denied', message: err?.message || 'Brak dostępu do mikrofonu' });
      return false;
    }
  }

  public stopListening() {
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
