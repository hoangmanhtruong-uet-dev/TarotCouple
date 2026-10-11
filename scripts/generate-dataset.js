const fs = require('fs');
const path = require('path');

const wands = require('./wands-data');
const cups = require('./cups-data');
const swords = require('./swords-data');
const pentacles = require('./pentacles-data');

const allCards = {
  ...wands,
  ...cups,
  ...swords,
  ...pentacles
};

console.log('Total cards loaded:', Object.keys(allCards).length);

// Verify all IDs from 22 to 77 are present
const missing = [];
for (let id = 22; id <= 77; id++) {
  if (!allCards[id]) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error('Missing IDs:', missing);
  process.exit(1);
} else {
  console.log('All IDs 22 to 77 are present!');
}

let code = `/**
 * minor-arcana-topic-dataset.ts
 * Bộ Dataset chuyên sâu chuẩn xác cho toàn bộ 56 lá Ẩn Phụ (Minor Arcana IDs 22 đến 77)
 * Đầy đủ 4 bộ: Gậy (Wands 22..35), Cốc (Cups 36..49), Kiếm (Swords 50..63), Tiền (Pentacles 64..77)
 * Giải mã chi tiết, sắc bén, trực diện theo 3 chủ đề: Tình Duyên (love), Sự Nghiệp (career), Tài Chính (finance)
 * Bao gồm cả 2 chiều lá bài: Xuôi (upright) và Ngược (reversed).
 */

import type { TopicInterpretationMap } from './topic-interpretations';

export const MINOR_ARCANA_TOPIC_DATASET: Record<number, TopicInterpretationMap> = {
`;

for (let id = 22; id <= 77; id++) {
  const item = allCards[id];
  code += `  // ${id}: ${item.name}\n`;
  code += `  ${id}: {\n`;
  for (const topic of ['love', 'career', 'finance']) {
    const topicData = item[topic];
    code += `    ${topic}: {\n`;
    code += `      upright: {\n`;
    code += `        meaning: ${JSON.stringify(topicData.upright.meaning)},\n`;
    code += `        advice: ${JSON.stringify(topicData.upright.advice)},\n`;
    code += `        keyword: ${JSON.stringify(topicData.upright.keyword)},\n`;
    code += `      },\n`;
    code += `      reversed: {\n`;
    code += `        meaning: ${JSON.stringify(topicData.reversed.meaning)},\n`;
    code += `        advice: ${JSON.stringify(topicData.reversed.advice)},\n`;
    code += `        keyword: ${JSON.stringify(topicData.reversed.keyword)},\n`;
    code += `      },\n`;
    code += `    },\n`;
  }
  code += `  },\n\n`;
}

code += `};\n`;

const targetPath = path.resolve(__dirname, '../src/data/minor-arcana-topic-dataset.ts');
fs.writeFileSync(targetPath, code, 'utf-8');
console.log('Successfully written to', targetPath);
