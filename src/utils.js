/**
 * Lesson access: free browse — never block viewing/playing any lesson.
 * Sequential progress is used only for soft recommendations, not locks.
 *
 * @param {number} index
 * @param {Object} _progressCompleted
 * @param {Array} _lessons
 * @param {boolean} _isDevMode
 * @returns {boolean}
 */
export function isUnlocked(index, _progressCompleted, _lessons, _isDevMode) {
  return Number.isInteger(index) && index >= 0;
}

/**
 * Soft “journey path” marker: first incomplete sequential lesson.
 * Used for badges only — does NOT lock other lessons.
 */
export function getPathIndex(lessons, completed) {
  if (!lessons?.length) return 0;
  const idx = lessons.findIndex((l) => !completed?.[l.id]);
  return idx === -1 ? lessons.length - 1 : idx;
}

/**
 * Resolves speed settings ('slow', 'normal', 'fast') to SpeechSynthesis rate.
 */
export function resolveSpeechRate(speedName) {
  if (speedName === 'slow') return 0.75;
  if (speedName === 'fast') return 1.15;
  return 0.95;
}

/**
 * Generates ICS calendar file contents for daily reminders.
 */
export function generateIcsContent(timeStr, timestamp = Date.now()) {
  const [hours, minutes] = timeStr.split(':');
  const dateStr = new Date(timestamp).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const currentYear = new Date(timestamp).getFullYear();
  return (
    'BEGIN:VCALENDAR\n' +
    'VERSION:2.0\n' +
    'PRODID:-//Hoc Toan Vui//Daily Reminder//VI\n' +
    'BEGIN:VEVENT\n' +
    'UID:daily-math-reminder-' +
    timestamp +
    '\n' +
    'DTSTAMP:' +
    dateStr +
    '\n' +
    'DTSTART;TZID=Asia/Ho_Chi_Minh:' +
    currentYear +
    '0101T' +
    hours +
    minutes +
    '00\n' +
    'RRULE:FREQ=DAILY\n' +
    'SUMMARY:⏰ Giờ học Toán Vui cùng bé!\n' +
    'DESCRIPTION:Đã đến giờ học giải toán lời văn rồi! Bấm vào đây để mở ứng dụng học toán: https://hoc-toan-vui.pages.dev/\n' +
    'BEGIN:VALARM\n' +
    'TRIGGER:-PT0M\n' +
    'ACTION:DISPLAY\n' +
    'DESCRIPTION:Reminder\n' +
    'END:VALARM\n' +
    'END:VEVENT\n' +
    'END:VCALENDAR'
  );
}

/** Days between two YYYY-MM-DD (or ISO) date strings. */
export function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null;
  const a = new Date(String(dateA).slice(0, 10));
  const b = new Date(String(dateB).slice(0, 10));
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Whether a completed lesson should be reviewed (low stars or many mistakes).
 */
export function needsReview(record) {
  if (!record) return false;
  const stars = record.stars ?? record.bestStars ?? 3;
  const mistakes = record.mistakes ?? record.lastMistakes ?? 0;
  return stars < 3 || mistakes >= 2;
}

/**
 * Rank lessons that need review: fewest stars, then most mistakes, then recent.
 */
export function getReviewLessons(lessons, progress, limit = 5) {
  const completed = progress?.completed || {};
  const attempts = progress?.attempts || {};
  const rows = lessons
    .map((lesson, index) => {
      const done = completed[lesson.id];
      const att = attempts[lesson.id];
      if (!done && !att) return null;
      const stars = done?.stars ?? att?.bestStars ?? 0;
      const mistakes = Math.max(done?.mistakes ?? 0, att?.lastMistakes ?? 0, att?.totalMistakes ?? 0);
      const review = needsReview(done || att) || (att && att.lastMistakes >= 2);
      if (!review && done && stars >= 3) return null;
      if (!done && !review) return null;
      return {
        lesson,
        index,
        stars,
        mistakes,
        reason: stars < 2 ? 'review-hard' : mistakes >= 2 ? 'review-mistakes' : 'review-stars',
        score: (3 - Math.min(3, stars)) * 10 + Math.min(mistakes, 10)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.mistakes - a.mistakes);
  return rows.slice(0, limit);
}

/**
 * Weak skills aggregated from attempts / low-star completions.
 * @returns {{ skill: string, weight: number, lessonIds: string[] }[]}
 */
export function getWeakSkills(lessons, progress, limit = 3) {
  const weights = {};
  const bySkill = {};
  const completed = progress?.completed || {};
  const attempts = progress?.attempts || {};

  for (const lesson of lessons) {
    const done = completed[lesson.id];
    const att = attempts[lesson.id];
    let w = 0;
    if (done && needsReview(done)) w += (3 - (done.stars || 0)) + (done.mistakes || 0);
    if (att) w += (att.lastMistakes || 0) + (att.totalMistakes || 0) * 0.25;
    if (progress?.weakSkills?.[lesson.skill]) w += progress.weakSkills[lesson.skill];
    if (w <= 0) continue;
    weights[lesson.skill] = (weights[lesson.skill] || 0) + w;
    if (!bySkill[lesson.skill]) bySkill[lesson.skill] = [];
    bySkill[lesson.skill].push(lesson.id);
  }

  return Object.entries(weights)
    .map(([skill, weight]) => ({ skill, weight, lessonIds: bySkill[skill] || [] }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

/**
 * Personalized learning plan for home / complete screens.
 * @returns {{ primary, secondary[], reviews[], weakSkills[], pathIndex, messages }}
 */
export function getLearningPlan(lessons, progress) {
  const completed = progress?.completed || {};
  const pathIndex = getPathIndex(lessons, completed);
  const reviews = getReviewLessons(lessons, progress, 4);
  const weakSkills = getWeakSkills(lessons, progress, 3);

  let primary = null;

  // 1) Hardest review first (encouraging mastery)
  if (reviews.length > 0 && reviews[0].score >= 8) {
    primary = {
      ...reviews[0],
      kind: 'review',
      title: 'Ôn lại để vững hơn',
      blurb: `Bài “${reviews[0].lesson.shortTitle}” lần trước còn ${reviews[0].mistakes} lần tự sửa — làm lại sẽ nhớ lâu hơn!`
    };
  }

  // 2) Continue journey path
  if (!primary) {
    const pathLesson = lessons[pathIndex];
    const pathDone = completed[pathLesson?.id];
    if (pathLesson && !pathDone) {
      primary = {
        lesson: pathLesson,
        index: pathIndex,
        kind: 'next',
        title: 'Bài gợi ý tiếp theo',
        blurb: `Cùng chinh phục “${pathLesson.shortTitle}” — kỹ năng: ${pathLesson.skill}.`,
        stars: 0,
        mistakes: 0,
        reason: 'path'
      };
    } else if (pathLesson && pathDone && pathIndex < lessons.length - 1) {
      const next = lessons[pathIndex + 1];
      if (next && !completed[next.id]) {
        primary = {
          lesson: next,
          index: pathIndex + 1,
          kind: 'next',
          title: 'Bài gợi ý tiếp theo',
          blurb: `Tiếp theo: “${next.shortTitle}” (${next.skill}).`,
          stars: 0,
          mistakes: 0,
          reason: 'path'
        };
      }
    }
  }

  // 3) Soft review if nothing else
  if (!primary && reviews.length > 0) {
    primary = {
      ...reviews[0],
      kind: 'review',
      title: 'Luyện lại cho chắc',
      blurb: `Thử lại “${reviews[0].lesson.shortTitle}” để lấy thêm sao nhé!`
    };
  }

  // 4) All done celebration
  if (!primary && lessons.length) {
    const last = lessons[lessons.length - 1];
    primary = {
      lesson: last,
      index: lessons.length - 1,
      kind: 'mastery',
      title: 'Con đã đi hết hành trình!',
      blurb: 'Có thể chọn bất kỳ bài nào để ôn lại và săn 3 sao.',
      stars: completed[last.id]?.stars || 0,
      mistakes: 0,
      reason: 'complete'
    };
  }

  const secondary = [];
  for (const r of reviews) {
    if (primary && r.lesson.id === primary.lesson.id) continue;
    secondary.push({
      ...r,
      kind: 'review',
      title: 'Nên ôn',
      blurb: `${r.lesson.shortTitle} · ${r.mistakes} lần tự sửa`
    });
    if (secondary.length >= 2) break;
  }

  // Same-skill practice suggestion
  if (weakSkills[0] && secondary.length < 2) {
    const skill = weakSkills[0].skill;
    const candidate = lessons.find(
      (l) =>
        l.skill === skill &&
        (!primary || l.id !== primary.lesson.id) &&
        !secondary.some((s) => s.lesson.id === l.id)
    );
    if (candidate) {
      const index = lessons.findIndex((l) => l.id === candidate.id);
      secondary.push({
        lesson: candidate,
        index,
        kind: 'skill',
        title: 'Cùng kỹ năng',
        blurb: `Luyện thêm “${skill}” với bài ${candidate.shortTitle}`,
        stars: completed[candidate.id]?.stars || 0,
        mistakes: 0,
        reason: 'weak-skill'
      });
    }
  }

  return {
    primary,
    secondary,
    reviews,
    weakSkills,
    pathIndex,
    completedCount: Object.keys(completed).length,
    total: lessons.length
  };
}

/**
 * Welcome-back / coach nudge when user returns to the app.
 */
export function getWelcomeBackNudge(progress, today = new Date().toISOString().slice(0, 10)) {
  const name = progress?.profile?.name?.trim();
  const who = name ? `bé ${name}` : 'bạn nhỏ';
  const mascot = progress?.profile?.mascot || 'owl';
  const mascotEmoji = mascot === 'robot' ? '🤖' : mascot === 'turtle' ? '🐢' : '🦉';
  const mascotName = mascot === 'robot' ? 'Rô Bốt' : mascot === 'turtle' ? 'Rùa Con' : 'Cú Ú';

  const last = progress?.lastActiveDate || progress?.lastStudyDate;
  const gap = daysBetween(last, today);
  const streak = progress?.streak || 1;
  const planHint = progress?._planPrimaryTitle;

  let tone = 'hello';
  let title = `Chào ${who}!`;
  let body = `${mascotName} sẵn sàng đồng hành. Học một chút mỗi ngày là bộ não càng thông minh.`;
  let cta = 'Học ngay';

  if (gap === null || gap === 0) {
    tone = 'today';
    title = streak >= 3 ? `🔥 ${streak} ngày liên tiếp!` : `Chào ${who}!`;
    body =
      streak >= 3
        ? `Chuỗi ngày học tuyệt vời! Giữ nhịp này — chỉ cần một bài cũng đủ tự hào.`
        : `Hôm nay chỉ cần hoàn thành một bài và giải thích được “vì sao” là thắng rồi.`;
  } else if (gap === 1) {
    tone = 'streak';
    title = `🔥 Tiếp tục chuỗi ${streak} ngày!`;
    body = `${who.charAt(0).toUpperCase() + who.slice(1)} quay lại đúng lúc. Học đều quan trọng hơn học dồn.`;
  } else if (gap >= 2 && gap <= 4) {
    tone = 'missed';
    title = `${mascotEmoji} Nhớ ${who} quá!`;
    body = `Vắng ${gap} ngày rồi — không sao cả. Mở một bài dễ, làm ấm lại là được.`;
    cta = 'Quay lại học';
  } else if (gap >= 5) {
    tone = 'comeback';
    title = `🌟 ${who.charAt(0).toUpperCase() + who.slice(1)} đã quay lại!`;
    body = `Vượt qua sự lười biếng chính là kỹ năng siêu đẳng. Bắt đầu bằng một bài ngắn nhé — ${mascotName} cổ vũ con!`;
    cta = 'Bắt đầu lại';
  }

  if (planHint) {
    body = `${body} Gợi ý: ${planHint}`;
  }

  return { tone, title, body, cta, mascotEmoji, mascotName, gap, streak };
}

/**
 * Encouraging praise after a lesson completes.
 */
export function getCompletionPraise({ name, stars, mistakes, skill, shortTitle }) {
  const who = name?.trim() ? `bé ${name.trim()}` : 'con';
  if (stars >= 3) {
    return {
      headline: 'Hoàn hảo!',
      lines: [
        `${who.charAt(0).toUpperCase() + who.slice(1)} làm bài “${shortTitle}” không cần tự sửa — siêu đấy!`,
        `Kỹ năng “${skill}” đang rất vững. Giữ vững phong độ nhé!`
      ],
      sfx: 'perfect'
    };
  }
  if (stars === 2) {
    return {
      headline: 'Rất tốt!',
      lines: [
        `Chỉ ${mistakes} lần tự sửa — ${who} đã kiên trì và hiểu bài.`,
        `Muốn 3 sao? Ôn lại bài này khi rảnh, sẽ còn chắc hơn.`
      ],
      sfx: 'complete'
    };
  }
  return {
    headline: 'Con đã vượt qua!',
    lines: [
      `Sai rồi sửa chính là cách bộ não lớn lên. “${shortTitle}” đã xong!`,
      `Hãy thử lại khi sẵn sàng — mỗi lần ôn, con nhớ lâu hơn.`
    ],
    sfx: 'encourage'
  };
}

/**
 * Random gentle wrong-answer coach lines.
 */
const ENCOURAGE_LINES = [
  'Chưa đúng, nhưng con đang học! Đọc lại gợi ý rồi thử tiếp nhé.',
  'Gần đúng rồi! Sai một chút không sao — sửa là tiến bộ.',
  'Bình tĩnh nào. Nhìn lại câu chuyện: số đang tăng hay giảm?',
  'Cố lên! Mỗi lần thử lại, con hiểu đề rõ hơn.',
  'Không sao cả — thám tử toán cũng phải thử nhiều lần mới ra manh mối!'
];

export function getEncourageLine(seed = Date.now()) {
  return ENCOURAGE_LINES[Math.abs(seed) % ENCOURAGE_LINES.length];
}

/**
 * Merge lesson completion + attempt stats into progress (immutable).
 */
export function applyLessonResult(progress, { lessonId, skill, stars, mistakes, stepFails = {} }) {
  const prevDone = progress.completed?.[lessonId];
  const prevAtt = progress.attempts?.[lessonId];
  const bestStars = Math.max(prevDone?.stars || 0, prevAtt?.bestStars || 0, stars);
  const playCount = (prevAtt?.playCount || 0) + 1;
  const totalMistakes = (prevAtt?.totalMistakes || 0) + mistakes;
  const now = new Date().toISOString();

  const weakSkills = { ...(progress.weakSkills || {}) };
  if (mistakes >= 2 || stars < 3) {
    weakSkills[skill] = (weakSkills[skill] || 0) + mistakes + (3 - stars);
  } else if (stars === 3 && weakSkills[skill]) {
    weakSkills[skill] = Math.max(0, weakSkills[skill] - 2);
    if (weakSkills[skill] === 0) delete weakSkills[skill];
  }

  return {
    ...progress,
    xp: (progress.xp || 0) + stars * 10,
    lastActiveDate: now.slice(0, 10),
    lastStudyDate: now.slice(0, 10),
    completed: {
      ...(progress.completed || {}),
      [lessonId]: {
        stars: bestStars,
        mistakes,
        completedAt: now,
        lastStars: stars,
        stepFails,
        playCount
      }
    },
    attempts: {
      ...(progress.attempts || {}),
      [lessonId]: {
        playCount,
        totalMistakes,
        lastMistakes: mistakes,
        bestStars,
        lastPlayedAt: now,
        stepFails: { ...(prevAtt?.stepFails || {}), ...stepFails },
        needsReview: stars < 3 || mistakes >= 2
      }
    },
    weakSkills
  };
}

/**
 * Record a wrong step attempt (for personalization).
 */
export function applyStepMistake(progress, { lessonId, skill, step }) {
  const key = String(step);
  const att = progress.attempts?.[lessonId] || {
    playCount: 0,
    totalMistakes: 0,
    lastMistakes: 0,
    bestStars: 0,
    stepFails: {}
  };
  const stepFails = { ...(att.stepFails || {}) };
  stepFails[key] = (stepFails[key] || 0) + 1;
  const weakSkills = { ...(progress.weakSkills || {}) };
  if (skill) weakSkills[skill] = (weakSkills[skill] || 0) + 1;

  return {
    ...progress,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    attempts: {
      ...(progress.attempts || {}),
      [lessonId]: {
        ...att,
        totalMistakes: (att.totalMistakes || 0) + 1,
        lastMistakes: (att.lastMistakes || 0) + 1,
        stepFails,
        lastPlayedAt: new Date().toISOString(),
        needsReview: true
      }
    },
    weakSkills
  };
}

/**
 * Badge for a lesson card (free browse + soft signals).
 * @returns {'path'|'review'|'done'|'new'|null}
 */
export function getLessonBadge(index, lesson, progress, pathIndex) {
  const done = progress?.completed?.[lesson.id];
  const att = progress?.attempts?.[lesson.id];
  if (done && needsReview(done)) return 'review';
  if (att?.needsReview && (!done || needsReview(done))) return 'review';
  if (done) return 'done';
  if (index === pathIndex) return 'path';
  if (att?.playCount > 0 && !done) return 'review';
  return 'new';
}
