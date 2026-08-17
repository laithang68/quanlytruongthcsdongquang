const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '../frontend/src/app/quan-tri');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const adminPages = getFiles(adminDir);

adminPages.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace text-slate-400 on light backgrounds with proper dual dark/light text
  content = content.replace(/text-slate-400 font-medium/g, 'text-slate-600 dark:text-slate-400 font-medium');
  content = content.replace(/text-slate-400 font-semibold/g, 'text-slate-600 dark:text-slate-400 font-semibold');
  content = content.replace(/text-slate-400 font-bold/g, 'text-slate-600 dark:text-slate-400 font-bold');
  
  // Standardize Table Header
  content = content.replace(/bg-slate-100 dark:bg-slate-800\/80 text-slate-800 dark:text-slate-200/g, 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-extrabold');
  
  // Standardize Input focus ring
  content = content.replace(/focus:border-\[\#E97036\] focus:ring-1 focus:ring-\[\#E97036\]/g, 'focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 outline-none');

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fix admin colors script finished.');
