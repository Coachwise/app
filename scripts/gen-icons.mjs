// Rasterises brand/*.svg into every asset Android and the web need.
//
//   node scripts/gen-icons.mjs
//
// There is no rsvg/inkscape on the dev boxes, so this drives the Chromium that
// Playwright already downloaded for the e2e suite.

import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const brand = (f) => readFileSync(join(root, 'brand', f), 'utf8');
const res = (p) => join(root, 'android/app/src/main/res', p);

const AZURE = '#0097E6'; // --brand azure
const MARK = '#ffffff'; // white mark on the azure tile

const icon = brand('icon.svg');
// mark.svg is `currentColor` (one colour, set by whatever it sits on), so every
// job that uses it must say which colour — here it is always the yellow-on-navy
// pairing of the splash screens.
const mark = brand('mark.svg');
const foreground = brand('icon-foreground.svg');
// iOS masks the icon itself, so it needs the art square, not pre-rounded.
const iosIcon = icon.replace(/<rect[^>]*\/>/, '');

// Launcher icon: square + round (the round one is masked by the launcher, so it
// gets the same art on a full-bleed navy square).
const density = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

/** @type {{svg: string, out: string, w: number, h: number, bg?: string}[]} */
const jobs = [];

for (const [d, scale] of Object.entries(density)) {
  const px = Math.round(48 * scale);
  jobs.push({ svg: icon, out: res(`mipmap-${d}/ic_launcher.png`), w: px, h: px });
  jobs.push({ svg: icon, out: res(`mipmap-${d}/ic_launcher_round.png`), w: px, h: px });
  // Adaptive foreground is a 108dp canvas, transparent — the background layer
  // is @color/ic_launcher_background.
  const fg = Math.round(108 * scale);
  jobs.push({ svg: foreground, out: res(`mipmap-${d}/ic_launcher_foreground.png`), w: fg, h: fg });
}

// Splash: the mark, centred on navy, at ~26% of the short edge.
const splash = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [d, [w, h]] of Object.entries(splash)) {
  jobs.push({ svg: mark, out: res(`drawable-port-${d}/splash.png`), w, h, bg: AZURE, cover: 0.26 });
  jobs.push({ svg: mark, out: res(`drawable-land-${d}/splash.png`), w: h, h: w, bg: AZURE, cover: 0.26 });
}
jobs.push({ svg: mark, out: res('drawable/splash.png'), w: 480, h: 320, bg: AZURE, cover: 0.26 });

// iOS: one 1024 app icon (no rounding — the OS masks it) and three identical
// 2732² splashes (light / dark / any).
const ios = (p) => join(root, 'ios/App/App/Assets.xcassets', p);
jobs.push({ svg: iosIcon, out: ios('AppIcon.appiconset/AppIcon-512@2x.png'), w: 1024, h: 1024, bg: AZURE });
for (const n of ['', '-1', '-2']) {
  jobs.push({ svg: mark, out: ios(`Splash.imageset/splash-2732x2732${n}.png`), w: 2732, h: 2732, bg: AZURE, cover: 0.26 });
}

// Web
jobs.push({ svg: icon, out: join(root, 'public/apple-touch-icon.png'), w: 180, h: 180 });
jobs.push({ svg: icon, out: join(root, 'public/favicon-32.png'), w: 32, h: 32 });
jobs.push({ svg: icon, out: join(root, 'public/favicon-192.png'), w: 192, h: 192 });
jobs.push({ svg: icon, out: join(root, 'public/favicon-512.png'), w: 512, h: 512 });
writeFileSync(join(root, 'public/favicon.svg'), icon);

function findChromium() {
  const base = join(os.homedir(), '.cache', 'ms-playwright');
  const found = execSync(`find ${base} -name chrome -path '*/chrome-linux64/*' 2>/dev/null | head -1`, {
    encoding: 'utf8',
  }).trim();
  return found || undefined;
}

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();

for (const job of jobs) {
  mkdirSync(dirname(job.out), { recursive: true });

  // `cover` scales the art to a fraction of the short edge and centres it;
  // without it the svg fills the canvas.
  const size = job.cover
    ? `width:${Math.round(Math.min(job.w, job.h) * job.cover)}px;height:auto`
    : `width:${job.w}px;height:${job.h}px`;

  await page.setViewportSize({ width: job.w, height: job.h });
  await page.setContent(
    `<style>
       html,body{margin:0;padding:0;width:${job.w}px;height:${job.h}px;
         background:${job.bg ?? 'transparent'};
         color:${job.color ?? MARK};
         display:flex;align-items:center;justify-content:center}
       svg{${size};display:block}
     </style>${job.svg}`,
  );
  await page.screenshot({
    path: job.out,
    omitBackground: !job.bg,
    clip: { x: 0, y: 0, width: job.w, height: job.h },
  });
  console.log(`${job.w}×${job.h}  ${job.out.replace(root + '/', '')}`);
}

await browser.close();
