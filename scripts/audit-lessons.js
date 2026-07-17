import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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

function auditFile(lessonsFile, gradeId) {
  console.log(`\n--------------------------------------------------`);
  console.log(`📂 Auditing: ${lessonsFile} (${gradeId})`);
  console.log(`--------------------------------------------------`);

  if (!fs.existsSync(lessonsFile)) {
    console.error(`❌ Lessons file not found at: ${lessonsFile}`);
    return { errors: [{ id: 'global', type: 'file_missing', message: 'File not found' }], warnings: [] };
  }

  let lessons;
  try {
    lessons = JSON.parse(fs.readFileSync(lessonsFile, 'utf8'));
  } catch (e) {
    console.error(`❌ Failed to parse JSON in ${lessonsFile}: ${e.message}`);
    return { errors: [{ id: 'global', type: 'invalid_json', message: e.message }], warnings: [] };
  }

  console.log(`Loaded ${lessons.length} lessons from ${gradeId}.`);

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

  return { errors, warnings };
}

function runAudit() {
  printHeader('Auditing Lessons Data');
  
  // Parse command line arguments
  // usage: node scripts/audit-lessons.js [--grade grade-1]
  const args = process.argv.slice(2);
  let targetedGrade = null;
  const gradeIdx = args.indexOf('--grade');
  if (gradeIdx !== -1 && args[gradeIdx + 1]) {
    targetedGrade = args[gradeIdx + 1];
  }

  const registryFile = path.join(ROOT_DIR, 'public', 'lessons', 'registry.json');
  if (!fs.existsSync(registryFile)) {
    console.error(`❌ Registry file not found at: ${registryFile}`);
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  let gradesToAudit = registry.grades.filter(g => !g.comingSoon);

  if (targetedGrade) {
    gradesToAudit = gradesToAudit.filter(g => g.id === targetedGrade);
    if (gradesToAudit.length === 0) {
      console.error(`❌ Grade "${targetedGrade}" not found in registry (or is marked comingSoon)`);
      process.exit(1);
    }
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  gradesToAudit.forEach(grade => {
    grade.subjects.forEach(subject => {
      if (subject.comingSoon) return;
      const relativePath = subject.lessonsPath;
      const absolutePath = path.join(ROOT_DIR, 'public', relativePath);
      
      const { errors, warnings } = auditFile(absolutePath, grade.id);
      
      if (warnings.length > 0) {
        console.log(`⚠️  Found ${warnings.length} warnings in ${grade.id}:`);
        warnings.forEach(w => console.warn(`   [WARNING] Lesson ${w.id} (${w.type}): ${w.message}`));
        totalWarnings += warnings.length;
      }

      if (errors.length > 0) {
        console.error(`❌ Found ${errors.length} validation errors in ${grade.id}:`);
        errors.forEach(e => console.error(`   [ERROR] Lesson ${e.id} (${e.type}): ${e.message}`));
        totalErrors += errors.length;
      }
    });
  });

  if (totalErrors > 0) {
    console.error(`\n❌ Audit failed with ${totalErrors} errors.`);
    process.exit(1);
  }

  console.log('\n✅ All checked lessons successfully passed the integrity and mathematical correctness audit!');
  process.exit(0);
}

runAudit();
