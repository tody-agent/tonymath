import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const lessonsFile = path.join(ROOT_DIR, 'public', 'lessons', 'grade-4', 'math.json');

function printHeader(title) {
  console.log('\n==================================================');
  console.log(`🔍 ${title.toUpperCase()}`);
  console.log('==================================================');
}

function evaluateExpr(expr) {
  // Replace division and multiplication symbols
  let cleaned = expr.replace(/÷/g, '/').replace(/×/g, '*');
  // Check if expression is safe (only digits, operators, spaces, parentheses)
  if (!/^[0-9+\-*/() .]+$/.test(cleaned)) {
    throw new Error(`Unsafe characters or non-numeric expression: "${expr}"`);
  }
  // Evaluate
  return Function(`"use strict"; return (${cleaned})`)();
}

function runAudit() {
  printHeader('Auditing Lessons Data');
  
  if (!fs.existsSync(lessonsFile)) {
    console.error(`❌ Lessons file not found at: ${lessonsFile}`);
    process.exit(1);
  }

  let lessons;
  try {
    lessons = JSON.parse(fs.readFileSync(lessonsFile, 'utf8'));
  } catch (e) {
    console.error(`❌ Failed to parse JSON in ${lessonsFile}: ${e.message}`);
    process.exit(1);
  }

  console.log(`Loaded ${lessons.length} lessons from grade-4/math.json.`);

  let errors = [];
  let warnings = [];

  lessons.forEach((lesson, index) => {
    const lId = lesson.id || `Index-${index}`;
    const skill = lesson.skill || '';

    // 1. Required fields
    const requiredFields = [
      'id', 'title', 'story', 'retellOptions', 'correctRetell', 
      'facts', 'factRoles', 'models', 'correctModel', 
      'operations', 'correctOperation', 'reasons', 'correctReason', 
      'answer', 'unit', 'answerOptions', 'correctAnswerSentence', 
      'checkQuestion', 'checkOptions', 'correctCheck', 'hints'
    ];
    requiredFields.forEach(field => {
      if (lesson[field] === undefined) {
        errors.push({ id: lId, type: 'missing_field', message: `Missing required field "${field}"` });
      }
    });

    // 2. Index boundary checks
    const indexFields = [
      { key: 'correctRetell', listKey: 'retellOptions' },
      { key: 'correctModel', listKey: 'models' },
      { key: 'correctOperation', listKey: 'operations' },
      { key: 'correctReason', listKey: 'reasons' },
      { key: 'correctAnswerSentence', listKey: 'answerOptions' },
      { key: 'correctCheck', listKey: 'checkOptions' }
    ];
    indexFields.forEach(({ key, listKey }) => {
      const idx = lesson[key];
      const list = lesson[listKey];
      if (idx !== undefined && list) {
        if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) {
          errors.push({ id: lId, type: 'invalid_index', message: `Field "${key}" value ${idx} is out of bounds for "${listKey}" (length: ${list.length})` });
        }
      }
    });

    // 3. Mathematical validation of operations and answers
    const isLogicSkill = skill === 'Suy luận logic';
    const isDummyAnswer = lesson.answer === 0;

    if (lesson.operations && lesson.correctOperation !== undefined && lesson.answer !== undefined) {
      const op = lesson.operations[lesson.correctOperation];
      if (op) {
        if (!isLogicSkill && !isDummyAnswer) {
          try {
            const evalVal = evaluateExpr(op);
            const diff = Math.abs(evalVal - lesson.answer);
            if (diff > 1e-4) {
              errors.push({
                id: lId,
                type: 'math_mismatch',
                message: `Operation "${op}" evaluates to ${evalVal}, but answer field expects ${lesson.answer}`
              });
            }
          } catch (e) {
            errors.push({
              id: lId,
              type: 'eval_error',
              message: `Could not mathematically evaluate expression "${op}": ${e.message}`
            });
          }
        } else {
          // Logic skill or dummy answer. We just verify the operations list exists.
          if (!op.trim()) {
            errors.push({ id: lId, type: 'empty_operation', message: 'Correct operation string is empty' });
          }
        }
      }
    }

    // 4. Visual Compare matching
    if (lesson.visual) {
      const vis = lesson.visual;
      if (vis.type === 'compare') {
        if (vis.big !== undefined && vis.small !== undefined && vis.diff !== undefined) {
          if (vis.big - vis.small !== vis.diff) {
            errors.push({
              id: lId,
              type: 'compare_visual_error',
              message: `Compare visual mismatch: big (${vis.big}) - small (${vis.small}) = ${vis.big - vis.small}, but diff is specified as ${vis.diff}`
            });
          }
        }
      }
    }

    // 5. Answer sentence contains numeric answer
    if (lesson.answerOptions && lesson.correctAnswerSentence !== undefined && lesson.answer !== undefined) {
      const sentence = lesson.answerOptions[lesson.correctAnswerSentence];
      if (sentence && !isLogicSkill && !isDummyAnswer) {
        const expectedStr = String(lesson.answer);
        if (!sentence.includes(expectedStr)) {
          warnings.push({
            id: lId,
            type: 'sentence_mismatch',
            message: `Selected answer sentence "${sentence}" does not explicitly contain the answer value "${expectedStr}"`
          });
        }
      }
    }
  });

  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} warnings (non-critical):`);
    warnings.forEach(w => console.warn(`   [WARNING] Lesson ${w.id} (${w.type}): ${w.message}`));
  }

  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} validation errors:`);
    errors.forEach(e => console.error(`   [ERROR] Lesson ${e.id} (${e.type}): ${e.message}`));
    process.exit(1);
  }

  console.log('\n✅ All lessons successfully passed the integrity and mathematical correctness audit!');
  process.exit(0);
}

runAudit();
