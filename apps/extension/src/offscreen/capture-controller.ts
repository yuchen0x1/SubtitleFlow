import { downsampleToPcm16 } from '../shared/audio/pcm';
import { PcmSegmenter, type AudioSegment } from '../shared/audio/segments';
import { makeMessage, type MessagePayloadMap } from '../shared/messages';
import type { AsrResult, PlaybackState } from '../shared/types';
import { transcribePcm } from '../ai/cloud-asr';

export type CaptureState = 'IDLE' | 'REQUESTING' | 'CAPTURING' | 'PROCESSING' | 'PAUSED' | 'STOPPING' | 'STOPPED' | 'ERROR';
export type CaptureOptions = MessagePayloadMap['START_CAPTURE'];

export class CaptureController {
  private state: CaptureState = 'IDLE';
  private stream?: MediaStream;
  private context?: AudioContext;
  private source?: MediaStreamAudioSourceNode;
  private processor?: AudioWorkletNode | ScriptProcessorNode;
  private silent?: GainNode;
  private socket?: WebSocket;
  private options?: CaptureOptions;
  private playback?: PlaybackState;
  private mediaTime = 0;
  private segmenter = new PcmSegmenter();
  private queue: Array<{ segment: AudioSegment; epoch: number }> = [];
  private busy = false;
  private requests = new Set<AbortController>();
  private epoch = 0;
  private generation = 0;
  private sequence = 0;
  private socketCancel?: () => void;
  private wsInFlight = 0;

  getState(): CaptureState { return this.state; }

  async start(options: CaptureOptions): Promise<void> {
    if (['REQUESTING', 'CAPTURING', 'PROCESSING', 'PAUSED'].includes(this.state)) throw new Error('已有音频会话，请先停止后重试');
    await this.stop();
    const generation = ++this.generation;
    this.options = options; this.playback = options.playback; this.mediaTime = options.playback.currentTime;
    this.state = 'REQUESTING';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: options.streamId } } as unknown as MediaTrackConstraints,
        video: false,
      });
      if (generation !== this.generation) { this.stream.getTracks().forEach((track) => track.stop()); throw new Error('启动已取消'); }
      this.context = new AudioContext();
      this.source = this.context.createMediaStreamSource(this.stream);
      this.source.connect(this.context.destination);
      this.silent = this.context.createGain(); this.silent.gain.value = 0;
      this.silent.connect(this.context.destination);
      if (this.context.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
        await this.context.audioWorklet.addModule(chrome.runtime.getURL('audio-worklet.js'));
        const worklet = new AudioWorkletNode(this.context, 'subtitleflow-processor');
        worklet.port.onmessage = (event: MessageEvent<Float32Array>) => this.onAudio(event.data);
        this.processor = worklet;
      } else {
        const fallback = this.context.createScriptProcessor(4096, 1, 1);
        fallback.onaudioprocess = (event) => this.onAudio(event.inputBuffer.getChannelData(0));
        this.processor = fallback;
      }
      this.source.connect(this.processor);
      this.processor.connect(this.silent);
      for (const track of this.stream.getTracks()) track.onended = () => { void this.fail('标签页音频流已结束，请重新开始'); };
      await this.context.resume();
      // Consume the tab stream ID immediately. Local Whisper model loading can
      // take minutes on first use, while Chrome's stream ID is short lived.
      // The source is already routed back to the destination, so original audio
      // remains audible while the ASR service finishes its handshake.
      if (options.provider.kind !== 'openai-compatible') await this.connectSocket(options);
      this.state = 'CAPTURING';
    } catch (error) {
      await this.release(); this.state = 'ERROR'; throw error;
    }
  }

  updatePlayback(playback: PlaybackState): void {
    if (!this.options) return;
    if (playback.seeking || Math.abs(playback.currentTime - this.mediaTime) > 0.75 ||
      playback.playbackRate !== this.playback?.playbackRate || playback.paused !== this.playback?.paused) {
      this.epoch++; this.queue = []; this.segmenter.reset();
      for (const request of this.requests) request.abort();
    }
    this.playback = playback;
    this.mediaTime = playback.currentTime;
  }

  async pause(): Promise<void> {
    if (!['CAPTURING', 'PROCESSING'].includes(this.state)) return;
    // Keep AudioContext running so the user's original video remains audible.
    this.state = 'PAUSED'; this.segmenter.reset(); this.queue = []; this.epoch++;
    for (const request of this.requests) request.abort();
  }
  async resume(): Promise<void> { if (this.state === 'PAUSED') this.state = 'CAPTURING'; }
  async stop(): Promise<void> {
    this.generation++; this.state = 'STOPPING';
    await this.release(); this.state = 'STOPPED';
  }

  private async connectSocket(options: CaptureOptions): Promise<void> {
    const address = options.asrWsUrl;
    if (!address) throw new Error('未配置 ASR WebSocket 地址');
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(address);
      this.socket = socket;
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return; settled = true;
        clearTimeout(timer); this.socketCancel = undefined;
        if (error) reject(error); else resolve();
      };
      const timer = setTimeout(() => finish(new Error('语音识别连接超时，请确认本地服务已启动且模型已加载')), options.provider.timeoutMs);
      this.socketCancel = () => finish(new Error('识别连接已取消'));
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'start', sessionId: options.sessionId, language: options.sourceLanguage,
          model: options.provider.model, sampleRate: 16000, timeoutMs: options.provider.timeoutMs,
          ...(options.provider.kind === 'websocket' && options.provider.apiKey ? { apiKey: options.provider.apiKey } : {}) }));
        if (options.provider.kind === 'websocket') finish();
      };
      socket.onerror = () => finish(new Error('无法连接语音识别服务，请检查服务地址和本地服务是否启动'));
      socket.onclose = () => {
        if (!settled) finish(new Error('语音识别服务在就绪前关闭连接'));
        else if (['CAPTURING', 'PAUSED'].includes(this.state)) void this.fail('语音识别服务连接已断开，请恢复服务后重新开始');
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as Record<string, unknown>;
          if (data.state === 'ready' || data.type === 'ready') { finish(); return; }
          if (data.state === 'unavailable' || data.type === 'error' || data.state === 'error') {
            const text = typeof data.message === 'string' ? data.message : '语音识别服务不可用';
            if (!settled) finish(new Error(text)); else void this.fail(text);
            return;
          }
          if (data.type === 'complete') this.wsInFlight = Math.max(0, this.wsInFlight - 1);
          if (typeof data.text === 'string') {
            if (typeof data.epoch === 'number' && data.epoch !== this.epoch) return;
            this.reportResult({
              text: data.text, sourceLanguage: String(data.sourceLanguage || options.sourceLanguage),
              startTime: Number(data.startTime), endTime: Number(data.endTime), isPartial: data.isPartial === true,
              sessionId: options.sessionId, sourceType: 'LOCAL_ASR',
              segmentId: typeof data.segmentId === 'string' ? data.segmentId : undefined,
            });
          }
        } catch { void this.fail('识别服务返回了无效数据，请检查 WebSocket 协议'); }
      };
    });
  }

  private onAudio(data: Float32Array): void {
    if (this.state !== 'CAPTURING' || this.playback?.paused || this.playback?.seeking || !this.options) return;
    const rate = this.playback?.playbackRate ?? 1;
    const sampleRate = this.context?.sampleRate ?? 48000;
    const time = this.mediaTime; this.mediaTime += data.length / sampleRate * rate;
    const level = Math.sqrt(data.reduce((sum, value) => sum + value * value, 0) / Math.max(1, data.length));
    const pcm = downsampleToPcm16(data, sampleRate);
    const segment = this.segmenter.push(pcm, time, rate, level > 0.006);
    if (!segment) return;
    if (this.options.provider.kind === 'openai-compatible') {
      if (this.queue.length >= 2) { void this.fail('语音识别速度跟不上播放：请降低播放倍速或选择更快的识别服务'); return; }
      this.queue.push({ segment, epoch: this.epoch }); void this.pumpCloud();
    } else if (this.socket?.readyState === WebSocket.OPEN) {
      if (this.wsInFlight >= 3 || this.socket.bufferedAmount > 512000) {
        void this.fail('本地模型识别速度跟不上播放，请改用更小的模型或云端识别'); return;
      }
      this.wsInFlight++;
      this.socket.send(JSON.stringify({ type: 'audio', sampleRate: 16000, startTime: segment.startTime,
        endTime: segment.endTime, playbackRate: segment.playbackRate, epoch: this.epoch,
        segmentId: this.options.sessionId + '-' + this.sequence++ }));
      this.socket.send(segment.pcm.buffer);
    }
  }

  private async pumpCloud(): Promise<void> {
    if (this.busy || !this.options) return;
    this.busy = true;
    try {
      while (this.queue.length && this.state === 'CAPTURING') {
        const item = this.queue.shift()!;
        if (item.epoch !== this.epoch) continue;
        const controller = new AbortController(); this.requests.add(controller);
        const timer = setTimeout(() => controller.abort(), this.options.provider.timeoutMs);
        try {
          const result = await transcribePcm(this.options.provider, item.segment,
            this.options.sessionId, this.options.sourceLanguage, controller.signal);
          if (item.epoch === this.epoch && this.state === 'CAPTURING') this.reportResult(result);
        } catch (error) {
          if (item.epoch === this.epoch && this.state === 'CAPTURING') await this.fail(controller.signal.aborted
            ? '语音识别请求超时，请检查服务或增加超时时间'
            : error instanceof Error ? error.message : '云端识别失败');
        } finally { clearTimeout(timer); this.requests.delete(controller); }
      }
    } finally { this.busy = false; }
  }

  private reportResult(result: AsrResult): void {
    if (this.state !== 'CAPTURING' || !result.text.trim()) return;
    void chrome.runtime.sendMessage(makeMessage(result.isPartial ? 'ASR_PARTIAL' : 'ASR_FINAL', result,
      { sessionId: result.sessionId, tabId: this.options?.tabId })).catch(() => undefined);
  }

  private async fail(message: string): Promise<void> {
    if (this.state === 'ERROR' || this.state === 'STOPPED' || this.state === 'STOPPING') return;
    this.state = 'ERROR';
    void chrome.runtime.sendMessage(makeMessage('ERROR_OCCURRED', {
      code: 'ASR_ERROR', message, sessionId: this.options?.sessionId, recoverable: true,
    }, { sessionId: this.options?.sessionId, tabId: this.options?.tabId })).catch(() => undefined);
    await this.release();
  }

  private async release(): Promise<void> {
    this.socketCancel?.(); this.socketCancel = undefined;
    this.segmenter.reset(); this.queue = []; this.wsInFlight = 0; this.epoch++;
    for (const request of this.requests) request.abort();
    this.requests.clear();
    if (this.processor) {
      if ('port' in this.processor) { this.processor.port.onmessage = null; this.processor.port.close(); }
      else this.processor.onaudioprocess = null;
      this.processor.disconnect();
    }
    this.source?.disconnect(); this.silent?.disconnect();
    this.stream?.getTracks().forEach((track) => { track.onended = null; track.stop(); });
    if (this.socket) { this.socket.onclose = null; this.socket.onmessage = null; this.socket.close(); }
    this.socket = undefined;
    if (this.context && this.context.state !== 'closed') await this.context.close();
    this.context = undefined; this.stream = undefined; this.source = undefined; this.processor = undefined; this.silent = undefined;
  }
}

