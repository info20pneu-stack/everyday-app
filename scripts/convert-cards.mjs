// Converts every .png/.jpg in public/images/cards/ to .webp (900 px wide, quality 82)
// and deletes the originals. Run: npm run cards
import { readdir, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'cards');
await mkdir(dir, { recursive: true });

const files = (await readdir(dir)).filter(f => /\.(png|jpe?g)$/i.test(f));
if (files.length === 0) {
  console.log('No .png/.jpg files in public/images/cards/ — nothing to convert.');
  process.exit(0);
}

let failed = 0;
for (const file of files) {
  const src = path.join(dir, file);
  const out = path.join(dir, file.replace(/\.(png|jpe?g)$/i, '.webp'));
  try {
    const info = await sharp(src)
      .resize({ width: 900, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(out);
    await unlink(src);
    console.log(`✓ ${file} → ${path.basename(out)} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} kB)`);
  } catch (err) {
    failed++;
    console.error(`✗ ${file}: ${err.message} (original kept)`);
  }
}
console.log(`Done: ${files.length - failed} converted, ${failed} failed.`);
process.exit(failed ? 1 : 0);
