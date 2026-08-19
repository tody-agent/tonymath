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

const SPEECH_RATE_SLOW = 0.75;
const SPEECH_RATE_FAST = 1.15;
const SPEECH_RATE_NORMAL = 0.95;

/**
 * Resolves speed settings ('slow', 'normal', 'fast') to SpeechSynthesis rate.
 */
export function resolveSpeechRate(speedName) {
  if (speedName === 'slow') return SPEECH_RATE_SLOW;
  if (speedName === 'fast') return SPEECH_RATE_FAST;
  return SPEECH_RATE_NORMAL;
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
    'SUMMARY:⏰ Giờ học Học Toán Vui cùng bé!\n' +
    'DESCRIPTION:Đã đến giờ học giải toán lời văn rồi! Bấm vào đây để mở ứng dụng học toán: https://hoctoanvui.pages.dev/\n' +
    'BEGIN:VALARM\n' +
    'TRIGGER:-PT0M\n' +
    'ACTION:DISPLAY\n' +
    'DESCRIPTION:Reminder\n' +
    'END:VALARM\n' +
    'END:VEVENT\n' +
    'END:VCALENDAR'
  );
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Days between two YYYY-MM-DD (or ISO) date strings. */
export function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null;
  const parsedA = new Date(String(dateA).slice(0, 10));
  const parsedB = new Date(String(dateB).slice(0, 10));
  if (Number.isNaN(parsedA.getTime()) || Number.isNaN(parsedB.getTime())) return null;
  return Math.round((parsedB - parsedA) / MS_PER_DAY);
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

const TOTAL_MISTAKES_WEIGHT = 0.25;

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
    let weight = 0;
    if (done && needsReview(done)) weight += (3 - (done.stars || 0)) + (done.mistakes || 0);
    if (att) weight += (att.lastMistakes || 0) + (att.totalMistakes || 0) * TOTAL_MISTAKES_WEIGHT;
    if (progress?.weakSkills?.[lesson.skill]) weight += progress.weakSkills[lesson.skill];
    if (weight <= 0) continue;
    weights[lesson.skill] = (weights[lesson.skill] || 0) + weight;
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
    const startingRec = progress?.profile?.startingRecommendation;
    const recommendedIndex = startingRec ? lessons.findIndex(l => l.id === startingRec) : -1;

    if (recommendedIndex !== -1 && Object.keys(completed).length === 0) {
      const pathLesson = lessons[recommendedIndex];
      primary = {
        lesson: pathLesson,
        index: recommendedIndex,
        kind: 'next',
        title: 'Bài gợi ý tiếp theo',
        blurb: `Bài học gợi ý dựa trên học lực của con: “${pathLesson.shortTitle}” (${pathLesson.skill}).`,
        stars: 0,
        mistakes: 0,
        reason: 'recommendation'
      };
    } else {
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
  for (const reviewItem of reviews) {
    if (primary && reviewItem.lesson.id === primary.lesson.id) continue;
    secondary.push({
      ...reviewItem,
      kind: 'review',
      title: 'Nên ôn',
      blurb: `${reviewItem.lesson.shortTitle} · ${reviewItem.mistakes} lần tự sửa`
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
 * Merge lesson completion + attempt stats into progress (immutable).
 */
export function applyLessonResult(progress, { lessonId, skill, stars, mistakes, duration = 0, stepFails = {}, challengeMode = false }, grade = 'grade-4', subject = 'math') {
  const prefix = `${grade}_${subject}_`;
  const fullId = lessonId.startsWith(prefix) ? lessonId : `${prefix}${lessonId}`;
  const prevDone = progress.completed?.[fullId];
  const prevAtt = progress.attempts?.[fullId];
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
      [fullId]: {
        stars: bestStars,
        mistakes,
        completedAt: now,
        lastStars: stars,
        stepFails,
        playCount,
        challengeMode: prevDone?.challengeMode || challengeMode,
        duration: duration || prevDone?.duration || 0
      }
    },
    attempts: {
      ...(progress.attempts || {}),
      [fullId]: {
        playCount,
        totalMistakes,
        lastMistakes: mistakes,
        bestStars,
        lastPlayedAt: now,
        stepFails: { ...(prevAtt?.stepFails || {}), ...stepFails },
        needsReview: stars < 3 || mistakes >= 2,
        lastDuration: duration,
        totalDuration: (prevAtt?.totalDuration || 0) + duration
      }
    },
    weakSkills
  };
}

/**
 * Record a wrong step attempt (for personalization).
 */
export function applyStepMistake(progress, { lessonId, skill, step }, grade = 'grade-4', subject = 'math') {
  const prefix = `${grade}_${subject}_`;
  const fullId = lessonId.startsWith(prefix) ? lessonId : `${prefix}${lessonId}`;
  const key = String(step);
  const att = progress.attempts?.[fullId] || {
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
      [fullId]: {
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
 * Extracts and maps progress specifically for the active grade and subject.
 */
export function getActiveProgress(progress, grade = 'grade-4', subject = 'math') {
  const prefix = `${grade}_${subject}_`;
  const completed = {};
  const attempts = {};

  if (progress?.completed) {
    Object.entries(progress.completed).forEach(([key, val]) => {
      if (key.startsWith(prefix)) {
        completed[key.substring(prefix.length)] = val;
      }
    });
  }

  if (progress?.attempts) {
    Object.entries(progress.attempts).forEach(([key, val]) => {
      if (key.startsWith(prefix)) {
        attempts[key.substring(prefix.length)] = val;
      }
    });
  }

  return {
    ...progress,
    completed,
    attempts
  };
}

/**
 * Check if the lesson is run under Challenge Mode.
 * Either the global challengeMode setting is on, or the lesson difficulty is 'hard'.
 */
export function isChallengeModeActive(progress, lesson) {
  return !!(progress?.challengeMode || lesson?.difficulty === 'hard');
}

/**
 * Finds the most recently studied lesson based on lastPlayedAt timestamp in progress attempts.
 */
export function getRecentlyStudiedLesson(lessons, progress, grade = 'grade-4', subject = 'math') {
  const prefix = `${grade}_${subject}_`;
  const attempts = progress?.attempts || {};
  let lastLesson = null;
  let latestTime = 0;

  lessons.forEach((l) => {
    const fullId = l.id.startsWith(prefix) ? l.id : `${prefix}${l.id}`;
    const strippedId = l.id.startsWith(prefix) ? l.id.substring(prefix.length) : l.id;
    
    const att = attempts[fullId] || attempts[strippedId];
    if (att && att.lastPlayedAt) {
      const time = new Date(att.lastPlayedAt).getTime();
      if (time > latestTime) {
        latestTime = time;
        lastLesson = l;
      }
    }
  });

  return lastLesson;
}

/**
 * Metadata definitions of achievements.
 */
export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'detective',
    icon: '🔎',
    title: 'Thám tử dữ kiện',
    description: 'Hoàn thành từ 2 bài học để rèn luyện kỹ năng phân tích dữ kiện.',
    target: 2,
    current: (progress) => Object.keys(progress.completed || {}).length,
    checkUnlocked: (progress) => Object.keys(progress.completed || {}).length >= 2,
    advice: {
      owl: "Cú Ú khuyên: Hãy cố gắng đọc kỹ phần 'Đã biết / cần tìm' ở mỗi bài để giải toán như một thám tử thực thụ nhé!",
      turtle: "Rùa Con khuyên: Con hãy làm chậm rãi, tìm ra các manh mối trong bài toán để mở thêm huy hiệu này nha!",
      robot: "Rô Bốt khuyên: Chế độ phân tích dữ kiện của tớ nhận thấy con chỉ cần hoàn thành 2 bài học là kích hoạt được rồi đấy!"
    }
  },
  {
    id: 'explainer',
    icon: '🗣️',
    title: 'Giải thích rõ ràng',
    description: 'Hoàn thành từ 4 bài học để cải thiện cách diễn đạt lời giải.',
    target: 4,
    current: (progress) => Object.keys(progress.completed || {}).length,
    checkUnlocked: (progress) => Object.keys(progress.completed || {}).length >= 4,
    advice: {
      owl: "Cú Ú khuyên: Việc nói rõ ràng câu trả lời và lý do chọn phép tính sẽ giúp con hiểu sâu sắc bài toán.",
      turtle: "Rùa Con khuyên: Hãy tập giải thích cho bố mẹ nghe sau khi làm xong bài toán nha con!",
      robot: "Rô Bốt khuyên: Đang tối ưu hóa thuật toán diễn đạt. Hoàn thành 4 bài học để mở khóa thành tựu ngôn ngữ này."
    }
  },
  {
    id: 'logic_brain',
    icon: '🧠',
    title: 'Bộ não logic',
    description: 'Đạt tích lũy 1000 điểm kinh nghiệm (XP) qua các bài học.',
    target: 1000,
    current: (progress) => progress.xp || 0,
    checkUnlocked: (progress) => (progress.xp || 0) >= 1000,
    advice: {
      owl: "Cú Ú khuyên: Mỗi bài học hoàn thành xuất sắc sẽ cộng thêm nhiều XP cho con. Hãy đặt mục tiêu 1000 XP nhé!",
      turtle: "Rùa Con khuyên: Tích tiểu thành đại, mỗi ngày một ít XP là não bộ sẽ siêu logic luôn!",
      robot: "Rô Bốt khuyên: Cần tích lũy thêm XP để tăng dung lượng bộ nhớ logic của hệ thống."
    }
  },
  {
    id: 'star_collector',
    icon: '⭐',
    title: 'Nhà sưu tập sao',
    description: 'Thu thập tổng cộng 50 ngôi sao từ các bài học.',
    target: 50,
    current: (progress, earnedStars) => earnedStars || 0,
    checkUnlocked: (progress, earnedStars) => (earnedStars || 0) >= 50,
    advice: {
      owl: "Cú Ú khuyên: Hãy cố gắng đạt 3 sao ở mỗi bài học bằng cách trả lời đúng hết và không phạm lỗi nhé!",
      turtle: "Rùa Con khuyên: Rùa Con rất thích những ngôi sao lấp lánh này. Con cùng tớ sưu tập đủ 50 ngôi sao nhé!",
      robot: "Rô Bốt khuyên: Thu thập các lõi năng lượng sao để nâng cấp hiệu năng của chúng ta."
    }
  },
  {
    id: 'daily_streak',
    icon: '🔥',
    title: 'Kiên trì mỗi ngày',
    description: 'Duy trì chuỗi học tập liên tục từ 3 ngày trở lên.',
    target: 3,
    current: (progress) => progress.streak || 0,
    checkUnlocked: (progress) => (progress.streak || 0) >= 3,
    advice: {
      owl: "Cú Ú khuyên: Học tập đều đặn hàng ngày tốt hơn nhiều so với việc học dồn. Hãy giữ ngọn lửa streak luôn cháy!",
      turtle: "Rùa Con khuyên: Chậm mà chắc, mỗi ngày con nhớ vào học một bài toán cùng Rùa Con nhé!",
      robot: "Rô Bốt khuyên: Duy trì chu trình nạp năng lượng liên tục 3 ngày để tối đa hiệu suất học tập."
    }
  },
  {
    id: 'halfway_hero',
    icon: '🎖️',
    title: 'Kỵ sĩ nửa chặng đường',
    description: 'Hoàn thành từ 45 bài học trở lên để đạt mốc nửa hành trình.',
    target: 45,
    current: (progress) => Object.keys(progress.completed || {}).length,
    checkUnlocked: (progress) => Object.keys(progress.completed || {}).length >= 45,
    advice: {
      owl: "Cú Ú khuyên: Hãy tiếp tục đi thẳng về phía trước! Con đã hoàn thành một nửa chặng đường rồi đó.",
      turtle: "Rùa Con khuyên: Nửa quãng đường đã qua thật tuyệt vời. Chậm rãi và kiên nh trì cùng tớ nốt nửa kia nhé!",
      robot: "Rô Bốt khuyên: Đạt 50% tiến trình tổng thể. Mở khóa lõi năng lượng dự phòng."
    }
  },
  {
    id: 'journey_conqueror',
    icon: '🏆',
    title: 'Chinh phục hành trình',
    description: 'Hoàn thành toàn bộ các bài học trong chương trình.',
    target: (progress, earnedStars, lessons) => lessons?.length || 90,
    current: (progress) => Object.keys(progress.completed || {}).length,
    checkUnlocked: (progress, earnedStars, lessons) => lessons?.length ? Object.keys(progress.completed || {}).length === lessons.length : false,
    advice: {
      owl: "Cú Ú khuyên: Cột mốc vinh quang cuối cùng! Hãy hoàn thành tất cả các bài học trong chương trình.",
      turtle: "Rùa Con khuyên: Một hành trình vạn dặm đều bắt đầu từ bước chân đầu tiên. Hãy chinh phục hết bản đồ nhé!",
      robot: "Rô Bốt khuyên: Hoàn thành 100% nhiệm vụ bản đồ để đạt danh hiệu Đại Tướng Quân Toán Học."
    }
  },
  {
    id: 'perfect_score',
    icon: '💎',
    title: 'Trí tuệ hoàn hảo',
    description: 'Đạt điểm tuyệt đối 3 sao trong bất kỳ bài học nào.',
    target: 1,
    current: (progress) => Object.values(progress.completed || {}).filter(item => item.stars === 3).length,
    checkUnlocked: (progress) => Object.values(progress.completed || {}).some(item => item.stars === 3),
    advice: {
      owl: "Cú Ú khuyên: Học thật cẩn thận, suy nghĩ kỹ trước khi chọn mô hình và phép tính để đạt điểm tuyệt đối 3 sao.",
      turtle: "Rùa Con khuyên: Không sao cả nếu bị nhầm lẫn, con có thể học lại bài cũ để giành trọn 3 sao nhé!",
      robot: "Rô Bốt khuyên: Chế độ hoàn hảo kích hoạt khi tỷ lệ chính xác của bài học đạt 100% (3 sao)."
    }
  },
  {
    id: 'challenge_master',
    icon: '🛡️',
    title: 'Vượt khó thành công',
    description: 'Hoàn thành một bài học ở Chế độ Thử thách hoặc độ khó cao (Hard).',
    target: 1,
    current: (progress, earnedStars, lessons) => {
      const completedIds = Object.keys(progress.completed || {});
      return completedIds.filter(id => {
        const lesson = lessons?.find(l => l.id === id || `grade-4_math_${l.id}` === id);
        return lesson?.difficulty === 'hard' || progress.completed?.[id]?.challengeMode;
      }).length;
    },
    checkUnlocked: (progress, earnedStars, lessons) => {
      const completedIds = Object.keys(progress.completed || {});
      return completedIds.some(id => {
        const lesson = lessons?.find(l => l.id === id || `grade-4_math_${l.id}` === id);
        return lesson?.difficulty === 'hard' || progress.completed?.[id]?.challengeMode;
      });
    },
    advice: {
      owl: "Cú Ú khuyên: Hãy thử thách bản thân với Chế độ Thử thách (mất tim ❤️ khi trả lời sai) hoặc bài học có nhãn 'Khó' xem sao!",
      turtle: "Rùa Con khuyên: Chế độ thử thách tuy hơi khó một chút nhưng sẽ rèn luyện ý chí kiên cường cho con đó!",
      robot: "Rô Bốt khuyên: Kích hoạt chế độ kiểm thử áp lực cao. Hoàn thành 1 bài học giới hạn sinh mệnh để mở khóa."
    }
  },
  {
    id: 'dedicated_learner',
    icon: '🔔',
    title: 'Học viên chăm chỉ',
    description: 'Bật nhắc nhở học tập hàng ngày trong phần cài đặt của con.',
    target: 1,
    current: (progress) => progress.notificationsEnabled ? 1 : 0,
    checkUnlocked: (progress) => progress.notificationsEnabled || false,
    advice: {
      owl: "Cú Ú khuyên: Hãy bật thông báo nhắc nhở và tải lịch nhắc học để Cú Ú có thể gọi con học đúng giờ nhé!",
      turtle: "Rùa Con khuyên: Con hãy bật nhắc nhở ở Trang chủ để chúng mình luôn gặp nhau mỗi ngày nha!",
      robot: "Rô Bốt khuyên: Thiết lập tiến trình cron nhắc nhở để đồng bộ chu kỳ học tập sinh học của con."
    }
  }
];

/**
 * Returns all unlocked achievement IDs based on current progress.
 */
export function getUnlockedAchievementIds(progress, earnedStars, lessons) {
  return ACHIEVEMENT_DEFINITIONS
    .filter(achievement => achievement.checkUnlocked(progress, earnedStars, lessons))
    .map(achievement => achievement.id);
}

export function analyzeBehavioralProfile(progress) {
  const profile = {
    totalStepsPlayed: 0,
    totalMistakes: 0,
    quickAnswersCount: 0,
    quickMistakesCount: 0,
    immediateHintsCount: 0,
    idleStuckCount: 0,
    exitMidwayCount: 0,
    currentArchetype: 'balanced',
    lastAnalyzedAt: null,
    ...(progress.behavioralProfile || {})
  };

  const now = new Date().toISOString();
  profile.lastAnalyzedAt = now;

  const total = profile.totalStepsPlayed;
  if (total < 3) {
    profile.currentArchetype = 'balanced';
    return profile;
  }

  // 1. Budding Thinker (Anxious/fear of failure)
  if (profile.immediateHintsCount >= 2 || (profile.idleStuckCount >= 2 && profile.immediateHintsCount >= 1)) {
    profile.currentArchetype = 'budding_thinker';
  }
  // 2. Pioneer (Impulsive/fast runner)
  else if (profile.quickMistakesCount >= 2 || (profile.quickAnswersCount >= 4 && profile.totalMistakes >= 3)) {
    profile.currentArchetype = 'pioneer';
  }
  // 3. Active Seeker (Easily distracted / quits midway)
  else if (profile.exitMidwayCount >= 2) {
    profile.currentArchetype = 'active_seeker';
  }
  // 4. Scholar (Reflective / high accuracy)
  else if (total >= 8 && profile.quickMistakesCount <= 1 && (profile.totalMistakes / total) <= 0.15) {
    profile.currentArchetype = 'scholar';
  } else {
    profile.currentArchetype = 'balanced';
  }

  return profile;
}

export function updateBehavioralMetrics(progress, eventType, detail) {
  const profile = {
    totalStepsPlayed: 0,
    totalMistakes: 0,
    quickAnswersCount: 0,
    quickMistakesCount: 0,
    immediateHintsCount: 0,
    idleStuckCount: 0,
    exitMidwayCount: 0,
    currentArchetype: 'balanced',
    lastAnalyzedAt: null,
    ...(progress.behavioralProfile || {})
  };

  if (eventType === 'step_attempt') {
    profile.totalStepsPlayed += 1;
    if (!detail.isCorrect) {
      profile.totalMistakes += 1;
    }
    
    // Impulsive indicator: answered very quickly (< 8 seconds)
    if (detail.latency && detail.latency < 8) {
      profile.quickAnswersCount += 1;
      if (!detail.isCorrect) {
        profile.quickMistakesCount += 1;
      }
    }
    
    // Idle stuck indicator: took very long (> 25 seconds) without hints
    if (detail.latency && detail.latency > 25 && !detail.hintUsed) {
      profile.idleStuckCount += 1;
    }
  } else if (eventType === 'hint_opened') {
    // immediate hint indicator: opened hint < 5 seconds into step
    if (detail.latency && detail.latency < 5) {
      profile.immediateHintsCount += 1;
    }
  } else if (eventType === 'exit_lesson') {
    // Exited midway if they quit before completing step 7
    if (detail.step < 7 && detail.mistakes > 0) {
      profile.exitMidwayCount += 1;
    }
  }

  const updatedProfile = analyzeBehavioralProfile({ ...progress, behavioralProfile: profile });
  return {
    ...progress,
    behavioralProfile: updatedProfile
  };
}

/**
 * Returns dynamic daily quests for the given date.
 * @param {object} progress
 * @param {string} todayStr
 * @returns {array}
 */
export function getDailyQuests(progress, todayStr) {
  const q1 = {
    id: 'quest-lesson',
    title: 'Hoàn thành 1 bài học mới',
    target: 1,
    current: progress?.lastStudyDate === todayStr ? 1 : 0,
    xp: 15
  };

  let answersCorrect = 0;
  if (progress?.lastStudyDate === todayStr) {
    answersCorrect = 3;
  }
  const q2 = {
    id: 'quest-correct',
    title: 'Trả lời đúng 3 câu',
    target: 3,
    current: answersCorrect,
    xp: 20
  };

  const q3 = {
    id: 'quest-streak',
    title: 'Duy trì ngọn lửa học tập',
    target: 1,
    current: (progress?.streak || 0) >= 1 ? 1 : 0,
    xp: 30
  };

  return [
    { ...q1, completed: q1.current >= q1.target },
    { ...q2, completed: q2.current >= q2.target },
    { ...q3, completed: q3.current >= q3.target }
  ];
}

/**
 * Generates a random multiplication question for the Parent Math Gate.
 * @returns {object} { num1, num2, questionText, answer }
 */
export function generateMathGateQuestion() {
  const num1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const num2 = Math.floor(Math.random() * 8) + 2; // 2 to 9
  return {
    num1,
    num2,
    questionText: `Ba mẹ ơi, hãy tính giúp con: ${num1} x ${num2} = ?`,
    answer: num1 * num2
  };
}

/**
 * Verifies if the user input matches the expected math answer.
 * @param {string|number} input
 * @param {number} answer
 * @returns {boolean}
 */
export function verifyMathGateAnswer(input, answer) {
  if (input === null || input === undefined) return false;
  const cleanInput = String(input).trim();
  if (!cleanInput) return false;
  return Number(cleanInput) === answer;
}

/**
 * Trigger subtle haptic vibration on supporting mobile devices
 * @param {'light'|'success'|'warning'} type
 */
export function triggerHaptic(type = 'light') {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      if (type === 'light') navigator.vibrate(12);
      else if (type === 'success') navigator.vibrate([20, 35, 20]);
      else if (type === 'warning') navigator.vibrate([30, 40, 30]);
    } catch {
      // ignore
    }
  }
}
