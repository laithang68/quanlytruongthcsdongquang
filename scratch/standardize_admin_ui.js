const fs = require('fs');
const path = require('path');

const targetFiles = [
  'frontend/src/app/quan-tri/page.tsx',
  'frontend/src/app/quan-tri/bai-viet/page.tsx',
  'frontend/src/app/quan-tri/giao-vien/page.tsx',
  'frontend/src/app/quan-tri/hoat-dong/page.tsx',
  'frontend/src/app/quan-tri/hoc-sinh/page.tsx',
  'frontend/src/app/quan-tri/lop-hoc/page.tsx',
  'frontend/src/app/quan-tri/nguoi-dung/page.tsx',
  'frontend/src/app/quan-tri/phu-huynh/page.tsx',
  'frontend/src/app/quan-tri/thong-bao/page.tsx',
  'frontend/src/app/quan-tri/thu-vien-anh/page.tsx',
  'frontend/src/app/quan-tri/thu-vien-so/page.tsx',
  'frontend/src/app/quan-tri/to-chuyen-mon/page.tsx',
  'frontend/src/app/quan-tri/van-ban/page.tsx',
  'frontend/src/app/quan-tri/video/page.tsx',
  'frontend/src/components/AdminHeader.tsx',
  'frontend/src/components/AdminSidebar.tsx',
];

let totalModifications = 0;

targetFiles.forEach((filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Inputs/Selects hardcoded bg-slate-950 -> bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700
  content = content.replace(
    /bg-slate-950\s+border\s+border-slate-800\s+text-white\s+placeholder-slate-500/g,
    'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder:text-slate-500 dark:placeholder:text-slate-400'
  );
  content = content.replace(
    /bg-slate-950\s+border\s+border-slate-800\s+text-white/g,
    'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
  );

  // 2. Table Headers hardcoded bg-slate-950 -> bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-extrabold
  content = content.replace(
    /thead\s+className="bg-slate-950\s+border-b\s+border-slate-800\s+uppercase\s+tracking-wider\s+text-slate-400\s+font-semibold"/g,
    'thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-900 dark:text-slate-100 font-extrabold"'
  );
  content = content.replace(
    /thead\s+className="bg-slate-950\s+border-b\s+border-slate-800\s+uppercase\s+tracking-wider\s+text-slate-400"/g,
    'thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-900 dark:text-slate-100 font-extrabold"'
  );

  // 3. Table Rows text color text-slate-300 -> text-slate-800 dark:text-slate-200
  content = content.replace(
    /table\s+className="w-full\s+text-left\s+text-xs\s+text-slate-300"/g,
    'table className="w-full text-left text-xs text-slate-800 dark:text-slate-200"'
  );
  content = content.replace(
    /hover:bg-slate-800\/40/g,
    'hover:bg-orange-50/50 dark:hover:bg-slate-800/50'
  );

  // 4. Secondary subtext text-slate-500 -> text-slate-600 dark:text-slate-400
  content = content.replace(
    /text-slate-500\s+text-\[11px\]/g,
    'text-slate-600 dark:text-slate-400 text-[11px] font-medium'
  );
  content = content.replace(
    /text-slate-400\s+text-xs/g,
    'text-slate-600 dark:text-slate-300 text-xs font-medium'
  );

  // 5. Pagination Footer bg-slate-950 -> bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300
  content = content.replace(
    /p-4\s+bg-slate-950\s+border-t\s+border-slate-800\s+flex\s+items-center\s+justify-between\s+text-xs\s+text-slate-400/g,
    'p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium'
  );

  // 6. Modal labels text-slate-300 -> text-slate-700 dark:text-slate-300
  content = content.replace(
    /label\s+className="block\s+text-slate-300\s+mb-1\s+font-semibold"/g,
    'label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold"'
  );
  content = content.replace(
    /label\s+className="block\s+text-slate-300\s+mb-1"/g,
    'label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold"'
  );

  // 7. Modal headers text-white -> text-slate-900 dark:text-white
  content = content.replace(
    /h2\s+className="text-lg\s+font-bold\s+text-white"/g,
    'h2 className="text-lg font-black text-slate-900 dark:text-white"'
  );

  // 8. Fix card background double classes if any
  content = content.replace(/border-slate-200\s+dark:border-slate-200\s+/g, 'border-slate-200 ');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalModifications++;
    console.log(`✓ Updated UI contrast in: ${path.basename(filePath)}`);
  } else {
    console.log(`  No changes needed in: ${path.basename(filePath)}`);
  }
});

console.log(`\nTotal standardized files: ${totalModifications}/${targetFiles.length}`);
