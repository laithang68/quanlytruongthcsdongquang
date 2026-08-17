const fs = require('fs');
const path = require('path');

const targetFiles = [
  'frontend/src/app/quan-tri/giao-vien/page.tsx',
  'frontend/src/app/quan-tri/nguoi-dung/page.tsx',
  'frontend/src/app/quan-tri/bai-viet/page.tsx',
  'frontend/src/app/quan-tri/thong-bao/page.tsx',
  'frontend/src/app/quan-tri/van-ban/page.tsx',
  'frontend/src/app/quan-tri/lop-hoc/page.tsx',
  'frontend/src/app/quan-tri/hoc-sinh/page.tsx',
  'frontend/src/app/quan-tri/phu-huynh/page.tsx',
  'frontend/src/app/quan-tri/video/page.tsx',
  'frontend/src/app/quan-tri/thu-vien-anh/page.tsx',
  'frontend/src/app/quan-tri/thu-vien-so/page.tsx',
  'frontend/src/app/quan-tri/hoat-dong/page.tsx',
  'frontend/src/app/quan-tri/to-chuyen-mon/page.tsx',
];

// SVG Icon Strings
const SVG = {
  edit: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
  eye: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`,
  trash: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
  lock: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`,
  unlock: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>`,
  key: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" /></svg>`,
  userCog: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
  send: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>`,
  check: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>`,
  eyeOff: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.03 10.03 0 013.987-.843c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-3.324-3.324a3 3 0 11-4.243-4.243m4.243 4.243L3 3l18 18" /></svg>`,
};

// 1. Process giao-vien/page.tsx
let f1 = 'frontend/src/app/quan-tri/giao-vien/page.tsx';
if (fs.existsSync(f1)) {
  let c = fs.readFileSync(f1, 'utf8');

  // Replace Xem button
  c = c.replace(
    /<button\s+onClick=\{\(\)\s*=>\s*\{\s*setSelectedItem\(item\);\s*setShowModalXem\(true\);\s*\}\}\s+className="px-3\s+py-1\.5\s+rounded-xl\s+bg-sky-600\s+hover:bg-sky-700\s+active:bg-sky-800\s+text-white\s+font-semibold\s+text-xs\s+transition-colors\s+duration-200\s+shadow-sm\s+focus-visible:outline-none\s+focus-visible:ring-2\s+focus-visible:ring-sky-500\s+inline-flex\s+items-center\s+gap-1\s+min-h-\[32px\]">\s*Xem\s*<\/button>/g,
    `<button title="Xem chi tiết" onClick={() => { setSelectedItem(item); setShowModalXem(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-slate-400">${SVG.eye}</button>`
  );

  // Replace Sửa button
  c = c.replace(
    /<button\s+onClick=\{\(\)\s*=>\s*openModalSua\(item\)\}\s+className="px-3\s+py-1\.5\s+rounded-xl\s+bg-indigo-600\s+hover:bg-indigo-700\s+active:bg-indigo-800\s+text-white\s+font-semibold\s+text-xs\s+transition-colors\s+duration-200\s+shadow-sm\s+focus-visible:outline-none\s+focus-visible:ring-2\s+focus-visible:ring-indigo-500\s+inline-flex\s+items-center\s+gap-1\s+min-h-\[32px\]">\s*Sửa\s*<\/button>/g,
    `<button title="Sửa thông tin" onClick={() => openModalSua(item)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );

  // Replace Xóa button
  c = c.replace(
    /<button\s+onClick=\{\(\)\s*=>\s*\{\s*setSelectedItem\(item\);\s*setShowModalXoa\(true\);\s*\}\}\s+className="px-2\.5\s+py-1\s+rounded\s+bg-rose-700\/80\s+hover:bg-rose-700\s+text-white">\s*Xóa\s*<\/button>/g,
    `<button title="Xóa giáo viên" onClick={() => { setSelectedItem(item); setShowModalXoa(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );

  fs.writeFileSync(f1, c, 'utf8');
  console.log('✓ Converted table row actions in giao-vien/page.tsx to clean icon buttons with tooltips');
}

// 2. Process nguoi-dung/page.tsx
let f2 = 'frontend/src/app/quan-tri/nguoi-dung/page.tsx';
if (fs.existsSync(f2)) {
  let c = fs.readFileSync(f2, 'utf8');

  // Sửa
  c = c.replace(
    /<button\s+onClick=\{\(\)\s*=>\s*openModalSua\(u\)\}\s+className="px-3\s+py-1\.5\s+rounded-xl\s+bg-indigo-600\s+hover:bg-indigo-700\s+active:bg-indigo-800\s+text-white\s+font-semibold\s+text-xs\s+transition-colors\s+duration-200\s+shadow-sm\s+focus-visible:outline-none\s+focus-visible:ring-2\s+focus-visible:ring-indigo-500\s+inline-flex\s+items-center\s+gap-1\s+min-h-\[32px\]">\s*Sửa\s*<\/button>/g,
    `<button title="Sửa thông tin người dùng" onClick={() => openModalSua(u)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );

  // Khóa / Mở khóa
  c = c.replace(
    /<button\s+onClick=\{\(\)\s*=>\s*openModalKhoa\(u\)\}\s+className={`px-3\s+py-1\.5\s+rounded-xl\s+text-white\s+font-semibold\s+text-xs\s+transition-colors\s+duration-200\s+shadow-sm\s+focus-visible:outline-none\s+focus-visible:ring-2\s+inline-flex\s+items-center\s+gap-1\s+min-h-\[32px\]\s+\${u\.trang_thai\s*\?\s*"bg-amber-600\s+hover:bg-amber-700\s+active:bg-amber-800\s+focus-visible:ring-amber-500"\s*:\s*"bg-emerald-600\s+hover:bg-emerald-700\s+active:bg-emerald-800\s+focus-visible:ring-emerald-500"}`}>\s*\{\s*u\.trang_thai\s*\?\s*'Khóa'\s*:\s*'Mở khóa'\s*\}\s*<\/button>/g,
    `<button title={u.trang_thai ? "Khóa tài khoản" : "Mở khóa tài khoản"} onClick={() => openModalKhoa(u)} className={\`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors shadow-sm focus-visible:ring-2 \${u.trang_thai ? "text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 hover:border-amber-200 focus-visible:ring-amber-500" : "text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 hover:border-emerald-200 focus-visible:ring-emerald-500"}\`}>{u.trang_thai ? ${JSON.stringify(SVG.lock)} : ${JSON.stringify(SVG.unlock)}}</button>`
  );

  // Vai trò
  c = c.replace(
    /<button\s+onClick=\{\(\)\s*=>\s*openModalGanVaiTro\(u\)\}\s+className="px-3\s+py-1\.5\s+rounded-xl\s+bg-violet-600\s+hover:bg-violet-700\s+active:bg-violet-800\s+text-white\s+font-semibold\s+text-xs\s+transition-colors\s+duration-200\s+shadow-sm\s+focus-visible:outline-none\s+focus-visible:ring-2\s+focus-visible:ring-violet-500\s+inline-flex\s+items-center\s+gap-1\s+min-h-\[32px\]">\s*Vai trò\s*<\/button>/g,
    `<button title="Phân quyền vai trò" onClick={() => openModalGanVaiTro(u)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-600 hover:border-purple-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-purple-500">${SVG.userCog}</button>`
  );

  // Mật khẩu
  c = c.replace(
    /<button\s+onClick=\{\(\)\s*=>\s*openModalDatLaiMatKhau\(u\)\}\s+className="px-3\s+py-1\.5\s+rounded-xl\s+bg-cyan-600\s+hover:bg-cyan-700\s+active:bg-cyan-800\s+text-white\s+font-semibold\s+text-xs\s+transition-colors\s+duration-200\s+shadow-sm\s+focus-visible:outline-none\s+focus-visible:ring-2\s+focus-visible:ring-cyan-500\s+inline-flex\s+items-center\s+gap-1\s+min-h-\[32px\]">\s*Mật khẩu\s*<\/button>/g,
    `<button title="Đặt lại mật khẩu" onClick={() => openModalDatLaiMatKhau(u)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:text-cyan-600 hover:border-cyan-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500">${SVG.key}</button>`
  );

  // Xóa
  c = c.replace(
    /<button\s+onClick=\{\(\)\s*=>\s*openModalXoa\(u\)\}\s+className="px-3\s+py-1\.5\s+rounded-xl\s+bg-rose-600\s+hover:bg-rose-700\s+active:bg-rose-800\s+text-white\s+font-semibold\s+text-xs\s+transition-colors\s+duration-200\s+shadow-sm\s+focus-visible:outline-none\s+focus-visible:ring-2\s+focus-visible:ring-rose-500\s+inline-flex\s+items-center\s+gap-1\s+min-h-\[32px\]">\s*Xóa\s*<\/button>/g,
    `<button title="Xóa người dùng" onClick={() => openModalXoa(u)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );

  fs.writeFileSync(f2, c, 'utf8');
  console.log('✓ Converted table row actions in nguoi-dung/page.tsx to clean icon buttons with tooltips');
}
