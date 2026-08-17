import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/hailm/.gemini/antigravity-cli/brain/49f76fa9-5b72-4350-964a-bb3ee928e771';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url) {
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

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }

  async setViewport(width, height, isMobile = false) {
    try {
      await this.send('Emulation.setDeviceMetricsOverride', {
        width: Math.floor(width),
        height: Math.floor(height),
        deviceScaleFactor: 1,
        mobile: isMobile
      });
    } catch (e) {
      console.warn('Viewport override warning:', e.message || e);
    }
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', quality: 90 });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${filename}`);
    return outPath;
  }
}

async function run() {
  console.log('Starting Chrome headless with remote debugging...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-tonymath-test',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const pages = await fetchJson(`http://127.0.0.1:${PORT}/json`);
    const pageWsUrl = pages[0]?.webSocketDebuggerUrl;
    if (!pageWsUrl) throw new Error('No webSocketDebuggerUrl found');

    const client = new CDPClient(pageWsUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    console.log('Connected to Chrome via CDP.');

    const initialProgress = {
      completed: {
        'grade-4_math_lesson-0': { stars: 3, timeSpent: 45, date: new Date().toISOString() }
      },
      attempts: { 'grade-4_math_lesson-0': 1 },
      weakSkills: {},
      xp: 240,
      streak: 5,
      lastStudyDate: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      currentLesson: 0,
      onboarded: true,
      challengeMode: false,
      studyMode: 'full',
      profile: { name: 'Bảo Minh', mascot: 'owl' },
      reminderTime: '19:00',
      notificationsEnabled: false,
      welcomeNudgeDismissedOn: null,
      stepFailsSession: {},
      unlockedAchievements: { 'streak-3': true }
    };

    // 1. Audit Desktop
    await client.setViewport(1280, 800, false);
    await client.send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(1000);

    // Set localStorage
    await client.eval(`
      localStorage.setItem('tonymath-progress-v1', JSON.stringify(${JSON.stringify(initialProgress)}));
      localStorage.setItem('tonymath-student-name', 'Bảo Minh');
      location.reload();
    `);
    await sleep(1000);

    // Home Desktop
    await client.screenshot('audit_01_home_desktop.png');

    // Lesson Step 0 Desktop
    await client.eval(`
      const btn = document.querySelector('.hero-action-btn') || document.querySelector('.start-lesson-btn') || document.querySelector('.path-node.current');
      if (btn) btn.click();
    `);
    await sleep(800);
    await client.screenshot('audit_02_lesson_intro_desktop.png');

    // Click start inside intro
    await client.eval(`
      const btn = document.querySelector('.intro-start-btn') || document.querySelector('.hero-primary-btn');
      if (btn) btn.click();
    `);
    await sleep(800);
    await client.screenshot('audit_03_lesson_step0_desktop.png');

    // Test Guide Modal (Click step indicator)
    await client.eval(`
      const indicator = document.querySelector('.step-pill') || document.querySelector('.step-dot') || document.querySelector('.step-item');
      if (indicator) indicator.click();
    `);
    await sleep(500);
    await client.screenshot('audit_04_guide_modal_desktop.png');

    // Close guide modal
    await client.eval(`
      const overlay = document.querySelector('.guide-modal-overlay') || document.querySelector('.guide-close-btn');
      if (overlay) overlay.click();
    `);
    await sleep(300);

    // Click Hint button to show Hint Confirm Modal
    await client.eval(`
      const hintBtn = document.querySelector('.hint-button') || document.querySelector('.hint-btn');
      if (hintBtn) hintBtn.click();
    `);
    await sleep(500);
    await client.screenshot('audit_05_hint_confirm_desktop.png');

    // Close hint modal
    await client.eval(`
      const cancelBtn = document.querySelector('.btn-cancel');
      if (cancelBtn) cancelBtn.click();
    `);
    await sleep(300);

    // Trigger Correct Feedback Banner
    await client.eval(`
      const opt = document.querySelector('.story-question-card') || document.querySelector('.option-card') || document.querySelector('.step-option-btn');
      if (opt) opt.click();
      const submit = document.querySelector('.footer-submit');
      if (submit) submit.click();
    `);
    await sleep(500);
    await client.screenshot('audit_06_feedback_correct_desktop.png');

    // Now switch to Mobile Viewport (390x844)
    console.log('Testing Mobile Viewport (390x844)...');
    await client.setViewport(390, 844, true);
    await sleep(500);

    // Home Mobile
    await client.send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(1000);
    await client.screenshot('audit_07_home_mobile.png');

    // Lesson Step on Mobile
    await client.eval(`
      const btn = document.querySelector('.hero-action-btn') || document.querySelector('.path-node.current') || document.querySelector('.lesson-node');
      if (btn) btn.click();
    `);
    await sleep(800);
    await client.eval(`
      const btn = document.querySelector('.intro-start-btn') || document.querySelector('.hero-primary-btn');
      if (btn) btn.click();
    `);
    await sleep(800);
    await client.screenshot('audit_08_lesson_mobile.png');

    // Trigger Feedback Banner on Mobile
    await client.eval(`
      const opt = document.querySelector('.story-question-card') || document.querySelector('.option-card') || document.querySelector('.step-option-btn') || document.querySelector('.step-action-btn');
      if (opt) opt.click();
      const submit = document.querySelector('.footer-submit');
      if (submit) submit.click();
    `);
    await sleep(600);
    await client.screenshot('audit_09_feedback_mobile.png');

    // Guide Modal on Mobile
    await client.eval(`
      const indicator = document.querySelector('.step-pill') || document.querySelector('.step-dot') || document.querySelector('.step-indicator-bubble');
      if (indicator) indicator.click();
    `);
    await sleep(600);
    await client.screenshot('audit_10_guide_modal_mobile.png');

    // Parent Zone / Math Gate on Mobile
    await client.eval(`
      const close = document.querySelector('.guide-modal-overlay');
      if (close) close.click();
    `);
    await sleep(300);
    await client.send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(800);
    await client.eval(`
      const profNav = Array.from(document.querySelectorAll('.tabbar button, .nav-btn')).find(b => b.textContent.includes('Hồ sơ'));
      if (profNav) profNav.click();
    `);
    await sleep(600);
    await client.screenshot('audit_11_profile_mobile.png');

    // Click Parent Zone to open Math Gate Modal
    await client.eval(`
      const parentTab = Array.from(document.querySelectorAll('.profile-tab-btn, button')).find(b => b.textContent.includes('Phụ huynh'));
      if (parentTab) parentTab.click();
    `);
    await sleep(600);
    await client.screenshot('audit_12_math_gate_mobile.png');

    console.log('All audit screenshots completed successfully!');
  } catch (err) {
    console.error('Audit script error:', err);
  } finally {
    chromeProcess.kill();
  }
}

run();
