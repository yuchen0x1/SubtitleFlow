import type { ProviderStatus } from '../shared/types';
import type { TranslationProvider } from './provider';

export class MockTranslationProvider implements TranslationProvider {
  readonly name = 'mock';

  async translate(request: { text: string }): Promise<string> {
    return `【测试译文】${request.text}`;
  }

  async validateConnection(): Promise<ProviderStatus> {
    return { provider: this.name, state: 'ready', checkedAt: Date.now() };
  }
}
