import type { AsrProvider } from './provider';
import type { ProviderStatus } from '../shared/types';

export class WebSocketAsrProvider implements AsrProvider {
  readonly name = 'websocket-asr';
  private readonly endpoint: string;
  private socket?: WebSocket;
  private status: ProviderStatus = { provider: this.name, state: 'unconfigured', checkedAt: Date.now() };
  private readonly onResult: (result: unknown) => void;

  constructor(endpoint: string, onResult: (result: unknown) => void) {
    this.endpoint = endpoint;
    this.onResult = onResult;
  }

  async connect(sessionId: string): Promise<void> {
    if (!this.endpoint) throw new Error('ASR WebSocket endpoint is not configured');
    if (this.socket?.readyState === WebSocket.OPEN) return;
    this.status = { provider: this.name, state: 'connecting', checkedAt: Date.now() };
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(`${this.endpoint}${this.endpoint.includes('?') ? '&' : '?'}sessionId=${encodeURIComponent(sessionId)}`);
      this.socket = socket;
      socket.binaryType = 'arraybuffer';
      socket.onopen = () => {
        this.status = { provider: this.name, state: 'ready', checkedAt: Date.now() };
        resolve();
      };
      socket.onerror = () => {
        this.status = { provider: this.name, state: 'error', message: 'WebSocket 连接失败', checkedAt: Date.now() };
        reject(new Error('ASR WebSocket connection failed'));
      };
      socket.onmessage = (event) => {
        try { this.onResult(JSON.parse(String(event.data))); } catch { /* Ignore malformed provider events. */ }
      };
    });
  }

  async processAudio(pcm: ArrayBuffer, sampleRate: number): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: 'audio', sampleRate }));
    this.socket.send(pcm);
  }

  async stop(): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: 'stop' }));
  }

  async dispose(): Promise<void> {
    this.socket?.close(1000, 'session stopped');
    this.socket = undefined;
    this.status = { provider: this.name, state: 'unconfigured', checkedAt: Date.now() };
  }

  getStatus(): ProviderStatus {
    return this.status;
  }
}
