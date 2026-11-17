import { describe, expect, it } from 'vitest';
import { TranslationEngine } from '../../apps/extension/src/ai/translation-engine';
import type { TranslationProvider } from '../../apps/extension/src/ai/provider';

describe('TranslationEngine', () => {
  it('caches normalized text and sends recent context to the provider', async () => {
    const requests: Array<{ text: string; context: string[] }> = [];
    const provider: TranslationProvider = {
      name: 'test',
      async translate(request) {
        requests.push({ text: request.text, context: request.context.map((item) => item.original) });
        return `译:${request.text}`;
      },
      async validateConnection() {
        return { provider: 'test', state: 'ready', checkedAt: Date.now() };
      },
    };
    const engine = new TranslationEngine(provider, { contextWindow: 2, retryCount: 0 });

    await expect(engine.translate(' Are you serious? ', 'en', 'zh-CN')).resolves.toBe('译:Are you serious?');
    await expect(engine.translate('Are you serious?', 'en', 'zh-CN')).resolves.toBe('译:Are you serious?');
    await expect(engine.translate('You know I am.', 'en', 'zh-CN')).resolves.toBe('译:You know I am.');

    expect(requests).toHaveLength(2);
    expect(requests[1].context).toEqual(['Are you serious?']);
  });

  it('retries transient provider failures up to the configured limit', async () => {
    let attempts = 0;
    const provider: TranslationProvider = {
      name: 'retry-test',
      async translate() {
        attempts += 1;
        if (attempts < 3) throw new Error('temporary');
        return 'ok';
      },
      async validateConnection() {
        return { provider: 'retry-test', state: 'ready', checkedAt: Date.now() };
      },
    };
    const engine = new TranslationEngine(provider, { contextWindow: 2, retryCount: 2 });

    await expect(engine.translate('hello', 'en', 'zh-CN')).resolves.toBe('ok');
    expect(attempts).toBe(3);
  });
});
