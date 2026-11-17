import { expect, it } from 'vitest';
import { PcmSegmenter, encodeWav } from '../../apps/extension/src/shared/audio/segments';

it('keeps media timestamps and flushes a voiced segment on silence', () => {
  const segmenter = new PcmSegmenter(16000);
  const speech = new Int16Array(16000).fill(8000);
  expect(segmenter.push(speech, 79, 1, true)).toBeUndefined();
  const result = segmenter.push(new Int16Array(8000), 80, 1, false);
  expect(result).toMatchObject({ startTime: 79, endTime: 80.5 });
  expect(result?.pcm.length).toBe(24000);
  expect(segmenter.push(new Int16Array(16000), 80.5, 1, false)).toBeUndefined();
});

it('encodes actual PCM data into a mono WAV with a legal sample rate', () => {
  const buffer = encodeWav(new Int16Array([0, 1234, -1234]), 16000);
  const header = new DataView(buffer);
  expect(String.fromCharCode(...new Uint8Array(buffer, 0, 4))).toBe('RIFF');
  expect(header.getUint32(24, true)).toBe(16000);
  expect(header.getUint32(40, true)).toBe(6);
  expect(header.getInt16(46, true)).toBe(1234);
});
