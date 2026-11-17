import type { DisplayMode, SubtitleCue, SubtitleStyle } from '../shared/types';
import { SubtitleTimeline } from '../shared/subtitle/timeline';

export class SubtitleOverlay {
  private host?: HTMLDivElement;
  private shadow?: ShadowRoot;
  private content?: HTMLDivElement;
  private sheet?: HTMLStyleElement;
  private timeline = new SubtitleTimeline();
  private displayMode: DisplayMode = 'bilingual';
  private style: SubtitleStyle;
  private status = '';
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };
  private rendered = '';
  private live?: { cue: SubtitleCue; expiresAt: number };

  constructor(style: SubtitleStyle) { this.style = style; }

  mount(): void {
    if (this.host) return;
    this.host = document.createElement('div');
    this.host.id = 'subtitleflow-overlay-host';
    this.host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;display:block';
    this.shadow = this.host.attachShadow({ mode: 'open' });
    this.sheet = document.createElement('style');
    this.content = document.createElement('div');
    this.content.className = 'subtitleflow-overlay';
    this.content.setAttribute('aria-live', 'polite');
    this.shadow.append(this.sheet, this.content);
    this.reparent();
    this.applyStyle();
    this.content.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('fullscreenchange', this.reparent);
  }

  setCues(cues: SubtitleCue[]): void { this.timeline.replace(cues); this.live = undefined; this.rendered = ''; }
  upsertCue(cue: SubtitleCue, mediaTime?: number, advancing = true): void {
    this.timeline.upsert(cue);
    // Keep real timestamps for replay. Late live-ASR results get a short display grace period.
    if (cue.sourceType !== 'NATIVE_SUBTITLE' && cue.status === 'TRANSLATED' && advancing &&
        mediaTime !== undefined && mediaTime >= cue.endTime && mediaTime - cue.endTime < 20) {
      this.live = { cue, expiresAt: mediaTime + Math.max(3, Math.min(6, cue.endTime - cue.startTime)) };
    }
    const cues = this.timeline.all();
    if (cues.length > 3000) this.timeline.replace(cues.slice(-3000));
    this.rendered = '';
  }
  setDisplayMode(mode: DisplayMode): void { this.displayMode = mode; this.rendered = ''; }
  setVisible(visible: boolean): void { if (this.host) this.host.style.display = visible ? 'block' : 'none'; }
  setStatus(status: string): void { this.status = status; this.rendered = ''; }
  updateStyle(style: SubtitleStyle): void { this.style = style; this.applyStyle(); }
  clearLive(): void { this.live = undefined; this.rendered = ''; }

  renderAt(time: number): void {
    if (!this.content) return;
    const active = this.timeline.activeAt(time).slice(-2);
    if (this.live && time >= this.live.expiresAt) this.live = undefined;
    if (!active.length && this.live) active.push(this.live.cue);
    const lines: Array<{ text: string; className: string }> = [];
    for (const cue of active) {
      if (this.displayMode !== 'translated') lines.push({ text: cue.originalText, className: 'original' });
      if (this.displayMode !== 'original' && cue.translatedText) lines.push({ text: cue.translatedText, className: 'translated' });
      else if (this.displayMode === 'translated' && cue.status === 'TRANSLATING') lines.push({ text: 'SubtitleFlow · 正在翻译…', className: 'status' });
    }
    if (!lines.length && this.status) lines.push({ text: this.status, className: 'status' });
    const signature = JSON.stringify(lines);
    if (signature === this.rendered) return;
    this.rendered = signature;
    this.content.replaceChildren(...lines.map((line) => {
      const div = document.createElement('div'); div.className = line.className; div.textContent = line.text; return div;
    }));
    this.content.hidden = !lines.length;
  }

  destroy(): void {
    this.content?.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('fullscreenchange', this.reparent);
    this.host?.remove(); this.host = undefined;
  }

  private reparent = (): void => {
    if (!this.host) return;
    const fullscreen = document.fullscreenElement;
    const parent = fullscreen && !(fullscreen instanceof HTMLVideoElement) ? fullscreen : document.documentElement;
    if (this.host.parentNode !== parent) parent.append(this.host);
  };

  private applyStyle(): void {
    if (!this.sheet) return;
    const s = this.style;
    this.sheet.textContent = ':host{all:initial}.subtitleflow-overlay{position:absolute;left:' + s.left +
      '%;bottom:' + s.bottom + '%;transform:translateX(-50%);width:max-content;max-width:' + s.maxWidth +
      'vw;box-sizing:border-box;padding:10px 18px;border-radius:9px;color:' + s.textColor +
      ';background:color-mix(in srgb,' + s.backgroundColor + ' ' + Math.round(s.backgroundOpacity * 100) +
      '%,transparent);font:' + s.fontWeight + ' ' + s.fontSize + 'px/' + s.lineHeight + ' ' + s.fontFamily +
      ';text-align:' + s.align + ';pointer-events:auto;user-select:none;cursor:' + (s.locked ? 'default' : 'grab') +
      ';text-shadow:' + (s.shadow ? '0 2px 4px #000' : 'none') + ';paint-order:stroke fill;-webkit-text-stroke:' +
      s.outlineWidth + 'px ' + s.outlineColor +
      '}.original,.translated{white-space:pre-wrap;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:' +
      s.maxLines + ';-webkit-box-orient:vertical;overflow:hidden}.translated{margin-top:3px}.status{font-size:15px;-webkit-text-stroke:0;color:#b7eaff}.subtitleflow-overlay[hidden]{display:none}';
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.style.locked || !this.content) return;
    this.dragging = true;
    const rect = this.content.getBoundingClientRect();
    this.dragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    this.content.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };
  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging || !this.content) return;
    const x = Math.max(0, Math.min(window.innerWidth, event.clientX - this.dragOffset.x + this.content.offsetWidth / 2));
    const y = Math.max(0, Math.min(window.innerHeight - this.content.offsetHeight, event.clientY - this.dragOffset.y));
    this.content.style.left = (x / window.innerWidth) * 100 + '%';
    this.content.style.bottom = 'auto'; this.content.style.top = y + 'px';
  };
  private onPointerUp = (): void => { this.dragging = false; };
}

