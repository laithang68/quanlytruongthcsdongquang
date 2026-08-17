const http = require('http');

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
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 15.2 (LIST HỒ SƠ GIÁO VIÊN & TỔ CHUYÊN MÔN TRANG CHỦ) ===\n');

  // 1. Kiểm thử Public API Giáo viên cho giao diện List Profile
  console.log('1. Test Public API Giáo Viên (/api/v1/giao-vien/cong-khai)...');
  const resGV = await makeRequest('/api/v1/giao-vien/cong-khai');
  console.log(` -> Status: ${resGV.status}, Số lượng GV: ${resGV.body.du_lieu?.length || 0}`);

  if (resGV.status !== 200 || !resGV.body.thanh_cong) {
    throw new Error('Test 1 thất bại: Không lấy được danh sách giáo viên công khai');
  }

  const gvList = resGV.body.du_lieu || [];
  const bghMember = gvList.find(
    (gv) =>
      gv.chuc_vu?.toLowerCase().includes('hiệu trưởng') ||
      gv.chuc_vu?.toLowerCase().includes('phó hiệu trưởng') ||
      gv.chuc_vu?.toLowerCase().includes('bgh')
  );
  const regTeacher = gvList.find(
    (gv) =>
      !gv.chuc_vu?.toLowerCase().includes('hiệu trưởng') &&
      !gv.chuc_vu?.toLowerCase().includes('phó hiệu trưởng') &&
      !gv.chuc_vu?.toLowerCase().includes('bgh')
  );

  if (bghMember) {
    console.log(` -> BGH Member: "${bghMember.ho_ten}" (${bghMember.chuc_vu})`);
    console.log(`    Email: "${bghMember.email}", SĐT: "${bghMember.so_dien_thoai}"`);
    if (bghMember.so_dien_thoai && !bghMember.so_dien_thoai.endsWith('***')) {
      throw new Error(`TEST FAIL: SĐT Ban Giám hiệu (${bghMember.so_dien_thoai}) phải che 3 số cuối!`);
    }
    console.log(' -> PASSED: BGH SĐT Masked (3 số cuối ***) & Email hợp lệ.');
  }

  if (regTeacher) {
    console.log(` -> Regular Teacher: "${regTeacher.ho_ten}" (${regTeacher.chuc_vu || 'Giáo viên'})`);
    if (regTeacher.email !== undefined || regTeacher.so_dien_thoai !== undefined) {
      throw new Error(`SECURITY FAIL: Giáo viên thường bị lộ Email hoặc SĐT!`);
    }
    console.log(' -> PASSED PRIVACY SHIELD: Giáo viên thông thường ẩn hoàn toàn Email & SĐT.');
  }

  // 2. Kiểm thử API Tổ Chuyên Môn cho Sidebar Trang chủ
  console.log('\n2. Test Public API Tổ Chuyên Môn (/api/v1/to-chuyen-mon)...');
  const resTo = await makeRequest('/api/v1/to-chuyen-mon');
  console.log(` -> Status: ${resTo.status}, Số lượng Tổ: ${resTo.body.du_lieu?.length || 0}`);

  if (resTo.status !== 200 || !resTo.body.thanh_cong) {
    throw new Error('Test 2 thất bại: Không lấy được danh sách tổ chuyên môn');
  }

  const toList = resTo.body.du_lieu || [];
  if (toList.length > 0) {
    const sampleTo = toList[0];
    console.log(` -> Mẫu Tổ Chuyên Môn: "${sampleTo.ten}" - ${sampleTo.so_luong_giao_vien} giáo viên`);
    console.log(`    Tổ trưởng: "${sampleTo.truong_to ? sampleTo.truong_to.ho_ten : 'Chưa phân công'}"`);
    if (sampleTo.so_luong_giao_vien === undefined) {
      throw new Error('TEST FAIL: Dữ liệu Tổ Chuyên Môn thiếu trường so_luong_giao_vien!');
    }
    console.log(' -> PASSED PORTAL LIST DATA: Dữ liệu Tổ Chuyên Môn sẵn sàng cho Sidebar Trang chủ.');
  }

  // 3. Regression Test toàn hệ thống (Giai đoạn 1 -> 15.2)
  console.log('\n3. Regression Test các Route Public (GĐ1 -> 15.2)...');
  const publicRoutes = [
    '/api/v1/bai-viet/cong-khai',
    '/api/v1/thong-bao/cong-khai',
    '/api/v1/van-ban/cong-khai',
    '/api/v1/giao-vien/cong-khai',
    '/api/v1/to-chuyen-mon',
    '/api/v1/video/cong-khai',
    '/api/v1/album/cong-khai',
    '/api/v1/thu-vien-so/cong-khai',
    '/api/v1/hoc-sinh/cong-khai',
  ];

  for (const route of publicRoutes) {
    const res = await makeRequest(route);
    console.log(` -> ${route}: Status ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Regression test thất bại tại route: ${route}`);
    }
  }

  console.log('\n=== TẤT CẢ TEST CASES GIAI ĐOẠN 15.2 ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err.message);
  process.exit(1);
});
