import type { TranslationProvider } from '../ai/provider';
import { TranslationEngine } from '../ai/translation-engine';
import type { AppSettings, SubtitleCue } from '../shared/types';

export class CaptionPipeline {
  private readonly engine: TranslationEngine;
  private readonly controller = new AbortController();
  private readonly done = new Map<string, string>();
  private readonly pending = new Set<string>();

  constructor(private readonly settings: AppSettings, provider: TranslationProvider,
    private readonly publish: (cue: SubtitleCue) => void,
    private readonly fail: (error: Error) => void) {
    this.engine = new TranslationEngine(provider, { contextWindow: settings.contextWindow,
      retryCount: settings.retryCount, concurrency: settings.translationProvider.concurrency });
  }

  async accept(cue: SubtitleCue): Promise<void> {
    if (this.controller.signal.aborted || this.pending.has(cue.id)) return;
    const signature = `${cue.originalText}|${cue.status === 'PARTIAL'}`;
    if (this.done.get(cue.id) === signature) return;
    this.publish(cue);
    if (cue.status === 'PARTIAL') return;
    if (this.settings.displayMode === 'original') {
      this.done.set(cue.id, signature);
      return;
    }
    this.pending.add(cue.id);
    this.publish({ ...cue, status: 'TRANSLATING' });
    try {
      const translatedText = await this.engine.translate(cue.originalText, cue.sourceLanguage,
        this.settings.targetLanguage, this.controller.signal);
      if (!this.controller.signal.aborted) {
        this.publish({ ...cue, translatedText, status: 'TRANSLATED' });
        this.done.set(cue.id, signature);
        if (this.done.size > 3000) this.done.delete(this.done.keys().next().value!);
      }
    } catch (error) {
      if (!this.controller.signal.aborted) {
        this.publish({ ...cue, status: 'FAILED' });
        this.fail(error instanceof Error ? error : new Error('翻译失败'));
      }
    } finally { this.pending.delete(cue.id); }
  }

  dispose(): void {
    this.controller.abort();
    this.engine.clear();
  }
}
