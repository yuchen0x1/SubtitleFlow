import { describe, expect, it } from 'vitest';
import { exportSrt, exportVtt } from '../../apps/extension/src/shared/subtitle/export';
import { parseSubtitleFile } from '../../apps/extension/src/shared/subtitle/parser';

describe('subtitle parser and exporter', () => {
  it('parses VTT cues and exports valid SRT', () => {
    const cues = parseSubtitleFile(
      'WEBVTT\n\n00:00:01.000 --> 00:00:03.500\nHello <i>world</i>\n',
      'vtt',
    );

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({ startTime: 1, endTime: 3.5, originalText: 'Hello world' });
    expect(exportSrt(cues)).toContain('00:00:01,000 --> 00:00:03,500');
  });

  it('normalizes subtitle formatting while preserving literal text', () => {
    const [cue] = parseSubtitleFile(
      'WEBVTT\n\n00:00:01.000 --> 00:00:03.500\n<c.green>Hello</c> &amp; 2 < 3 and 4 > 1; &lt;example&gt; <unfinished\n',
      'vtt',
    );
    expect(cue.originalText).toBe('Hello & 2 < 3 and 4 > 1; <example> <unfinished');
  });

  it('keeps entity decoding single-pass', () => {
    const [cue] = parseSubtitleFile('1\n00:00:01,000 --> 00:00:02,000\n&amp;lt;i&amp;gt;\n', 'srt');
    expect(cue.originalText).toBe('&lt;i&gt;');
  });

  it('preserves literal cue text through VTT export and re-import', () => {
    const [cue] = parseSubtitleFile('1\n00:00:01,000 --> 00:00:02,000\nUse &lt;i&gt; &amp; &lt;example&gt;\n', 'srt');
    const exported = exportVtt([cue]);
    expect(exported).toContain('Use &lt;i&gt; &amp; &lt;example&gt;');
    expect(parseSubtitleFile(exported, 'vtt')[0].originalText).toBe(cue.originalText);
  });

  it('parses SRT and exports UTF-8 VTT text', () => {
    const cues = parseSubtitleFile(
      '1\r\n00:00:00,250 --> 00:00:01,750\r\n你好\r\n',
      'srt',
    );

    expect(cues[0].originalText).toBe('你好');
    expect(exportVtt(cues)).toContain('00:00:00.250 --> 00:00:01.750');
  });
});
