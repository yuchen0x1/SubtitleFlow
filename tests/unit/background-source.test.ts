import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeMessage, type AnyMessageEnvelope } from '../../apps/extension/src/shared/messages';
import { normalizeSettings } from '../../apps/extension/src/shared/settings';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('subtitle source selection', () => {
  it('does not start audio capture from a retained legacy provider without explicit consent', async () => {
    let receive!: (message: AnyMessageEnvelope, sender: chrome.runtime.MessageSender, respond: (result: unknown) => void) => boolean;
    const capture = vi.fn((_options: unknown, callback: (id: string) => void) => callback('fixture-stream'));
    vi.stubGlobal('chrome', {
      runtime: {
        onMessage: { addListener: (listener: typeof receive) => { receive = listener; } },
        getContexts: async () => [],
        sendMessage: async () => ({ ok: true }),
      },
      tabs: {
        onRemoved: { addListener: vi.fn() },
        onUpdated: { addListener: vi.fn() },
        sendMessage: async (_tabId: number, message: AnyMessageEnvelope) => message.type === 'VIDEO_DETECTED'
          ? { video: { tabId: 7, site: 'example.test', title: 'Video without text tracks', url: 'https://example.test/video', hasVideo: true, hasNativeSubtitles: false },
            playback: { currentTime: 2, paused: false, playbackRate: 1, duration: 60 }, cues: [] }
          : { ok: true },
      },
      scripting: { executeScript: async () => [{ frameId: 0, result: 100 }] },
      storage: {
        local: { setAccessLevel: async () => undefined },
        session: { get: async () => ({}) },
      },
      offscreen: { createDocument: async () => undefined },
      tabCapture: { getMediaStreamId: capture },
    });
    await import('../../apps/extension/src/background/index');
    const settings = normalizeSettings({ displayMode: 'original', asrProvider: {
      kind: 'local-service', endpoint: 'http://127.0.0.1:8765', model: 'small',
      apiKey: '', timeoutMs: 120000, concurrency: 2,
    } });
    const result = await new Promise<{ error?: string }>((resolve) => {
      receive(makeMessage('START_TRANSLATION', { tabId: 7, settings }), {}, (value) => resolve(value as { error?: string }));
    });
    expect(result.error).toContain('当前视频没有可读取字幕');
    expect(capture).not.toHaveBeenCalled();
  });
});
