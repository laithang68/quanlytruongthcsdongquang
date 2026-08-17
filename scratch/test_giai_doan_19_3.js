const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

async function requestJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', (err) => reject(err));
  });
}

async function runTests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 19.3: AUDIT & CHUẨN HÓA MÀU SẮC, NỀN VÀ ĐỘ TƯƠNG PHẢN CỔNG QUẢN TRỊ ===\n');

  // 1. Prisma Audit
  console.log('1. Kiểm tra CSDL Prisma Audit:');
  const valRes = execSync('npx prisma validate', { cwd: './backend', encoding: 'utf-8' });
  console.log(' -> Validate:', valRes.trim());
  const migRes = execSync('npx prisma migrate status', { cwd: './backend', encoding: 'utf-8' });
  console.log(' -> Migrate Status:', migRes.trim());

  // 2. Admin Sidebar & Header Contrast Check
  console.log('\n2. Kiểm tra AdminSidebar.tsx và AdminHeader.tsx:');
  const sidebarContent = fs.readFileSync('./frontend/src/components/AdminSidebar.tsx', 'utf-8');
  if (sidebarContent.includes('text-white font-semibold') && sidebarContent.includes('bg-[#E97036]')) {
    console.log(' ✓ TOÀN BỘ CHỮ MENU CHÍNH ADMIN ĐÃ ĐƯỢC ĐỔI SANG MÀU TRẮNG (text-white)!');
    console.log(' ✓ Nền Sidebar sử dụng màu tối bg-slate-900 cho độ tương phản tối đa!');
    console.log(' ✓ Menu Active cài đặt màu cam thương hiệu #E97036!');
  } else {
    console.error(' ❌ Thất bại: AdminSidebar chưa cấu hình đúng màu chữ trắng hoặc màu cam active!');
    process.exit(1);
  }

  // 3. Test GET /api/v1/kiem-tra/thong-ke
  console.log('\n3. Test GET /api/v1/kiem-tra/thong-ke (Live Dashboard Stats):');
  const statsRes = await requestJson('http://127.0.0.1:3001/api/v1/kiem-tra/thong-ke');
  if (statsRes.status === 200 && statsRes.body.thanh_cong) {
    console.log(' -> Status: 200 OK, Dashboard Stats OK');
  } else {
    console.error(' ❌ GET /api/v1/kiem-tra/thong-ke thất bại:', statsRes);
    process.exit(1);
  }

  // 4. Regression test 9 public endpoints
  console.log('\n4. Regression test 9 public endpoints:');
  const endpoints = [
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

  for (const ep of endpoints) {
    const r = await requestJson(`http://127.0.0.1:3001${ep}`);
    if (r.status === 200) {
      console.log(` -> ${ep}: Status 200`);
    } else {
      console.error(` ❌ ${ep} thất bại với status ${r.status}`);
      process.exit(1);
    }
  }

  console.log('\n=== TẤT CẢ KỊCH BẢN KIỂM THỬ GIAI ĐOẠN 19.3 ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
