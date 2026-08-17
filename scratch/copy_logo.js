const fs = require('fs');
const path = require('path');

const downloadsDir = 'C:\\Users\\laiva\\Downloads';
const targetPath = 'C:\\Users\\laiva\\.gemini\\antigravity\\scratch\\cong-thong-tin-thcs-dong-quang\\frontend\\public\\images\\logo-truong.png';

const files = fs.readdirSync(downloadsDir);
for (const file of files) {
  const fullPath = path.join(downloadsDir, file);
  try {
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && stat.size === 1444432) {
      console.log('Found logo file:', fullPath, stat.size);
      fs.copyFileSync(fullPath, targetPath);
      console.log('Successfully copied to:', targetPath);
      break;
    }
  } catch (e) {}
}
