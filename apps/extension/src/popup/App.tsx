import { useEffect, useState } from 'react';
import { makeMessage } from '../shared/messages';
import { defaultSettings, hasTranslationProvider } from '../shared/settings';
import { loadSettings, saveSettings } from '../shared/storage';
import { parseSubtitleFile } from '../shared/subtitle/parser';
import type { AppSettings, SessionSnapshot } from '../shared/types';
import { checkForUpdate, dismissUpdate, type ReleaseUpdate } from '../shared/updates';

const version = globalThis.chrome?.runtime?.getManifest?.().version ?? '';

export function App() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [tabId, setTabId] = useState<number>();
  const [session, setSession] = useState<Partial<SessionSnapshot>>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [update, setUpdate] = useState<ReleaseUpdate>();

  useEffect(() => {
    void loadSettings().then((stored) => {
      const safe = !hasTranslationProvider(stored) && stored.displayMode !== 'original'
        ? { ...stored, displayMode: 'original' as const } : stored;
      setSettings(safe);
    });
    void chrome.tabs?.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (tab?.id === undefined) return;
      setTabId(tab.id);
      const result = await chrome.runtime.sendMessage(makeMessage('GET_SESSION_STATE', { tabId: tab.id }));
      if (result && !result.error) setSession(result);
    }).catch((error) => setMessage(String(error)));
  }, []);

  useEffect(() => {
    if (!version || !settings.checkForUpdates) return;
    void checkForUpdate(version).then(setUpdate).catch(() => undefined);
  }, [settings.checkForUpdates]);

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
      const activeSettings = !hasTranslationProvider(settings) && settings.displayMode !== 'original'
        ? { ...settings, displayMode: 'original' as const } : settings;
      if (type === 'START_TRANSLATION') {
        setSettings(activeSettings);
        await saveSettings(activeSettings);
      }
      const result = await chrome.runtime.sendMessage(type === 'START_TRANSLATION'
        ? makeMessage(type, { tabId, settings: activeSettings }, { tabId })
        : makeMessage(type, { tabId }, { tabId }));
      if (result?.error) throw new Error(result.error);
      setSession((current) => ({
        status: 'IDLE', video: current?.video, importedCueCount: current?.importedCueCount, ...result,
      }));
    } catch (error) {
      const text = error instanceof Error ? error.message : '操作失败';
      setSession((current) => ({ ...current, status: 'ERROR', error: text })); setMessage(text);
    } finally { setBusy(false); }
  };

  const importSubtitles = async (file?: File) => {
    if (!file || tabId === undefined) return;
    setBusy(true); setMessage('');
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('字幕文件不能超过 5 MB');
      const cues = parseSubtitleFile(await file.text());
      const result = await chrome.runtime.sendMessage(makeMessage('IMPORT_SUBTITLES', { tabId, cues, fileName: file.name }, { tabId }));
      if (result?.error) throw new Error(result.error);
      setSession((current) => ({ ...current, importedCueCount: result.count ?? cues.length }));
      setMessage(`已导入 ${result.count ?? cues.length} 条字幕，可点击显示字幕。`);
    } catch (error) { setMessage(error instanceof Error ? error.message : '字幕文件导入失败'); }
    finally { setBusy(false); }
  };

  const removeImport = async () => {
    if (tabId === undefined) return;
    setBusy(true); setMessage('');
    try {
      const result = await chrome.runtime.sendMessage(makeMessage('CLEAR_IMPORTED_SUBTITLES', { tabId }));
      if (result?.error) throw new Error(result.error);
      setSession((current) => ({ ...current, importedCueCount: 0 }));
    } catch (error) { setMessage(error instanceof Error ? error.message : '移除字幕文件失败'); }
    finally { setBusy(false); }
  };

  const importedCount = session?.importedCueCount ?? 0;
  const status = session?.status ?? 'IDLE';
  const active = !['IDLE', 'STOPPED', 'ERROR'].includes(status);
  return <main className="popup-shell">
    <header><div><span className="eyebrow">SUBTITLEFLOW{version && ' · ' + version}</span><h1>视频字幕</h1></div><span className={'status-dot ' + status.toLowerCase()} /></header>
    <section className="site-card"><span className="label">当前视频</span><strong>{session?.video?.site || '尚未检测到视频'}</strong><small>{session?.video?.title || '播放视频后点击开始显示字幕'}</small>{session?.video?.hasVideo && <small>{session.video.hasNativeSubtitles ? '可读取原生字幕' : '无原生字幕，可导入 SRT/VTT 或配置识别服务'}</small>}</section>
    <section className="grid-two">
      <label>源语言<select value={settings.sourceLanguage} onChange={(e) => setSettings({ ...settings, sourceLanguage: e.target.value })}><option value="auto">自动检测</option><option value="en">英语</option><option value="ja">日语</option><option value="ko">韩语</option><option value="fr">法语</option><option value="de">德语</option></select></label>
      <label>目标语言<select value={settings.targetLanguage} onChange={(e) => setSettings({ ...settings, targetLanguage: e.target.value })}><option value="zh-CN">简体中文</option><option value="zh-TW">繁体中文</option></select></label>
    </section>
    <label>字幕模式<select disabled={active} value={settings.displayMode} onChange={(e) => setSettings({ ...settings, displayMode: e.target.value as AppSettings['displayMode'] })}><option value="original">仅原文</option><option value="bilingual">双语字幕</option><option value="translated">仅中文</option></select></label>
    <label>字幕来源<select disabled={busy || active} value={settings.subtitleSource} onChange={(e) => setSettings({ ...settings, subtitleSource: e.target.value as AppSettings['subtitleSource'] })}><option value="subtitles">网页或文件（无 AI）</option><option value="audio">语音识别（需要服务）</option></select></label>
    {settings.subtitleSource === 'subtitles' && <div className="subtitle-file">
      <label className="file-import">导入字幕文件
        <input disabled={busy || active || tabId === undefined} type="file" accept=".srt,.vtt,.ass,.ssa,text/vtt,text/plain"
          onChange={(event) => { void importSubtitles(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }}/>
      </label>
      {importedCount > 0 && <div className="status-line"><span>已导入 {importedCount} 条，优先使用文件</span>
        <button className="link-button" disabled={busy || active} onClick={() => void removeImport()}>移除</button>
      </div>}
    </div>}
    <div className="actions">
      <button className="primary" disabled={busy || active || tabId === undefined} onClick={() => void run('START_TRANSLATION')}>{busy ? '处理中…' : status === 'ERROR' ? '重试' : '显示字幕'}</button>
      <button disabled={busy || !active} onClick={() => void run(status === 'PAUSED' ? 'RESUME_TRANSLATION' : 'PAUSE_TRANSLATION')}>{status === 'PAUSED' ? '继续' : '暂停'}</button>
      <button className="danger" disabled={busy || status === 'IDLE'} onClick={() => void run('STOP_TRANSLATION')}>停止</button>
    </div>
    <div className="status-line"><span>{statusLabel(status)}</span></div>
    {(message || session?.error) && <p role="alert" className="error-detail">{message || session?.error}</p>}
    {session?.statusMessage && !session.error && <p className="runtime-detail">{session.statusMessage}{session.cueCount ? ' · ' + session.cueCount + ' 条' : ''}</p>}
    {update && <section className="site-card update-notice" aria-label="版本更新">
      <strong>SubtitleFlow {update.version} 可用</strong>
      <small>当前 {version} · {update.publishedAt} · {Math.ceil(update.bytes / 1024)} KB</small>
      <a href={update.releaseUrl} target="_blank" rel="noreferrer">查看更新与下载</a>
      <button className="link-button" onClick={() => void dismissUpdate(update.version).then(() => setUpdate(undefined)).catch(() => setMessage('无法保存稍后提醒设置。'))}>稍后提醒</button>
    </section>}
    <button className="link-button" onClick={() => chrome.runtime.openOptionsPage()}>打开设置中心 →</button>
  </main>;
}

function statusLabel(status: string): string {
  return ({ IDLE: '空闲', REQUESTING_AUDIO: '正在连接识别服务', CAPTURING: '服务已连接，等待字幕',
    RECOGNIZING: '正在识别', TRANSLATING: '正在翻译', DISPLAYING: '正在显示字幕', PAUSED: '已暂停',
    STOPPING: '正在停止', ERROR: '无法显示字幕' } as Record<string, string>)[status] ?? status;
}
