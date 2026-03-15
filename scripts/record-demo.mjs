import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Clear proxy env vars
for (const k of ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy']) {
  delete process.env[k];
}

const BASE_URL = 'http://127.0.0.1:9999';
const OUTPUT_DIR = 'D:/pythonPycharms/MemoMind/docs/demos';
const TEMP_DIR = 'D:/pythonPycharms/MemoMind/tmp-frames';

async function recordScene(name, actions, options = {}) {
  const { width = 1280, height = 720, fps = 8, duration = 10000 } = options;
  const framesDir = path.join(TEMP_DIR, name);
  fs.mkdirSync(framesDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  await page.goto(options.url || BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
  // Wait for API data to load (memories, stats)
  await page.waitForTimeout(3000);

  await actions(page);

  // Capture frames
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

await recordScene('dashboard', async (page) => {
  // 1. Show the dashboard with real data loaded (metrics, memory cards)
  await page.waitForTimeout(2000);

  // 2. Hover over metric cards
  const metrics = await page.$$('.metric');
  for (const metric of metrics) {
    await metric.hover();
    await page.waitForTimeout(500);
  }
  await page.mouse.move(640, 400);
  await page.waitForTimeout(400);

  // 3. Scroll down to show memory cards if there are any
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }));
  await page.waitForTimeout(800);

  // 4. Hover over a memory card to show hover effects + delete button
  const card = await page.$('.memory-card');
  if (card) {
    await card.hover();
    await page.waitForTimeout(800);
  }
  await page.mouse.move(640, 300);
  await page.waitForTimeout(300);

  // 5. Scroll back up
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(600);

  // 6. Type a search query
  await page.click('.search-input');
  await page.waitForTimeout(200);
  await page.type('.search-input', 'user preferences', { delay: 70 });
  await page.waitForTimeout(500);

  // 7. Click Recall button to search
  await page.click('.search-btn');
  await page.waitForTimeout(2000);

  // 8. Clear search
  await page.fill('.search-input', '');
  await page.waitForTimeout(300);

  // 9. Switch to Graph tab
  const graphTab = await page.$('.view-tab:nth-child(2)');
  if (graphTab) {
    await graphTab.click();
    await page.waitForTimeout(2500);
  }

  // 10. Switch back to Stream
  const streamTab = await page.$('.view-tab:nth-child(1)');
  if (streamTab) {
    await streamTab.click();
    await page.waitForTimeout(1000);
  }
}, {
  url: BASE_URL,
  width: 1280,
  height: 720,
  fps: 8,
  duration: 10000,
});

fs.rmSync(TEMP_DIR, { recursive: true, force: true });
console.log('Done!');
