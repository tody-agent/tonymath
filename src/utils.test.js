import { isUnlocked, resolveSpeechRate, generateIcsContent, isChallengeModeActive, getActiveProgress, applyLessonResult, getLearningPlan, getRecentlyStudiedLesson, getUnlockedAchievementIds } from './utils.js';
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

// Test 2: Lesson 2 (index 1) should be unlocked even if Lesson 1 is not completed (Free browse policy)
try {
  assert.strictEqual(isUnlocked(1, {}, mockLessons, false), true);
  console.log('✅ Test 2 Passed: Lesson 2 is unlocked when Lesson 1 is incomplete (Free browse)');
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

console.log('Running tests for generateIcsContent...');

// Test 9: generateIcsContent should produce valid daily ICS event
try {
  const result = generateIcsContent('19:30', 1783987200000); // fixed timestamp
  assert.ok(result.includes('BEGIN:VCALENDAR'));
  assert.ok(result.includes('DTSTART;TZID=Asia/Ho_Chi_Minh'));
  assert.ok(result.includes('193000'));
  assert.ok(result.includes('FREQ=DAILY'));
  console.log('✅ Test 9 Passed: generateIcsContent generates valid daily alarm ICS content');
} catch (e) {
  console.error('❌ Test 9 Failed:', e.message);
  process.exit(1);
}

console.log('Running tests for isChallengeModeActive...');

// Test 10: isChallengeModeActive should return true if challengeMode in progress is true, or lesson difficulty is 'hard'
try {
  // Scenario 1: both false
  assert.strictEqual(isChallengeModeActive({ challengeMode: false }, { difficulty: 'easy' }), false);
  // Scenario 2: progress challengeMode is true
  assert.strictEqual(isChallengeModeActive({ challengeMode: true }, { difficulty: 'easy' }), true);
  // Scenario 3: lesson difficulty is hard
  assert.strictEqual(isChallengeModeActive({ challengeMode: false }, { difficulty: 'hard' }), true);
  // Scenario 4: undefined inputs fallback to false
  assert.strictEqual(isChallengeModeActive(null, null), false);
  console.log('✅ Test 10 Passed: isChallengeModeActive works for all scenarios');
} catch (e) {
  console.error('❌ Test 10 Failed:', e.message);
  process.exit(1);
}

console.log('Running tests for getActiveProgress and dynamic prefixes...');

try {
  // Test 11: applyLessonResult should store with grade/subject prefix
  let progress = { completed: {}, attempts: {} };
  progress = applyLessonResult(progress, { lessonId: 'lesson-1', skill: 'Thêm vào', stars: 3, mistakes: 0 }, 'grade-4', 'math');
  assert.ok(progress.completed['grade-4_math_lesson-1']);
  assert.strictEqual(progress.completed['grade-4_math_lesson-1'].stars, 3);
  console.log('✅ Test 11 Passed: applyLessonResult prefixes keys correctly');

  // Test 12: getActiveProgress should filter by active prefix and strip it for calculations
  const activeProg = getActiveProgress(progress, 'grade-4', 'math');
  assert.ok(activeProg.completed['lesson-1']);
  assert.strictEqual(activeProg.completed['lesson-1'].stars, 3);
  
  const emptyProg = getActiveProgress(progress, 'grade-3', 'math');
  assert.strictEqual(Object.keys(emptyProg.completed).length, 0);
  console.log('✅ Test 12 Passed: getActiveProgress filters and strips prefixes correctly');
} catch (e) {
  console.error('❌ Prefixed progress tests failed:', e.message);
  process.exit(1);
}

import { getMascotSpeech, MASCOT_PROFILES } from './mascotDialogs.js';

console.log('Running tests for mascotDialogs...');

// Test 13: MASCOT_PROFILES configurations should be valid
try {
  assert.strictEqual(MASCOT_PROFILES.owl.pitch, 1.0);
  assert.strictEqual(MASCOT_PROFILES.robot.pitch, 1.25);
  assert.strictEqual(MASCOT_PROFILES.turtle.pitch, 0.85);
  console.log('✅ Test 13 Passed: Mascot profile pitch configurations are correct');
} catch (e) {
  console.error('❌ Test 13 Failed:', e.message);
  process.exit(1);
}

// Test 14: getMascotSpeech should generate custom praise for owl containing wise terms
try {
  const msg = getMascotSpeech('owl', true, 'Phép cộng đúng rồi');
  assert.ok(msg.includes('Phép cộng đúng rồi'));
  // Should contain at least one exclamation or template from the owl pool
  const hasOwlPraise = MASCOT_PROFILES.owl.praiseExclamations.some(ex => msg.includes(ex)) || 
                       MASCOT_PROFILES.owl.praiseTemplates.some(t => msg.includes(t.replace('.', '')));
  assert.ok(hasOwlPraise);
  console.log('✅ Test 14 Passed: Owl custom praise generated correctly');
} catch (e) {
  console.error('❌ Test 14 Failed:', e.message);
  process.exit(1);
}

// Test 15: getMascotSpeech should generate custom encouragement for robot
try {
  const msg = getMascotSpeech('robot', false, 'Sai rồi');
  assert.ok(msg.includes('Sai rồi'));
  const hasRobotEncourage = MASCOT_PROFILES.robot.encourageExclamations.some(ex => msg.includes(ex)) ||
                            MASCOT_PROFILES.robot.encourageTemplates.some(t => msg.includes(t.replace('.', '')));
  assert.ok(hasRobotEncourage);
  console.log('✅ Test 15 Passed: Robot custom encouragement generated correctly');
} catch (e) {
  console.error('❌ Test 15 Failed:', e.message);
  process.exit(1);
}

console.log('Running tests for getLearningPlan startingRecommendation...');
try {
  const testLessons = [
    { id: 'lesson-1', shortTitle: 'Bài 1', skill: 'Cộng' },
    { id: 'lesson-11', shortTitle: 'Bài 11', skill: 'Trừ' },
    { id: 'lesson-27', shortTitle: 'Bài 27', skill: 'Nhân' }
  ];
  
  // Scenario 1: New user with startingRecommendation: 'lesson-11'
  const progress1 = {
    completed: {},
    attempts: {},
    profile: { startingRecommendation: 'lesson-11' }
  };
  const plan1 = getLearningPlan(testLessons, progress1);
  assert.strictEqual(plan1.primary.lesson.id, 'lesson-11');
  assert.strictEqual(plan1.primary.index, 1);
  
  // Scenario 2: New user with startingRecommendation: 'lesson-27'
  const progress2 = {
    completed: {},
    attempts: {},
    profile: { startingRecommendation: 'lesson-27' }
  };
  const plan2 = getLearningPlan(testLessons, progress2);
  assert.strictEqual(plan2.primary.lesson.id, 'lesson-27');
  assert.strictEqual(plan2.primary.index, 2);

  // Scenario 3: User has completed lessons (already started learning), so ignore startingRecommendation and continue standard path
  const progress3 = {
    completed: { 'grade-4_math_lesson-11': { stars: 3 } },
    attempts: {},
    profile: { startingRecommendation: 'lesson-11' }
  };
  const plan3 = getLearningPlan(testLessons, progress3);
  // Should recommend the next incomplete lesson, which is 'lesson-1' (since index 0 is not completed)
  assert.strictEqual(plan3.primary.lesson.id, 'lesson-1');
  assert.strictEqual(plan3.primary.index, 0);

  console.log('✅ getLearningPlan startingRecommendation tests passed!');
} catch (e) {
  console.error('❌ getLearningPlan startingRecommendation tests failed:', e.message);
  process.exit(1);
}

console.log('Running tests for getRecentlyStudiedLesson...');
try {
  const testLessons = [
    { id: 'lesson-1', shortTitle: 'Bài 1' },
    { id: 'lesson-2', shortTitle: 'Bài 2' },
    { id: 'lesson-3', shortTitle: 'Bài 3' }
  ];

  // Case 1: No attempts
  const progress1 = { attempts: {} };
  assert.strictEqual(getRecentlyStudiedLesson(testLessons, progress1, 'grade-4', 'math'), null);

  // Case 2: One attempt
  const progress2 = {
    attempts: {
      'grade-4_math_lesson-1': { lastPlayedAt: '2026-07-17T12:00:00.000Z' }
    }
  };
  assert.strictEqual(getRecentlyStudiedLesson(testLessons, progress2, 'grade-4', 'math').id, 'lesson-1');

  // Case 3: Multiple attempts, should return the one with the latest lastPlayedAt
  const progress3 = {
    attempts: {
      'grade-4_math_lesson-1': { lastPlayedAt: '2026-07-17T12:00:00.000Z' },
      'grade-4_math_lesson-2': { lastPlayedAt: '2026-07-17T14:00:00.000Z' },
      'grade-4_math_lesson-3': { lastPlayedAt: '2026-07-17T11:00:00.000Z' }
    }
  };
  assert.strictEqual(getRecentlyStudiedLesson(testLessons, progress3, 'grade-4', 'math').id, 'lesson-2');

  console.log('✅ getRecentlyStudiedLesson tests passed!');
} catch (e) {
  console.error('❌ getRecentlyStudiedLesson tests failed:', e.message);
  process.exit(1);
}

console.log('Running tests for getUnlockedAchievementIds...');
try {
  const testLessons = [
    { id: 'lesson-1', difficulty: 'easy' },
    { id: 'lesson-2', difficulty: 'easy' },
    { id: 'lesson-3', difficulty: 'hard' }
  ];

  // Case 1: Empty progress - no achievements unlocked
  const progress1 = { completed: {}, xp: 0, streak: 1, notificationsEnabled: false };
  assert.deepStrictEqual(getUnlockedAchievementIds(progress1, 0, testLessons), []);

  // Case 2: Unlocks detective (completed count >= 2)
  const progress2 = {
    completed: {
      'lesson-1': { stars: 3, challengeMode: false },
      'lesson-2': { stars: 2, challengeMode: false }
    },
    xp: 50,
    streak: 1,
    notificationsEnabled: false
  };
  const unlocks2 = getUnlockedAchievementIds(progress2, 5, testLessons);
  assert.ok(unlocks2.includes('detective'));
  assert.ok(unlocks2.includes('perfect_score')); // stars 3 on lesson-1
  assert.ok(!unlocks2.includes('explainer')); // only 2 completed, explainer needs 4

  // Case 3: Unlocks logic_brain (xp >= 300) and daily_streak (streak >= 3)
  const progress3 = {
    completed: {
      'lesson-1': { stars: 3, challengeMode: false }
    },
    xp: 350,
    streak: 4,
    notificationsEnabled: false
  };
  const unlocks3 = getUnlockedAchievementIds(progress3, 3, testLessons);
  assert.ok(unlocks3.includes('logic_brain'));
  assert.ok(unlocks3.includes('daily_streak'));
  assert.ok(unlocks3.includes('perfect_score'));
  assert.ok(!unlocks3.includes('detective')); // completed is only 1

  // Case 4: Unlocks challenge_master and dedicated_learner
  const progress4 = {
    completed: {
      'lesson-3': { stars: 3, challengeMode: true }
    },
    xp: 30,
    streak: 1,
    notificationsEnabled: true
  };
  const unlocks4 = getUnlockedAchievementIds(progress4, 3, testLessons);
  assert.ok(unlocks4.includes('challenge_master'));
  assert.ok(unlocks4.includes('dedicated_learner'));

  console.log('✅ getUnlockedAchievementIds tests passed!');
} catch (e) {
  console.error('❌ getUnlockedAchievementIds tests failed:', e.message);
  process.exit(1);
}

console.log('Running tests for applyLessonResult duration tracking...');
try {
  const initialProgress = { completed: {}, attempts: {}, weakSkills: {}, xp: 0 };
  const stepFails = {};
  
  // First attempt with 45 seconds duration
  const res1 = applyLessonResult(initialProgress, {
    lessonId: 'lesson-1',
    skill: 'Trung bình cộng',
    stars: 3,
    mistakes: 0,
    duration: 45,
    stepFails
  }, 'grade-4', 'math');
  
  const fullId = 'grade-4_math_lesson-1';
  assert.strictEqual(res1.completed[fullId].duration, 45);
  assert.strictEqual(res1.attempts[fullId].lastDuration, 45);
  assert.strictEqual(res1.attempts[fullId].totalDuration, 45);
  
  // Second attempt with 55 seconds duration
  const res2 = applyLessonResult(res1, {
    lessonId: 'lesson-1',
    skill: 'Trung bình cộng',
    stars: 2,
    mistakes: 1,
    duration: 55,
    stepFails
  }, 'grade-4', 'math');
  
  assert.strictEqual(res2.completed[fullId].duration, 55);
  assert.strictEqual(res2.attempts[fullId].lastDuration, 55);
  assert.strictEqual(res2.attempts[fullId].totalDuration, 100);
  
  console.log('✅ applyLessonResult duration tracking tests passed!');
} catch (e) {
  console.error('❌ applyLessonResult duration tracking tests failed:', e.message);
  process.exit(1);
}

console.log('🎉 All tests passed successfully!');



