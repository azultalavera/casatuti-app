import fs from 'fs';
const content = fs.readFileSync('src/features/teacher/ProfeView.jsx', 'utf-8');
const lines = content.split('\n');
const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
lines.forEach((line, i) => {
  if (line.match(emojiRegex)) console.log(`Line ${i+1}: ${line}`);
});
