import { useEffect, useState } from 'react';
import { defaultSettings } from '../shared/settings';
import { loadSettings, saveSettings, clearStoredData } from '../shared/storage';
import { makeMessage } from '../shared/messages';
import { OpenAICompatibleProvider } from '../ai/openai-compatible';
import type { AppSettings, ProviderConfig } from '../shared/types';
import { providerUrl } from '../ai/endpoint';
import { checkForUpdate, type ReleaseUpdate } from '../shared/updates';

const version = globalThis.chrome?.runtime?.getManifest?.().version ?? '';

export function App() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saved, setSaved] = useState('');
  const [checking, setChecking] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [update, setUpdate] = useState<ReleaseUpdate>();
  useEffect(() => { void loadSettings().then(setSettings); }, []);
  const save = async () => {
    try {
      for (const provider of [settings.asrProvider, settings.translationProvider]) {
        if (provider.kind !== 'none' && provider.endpoint.trim()) {
          providerUrl(provider.endpoint, provider.kind === 'websocket' || provider.kind === 'local-service');
        }
      }
      await saveSettings(settings);
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        await chrome.runtime.sendMessage(makeMessage('SETTINGS_UPDATED', { settings }));
      }
      setSaved('设置已保存。更换识别或翻译服务后，请停止当前会话并重新开始。');
    } catch (error) { setSaved(error instanceof Error ? error.message : '保存失败'); }
  };
  const checkUpdates = async () => {
    setChecking(true); setUpdateMessage(''); setUpdate(undefined);
    try {
      const release = await checkForUpdate(version, true);
      setUpdate(release);
      if (!release) setUpdateMessage('当前已是最新正式版本。');
    } catch {
      setUpdateMessage('无法验证新版，请稍后重试或直接查看 GitHub Releases。');
    } finally {
      setChecking(false);
    }
  };
  return <main className="options-shell">
    <header><div><span className="eyebrow">SubtitleFlow {version}</span><h1>字幕与可选服务</h1><p>原生字幕和导入字幕可离线显示；识别与机器翻译服务按需配置。</p></div><button className="primary" onClick={() => void save()}>保存设置</button></header>
    <div className="layout"><nav><a href="#basic">语言设置</a><a href="#ai">识别与翻译</a><a href="#style">字幕样式</a><a href="#privacy">隐私与数据</a><a href="#updates">版本更新</a></nav>
    <section className="content">
      <section id="basic" className="card"><h2>语言设置</h2><div className="form-grid">
        <label>源语言<select value={settings.sourceLanguage} onChange={(e) => setSettings({ ...settings, sourceLanguage: e.target.value })}><option value="auto">自动检测</option><option value="en">英语</option><option value="ja">日语</option><option value="ko">韩语</option><option value="fr">法语</option><option value="de">德语</option><option value="es">西班牙语</option><option value="zh">中文</option></select></label>
        <label>目标语言<input value={settings.targetLanguage} placeholder="zh-CN / zh-TW / en" onChange={(e) => setSettings({ ...settings, targetLanguage: e.target.value })}/></label>
        <label>字幕显示<select value={settings.displayMode} onChange={(e) => setSettings({ ...settings, displayMode: e.target.value as AppSettings['displayMode'] })}><option value="bilingual">双语</option><option value="translated">仅译文</option><option value="original">仅原文</option></select></label>
        <label>字幕来源<select value={settings.subtitleSource} onChange={(e) => setSettings({ ...settings, subtitleSource: e.target.value as AppSettings['subtitleSource'] })}><option value="subtitles">网页或文件（无 AI）</option><option value="audio">语音识别（需要服务）</option></select></label>
        <label>上下文条数<input type="number" min="1" max="20" value={settings.contextWindow} onChange={(e) => setSettings({ ...settings, contextWindow: Number(e.target.value) })}/></label>
      </div></section>
      <section id="ai" className="card"><h2>识别与翻译</h2>
        <p className="notice">不配置任何 AI 时，插件仍可读取网页原生字幕、显示原文或使用弹窗导入的 SRT/VTT/ASS/SSA。只有在视频没有字幕文本、需要从声音识别或自动翻译时，才需要配置服务。</p>
        <ProviderEditor label="语音识别" role="asr" value={settings.asrProvider} onChange={(asrProvider) => setSettings({ ...settings, asrProvider })}/>
        <ProviderEditor label="文本翻译" role="translation" value={settings.translationProvider} onChange={(translationProvider) => setSettings({ ...settings, translationProvider })}/>
        <p className="hint">使用 Ollama 或 LM Studio 翻译时，选择 OpenAI 兼容，填写本机的 /v1 地址和已下载模型名称。只配置聊天模型不能识别音频。</p>
      </section>
      <section id="updates" className="card"><h2>版本更新</h2>
        <label><input type="checkbox" checked={settings.checkForUpdates} onChange={(event) => setSettings({ ...settings, checkForUpdates: event.target.checked })}/> 打开弹窗时检查 GitHub 新版（每天最多一次）</label>
        <p className="hint">GitHub ZIP 需要手动下载、验证并重新加载扩展。商店版本由浏览器更新。检查请求只获取公开的版本信息。</p>
        <button disabled={checking || !version} onClick={() => void checkUpdates()}>{checking ? '正在检查…' : '检查更新'}</button>
        {updateMessage && <p role="status">{updateMessage}</p>}
        {update && <div role="status">
          <p>SubtitleFlow {update.version} · {update.publishedAt} · {Math.ceil(update.bytes / 1024)} KB</p>
          <p className="hint">{update.notes}</p>
          <a href={update.releaseUrl} target="_blank" rel="noreferrer">查看发行说明与下载</a>
        </div>}
      </section>
      <section id="style" className="card"><h2>字幕样式</h2><div className="form-grid">
        <label>字号<input type="number" min="12" max="72" value={settings.style.fontSize} onChange={(e) => setSettings({ ...settings, style: { ...settings.style, fontSize: Number(e.target.value) } })}/></label>
        <label>最大宽度（%）<input type="number" min="30" max="100" value={settings.style.maxWidth} onChange={(e) => setSettings({ ...settings, style: { ...settings.style, maxWidth: Number(e.target.value) } })}/></label>
        <label>文字颜色<input type="color" value={settings.style.textColor} onChange={(e) => setSettings({ ...settings, style: { ...settings.style, textColor: e.target.value } })}/></label>
        <label>背景透明度<input type="range" min="0" max="1" step=".05" value={settings.style.backgroundOpacity} onChange={(e) => setSettings({ ...settings, style: { ...settings.style, backgroundOpacity: Number(e.target.value) } })}/></label>
      </div><div className="preview" style={{ color: settings.style.textColor, background: 'color-mix(in srgb, ' + settings.style.backgroundColor + ' ' + settings.style.backgroundOpacity * 100 + '%, transparent)', fontSize: settings.style.fontSize }}>{settings.displayMode !== 'translated' && <div>Are you serious?</div>}{settings.displayMode !== 'original' && <div>你是认真的吗？</div>}</div></section>
      <section id="privacy" className="card"><h2>隐私与数据</h2><p className="hint">只在你点击开始后采集当前标签页。云端识别会发送音频，云端翻译会发送字幕文本。本地 Whisper 在本机处理音频。</p><p className="hint">API Key 保存在浏览器本地；本地存储不等于不可提取的保险箱。页面脚本无法通过本扩展读取密钥，日志不输出密钥。</p>
        <button onClick={() => void clearStoredData().then(() => { setSettings(defaultSettings); setSaved('本地设置已清理'); })}>清理本地设置</button>
      </section>
      {saved && <div role="status" className="save-feedback">{saved}</div>}
    </section></div>
  </main>;
}

function ProviderEditor({ label, role, value, onChange }: {
  label: string; role: 'asr' | 'translation'; value: ProviderConfig; onChange: (value: ProviderConfig) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState('');
  const change = (field: keyof ProviderConfig, next: string | number) => { setResult(''); onChange({ ...value, [field]: next }); };
  const kindChange = (kind: ProviderConfig['kind']) => {
    setResult('');
    onChange({ ...value, kind, endpoint: kind === 'local-service' ? 'http://127.0.0.1:8765' : '',
      model: role === 'asr' && kind === 'local-service' ? 'small' : '',
      timeoutMs: kind === 'local-service' ? 120000 : 30000 });
  };
  const test = async () => {
    setTesting(true); setResult('');
    try {
      if (!value.endpoint.trim()) throw new Error('请先填写服务地址');
      if (role === 'translation' && value.kind === 'openai-compatible') {
        const status = await new OpenAICompatibleProvider(value).validateConnection();
        if (status.state !== 'ready') throw new Error(status.message || '连接失败');
        setResult('已通过地址与鉴权检查；翻译能力以实际字幕请求为准。');
      } else if (value.kind === 'local-service') {
        const url = providerUrl(value.endpoint, role === 'asr');
        url.protocol = url.protocol === 'wss:' || url.protocol === 'https:' ? 'https:' : 'http:';
        url.pathname = '/health'; url.search = '';
        const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error('本地服务返回 HTTP ' + response.status);
        const data = await response.json() as { modelLoaded?: boolean; model?: string };
        setResult(data.modelLoaded ? '本地服务已连接，Whisper 模型已加载：' + data.model :
          '本地服务已连接，模型未加载；首次识别会下载并加载模型，请使用至少 120000ms 超时。');
      } else if (role === 'asr' && value.kind === 'openai-compatible') {
        const status = await new OpenAICompatibleProvider(value).validateConnection();
        if (status.state !== 'ready') throw new Error(status.message || '连接失败');
        setResult('地址与鉴权检查通过。此检查不证明支持识别；服务还必须提供 /audio/transcriptions。');
      } else {
        throw new Error('自定义 WebSocket 将在开始识别时验证，请按开发文档实现 start/audio/final 消息协议。');
      }
    } catch (error) { setResult(error instanceof Error ? error.message : '连接失败'); }
    finally { setTesting(false); }
  };
  return <section className="provider-section"><h3>{label}</h3><div className="form-grid">
    <label>服务类型<select value={value.kind} onChange={(e) => kindChange(e.target.value as ProviderConfig['kind'])}><option value="openai-compatible">OpenAI 兼容{role === 'asr' ? '音频识别' : '文本翻译'}</option><option value="local-service">本地 SubtitleFlow 服务</option>{role === 'asr' && <option value="websocket">自定义 ASR WebSocket</option>}<option value="none">未配置</option></select></label>
    <label>模型名称<input value={value.model} placeholder={role === 'asr' ? 'small / whisper-1 / gpt-4o-mini-transcribe' : '服务商提供的翻译模型'} onChange={(e) => change('model', e.target.value)}/></label>
    <label className="wide">服务地址<input value={value.endpoint} placeholder={value.kind === 'local-service' ? 'http://127.0.0.1:8765' : 'https://你的服务商/v1'} onChange={(e) => change('endpoint', e.target.value)}/></label>
    <label className="wide">API Key<input type="password" autoComplete="off" value={value.apiKey} placeholder={value.kind === 'local-service' ? '本地服务无需 Key' : '保存在本机，不会显示在日志中'} onChange={(e) => change('apiKey', e.target.value)}/></label>
    <label>超时（毫秒）<input type="number" min="5000" max="300000" value={value.timeoutMs} onChange={(e) => change('timeoutMs', Number(e.target.value))}/></label>
    <label>并发上限<input type="number" min="1" max="4" value={value.concurrency} onChange={(e) => change('concurrency', Number(e.target.value))}/></label>
  </div><button className="test-connection" disabled={testing} onClick={() => void test()}>{testing ? '正在检查…' : '测试' + label + '连接'}</button>{result && <p className="provider-result" role="status">{result}</p>}</section>;
}
