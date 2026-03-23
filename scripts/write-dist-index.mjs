/**
 * After webpack, write dist/index.html — same shell as root index.html but loads
 * /dist/bundle.js so async chunks resolve with publicPath /dist/.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcIndex = path.join(root, 'index.html');
const outFile = path.join(root, 'dist', 'index.html');

const html = fs.readFileSync(srcIndex, 'utf8');
const replaced = html.replace(
  /<script src="\/src\/app\.js[^"]*"[^>]*><\/script>\s*/i,
  '  <script src="/dist/bundle.js" defer></script>\n'
);

if (replaced === html) {
  console.warn(
    'write-dist-index: no /src/app.js script tag matched; dist/index.html not updated.'
  );
  process.exitCode = 1;
} else {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, replaced, 'utf8');
  console.log('Wrote dist/index.html (Webpack bundle entry; chunks under /dist/).');
}
