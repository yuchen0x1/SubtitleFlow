import { useEffect, useState } from 'react';
import { makeMessage } from '../shared/messages';
import { defaultSettings } from '../shared/settings';
import { loadSettings, saveSettings } from '../shared/storage';
import type { AppSettings, SessionSnapshot } from '../shared/types';

export function App() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [tabId, setTabId] = useState<number>();
  const [session, setSession] = useState<Partial<SessionSnapshot>>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void loadSettings().then(setSettings);
    void chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (tab?.id === undefined) return;
      setTabId(tab.id);
      const result = await chrome.runtime.sendMessage(makeMessage('GET_SESSION_STATE', { tabId: tab.id }));
      if (result && !result.error) setSession(result);
    }).catch((error) => setMessage(String(error)));
  }, []);

  useEffect(() => {
    if (tabId === undefined) return;
    const timer = setInterval(() => {
      void chrome.runtime.sendMessage(makeMessage('GET_SESSION_STATE', { tabId }))
        .then((result) => { if (result && !result.error) setSession(result); }).catch(() => undefined);
    }, 1000);
    return () => clearInterval(timer);
  }, [tabId]);

  const run = async (type: 'START_TRANSLATION' | 'STOP_TRANSLATION' | 'PAUSE_TRANSLATION' | 'RESUME_TRANSLATION') => {
    if (tabId === undefined) return;
    setBusy(true); setMessage('');
    try {
      if (type === 'START_TRANSLATION') await saveSettings(settings);
      const result = await chrome.runtime.sendMessage(type === 'START_TRANSLATION'
        ? makeMessage(type, { tabId, settings }, { tabId })
        : makeMessage(type, { tabId }, { tabId }));
      if (result?.error) throw new Error(result.error);
      setSession(result ?? { status: 'IDLE' });
    } catch (error) {
      const text = error instanceof Error ? error.message : '操作失败';
      setSession((current) => ({ ...current, status: 'ERROR', error: text })); setMessage(text);
    } finally { setBusy(false); }
  };

  const status = session?.status ?? 'IDLE';
  const active = !['IDLE', 'STOPPED', 'ERROR'].includes(status);
  return <main className="popup-shell">
    <header><div><span className="eyebrow">SUBTITLEFLOW · 0.0.1</span><h1>实时字幕翻译</h1></div><span className={'status-dot ' + status.toLowerCase()} /></header>
    <section className="site-card"><span className="label">当前视频</span><strong>{session?.video?.site || '尚未检测到视频'}</strong><small>{session?.video?.title || '播放视频后点击开始翻译'}</small>{session?.video?.hasVideo && <small>{session.video.hasNativeSubtitles ? '可读取原生字幕' : '无可读取字幕，需要语音识别服务'}</small>}</section>
    <section className="grid-two">
      <label>源语言<select value={settings.sourceLanguage} onChange={(e) => setSettings({ ...settings, sourceLanguage: e.target.value })}><option value="auto">自动检测</option><option value="en">英语</option><option value="ja">日语</option><option value="ko">韩语</option><option value="fr">法语</option><option value="de">德语</option></select></label>
      <label>目标语言<select value={settings.targetLanguage} onChange={(e) => setSettings({ ...settings, targetLanguage: e.target.value })}><option value="zh-CN">简体中文</option><option value="zh-TW">繁体中文</option></select></label>
    </section>
    <label>字幕模式<select disabled={active} value={settings.displayMode} onChange={(e) => setSettings({ ...settings, displayMode: e.target.value as AppSettings['displayMode'] })}><option value="bilingual">双语字幕</option><option value="translated">仅中文</option><option value="original">仅原文</option></select></label>
    <div className="actions">
      <button className="primary" disabled={busy || active || tabId === undefined} onClick={() => void run('START_TRANSLATION')}>{busy ? '处理中…' : status === 'ERROR' ? '重试' : '开始翻译'}</button>
      <button disabled={busy || !active} onClick={() => void run(status === 'PAUSED' ? 'RESUME_TRANSLATION' : 'PAUSE_TRANSLATION')}>{status === 'PAUSED' ? '继续' : '暂停'}</button>
      <button className="danger" disabled={busy || status === 'IDLE'} onClick={() => void run('STOP_TRANSLATION')}>停止</button>
    </div>
    <div className="status-line"><span>{statusLabel(status)}</span></div>
    {(message || session?.error) && <p role="alert" className="error-detail">{message || session?.error}</p>}
    {session?.statusMessage && !session.error && <p className="runtime-detail">{session.statusMessage}{session.cueCount ? ' · ' + session.cueCount + ' 条' : ''}</p>}
    <button className="link-button" onClick={() => chrome.runtime.openOptionsPage()}>打开设置中心 →</button>
  </main>;
}

function statusLabel(status: string): string {
  return ({ IDLE: '空闲', REQUESTING_AUDIO: '正在连接识别服务', CAPTURING: '服务已连接，等待字幕',
    RECOGNIZING: '正在识别', TRANSLATING: '正在翻译', DISPLAYING: '正在显示字幕', PAUSED: '已暂停',
    STOPPING: '正在停止', ERROR: '服务不可用' } as Record<string, string>)[status] ?? status;
}


