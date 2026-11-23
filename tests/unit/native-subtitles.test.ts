import { describe, expect, it } from 'vitest';
import { extractNativeSubtitles } from '../../apps/extension/src/content/native-subtitles';

function videoWithCue(text: string) {
  const track = {
    kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled',
    cues: [{ text, startTime: 1, endTime: 3 }],
  };
  const video = { textTracks: [track] } as unknown as HTMLVideoElement;
  return { video, track };
}

describe('native subtitle text', () => {
  it('normalizes native formatting and entities without consuming comparison text', () => {
    const { video, track } = videoWithCue('<v Speaker><i>Hello</i></v> &amp; 2 < 3 and 4 > 1');
    expect(extractNativeSubtitles(video)[0].originalText).toBe('Hello & 2 < 3 and 4 > 1');
    expect(track.mode).toBe('disabled');
  });

  it('preserves literal angle-bracket text as plain cue content', () => {
    const { video } = videoWithCue('Type &lt;example&gt; or leave <unfinished');
    expect(extractNativeSubtitles(video)[0].originalText).toBe('Type <example> or leave <unfinished');
  });
});
