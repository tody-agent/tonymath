import { spawn } from 'child_process';
import path from 'path';

const ARTIFACT_DIR = '/Users/hailm/.gemini/antigravity-cli/brain/49f76fa9-5b72-4350-964a-bb3ee928e771';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';

const TEST_SCENARIOS = [
  { name: '01_home_nudge_pwa', query: '?view=home&welcomeNudge=true&pwaPrompt=true' },
  { name: '02_lesson_step0', query: '?view=lesson&step=0' },
  { name: '03_lesson_feedback_correct', query: '?view=lesson&step=1&feedback=correct' },
  { name: '04_lesson_feedback_wrong', query: '?view=lesson&step=1&feedback=wrong' },
  { name: '05_lesson_guide_modal', query: '?view=lesson&step=0&guide=look' },
  { name: '06_lesson_hint_confirm', query: '?view=lesson&step=0&hintConfirm=true' },
  { name: '07_progress_math_gate', query: '?view=progress&mathGate=true' },
  { name: '08_home_chest_modal', query: '?view=home&chest=true' },
  { name: '09_home_boss_modal', query: '?view=home&boss=true' },
  { name: '10_lesson_gameover', query: '?view=lesson&gameOver=true' },
  { name: '11_buddy_corner', query: '?view=buddy' },
  { name: '12_arena_60s', query: '?view=arena' },
  { name: '13_complete_screen', query: '?view=complete' },
  { name: '14_quests_page', query: '?view=quests' }
];

function captureOne(url, outFile, width, height, userAgent = null) {
  return new Promise((resolve) => {
    const args = [
      '--headless=new',
      `--screenshot=${path.join(ARTIFACT_DIR, outFile)}`,
      `--window-size=${width},${height}`,
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-extensions',
      '--disable-component-update',
      '--run-all-compositor-stages-before-draw',
      `--user-data-dir=/tmp/chrome-fast-${Math.random().toString(36).substring(7)}`
    ];
    if (userAgent) {
      args.push(`--user-agent=${userAgent}`);
    }
    args.push(url);

    const proc = spawn(CHROME_PATH, args);
    const timer = setTimeout(() => {
      proc.kill();
      console.error(`✗ Timeout ${outFile}`);
      resolve(false);
    }, 4000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        console.log(`✓ [${width}x${height}] ${outFile}`);
        resolve(true);
      } else {
        console.error(`✗ Code ${code} for ${outFile}`);
        resolve(false);
      }
    });
  });
}

async function run() {
  console.log('=== Capturing Visual Audit Screenshots ===\n');
  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';

  // Run in chunks of 4 concurrent
  const tasks = [];
  for (const s of TEST_SCENARIOS) {
    const url = `${BASE_URL}${s.query}`;
    tasks.push(() => captureOne(url, `audit_desktop_${s.name}.png`, 1280, 800));
    tasks.push(() => captureOne(url, `audit_mobile_${s.name}.png`, 390, 844, mobileUA));
  }

  for (let i = 0; i < tasks.length; i += 4) {
    const batch = tasks.slice(i, i + 4);
    await Promise.all(batch.map(fn => fn()));
  }

  console.log('\n=== Completed Visual Audit Capture ===');
}

run();
