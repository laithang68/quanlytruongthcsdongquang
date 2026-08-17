const http = require('http');
const { execSync } = require('child_process');

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
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 16.2: HOÀN THIỆN CHI TIẾT TÀI LIỆU SỐ ===\n');

  // 1. Prisma Validate & Status
  console.log('1. Prisma Database Audit:');
  const validateOut = execSync('npx prisma validate', { cwd: __dirname + '/../backend' }).toString();
  console.log(' -> Validate:', validateOut.trim());

  // 2. Fetch public digital library item
  console.log('\n2. Lay danh sach tai lieu cong khai...');
  const resList = await makeRequest('/api/v1/thu-vien-so/cong-khai');
  const list = resList.body.du_lieu || [];
  console.log(` -> So luong tai lieu: ${list.length}`);

  if (list.length > 0) {
    const item = list[0];
    console.log(` -> Test tai lieu ID: ${item.id}`);

    // TEST 2: GET API Detail
    console.log('\n3. Test GET /api/v1/thu-vien-so/cong-khai/:id...');
    const resDetail = await makeRequest(`/api/v1/thu-vien-so/cong-khai/${item.id}`);
    console.log(` -> Status: ${resDetail.status}, Ten tai lieu: "${resDetail.body.du_lieu?.ten_tai_lieu}"`);
    
    if (resDetail.status !== 200 || !resDetail.body.thanh_cong) {
      throw new Error('Test GET Detail API that bai!');
    }

    const detailData = resDetail.body.du_lieu;
    console.log('  ✓ Ten tai lieu:', detailData.ten_tai_lieu);
    console.log('  ✓ Danh muc:', detailData.danh_muc_tai_lieu?.ten);
    console.log('  ✓ Mo ta:', detailData.mo_ta || '(Khong co)');
    console.log('  ✓ Ngay dang:', detailData.ngay_tao);
    console.log('  ✓ Luot tai:', detailData.luot_tai);
  }

  // TEST 9 & 10: Non-existent or Hidden/Deleted item returns 404
  console.log('\n4. Test truy cap tai lieu khong ton tai hoac bi an...');
  const resInvalid = await makeRequest('/api/v1/thu-vien-so/cong-khai/00000000-0000-0000-0000-000000000000');
  console.log(` -> GET Detail Invalid ID Status: ${resInvalid.status}`);
  if (resInvalid.status !== 404) {
    throw new Error('Test 404 Not Found failed!');
  }
  console.log('  ✓ Trả về 404 Not Found chính xác!');

  // TEST 14: Full System Regression Test
  console.log('\n5. Regression test 9 public endpoints...');
  const routes = [
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

  for (const r of routes) {
    const res = await makeRequest(r);
    console.log(` -> ${r}: Status ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Regression test failed at: ${r}`);
    }
  }

  console.log('\n=== TẤT CẢ KỊCH BẢN KIỂM THỬ GIAI ĐOẠN 16.2 ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err.message);
  process.exit(1);
});
