import { AsyncQueue } from '../shared/queue';
import { isProviderConfigured } from '../shared/settings';
import type { ProviderConfig } from '../shared/types';
import { ProviderUnavailableError } from './errors';
import type { TranslationContextItem, TranslationProvider } from './provider';

interface TranslationEngineOptions {
  contextWindow: number;
  retryCount: number;
  providerConfig?: ProviderConfig;
  concurrency?: number;
}

export class TranslationEngine {
  private readonly provider: TranslationProvider;
  private readonly options: TranslationEngineOptions;
  private readonly queue: AsyncQueue;
  private readonly cache = new Map<string, string>();
  private readonly context: TranslationContextItem[] = [];

  constructor(provider: TranslationProvider, options: TranslationEngineOptions) {
    this.provider = provider;
    this.options = { ...options, contextWindow: Math.max(1, options.contextWindow), retryCount: Math.max(0, options.retryCount) };
    this.queue = new AsyncQueue({ concurrency: options.concurrency ?? options.providerConfig?.concurrency ?? 2 });
  }

  async translate(text: string, sourceLanguage: string, targetLanguage: string, signal?: AbortSignal): Promise<string> {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    if (this.options.providerConfig && !isProviderConfigured(this.options.providerConfig)) {
      throw new ProviderUnavailableError('请先在设置中配置翻译服务地址和模型');
    }
    const key = `${sourceLanguage}|${targetLanguage}|${normalized}`;
    const cached = this.cache.get(key);
    if (cached) {
      this.recordContext(normalized, cached);
      return cached;
    }

    return this.queue.add(async () => {
      if (signal?.aborted) throw new DOMException('Session stopped', 'AbortError');
      const existing = this.cache.get(key);
      if (existing) return existing;
      let lastError: unknown;
      for (let attempt = 0; attempt <= this.options.retryCount; attempt += 1) {
        try {
          const translated = (await this.provider.translate({
            text: normalized,
            sourceLanguage,
            targetLanguage,
            context: this.context.slice(-this.options.contextWindow),
            signal,
          })).replace(/\s+/g, ' ').trim();
          if (!translated) throw new Error('Provider returned empty translation');
          this.cache.set(key, translated);
          if (this.cache.size > 3000) this.cache.delete(this.cache.keys().next().value!);
          this.recordContext(normalized, translated);
          return translated;
        } catch (error) {
          lastError = error;
          if (signal?.aborted) throw error;
          if (attempt < this.options.retryCount) await wait(150 * (attempt + 1));
        }
      }
      throw lastError instanceof Error ? lastError : new Error('Translation failed');
    });
  }

  clear(): void {
    this.cache.clear();
    this.context.splice(0);
    this.queue.clear();
  }

  private recordContext(original: string, translated: string): void {
    const last = this.context[this.context.length - 1];
    if (last?.original === original && last.translated === translated) return;
    this.context.push({ original, translated });
    if (this.context.length > this.options.contextWindow * 4) this.context.splice(0, this.context.length - this.options.contextWindow * 4);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
