import type { ProviderConfig, ProviderStatus } from '../shared/types';
import { ProviderTimeoutError, ProviderUnavailableError } from './errors';
import type { TranslationProvider, TranslationRequest } from './provider';
import { httpEndpoint } from './endpoint';

export class OpenAICompatibleProvider implements TranslationProvider {
  readonly name = 'openai-compatible';
  private readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async translate(request: TranslationRequest): Promise<string> {
    if (!this.config.endpoint.trim() || !this.config.model.trim()) throw new ProviderUnavailableError('翻译 Provider 尚未配置');
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.signal?.addEventListener('abort', abort, { once: true });
    if (request.signal?.aborted) controller.abort();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await fetch(httpEndpoint(this.config.endpoint, '/chat/completions'), {
        method: 'POST',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: buildSystemPrompt(request.sourceLanguage, request.targetLanguage) },
            ...request.context.flatMap((item) => [
              { role: 'user', content: item.original },
              ...(item.translated ? [{ role: 'assistant', content: item.translated }] : []),
            ]),
            { role: 'user', content: request.text },
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403
        ? `翻译服务鉴权失败（HTTP ${response.status}），请检查翻译 API Key`
        : `翻译服务返回 HTTP ${response.status}，请检查地址、模型和余额`);
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('Translation service returned no content');
      return content;
    } catch (error) {
      if (controller.signal.aborted) throw new ProviderTimeoutError();
      throw error;
    } finally {
      clearTimeout(timeout);
      request.signal?.removeEventListener('abort', abort);
    }
  }

  async validateConnection(): Promise<ProviderStatus> {
    if (!this.config.endpoint.trim() || !this.config.model.trim()) return { provider: this.name, state: 'unconfigured', message: '未配置服务地址或模型', checkedAt: Date.now() };
    try {
      const response = await fetch(httpEndpoint(this.config.endpoint, '/models'), {
        redirect: 'error',
        headers: this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : undefined,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { provider: this.name, state: 'ready', checkedAt: Date.now() };
    } catch (error) {
      return { provider: this.name, state: 'error', message: error instanceof Error ? error.message : '连接失败', checkedAt: Date.now() };
    }
  }
}

function buildSystemPrompt(sourceLanguage: string, targetLanguage: string): string {
  return `You are a subtitle translator. Translate from ${sourceLanguage} to ${targetLanguage}. Preserve meaning, tone, names, and dialogue context. Return only the translated subtitle text. Keep it concise enough for on-screen subtitles.`;
}
