import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
// asset-sources holds the SVG an image was authored from. The reader only ever
// gets the committed raster, so the sources stay out of the build.
const skip = new Set(['.git', 'node_modules', 'dist', 'public', '.astro', 'asset-sources']);
const copyNames = [
  'index.html',
  'index-zh.html',
  'index-ja.html',
  'index-ko.html',
  'enterprise.html',
  'enterprise-thanks.html',
  'marketing',
  'CNAME',
  '.nojekyll',
  'robots.txt',
  'sitemap.xml',
  'blog',
  'family_health',
  'legal_sme',
];

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function migratedBlogHtmlNames() {
  const contentRoot = path.join(root, 'src/content/writings');
  const names = new Set();
  if (!fs.existsSync(contentRoot)) return names;
  for (const lang of fs.readdirSync(contentRoot)) {
    const dir = path.join(contentRoot, lang);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const slug = path.basename(file, '.md');
      const suffix = lang === 'en' ? '' : `-${lang}`;
      names.add(`${slug}${suffix}.html`);
    }
  }
  return names;
}

const migratedBlogHtml = migratedBlogHtmlNames();

function shouldSkip(src, name) {
  if (skip.has(name)) return true;
  const rel = path.relative(root, src).replaceAll(path.sep, '/');
  return rel.startsWith('blog/') && migratedBlogHtml.has(name);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      const child = path.join(src, name);
      if (shouldSkip(child, name)) continue;
      copyRecursive(child, path.join(dest, name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

rmrf(publicDir);
fs.mkdirSync(publicDir, { recursive: true });

for (const name of copyNames) {
  const src = path.join(root, name);
  if (!fs.existsSync(src)) continue;
  copyRecursive(src, path.join(publicDir, name));
}

console.log(`Synced legacy static assets into ${path.relative(root, publicDir)}/; skipped ${migratedBlogHtml.size} migrated blog HTML files.`);
