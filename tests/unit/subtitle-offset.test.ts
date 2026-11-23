import { describe, expect, it } from 'vitest';
import { formatOffsetLabel, MAX_SUBTITLE_OFFSET_MS, normalizeSubtitleOffsetMs, shiftCues } from '../../apps/extension/src/shared/subtitle/offset';
import { exportSrt, exportVtt } from '../../apps/extension/src/shared/subtitle/export';
import type { SubtitleCue } from '../../apps/extension/src/shared/types';

const cue: SubtitleCue = {
  id: 'cue-1', sessionId: 's', tabId: 1, startTime: 1, endTime: 3,
  originalText: 'Hello', translatedText: '你好', sourceLanguage: 'en',
  targetLanguage: 'zh-CN', status: 'TRANSLATED', sourceType: 'IMPORTED_SUBTITLE', createdAt: 1,
};

describe('subtitle offsets', () => {
  it('clamps values to the supported range and rejects non-numbers', () => {
    expect(normalizeSubtitleOffsetMs(5000)).toBe(5000);
    expect(normalizeSubtitleOffsetMs(-5000)).toBe(-5000);
    expect(normalizeSubtitleOffsetMs(MAX_SUBTITLE_OFFSET_MS + 1)).toBe(MAX_SUBTITLE_OFFSET_MS);
    expect(normalizeSubtitleOffsetMs(-MAX_SUBTITLE_OFFSET_MS - 1)).toBe(-MAX_SUBTITLE_OFFSET_MS);
    expect(normalizeSubtitleOffsetMs(Number.NaN)).toBe(0);
    expect(normalizeSubtitleOffsetMs(undefined)).toBe(0);
    expect(normalizeSubtitleOffsetMs(499.6)).toBe(500);
  });

  it('delays cues for positive offsets and never produces negative times', () => {
    const [delayed] = shiftCues([cue], 1500);
    expect(delayed.startTime).toBe(2.5);
    expect(delayed.endTime).toBe(4.5);
    const [early] = shiftCues([cue], -2500);
    expect(early.startTime).toBe(0);
    expect(early.endTime).toBe(0.5);
    expect(shiftCues([cue], -5000)).toHaveLength(0);
  });

  it('keeps cue order and formatting after a shift', () => {
    const shifted = shiftCues([{ ...cue, endTime: 6, originalText: 'Later' }, cue], 500);
    expect(shifted.map((item) => item.originalText)).toEqual(['Later', 'Hello']);
    expect(exportSrt(shifted)).toContain('00:00:01,500 --> 00:00:06,500');
    expect(exportVtt(shifted)).toContain('00:00:01.500 --> 00:00:06.500');
  });

  it('formats a readable label', () => {
    expect(formatOffsetLabel(0)).toBe('未偏移');
    expect(formatOffsetLabel(1500)).toBe('+1.5 秒');
    expect(formatOffsetLabel(-500)).toBe('−0.5 秒');
  });
});
