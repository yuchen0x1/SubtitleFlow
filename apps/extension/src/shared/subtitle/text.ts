const VTT_TAG_NAMES = new Set(['b', 'i', 'u', 'ruby', 'rt', 'c', 'v', 'lang']);
const VTT_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&lrm;': '\u200e', '&rlm;': '\u200f',
};

function isVttTag(value: string): boolean {
  const token = value.trim();
  if (/^(?:\d{2,}:)?\d{2}:\d{2}\.\d{3}$/.test(token)) return true;
  const body = token.startsWith('/') ? token.slice(1).trimStart() : token;
  if (!body) return false;

  let nameEnd = 0;
  while (nameEnd < body.length) {
    const character = body[nameEnd];
    if (character === '.' || character === ' ' || character === '\t') break;
    nameEnd += 1;
  }
  const name = body.slice(0, nameEnd).toLowerCase();
  return VTT_TAG_NAMES.has(name);
}

function stripVttMarkup(value: string): string {
  let result = '';
  for (let index = 0; index < value.length;) {
    if (value[index] !== '<') {
      result += value[index];
      index += 1;
      continue;
    }

    const end = value.indexOf('>', index + 1);
    if (end < 0) {
      result += value.slice(index);
      break;
    }

    const token = value.slice(index + 1, end);
    if (isVttTag(token)) index = end + 1;
    else {
      result += value.slice(index, end + 1);
      index = end + 1;
    }
  }
  return result;
}

function stripAssMarkup(value: string): string {
  let result = '';
  for (let index = 0; index < value.length;) {
    if (value[index] !== '{') {
      result += value[index];
      index += 1;
      continue;
    }

    const end = value.indexOf('}', index + 1);
    if (end < 0) {
      result += value.slice(index);
      break;
    }

    const token = value.slice(index + 1, end);
    if (token.includes('\\')) index = end + 1;
    else {
      result += value.slice(index, end + 1);
      index = end + 1;
    }
  }
  return result;
}

/**
 * Remove supported subtitle formatting for display, preserving other literal text.
 * This is a text normalizer, not an HTML sanitizer: render its output as text only.
 */
export function normalizeSubtitleText(value: string): string {
  return stripAssMarkup(stripVttMarkup(value))
    .replace(/\r/g, '')
    .replace(/&(nbsp|amp|lt|gt|lrm|rlm);/gi, (entity) => VTT_ENTITIES[entity.toLowerCase()])
    .trim();
}

/** Escape plain text for a VTTCue, whose text is interpreted as WebVTT cue markup. */
export function toPlainVttText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
