export type PermanentInsightType = 'tip' | 'fact' | 'directive' | 'decision' | 'note' | 'blueprint';

export interface PermanentInsight {
  id: string;
  title: string;
  content: string;
  type: PermanentInsightType; // 'tip' = wskazówka, 'fact' = ważny fakt, 'directive' = dyrektywa, 'decision' = ustalenie, 'note' = notatka, 'blueprint' = wzorzec
  source?: 'auto_extracted' | 'user_pinned' | 'manual_input' | 'system_default' | 'user_blueprint';
  conversationRefId?: string;
  createdAt: string;
  isPermanent: true;
  category?: string;
  tags?: string[];
  videoUrl?: string;
  videoId?: string;
  isBlueprint?: boolean;
}

export interface ConversationEntry {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp: string;
  isoTimestamp: string;
  expiresAt: string; // ISO string 14 days from creation
  isQuestion?: boolean;
  isVoice?: boolean;
  isAiGenerated?: boolean;
  isPinnedPermanent?: boolean;
  permanentInsightId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp: string;
  isoTimestamp?: string;
  expiresAt?: string;
  isVoice?: boolean;
  isLearnedCommand?: boolean;
  isAiGenerated?: boolean;
  isScreenVision?: boolean;
  screenSnapshot?: string;
  commandMatched?: string;
  autoLearnedFact?: { key: string; value: string };
  permanentInsight?: PermanentInsight;
  isPinnedPermanent?: boolean;
  driveData?: any;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  generatedImageUrl?: string;
  imagePrompt?: string;
  imageAspectRatio?: string;
  imageStyle?: string;
}

export interface GeneratedImageItem {
  id: string;
  imageUrl: string;
  prompt: string;
  revisedPrompt?: string;
  style: string;
  aspectRatio: string;
  createdAt: string;
  modelUsed?: string;
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

export interface MasterDirective {
  id: string;
  title: string;
  rule: string;
  enabled: boolean;
  isSystemDefault?: boolean;
}

export interface DeviceConfig {
  deviceLocation: string;
  userTitle: string;
  defaultMusicService: 'spotify' | 'youtube' | 'apple' | 'custom';
  customMusicUrl: string;
  favoriteTrackOrGenre: string;
  autoAttachLocation: boolean;
  masterDirectivePrompt: string;
  mandatoryRules: MasterDirective[];
}

export type JarvisState = 'idle' | 'listening' | 'processing' | 'speaking' | 'learning' | 'offline' | 'scanning_screen';

export interface SystemStats {
  coreStatus: 'ONLINE' | 'STANDBY' | 'LEARNING' | 'PROCESSING' | 'SCANNING_SCREEN';
  memoryEntriesCount: number;
  permanentInsightsCount?: number;
  conversations14DaysCount?: number;
  driveConnected: boolean;
  driveFilesCount: number;
  aiMode: 'hybrid' | 'strict_python';
  voiceMuted: boolean;
  speechLang: 'pl-PL' | 'en-US';
  screenVisionActive: boolean;
  deviceLocation?: string;
  activeRulesCount?: number;
}
