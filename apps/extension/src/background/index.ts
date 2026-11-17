import { isMessage, makeMessage, type AnyMessageEnvelope } from '../shared/messages';
import { isProviderConfigured, normalizeSettings } from '../shared/settings';
import type { AsrResult, PlaybackState, SessionSnapshot, SubtitleCue, VideoMetadata } from '../shared/types';
import { OpenAICompatibleProvider } from '../ai/openai-compatible';
import { LocalServiceTranslationProvider } from '../ai/local-service';
import { SessionManager, type SessionRecord } from './session-manager';
import { CaptionPipeline } from './caption-pipeline';
import { buildAsrWebSocketUrl } from './provider-routing';

interface VideoProbe { video: VideoMetadata; playback: PlaybackState; cues: SubtitleCue[]; }
interface RunningSession { frameId: number; pipeline: CaptionPipeline; cues: Map<string, SubtitleCue>; native: boolean; }
const running = new Map<string, RunningSession>();
const probes = new Map<number, { frameId: number; probe: VideoProbe }>();
let offscreenCreation: Promise<void> | undefined;

const manager = new SessionManager({
  startCapture: async (session) => {
    const found = probes.get(session.tabId);
    if (!found) throw new Error('未检测到可访问的视频，请刷新视频页后重试');
    session.playback = found.probe.playback;
    const provider = session.settings.translationProvider.kind === 'local-service'
      ? new LocalServiceTranslationProvider(session.settings.translationProvider)
      : new OpenAICompatibleProvider(session.settings.translationProvider);
    const runtime: RunningSession = {
      frameId: found.frameId, cues: new Map(), native: found.probe.cues.length > 0,
      pipeline: new CaptionPipeline(session.settings, provider,
        (cue) => void publishCue(session, cue), (error) => void failSession(session, error.message)),
    };
    running.set(session.sessionId, runtime);
    try {
      await sendToSession(session, makeMessage('REQUEST_NATIVE_SUBTITLES', {
        sessionId: session.sessionId, style: session.settings.style,
        displayMode: session.displayMode, visible: session.overlayVisible,
      }, { tabId: session.tabId, sessionId: session.sessionId }));
      if (runtime.native) {
        for (const cue of found.probe.cues) runtime.cues.set(cue.id, normalizeCue(session, cue));
        session.statusMessage = '已读取原生字幕，正在翻译';
        void translateNearby(session);
        return session.sessionId;
      }
      const config = session.settings.asrProvider;
      if (!config.endpoint.trim() || config.kind === 'none') {
        throw new Error('视频没有可读取的字幕。请先在设置中心配置语音识别服务；画面中的内嵌英文字幕无法直接读取。');
      }
      if (config.kind === 'openai-compatible' && !config.model.trim()) {
        throw new Error('请填写语音识别模型；聊天翻译模型不能代替 /audio/transcriptions 识别接口');
      }
      for (const other of manager.all()) if (other.tabId !== session.tabId) await stopSession(other.tabId);
      await ensureOffscreenDocument();
      const streamId = await new Promise<string>((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: session.tabId }, (id) => {
          const error = chrome.runtime.lastError;
          if (error || !id) reject(new Error(error?.message ?? '无法获取当前标签页音频流')); else resolve(id);
        });
      });
      const reply = await sendOffscreen(makeMessage('START_CAPTURE', {
        sessionId: session.sessionId, tabId: session.tabId, streamId, provider: config,
        sourceLanguage: session.settings.sourceLanguage, playback: found.probe.playback,
        asrWsUrl: config.kind === 'openai-compatible' ? undefined : buildAsrWebSocketUrl(config.endpoint),
      }, { tabId: session.tabId, sessionId: session.sessionId }));
      if (!reply?.ok) throw new Error(reply?.error ?? '音频采集未确认启动');
      session.statusMessage = '已连接识别服务，等待人声';
      return session.sessionId;
    } catch (error) {
      runtime.pipeline.dispose();
      await sendToSession(session, makeMessage('ERROR_OCCURRED', { code: 'START_FAILED',
        message: error instanceof Error ? error.message : '启动失败', sessionId: session.sessionId }));
      running.delete(session.sessionId);
      throw error;
    }
  },
  stopCapture: async (sessionId) => {
    const runtime = running.get(sessionId);
    runtime?.pipeline.dispose();
    if (runtime && !runtime.native) await sendOffscreen(makeMessage('STOP_CAPTURE', { sessionId })).catch(() => undefined);
    running.delete(sessionId);
  },
});

chrome.runtime.onMessage.addListener((raw: unknown, sender, respond) => {
  if (!isMessage(raw) || (raw as { __target?: string }).__target === 'offscreen') return false;
  void handle(raw, sender).then(respond).catch((error) => respond({ error: error instanceof Error ? error.message : '请求失败' }));
  return true;
});
chrome.tabs.onRemoved.addListener((tabId) => { void stopSession(tabId); probes.delete(tabId); });
chrome.tabs.onUpdated.addListener((tabId, change) => { if (change.status === 'loading') { void stopSession(tabId); probes.delete(tabId); } });

async function handle(message: AnyMessageEnvelope, sender: chrome.runtime.MessageSender): Promise<unknown> {
  const fromContent = sender.tab?.id;
  switch (message.type) {
    case 'START_TRANSLATION': {
      if (fromContent !== undefined) throw new Error('请从插件弹窗主动启动');
      const { tabId } = message.payload;
      const previous = manager.get(tabId);
      if (previous && previous.status !== 'ERROR') return snapshot(previous);
      if (previous) await stopSession(tabId);
      const settings = normalizeSettings(message.payload.settings);
      if (settings.displayMode !== 'original' && (settings.translationProvider.kind === 'none' || !isProviderConfigured(settings.translationProvider))) {
        throw new Error('请先在设置中心配置翻译服务地址和模型；仅有 API Key 不能识别视频音频。');
      }
      const found = await discoverVideo(tabId);
      if (!found.probe.video.hasVideo) throw new Error('当前页面未检测到可访问的视频，请播放视频后重试');
      probes.set(tabId, found);
      const session = await manager.start(tabId, settings, found.probe.video);
      return snapshot(session);
    }
    case 'GET_SESSION_STATE': {
      const current = manager.get(message.payload.tabId);
      if (current) return snapshot(current);
      try {
        const found = probes.get(message.payload.tabId) ?? await discoverVideo(message.payload.tabId);
        probes.set(message.payload.tabId, found);
        return { status: 'IDLE', video: found.probe.video };
      } catch { return { status: 'IDLE' }; }
    }
    case 'STOP_TRANSLATION': await stopSession(message.payload.tabId); return { status: 'IDLE' };
    case 'PAUSE_TRANSLATION':
    case 'RESUME_TRANSLATION': {
      const tabId = message.payload.tabId;
      const session = manager.get(tabId);
      if (!session) return { status: 'IDLE' };
      const pause = message.type === 'PAUSE_TRANSLATION';
      if (!running.get(session.sessionId)?.native) await sendOffscreen(pause
        ? makeMessage('PAUSE_CAPTURE', { sessionId: session.sessionId })
        : makeMessage('RESUME_CAPTURE', { sessionId: session.sessionId }));
      await (pause ? manager.pause(tabId) : manager.resume(tabId));
      return snapshot(session);
    }
    case 'NATIVE_SUBTITLES': {
      const session = manager.all().find((item) => item.sessionId === message.payload.sessionId && item.tabId === fromContent);
      const runtime = session && running.get(session.sessionId);
      if (session && runtime?.native) {
        for (const cue of message.payload.cues.slice(0, 3000)) runtime.cues.set(cue.id, normalizeCue(session, cue));
        void translateNearby(session);
      }
      return { ok: true };
    }
    case 'ASR_PARTIAL':
    case 'ASR_FINAL': {
      if (fromContent !== undefined) return { ok: false };
      await handleAsr(message.payload); return { ok: true };
    }
    case 'PLAYBACK_STATE': {
      const session = manager.get(fromContent ?? message.payload.tabId);
      if (!session || message.payload.sessionId !== session.sessionId) return { ok: false };
      session.playback = message.payload.playback;
      const runtime = running.get(session.sessionId);
      if (runtime?.native) void translateNearby(session);
      else void sendOffscreen(makeMessage('CAPTURE_PLAYBACK', { sessionId: session.sessionId, playback: message.payload.playback })).catch(() => undefined);
      return { ok: true };
    }
    case 'TOGGLE_OVERLAY': {
      const session = manager.get(message.payload.tabId);
      if (session) { session.overlayVisible = message.payload.visible; await sendToSession(session, message); }
      return { ok: true };
    }
    case 'SETTINGS_UPDATED': {
      const safeSettings = {
        ...message.payload.settings,
        asrProvider: { ...message.payload.settings.asrProvider, apiKey: '' },
        translationProvider: { ...message.payload.settings.translationProvider, apiKey: '' },
      };
      const safeMessage = makeMessage('SETTINGS_UPDATED', { settings: safeSettings });
      for (const session of manager.all()) await sendToSession(session, safeMessage);
      return { ok: true };
    }
    case 'ERROR_OCCURRED': {
      const id = message.sessionId ?? message.payload.sessionId;
      const session = manager.all().find((item) => item.sessionId === id);
      if (session) await failSession(session, message.payload.message);
      return { ok: true };
    }
    default: return { ok: true };
  }
}

function snapshot(session: SessionRecord): SessionSnapshot {
  const { settings: _settings, captureId: _id, ...safe } = session;
  return safe;
}

async function stopSession(tabId: number): Promise<void> {
  const session = manager.get(tabId);
  if (!session) return;
  try { await manager.stop(tabId); } finally {
    await sendToSession(session, makeMessage('STOP_TRANSLATION', { tabId }, { sessionId: session.sessionId, tabId }));
  }
}

function normalizeCue(session: SessionRecord, cue: SubtitleCue): SubtitleCue {
  return { ...cue, sessionId: session.sessionId, tabId: session.tabId, targetLanguage: session.targetLanguage };
}

async function translateNearby(session: SessionRecord): Promise<void> {
  const runtime = running.get(session.sessionId);
  if (!runtime || session.status === 'PAUSED' || session.status === 'ERROR') return;
  const time = session.playback?.currentTime ?? 0;
  const nearby = [...runtime.cues.values()].filter((cue) => cue.endTime > time - 1 && cue.startTime < time + 25)
    .sort((a, b) => a.startTime - b.startTime).slice(0, 16);
  await Promise.all(nearby.map((cue) => runtime.pipeline.accept(cue)));
}

async function publishCue(session: SessionRecord, cue: SubtitleCue): Promise<void> {
  if (!running.has(session.sessionId)) return;
  if (cue.status === 'TRANSLATED' || (session.displayMode === 'original' && cue.status === 'FINAL')) {
    session.status = session.status === 'PAUSED' ? 'PAUSED' : 'DISPLAYING';
    session.cueCount = (session.cueCount ?? 0) + 1;
    session.statusMessage = '已生成字幕';
  }
  await sendToSession(session, makeMessage('SUBTITLE_UPDATE', { sessionId: session.sessionId, cues: [cue] }, { sessionId: session.sessionId, tabId: session.tabId }));
}

async function handleAsr(result: AsrResult): Promise<void> {
  const session = manager.all().find((item) => item.sessionId === result.sessionId);
  if (!session || session.status === 'PAUSED' || session.status === 'ERROR' || !result.text?.trim()) return;
  const start = Number(result.startTime); const end = Number(result.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
  await running.get(session.sessionId)?.pipeline.accept({
    id: result.segmentId ?? result.sessionId + '-' + Math.round(start * 1000),
    sessionId: session.sessionId, tabId: session.tabId, startTime: start, endTime: end,
    originalText: result.text, sourceLanguage: result.sourceLanguage || session.sourceLanguage,
    targetLanguage: session.targetLanguage, status: result.isPartial ? 'PARTIAL' : 'FINAL',
    sourceType: result.sourceType ?? 'LOCAL_ASR', createdAt: Date.now(),
  });
}

async function failSession(session: SessionRecord, error: string): Promise<void> {
  manager.updateStatus(session.tabId, 'ERROR', error);
  await sendToSession(session, makeMessage('ERROR_OCCURRED', { code: 'SERVICE_ERROR', message: error,
    sessionId: session.sessionId, recoverable: true }, { sessionId: session.sessionId }));
  const runtime = running.get(session.sessionId);
  runtime?.pipeline.dispose();
  if (runtime && !runtime.native) void sendOffscreen(makeMessage('STOP_CAPTURE', { sessionId: session.sessionId })).catch(() => undefined);
}

async function discoverVideo(tabId: number): Promise<{ frameId: number; probe: VideoProbe }> {
  await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['content.js'] });
  const candidates = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: () =>
    [...document.querySelectorAll('video')].reduce((area, video) => {
      const rect = video.getBoundingClientRect(); return Math.max(area, rect.width * rect.height);
    }, 0) });
  const best = candidates.filter((item) => (item.result ?? 0) > 0).sort((a, b) => (b.result ?? 0) - (a.result ?? 0))[0];
  const frameId = best?.frameId ?? 0;
  const probe = await chrome.tabs.sendMessage(tabId, makeMessage('VIDEO_DETECTED', {
    tabId, site: '', title: '', url: '', hasVideo: false, hasNativeSubtitles: false,
  }), { frameId }) as VideoProbe | undefined;
  if (!probe?.video) throw new Error('字幕脚本未就绪，请在扩展管理页重新加载插件后刷新视频页');
  probe.video.tabId = tabId;
  return { frameId, probe };
}

async function sendToSession(session: SessionRecord, message: AnyMessageEnvelope): Promise<unknown> {
  try { return await chrome.tabs.sendMessage(session.tabId, message, { frameId: running.get(session.sessionId)?.frameId ?? probes.get(session.tabId)?.frameId ?? 0 }); }
  catch { return undefined; }
}

async function sendOffscreen(message: AnyMessageEnvelope): Promise<{ ok: boolean; error?: string }> {
  return await chrome.runtime.sendMessage({ ...message, __target: 'offscreen' });
}

async function ensureOffscreenDocument(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType] });
  if (contexts.length) return;
  offscreenCreation ??= chrome.offscreen.createDocument({ url: 'offscreen.html',
    reasons: ['USER_MEDIA' as chrome.offscreen.Reason], justification: '处理用户主动启动的标签页音频并恢复原声播放' }).finally(() => { offscreenCreation = undefined; });
  await offscreenCreation;
}

void chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });

