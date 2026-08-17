const http = require('http');

const BASE_URL = 'http://127.0.0.1:3001';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 15 (ĐỘI NGŨ GIÁO VIÊN & TỔ CHUYÊN MÔN) ===\n');

  // 1. Test Public API tất cả Giáo viên
  console.log('1. Test Public API Lấy Danh Sách Giáo Viên...');
  const resGVAll = await makeRequest('/api/v1/giao-vien/cong-khai');
  console.log(` -> GET /api/v1/giao-vien/cong-khai: Status ${resGVAll.status}, Số lượng: ${resGVAll.body.du_lieu?.length || 0}`);
  if (resGVAll.status !== 200 || !resGVAll.body.thanh_cong) {
    throw new Error('Test 1 thất bại: Không thể lấy danh sách giáo viên công khai');
  }

  // 2. Test Security Check trên Public API
  console.log('\n2. Test Security Check trên Public API Giáo Viên...');
  const sampleGV = resGVAll.body.du_lieu[0];
  if (sampleGV) {
    const hasEmail = 'email' in sampleGV;
    const hasPhone = 'so_dien_thoai' in sampleGV;
    const hasAddress = 'dia_chi' in sampleGV;
    console.log(` -> Kiểm tra thông tin nhạy cảm công khai: email=${hasEmail}, so_dien_thoai=${hasPhone}, dia_chi=${hasAddress}`);
    if (hasEmail || hasPhone || hasAddress) {
      throw new Error('SECURITY VIOLATION: API Public Giáo viên để lộ thông tin cá nhân nhạy cảm!');
    }
    console.log(' -> BẢO MẬT ĐẠT: Public API KHÔNG để lộ email/SĐT/địa chỉ cá nhân.');
  }

  // 3. Test Public API Chi tiết Giáo viên
  if (sampleGV) {
    console.log(`\n3. Test Public API Chi Tiết Giáo Viên ID ${sampleGV.id}...`);
    const resGVDetail = await makeRequest(`/api/v1/giao-vien/cong-khai/${sampleGV.id}`);
    console.log(` -> GET /api/v1/giao-vien/cong-khai/${sampleGV.id}: Status ${resGVDetail.status}, Họ tên: "${resGVDetail.body.du_lieu?.ho_ten}"`);
    if (resGVDetail.status !== 200 || !resGVDetail.body.thanh_cong) {
      throw new Error('Test 3 thất bại: Không thể lấy chi tiết giáo viên');
    }
  }

  // 4. Test Public API Tổ Chuyên Môn & Giáo Viên thuộc Tổ
  console.log('\n4. Test Public API Tổ Chuyên Môn & Giáo viên thuộc Tổ...');
  const resToAll = await makeRequest('/api/v1/to-chuyen-mon');
  console.log(` -> GET /api/v1/to-chuyen-mon: Status ${resToAll.status}, Total tổ: ${resToAll.body.du_lieu?.length || 0}`);
  if (resToAll.status !== 200 || !resToAll.body.thanh_cong) {
    throw new Error('Test 4 thất bại: Không thể lấy danh sách tổ chuyên môn');
  }

  if (resToAll.body.du_lieu?.length > 0) {
    const sampleTo = resToAll.body.du_lieu[0];
    const resToGV = await makeRequest(`/api/v1/to-chuyen-mon/${sampleTo.id}/giao-vien`);
    console.log(` -> GET /api/v1/to-chuyen-mon/${sampleTo.id}/giao-vien: Status ${resToGV.status}, GV thuộc tổ: ${resToGV.body.du_lieu?.length || 0}`);
    if (resToGV.status !== 200 || !resToGV.body.thanh_cong) {
      throw new Error('Test 4 thất bại: Không thể lấy giáo viên thuộc tổ');
    }
  }

  // 5. Test Regression Toàn bộ hệ thống (Giai đoạn 1 -> 15)
  console.log('\n5. Regression Test Toàn bộ các Module Public (GĐ1 -> 15)...');
  const routes = [
    { path: '/api/v1/bai-viet/cong-khai', label: 'Bài viết' },
    { path: '/api/v1/thong-bao/cong-khai', label: 'Thông báo' },
    { path: '/api/v1/van-ban/cong-khai', label: 'Văn bản' },
    { path: '/api/v1/giao-vien/cong-khai', label: 'Giáo viên' },
    { path: '/api/v1/to-chuyen-mon', label: 'Tổ chuyên môn' },
    { path: '/api/v1/video/cong-khai', label: 'Video' },
    { path: '/api/v1/album/cong-khai', label: 'Album ảnh' },
    { path: '/api/v1/thu-vien-so/cong-khai', label: 'Thư viện số' },
    { path: '/api/v1/hoc-sinh/cong-khai', label: 'Học sinh' },
  ];

  for (const r of routes) {
    const res = await makeRequest(r.path);
    console.log(` -> ${r.label} (${r.path}): Status ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Regression test thất bại tại route: ${r.path}`);
    }
  }

  console.log('\n=== TẤT CẢ TEST CASES GIAI ĐOẠN 15 ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err.message);
  process.exit(1);
});
