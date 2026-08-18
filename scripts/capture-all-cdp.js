import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/hailm/.gemini/antigravity-cli/brain/49f76fa9-5b72-4350-964a-bb3ee928e771';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9223;
const BASE_URL = 'http://localhost:5173';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile
    }).catch(() => {});
  }

  async capture(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`✓ Saved: ${filename}`);
  }
}

const TEST_SCENARIOS = [
  { name: '01_home_nudge_pwa', query: '?view=home&welcomeNudge=true&pwaPrompt=true' },
  { name: '02_lesson_step0', query: '?view=lesson&step=0' },
  { name: '03_lesson_feedback_correct', query: '?view=lesson&step=1&feedback=correct' },
  { name: '04_lesson_feedback_wrong', query: '?view=lesson&step=1&feedback=wrong' },
  { name: '05_lesson_guide_modal', query: '?view=lesson&step=0&guide=level' },
  { name: '06_lesson_hint_confirm', query: '?view=lesson&step=0&hintConfirm=true' },
  { name: '07_progress_math_gate', query: '?view=progress&mathGate=true' },
  { name: '08_home_chest_modal', query: '?view=home&chest=true' },
  { name: '09_home_boss_modal', query: '?view=home&boss=true' },
  { name: '10_lesson_gameover', query: '?view=lesson&gameOver=true' },
  { name: '11_buddy_corner', query: '?view=buddy' },
  { name: '12_arena_60s', query: '?view=arena' },
  { name: '13_complete_screen', query: '?view=complete' },
  { name: '14_quests_page', query: '?view=quests' },
  { name: '15_app_toast', query: '?view=home&toast=Chúc+mừng!+Con+đã+hoàn+thành+nhiệm+vụ+🎉' }
];

async function run() {
  console.log('Starting headless Chrome for CDP capture...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,800',
    `--user-data-dir=/tmp/chrome-cdp-${Date.now()}`,
    'about:blank'
  ]);

  let pages = null;
  for (let i = 0; i < 15; i++) {
    await sleep(300);
    try {
      pages = await fetchJson(`http://127.0.0.1:${PORT}/json`);
      if (pages && pages.length > 0) break;
    } catch {
      // retry
    }
  }

  try {
    if (!pages) throw new Error('Could not connect to Chrome CDP after retries');
    const page = pages.find(p => p.type === 'page') || pages[0];
    if (!page?.webSocketDebuggerUrl) throw new Error('No page WebSocket URL');

    const client = new CDPClient(page.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('DOM.enable');

    console.log('=== Capturing Desktop (1280x800) Screenshots ===');
    await client.setViewport(1280, 800, false);

    for (const s of TEST_SCENARIOS) {
      await client.send('Page.navigate', { url: `${BASE_URL}${s.query}` });
      await sleep(700);
      await client.capture(`audit_desktop_${s.name}.png`);
    }

    console.log('\n=== Capturing Mobile (390x844) Screenshots ===');
    await client.setViewport(390, 844, true);

    for (const s of TEST_SCENARIOS) {
      await client.send('Page.navigate', { url: `${BASE_URL}${s.query}` });
      await sleep(700);
      await client.capture(`audit_mobile_${s.name}.png`);
    }

    console.log('\n=== All 30 Screenshots Captured Successfully! ===');
  } catch (err) {
    console.error('CDP Capture error:', err);
  } finally {
    chromeProcess.kill();
  }
}

run();
