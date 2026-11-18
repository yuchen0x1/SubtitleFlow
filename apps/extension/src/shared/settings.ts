import type { AppSettings, ProviderConfig, SubtitleStyle } from './types';

export const defaultStyle: SubtitleStyle = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 24,
  fontWeight: 600,
  textColor: '#f8fafc',
  backgroundColor: '#0b1220',
  backgroundOpacity: 0.78,
  outlineColor: '#020617',
  outlineWidth: 2,
  shadow: true,
  lineHeight: 1.3,
  maxWidth: 80,
  maxLines: 3,
  align: 'center',
  bottom: 8,
  left: 50,
  locked: false,
};

const emptyProvider = (kind: ProviderConfig['kind']): ProviderConfig => ({
  kind,
  endpoint: '',
  apiKey: '',
  model: '',
  timeoutMs: 15000,
  concurrency: 2,
});

export const defaultSettings: AppSettings = {
  subtitleSource: 'subtitles',
  sourceLanguage: 'auto',
  targetLanguage: 'zh-CN',
  translationMode: 'auto',
  displayMode: 'original',
  showOverlay: true,
  asrProvider: emptyProvider('none'),
  translationProvider: emptyProvider('none'),
  style: defaultStyle,
  contextWindow: 6,
  maxSubtitleChars: 80,
  retryCount: 2,
  privacyAcknowledged: false,
  checkForUpdates: false,
};

function mergeProvider(value: Partial<ProviderConfig> | undefined, fallback: ProviderConfig): ProviderConfig {
  return { ...fallback, ...(value ?? {}) };
}

export function normalizeSettings(value: Partial<AppSettings> | null | undefined): AppSettings {
  const input = value ?? {};
  return {
    ...defaultSettings,
    ...input,
    subtitleSource: input.subtitleSource === 'audio' ? 'audio' : 'subtitles',
    checkForUpdates: input.checkForUpdates === true,
    asrProvider: mergeProvider(input.asrProvider, defaultSettings.asrProvider),
    translationProvider: mergeProvider(input.translationProvider, defaultSettings.translationProvider),
    style: { ...defaultStyle, ...(input.style ?? {}) },
    contextWindow: Math.max(1, Math.min(20, Number(input.contextWindow ?? defaultSettings.contextWindow))),
    maxSubtitleChars: Math.max(20, Math.min(240, Number(input.maxSubtitleChars ?? defaultSettings.maxSubtitleChars))),
    retryCount: Math.max(0, Math.min(5, Number(input.retryCount ?? defaultSettings.retryCount))),
  };
}

export function isProviderConfigured(provider: ProviderConfig): boolean {
  return Boolean(provider.endpoint.trim() && provider.model.trim());
}

export function hasTranslationProvider(settings: AppSettings): boolean {
  return settings.translationProvider.kind !== 'none' && isProviderConfigured(settings.translationProvider);
}
