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

/**
 * Generates ICS calendar file contents for daily reminders.
 *
 * @param {string} timeStr - Time string formatted as HH:MM
 * @param {number} [timestamp] - Optional fixed timestamp for testing
 * @returns {string} The text content of the ICS file
 */
export function generateIcsContent(timeStr, timestamp = Date.now()) {
  const [hours, minutes] = timeStr.split(':');
  const dateStr = new Date(timestamp).toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
  const currentYear = new Date(timestamp).getFullYear();
  return "BEGIN:VCALENDAR\n" +
    "VERSION:2.0\n" +
    "PRODID:-//Hoc Toan Vui//Daily Reminder//VI\n" +
    "BEGIN:VEVENT\n" +
    "UID:daily-math-reminder-" + timestamp + "\n" +
    "DTSTAMP:" + dateStr + "\n" +
    "DTSTART;TZID=Asia/Ho_Chi_Minh:" + currentYear + "0101T" + hours + minutes + "00\n" +
    "RRULE:FREQ=DAILY\n" +
    "SUMMARY:⏰ Giờ học Toán Vui cùng bé!\n" +
    "DESCRIPTION:Đã đến giờ học giải toán lời văn rồi! Bấm vào đây để mở ứng dụng học toán: https://hoc-toan-vui.pages.dev/\n" +
    "BEGIN:VALARM\n" +
    "TRIGGER:-PT0M\n" +
    "ACTION:DISPLAY\n" +
    "DESCRIPTION:Reminder\n" +
    "END:VALARM\n" +
    "END:VEVENT\n" +
    "END:VCALENDAR";
}

