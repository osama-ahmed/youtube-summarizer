import { readdirSync, mkdirSync } from 'fs';
import { join, parse } from 'path';

const sharp = (await import('sharp')).default;

const srcDir = 'screenshots';
const outDir = 'screenshots/resized';
const W = 1280;
const H = 800;

mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir).filter(f => f.endsWith('.png'));

for (const file of files) {
  const img = sharp(join(srcDir, file));
  const meta = await img.metadata();

  const resizeOpts = meta.width > meta.height
    ? { width: W }
    : { height: H };

  const resized = await img
    .resize({ ...resizeOpts, withoutEnlargement: true })
    .removeAlpha()
    .toBuffer();

  const name = parse(file).name;

  await sharp({
    create: { width: W, height: H, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite([{
      input: resized,
      gravity: 'center',
    }])
    .jpeg({ quality: 90 })
    .toFile(join(outDir, `${name}.jpg`));

  console.log(`${file}: ${meta.width}x${meta.height} → ${W}x${H} JPEG`);
}

console.log(`\nDone. ${files.length} screenshots resized to ${outDir}/`);
