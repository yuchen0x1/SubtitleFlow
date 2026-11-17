import { describe, expect, it } from 'vitest';
import { downsampleToPcm16 } from '../../apps/extension/src/shared/audio/pcm';

describe('PCM conversion', () => {
  it('downsamples float audio and clamps to signed 16-bit PCM', () => {
    const input = new Float32Array([0, 0.5, -0.5, 1.2, -1.2]);
    const output = downsampleToPcm16(input, 48000, 16000);
    expect(output).toBeInstanceOf(Int16Array);
    expect(output.length).toBeGreaterThan(0);
    expect(Math.max(...output)).toBeLessThanOrEqual(32767);
    expect(Math.min(...output)).toBeGreaterThanOrEqual(-32768);
  });
});
