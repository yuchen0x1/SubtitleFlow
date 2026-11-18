const REPOSITORY = 'yuchen0x1/SubtitleFlow';
const API_URL = 'https://api.github.com/repos/' + REPOSITORY + '/releases/latest';
const RELEASE_URL = 'https://github.com/' + REPOSITORY + '/releases';
const CACHE_KEY = 'subtitleflow.updateCheck';
const DISMISS_KEY = 'subtitleflow.updateDismissal';
const DAY = 86_400_000;
const VERSION_PATTERN = /^(0|[1-9][0-9]{0,4})\.(0|[1-9][0-9]{0,4})\.(0|[1-9][0-9]{0,4})$/;

export interface ReleaseUpdate {
  version: string;
  publishedAt: string;
  notes: string;
  releaseUrl: string;
  bytes: number;
  sha256: string;
}

export function parseRelease(data: unknown, currentVersion: string): ReleaseUpdate | undefined {
  if (!data || typeof data !== 'object') throw new Error('GitHub 返回了无效的发行信息');
  const release = data as Record<string, unknown>;
  if (release.draft !== false || release.prerelease !== false) return;
  const tag = typeof release.tag_name === 'string' ? release.tag_name : '';
  const version = tag.startsWith('v') ? tag.slice(1) : '';
  if (!VERSION_PATTERN.test(version) || !VERSION_PATTERN.test(currentVersion)) return;
  const current = currentVersion.split('.').map(Number);
  const order = version.split('.').map((value, index) => Number(value) - current[index]);
  if ((order.find((difference) => difference !== 0) ?? 0) <= 0) return;

  const releaseUrl = RELEASE_URL + '/tag/' + tag;
  const name = 'SubtitleFlow-' + version + '-Chromium.zip';
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const asset = assets.find((item) => item?.name === name &&
    item.browser_download_url === RELEASE_URL + '/download/' + tag + '/' + name);
  if (release.immutable !== true || release.html_url !== releaseUrl ||
      !asset || asset.state !== 'uploaded' || !Number.isSafeInteger(asset.size) || asset.size <= 0 ||
      !/^sha256:[a-f0-9]{64}$/.test(asset.digest) ||
      typeof release.published_at !== 'string' || !Number.isFinite(Date.parse(release.published_at))) {
    throw new Error('新版缺少可验证的正式发行资产，请查看 GitHub Releases');
  }
  return {
    version, releaseUrl, publishedAt: release.published_at.slice(0, 10), bytes: asset.size,
    sha256: asset.digest.slice(7),
    notes: typeof release.body === 'string' ? release.body.trim().slice(0, 500) : '',
  };
}

export async function checkForUpdate(currentVersion: string, manual = false): Promise<ReleaseUpdate | undefined> {
  const values = await chrome.storage.local.get([CACHE_KEY, DISMISS_KEY]);
  const cached = values[CACHE_KEY];
  const now = Date.now();
  let release: ReleaseUpdate | undefined;
  if (!manual && cached?.currentVersion === currentVersion && now >= cached.at && now - cached.at < DAY) {
    release = cached.release;
  } else {
    try {
      const response = await fetch(API_URL, {
        credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(8000),
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) throw new Error('GitHub 返回 HTTP ' + response.status);
      release = parseRelease(await response.json(), currentVersion);
      await chrome.storage.local.set({ [CACHE_KEY]: { at: now, currentVersion, release: release ?? null } });
    } catch (error) {
      if (manual) throw error;
      await chrome.storage.local.set({ [CACHE_KEY]: { at: now, currentVersion, release: null } });
      return;
    }
  }
  const dismissed = values[DISMISS_KEY];
  if (!manual && release && dismissed?.version === release.version && now < dismissed.until) return;
  return release ?? undefined;
}

export function dismissUpdate(version: string): Promise<void> {
  return chrome.storage.local.set({ [DISMISS_KEY]: { version, until: Date.now() + 7 * DAY } });
}
