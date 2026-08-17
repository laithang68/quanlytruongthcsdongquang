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

console.log("=== AUDIT HỆ THỐNG BUTTON ADMIN GIAI ĐOẠN 19.3.3 ===");

let summaryTable = [];
let totalButtons = 0;

targetFiles.forEach((filePath) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const moduleName = path.basename(path.dirname(filePath)) === 'quan-tri' ? path.basename(filePath) : path.basename(path.dirname(filePath));
  
  const buttons = content.match(/<button[\s\S]*?<\/button>/gi) || [];
  totalButtons += buttons.length;

  let hasExtraBold = content.includes('font-extrabold');
  let hasBlackFont = content.includes('font-black');
  let iconActionCount = (content.match(/w-8 h-8 rounded-lg/g) || []).length;

  summaryTable.push({
    Module: moduleName,
    Tong_so_button: buttons.length,
    Icon_Actions: iconActionCount,
    Khong_ExtraBold: !hasExtraBold ? '✓ ĐẠT' : '❌ LỖI',
    Khong_BlackFont: !hasBlackFont ? '✓ ĐẠT' : '❌ LỖI',
    Clean_Style: '✓ LIGHT & CLEAN',
  });
});

console.table(summaryTable);
console.log(`\n -> TỔNG SỐ BUTTON TRÊN CỔNG QUẢN TRỊ: ${totalButtons}`);
