import { describe, expect, it } from 'vitest';
import { SubtitleOverlay } from '../../apps/extension/src/overlay/overlay';
import { defaultStyle } from '../../apps/extension/src/shared/settings';
import type { SubtitleCue } from '../../apps/extension/src/shared/types';

const cue: SubtitleCue = {
  id: 'cue-1', sessionId: 'session-1', tabId: 1, startTime: 1, endTime: 4,
  originalText: 'Hello world', translatedText: '你好，世界', sourceLanguage: 'en',
  targetLanguage: 'zh-CN', status: 'TRANSLATED', sourceType: 'NATIVE_SUBTITLE', createdAt: 1,
};

function contentText(): string {
  const host = document.querySelector('#subtitleflow-overlay-host') as HTMLDivElement | null;
  return host?.shadowRoot?.querySelector('.subtitleflow-overlay')?.textContent ?? '';
}

describe('SubtitleOverlay', () => {
  it('renders bilingual and translated-only text at the media timestamp', () => {
    const overlay = new SubtitleOverlay(defaultStyle);
    overlay.mount();
    overlay.upsertCue(cue);
    overlay.renderAt(2);
    expect(contentText()).toContain('Hello world');
    expect(contentText()).toContain('你好，世界');

    overlay.setDisplayMode('translated');
    overlay.renderAt(2);
    expect(contentText()).toBe('你好，世界');
    overlay.destroy();
  });

  it('renders subtitle syntax as text instead of creating elements', () => {
    const overlay = new SubtitleOverlay(defaultStyle);
    overlay.mount();
    overlay.upsertCue({ ...cue, originalText: 'Use <tag> carefully', translatedText: '保持 <tag> 为文本' });
    overlay.renderAt(2);
    const host = document.querySelector('#subtitleflow-overlay-host') as HTMLDivElement;
    const root = host.shadowRoot!;
    expect(root.querySelector('tag')).toBeNull();
    expect(root.querySelector('.original')?.textContent).toBe('Use <tag> carefully');
    expect(root.querySelector('.translated')?.textContent).toBe('保持 <tag> 为文本');
    overlay.destroy();
  });

  it('shows service errors while there is no active cue and clears them after a cue arrives', () => {
    const overlay = new SubtitleOverlay(defaultStyle);
    overlay.mount();
    overlay.setStatus('SubtitleFlow · 识别服务不可用');
    overlay.renderAt(0);
    expect(contentText()).toContain('识别服务不可用');
    overlay.upsertCue(cue);
    overlay.setStatus('');
    overlay.renderAt(2);
    expect(contentText()).toContain('你好，世界');
    overlay.destroy();
  });

  it('reparents to a non-video fullscreen element', () => {
    const overlay = new SubtitleOverlay(defaultStyle);
    overlay.mount();
    const fullscreen = document.createElement('div');
    document.body.append(fullscreen);
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: fullscreen });
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(fullscreen.querySelector('#subtitleflow-overlay-host')).not.toBeNull();
    overlay.destroy();
    fullscreen.remove();
  });
});
