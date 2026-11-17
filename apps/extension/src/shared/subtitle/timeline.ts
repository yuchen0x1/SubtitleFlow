import type { SubtitleCue } from '../types';

export class SubtitleTimeline {
  private cues: SubtitleCue[];

  constructor(cues: SubtitleCue[] = []) {
    this.cues = [];
    this.replace(cues);
  }

  replace(cues: SubtitleCue[]): void {
    this.cues = [...cues].sort((a, b) => a.startTime - b.startTime || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }

  upsert(cue: SubtitleCue): void {
    const existing = this.cues.findIndex((item) => item.id === cue.id);
    if (existing >= 0) this.cues[existing] = cue;
    else this.cues.push(cue);
    this.cues.sort((a, b) => a.startTime - b.startTime || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }

  removeBySession(sessionId: string): void {
    this.cues = this.cues.filter((cue) => cue.sessionId !== sessionId);
  }

  activeAt(time: number): SubtitleCue[] {
    return this.cues.filter((cue) => time >= cue.startTime && time < cue.endTime);
  }

  all(): SubtitleCue[] {
    return [...this.cues];
  }
}
