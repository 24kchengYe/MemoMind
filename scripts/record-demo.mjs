import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

for (const k of ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy']) {
  delete process.env[k];
}

const BASE_URL = 'http://127.0.0.1:9999';
const OUTPUT_DIR = 'D:/pythonPycharms/MemoMind/docs/demos';
const TEMP_DIR = 'D:/pythonPycharms/MemoMind/tmp-frames';

async function recordScene(name, actions, options = {}) {
  const { width = 1280, height = 720, fps = 8, duration = 12000 } = options;
  const framesDir = path.join(TEMP_DIR, name);
  fs.mkdirSync(framesDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  await page.goto(options.url || BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);

  await actions(page);

  const totalFrames = Math.ceil((duration / 1000) * fps);
  const interval = 1000 / fps;
  for (let i = 0; i < totalFrames; i++) {
    await page.screenshot({
      path: path.join(framesDir, `frame-${String(i).padStart(4, '0')}.png`),
    });
    await page.waitForTimeout(interval);
  }

  await browser.close();

  const outputPath = path.join(OUTPUT_DIR, `${name}.gif`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const palettePath = path.join(TEMP_DIR, `${name}-palette.png`);
  execSync(
    `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame-%04d.png" -vf "fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff" "${palettePath}"`,
    { stdio: 'pipe' }
  );
  execSync(
    `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame-%04d.png" -i "${palettePath}" -lavfi "fps=${fps},scale=${width}:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" -loop 0 "${outputPath}"`,
    { stdio: 'pipe' }
  );

  fs.rmSync(framesDir, { recursive: true });
  fs.rmSync(palettePath, { force: true });

  const stats = fs.statSync(outputPath);
  console.log(`✓ ${name}.gif — ${(stats.size / 1024).toFixed(0)} KB`);
}

// Main demo: show all new features
await recordScene('dashboard', async (page) => {
  // 1. Show dashboard with data loaded (metrics, filters, tabs)
  await page.waitForTimeout(1500);

  // 2. Hover metric cards
  const metrics = await page.$$('.metric');
  for (const m of metrics.slice(0, 3)) {
    await m.hover();
    await page.waitForTimeout(400);
  }
  await page.mouse.move(640, 300);
  await page.waitForTimeout(300);

  // 3. Click a type filter chip (e.g., "World")
  const worldChip = await page.$('.filter-chip:nth-child(2)');
  if (worldChip) {
    await worldChip.click();
    await page.waitForTimeout(1000);
  }

  // 4. Click "All" to reset
  const allChip = await page.$('.filter-chip:nth-child(1)');
  if (allChip) {
    await allChip.click();
    await page.waitForTimeout(500);
  }

  // 5. Type a search
  const searchInput = await page.$('.search-input');
  if (searchInput) {
    await searchInput.click();
    await page.waitForTimeout(200);
    await page.type('.search-input', '张业成', { delay: 80 });
    await page.waitForTimeout(300);
    await page.click('.search-btn');
    await page.waitForTimeout(1500);
  }

  // 6. Clear search
  const clearBtn = await page.$('.search-clear');
  if (clearBtn) {
    await clearBtn.click();
    await page.waitForTimeout(500);
  }

  // 7. Click Timeline tab
  const timelineTab = await page.$('.view-tab:nth-child(3)');
  if (timelineTab) {
    await timelineTab.click();
    await page.waitForTimeout(1500);
  }

  // 8. Click Graph tab
  const graphTab = await page.$('.view-tab:nth-child(2)');
  if (graphTab) {
    await graphTab.click();
    await page.waitForTimeout(2000);
  }

  // 9. Back to Stream
  const streamTab = await page.$('.view-tab:nth-child(1)');
  if (streamTab) {
    await streamTab.click();
    await page.waitForTimeout(500);
  }

  // 10. Show the Reflect panel briefly
  const reflectBtn = await page.$('.btn-reflect');
  if (reflectBtn) {
    await reflectBtn.click();
    await page.waitForTimeout(1500);
    // Close it
    await reflectBtn.click();
    await page.waitForTimeout(500);
  }

  // 11. Hover a memory card to show actions
  const card = await page.$('.memory-card');
  if (card) {
    await card.hover();
    await page.waitForTimeout(800);
  }

  await page.mouse.move(640, 400);
  await page.waitForTimeout(500);
}, {
  url: BASE_URL,
  width: 1280,
  height: 720,
  fps: 8,
  duration: 12000,
});

fs.rmSync(TEMP_DIR, { recursive: true, force: true });
console.log('Done!');
