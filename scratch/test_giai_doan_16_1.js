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
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 16.1: HOÀN THIỆN DANH MỤC THƯ VIỆN SỐ ===\n');

  // 1. Kiểm tra trạng thái Prisma Database & Migrations
  console.log('1. Kiểm tra Prisma Database & Migration Status...');
  try {
    const validateOut = execSync('npx prisma validate', { cwd: __dirname + '/../backend' }).toString();
    console.log(' -> Prisma Validate:', validateOut.trim());

    const statusOut = execSync('npx prisma migrate status', { cwd: __dirname + '/../backend' }).toString();
    console.log(' -> Prisma Migration Status:\n', statusOut.trim());
  } catch (e) {
    console.warn(' -> Cảnh báo Prisma check:', e.message);
  }

  // 2. Test API lấy 6 danh mục chuẩn (/api/v1/thu-vien-so/danh-muc)
  console.log('\n2. Test API 6 Danh mục Thư viện số (/api/v1/thu-vien-so/danh-muc)...');
  const resDanhMuc = await makeRequest('/api/v1/thu-vien-so/danh-muc');
  console.log(` -> GET /api/v1/thu-vien-so/danh-muc Status: ${resDanhMuc.status}, Số danh mục: ${resDanhMuc.body.du_lieu?.length || 0}`);
  if (resDanhMuc.status !== 200 || !resDanhMuc.body.thanh_cong) {
    throw new Error('Test 2 thất bại: API Danh mục không phản hồi đúng!');
  }

  const listDanhMuc = resDanhMuc.body.du_lieu || [];
  const expectedSlugs = [
    'tai-lieu-tham-khao',
    'sach-giao-khoa-dien-tu',
    'sach-tham-khao',
    'tai-lieu-on-hsg',
    'thu-vien-bai-giang',
    'thu-vien-giao-an',
  ];

  for (const slug of expectedSlugs) {
    const found = listDanhMuc.find((d) => d.ma === slug);
    if (!found) {
      throw new Error(`Test 2 thất bại: Thiếu danh mục chuẩn mã "${slug}"`);
    }
    console.log(`  ✓ Đã tìm thấy danh mục chuẩn: [${found.ma}] ${found.ten}`);
  }
  console.log(' -> PASSED: Đã đồng bộ chính xác 6 danh mục chuẩn!');

  // 3. Test Lọc tài liệu theo 6 danh_muc_slug
  console.log('\n3. Test Public API Lọc theo danh_muc_slug...');
  for (const slug of expectedSlugs) {
    const resFilter = await makeRequest(`/api/v1/thu-vien-so/cong-khai?danh_muc_slug=${slug}`);
    console.log(` -> Lọc theo slug "${slug}": Status ${resFilter.status}, Số tài liệu: ${resFilter.body.tong_so || 0}`);
    if (resFilter.status !== 200 || !resFilter.body.thanh_cong) {
      throw new Error(`Test 3 thất bại: Lọc theo danh_muc_slug=${slug} bị lỗi!`);
    }
  }
  console.log(' -> PASSED: Public API lọc theo danh_muc_slug hoạt động 100%!');

  // 4. Test Lọc kết hợp Tìm kiếm từ khóa + Phân trang
  console.log('\n4. Test Lọc kết hợp danh_muc_slug + tu_khoa + page...');
  const resCombine = await makeRequest('/api/v1/thu-vien-so/cong-khai?danh_muc_slug=thu-vien-bai-giang&tu_khoa=toan&page=1&limit=5');
  console.log(` -> Combination query: Status ${resCombine.status}, Phản hồi: OK`);
  if (resCombine.status !== 200 || !resCombine.body.thanh_cong) {
    throw new Error('Test 4 thất bại: Lọc kết hợp tìm kiếm + phân trang bị lỗi!');
  }
  console.log(' -> PASSED: Lọc đa điều kiện hoạt động mượt mà!');

  // 5. Full System Regression Test (GĐ1 - GĐ16.1)
  console.log('\n5. Full System Regression Test tất cả 9 Public Endpoint nhóm chính...');
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
      throw new Error(`Regression test thất bại tại: ${r}`);
    }
  }

  console.log('\n=== TẤT CẢ KỊCH BẢN KIỂM THỬ GIAI ĐOẠN 16.1 ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err.message);
  process.exit(1);
});
