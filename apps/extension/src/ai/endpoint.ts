export function providerUrl(value: string, websocket = false): URL {
  const url = new URL(value);
  const protocols = websocket ? ['http:', 'https:', 'ws:', 'wss:'] : ['http:', 'https:'];
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (!protocols.includes(url.protocol) || url.username || url.password || url.hash ||
      (!local && (url.protocol === 'http:' || url.protocol === 'ws:'))) {
    throw new Error('服务地址需使用 HTTPS 或 WSS，明文连接仅允许本机回环地址');
  }
  return url;
}

export function httpEndpoint(value: string, suffix: string): URL {
  const url = providerUrl(value);
  const path = url.pathname.replace(/\/$/, '');
  url.pathname = path.endsWith(suffix) ? path : path + suffix;
  return url;
}
