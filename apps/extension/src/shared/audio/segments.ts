export interface AudioSegment { pcm: Int16Array; startTime: number; endTime: number; playbackRate: number; }

export class PcmSegmenter {
  private chunks: Int16Array[] = [];
  private size = 0;
  private silent = 0;
  private startTime = 0;
  constructor(private readonly sampleRate = 16000, private readonly maxSeconds = 4) {}

  push(pcm: Int16Array, mediaTime: number, playbackRate: number, speaking: boolean): AudioSegment | undefined {
    if (!this.size && !speaking) return undefined;
    if (!this.size) this.startTime = mediaTime;
    this.chunks.push(pcm); this.size += pcm.length;
    this.silent = speaking ? 0 : this.silent + pcm.length;
    if (this.size < this.sampleRate * this.maxSeconds && this.silent < this.sampleRate * 0.4) return undefined;
    const result: AudioSegment = { pcm: new Int16Array(this.size), startTime: this.startTime,
      endTime: mediaTime + pcm.length / this.sampleRate * playbackRate, playbackRate };
    let offset = 0;
    for (const chunk of this.chunks) { result.pcm.set(chunk, offset); offset += chunk.length; }
    this.reset();
    return result;
  }

  reset(): void { this.chunks = []; this.size = 0; this.silent = 0; }
}

export function encodeWav(pcm: Int16Array, sampleRate = 16000): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, 'RIFF'); view.setUint32(4, 36 + pcm.length * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, pcm.length * 2, true);
  pcm.forEach((sample, index) => view.setInt16(44 + index * 2, sample, true));
  return buffer;
}
