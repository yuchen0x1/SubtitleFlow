import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'vite';

const root = process.cwd();
const dist = join(root, 'dist');
// Chrome loads manifest content_scripts as classic scripts; bundle dependencies inline.
await build({
  configFile: false,
  build: {
    outDir: dist,
    emptyOutDir: false,
    sourcemap: true,
    lib: { entry: join(root, 'apps/extension/src/content/index.ts'), name: 'SubtitleFlowContent', formats: ['iife'], fileName: () => 'content.js' },
  },
});
const sourceDir = join(dist, 'apps', 'extension', 'src');
await mkdir(dist, { recursive: true });
for (const name of ['popup', 'options', 'offscreen']) {
  await copyFile(join(sourceDir, name, 'index.html'), join(dist, `${name}.html`));
}
const manifestPath = join(dist, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.action.default_popup = 'popup.html';
manifest.options_page = 'options.html';
manifest.web_accessible_resources = [{ resources: ['offscreen.html'], matches: ['<all_urls>'] }];
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('Prepared loadable extension in dist/');
