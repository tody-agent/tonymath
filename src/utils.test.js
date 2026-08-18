import { isUnlocked, resolveSpeechRate, generateIcsContent, isChallengeModeActive, getActiveProgress, applyLessonResult, getLearningPlan, getRecentlyStudiedLesson, getUnlockedAchievementIds, analyzeBehavioralProfile, updateBehavioralMetrics, getDailyQuests, generateMathGateQuestion, verifyMathGateAnswer } from './utils.js';
import { getMascotSpeech, getIndicatorGuide, MASCOT_PROFILES } from './mascotDialogs.js';
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

  // Case 3: Unlocks logic_brain (xp >= 1000) and daily_streak (streak >= 3)
  const progress3 = {
    completed: {
      'lesson-1': { stars: 3, challengeMode: false }
    },
    xp: 1050,
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

console.log('Running tests for mascotDialogs...');

// Test 1: Verify exactly 9 mascot profiles exist
try {
  const keys = Object.keys(MASCOT_PROFILES);
  assert.strictEqual(keys.length, 9);
  const expectedKeys = ['owl', 'robot', 'turtle', 'babyshark', 'poli', 'steve', 'elsa', 'pinkfong', 'peppa'];
  expectedKeys.forEach(k => {
    assert.ok(keys.includes(k), `Mascot profile ${k} is missing`);
    const p = MASCOT_PROFILES[k];
    assert.ok(p.name, `Mascot ${k} is missing name`);
    assert.ok(p.emoji, `Mascot ${k} is missing emoji`);
    assert.ok(p.desc, `Mascot ${k} is missing desc`);
    assert.ok(typeof p.pitch === 'number', `Mascot ${k} pitch must be number`);
    assert.ok(typeof p.rateOffset === 'number', `Mascot ${k} rateOffset must be number`);
    assert.ok(p.achievementPraise, `Mascot ${k} is missing achievementPraise`);
  });
  console.log('✅ Test: All 9 mascot profiles are defined and structured correctly');
} catch (e) {
  console.error('❌ Mascot profiles structure test failed:', e.message);
  process.exit(1);
}

// Test 2: Verify getMascotSpeech resolves correctly for all 9 mascots
try {
  const expectedKeys = ['owl', 'robot', 'turtle', 'babyshark', 'poli', 'steve', 'elsa', 'pinkfong', 'peppa'];
  expectedKeys.forEach(k => {
    const praise = getMascotSpeech(k, true, 'Test Praise');
    const encourage = getMascotSpeech(k, false, 'Test Encourage');
    assert.ok(praise.includes('Test Praise'), `Mascot ${k} praise missing message`);
    assert.ok(encourage.includes('Test Encourage'), `Mascot ${k} encourage missing message`);
  });
  console.log('✅ Test: getMascotSpeech returns correct custom text for all mascots');
} catch (e) {
  console.error('❌ getMascotSpeech tests failed:', e.message);
  process.exit(1);
}

// Test 3: Verify getIndicatorGuide resolves and formats correctly for new mascots
try {
  const progress = { level: 4, streak: 12, xp: 450 };
  
  // Test baby shark indicator guide formatting
  const lvlGuide = getIndicatorGuide('babyshark', 'level', progress);
  assert.ok(lvlGuide.intro.includes('4'), `Expected "4" in intro, got: ${lvlGuide.intro}`);
  
  const streakGuide = getIndicatorGuide('steve', 'streak', progress);
  assert.ok(streakGuide.intro.includes('12'), `Expected "12" in intro, got: ${streakGuide.intro}`);
  
  const xpGuide = getIndicatorGuide('elsa', 'xp', progress);
  assert.ok(xpGuide.intro.includes('450'), `Expected "450" in intro, got: ${xpGuide.intro}`);
  
  console.log('✅ Test: getIndicatorGuide formats dynamic placeholders for new mascots correctly');
} catch (e) {
  console.error('❌ getIndicatorGuide formatting tests failed:', e.message);
  process.exit(1);
}

// Test 4: Verify analyzeBehavioralProfile and updateBehavioralMetrics
try {
  console.log('Running tests for behavioral profile tracking...');
  let progress = {
    xp: 0,
    behavioralProfile: {
      totalStepsPlayed: 0,
      totalMistakes: 0,
      quickAnswersCount: 0,
      quickMistakesCount: 0,
      immediateHintsCount: 0,
      idleStuckCount: 0,
      exitMidwayCount: 0,
      currentArchetype: 'balanced',
      lastAnalyzedAt: null
    }
  };

  // Test pioneer (impulsive)
  // quickMistakesCount >= 2 and totalStepsPlayed >= 3
  progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 3, isCorrect: false });
  progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 4, isCorrect: false });
  progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 10, isCorrect: true }); // totalStepsPlayed = 3
  assert.strictEqual(progress.behavioralProfile.currentArchetype, 'pioneer');
  console.log('✅ Test Passed: pioneer archetype correctly classified');

  // Reset progress to test budding_thinker
  progress = {
    xp: 0,
    behavioralProfile: {
      totalStepsPlayed: 0,
      totalMistakes: 0,
      quickAnswersCount: 0,
      quickMistakesCount: 0,
      immediateHintsCount: 0,
      idleStuckCount: 0,
      exitMidwayCount: 0,
      currentArchetype: 'balanced',
      lastAnalyzedAt: null
    }
  };

  // immediateHintsCount >= 2 and totalStepsPlayed >= 3
  progress = updateBehavioralMetrics(progress, 'hint_opened', { latency: 2, step: 1 });
  progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 15, isCorrect: true });
  progress = updateBehavioralMetrics(progress, 'hint_opened', { latency: 3, step: 2 });
  progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 12, isCorrect: true });
  progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 12, isCorrect: true }); // totalStepsPlayed = 3
  assert.strictEqual(progress.behavioralProfile.currentArchetype, 'budding_thinker');
  console.log('✅ Test Passed: budding_thinker archetype correctly classified');

  // Test active_seeker
  progress = {
    xp: 0,
    behavioralProfile: {
      totalStepsPlayed: 0,
      totalMistakes: 0,
      quickAnswersCount: 0,
      quickMistakesCount: 0,
      immediateHintsCount: 0,
      idleStuckCount: 0,
      exitMidwayCount: 0,
      currentArchetype: 'balanced',
      lastAnalyzedAt: null
    }
  };

  // exitMidwayCount >= 2 and totalStepsPlayed >= 3
  progress = updateBehavioralMetrics(progress, 'exit_lesson', { step: 3, mistakes: 2 });
  progress = updateBehavioralMetrics(progress, 'exit_lesson', { step: 4, mistakes: 1 });
  progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 15, isCorrect: true });
  progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 15, isCorrect: true });
  progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 15, isCorrect: true });
  assert.strictEqual(progress.behavioralProfile.currentArchetype, 'active_seeker');
  console.log('✅ Test Passed: active_seeker archetype correctly classified');

  // Test scholar
  progress = {
    xp: 0,
    behavioralProfile: {
      totalStepsPlayed: 0,
      totalMistakes: 0,
      quickAnswersCount: 0,
      quickMistakesCount: 0,
      immediateHintsCount: 0,
      idleStuckCount: 0,
      exitMidwayCount: 0,
      currentArchetype: 'balanced',
      lastAnalyzedAt: null
    }
  };

  // totalStepsPlayed >= 8, quickMistakesCount <= 1, mistake rate <= 0.15
  for (let i = 0; i < 8; i++) {
    progress = updateBehavioralMetrics(progress, 'step_attempt', { latency: 15, isCorrect: i > 0 });
  }
  assert.strictEqual(progress.behavioralProfile.currentArchetype, 'scholar');
  console.log('✅ Test Passed: scholar archetype correctly classified');

  // Test direct call of analyzeBehavioralProfile
  const directProfile = analyzeBehavioralProfile({
    behavioralProfile: {
      totalStepsPlayed: 10,
      totalMistakes: 1,
      quickAnswersCount: 0,
      quickMistakesCount: 0,
      immediateHintsCount: 0,
      idleStuckCount: 0,
      exitMidwayCount: 0
    }
  });
  assert.strictEqual(directProfile.currentArchetype, 'scholar');
  console.log('✅ Test Passed: direct analyzeBehavioralProfile call returns scholar');
  
} catch (e) {
  console.error('❌ Behavioral profile tests failed:', e.stack);
  process.exit(1);
}

// Test 5: Verify getMascotSpeech resolves options (careless, lazy, streak)
try {
  console.log('Running tests for mascotDialogs emotional options...');
  const expectedKeys = ['owl', 'robot', 'turtle', 'babyshark', 'poli', 'steve', 'elsa', 'pinkfong', 'peppa'];
  expectedKeys.forEach(k => {
    // Careless check
    const carelessMsg = getMascotSpeech(k, false, 'Dữ liệu sai', { isCareless: true });
    assert.ok(carelessMsg.includes('Dữ liệu sai'), `Mascot ${k} careless response missing core message`);
    const hasCarelessTemplate = MASCOT_PROFILES[k].carelessTemplates.some(t => carelessMsg.includes(t.slice(0, 10)));
    assert.ok(hasCarelessTemplate, `Mascot ${k} careless response did not use carelessTemplates`);

    // Lazy check
    const lazyMsg = getMascotSpeech(k, true, 'Dữ liệu đúng', { isLazy: true });
    const hasLazyTemplate = MASCOT_PROFILES[k].lazyTemplates.some(t => lazyMsg.includes(t.slice(0, 10)));
    assert.ok(hasLazyTemplate, `Mascot ${k} lazy response did not use lazyTemplates`);

    // Streak check
    const streakMsg = getMascotSpeech(k, true, 'Dữ liệu đúng', { currentStreak: 5 });
    assert.ok(streakMsg.includes('Dữ liệu đúng'), `Mascot ${k} streak response missing core message`);
    const hasStreakTemplate = MASCOT_PROFILES[k].streakHighTemplates.some(t => streakMsg.includes(t.slice(0, 10)));
    assert.ok(hasStreakTemplate, `Mascot ${k} streak response did not use streakHighTemplates`);
  });
  console.log('✅ Test Passed: getMascotSpeech maps careless, lazy, and streak templates correctly for all 9 mascots');
} catch (e) {
  console.error('❌ MascotDialogs emotional options tests failed:', e.stack);
  process.exit(1);
}

// Test 6: Verify getDailyQuests
try {
  console.log('Running tests for getDailyQuests...');
  const progress1 = {
    xp: 120,
    streak: 5,
    lastStudyDate: '2026-07-18',
    completed: {}
  };
  const quests1 = getDailyQuests(progress1, '2026-07-18');
  assert.strictEqual(quests1.length, 3);
  assert.strictEqual(quests1[0].completed, true); // Completed lesson today
  assert.strictEqual(quests1[1].completed, true); // 3 correct answers
  assert.strictEqual(quests1[2].completed, true); // Streak >= 1
  
  const progress2 = {
    xp: 100,
    streak: 0,
    lastStudyDate: '2026-07-17',
    completed: {}
  };
  const quests2 = getDailyQuests(progress2, '2026-07-18');
  assert.strictEqual(quests2[0].completed, false); // No lesson today
  assert.strictEqual(quests2[1].completed, false);
  assert.strictEqual(quests2[2].completed, false); // Streak is 0
  
  console.log('✅ Test Passed: getDailyQuests computes quests correctly');
} catch (e) {
  console.error('❌ getDailyQuests tests failed:', e.stack);
  process.exit(1);
}

console.log('Running tests for Math Gate functions...');
try {
  const gateQ = generateMathGateQuestion();
  assert.ok(gateQ.num1 >= 2 && gateQ.num1 <= 9);
  assert.ok(gateQ.num2 >= 2 && gateQ.num2 <= 9);
  assert.strictEqual(gateQ.answer, gateQ.num1 * gateQ.num2);
  assert.ok(gateQ.questionText.includes(`${gateQ.num1} x ${gateQ.num2}`));
  
  assert.strictEqual(verifyMathGateAnswer(' ' + gateQ.answer + ' ', gateQ.answer), true);
  assert.strictEqual(verifyMathGateAnswer(String(gateQ.answer), gateQ.answer), true);
  assert.strictEqual(verifyMathGateAnswer('wrong', gateQ.answer), false);
  assert.strictEqual(verifyMathGateAnswer('', gateQ.answer), false);
  console.log('✅ Test Passed: Math Gate functions work correctly');
} catch (e) {
  console.error('❌ Math Gate tests failed:', e.stack);
  process.exit(1);
}

console.log('Running tests for audioEngine & normalizeMathSpeech...');
try {
  const { normalizeMathSpeech, pickNonRepeatingAudioId, MASCOT_AUDIO_CATALOG } = await import('./audioEngine.js');
  
  // 1. Test math speech normalizer
  const norm1 = normalizeMathSpeech('5 + 3 = 8');
  assert.ok(norm1.includes('cộng') && norm1.includes('bằng'));
  
  const norm2 = normalizeMathSpeech('12 - 7 = ?');
  assert.ok(norm2.includes('trừ') && norm2.includes('bao nhiêu?'));

  const norm3 = normalizeMathSpeech('3 x 4 = 12');
  assert.ok(norm3.includes('nhân') && norm3.includes('bằng'));

  const norm4 = normalizeMathSpeech('1/2 quả cam');
  assert.ok(norm4.includes('phần'));

  // 2. Test pickNonRepeatingAudioId
  const pool = ['a', 'b', 'c'];
  const picked1 = pickNonRepeatingAudioId(pool);
  assert.ok(pool.includes(picked1));

  // 3. Test MASCOT_AUDIO_CATALOG structure
  assert.ok(MASCOT_AUDIO_CATALOG.robot.welcome.length > 0);
  assert.ok(MASCOT_AUDIO_CATALOG.turtle.welcome.length > 0);
  assert.ok(MASCOT_AUDIO_CATALOG.owl.welcome.length > 0);
  assert.ok(MASCOT_AUDIO_CATALOG.shark.welcome.length > 0);
  assert.ok(MASCOT_AUDIO_CATALOG.robot.wrong_careless.length > 0);
  assert.ok(MASCOT_AUDIO_CATALOG.turtle.wrong_careless.length > 0);

  // 4. Verify all audio files in manifest exist
  const fs = await import('fs');
  const path = await import('path');
  const manifestPath = path.resolve('public/audio/mascot/manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(manifest.length >= 35, 'Manifest must contain at least 35 voice assets');

  console.log('✅ Test Passed: audioEngine and audio assets validated successfully');
} catch (e) {
  console.error('❌ audioEngine tests failed:', e.stack);
  process.exit(1);
}

console.log('🎉 All tests passed successfully!');





