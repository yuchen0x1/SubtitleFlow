import type { AsrResult, ProviderConfig } from '../shared/types';
import { encodeWav, type AudioSegment } from '../shared/audio/segments';

export async function transcribePcm(config: ProviderConfig, segment: AudioSegment, sessionId: string,
  sourceLanguage: string, signal: AbortSignal): Promise<AsrResult> {
  const form = new FormData();
  form.append('file', new Blob([encodeWav(segment.pcm)], { type: 'audio/wav' }), 'segment.wav');
  form.append('model', config.model);
  form.append('response_format', 'json');
  if (sourceLanguage && sourceLanguage !== 'auto') form.append('language', sourceLanguage);
  const response = await fetch(config.endpoint.replace(/\/$/, '').replace(/\/audio\/transcriptions$/, '') + '/audio/transcriptions', {
    method: 'POST', headers: config.apiKey ? { Authorization: 'Bearer ' + config.apiKey } : {}, body: form, signal,
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('语音识别鉴权失败（HTTP ' + response.status + '），请检查 ASR API Key');
    if (response.status === 404) throw new Error('语音识别接口不存在（HTTP 404），此服务可能仅支持聊天，必须提供 /audio/transcriptions');
    throw new Error('语音识别服务返回 HTTP ' + response.status);
  }
  const data = await response.json() as { text?: string; language?: string };
  if (typeof data.text !== 'string') throw new Error('识别服务没有返回 text 字段');
  return { text: data.text.trim(), sourceLanguage: data.language || sourceLanguage,
    startTime: segment.startTime, endTime: segment.endTime, isPartial: false, sessionId, sourceType: 'CLOUD_ASR' };
}
