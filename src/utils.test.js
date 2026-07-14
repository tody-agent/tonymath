import { isUnlocked, resolveSpeechRate } from './utils.js';
import assert from 'assert';

const mockLessons = [
  { id: 'lesson-1' },
  { id: 'lesson-2' },
  { id: 'lesson-3' }
];

console.log('Running tests for isUnlocked...');

// Test 1: Lesson 1 (index 0) should always be unlocked
try {
  assert.strictEqual(isUnlocked(0, {}, mockLessons, false), true);
  console.log('✅ Test 1 Passed: Lesson 1 is always unlocked');
} catch (e) {
  console.error('❌ Test 1 Failed:', e.message);
  process.exit(1);
}

// Test 2: Lesson 2 (index 1) should be locked if Lesson 1 is not completed
try {
  assert.strictEqual(isUnlocked(1, {}, mockLessons, false), false);
  console.log('✅ Test 2 Passed: Lesson 2 is locked when Lesson 1 is incomplete');
} catch (e) {
  console.error('❌ Test 2 Failed:', e.message);
  process.exit(1);
}

// Test 3: Lesson 2 (index 1) should be unlocked if Lesson 1 is completed
try {
  const progressCompleted = { 'lesson-1': { stars: 3 } };
  assert.strictEqual(isUnlocked(1, progressCompleted, mockLessons, false), true);
  console.log('✅ Test 3 Passed: Lesson 2 is unlocked when Lesson 1 is completed');
} catch (e) {
  console.error('❌ Test 3 Failed:', e.message);
  process.exit(1);
}

// Test 4: DevMode should unlock lessons even if they are not completed
try {
  assert.strictEqual(isUnlocked(2, {}, mockLessons, true), true);
  console.log('✅ Test 4 Passed: DevMode unlocks locked lessons');
} catch (e) {
  console.error('❌ Test 4 Failed:', e.message);
  process.exit(1);
}

console.log('Running tests for resolveSpeechRate...');

// Test 5: resolveSpeechRate('slow') should return 0.75
try {
  assert.strictEqual(resolveSpeechRate('slow'), 0.75);
  console.log('✅ Test 5 Passed: slow rate resolved');
} catch (e) {
  console.error('❌ Test 5 Failed:', e.message);
  process.exit(1);
}

// Test 6: resolveSpeechRate('normal') should return 0.95
try {
  assert.strictEqual(resolveSpeechRate('normal'), 0.95);
  console.log('✅ Test 6 Passed: normal rate resolved');
} catch (e) {
  console.error('❌ Test 6 Failed:', e.message);
  process.exit(1);
}

// Test 7: resolveSpeechRate('fast') should return 1.15
try {
  assert.strictEqual(resolveSpeechRate('fast'), 1.15);
  console.log('✅ Test 7 Passed: fast rate resolved');
} catch (e) {
  console.error('❌ Test 7 Failed:', e.message);
  process.exit(1);
}

// Test 8: resolveSpeechRate(invalid) should return default 0.95
try {
  assert.strictEqual(resolveSpeechRate('invalid'), 0.95);
  console.log('✅ Test 8 Passed: invalid rate fallback resolved');
} catch (e) {
  console.error('❌ Test 8 Failed:', e.message);
  process.exit(1);
}

console.log('🎉 All tests passed successfully!');

