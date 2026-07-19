import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

const base = {
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
};

const entryPoints = [
  'src/popup/popup.ts',
  'src/options/options.ts',
  'src/onboarding/onboarding.ts',
  'src/service-worker.ts',
  'src/content-script.ts',
];

function ensureGaSecrets() {
  const target = 'src/ga-secrets.ts';
  if (!existsSync(target)) {
    const example = 'src/ga-secrets.example.ts';
    if (existsSync(example)) {
      copyFileSync(example, target);
      console.log('Created ga-secrets.ts from example (edit with real values)');
    }
  }
}

async function build() {
  const watch = process.argv.includes('--watch');
  const isProduction = process.env.NODE_ENV === 'production';
  ensureGaSecrets();
  await generateIcons();

  const ctx = await esbuild.context({
    ...base,
    entryPoints,
    minify: isProduction,
    sourcemap: !isProduction,
  });
  await ctx.rebuild();
  copyStatic();

  if (watch) {
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await ctx.dispose();
    console.log('Build complete -> dist/');
  }
}

async function generateIcons() {
  const { default: sharp } = await import('sharp');
  const sizes = [16, 48, 128];
  for (const size of sizes) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF1A1A"/>
      <stop offset="100%" stop-color="#CC0000"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#bg)"/>
  <path d="M50 36l46 28-46 28V36z" fill="white"/>
  <path d="M94 18l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#FFD700"/>
</svg>`;
    const buffer = Buffer.from(svg);
    await sharp(buffer).resize(size, size).png().toFile(`icons/icon${size}.png`);
  }
  console.log('Icons generated');
}

function copyStatic() {
  for (const file of ['static/popup/popup.html', 'static/options/options.html', 'static/onboarding/onboarding.html']) {
    const out = join('dist', file.replace('static/', ''));
    mkdirSync(dirname(out), { recursive: true });
    copyFileSync(file, out);
  }

  ['popup', 'options', 'onboarding'].forEach(dir => {
    const src = `src/${dir}/${dir}.css`;
    if (existsSync(src)) copyFileSync(src, `dist/${dir}/${dir}.css`);
  });

  mkdirSync('dist/icons', { recursive: true });

  writeFileSync('dist/manifest.json', JSON.stringify(JSON.parse(readFileSync('manifest.json', 'utf-8')), null, 2));
  copyFileSync('static/privacy.html', 'dist/privacy.html');
  copyFileSync('icons/icon16.png', 'dist/icons/icon16.png');
  copyFileSync('icons/icon48.png', 'dist/icons/icon48.png');
  copyFileSync('icons/icon128.png', 'dist/icons/icon128.png');
}

build().catch(err => { console.error(err); process.exit(1); });
