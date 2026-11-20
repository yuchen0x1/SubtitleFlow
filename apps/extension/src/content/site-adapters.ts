import type { VideoMetadata } from '../shared/types';

export interface SiteAdapter {
  name: string;
  matches(hostname: string): boolean;
  decorate(metadata: VideoMetadata): VideoMetadata;
}

const adapters: SiteAdapter[] = [
  { name: 'youtube', matches: (hostname) => matchesHostname(hostname, 'youtube.com') || matchesHostname(hostname, 'youtu.be'), decorate: (metadata) => ({ ...metadata, site: 'YouTube' }) },
  { name: 'bilibili', matches: (hostname) => matchesHostname(hostname, 'bilibili.com'), decorate: (metadata) => ({ ...metadata, site: 'Bilibili' }) },
  { name: 'vimeo', matches: (hostname) => matchesHostname(hostname, 'vimeo.com'), decorate: (metadata) => ({ ...metadata, site: 'Vimeo' }) },
];

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '');
}

/** Match an exact hostname or a hostname below the registered domain. */
export function matchesHostname(hostname: string, domain: string): boolean {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedDomain = normalizeHostname(domain);
  if (!normalizedDomain || normalizedHostname.split('.').some((label) => !label)) return false;
  return normalizedHostname === normalizedDomain || normalizedHostname.endsWith(`.${normalizedDomain}`);
}

export function siteAdapterForHostname(hostname: string): SiteAdapter | undefined {
  return adapters.find((adapter) => adapter.matches(hostname));
}

export function adaptVideoMetadata(metadata: VideoMetadata): VideoMetadata {
  return (siteAdapterForHostname(location.hostname) ?? { decorate: (value: VideoMetadata) => value }).decorate(metadata);
}
