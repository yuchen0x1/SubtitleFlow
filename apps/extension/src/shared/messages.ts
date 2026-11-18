import type {
  AppSettings,
  AsrResult,
  PlaybackState,
  ProviderStatus,
  SessionSnapshot,
  ProviderConfig,
  DisplayMode,
  SubtitleStyle,
  SubtitleCue,
  VideoMetadata,
} from './types';

export type MessageType =
  | 'START_TRANSLATION'
  | 'STOP_TRANSLATION'
  | 'PAUSE_TRANSLATION'
  | 'RESUME_TRANSLATION'
  | 'GET_SESSION_STATE'
  | 'CAPTURE_STARTED'
  | 'CAPTURE_STOPPED'
  | 'START_CAPTURE'
  | 'STOP_CAPTURE'
  | 'PAUSE_CAPTURE'
  | 'RESUME_CAPTURE'
  | 'CAPTURE_PLAYBACK'
  | 'AUDIO_CHUNK'
  | 'AUDIO_LEVEL'
  | 'ASR_PARTIAL'
  | 'ASR_FINAL'
  | 'TRANSLATION_RESULT'
  | 'SUBTITLE_UPDATE'
  | 'VIDEO_DETECTED'
  | 'REQUEST_NATIVE_SUBTITLES'
  | 'NATIVE_SUBTITLES'
  | 'PLAYBACK_STATE'
  | 'PROVIDER_STATUS'
  | 'SETTINGS_UPDATED'
  | 'IMPORT_SUBTITLES'
  | 'TOGGLE_OVERLAY'
  | 'ERROR_OCCURRED';

export interface MessagePayloadMap {
  START_TRANSLATION: { tabId: number; settings: AppSettings };
  STOP_TRANSLATION: { tabId: number };
  PAUSE_TRANSLATION: { tabId: number };
  RESUME_TRANSLATION: { tabId: number };
  GET_SESSION_STATE: { tabId: number };
  CAPTURE_STARTED: { tabId: number };
  CAPTURE_STOPPED: { tabId: number };
  START_CAPTURE: { sessionId: string; tabId: number; streamId: string; asrWsUrl?: string; provider: ProviderConfig; sourceLanguage: string; playback: PlaybackState };
  STOP_CAPTURE: { sessionId: string };
  PAUSE_CAPTURE: { sessionId: string };
  RESUME_CAPTURE: { sessionId: string };
  CAPTURE_PLAYBACK: { sessionId: string; playback: PlaybackState };
  AUDIO_CHUNK: { sessionId: string; pcm: ArrayBuffer; sampleRate: number };
  AUDIO_LEVEL: { sessionId: string; level: number; speaking: boolean };
  ASR_PARTIAL: AsrResult;
  ASR_FINAL: AsrResult;
  TRANSLATION_RESULT: { sessionId: string; cue: SubtitleCue };
  SUBTITLE_UPDATE: { sessionId: string; cues: SubtitleCue[] };
  VIDEO_DETECTED: VideoMetadata;
  REQUEST_NATIVE_SUBTITLES: { sessionId: string; displayMode: DisplayMode; style: SubtitleStyle; visible: boolean };
  NATIVE_SUBTITLES: { sessionId: string; cues: SubtitleCue[] };
  PLAYBACK_STATE: { sessionId?: string; tabId: number; playback: PlaybackState };
  PROVIDER_STATUS: ProviderStatus;
  SETTINGS_UPDATED: { settings: AppSettings };
  IMPORT_SUBTITLES: { tabId: number; cues: SubtitleCue[]; fileName?: string };
  TOGGLE_OVERLAY: { tabId: number; visible: boolean };
  ERROR_OCCURRED: { sessionId?: string; code: string; message: string; recoverable?: boolean };
}

export type MessageEnvelope<T extends MessageType = MessageType> = T extends MessageType ? {
  type: T;
  timestamp: number;
  tabId?: number;
  sessionId?: string;
  payload: MessagePayloadMap[T];
} : never;

export type AnyMessageEnvelope = { [K in MessageType]: MessageEnvelope<K> }[MessageType];

export function makeMessage<T extends MessageType>(
  type: T,
  payload: MessagePayloadMap[T],
  metadata: Pick<MessageEnvelope<T>, 'tabId' | 'sessionId'> = {},
): MessageEnvelope<T> {
  return { type, payload, timestamp: Date.now(), ...metadata } as MessageEnvelope<T>;
}

export function isMessage(value: unknown): value is AnyMessageEnvelope {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<MessageEnvelope>;
  return typeof candidate.type === 'string' && typeof candidate.timestamp === 'number' && 'payload' in candidate;
}
