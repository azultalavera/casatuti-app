import fs from 'fs';
import path from 'path';

function findEmojis(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findEmojis(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // Simple emoji regex
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
      const matches = content.match(emojiRegex);
      if (matches) {
        console.log(`${fullPath}: ${[...new Set(matches)].join(' ')}`);
      }
    }
  }
}

findEmojis('src');
