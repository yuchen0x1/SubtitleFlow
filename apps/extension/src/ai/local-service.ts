import type { ProviderConfig, ProviderStatus } from '../shared/types';
import { ProviderTimeoutError, ProviderUnavailableError } from './errors';
import type { TranslationProvider, TranslationRequest } from './provider';

export class LocalServiceTranslationProvider implements TranslationProvider {
  readonly name = 'local-service';
  private readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = { ...config, endpoint: config.endpoint || 'http://127.0.0.1:8765' };
  }

  async translate(request: TranslationRequest): Promise<string> {
    if (!this.config.endpoint.trim()) throw new ProviderUnavailableError('本地服务地址尚未配置');
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.signal?.addEventListener('abort', abort, { once: true });
    if (request.signal?.aborted) controller.abort();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await fetch(`${this.config.endpoint.replace(/\/$/, '')}/v1/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, signal: undefined, model: this.config.model }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`本地服务返回 HTTP ${response.status}`);
      const data = await response.json() as { translation?: string; error?: string; configured?: boolean };
      if (data.error || data.configured === false) throw new ProviderUnavailableError(data.error || '本地翻译模型尚未配置');
      if (!data.translation?.trim()) throw new Error('本地服务未返回译文');
      return data.translation;
    } catch (error) {
      if (controller.signal.aborted) throw new ProviderTimeoutError();
      throw error;
    } finally {
      clearTimeout(timeout);
      request.signal?.removeEventListener('abort', abort);
    }
  }

  validateConnection(): Promise<ProviderStatus> {
    if (!this.config.endpoint.trim()) return Promise.resolve({ provider: this.name, state: 'unconfigured', message: '未配置本地服务地址', checkedAt: Date.now() });
    return fetch(`${this.config.endpoint.replace(/\/$/, '')}/health`)
      .then(async (response): Promise<ProviderStatus> => response.ok
        ? { provider: this.name, state: 'ready', checkedAt: Date.now() }
        : { provider: this.name, state: 'degraded', message: `HTTP ${response.status}`, checkedAt: Date.now() })
      .catch((error): ProviderStatus => ({ provider: this.name, state: 'error', message: error instanceof Error ? error.message : '本地服务连接失败', checkedAt: Date.now() }));
  }
}
