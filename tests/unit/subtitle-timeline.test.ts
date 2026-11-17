import { describe, expect, it } from 'vitest';
import { SubtitleTimeline } from '../../apps/extension/src/shared/subtitle/timeline';

describe('SubtitleTimeline', () => {
  it('returns active cues by media time in stable order', () => {
    const timeline = new SubtitleTimeline([
      { id: 'b', sessionId: 's', tabId: 1, startTime: 2, endTime: 5, originalText: 'B', translatedText: '乙', sourceLanguage: 'en', targetLanguage: 'zh-CN', status: 'TRANSLATED', sourceType: 'NATIVE_SUBTITLE', createdAt: 2 },
      { id: 'a', sessionId: 's', tabId: 1, startTime: 0, endTime: 3, originalText: 'A', translatedText: '甲', sourceLanguage: 'en', targetLanguage: 'zh-CN', status: 'TRANSLATED', sourceType: 'NATIVE_SUBTITLE', createdAt: 0 },
    ]);

    expect(timeline.activeAt(2.5).map((cue) => cue.id)).toEqual(['a', 'b']);
    expect(timeline.activeAt(5)).toEqual([]);
  });
});
