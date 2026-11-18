import { describe, expect, it } from 'vitest';
import { buildAsrWebSocketUrl } from '../../apps/extension/src/background/provider-routing';
import { httpEndpoint } from '../../apps/extension/src/ai/endpoint';

describe('provider routing', () => {
  it('converts a local HTTP service endpoint to its ASR WebSocket endpoint', () => {
    expect(buildAsrWebSocketUrl('http://127.0.0.1:8765')).toBe('ws://127.0.0.1:8765/v1/asr');
    expect(buildAsrWebSocketUrl('ws://127.0.0.1:8765/v1/asr')).toBe('ws://127.0.0.1:8765/v1/asr');
    expect(buildAsrWebSocketUrl('')).toBeUndefined();
  });

  it('allows encrypted remote URLs, rejects cleartext remote URLs and separates path from query', () => {
    expect(buildAsrWebSocketUrl('https://asr.example.test')).toBe('wss://asr.example.test/v1/asr');
    expect(() => buildAsrWebSocketUrl('ws://asr.example.test')).toThrow();
    expect(() => httpEndpoint('http://127.0.0.1:8765@example.test', '/health')).toThrow();
    expect(httpEndpoint('https://api.example.test/v1/?region=east', '/chat/completions').href)
      .toBe('https://api.example.test/v1/chat/completions?region=east');
  });
});
