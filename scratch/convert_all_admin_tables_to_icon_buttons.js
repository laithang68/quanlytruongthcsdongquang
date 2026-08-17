const fs = require('fs');
const path = require('path');

const SVG = {
  edit: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
  eye: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`,
  trash: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
  lock: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`,
  unlock: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>`,
};

// 1. hoc-sinh
let fHocSinh = 'frontend/src/app/quan-tri/hoc-sinh/page.tsx';
if (fs.existsSync(fHocSinh)) {
  let c = fs.readFileSync(fHocSinh, 'utf8');
  c = c.replace(
    /className="px-2\s+py-1\s+rounded\s+bg-blue-600\/80\s+hover:bg-blue-600\s+text-white">\s*Sửa\s*<\/button>/g,
    `title="Sửa thông tin học sinh" className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );
  c = c.replace(
    /className="px-2\s+py-1\s+rounded\s+bg-rose-700\/80\s+hover:bg-rose-700\s+text-white">\s*Xóa\s*<\/button>/g,
    `title="Xóa học sinh" className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );
  c = c.replace(
    /className="p-4\s+text-right\s+space-x-2"/g,
    'className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5"'
  );
  fs.writeFileSync(fHocSinh, c, 'utf8');
  console.log('✓ Converted hoc-sinh action buttons');
}

// 2. lop-hoc
let fLopHoc = 'frontend/src/app/quan-tri/lop-hoc/page.tsx';
if (fs.existsSync(fLopHoc)) {
  let c = fs.readFileSync(fLopHoc, 'utf8');
  c = c.replace(
    /<button([^>]*?)openModalSua([^>]*?)>\s*Sửa\s*<\/button>/g,
    `<button title="Sửa thông tin lớp học" $1openModalSua$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );
  c = c.replace(
    /<button([^>]*?)setShowModalXoa([^>]*?)>\s*Xóa\s*<\/button>/g,
    `<button title="Xóa lớp học" $1setShowModalXoa$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );
  c = c.replace(
    /className="p-4\s+text-right\s+space-x-2"/g,
    'className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5"'
  );
  fs.writeFileSync(fLopHoc, c, 'utf8');
  console.log('✓ Converted lop-hoc action buttons');
}

// 3. phu-huynh
let fPhuHuynh = 'frontend/src/app/quan-tri/phu-huynh/page.tsx';
if (fs.existsSync(fPhuHuynh)) {
  let c = fs.readFileSync(fPhuHuynh, 'utf8');
  c = c.replace(
    /<button([^>]*?)openModalSua([^>]*?)>\s*Sửa\s*<\/button>/g,
    `<button title="Sửa thông tin phụ huynh" $1openModalSua$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );
  c = c.replace(
    /<button([^>]*?)setShowModalXoa([^>]*?)>\s*Xóa\s*<\/button>/g,
    `<button title="Xóa phụ huynh" $1setShowModalXoa$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );
  c = c.replace(
    /className="p-4\s+text-right\s+space-x-2"/g,
    'className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5"'
  );
  fs.writeFileSync(fPhuHuynh, c, 'utf8');
  console.log('✓ Converted phu-huynh action buttons');
}

// 4. to-chuyen-mon
let fToChuyenMon = 'frontend/src/app/quan-tri/to-chuyen-mon/page.tsx';
if (fs.existsSync(fToChuyenMon)) {
  let c = fs.readFileSync(fToChuyenMon, 'utf8');
  c = c.replace(
    /<button([^>]*?)openModalSua([^>]*?)>\s*Sửa\s*<\/button>/g,
    `<button title="Sửa tổ chuyên môn" $1openModalSua$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );
  c = c.replace(
    /<button([^>]*?)setShowModalXoa([^>]*?)>\s*Xóa\s*<\/button>/g,
    `<button title="Xóa tổ chuyên môn" $1setShowModalXoa$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );
  c = c.replace(
    /className="p-4\s+text-right\s+space-x-2"/g,
    'className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5"'
  );
  fs.writeFileSync(fToChuyenMon, c, 'utf8');
  console.log('✓ Converted to-chuyen-mon action buttons');
}

// 5. video
let fVideo = 'frontend/src/app/quan-tri/video/page.tsx';
if (fs.existsSync(fVideo)) {
  let c = fs.readFileSync(fVideo, 'utf8');
  c = c.replace(
    /<button([^>]*?)openModalSua([^>]*?)>\s*Sửa\s*<\/button>/g,
    `<button title="Sửa thông tin video" $1openModalSua$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );
  c = c.replace(
    /<button([^>]*?)setShowModalXoa([^>]*?)>\s*Xóa\s*<\/button>/g,
    `<button title="Xóa video" $1setShowModalXoa$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );
  c = c.replace(
    /className="p-4\s+text-right\s+space-x-2"/g,
    'className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5"'
  );
  fs.writeFileSync(fVideo, c, 'utf8');
  console.log('✓ Converted video action buttons');
}

// 6. thu-vien-anh
let fThuVienAnh = 'frontend/src/app/quan-tri/thu-vien-anh/page.tsx';
if (fs.existsSync(fThuVienAnh)) {
  let c = fs.readFileSync(fThuVienAnh, 'utf8');
  c = c.replace(
    /<button([^>]*?)openModalSua([^>]*?)>\s*Sửa\s*<\/button>/g,
    `<button title="Sửa album ảnh" $1openModalSua$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );
  c = c.replace(
    /<button([^>]*?)setShowModalXoa([^>]*?)>\s*Xóa\s*<\/button>/g,
    `<button title="Xóa album ảnh" $1setShowModalXoa$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );
  c = c.replace(
    /className="p-4\s+text-right\s+space-x-2"/g,
    'className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5"'
  );
  fs.writeFileSync(fThuVienAnh, c, 'utf8');
  console.log('✓ Converted thu-vien-anh action buttons');
}

// 7. thu-vien-so
let fThuVienSo = 'frontend/src/app/quan-tri/thu-vien-so/page.tsx';
if (fs.existsSync(fThuVienSo)) {
  let c = fs.readFileSync(fThuVienSo, 'utf8');
  c = c.replace(
    /<button([^>]*?)openModalSua([^>]*?)>\s*Sửa\s*<\/button>/g,
    `<button title="Sửa tài liệu thư viện số" $1openModalSua$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );
  c = c.replace(
    /<button([^>]*?)setShowModalXoa([^>]*?)>\s*Xóa\s*<\/button>/g,
    `<button title="Xóa tài liệu" $1setShowModalXoa$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );
  c = c.replace(
    /className="p-4\s+text-right\s+space-x-2"/g,
    'className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5"'
  );
  fs.writeFileSync(fThuVienSo, c, 'utf8');
  console.log('✓ Converted thu-vien-so action buttons');
}

// 8. hoat-dong
let fHoatDong = 'frontend/src/app/quan-tri/hoat-dong/page.tsx';
if (fs.existsSync(fHoatDong)) {
  let c = fs.readFileSync(fHoatDong, 'utf8');
  c = c.replace(
    /<button([^>]*?)openModalSua([^>]*?)>\s*Sửa\s*<\/button>/g,
    `<button title="Sửa hoạt động" $1openModalSua$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">${SVG.edit}</button>`
  );
  c = c.replace(
    /<button([^>]*?)setShowModalXoa([^>]*?)>\s*Xóa\s*<\/button>/g,
    `<button title="Xóa hoạt động" $1setShowModalXoa$2 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500">${SVG.trash}</button>`
  );
  c = c.replace(
    /className="p-4\s+text-right\s+space-x-2"/g,
    'className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5"'
  );
  fs.writeFileSync(fHoatDong, c, 'utf8');
  console.log('✓ Converted hoat-dong action buttons');
}
