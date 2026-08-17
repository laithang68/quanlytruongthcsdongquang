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
  console.log('=== REGRESSION TEST E2E: ĐỒNG BỘ DỮ LIỆU ADMIN -> BACKEND -> PUBLIC WEBSITE ===\n');

  // 1. Tạo/Cập nhật Tổ chuyên môn và Cán bộ Ban Giám hiệu trực tiếp trong CSDL (mô phỏng thao tác Admin CRUD)
  console.log('1. Mô phỏng thao tác Admin CRUD trong CSDL...');
  const testToId = '00000000-0000-0000-0000-000000000099';
  const testGvId = '00000000-0000-0000-0000-000000000098';

  // Upsert Tổ chuyên môn
  const toRecord = await prisma.to_chuyen_mon.upsert({
    where: { id: testToId },
    update: {
      ten: 'Tổ KHTN Admin Sync Test',
      mo_ta: 'Tổ Chuyên môn Khoa học tự nhiên thử nghiệm đồng bộ Admin Public',
    },
    create: {
      id: testToId,
      ten: 'Tổ KHTN Admin Sync Test',
      mo_ta: 'Tổ Chuyên môn Khoa học tự nhiên thử nghiệm đồng bộ Admin Public',
    },
  });

  // Upsert Cán bộ BGH (Phó Hiệu trưởng)
  const gvRecord = await prisma.giao_vien.upsert({
    where: { id: testGvId },
    update: {
      ho_ten: 'Phan Văn Phó Hiệu Trưởng',
      chuc_vu: 'Phó Hiệu trưởng',
      trinh_do: 'Thạc sĩ Quản lý Giáo dục',
      so_dien_thoai: '0966778899',
      email: 'phohieutruong.sync@dongquang.edu.vn',
      anh_dai_dien: '/uploads/avatar_bgh.jpg',
      to_chuyen_mon_id: testToId,
      trang_thai: true,
      da_xoa: false,
    },
    create: {
      id: testGvId,
      ho_ten: 'Phan Văn Phó Hiệu Trưởng',
      chuc_vu: 'Phó Hiệu trưởng',
      trinh_do: 'Thạc sĩ Quản lý Giáo dục',
      so_dien_thoai: '0966778899',
      email: 'phohieutruong.sync@dongquang.edu.vn',
      anh_dai_dien: '/uploads/avatar_bgh.jpg',
      to_chuyen_mon_id: testToId,
      trang_thai: true,
      da_xoa: false,
    },
  });

  // Gán Tổ trưởng Chuyên môn
  await prisma.to_chuyen_mon.update({
    where: { id: testToId },
    data: { truong_to_id: testGvId },
  });

  console.log(' -> Mô phỏng Admin CRUD thành công!');

  // 2. Kiểm tra đồng bộ tức thì trên Public API Giáo viên GET /api/v1/giao-vien/cong-khai
  console.log('\n2. Kiểm tra đồng bộ dữ liệu trên Public API GET /api/v1/giao-vien/cong-khai...');
  const publicGvRes = await makeRequest('/api/v1/giao-vien/cong-khai');
  console.log(` -> Status: ${publicGvRes.status}`);

  const gvList = publicGvRes.body.du_lieu || [];
  const bghItem = gvList.find((item) => item.id === testGvId);

  if (!bghItem) {
    throw new Error('Test 2 thất bại: Cán bộ BGH mới tạo ở Admin không xuất hiện ở Public API!');
  }

  console.log(' -> Public BGH Data:', {
    ho_ten: bghItem.ho_ten,
    chuc_vu: bghItem.chuc_vu,
    trinh_do: bghItem.trinh_do,
    email: bghItem.email,
    so_dien_thoai: bghItem.so_dien_thoai,
  });

  // VERIFY MASKING 3 SỐ CUỐI
  if (bghItem.so_dien_thoai !== '0966778***') {
    throw new Error(`FAIL: Public SĐT BGH phải là '0966778***', thực tế: '${bghItem.so_dien_thoai}'`);
  }
  console.log(' -> PASSED SĐT MASKING BGH: SĐT che 3 số cuối chuẩn xác (0966778***).');

  // VERIFY EMAIL FULL
  if (bghItem.email !== 'phohieutruong.sync@dongquang.edu.vn') {
    throw new Error(`FAIL: Email BGH không khớp. Thực tế: '${bghItem.email}'`);
  }
  console.log(' -> PASSED EMAIL BGH: Email BGH hiển thị đầy đủ ở Public.');

  // VERIFY RAW PHONE NOT IN JSON
  if (publicGvRes.raw.includes('0966778899')) {
    throw new Error('SECURITY FAIL: Public API JSON lộ SĐT nguyên bản 0966778899!');
  }
  console.log(' -> PASSED SECURITY: Public API Response JSON KHÔNG CHỨA SĐT nguyên bản 0966778899.');

  // 3. Kiểm tra đồng bộ tức thì trên Public API Tổ Chuyên Môn GET /api/v1/to-chuyen-mon
  console.log('\n3. Kiểm tra đồng bộ trên Public API GET /api/v1/to-chuyen-mon...');
  const publicToRes = await makeRequest('/api/v1/to-chuyen-mon');
  const toList = publicToRes.body.du_lieu || [];
  const toItem = toList.find((item) => item.id === testToId);

  if (!toItem) {
    throw new Error('Test 3 thất bại: Tổ chuyên môn mới tạo ở Admin không xuất hiện ở Public!');
  }

  console.log(' -> Public Tổ Chuyên Môn Data:', {
    ten: toItem.ten,
    so_luong_giao_vien: toItem.so_luong_giao_vien,
    truong_to: toItem.truong_to?.ho_ten,
  });

  if (toItem.so_luong_giao_vien !== 1) {
    throw new Error(`FAIL: so_luong_giao_vien của tổ phải là 1, thực tế: ${toItem.so_luong_giao_vien}`);
  }
  if (toItem.truong_to?.ho_ten !== 'Phan Văn Phó Hiệu Trưởng') {
    throw new Error(`FAIL: Tên tổ trưởng không khớp, thực tế: '${toItem.truong_to?.ho_ten}'`);
  }
  console.log(' -> PASSED TỔ CHUYÊN MÔN SYNC: Số lượng giáo viên (1) và Tổ trưởng đồng bộ 100%.');

  // 4. Kiểm tra dữ liệu nguyên bản trong PostgreSQL
  console.log('\n4. Kiểm tra CSDL PostgreSQL...');
  const dbGv = await prisma.giao_vien.findUnique({ where: { id: testGvId } });
  if (dbGv.so_dien_thoai !== '0966778899') {
    throw new Error('FAIL: Dữ liệu CSDL bị thay đổi!');
  }
  console.log(' -> PASSED DATABASE INTEGRITY: CSDL giữ nguyên SĐT 0966778899 (ZERO DB CHANGE).');

  console.log('\n=== REGRESSION TEST E2E ADMIN -> PUBLIC ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests()
  .catch((err) => {
    console.error('LỖI KIỂM THỬ:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
