import { build } from 'esbuild';
import { rmSync, mkdirSync, copyFileSync } from 'fs';
import path from 'path';

const outdir = path.resolve('dist');

rmSync(outdir, { recursive: true, force: true });
mkdirSync(path.join(outdir, 'public'), { recursive: true });

await build({
  entryPoints: ['ui/public/app.js'],
  outfile: path.join(outdir, 'public', 'app.js'),
  bundle: true,
  minify: true,
});

await build({
  entryPoints: ['ui/public/styles.css'],
  outfile: path.join(outdir, 'public', 'styles.css'),
  loader: { '.css': 'css' },
  minify: true,
});

copyFileSync('ui/public/index.html', path.join(outdir, 'public', 'index.html'));
