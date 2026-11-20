import type { SubtitleCue } from '../shared/types';
import { normalizeSubtitleText } from '../shared/subtitle/text';

export function extractNativeSubtitles(video: HTMLVideoElement, sourceLanguage = 'auto'): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const tracks = Array.from({ length: video.textTracks.length }, (_, i) => video.textTracks[i])
    .filter((track) => ['subtitles', 'captions'].includes(track.kind) && track.label !== 'SubtitleFlow');
  const selected = tracks.find((track) => sourceLanguage !== 'auto' && track.language.startsWith(sourceLanguage))
    ?? tracks.find((track) => track.mode === 'showing') ?? tracks[0];
  for (let trackIndex = 0; trackIndex < video.textTracks.length; trackIndex += 1) {
    const track = video.textTracks[trackIndex];
    if (track !== selected) continue;
    const previousMode = track.mode;
    try { if (track.mode === 'disabled') track.mode = 'hidden'; } catch { /* Read-only player track. */ }
    const list = track.cues;
    if (!list) { track.mode = previousMode; continue; }
    for (let index = 0; index < list.length; index += 1) {
      const cue = list[index] as VTTCue;
      const text = normalizeSubtitleText(cue.text);
      if (!text) continue;
      cues.push({
        id: `native-${trackIndex}-${index}-${Math.round(cue.startTime * 1000)}`,
        sessionId: 'pending',
        tabId: 0,
        startTime: cue.startTime,
        endTime: cue.endTime,
        originalText: text,
        sourceLanguage: track.language || 'auto',
        targetLanguage: 'zh-CN',
        status: 'FINAL',
        sourceType: 'NATIVE_SUBTITLE',
        createdAt: Date.now(),
      });
    }
    track.mode = previousMode;
  }
  return cues.sort((a, b) => a.startTime - b.startTime);
}
