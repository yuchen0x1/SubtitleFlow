import type { PlaybackState, VideoMetadata } from '../shared/types';

export class VideoDetector {
  private video?: HTMLVideoElement;
  private observer?: MutationObserver;
  private listeners = new Set<(metadata: VideoMetadata) => void>();
  private playbackListeners = new Set<(playback: PlaybackState) => void>();
  private poll?: ReturnType<typeof setInterval>;

  start(): void {
    this.scan();
    this.observer = new MutationObserver(() => this.scan());
    this.observer.observe(document.documentElement, { childList: true, subtree: true });
    this.poll = setInterval(() => this.scan(), 1000);
  }

  stop(): void {
    this.observer?.disconnect();
    clearInterval(this.poll);
    if (this.video) this.unbind(this.video);
    this.listeners.clear(); this.playbackListeners.clear();
  }

  playback(): PlaybackState {
    const video = this.video;
    return { currentTime: video?.currentTime ?? 0, paused: video?.paused ?? true,
      playbackRate: video?.playbackRate ?? 1, duration: Number.isFinite(video?.duration) ? video!.duration : 0,
      seeking: video?.seeking ?? false };
  }

  refresh(): void { this.scan(); }

  onVideo(listener: (metadata: VideoMetadata) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  onPlayback(listener: (playback: PlaybackState) => void): () => void { this.playbackListeners.add(listener); return () => this.playbackListeners.delete(listener); }

  current(): HTMLVideoElement | undefined { return this.video; }

  private scan(): void {
    const candidates = [...document.querySelectorAll('video')].filter((item) => item.offsetWidth > 0 && item.offsetHeight > 0) as HTMLVideoElement[];
    const next = candidates.sort((a, b) => (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight))[0];
    if (!next || next === this.video) return;
    if (this.video) this.unbind(this.video);
    this.video = next;
    this.bind(next);
    const metadata: VideoMetadata = {
      tabId: 0,
      site: location.hostname,
      title: document.title,
      url: location.href,
      hasVideo: true,
      hasNativeSubtitles: next.textTracks.length > 0,
    };
    for (const listener of this.listeners) listener(metadata);
  }

  private bind(video: HTMLVideoElement): void {
    for (const event of ['timeupdate', 'play', 'pause', 'ratechange', 'seeking', 'seeked', 'durationchange']) video.addEventListener(event, this.emitPlayback);
  }

  private unbind(video: HTMLVideoElement): void {
    for (const event of ['timeupdate', 'play', 'pause', 'ratechange', 'seeking', 'seeked', 'durationchange']) video.removeEventListener(event, this.emitPlayback);
  }

  private emitPlayback = (): void => {
    const video = this.video;
    if (!video) return;
    const state: PlaybackState = { currentTime: video.currentTime, paused: video.paused, playbackRate: video.playbackRate, duration: Number.isFinite(video.duration) ? video.duration : 0, seeking: video.seeking };
    for (const listener of this.playbackListeners) listener(state);
  };
}
