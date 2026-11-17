import type { VideoMetadata } from '../shared/types';

export interface SiteAdapter {
  name: string;
  matches(hostname: string): boolean;
  decorate(metadata: VideoMetadata): VideoMetadata;
}

const adapters: SiteAdapter[] = [
  { name: 'youtube', matches: (hostname) => hostname.includes('youtube.com') || hostname.includes('youtu.be'), decorate: (metadata) => ({ ...metadata, site: 'YouTube' }) },
  { name: 'bilibili', matches: (hostname) => hostname.includes('bilibili.com'), decorate: (metadata) => ({ ...metadata, site: 'Bilibili' }) },
  { name: 'vimeo', matches: (hostname) => hostname.includes('vimeo.com'), decorate: (metadata) => ({ ...metadata, site: 'Vimeo' }) },
];

export function adaptVideoMetadata(metadata: VideoMetadata): VideoMetadata {
  return (adapters.find((adapter) => adapter.matches(location.hostname)) ?? { decorate: (value: VideoMetadata) => value }).decorate(metadata);
}
