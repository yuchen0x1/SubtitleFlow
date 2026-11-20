import { describe, expect, it } from 'vitest';
import { normalizeSubtitleText, toPlainVttText } from '../../apps/extension/src/shared/subtitle/text';

describe('subtitle text normalization', () => {
  it('removes supported cue markup while preserving ordinary comparison text', () => {
    expect(normalizeSubtitleText('Use <i>italics</i> when 2 < 3 and 4 > 1')).toBe('Use italics when 2 < 3 and 4 > 1');
  });

  it('removes ASS override tags without dropping ordinary braces', () => {
    expect(normalizeSubtitleText('{\\an8}Hello {name}')).toBe('Hello {name}');
  });

  it.each([
    ['<c.green>Green</c> <00:00:01.500>word', 'Green word'],
    ['Use <example> as a label', 'Use <example> as a label'],
    ['Leave <unfinished', 'Leave <unfinished'],
    ['Use &lt;i&gt; literally', 'Use <i> literally'],
  ])('normalizes text without interpreting it as HTML: %s', (value, expected) => {
    expect(normalizeSubtitleText(value)).toBe(expected);
  });

  it('escapes WebVTT syntax for native cue rendering', () => {
    expect(toPlainVttText('Use <tag> & keep it')).toBe('Use &lt;tag&gt; &amp; keep it');
    expect(toPlainVttText(' <i>literal</i>\n')).toBe(' &lt;i&gt;literal&lt;/i&gt;\n');
    expect(toPlainVttText('&lt;example&gt;')).toBe('&amp;lt;example&amp;gt;');
  });
});
