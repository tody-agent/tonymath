/**
 * Checks if a lesson at the given index is unlocked.
 * A lesson is unlocked if it is the first lesson, if DevMode is enabled,
 * or if the previous lesson has been completed in progressCompleted.
 *
 * @param {number} index - Index of the lesson
 * @param {Object} progressCompleted - Map of completed lesson IDs to progress data
 * @param {Array} lessons - Array of all lessons
 * @param {boolean} isDevMode - Whether developer unlock mode is active
 * @returns {boolean} True if unlocked, false otherwise
 */
export function isUnlocked(index, progressCompleted, lessons, isDevMode) {
  if (isDevMode) return true;
  if (index === 0) return true;
  const previousLesson = lessons[index - 1];
  return Boolean(progressCompleted && previousLesson && progressCompleted[previousLesson.id]);
}

/**
 * Resolves speed settings ('slow', 'normal', 'fast') to numeric SpeechSynthesisUtterance rate.
 *
 * @param {string} speedName - Name of the speed setting
 * @returns {number} The numeric rate value for SpeechSynthesisUtterance
 */
export function resolveSpeechRate(speedName) {
  if (speedName === 'slow') return 0.75;
  if (speedName === 'fast') return 1.15;
  return 0.95; // Default for 'normal' or any other invalid value
}

