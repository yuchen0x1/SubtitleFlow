import { describe, expect, it } from 'vitest';
import { buildAsrWebSocketUrl } from '../../apps/extension/src/background/provider-routing';

describe('provider routing', () => {
  it('converts a local HTTP service endpoint to its ASR WebSocket endpoint', () => {
    expect(buildAsrWebSocketUrl('http://127.0.0.1:8765')).toBe('ws://127.0.0.1:8765/v1/asr');
    expect(buildAsrWebSocketUrl('ws://127.0.0.1:8765/v1/asr')).toBe('ws://127.0.0.1:8765/v1/asr');
    expect(buildAsrWebSocketUrl('')).toBeUndefined();
  });
});
