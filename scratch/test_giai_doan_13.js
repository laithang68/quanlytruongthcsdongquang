const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 13 (THÔNG BÁO + LỊCH HOẠT ĐỘNG) ===\n');

  // 1. Test API Public Tất Cả Thông Báo
  console.log('1. Test API Public Tất Cả Thông Báo...');
  const resPublic = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/v1/thong-bao/cong-khai',
    method: 'GET',
  });
  console.log(` -> GET /api/v1/thong-bao/cong-khai: Status ${resPublic.status}, Total items: ${resPublic.data.tong_so || 0}`);
  if (resPublic.status !== 200 || !resPublic.data.thanh_cong) {
    console.error('FAILED: Lấy danh sách thong-bao/cong-khai thất bại');
    process.exit(1);
  }

  // 2. Test API Lọc Thông Báo Nhà Trường
  console.log('\n2. Test API Lọc Thông Báo Nhà Trường...');
  const resNhaTruong = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/v1/thong-bao/cong-khai?phieu_loc=nha-truong',
    method: 'GET',
  });
  console.log(` -> GET /api/v1/thong-bao/cong-khai?phieu_loc=nha-truong: Status ${resNhaTruong.status}, Total: ${resNhaTruong.data.tong_so || 0}`);
  if (resNhaTruong.status !== 200 || !resNhaTruong.data.thanh_cong) {
    console.error('FAILED: Lọc thông báo nhà trường thất bại');
    process.exit(1);
  }

  // 3. Test API Lọc Lịch Hoạt Động Theo Tháng
  console.log('\n3. Test API Lọc Lịch Hoạt Động Theo Tháng 08/2026...');
  const resLich = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/v1/thong-bao/cong-khai?phieu_loc=lich-hoat-dong&thang_nam=2026-08',
    method: 'GET',
  });
  console.log(` -> GET /api/v1/thong-bao/cong-khai (Lịch 08/2026): Status ${resLich.status}, Total: ${resLich.data.tong_so || 0}`);
  if (resLich.status !== 200 || !resLich.data.thanh_cong) {
    console.error('FAILED: Lọc lịch hoạt động thất bại');
    process.exit(1);
  }

  // 4. Test API Xem Chi Tiết Thông Báo / Lịch Hoạt Động
  const firstId = resPublic.data.du_lieu[0]?.id;
  if (firstId) {
    console.log(`\n4. Test API Chi tiết Thông Báo ID ${firstId}...`);
    const resDetail = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: `/api/v1/thong-bao/cong-khai/${firstId}`,
      method: 'GET',
    });
    console.log(` -> GET /api/v1/thong-bao/cong-khai/${firstId}: Status ${resDetail.status}, Title: "${resDetail.data.du_lieu?.tieu_de}"`);
    if (resDetail.status !== 200 || !resDetail.data.thanh_cong) {
      console.error('FAILED: Xem chi tiết thông báo thất bại');
      process.exit(1);
    }
  }

  // 5. Regression Test Các Module Giai Đoạn Trước
  console.log('\n5. Regression Test toàn bộ hệ thống (Giai đoạn 1 -> 13)...');
  const endpoints = [
    { name: 'Bài viết', path: '/api/v1/bai-viet/cong-khai' },
    { name: 'Văn bản', path: '/api/v1/van-ban/cong-khai' },
    { name: 'Giáo viên', path: '/api/v1/giao-vien/cong-khai' },
    { name: 'Video', path: '/api/v1/video/cong-khai' },
    { name: 'Album ảnh', path: '/api/v1/album/cong-khai' },
    { name: 'Thư viện số', path: '/api/v1/thu-vien-so/cong-khai' },
  ];

  for (const ep of endpoints) {
    const res = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: ep.path,
      method: 'GET',
    });
    console.log(` -> ${ep.name}: Status ${res.status}`);
    if (res.status !== 200) {
      console.error(`FAILED: Endpoint ${ep.name} bị lỗi status ${res.status}`);
      process.exit(1);
    }
  }

  console.log('\n=== TẤT CẢ TEST CASES GIAI ĐOẠN 13 ĐÃ ĐẠT 100% THÀNH CÔNG ===');
}

runTests().catch(console.error);
