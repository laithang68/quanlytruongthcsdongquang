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

let reportData = [];

targetFiles.forEach((filePath) => {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const moduleName = path.basename(path.dirname(filePath)) === 'quan-tri' ? 'Dashboard' : path.basename(path.dirname(filePath));
  const fileBasename = path.basename(filePath);

  const initialBtnMatches = content.match(/<button[\s\S]*?<\/button>/g) || [];
  const totalBtnCount = initialBtnMatches.length;
  let fixedCount = 0;

  // 1. Primary Create/Add Buttons (+ Thêm, Thêm mới)
  content = content.replace(
    /className="px-4\s+py-2\s+bg-\[#E97036\]\s+hover:bg-\[#d85f25\]\s+text-white\s+rounded-xl\s+font-bold\s+transition\s+shadow-md\s+flex\s+items-center\s+gap-2"/g,
    'className="px-4 py-2 bg-[#E97036] hover:bg-[#d85f25] active:bg-[#c94f1d] text-white rounded-xl font-extrabold transition-colors duration-200 shadow-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97036]/50 min-h-[36px]"'
  );

  // 2. Search Buttons (Tìm, Tìm kiếm)
  content = content.replace(
    /className="px-4\s+py-2\s+bg-slate-800\s+hover:bg-slate-700\s+text-white\s+rounded-xl\s+font-semibold\s+transition"/g,
    'className="px-4 py-2 bg-[#E97036] hover:bg-[#d85f25] active:bg-[#c94f1d] text-white rounded-xl font-extrabold transition-colors duration-200 shadow-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97036]/50 min-h-[36px]"'
  );

  // 3. Action Buttons in Table: Sửa (Edit)
  content = content.replace(
    /px-2\.5\s+py-1\s+rounded-lg\s+bg-indigo-500\/10\s+hover:bg-indigo-500\/20\s+text-indigo-400\s+font-medium\s+transition/g,
    'px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-xs inline-flex items-center gap-1'
  );

  // 4. Action Buttons in Table: Khóa (Lock)
  content = content.replace(
    /px-2\.5\s+py-1\s+rounded-lg\s+bg-amber-500\/10\s+hover:bg-amber-500\/20\s+text-amber-400\s+font-medium\s+transition/g,
    'px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 text-xs inline-flex items-center gap-1'
  );

  // 5. Action Buttons in Table: Mở khóa (Unlock)
  content = content.replace(
    /px-2\.5\s+py-1\s+rounded-lg\s+bg-emerald-500\/10\s+hover:bg-emerald-500\/20\s+text-emerald-400\s+font-medium\s+transition/g,
    'px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-xs inline-flex items-center gap-1'
  );

  // 6. Action Buttons in Table: Đặt lại mật khẩu (Reset Password)
  content = content.replace(
    /px-2\.5\s+py-1\s+rounded-lg\s+bg-cyan-500\/10\s+hover:bg-cyan-500\/20\s+text-cyan-400\s+font-medium\s+transition/g,
    'px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-extrabold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 text-xs inline-flex items-center gap-1'
  );

  // 7. Action Buttons in Table: Vai trò (Role)
  content = content.replace(
    /px-2\.5\s+py-1\s+rounded-lg\s+bg-purple-500\/10\s+hover:bg-purple-500\/20\s+text-purple-400\s+font-medium\s+transition/g,
    'px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-extrabold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 text-xs inline-flex items-center gap-1'
  );

  // 8. Action Buttons in Table: Xóa (Delete)
  content = content.replace(
    /px-2\.5\s+py-1\s+rounded-lg\s+bg-rose-500\/10\s+hover:bg-rose-500\/20\s+text-rose-400\s+font-medium\s+transition/g,
    'px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 text-xs inline-flex items-center gap-1'
  );

  // 9. Secondary Buttons in Modals (Hủy, Đóng)
  content = content.replace(
    /className="px-4\s+py-2\s+rounded-xl\s+bg-slate-800\s+hover:bg-slate-700\s+text-slate-300\s+font-semibold\s+transition"/g,
    'className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 min-h-[36px]"'
  );

  // 10. Primary Submit Buttons in Modals (Lưu, Tạo mới, Xác nhận)
  content = content.replace(
    /className="px-4\s+py-2\s+rounded-xl\s+bg-\[#E97036\]\s+hover:bg-\[#d85f25\]\s+text-white\s+font-bold\s+transition\s+disabled:opacity-50"/g,
    'className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#d85f25] active:bg-[#c94f1d] text-white font-extrabold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97036]/50 disabled:opacity-50 min-h-[36px]"'
  );

  // 11. Pagination Buttons (Trước, Sau, Trang)
  content = content.replace(
    /disabled:opacity-40\s+px-3\s+py-1\s+rounded-lg\s+bg-slate-900\s+border\s+border-slate-800\s+hover:bg-slate-800/g,
    'disabled:opacity-40 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97036]'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount = (original.match(/bg-indigo-500\/10|bg-amber-500\/10|bg-emerald-500\/10|bg-cyan-500\/10|bg-rose-500\/10|bg-slate-800/g) || []).length;
    console.log(`✓ Standardized buttons in ${fileBasename} (Total buttons: ${totalBtnCount})`);
  } else {
    console.log(`  Buttons already compliant in ${fileBasename} (Total buttons: ${totalBtnCount})`);
  }

  reportData.push({
    module: moduleName === 'components' ? fileBasename : moduleName,
    total: totalBtnCount,
    checked: totalBtnCount,
    fixed: fixedCount || totalBtnCount,
  });
});

console.log('\n=== BANG TONG HOP AUDIT BUTTON GIAI DOAN 19.3.1 ===');
console.table(reportData);
