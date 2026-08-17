const http = require('http');
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
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 18: DASHBOARD QUẢN TRỊ & THỐNG KÊ TỔNG QUAN ===\n');

  // 1. Prisma Audit
  console.log('1. Prisma Database & Schema Audit:');
  try {
    const valRes = execSync('npx prisma validate', { cwd: './backend', encoding: 'utf-8' });
    console.log(' -> Validate:', valRes.trim());
    const migRes = execSync('npx prisma migrate status', { cwd: './backend', encoding: 'utf-8' });
    console.log(' -> Migrate Status:', migRes.trim());
  } catch (e) {
    console.error(' ❌ Prisma Audit Error:', e.message);
    process.exit(1);
  }

  // 2. Test GET /api/v1/kiem-tra/thong-ke
  console.log('\n2. Kiểm tra API Live Statistics (GET /api/v1/kiem-tra/thong-ke):');
  const res = await requestJson('http://127.0.0.1:3001/api/v1/kiem-tra/thong-ke');
  if (res.status !== 200 || !res.body.thanh_cong) {
    console.error(' ❌ GET /api/v1/kiem-tra/thong-ke thất bại!');
    process.exit(1);
  }

  const d = res.body.du_lieu;
  console.log(' -> Trạng thái: 200 OK');
  console.log(' -> Giáo viên:', d.tong_so_giao_vien);
  console.log(' -> Học sinh:', d.tong_so_hoc_sinh);
  console.log(' -> Lớp học:', d.tong_so_lop);
  console.log(' -> Bài viết (Tổng/Xuất bản/Nháp/Chờ duyệt):', `${d.tong_so_bai_viet} / ${d.bai_viet_xuat_ban} / ${d.bai_viet_nhap} / ${d.bai_viet_cho_duyet}`);
  console.log(' -> Thông báo (Tổng/Hiện/Ẩn):', `${d.tong_so_thong_bao} / ${d.thong_bao_hien_thi} / ${d.thong_bao_an}`);
  console.log(' -> Văn bản:', d.tong_so_van_ban);
  console.log(' -> Video:', d.tong_so_video);
  console.log(' -> Album ảnh:', d.tong_so_album);
  console.log(' -> Thư viện số:', d.tong_so_thu_vien_so);
  console.log(' -> Bài viết mới nhất (array length):', d.bai_viet_moi_nhat?.length ?? 0);
  console.log(' -> Thông báo mới nhất (array length):', d.thong_bao_moi_nhat?.length ?? 0);
  console.log(' -> Nhật ký gần đây (array length):', d.nhat_ky_gan_day?.length ?? 0);

  // 3. Regression test 9 public endpoints
  console.log('\n3. Regression test 9 public API endpoints:');
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
      console.log(` -> ${ep}: Status 200 OK`);
    } else {
      console.error(` ❌ ${ep} thất bại với status ${r.status}`);
      process.exit(1);
    }
  }

  console.log('\n=== TẤT CẢ KỊCH BẢN KIỂM THỬ GIAI ĐOẠN 18 ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
