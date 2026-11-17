import { expect, it } from 'vitest';
import { CaptionPipeline } from '../../apps/extension/src/background/caption-pipeline';
import { defaultSettings } from '../../apps/extension/src/shared/settings';
import type { SubtitleCue } from '../../apps/extension/src/shared/types';

it('publishes the provider translation with the original media timestamps', async () => {
  const updates: SubtitleCue[] = [];
  const pipeline = new CaptionPipeline(defaultSettings, {
    name: 'fixture', translate: async () => '你是认真的吗？',
    validateConnection: async () => ({ provider: 'fixture', state: 'ready', checkedAt: 0 }),
  }, (cue) => updates.push({ ...cue }), () => undefined);
  await pipeline.accept({ id: '1', sessionId: 's', tabId: 1, startTime: 79, endTime: 82,
    originalText: 'Are you serious?', sourceLanguage: 'en', targetLanguage: 'zh-CN', status: 'FINAL',
    sourceType: 'NATIVE_SUBTITLE', createdAt: 0 });
  expect(updates.at(-1)).toMatchObject({ startTime: 79, endTime: 82, status: 'TRANSLATED', translatedText: '你是认真的吗？' });
});

it('reports a rejected provider instead of silently leaving an empty subtitle', async () => {
  const failures: string[] = [];
  const pipeline = new CaptionPipeline({ ...defaultSettings, retryCount: 0 }, {
    name: 'fixture', translate: async () => { throw new Error('HTTP 401'); },
    validateConnection: async () => ({ provider: 'fixture', state: 'error', checkedAt: 0 }),
  }, () => undefined, (error) => failures.push(error.message));
  await pipeline.accept({ id: '1', sessionId: 's', tabId: 1, startTime: 0, endTime: 2,
    originalText: 'hello', sourceLanguage: 'en', targetLanguage: 'zh-CN', status: 'FINAL',
    sourceType: 'LOCAL_ASR', createdAt: 0 });
  expect(failures).toEqual(['HTTP 401']);
});
