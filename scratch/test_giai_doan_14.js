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
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 14 (HỆ THỐNG VĂN BẢN) ===\n');

  // 1. Test API Public Tất Cả Văn Bản
  console.log('1. Test API Public Tất Cả Văn Bản...');
  const resPublic = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/v1/van-ban/cong-khai',
    method: 'GET',
  });
  console.log(` -> GET /api/v1/van-ban/cong-khai: Status ${resPublic.status}, Total items: ${resPublic.data.tong_so || 0}`);
  if (resPublic.status !== 200 || !resPublic.data.thanh_cong) {
    console.error('FAILED: Lấy danh sách van-ban/cong-khai thất bại');
    process.exit(1);
  }

  // 2. Test API Lọc Văn Bản Theo Các Danh Mục Yêu Cầu
  const categories = [
    { ma: 'thong-bao-nha-truong', label: 'Thông báo Nhà trường' },
    { ma: 'van-ban-phuong-xa', label: 'Văn bản Phường / Xã' },
    { ma: 'van-ban-so-gddt', label: 'Văn bản Sở GD&ĐT' },
    { ma: 'van-ban-bo-gddt', label: 'Văn bản Bộ GD&ĐT' },
  ];

  console.log('\n2. Test API Lọc Văn Bản Theo Loại Danh Mục...');
  for (const cat of categories) {
    const resCat = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: `/api/v1/van-ban/cong-khai?loai_van_ban_ma=${cat.ma}`,
      method: 'GET',
    });
    console.log(` -> Lọc "${cat.label}" (${cat.ma}): Status ${resCat.status}, Total: ${resCat.data.tong_so || 0}`);
    if (resCat.status !== 200 || !resCat.data.thanh_cong) {
      console.error(`FAILED: Lọc loại văn bản ${cat.ma} thất bại`);
      process.exit(1);
    }
  }

  // 3. Test API Tìm Kiếm Từ Khóa Văn Bản
  console.log('\n3. Test API Tìm kiếm văn bản với tu_khoa="Kế hoạch"...');
  const resSearch = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/v1/van-ban/cong-khai?tu_khoa=K%E1%BA%BF%20ho%E1%BA%A1ch',
    method: 'GET',
  });
  console.log(` -> GET /api/v1/van-ban/cong-khai?tu_khoa=Kế hoạch: Status ${resSearch.status}, Total: ${resSearch.data.tong_so || 0}`);
  if (resSearch.status !== 200 || !resSearch.data.thanh_cong) {
    console.error('FAILED: Tìm kiếm văn bản thất bại');
    process.exit(1);
  }

  // 4. Test API Xem Chi Tiết Văn Bản
  const firstId = resPublic.data.du_lieu[0]?.id;
  if (firstId) {
    console.log(`\n4. Test API Chi tiết Văn Bản ID ${firstId}...`);
    const resDetail = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: `/api/v1/van-ban/cong-khai/${firstId}`,
      method: 'GET',
    });
    console.log(` -> GET /api/v1/van-ban/cong-khai/${firstId}: Status ${resDetail.status}, Số hiệu: "${resDetail.data.du_lieu?.so_hieu}", Tên: "${resDetail.data.du_lieu?.ten_van_ban}"`);
    if (resDetail.status !== 200 || !resDetail.data.thanh_cong) {
      console.error('FAILED: Xem chi tiết văn bản thất bại');
      process.exit(1);
    }
  }

  // 5. Regression Test Các Module Giai Đoạn 1 -> 13
  console.log('\n5. Regression Test toàn bộ hệ thống (Giai đoạn 1 -> 14)...');
  const endpoints = [
    { name: 'Bài viết', path: '/api/v1/bai-viet/cong-khai' },
    { name: 'Thông báo', path: '/api/v1/thong-bao/cong-khai' },
    { name: 'Lịch hoạt động', path: '/api/v1/thong-bao/cong-khai?phieu_loc=lich-hoat-dong&thang_nam=2026-08' },
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

  console.log('\n=== TẤT CẢ TEST CASES GIAI ĐOẠN 14 ĐÃ ĐẠT 100% THÀNH CÔNG ===');
}

runTests().catch(console.error);
