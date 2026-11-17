import { describe, expect, it, vi } from 'vitest';
import { SessionManager } from '../../apps/extension/src/background/session-manager';
import { defaultSettings } from '../../apps/extension/src/shared/settings';

describe('SessionManager', () => {
  it('prevents duplicate starts and releases a session on stop', async () => {
    const startCapture = vi.fn(async () => 'stream-1');
    const stopCapture = vi.fn(async () => undefined);
    const manager = new SessionManager({ startCapture, stopCapture });

    const first = await manager.start(7, defaultSettings, { title: 'Demo', site: 'example.com', url: 'https://example.com', hasVideo: true, hasNativeSubtitles: false, tabId: 7 });
    const second = await manager.start(7, defaultSettings, first.video);

    expect(first.sessionId).toBe(second.sessionId);
    expect(startCapture).toHaveBeenCalledTimes(1);
    expect(manager.get(7)?.status).toBe('CAPTURING');

    await manager.stop(7);
    expect(stopCapture).toHaveBeenCalledWith('stream-1');
    expect(manager.get(7)).toBeUndefined();
  });
});
