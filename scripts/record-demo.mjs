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
  const { width = 1280, height = 720, fps = 10, duration = 15000 } = options;
  const framesDir = path.join(TEMP_DIR, name);
  fs.mkdirSync(framesDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  await page.goto(options.url || BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2500);

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
  // Use stats_mode=full for better animation quality (not diff)
  execSync(
    `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame-%04d.png" -vf "fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=max_colors=256:stats_mode=full" "${palettePath}"`,
    { stdio: 'pipe' }
  );
  execSync(
    `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame-%04d.png" -i "${palettePath}" -lavfi "fps=${fps},scale=${width}:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=sierra2_4a" -loop 0 "${outputPath}"`,
    { stdio: 'pipe' }
  );

  fs.rmSync(framesDir, { recursive: true });
  fs.rmSync(palettePath, { force: true });

  const stats = fs.statSync(outputPath);
  console.log(`✓ ${name}.gif — ${(stats.size / 1024).toFixed(0)} KB`);
}

await recordScene('dashboard', async (page) => {
  // 1. Show full dashboard with data
  await page.waitForTimeout(1500);

  // 2. Scroll down to show memory cards, then back up
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(800);

  // 3. Click "World" filter
  try {
    const chips = await page.$$('.filter-chip');
    if (chips.length > 1) {
      await chips[1].click(); // World
      await page.waitForTimeout(1200);
      await chips[0].click(); // All - reset
      await page.waitForTimeout(600);
    }
  } catch(e) {}

  // 4. Type search and recall
  await page.click('.search-input');
  await page.waitForTimeout(200);
  await page.type('.search-input', 'AI tools', { delay: 60 });
  await page.waitForTimeout(300);
  await page.click('.search-btn');
  await page.waitForTimeout(1800);

  // 5. Clear search
  try {
    const clear = await page.$('.search-clear');
    if (clear) await clear.click();
  } catch(e) {}
  await page.waitForTimeout(600);

  // 6. Switch to Timeline tab
  try {
    const tabs = await page.$$('.view-tab');
    if (tabs.length >= 3) {
      await tabs[2].click(); // Timeline
      await page.waitForTimeout(1800);
    }
  } catch(e) {}

  // 7. Switch to Graph tab
  try {
    const tabs = await page.$$('.view-tab');
    if (tabs.length >= 2) {
      await tabs[1].click(); // Graph
      await page.waitForTimeout(2500);
    }
  } catch(e) {}

  // 8. Back to Stream
  try {
    const tabs = await page.$$('.view-tab');
    if (tabs.length >= 1) {
      await tabs[0].click(); // Stream
      await page.waitForTimeout(600);
    }
  } catch(e) {}

  // 9. Open Reflect panel
  try {
    const reflectBtn = await page.$('.btn-reflect');
    if (reflectBtn) {
      await reflectBtn.click();
      await page.waitForTimeout(1500);
      await reflectBtn.click(); // close
      await page.waitForTimeout(500);
    }
  } catch(e) {}

  // 10. Click the FAB button to show retain modal, then close
  try {
    const fab = await page.$('.fab-btn');
    if (fab) {
      await fab.click();
      await page.waitForTimeout(1200);
      // Close modal (click overlay or cancel)
      const cancel = await page.$('.retain-modal .modal-btn.cancel');
      if (cancel) await cancel.click();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  } catch(e) {}

  await page.waitForTimeout(500);
}, {
  url: BASE_URL,
  width: 1280,
  height: 720,
  fps: 10,
  duration: 15000,
});

fs.rmSync(TEMP_DIR, { recursive: true, force: true });
console.log('Done!');
