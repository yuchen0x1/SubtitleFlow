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

  it('parses SRT and exports UTF-8 VTT text', () => {
    const cues = parseSubtitleFile(
      '1\r\n00:00:00,250 --> 00:00:01,750\r\n你好\r\n',
      'srt',
    );

    expect(cues[0].originalText).toBe('你好');
    expect(exportVtt(cues)).toContain('00:00:00.250 --> 00:00:01.750');
  });
});
