import { describe, expect, it } from 'vitest';
import { matchesHostname, siteAdapterForHostname } from '../../apps/extension/src/content/site-adapters';

describe('site hostname matching', () => {
  it('accepts registered domains and their ordinary subdomains', () => {
    expect(matchesHostname('youtube.com', 'youtube.com')).toBe(true);
    expect(matchesHostname('www.youtube.com', 'youtube.com')).toBe(true);
    expect(matchesHostname('m.bilibili.com', 'bilibili.com')).toBe(true);
    expect(matchesHostname('player.vimeo.com.', 'vimeo.com')).toBe(true);
    expect(siteAdapterForHostname('YOUTU.BE')?.name).toBe('youtube');
  });

  it.each([
    'myyoutube.com', 'youtube.company', 'youtube.com.example.test', 'youtu.be.example.test',
    'notbilibili.com', 'bilibili.com.example.test', 'myvimeo.com', 'vimeo.com.example.test',
    '.youtube.com', 'www..youtube.com', 'youtube.com..', '',
  ])('does not select an adapter for the unrelated or invalid hostname %s', (hostname) => {
    expect(siteAdapterForHostname(hostname)).toBeUndefined();
  });

  it('selects the expected adapter for supported hosts', () => {
    expect(siteAdapterForHostname('www.youtube.com')?.name).toBe('youtube');
    expect(siteAdapterForHostname('player.vimeo.com')?.name).toBe('vimeo');
    expect(siteAdapterForHostname('www.example.test')).toBeUndefined();
  });
});
