/**
 * Electron Main Process Build Configuration
 * This file compiles the Electron main process from TypeScript to JavaScript
 */

import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

const result = await esbuild.build({
  entryPoints: [path.join(__dirname, 'electron', 'main.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  external: ['electron'],
  outfile: path.join(__dirname, 'dist', 'electron-main.js'),
  minify: isProduction,
  sourcemap: !isProduction,
  loader: {
    '.node': 'file',
  },
});

if (!result.errors.length) {
  console.log('✓ Electron main process compiled successfully');
} else {
  console.error('✗ Failed to compile electron main process');
  process.exit(1);
}
