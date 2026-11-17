export function buildAsrWebSocketUrl(endpoint: string): string | undefined {
  if (!endpoint.trim()) return undefined;
  const url = new URL(endpoint);
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) throw new Error('ASR 地址必须使用 HTTP 或 WebSocket 协议');
  url.protocol = ['https:', 'wss:'].includes(url.protocol) ? 'wss:' : 'ws:';
  if (url.pathname === '/' || url.pathname === '') url.pathname = '/v1/asr';
  return url.toString();
}
