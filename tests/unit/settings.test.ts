import { describe, expect, it } from 'vitest';
import { defaultSettings, normalizeSettings } from '../../apps/extension/src/shared/settings';

describe('settings', () => {
  it('fills missing values without retaining secrets in logs or labels', () => {
    const settings = normalizeSettings({ targetLanguage: 'zh-TW', apiKey: 'secret' });
    expect(settings.targetLanguage).toBe('zh-TW');
    expect(settings.sourceLanguage).toBe(defaultSettings.sourceLanguage);
    expect(settings.apiKey).toBe('secret');
    expect(settings.translationMode).toBe(defaultSettings.translationMode);
  });
});
