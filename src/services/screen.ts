// Screen Vision and Capture Service for Jarvis

class ScreenVisionService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isCapturing: boolean = false;
  private onStopCallback: (() => void) | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && Boolean(navigator?.mediaDevices?.getDisplayMedia);
  }

  public getIsActive(): boolean {
    return Boolean(this.stream && this.stream.active);
  }

  public async startScreenShare(onStop?: () => void): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        error: 'Udostępnianie ekranu (getDisplayMedia) nie jest obsługiwane w Twojej przeglądarce.',
      };
    }

    try {
      this.stopScreenShare();

      // Request screen or window or browser tab display stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        } as any,
        audio: false,
      });

      this.stream = stream;
      this.onStopCallback = onStop || null;

      // Handle user stopping screen share from browser native bar
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopScreenShare();
          if (this.onStopCallback) {
            this.onStopCallback();
          }
        };
      }

      // Hidden video element to render frame for instant snapshot capture
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.position = 'fixed';
        this.videoElement.style.top = '-9999px';
        this.videoElement.style.left = '-9999px';
        this.videoElement.style.width = '1px';
        this.videoElement.style.height = '1px';
        document.body.appendChild(this.videoElement);
      }

      this.videoElement.srcObject = stream;
      await this.videoElement.play().catch(() => {});

      this.isCapturing = true;
      return { success: true };
    } catch (err: any) {
      this.isCapturing = false;
      console.warn('Screen share start failed/cancelled:', err);
      return {
        success: false,
        error: err?.message || 'Udostępnianie ekranu zostało anulowane lub odrzucone.',
      };
    }
  }

  public stopScreenShare() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isCapturing = false;
  }

  public getMediaStream(): MediaStream | null {
    return this.stream;
  }

  // Capture a snapshot frame from the active screen stream as base64 JPEG
  public captureFrame(quality: number = 0.85): { base64: string; dataUrl: string } | null {
    if (!this.videoElement || !this.stream || !this.stream.active) {
      return null;
    }

    try {
      const video = this.videoElement;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      // Scale down slightly if 4K to avoid huge payload while keeping text sharp
      const maxDim = 1600;
      let targetW = width;
      let targetH = height;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1];

      return { base64, dataUrl };
    } catch (err) {
      console.error('Frame capture error:', err);
      return null;
    }
  }

  // Analyze screen frame with Jarvis AI
  public async analyzeCurrentScreen(
    prompt?: string,
    history?: Array<{ sender: string; text: string }>
  ): Promise<{ response?: string; error?: string; snapshotUrl?: string }> {
    const frame = this.captureFrame();
    if (!frame) {
      return {
        error: 'Nie można pobrać klatki ekranu. Upewnij się, że udostępnianie ekranu jest aktywne.',
      };
    }

    try {
      const res = await fetch('/api/jarvis/analyze-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frame.base64,
          mimeType: 'image/jpeg',
          prompt: prompt || 'Przeanalizuj to co widzisz na moim ekranie.',
          history: history || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Błąd analizy ekranu przez Jarvis AI' };
      }

      return { response: data.response, snapshotUrl: frame.dataUrl };
    } catch (err: any) {
      return { error: err?.message || 'Błąd połączenia z serwerem analizy wizualnej' };
    }
  }
}

export const screenVision = new ScreenVisionService();
