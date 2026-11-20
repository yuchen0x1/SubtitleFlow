import type { SubtitleCue } from '../types';
import { toPlainVttText } from './text';

function formatTime(seconds: number, separator: ',' | '.'): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const whole = Math.floor(safe % 60);
  const millis = Math.round((safe - Math.floor(safe)) * 1000);
  const normalizedMillis = millis === 1000 ? 0 : millis;
  const normalizedSeconds = millis === 1000 ? whole + 1 : whole;
  const normalizedMinutes = normalizedSeconds >= 60 ? minutes + 1 : minutes;
  const finalSeconds = normalizedSeconds >= 60 ? 0 : normalizedSeconds;
  const finalHours = normalizedMinutes >= 60 ? hours + 1 : hours;
  const finalMinutes = normalizedMinutes >= 60 ? 0 : normalizedMinutes;
  return `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}:${String(finalSeconds).padStart(2, '0')}${separator}${String(normalizedMillis).padStart(3, '0')}`;
}

function cueText(cue: SubtitleCue): string {
  return cue.translatedText ? `${cue.originalText}\n${cue.translatedText}` : cue.originalText;
}

export function exportSrt(cues: SubtitleCue[]): string {
  return cues
    .filter((cue) => cue.endTime >= cue.startTime)
    .slice()
    .sort((a, b) => a.startTime - b.startTime)
    .map((cue, index) => `${index + 1}\n${formatTime(cue.startTime, ',')} --> ${formatTime(cue.endTime, ',')}\n${cueText(cue)}\n`)
    .join('\n');
}

export function exportVtt(cues: SubtitleCue[]): string {
  const body = cues
    .filter((cue) => cue.endTime >= cue.startTime)
    .slice()
    .sort((a, b) => a.startTime - b.startTime)
    .map((cue) => `${formatTime(cue.startTime, '.')} --> ${formatTime(cue.endTime, '.')}\n${toPlainVttText(cueText(cue))}\n`)
    .join('\n');
  return `WEBVTT\n\n${body}`;
}
