const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@127.0.0.1:5433/thcs_dong_quang?schema=public',
    },
  },
});

const BASE_URL = 'http://127.0.0.1:3001';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function runTests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG THÔNG TIN LIÊN HỆ PUBLIC BAN GIÁM HIỆU & MASKING SĐT ===\n');

  // 1. Chuẩn bị dữ liệu mẫu cho CSD L (1 Cán bộ Ban Giám hiệu + 1 Giáo viên thường)
  console.log('1. Cập nhật dữ liệu mẫu trong CSDL để test...');
  let toList = await prisma.to_chuyen_mon.findMany();
  let toId = toList[0]?.id;

  if (!toId) {
    const newTo = await prisma.to_chuyen_mon.create({
      data: { ten: 'Tổ BGH Test' },
    });
    toId = newTo.id;
  }

  // Cập nhật 1 GV thành Hiệu trưởng có Email + SĐT
  const hieuTruongDB = await prisma.giao_vien.findFirst({
    where: { chuc_vu: { contains: 'Hiệu trưởng', mode: 'insensitive' }, da_xoa: false },
  });

  let bghId = hieuTruongDB?.id;
  if (hieuTruongDB) {
    await prisma.giao_vien.update({
      where: { id: hieuTruongDB.id },
      data: {
        chuc_vu: 'Hiệu trưởng',
        so_dien_thoai: '0912345678',
        email: 'hieutruong@thcsdongquang.edu.vn',
        trang_thai: true,
      },
    });
  } else {
    const newBGH = await prisma.giao_vien.create({
      data: {
        ho_ten: 'Nguyễn Văn BGH',
        chuc_vu: 'Hiệu trưởng',
        trinh_do: 'Thạc sĩ Quản lý Giáo dục',
        so_dien_thoai: '0912345678',
        email: 'hieutruong@thcsdongquang.edu.vn',
        to_chuyen_mon_id: toId,
        trang_thai: true,
      },
    });
    bghId = newBGH.id;
  }

  // 2. Test Public API GET /api/v1/giao-vien/cong-khai
  console.log('\n2. Test GET /api/v1/giao-vien/cong-khai...');
  const resPublic = await makeRequest('/api/v1/giao-vien/cong-khai');
  console.log(` -> Status: ${resPublic.status}`);

  if (resPublic.status !== 200 || !resPublic.body.thanh_cong) {
    throw new Error('Test 2 thất bại: API public không phản hồi thành công');
  }

  const list = resPublic.body.du_lieu || [];
  const bghMember = list.find((item) => item.chuc_vu?.toLowerCase().includes('hiệu trưởng'));
  const regularTeacher = list.find((item) => !item.chuc_vu?.toLowerCase().includes('hiệu trưởng') && !item.chuc_vu?.toLowerCase().includes('bgh'));

  if (!bghMember) {
    throw new Error('Test 2 thất bại: Không tìm thấy thành viên Ban Giám hiệu trong response');
  }

  console.log(' -> Thông tin BGH nhận được từ Public API:', {
    ho_ten: bghMember.ho_ten,
    chuc_vu: bghMember.chuc_vu,
    email: bghMember.email,
    so_dien_thoai: bghMember.so_dien_thoai,
  });

  // Kiểm tra Masking SĐT Ban Giám hiệu
  if (bghMember.so_dien_thoai !== '0912345***') {
    throw new Error(`TEST FAIL: Số điện thoại BGH phải là '0912345***', thực tế nhận được: '${bghMember.so_dien_thoai}'`);
  }
  console.log(' -> PASSED: Số điện thoại BGH đã được che 3 số cuối tại Backend (0912345***).');

  // Kiểm tra Email Ban Giám hiệu
  if (bghMember.email !== 'hieutruong@thcsdongquang.edu.vn') {
    throw new Error(`TEST FAIL: Email BGH không khớp. Nhận được: '${bghMember.email}'`);
  }
  console.log(' -> PASSED: Email BGH hiển thị chính xác (hieutruong@thcsdongquang.edu.vn).');

  // Kiểm tra Raw Phone không bao giờ xuất hiện trong Response String
  if (resPublic.raw.includes('0912345678')) {
    throw new Error('SECURITY VIOLATION: Số điện thoại chưa che 0912345678 xuất hiện trong Public API Response JSON!');
  }
  console.log(' -> PASSED SECURITY: Public API Response KHÔNG BAO GIỜ chứa số điện thoại đầy đủ 0912345678.');

  // Kiểm tra Privacy Shield với Giáo viên thông thường
  if (regularTeacher) {
    if (regularTeacher.email !== undefined || regularTeacher.so_dien_thoai !== undefined) {
      throw new Error(`SECURITY VIOLATION: Giáo viên thường (${regularTeacher.ho_ten}) bị lộ email/SĐT!`);
    }
    console.log(` -> PASSED PRIVACY: Giáo viên thường (${regularTeacher.ho_ten}) được ẩn Email & SĐT 100%.`);
  }

  // 3. Test Public Detail API GET /api/v1/giao-vien/cong-khai/:id
  console.log(`\n3. Test GET /api/v1/giao-vien/cong-khai/${bghId}...`);
  const resDetail = await makeRequest(`/api/v1/giao-vien/cong-khai/${bghId}`);
  console.log(` -> Status: ${resDetail.status}`);
  const detail = resDetail.body.du_lieu;

  if (detail.so_dien_thoai !== '0912345***' || detail.email !== 'hieutruong@thcsdongquang.edu.vn') {
    throw new Error('Test 3 thất bại: Detail API không trả đúng SĐT Masked hoặc Email cho BGH');
  }
  console.log(' -> PASSED: Detail API BGH trả về SĐT Masked (0912345***) & Email chuẩn xác.');

  // 4. Kiểm tra CSDL PostgreSQL
  console.log('\n4. Kiểm tra dữ liệu gốc trong PostgreSQL...');
  const dbRecord = await prisma.giao_vien.findUnique({ where: { id: bghId } });
  console.log(` -> Dữ liệu DB: so_dien_thoai = '${dbRecord.so_dien_thoai}'`);
  if (dbRecord.so_dien_thoai !== '0912345678') {
    throw new Error('TEST FAIL: Dữ liệu CSDL đã bị sửa đổi!');
  }
  console.log(' -> PASSED DATABASE: Dữ liệu trong CSDL vẫn là 0912345678 nguyên bản (ZERO DB CHANGE).');

  console.log('\n=== TẤT CẢ TEST CASES CHO BAN GIÁM HIỆU & SĐT MASKED ĐÃ ĐẠT 100% ===\n');
}

runTests()
  .catch((err) => {
    console.error('LỖI KIỂM THỬ:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
