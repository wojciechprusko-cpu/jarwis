import { GoogleDriveFile } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenClient: any = null;
  private userProfile: { name?: string; email?: string; picture?: string } | null = null;

  constructor() {
    // Check if token stored in sessionStorage
    if (typeof window !== 'undefined') {
      const savedToken = sessionStorage.getItem('jarvis_gdrive_token');
      if (savedToken) {
        this.accessToken = savedToken;
      }
      const savedProfile = sessionStorage.getItem('jarvis_gdrive_profile');
      if (savedProfile) {
        try {
          this.userProfile = JSON.parse(savedProfile);
        } catch {
          // ignore
        }
      }
    }
  }

  public isAuthenticated(): boolean {
    return Boolean(this.accessToken);
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getUserProfile() {
    return this.userProfile;
  }

  public setToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jarvis_gdrive_token', token);
    }
  }

  public disconnect() {
    this.accessToken = null;
    this.userProfile = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('jarvis_gdrive_token');
      sessionStorage.removeItem('jarvis_gdrive_profile');
    }
  }

  public async initOAuthClient(clientId?: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      return false;
    }
    return true;
  }

  public requestAccessToken(clientId: string = ''): Promise<{ token: string; profile?: any }> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services library is not loaded yet. Sprawdź połączenie.'));
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId || '452339006195-placeholder.apps.googleusercontent.com',
          scope: SCOPES,
          callback: async (response: any) => {
            if (response.error) {
              return reject(new Error(`Google OAuth error: ${response.error}`));
            }
            if (response.access_token) {
              this.setToken(response.access_token);

              // Try fetching user profile info
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` },
                });
                if (userRes.ok) {
                  const profile = await userRes.json();
                  this.userProfile = {
                    name: profile.name,
                    email: profile.email,
                    picture: profile.picture,
                  };
                  sessionStorage.setItem('jarvis_gdrive_profile', JSON.stringify(this.userProfile));
                }
              } catch (e) {
                console.warn('Could not fetch user profile details:', e);
              }

              resolve({ token: response.access_token, profile: this.userProfile });
            } else {
              reject(new Error('No access token returned from Google authentication.'));
            }
          },
        });

        // Prompt user
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  public async listFiles(searchTerm: string = '', pageSize: number = 20): Promise<GoogleDriveFile[]> {
    if (!this.accessToken) {
      throw new Error('Brak autoryzacji Google Drive. Połącz swoje konto, aby Jarvis mógł przeszukać dysk.');
    }

    let q = "trashed = false";
    if (searchTerm.trim()) {
      const sanitized = searchTerm.replace(/'/g, "\\'");
      q += ` and (name contains '${sanitized}' or fullText contains '${sanitized}')`;
    }

    const fields = 'files(id, name, mimeType, iconLink, webViewLink, thumbnailLink, size, modifiedTime, shared, owners)';
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=${encodeURIComponent(
      fields
    )}&q=${encodeURIComponent(q)}&orderBy=modifiedTime desc`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.disconnect();
        throw new Error('Sesja Google Drive wygasła (401). Proszę połączyć konto ponownie.');
      }
      const errText = await response.text();
      throw new Error(`Błąd Google Drive API: ${errText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  public async createFile(name: string, content: string, mimeType: string = 'text/plain'): Promise<GoogleDriveFile> {
    if (!this.accessToken) {
      throw new Error('Brak autoryzacji Google Drive.');
    }

    const metadata = {
      name: name.endsWith('.txt') || name.endsWith('.md') || name.includes('.') ? name : `${name}.txt`,
      mimeType: mimeType,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Nie udało się utworzyć pliku: ${err}`);
    }

    return await response.json();
  }

  public async getFileSnippet(file: GoogleDriveFile): Promise<string> {
    if (!this.accessToken) return '';
    try {
      // If it's a Google Doc, export as plain text
      if (file.mimeType === 'application/vnd.google-apps.document') {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        if (res.ok) {
          const text = await res.text();
          return text.slice(0, 3000);
        }
      } else if (file.mimeType.startsWith('text/') || file.mimeType.includes('json') || file.mimeType.includes('csv')) {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        if (res.ok) {
          const text = await res.text();
          return text.slice(0, 3000);
        }
      }
      return `Plik binarny lub dokument [${file.name}]. Typ: ${file.mimeType}. Zmodyfikowany: ${file.modifiedTime}`;
    } catch (e) {
      return `Błąd pobierania podglądu pliku: ${e}`;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
