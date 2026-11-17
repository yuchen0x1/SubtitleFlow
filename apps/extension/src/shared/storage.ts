import { defaultSettings, normalizeSettings } from './settings';
import type { AppSettings } from './types';

const SETTINGS_KEY = 'subtitleflow.settings';

export async function loadSettings(): Promise<AppSettings> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return normalizeSettings(result[SETTINGS_KEY] as Partial<AppSettings> | undefined);
  }
  try {
    const raw = globalThis.localStorage?.getItem(SETTINGS_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) as Partial<AppSettings> : defaultSettings);
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const normalized = normalizeSettings(settings);
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: normalized });
    return;
  }
  globalThis.localStorage?.setItem(SETTINGS_KEY, JSON.stringify(normalized));
}

export async function clearStoredData(): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.clear();
    return;
  }
  globalThis.localStorage?.removeItem(SETTINGS_KEY);
}
