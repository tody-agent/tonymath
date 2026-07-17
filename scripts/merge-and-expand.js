import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function expandHints(lesson) {
  if (lesson.hints && lesson.hints.length >= 7) {
    return lesson.hints;
  }
  
  const hints = [];
  const story = lesson.story;
  const facts = lesson.facts || [];
  const roles = lesson.factRoles || [];
  const models = lesson.models || [];
  const correctModel = lesson.correctModel || 0;
  const operations = lesson.operations || [];
  const correctOperation = lesson.correctOperation || 0;
  const answer = lesson.answer;
  const unit = lesson.unit || "";
  const answerOptions = lesson.answerOptions || [];
  const correctAnswerSentence = lesson.correctAnswerSentence || 0;
  
  const knownFacts = [];
  let unknownFact = "Tìm đáp án bài toán";
  
  facts.forEach((f, idx) => {
    const role = roles[idx] || (idx === facts.length - 1 ? 'unknown' : 'known');
    if (role === 'known') {
      knownFacts.push(f);
    } else {
      unknownFact = f;
    }
  });
  
  const fact1 = knownFacts[0] || "Dữ kiện thứ nhất của bài toán";
  const fact2 = knownFacts[1] || knownFacts[0] || "Dữ kiện thứ hai của bài toán";
  
  const modelName = models[correctModel] || "Mô hình biểu diễn phù hợp";
  const operationExpr = operations[correctOperation] || "";
  const finalSentence = answerOptions[correctAnswerSentence] || `Đáp số là ${answer} ${unit}`;
  
  hints.push(`Bước 1: Phân tích đề bài - Đọc kỹ câu chuyện toán học: "${story}"`);
  hints.push(`Bước 2: Xác định thông tin đã biết thứ nhất: "${fact1}"`);
  hints.push(`Bước 3: Xác định thông tin đã biết tiếp theo: "${fact2}"`);
  hints.push(`Bước 4: Xác định mục tiêu cần tìm - Câu hỏi yêu cầu: "${unknownFact}"`);
  hints.push(`Bước 5: Lựa chọn mô hình tư duy - Sử dụng trực quan: "${modelName}"`);
  hints.push(`Bước 6: Lập phép tính thích hợp để giải toán: "${operationExpr}"`);
  hints.push(`Bước 7: Thực hiện tính toán kết quả chính xác: ${operationExpr} = ${answer} ${unit}`);
  hints.push(`Bước 8: Kiểm tra lại kết quả và chọn câu trả lời đúng: "${finalSentence}"`);
  
  return hints;
}

function processGrade(gradeId, batches = []) {
  const mainPath = path.join(ROOT_DIR, 'public', 'lessons', gradeId, 'math.json');
  console.log(`Processing ${gradeId}...`);
  
  let lessons = [];
  if (fs.existsSync(mainPath)) {
    lessons = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
  }
  
  batches.forEach(bFile => {
    const bPath = path.join(ROOT_DIR, 'tmp', bFile);
    if (fs.existsSync(bPath)) {
      const batchLessons = JSON.parse(fs.readFileSync(bPath, 'utf8'));
      console.log(`  Merging ${batchLessons.length} lessons from ${bFile}`);
      lessons = lessons.concat(batchLessons);
    } else {
      console.warn(`  Warning: Batch file ${bFile} not found`);
    }
  });
  
  // Remove duplicates by ID (if any) or re-index them
  const seenIds = new Set();
  const uniqueLessons = [];
  lessons.forEach(l => {
    if (!seenIds.has(l.id)) {
      seenIds.add(l.id);
      uniqueLessons.push(l);
    }
  });
  
  // Format IDs sequentially
  uniqueLessons.forEach((l, index) => {
    l.id = `lesson-${index + 1}`;
  });
  
  // Expand hints
  uniqueLessons.forEach(l => {
    l.hints = expandHints(l);
  });
  
  fs.writeFileSync(mainPath, JSON.stringify(uniqueLessons, null, 2), 'utf8');
  console.log(`  Saved ${uniqueLessons.length} lessons to ${mainPath}`);
}

// 1. Merge and expand Grade 1, 2, 3, 5
processGrade('grade-1', ['grade-1-batch-a.json', 'grade-1-batch-b.json']);
processGrade('grade-2', ['grade-2-batch-a.json', 'grade-2-batch-b.json']);
processGrade('grade-3', ['grade-3-batch-a.json', 'grade-3-batch-b.json']);
processGrade('grade-5', ['grade-5-batch-a.json', 'grade-5-batch-b.json']);

// 2. Expand Grade 4 hints only (no new batches yet)
processGrade('grade-4', []);

console.log('Merge and expansion complete!');
