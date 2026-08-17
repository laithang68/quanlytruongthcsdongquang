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

const SVG_ICONS = {
  eye: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`,
  edit: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
  trash: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
  lock: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`,
  unlock: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>`,
  key: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" /></svg>`,
  userCog: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
  send: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>`,
  check: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>`,
  xCircle: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  globe: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7a2 2 0 00-2-2h-1.5a2 2 0 01-2-2v-.935" /></svg>`,
  eyeOff: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.03 10.03 0 013.987-.843c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-3.324-3.324a3 3 0 11-4.243-4.243m4.243 4.243L3 3l18 18" /></svg>`,
};

targetFiles.forEach((filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Remove font-extrabold / font-black across UI, replace with font-semibold
  content = content.replace(/font-extrabold/g, 'font-semibold');
  content = content.replace(/font-black/g, 'font-bold');

  // 2. Table Headers clean styling
  content = content.replace(
    /thead\s+className="bg-slate-100\s+dark:bg-slate-800\/80\s+border-b\s+border-slate-200\s+dark:border-slate-800\s+uppercase\s+tracking-wider\s+text-slate-900\s+dark:text-slate-100\s+font-semibold"/g,
    'thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold text-[11px]"'
  );

  // 3. Search inputs & select box refinement
  content = content.replace(
    /className="w-full\s+px-3\.5\s+py-2\.5\s+rounded-xl\s+bg-white\s+dark:bg-slate-950\s+text-slate-900\s+dark:text-white\s+border\s+border-slate-300\s+dark:border-slate-700\s+placeholder:text-slate-500\s+dark:placeholder:text-slate-400\s+focus:outline-none\s+focus:border-\[#E97036\]\s+focus:ring-2\s+focus:ring-\[#E97036\]\/20\s+font-semibold\s+text-xs\s+transition-colors"/g,
    'className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"'
  );
  content = content.replace(
    /className="w-full\s+px-3\.5\s+py-2\.5\s+rounded-xl\s+bg-white\s+dark:bg-slate-950\s+text-slate-900\s+dark:text-white\s+border\s+border-slate-300\s+dark:border-slate-700\s+focus:outline-none\s+focus:border-\[#E97036\]\s+focus:ring-2\s+focus:ring-\[#E97036\]\/20\s+font-semibold\s+text-xs\s+transition-colors"/g,
    'className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"'
  );

  // 4. Primary buttons (+ Thêm, Tìm kiếm)
  content = content.replace(
    /bg-\[#E97036\]\s+hover:bg-\[#D85F25\]\s+active:bg-\[#C94F1D\]\s+text-white\s+text-xs\s+font-semibold\s+transition-colors\s+duration-200\s+shadow-sm\s+rounded-xl/g,
    'bg-[#E97036] hover:bg-[#D85F25] text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-colors'
  );

  // 5. Back buttons (Navigation links)
  content = content.replace(
    /className="px-4\s+py-2\.5\s+rounded-xl\s+bg-slate-800\s+hover:bg-slate-700\s+active:bg-slate-900\s+text-white\s+font-semibold\s+text-xs\s+border\s+border-slate-700\s+transition-colors\s+duration-200\s+focus-visible:outline-none\s+focus-visible:ring-2\s+focus-visible:ring-slate-500"/g,
    'className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"'
  );

  // 6. Action cell container alignment
  content = content.replace(
    /className="p-4\s+text-right\s+whitespace-nowrap\s+flex\s+items-center\s+justify-end\s+gap-2\s+flex-wrap"/g,
    'className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5"'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Cleaned typography & layout in: ${path.basename(filePath)}`);
  }
});
