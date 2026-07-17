import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Fix Grade 3 Lesson 77 operation
const g3Path = path.join(ROOT_DIR, 'public', 'lessons', 'grade-3', 'math.json');
if (fs.existsSync(g3Path)) {
  const data = JSON.parse(fs.readFileSync(g3Path, 'utf8'));
  const l77 = data.find(x => x.id === 'lesson-77');
  if (l77) {
    console.log('Fixing Grade 3 lesson-77 operation...');
    l77.operations = l77.operations.map(op => op.replace(' = 30', ''));
  }
  fs.writeFileSync(g3Path, JSON.stringify(data, null, 2), 'utf8');
}

// 2. Fix Grade 5 Lesson 71, 72, 79, 89 operations (decimals comma to dot)
const g5Path = path.join(ROOT_DIR, 'public', 'lessons', 'grade-5', 'math.json');
if (fs.existsSync(g5Path)) {
  const data = JSON.parse(fs.readFileSync(g5Path, 'utf8'));
  const targetIds = ['lesson-71', 'lesson-72', 'lesson-79', 'lesson-89'];
  targetIds.forEach(id => {
    const l = data.find(x => x.id === id);
    if (l) {
      console.log(`Fixing decimal commas for Grade 5 ${id}...`);
      l.operations = l.operations.map(op => op.replace(/,/g, '.'));
    }
  });
  fs.writeFileSync(g5Path, JSON.stringify(data, null, 2), 'utf8');
}

console.log('Values fixed!');
