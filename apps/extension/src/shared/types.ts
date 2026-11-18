export type SessionStatus =
  | 'IDLE'
  | 'DETECTING_VIDEO'
  | 'REQUESTING_AUDIO'
  | 'CAPTURING'
  | 'PAUSED'
  | 'RECOGNIZING'
  | 'TRANSLATING'
  | 'DISPLAYING'
  | 'STOPPING'
  | 'STOPPED'
  | 'ERROR';

export type SubtitleSourceType =
  | 'NATIVE_SUBTITLE'
  | 'LOCAL_ASR'
  | 'CLOUD_ASR'
  | 'IMPORTED_SUBTITLE';

export type SubtitleStatus = 'PARTIAL' | 'FINAL' | 'TRANSLATING' | 'TRANSLATED' | 'FAILED';
export type DisplayMode = 'bilingual' | 'translated' | 'original';
export type TranslationMode = 'local-local' | 'local-cloud' | 'cloud-cloud' | 'cloud-local' | 'auto';

export interface SubtitleCue {
  id: string;
  sessionId: string;
  tabId: number;
  startTime: number;
  endTime: number;
  originalText: string;
  translatedText?: string;
  sourceLanguage: string;
  targetLanguage: string;
  status: SubtitleStatus;
  sourceType: SubtitleSourceType;
  createdAt: number;
  confidence?: number;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  outlineColor: string;
  outlineWidth: number;
  shadow: boolean;
  lineHeight: number;
  maxWidth: number;
  maxLines: number;
  align: 'left' | 'center' | 'right';
  bottom: number;
  left: number;
  locked: boolean;
}

export interface ProviderConfig {
  kind: 'none' | 'openai-compatible' | 'local-service' | 'websocket';
  endpoint: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  concurrency: number;
}

export interface AppSettings {
  subtitleSource: 'subtitles' | 'audio';
  sourceLanguage: string;
  targetLanguage: string;
  translationMode: TranslationMode;
  displayMode: DisplayMode;
  showOverlay: boolean;
  asrProvider: ProviderConfig;
  translationProvider: ProviderConfig;
  style: SubtitleStyle;
  contextWindow: number;
  maxSubtitleChars: number;
  retryCount: number;
  privacyAcknowledged: boolean;
}

export interface VideoMetadata {
  tabId: number;
  site: string;
  title: string;
  url: string;
  hasVideo: boolean;
  hasNativeSubtitles: boolean;
  isProtected?: boolean;
}

export interface PlaybackState {
  currentTime: number;
  paused: boolean;
  playbackRate: number;
  duration: number;
  seeking?: boolean;
}

export interface AsrResult {
  text: string;
  sourceLanguage: string;
  startTime: number;
  endTime: number;
  isPartial: boolean;
  confidence?: number;
  sessionId: string;
  sourceType?: 'LOCAL_ASR' | 'CLOUD_ASR';
  segmentId?: string;
}

export interface ProviderStatus {
  provider: string;
  state: 'unconfigured' | 'connecting' | 'ready' | 'degraded' | 'error';
  message?: string;
  checkedAt: number;
}

export interface SessionSnapshot {
  sessionId: string;
  tabId: number;
  status: SessionStatus;
  video?: VideoMetadata;
  playback?: PlaybackState;
  sourceLanguage: string;
  targetLanguage: string;
  displayMode: DisplayMode;
  overlayVisible: boolean;
  error?: string;
  cueCount?: number;
  statusMessage?: string;
}
