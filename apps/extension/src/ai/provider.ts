import type { ProviderConfig, ProviderStatus } from '../shared/types';

export interface TranslationContextItem {
  original: string;
  translated?: string;
  startTime?: number;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: TranslationContextItem[];
  signal?: AbortSignal;
}

export interface TranslationProvider {
  readonly name: string;
  translate(request: TranslationRequest): Promise<string>;
  validateConnection(): Promise<ProviderStatus>;
}

export interface AsrProvider {
  readonly name: string;
  connect(sessionId: string): Promise<void>;
  processAudio(pcm: ArrayBuffer, sampleRate: number): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  getStatus(): ProviderStatus;
}

export interface ProviderFactoryOptions {
  config: ProviderConfig;
}
