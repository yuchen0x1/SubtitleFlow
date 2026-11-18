import { rename } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'vite';

const root = process.cwd();
const dist = join(root, 'dist');
// Chrome loads manifest content_scripts as classic scripts; bundle dependencies inline.
await build({
  configFile: false,
  build: {
    target: 'chrome116',
    outDir: dist,
    emptyOutDir: false,
    lib: { entry: join(root, 'apps/extension/src/content/index.ts'), name: 'SubtitleFlowContent', formats: ['iife'], fileName: () => 'content.js' },
  },
});
const sourceDir = join(dist, 'apps', 'extension', 'src');
for (const name of ['popup', 'options', 'offscreen']) {
  await rename(join(sourceDir, name, 'index.html'), join(dist, `${name}.html`));
}
console.log('Prepared loadable extension in dist/');
