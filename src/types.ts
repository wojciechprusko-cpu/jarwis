export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  isLearnedCommand?: boolean;
  isAiGenerated?: boolean;
  isScreenVision?: boolean;
  screenSnapshot?: string;
  commandMatched?: string;
  autoLearnedFact?: { key: string; value: string };
  driveData?: any;
}

export interface LearnedCommand {
  command: string;
  response: string;
  createdAt?: string;
  category?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
  shared?: boolean;
  owners?: Array<{ displayName: string; emailAddress: string; photoLink?: string }>;
}

export type JarvisState = 'idle' | 'listening' | 'processing' | 'speaking' | 'learning' | 'offline' | 'scanning_screen';

export interface SystemStats {
  coreStatus: 'ONLINE' | 'STANDBY' | 'LEARNING' | 'PROCESSING' | 'SCANNING_SCREEN';
  memoryEntriesCount: number;
  driveConnected: boolean;
  driveFilesCount: number;
  aiMode: 'hybrid' | 'strict_python';
  voiceMuted: boolean;
  speechLang: 'pl-PL' | 'en-US';
  screenVisionActive: boolean;
}
