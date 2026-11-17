import type { AppSettings, SessionSnapshot, SessionStatus, VideoMetadata } from '../shared/types';

export interface SessionCaptureHooks {
  startCapture: (session: SessionRecord) => Promise<string>;
  stopCapture: (captureId: string) => Promise<void>;
}

export interface SessionRecord extends SessionSnapshot {
  settings: AppSettings;
  captureId?: string;
}

export class SessionManager {
  private readonly sessions = new Map<number, SessionRecord>();
  private readonly hooks: SessionCaptureHooks;

  constructor(hooks: SessionCaptureHooks) {
    this.hooks = hooks;
  }

  async start(tabId: number, settings: AppSettings, video?: VideoMetadata): Promise<SessionRecord> {
    const existing = this.sessions.get(tabId);
    if (existing && !['STOPPED', 'ERROR'].includes(existing.status)) return existing;
    const session: SessionRecord = {
      sessionId: crypto.randomUUID(),
      tabId,
      status: 'REQUESTING_AUDIO',
      video,
      sourceLanguage: settings.sourceLanguage,
      targetLanguage: settings.targetLanguage,
      displayMode: settings.displayMode,
      overlayVisible: settings.showOverlay,
      settings,
    };
    this.sessions.set(tabId, session);
    try {
      session.captureId = await this.hooks.startCapture(session);
      if (session.status === 'REQUESTING_AUDIO') session.status = 'CAPTURING';
      return session;
    } catch (error) {
      session.status = 'ERROR';
      session.error = error instanceof Error ? error.message : '音频采集启动失败';
      throw error;
    }
  }

  async pause(tabId: number): Promise<SessionRecord | undefined> {
    const session = this.sessions.get(tabId);
    if (!session || session.status === 'PAUSED') return session;
    if (session.status === 'CAPTURING' || session.status === 'RECOGNIZING' || session.status === 'TRANSLATING' || session.status === 'DISPLAYING') session.status = 'PAUSED';
    return session;
  }

  async resume(tabId: number): Promise<SessionRecord | undefined> {
    const session = this.sessions.get(tabId);
    if (!session || session.status !== 'PAUSED') return session;
    session.status = 'CAPTURING';
    return session;
  }

  async stop(tabId: number): Promise<void> {
    const session = this.sessions.get(tabId);
    if (!session) return;
    session.status = 'STOPPING';
    if (session.captureId) await this.hooks.stopCapture(session.captureId);
    session.status = 'STOPPED';
    this.sessions.delete(tabId);
  }

  updateStatus(tabId: number, status: SessionStatus, error?: string): SessionRecord | undefined {
    const session = this.sessions.get(tabId);
    if (!session) return undefined;
    session.status = status;
    session.error = error;
    return session;
  }

  updateVideo(tabId: number, video: VideoMetadata): SessionRecord | undefined {
    const session = this.sessions.get(tabId);
    if (!session) return undefined;
    session.video = video;
    return session;
  }

  get(tabId: number): SessionRecord | undefined {
    return this.sessions.get(tabId);
  }

  all(): SessionRecord[] {
    return [...this.sessions.values()];
  }
}
