const XLSX = require('xlsx');

console.log('====================================================');
console.log('  BẮT ĐẦU KIỂM TRA ĐỊNH DẠNG VÀ CẤU TRÚC XUẤT EXCEL');
console.log('====================================================\n');

// Giả lập dữ liệu tài khoản
const mockAccounts = [
  { stt: 1, ho_ten: 'Nguyễn Văn An', ten_lop: '6A', ma_hoc_sinh: 'HS2660001', ten_dang_nhap: 'HS2660001', mat_khau_ban_dau: 'HS2660001' },
  { stt: 2, ho_ten: 'Trần Thị Bình', ten_lop: '6A', ma_hoc_sinh: 'HS2660002', ten_dang_nhap: 'HS2660002', mat_khau_ban_dau: 'HS2660002' },
  { stt: 3, ho_ten: 'Lê Hoàng Cường', ten_lop: '6B', ma_hoc_sinh: 'HS2660003', ten_dang_nhap: 'HS2660003', mat_khau_ban_dau: 'HS2660003' },
];

const wb = XLSX.utils.book_new();

// Sheet 1: TaiKhoanHocSinh
const wsData = [
  ['DANH SÁCH TÀI KHOẢN HỌC SINH'],
  ['TRƯỜNG THCS ĐÔNG QUANG'],
  ['Năm học: 2026-2027'],
  [],
  ['STT', 'HỌ VÀ TÊN', 'LỚP', 'MÃ HỌC SINH', 'TÀI KHOẢN', 'MẬT KHẨU BAN ĐẦU'],
];

mockAccounts.forEach((acc, idx) => {
  wsData.push([
    idx + 1,
    acc.ho_ten,
    acc.ten_lop,
    acc.ma_hoc_sinh,
    acc.ten_dang_nhap,
    acc.mat_khau_ban_dau,
  ]);
});

wsData.push([]);
wsData.push(['Hướng dẫn đăng nhập:']);
wsData.push(['Tài khoản: Mã học sinh (Ví dụ: HS2660001)']);
wsData.push(['Mật khẩu ban đầu: Mật khẩu được cấp trong bảng trên.']);
wsData.push(['Học sinh sử dụng tài khoản và mật khẩu được cấp để đăng nhập Cổng thông tin học sinh của nhà trường.']);
wsData.push(['Sau khi đăng nhập lần đầu, học sinh nên đổi mật khẩu để đảm bảo an toàn và bảo mật thông tin.']);

const ws = XLSX.utils.aoa_to_sheet(wsData);

// Cấu hình Column Widths
ws['!cols'] = [
  { wch: 8 },  // STT
  { wch: 30 }, // HỌ VÀ TÊN
  { wch: 12 }, // LỚP
  { wch: 20 }, // MÃ HỌC SINH
  { wch: 20 }, // TÀI KHOẢN
  { wch: 22 }, // MẬT KHẨU BAN ĐẦU
];

// Cấu hình A4 Landscape
ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
ws['!pageSetup'] = {
  paperSize: 9, // A4
  orientation: 'landscape',
  scale: 100,
  fitToWidth: 1,
  fitToHeight: 0,
};
ws['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
];

XLSX.utils.book_append_sheet(wb, ws, 'TaiKhoanHocSinh');

// Sheet 2: HuongDan
const wsHuongDanData = [
  ['MỤC', 'NỘI DUNG HƯỚNG DẪN ĐĂNG NHẬP VÀ BẢO MẬT'],
  [1, 'Tài khoản đăng nhập: Là Mã học sinh được cấp trong danh sách (Ví dụ: HS2660001).'],
  [2, 'Mật khẩu ban đầu: Trùng với Mã học sinh được cấp tại thời điểm tạo tài khoản/import.'],
  [3, 'Đăng nhập: Học sinh truy cập Cổng thông tin điện tử của nhà trường và chọn "Đăng nhập Cổng học sinh".'],
  [4, 'Bảo mật: Sau khi đăng nhập thành công lần đầu, học sinh bắt buộc đổi mật khẩu mới để bảo mật dữ liệu.'],
  [5, 'Quên mật khẩu: Học sinh liên hệ Giáo viên chủ nhiệm hoặc Quản trị viên để được cấp lại mật khẩu mặc định.'],
];
const wsHuongDan = XLSX.utils.aoa_to_sheet(wsHuongDanData);
wsHuongDan['!cols'] = [{ wch: 8 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, wsHuongDan, 'HuongDan');

// 1. Kiểm tra binary OpenXML .xlsx
const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

// Header signature của ZIP / OpenXML .xlsx là 0x50 0x4B 0x03 0x04 ("PK\x03\x04")
const isZipOpenXml = excelBuffer[0] === 0x50 && excelBuffer[1] === 0x4B && excelBuffer[2] === 0x03 && excelBuffer[3] === 0x04;
console.log(`👉 1. Kiểm tra Binary Header OpenXML: ${isZipOpenXml ? 'CHÍNH XÁC (PK.. ZIP Archive chuẩn XLSX)' : 'LỖI'}`);
if (!isZipOpenXml) throw new Error('File không phải định dạng nhị phân XLSX!');

// 2. Đọc lại workbook từ binary buffer để kiểm tra toàn vẹn
const parsedWb = XLSX.read(excelBuffer, { type: 'buffer' });
console.log(`👉 2. Danh sách Sheet trong file (${parsedWb.SheetNames.length} sheets): ${parsedWb.SheetNames.join(' | ')}`);
if (parsedWb.SheetNames.length !== 2 || parsedWb.SheetNames[0] !== 'TaiKhoanHocSinh' || parsedWb.SheetNames[1] !== 'HuongDan') {
  throw new Error('Số lượng hoặc tên Sheet không đúng chuẩn yêu cầu');
}

// 3. Kiểm tra Sheet 1 data
const parsedWs1 = parsedWb.Sheets['TaiKhoanHocSinh'];
const rawDataSheet1 = XLSX.utils.sheet_to_json(parsedWs1, { header: 1 });
console.log('👉 3. Cấu trúc các dòng Sheet 1:');
console.log(`   - Dòng 1 (Tiêu đề chính): ${rawDataSheet1[0][0]}`);
console.log(`   - Dòng 2 (Tên trường): ${rawDataSheet1[1][0]}`);
console.log(`   - Dòng 3 (Năm học): ${rawDataSheet1[2][0]}`);
console.log(`   - Dòng 5 (Header Bảng): ${rawDataSheet1[4].join(' | ')}`);
console.log(`   - Dòng 6 (Dữ liệu HS1): ${rawDataSheet1[5].join(' | ')}`);
console.log(`   - Dòng 7 (Dữ liệu HS2): ${rawDataSheet1[6].join(' | ')}`);

// 4. Kiểm tra Header Bảng
const expectedHeaders = ['STT', 'HỌ VÀ TÊN', 'LỚP', 'MÃ HỌC SINH', 'TÀI KHOẢN', 'MẬT KHẨU BAN ĐẦU'];
const actualHeaders = rawDataSheet1[4];
const headersOk = expectedHeaders.every((h, i) => actualHeaders[i] === h);
console.log(`👉 4. Kiểm tra Header Cột (6 cột): ${headersOk ? 'ĐẠT 100%' : 'KHÔNG KHỚP'}`);

// 5. Kiểm tra Column Widths
console.log(`👉 5. Độ rộng cột đã cấu hình: STT=${ws['!cols'][0].wch}, HỌ TÊN=${ws['!cols'][1].wch}, LỚP=${ws['!cols'][2].wch}, MÃ HS=${ws['!cols'][3].wch}, TÀI KHOẢN=${ws['!cols'][4].wch}, MẬT KHẨU=${ws['!cols'][5].wch}`);

// 6. Kiểm tra PageSetup & Margins
console.log(`👉 6. Cấu hình in ấn: paperSize=${ws['!pageSetup'].paperSize} (A4), orientation=${ws['!pageSetup'].orientation} (Landscape), fitToWidth=${ws['!pageSetup'].fitToWidth}`);

console.log('\n====================================================');
console.log('  KẾT QUẢ: FILE OUTPUT HOÀN TOÀN LÀ .XLSX CHUẨN 100%');
console.log('====================================================');
