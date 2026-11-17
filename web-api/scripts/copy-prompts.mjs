// tsc emits only JS, so the prompt markdown has to be copied into the build
// output itself — `outDir` is the repo root `dist`, not `web-api/dist`.
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(workspace, 'src');
const to = join(workspace, '..', 'dist');

let copied = 0;

for (const entry of readdirSync(from, { recursive: true })) {
  if (typeof entry !== 'string' || !entry.endsWith('.md')) continue;

  const target = join(to, entry);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(from, entry), target);
  copied += 1;
}

console.log(`copied ${copied} prompt file(s) into dist`);
