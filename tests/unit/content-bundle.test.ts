// This regression test checks the shipped artifact, not a hand-written substitute.
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';

describe('MV3 content-script bundle', () => {
  it('is executable as a classic script without module imports', () => {
    const source = readFileSync('dist/content.js', 'utf8');
    expect(() => new Script(source)).not.toThrow();
  });
});
