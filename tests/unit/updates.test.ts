import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkForUpdate, dismissUpdate, parseRelease } from '../../apps/extension/src/shared/updates';

const root = 'https://github.com/yuchen0x1/SubtitleFlow/releases';
const asset = {
  name: 'SubtitleFlow-0.0.10-Chromium.zip',
  browser_download_url: root + '/download/v0.0.10/SubtitleFlow-0.0.10-Chromium.zip',
  digest: 'sha256:' + 'a'.repeat(64),
  state: 'uploaded',
  size: 512,
};
const release = {
  tag_name: 'v0.0.10',
  draft: false,
  prerelease: false,
  immutable: true,
  html_url: root + '/tag/v0.0.10',
  published_at: '2026-11-18T01:00:00Z',
  assets: [asset],
};
afterEach(() => vi.unstubAllGlobals());

describe('GitHub release updates', () => {
  it('compares numeric versions and ignores current, older and prerelease versions', () => {
    expect(parseRelease(release, '0.0.9')?.version).toBe('0.0.10');
    expect(parseRelease(release, '0.0.10')).toBeUndefined();
    expect(parseRelease(release, '0.1.0')).toBeUndefined();
    expect(parseRelease({ ...release, prerelease: true }, '0.0.9')).toBeUndefined();
    expect(parseRelease({ ...release, draft: true }, '0.0.9')).toBeUndefined();
  });

  it('rejects mutable releases, missing digests and foreign asset URLs', () => {
    expect(() => parseRelease({ ...release, immutable: false }, '0.0.9')).toThrow();
    expect(() => parseRelease({ ...release, assets: [{ ...asset, digest: null }] }, '0.0.9')).toThrow();
    expect(() => parseRelease({ ...release, assets: [{ ...asset, browser_download_url: 'https://example.test/x.zip' }] }, '0.0.9')).toThrow();
  });

  it('throttles automatic checks and lets manual checks bypass dismissal', async () => {
    const values = {};
    vi.stubGlobal('chrome', { storage: { local: {
      get: async () => values,
      set: async (update: object) => { Object.assign(values, update); },
    } } });
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => release });
    vi.stubGlobal('fetch', fetch);

    expect(await checkForUpdate('0.0.9')).toMatchObject({ version: '0.0.10' });
    await dismissUpdate('0.0.10');
    expect(await checkForUpdate('0.0.9')).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await checkForUpdate('0.0.9', true)).toMatchObject({ version: '0.0.10' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps the extension usable after a network failure and surfaces it on demand', async () => {
    vi.stubGlobal('chrome', { storage: { local: { get: async () => ({}), set: async () => undefined } } });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));
    expect(await checkForUpdate('0.0.9')).toBeUndefined();
    await expect(checkForUpdate('0.0.9', true)).rejects.toThrow('Offline');
  });
});
