import { isMessage, makeMessage, type AnyMessageEnvelope } from '../shared/messages';
import { defaultStyle } from '../shared/settings';
import { extractNativeSubtitles } from './native-subtitles';
import { SubtitleOverlay } from '../overlay/overlay';
import { adaptVideoMetadata } from './site-adapters';
import { VideoDetector } from './video-detector';
import type { SubtitleCue } from '../shared/types';

const VERSION = chrome.runtime.getManifest().version;
const shared = globalThis as typeof globalThis & { __subtitleFlow?: { version: string; dispose: () => void } };
if (shared.__subtitleFlow?.version !== VERSION) {
  shared.__subtitleFlow?.dispose();
  shared.__subtitleFlow = { version: VERSION, dispose: bootstrap() };
}

function bootstrap(): () => void {
  const detector = new VideoDetector();
  const overlay = new SubtitleOverlay(defaultStyle);
  let sessionId: string | undefined;
  let lastUrl = location.href;
  let lastSrc = '';
  let nativeSignature = '';
  let enabled = false;
  let readNative = false;
  let sourceLanguage = 'auto';
  let nativeFullscreenTrack: TextTrack | undefined;
  const renderedNative = new Map<string, VTTCue>();
  const send = (message: AnyMessageEnvelope) => { void chrome.runtime.sendMessage(message).catch(() => undefined); };

  function readProbe(language = sourceLanguage, includeCues = true) {
    detector.refresh();
    const video = detector.current();
    const cues = video && includeCues ? extractNativeSubtitles(video, language) : [];
    return {
      video: adaptVideoMetadata({ tabId: 0, site: location.hostname, title: document.title, url: location.href,
        hasVideo: Boolean(video), hasNativeSubtitles: cues.length > 0 }),
      playback: detector.playback(), cues,
    };
  }
  function updateNative(cue: SubtitleCue): void {
    const video = detector.current();
    if (!video || typeof VTTCue === 'undefined') return;
    if (!nativeFullscreenTrack) nativeFullscreenTrack = video.addTextTrack('subtitles', 'SubtitleFlow', 'zh');
    const existing = renderedNative.get(cue.id);
    if (existing) { try { nativeFullscreenTrack.removeCue(existing); } catch { /* Player changed tracks. */ } }
    const text = cue.translatedText || cue.originalText;
    const item = new VTTCue(cue.startTime, cue.endTime, text);
    nativeFullscreenTrack.addCue(item); renderedNative.set(cue.id, item);
    nativeFullscreenTrack.mode = document.fullscreenElement === video ? 'showing' : 'disabled';
  }
  function clear(): void {
    sessionId = undefined; enabled = false; overlay.setStatus(''); overlay.setCues([]); overlay.renderAt(0);
    if (nativeFullscreenTrack) nativeFullscreenTrack.mode = 'disabled';
    nativeFullscreenTrack = undefined; renderedNative.clear(); nativeSignature = '';
  }
  function fullscreen(): void {
    if (nativeFullscreenTrack) nativeFullscreenTrack.mode = enabled && document.fullscreenElement === detector.current() ? 'showing' : 'disabled';
  }
  function playback(): void {
    const state = detector.playback();
    if (state.seeking) overlay.clearLive();
    overlay.renderAt(state.currentTime);
    if (sessionId) send(makeMessage('PLAYBACK_STATE', { sessionId, tabId: 0, playback: state }, { sessionId }));
  }
  const onMessage = (message: AnyMessageEnvelope, _sender: chrome.runtime.MessageSender, respond: (value?: unknown) => void) => {
    if (!isMessage(message)) return false;
    if (message.type === 'VIDEO_DETECTED') { respond(readProbe(message.payload.sourceLanguage)); return false; }
    if (message.type === 'REQUEST_NATIVE_SUBTITLES') {
      clear(); sessionId = message.payload.sessionId; enabled = true;
      sourceLanguage = message.payload.sourceLanguage;
      readNative = message.payload.readNative;
      overlay.mount(); overlay.setDisplayMode(message.payload.displayMode);
      overlay.updateStyle(message.payload.style); overlay.setVisible(message.payload.visible);
      overlay.setStatus('SubtitleFlow · 正在连接字幕服务…');
      const probe = readProbe(sourceLanguage, readNative); lastSrc = detector.current()?.currentSrc ?? ''; lastUrl = location.href;
      playback(); respond(probe); return false;
    }
    if (message.type === 'SUBTITLE_UPDATE' && message.payload.sessionId === sessionId) {
      const state = detector.playback();
      for (const cue of message.payload.cues) {
        overlay.upsertCue(cue, state.currentTime, !state.paused && !state.seeking);
        if (cue.status === 'TRANSLATED' || cue.status === 'FINAL') updateNative(cue);
      }
      overlay.setStatus(''); overlay.renderAt(state.currentTime);
    }
    if (message.type === 'TOGGLE_OVERLAY') overlay.setVisible(message.payload.visible);
    if (message.type === 'SETTINGS_UPDATED') {
      overlay.updateStyle(message.payload.settings.style); overlay.setDisplayMode(message.payload.settings.displayMode);
      sourceLanguage = message.payload.settings.sourceLanguage; playback();
    }
    if (message.type === 'ERROR_OCCURRED' && (!message.sessionId || message.sessionId === sessionId)) {
      overlay.mount(); overlay.setStatus('SubtitleFlow · ' + message.payload.message); overlay.renderAt(detector.playback().currentTime);
    }
    if (message.type === 'STOP_TRANSLATION' && message.sessionId === sessionId) clear();
    return false;
  };
  detector.onVideo(() => {
    if (sessionId) {
      const oldSession = sessionId;
      clear();
      send(makeMessage('ERROR_OCCURRED', { code: 'VIDEO_CHANGED', sessionId: oldSession,
        message: '视频已切换，请重新点击开始翻译' }, { sessionId: oldSession }));
    }
  });
  detector.onPlayback(playback);
  detector.start();
  chrome.runtime.onMessage.addListener(onMessage);
  document.addEventListener('fullscreenchange', fullscreen);
  const interval = setInterval(() => {
    if (!enabled || !sessionId) return;
    const video = detector.current();
    if (location.href !== lastUrl || (lastSrc && video?.currentSrc && video.currentSrc !== lastSrc)) {
      const oldSession = sessionId; clear();
      send(makeMessage('ERROR_OCCURRED', { code: 'VIDEO_CHANGED', sessionId: oldSession,
        message: '视频已切换，请重新点击开始翻译' }, { sessionId: oldSession }));
      return;
    }
    const cues = video && readNative ? extractNativeSubtitles(video, sourceLanguage) : [];
    const signature = cues.length + ':' + cues[cues.length - 1]?.id;
    if (signature !== nativeSignature && cues.length) {
      nativeSignature = signature;
      send(makeMessage('NATIVE_SUBTITLES', { sessionId, cues }, { sessionId }));
    }
    playback();
  }, 500);
  const dispose = () => {
    clearInterval(interval); detector.stop(); overlay.destroy();
    chrome.runtime.onMessage.removeListener(onMessage); document.removeEventListener('fullscreenchange', fullscreen);
    window.removeEventListener('pagehide', onPageHide);
  };
  const onPageHide = (event: PageTransitionEvent) => {
    clear();
    if (!event.persisted) dispose();
  };
  window.addEventListener('pagehide', onPageHide);
  return dispose;
}
