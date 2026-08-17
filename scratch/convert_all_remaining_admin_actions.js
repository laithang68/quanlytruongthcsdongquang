const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/app/quan-tri/hoc-sinh/page.tsx',
  'frontend/src/app/quan-tri/lop-hoc/page.tsx',
  'frontend/src/app/quan-tri/phu-huynh/page.tsx',
  'frontend/src/app/quan-tri/thu-vien-anh/page.tsx',
  'frontend/src/app/quan-tri/thu-vien-so/page.tsx',
  'frontend/src/app/quan-tri/to-chuyen-mon/page.tsx',
  'frontend/src/app/quan-tri/video/page.tsx',
  'frontend/src/app/quan-tri/hoat-dong/page.tsx',
];

const SVG = {
  edit: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
  eye: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`,
  trash: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
  lock: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`,
  unlock: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>`,
};

files.forEach((f) => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  let original = c;

  // Replace text buttons "Xem"
  c = c.replace(
    /<button([^>]*?)>\s*Xem\s*<\/button>/gi,
    (match, attrs) => {
      if (match.includes('w-8 h-8')) return match;
      return `<button title="Xem chi tiết" ${attrs} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-slate-400">${SVG.eye}</button>`;
    }
  );

  // Replace text buttons "Sửa"
  c = c.replace(
    /<button([^>]*?)>\s*Sửa\s*<\/button>/gi,
    (match, attrs) => {
      if (match.includes('w-8 h-8')) return match;
      return `<button title="Sửa thông tin" ${attrs} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`;
    }
  );

  // Replace text buttons "Xóa"
  c = c.replace(
    /<button([^>]*?)>\s*Xóa\s*<\/button>/gi,
    (match, attrs) => {
      if (match.includes('w-8 h-8')) return match;
      return `<button title="Xóa bản ghi" ${attrs} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`;
    }
  );

  if (c !== original) {
    fs.writeFileSync(f, c, 'utf8');
    console.log(`✓ Converted action buttons in ${path.basename(path.dirname(f))}/${path.basename(f)}`);
  }
});
