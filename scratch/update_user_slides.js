const fs = require('fs');
const path = require('path');

const brainImagesDir = 'C:\\Users\\laiva\\.gemini\\antigravity\\brain\\31bb6a35-e00c-41c4-a923-89d169e27f6a\\.user_uploaded';
const targetDir = 'C:\\Users\\laiva\\.gemini\\antigravity\\scratch\\cong-thong-tin-thcs-dong-quang\\frontend\\public\\images';

const newSlides = [
  { srcName: 'media_1786657835040.jpg', targetJpg: 'slide-1.jpg', targetPng: 'slide-1.png' },
  { srcName: 'media_1786657835087.jpg', targetJpg: 'slide-2.jpg', targetPng: 'slide-2.png' },
  { srcName: 'media_1786657835110.jpg', targetJpg: 'slide-3.jpg', targetPng: 'slide-3.png' },
];

newSlides.forEach((item) => {
  const srcPath = path.join(brainImagesDir, item.srcName);
  const destJpg = path.join(targetDir, item.targetJpg);
  const destPng = path.join(targetDir, item.targetPng);

  console.log(`Copying ${srcPath} -> ${destJpg}`);
  fs.copyFileSync(srcPath, destJpg);
  fs.copyFileSync(srcPath, destPng);
});

console.log('Successfully copied all 3 new slide images to frontend/public/images/!');
