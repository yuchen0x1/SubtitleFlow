import type { SubtitleCue } from '../types';

export const MAX_SUBTITLE_OFFSET_MS = 30_000;

/** Clamp a user-facing offset so one bad value cannot blank the timeline. */
export function normalizeSubtitleOffsetMs(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(-MAX_SUBTITLE_OFFSET_MS, Math.min(MAX_SUBTITLE_OFFSET_MS, Math.round(numeric)));
}

/** Positive values delay subtitles; negative values show them earlier. */
export function shiftCues(cues: SubtitleCue[], offsetMs: number): SubtitleCue[] {
  const offsetSeconds = normalizeSubtitleOffsetMs(offsetMs) / 1000;
  // A zero offset keeps the original identity; callers comparing cue ids rely
  // on that when an unshifted export is re-imported.
  const shifted = offsetSeconds === 0
    ? cues
    : cues.map((cue) => ({
      ...cue,
      startTime: Math.max(0, cue.startTime + offsetSeconds),
      endTime: Math.max(0, cue.endTime + offsetSeconds),
    }));
  return shifted.filter((cue) => cue.endTime > cue.startTime);
}

export function formatOffsetLabel(offsetMs: number): string {
  const value = normalizeSubtitleOffsetMs(offsetMs);
  if (value === 0) return '未偏移';
  return `${value > 0 ? '+' : '−'}${(Math.abs(value) / 1000).toFixed(1)} 秒`;
}
