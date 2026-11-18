import { providerUrl } from '../ai/endpoint';

export function buildAsrWebSocketUrl(endpoint: string): string | undefined {
  if (!endpoint.trim()) return undefined;
  const url = providerUrl(endpoint, true);
  url.protocol = ['https:', 'wss:'].includes(url.protocol) ? 'wss:' : 'ws:';
  if (url.pathname === '/' || url.pathname === '') url.pathname = '/v1/asr';
  return url.toString();
}
