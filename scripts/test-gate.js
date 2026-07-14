#!/usr/bin/env node

/**
 * hoc-toan-vui - Automated release gate runner
 * Implements Safe Deploy Pipeline (Gates 0 to 6)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to print section headers
function printHeader(title) {
  console.log('\n==================================================');
  console.log(`🚀 ${title.toUpperCase()}`);
  console.log('==================================================');
}

// Helper to print success message
function printSuccess(msg) {
  console.log(`✅ [PASS] ${msg}`);
}

// Helper to print failure message and exit
function printFailure(msg) {
  console.error(`❌ [FAIL] ${msg}`);
  process.exit(1);
}

// --- GATE 0: SECRET HYGIENE ---
function runGate0() {
  printHeader('Gate 0: Secret Hygiene');
  
  const filesToScan = [];
  
  function walkDir(dir) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.wrangler') {
          walkDir(fullPath);
        }
      } else {
        if (['.js', '.jsx', '.json', '.env', '.html'].includes(path.extname(file))) {
          filesToScan.push(fullPath);
        }
      }
    }
  }

  walkDir(ROOT_DIR);

  // Secret patterns (e.g. API keys, secrets)
  const secretPatterns = [
    /api[-_]?key\s*=\s*['"`][a-zA-Z0-9_-]{10,}['"`]/i,
    /secret[-_]?key\s*=\s*['"`][a-zA-Z0-9_-]{10,}['"`]/i,
    /client[-_]?secret\s*=\s*['"`][a-zA-Z0-9_-]{10,}['"`]/i,
    /password\s*=\s*['"`][a-zA-Z0-9_-]{6,}['"`]/i,
    /AIza[0-9A-Za-z-_]{35}/, // Google API Key
  ];

  let secretsFound = 0;
  for (const file of filesToScan) {
    // Skip this gate runner script itself to avoid false positives on regex patterns
    if (file === __filename) continue;

    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        console.warn(`⚠️ Warning: Potential secret found in ${path.relative(ROOT_DIR, file)} matching pattern ${pattern}`);
        secretsFound++;
      }
    }
  }

  if (secretsFound > 0) {
    printFailure(`Found ${secretsFound} potential hardcoded secrets in the project!`);
  } else {
    printSuccess('No hardcoded secrets found.');
  }
}

// --- GATE 1: SYNTAX & LINT ---
function runGate1() {
  printHeader('Gate 1: Syntax & Lint Validation');
  try {
    console.log('Running linter (oxlint)...');
    execSync('npm run lint', { stdio: 'inherit', cwd: ROOT_DIR });
    printSuccess('Syntax and lint check passed.');
  } catch {
    printFailure('Linting failed. Please fix syntax errors before deploying.');
  }
}

// --- GATE 2: TEST SUITE (Logic + PWA + Mom Test) ---
function runGate2() {
  printHeader('Gate 2: Logic & Integrity Test Suite');

  // 1. Backend / Logic Unit Tests
  console.log('\n--- 1. Running Backend / Logic Unit Tests ---');
  try {
    execSync('node src/utils.test.js', { stdio: 'inherit', cwd: ROOT_DIR });
    printSuccess('Logic unit tests passed.');
  } catch {
    printFailure('Logic unit tests failed.');
  }

  // 2. PWA Integrity Check
  console.log('\n--- 2. Verifying PWA Manifest & Service Worker ---');
  const manifestPath = path.join(ROOT_DIR, 'public', 'manifest.json');
  const swPath = path.join(ROOT_DIR, 'public', 'sw.js');
  const mainPath = path.join(ROOT_DIR, 'src', 'main.jsx');

  if (!fs.existsSync(manifestPath)) {
    printFailure('manifest.json is missing in public directory.');
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.name || !manifest.short_name || !manifest.icons || !manifest.start_url) {
      printFailure('manifest.json is missing required fields (name, short_name, icons, start_url).');
    }
    printSuccess('manifest.json is present and valid.');
  } catch (e) {
    printFailure(`Failed to parse manifest.json: ${e.message}`);
  }

  if (!fs.existsSync(swPath)) {
    printFailure('sw.js is missing in public directory.');
  }
  const swContent = fs.readFileSync(swPath, 'utf8');
  if (!swContent.includes('install') || !swContent.includes('activate') || !swContent.includes('fetch')) {
    printFailure('sw.js must implement standard "install", "activate", and "fetch" event listeners.');
  }
  printSuccess('sw.js is present and has standard service worker listeners.');

  if (fs.existsSync(mainPath)) {
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    if (!mainContent.includes('navigator.serviceWorker')) {
      printFailure('src/main.jsx does not register the Service Worker.');
    }
    printSuccess('Service Worker registration script is present in src/main.jsx.');
  }

  // 3. Mom Test Audit
  console.log('\n--- 3. Running Automated Mom Test Audit ---');
  // Mom Test audit: ensure no leading question prompts or ratings solicitation in active user-facing UI code
  const onboardingPath = path.join(ROOT_DIR, 'src', 'App.jsx');
  if (fs.existsSync(onboardingPath)) {
    const appContent = fs.readFileSync(onboardingPath, 'utf8');
    
    // We search for patterns that violate Mom Test rules:
    // e.g. asking for ratings/opinions rather than observing actions or specifics
    const violations = [
      {
        pattern: /Bạn\s+có\s+thích\s+Học\s+Toán/i,
        reason: 'Leading opinion question asking kids if they like the app (violates Rule 1: talk about their life, not your idea)'
      },
      {
        pattern: /Đánh\s+giá\s+ứng\s+dụng/i,
        reason: 'Soliciting a general rating rather than observing actual engagement/completion facts (Rule 4: commitment and advancement)'
      },
      {
        pattern: /Bạn\s+thấy\s+thế\s+nào\s+về/i,
        reason: 'Asking for generic product feedback/opinions (Rule 3: opinions are fluff, look for concrete facts)'
      },
      {
        pattern: /Would\s+you\s+like/i,
        reason: 'Hypothetical future question (Rule 2: ask about past specifics, not future hypotheticals)'
      }
    ];

    let momTestViolationsCount = 0;
    for (const v of violations) {
      if (v.pattern.test(appContent)) {
        console.warn(`⚠️ [MOM TEST VIOLATION] Found pattern: ${v.pattern} in App.jsx. Reason: ${v.reason}`);
        momTestViolationsCount++;
      }
    }

    if (momTestViolationsCount > 0) {
      printFailure(`Failed Mom Test Audit: Found ${momTestViolationsCount} violations of customer-interview guidelines in UI copy.`);
    } else {
      printSuccess('Mom Test Audit passed. UI copy is clean of leading validation questions.');
    }
  }
}

// --- GATE 4-5: BUILD & DIST VERIFICATION ---
function runGate4_5() {
  printHeader('Gates 4 & 5: Build & Dist Verification');
  try {
    console.log('Compiling production bundle...');
    execSync('npm run build', { stdio: 'inherit', cwd: ROOT_DIR });
    printSuccess('Build compilation succeeded.');
    
    const distHtmlPath = path.join(ROOT_DIR, 'dist', 'index.html');
    if (!fs.existsSync(distHtmlPath)) {
      printFailure('Build generated successfully but dist/index.html is missing!');
    }
    
    const distList = fs.readdirSync(path.join(ROOT_DIR, 'dist'));
    if (distList.length === 0) {
      printFailure('dist/ directory is empty.');
    }
    
    printSuccess('Dist folder is verified and ready for deployment.');
  } catch (error) {
    printFailure(`Build compilation failed: ${error.message}`);
  }
}

// --- GATE 6: SMOKE TEST ---
function runGate6() {
  printHeader('Gate 6: Smoke Verification');
  const distHtmlPath = path.join(ROOT_DIR, 'dist', 'index.html');
  const htmlContent = fs.readFileSync(distHtmlPath, 'utf8');

  // Verify that compiled index.html has a script module tag
  if (!htmlContent.includes('<script') || !htmlContent.includes('type="module"')) {
    printFailure('Smoke test failed: dist/index.html does not contain valid module script tags.');
  }

  // Verify manifest link is present in index.html
  if (!htmlContent.includes('manifest.json') && !htmlContent.includes('rel="manifest"')) {
    console.warn('⚠️ Warning: manifest link not found in dist/index.html. Checking main source index.html...');
    const srcHtmlPath = path.join(ROOT_DIR, 'index.html');
    const srcHtmlContent = fs.readFileSync(srcHtmlPath, 'utf8');
    if (!srcHtmlContent.includes('manifest.json')) {
      printFailure('manifest.json is not linked in index.html.');
    }
  }

  printSuccess('Smoke test passed. Production assets are verified for execution.');
}

// --- MAIN RUNNER ---
function main() {
  console.log('🏁 Starting Gated Deploy Pipeline...');
  runGate0();
  runGate1();
  runGate2();
  runGate4_5();
  runGate6();
  console.log('\n🌟==================================================');
  console.log('🌟 [ALL GATES PASSED] Release is ready for deployment!');
  console.log('==================================================\n');
}

main();
