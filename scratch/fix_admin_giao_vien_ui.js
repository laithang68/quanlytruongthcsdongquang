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
];

targetFiles.forEach((filePath) => {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Fix + Thêm button to #E97036
  content = content.replace(
    /bg-emerald-600\s+hover:bg-emerald-500\s+text-white\s+font-medium\s+text-xs\s+transition\s+shadow-lg\s+shadow-emerald-600\/20/g,
    'bg-[#E97036] hover:bg-[#D85F25] active:bg-[#C94F1D] text-white font-extrabold text-xs transition-colors duration-200 shadow-sm'
  );
  content = content.replace(
    /bg-[#E97036]\s+hover:bg-[#d85f25]\s+text-white\s+rounded-xl\s+font-bold\s+transition\s+shadow-md/g,
    'bg-[#E97036] hover:bg-[#D85F25] active:bg-[#C94F1D] text-white font-extrabold text-xs transition-colors duration-200 shadow-sm rounded-xl'
  );

  // 2. Fix Search button ("Tìm kiếm", "Tìm") to #E97036
  content = content.replace(
    /className="w-full\s+py-2\.5\s+rounded-xl\s+bg-slate-800\s+hover:bg-slate-700\s+text-white\s+text-xs\s+font-medium\s+transition"/g,
    'className="w-full py-2.5 rounded-xl bg-[#E97036] hover:bg-[#D85F25] active:bg-[#C94F1D] text-white text-xs font-extrabold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97036]/50"'
  );
  content = content.replace(
    /className="px-4\s+py-2\s+bg-slate-800\s+hover:bg-slate-700\s+text-white\s+rounded-xl\s+font-semibold\s+transition"/g,
    'className="px-4 py-2 bg-[#E97036] hover:bg-[#D85F25] active:bg-[#C94F1D] text-white text-xs font-extrabold transition-colors duration-200 shadow-sm rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97036]/50"'
  );

  // 3. Fix Back / Navigation buttons ("← Tổng quan", "Quản lý Tổ chuyên môn →")
  content = content.replace(
    /className="px-4\s+py-2\.5\s+rounded-xl\s+bg-slate-800\s+hover:bg-slate-700\s+text-slate-200\s+font-medium\s+text-xs\s+border\s+border-slate-700\s+transition"/g,
    'className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-extrabold text-xs border border-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"'
  );

  // 4. Fix Inputs & Selects hardcoded dark background
  content = content.replace(
    /className="w-full\s+px-3\.5\s+py-2\.5\s+rounded-xl\s+bg-slate-950\s+border\s+border-slate-200\s+dark:border-slate-800\s+text-white\s+placeholder-slate-500\s+focus:outline-none\s+focus:border-blue-500\s+text-xs"/g,
    'className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-semibold text-xs transition-colors"'
  );
  content = content.replace(
    /className="w-full\s+px-3\.5\s+py-2\.5\s+rounded-xl\s+bg-slate-950\s+border\s+border-slate-200\s+dark:border-slate-800\s+text-white\s+focus:outline-none\s+focus:border-blue-500\s+text-xs"/g,
    'className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-semibold text-xs transition-colors"'
  );

  // 5. Fix Table Header text readability on white admin card
  content = content.replace(
    /thead\s+className="bg-slate-950\s+border-b\s+border-slate-200\s+dark:border-slate-800\s+uppercase\s+tracking-wider\s+text-slate-600\s+dark:text-slate-400\s+font-semibold"/g,
    'thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-900 dark:text-slate-100 font-extrabold"'
  );

  // 6. Fix Pagination Buttons (Eliminate opacity-40 causing unreadable text!)
  content = content.replace(
    /disabled:opacity-40\s+px-3\.5\s+py-1\.5\s+rounded-xl\s+bg-white\s+dark:bg-slate-800\s+text-slate-800\s+dark:text-slate-200\s+border\s+border-slate-300\s+dark:border-slate-700\s+hover:bg-slate-100\s+dark:hover:bg-slate-700\s+font-extrabold\s+focus-visible:outline-none\s+focus-visible:ring-2\s+focus-visible:ring-\[#E97036\]/g,
    'disabled:bg-slate-200 disabled:dark:bg-slate-800/50 disabled:text-slate-500 disabled:dark:text-slate-400 disabled:border-slate-300 disabled:dark:border-slate-700 disabled:cursor-not-allowed px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-extrabold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97036]'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated UI contrast in: ${path.basename(filePath)}`);
  } else {
    console.log(`  No changes needed in: ${path.basename(filePath)}`);
  }
});
