import type { SubtitleCue } from '../types';
import { normalizeSubtitleText } from './text';

type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'ssa' | 'auto';

export function parseTimestamp(value: string): number {
  const normalized = value.trim().replace(',', '.');
  const parts = normalized.split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) throw new Error(`Invalid subtitle timestamp: ${value}`);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  throw new Error(`Invalid subtitle timestamp: ${value}`);
}

function parseCueLine(line: string): { startTime: number; endTime: number } | undefined {
  const match = line.match(/(.+?)\s+-->\s+(.+?)(?:\s+.*)?$/);
  if (!match) return undefined;
  return { startTime: parseTimestamp(match[1]), endTime: parseTimestamp(match[2]) };
}

function buildCue(index: number, startTime: number, endTime: number, text: string, format: SubtitleFormat): SubtitleCue {
  return {
    id: `imported-${index}-${Math.round(startTime * 1000)}`,
    sessionId: 'imported',
    tabId: 0,
    startTime,
    endTime: Math.max(endTime, startTime),
    originalText: normalizeSubtitleText(text.replace(/\r/g, '').split('\n').join(' ')),
    sourceLanguage: 'auto',
    targetLanguage: 'zh-CN',
    status: 'FINAL',
    sourceType: 'IMPORTED_SUBTITLE',
    createdAt: Date.now(),
  };
}

export function parseSubtitleFile(text: string, format: SubtitleFormat = 'auto'): SubtitleCue[] {
  const cleaned = text.replace(/^\uFEFF/, '');
  const inferred = format === 'auto'
    ? (/^\s*WEBVTT/i.test(cleaned) ? 'vtt' : /\[Script Info\]/i.test(cleaned) ? 'ass' : 'srt')
    : format;
  if (inferred === 'ass' || inferred === 'ssa') return parseAss(cleaned);

  const lines = cleaned.replace(/\r/g, '').split('\n');
  const cues: SubtitleCue[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line || /^WEBVTT/i.test(line) || /^NOTE/i.test(line)) {
      index += 1;
      continue;
    }
    if (!line.includes('-->')) {
      index += 1;
      continue;
    }
    const timing = parseCueLine(line);
    if (!timing) {
      index += 1;
      continue;
    }
    index += 1;
    const textLines: string[] = [];
    while (index < lines.length && lines[index].trim() !== '') {
      textLines.push(lines[index]);
      index += 1;
    }
    if (textLines.length) cues.push(buildCue(cues.length + 1, timing.startTime, timing.endTime, textLines.join('\n'), inferred));
  }
  return cues.filter((cue) => cue.originalText).sort((a, b) => a.startTime - b.startTime);
}

function parseAss(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  for (const line of text.replace(/\r/g, '').split('\n')) {
    if (!/^Dialogue:/i.test(line)) continue;
    const fields = line.slice(line.indexOf(':') + 1).split(',');
    if (fields.length < 10) continue;
    try {
      const start = parseTimestamp(fields[1]);
      const end = parseTimestamp(fields[2]);
      const dialogue = fields.slice(9).join(',').replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ');
      if (dialogue.trim()) cues.push(buildCue(cues.length + 1, start, end, dialogue, 'ass'));
    } catch {
      // Ignore malformed ASS rows while preserving valid cues.
    }
  }
  return cues.sort((a, b) => a.startTime - b.startTime);
}
