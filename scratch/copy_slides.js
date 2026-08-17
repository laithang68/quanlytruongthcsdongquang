const fs = require('fs');
const path = require('path');

const downloadsDir = 'C:\\Users\\laiva\\Downloads';
const targetDir = 'C:\\Users\\laiva\\.gemini\\antigravity\\scratch\\cong-thong-tin-thcs-dong-quang\\frontend\\public\\images';

const slidesMap = [
  { targetName: 'slide-1.png', size: 2439264, fallbackName: 'Banner DQ.png' },
  { targetName: 'slide-2.png', size: 1264467, fallbackName: 'Banner IN 2.png' },
  { targetName: 'slide-3.png', size: 1601355, fallbackName: 'banner ngang In 3.png' },
];

const files = fs.readdirSync(downloadsDir);

slidesMap.forEach((item) => {
  let matchedFile = null;
  for (const file of files) {
    const fullPath = path.join(downloadsDir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.size === item.size) {
        matchedFile = fullPath;
        break;
      }
    } catch (e) {}
  }

  if (!matchedFile) {
    matchedFile = path.join(downloadsDir, item.fallbackName);
  }

  const destPath = path.join(targetDir, item.targetName);
  console.log(`Copying ${matchedFile} -> ${destPath}`);
  fs.copyFileSync(matchedFile, destPath);
});

console.log('Successfully copied 3 slide banners to frontend/public/images!');
