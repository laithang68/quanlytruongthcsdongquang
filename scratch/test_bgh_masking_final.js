const http = require('http');
const path = require('path');

const prismaPath = path.resolve(__dirname, '../backend/node_modules/@prisma/client');
const { PrismaClient } = require(prismaPath);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@127.0.0.1:5433/thcs_dong_quang?schema=public',
    },
  },
});

const BASE_URL = 'http://127.0.0.1:3001';

function makeRequest(pathStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BASE_URL);
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
  console.log('=== KIỂM THỬ TỰ ĐỘNG THÔNG TIN LIÊN HỆ PUBLIC BAN GIÁM HIỆU & SĐT MASKED ===\n');

  // 1. Chuẩn bị dữ liệu mẫu trong CSDL (1 Cán bộ BGH + 1 Giáo viên thường)
  console.log('1. Đang khởi tạo/cập nhật dữ liệu mẫu trong PostgreSQL...');

  const toList = await prisma.to_chuyen_mon.findMany();
  let toId = toList[0]?.id;
  if (!toId) {
    const newTo = await prisma.to_chuyen_mon.create({ data: { ten: 'Tổ BGH Test' } });
    toId = newTo.id;
  }

  // Upsert BGH Teacher Record
  const bghRecord = await prisma.giao_vien.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      ho_ten: 'Trần Văn Hiệu Trưởng',
      chuc_vu: 'Hiệu trưởng',
      trinh_do: 'Thạc sĩ Quản lý Giáo dục',
      so_dien_thoai: '0912345678',
      email: 'hieutruong@thcsdongquang.edu.vn',
      trang_thai: true,
      da_xoa: false,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      ho_ten: 'Trần Văn Hiệu Trưởng',
      chuc_vu: 'Hiệu trưởng',
      trinh_do: 'Thạc sĩ Quản lý Giáo dục',
      so_dien_thoai: '0912345678',
      email: 'hieutruong@thcsdongquang.edu.vn',
      to_chuyen_mon_id: toId,
      trang_thai: true,
      da_xoa: false,
    },
  });

  // Upsert Regular Teacher Record (Non-BGH)
  const regularRecord = await prisma.giao_vien.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      ho_ten: 'Lê Thị Giáo Viên',
      chuc_vu: 'Giáo viên Toán',
      trinh_do: 'Cử nhân Sư phạm',
      so_dien_thoai: '0987654321',
      email: 'giao_vien_toan@thcsdongquang.edu.vn',
      trang_thai: true,
      da_xoa: false,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      ho_ten: 'Lê Thị Giáo Viên',
      chuc_vu: 'Giáo viên Toán',
      trinh_do: 'Cử nhân Sư phạm',
      so_dien_thoai: '0987654321',
      email: 'giao_vien_toan@thcsdongquang.edu.vn',
      to_chuyen_mon_id: toId,
      trang_thai: true,
      da_xoa: false,
    },
  });

  console.log(' -> Tạo thành công dữ liệu mẫu BGH và Giáo viên thường.');

  // 2. Test Public API GET /api/v1/giao-vien/cong-khai
  console.log('\n2. Test Public API GET /api/v1/giao-vien/cong-khai...');
  const resList = await makeRequest('/api/v1/giao-vien/cong-khai');
  console.log(` -> GET /api/v1/giao-vien/cong-khai Status: ${resList.status}`);

  if (resList.status !== 200 || !resList.body.thanh_cong) {
    throw new Error('Test 2 thất bại: Public List API không trả về 200');
  }

  const list = resList.body.du_lieu || [];
  const bghPublic = list.find((i) => i.id === bghRecord.id);
  const regPublic = list.find((i) => i.id === regularRecord.id);

  if (!bghPublic) throw new Error('Không tìm thấy BGH trong Public API List');
  if (!regPublic) throw new Error('Không tìm thấy Giáo viên thường trong Public API List');

  console.log(' -> BGH Public Data:', {
    ho_ten: bghPublic.ho_ten,
    chuc_vu: bghPublic.chuc_vu,
    email: bghPublic.email,
    so_dien_thoai: bghPublic.so_dien_thoai,
  });

  // VERIFY MASKING 3 SỐ CUỐI CHO BGH
  if (bghPublic.so_dien_thoai !== '0912345***') {
    throw new Error(`FAIL: SĐT BGH phải là '0912345***', thực tế: '${bghPublic.so_dien_thoai}'`);
  }
  console.log(' -> PASSED SĐT MASKING BGH: SĐT Ban Giám hiệu được che 3 số cuối chuẩn xác (0912345***).');

  // VERIFY EMAIL HIỂN THỊ ĐẦY ĐỦ CHO BGH
  if (bghPublic.email !== 'hieutruong@thcsdongquang.edu.vn') {
    throw new Error(`FAIL: Email BGH không khớp. Thực tế: '${bghPublic.email}'`);
  }
  console.log(' -> PASSED EMAIL BGH: Email BGH hiển thị đầy đủ (hieutruong@thcsdongquang.edu.vn).');

  // VERIFY BẢO MẬT: RAW SĐT 0912345678 KHÔNG XUẤT HIỆN TRONG JSON
  if (resList.raw.includes('0912345678')) {
    throw new Error('SECURITY VIOLATION: Raw SĐT 0912345678 xuất hiện trong JSON Public API!');
  }
  console.log(' -> PASSED BẢO MẬT JSON: Raw SĐT 0912345678 KHÔNG BAO GIỜ có mặt trong Public JSON.');

  // VERIFY PRIVACY SHIELD GIÁO VIÊN THƯỜNG
  console.log(' -> Regular Teacher Public Data:', {
    ho_ten: regPublic.ho_ten,
    chuc_vu: regPublic.chuc_vu,
    email: regPublic.email,
    so_dien_thoai: regPublic.so_dien_thoai,
  });

  if (regPublic.email !== undefined || regPublic.so_dien_thoai !== undefined) {
    throw new Error('SECURITY VIOLATION: Giáo viên thường bị lộ email hoặc số điện thoại!');
  }
  console.log(' -> PASSED PRIVACY SHIELD: Giáo viên thường tuyệt đối không bị lộ Email hay SĐT.');

  // 3. Test Public Detail API GET /api/v1/giao-vien/cong-khai/:id
  console.log(`\n3. Test Public Detail API GET /api/v1/giao-vien/cong-khai/${bghRecord.id}...`);
  const resDetail = await makeRequest(`/api/v1/giao-vien/cong-khai/${bghRecord.id}`);
  console.log(` -> Status: ${resDetail.status}`);
  const detail = resDetail.body.du_lieu;

  if (detail.so_dien_thoai !== '0912345***' || detail.email !== 'hieutruong@thcsdongquang.edu.vn') {
    throw new Error('Test 3 thất bại: Detail API không trả đúng SĐT Masked hoặc Email cho BGH');
  }
  console.log(' -> PASSED DETAIL API BGH: Detail API trả về SĐT Masked (0912345***) & Email chính xác.');

  // 4. Kiểm tra CSDL PostgreSQL
  console.log('\n4. Kiểm tra dữ liệu trong CSDL PostgreSQL...');
  const dbRecord = await prisma.giao_vien.findUnique({ where: { id: bghRecord.id } });
  console.log(` -> Dữ liệu DB nguyên bản: so_dien_thoai = '${dbRecord.so_dien_thoai}'`);

  if (dbRecord.so_dien_thoai !== '0912345678') {
    throw new Error('FAIL: Dữ liệu trong CSDL đã bị ghi đè!');
  }
  console.log(' -> PASSED DATABASE INTEGRITY: CSDL giữ nguyên 0912345678 (ZERO DB CHANGE).');

  console.log('\n=== TẤT CẢ KIỂM THỬ BAN GIÁM HIỆU & SĐT MASKED ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests()
  .catch((err) => {
    console.error('LỖI KIỂM THỬ:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
