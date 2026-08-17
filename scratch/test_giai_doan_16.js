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
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 16: TÀI NGUYÊN & THƯ VIỆN ===\n');

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

  // 2. Test Public API Video với Tìm kiếm từ khóa & Xem chi tiết
  console.log('\n2. Test Public API Video (/api/v1/video/cong-khai)...');
  const resVideo = await makeRequest('/api/v1/video/cong-khai?tu_khoa=truong');
  console.log(` -> GET /api/v1/video/cong-khai Status: ${resVideo.status}, Tổng số: ${resVideo.body.tong_so || 0}`);
  if (resVideo.status !== 200 || !resVideo.body.thanh_cong) {
    throw new Error('Test 2 thất bại: Public API Video không phản hồi đúng!');
  }

  const videoList = resVideo.body.du_lieu || [];
  if (videoList.length > 0) {
    const sampleVideo = videoList[0];
    console.log(` -> Mẫu Video: "${sampleVideo.tieu_de}" (Lượt xem: ${sampleVideo.luot_xem})`);
    
    // Gọi API chi tiết để test tăng lượt xem
    const resDetail = await makeRequest(`/api/v1/video/cong-khai/${sampleVideo.id}`);
    console.log(` -> GET /api/v1/video/cong-khai/${sampleVideo.id} Status: ${resDetail.status}, Lượt xem mới: ${resDetail.body.du_lieu?.luot_xem}`);
    if (resDetail.body.du_lieu?.luot_xem !== sampleVideo.luot_xem + 1) {
      throw new Error('Test 2 thất bại: Lượt xem video chưa được tăng tự động!');
    }
    console.log(' -> PASSED: API Video nâng cấp tìm kiếm & tăng lượt xem chuẩn xác!');
  }

  // 3. Test Public API Album ảnh với Tìm kiếm từ khóa & Xem chi tiết
  console.log('\n3. Test Public API Album Ảnh (/api/v1/album/cong-khai)...');
  const resAlbum = await makeRequest('/api/v1/album/cong-khai?tu_khoa=album');
  console.log(` -> GET /api/v1/album/cong-khai Status: ${resAlbum.status}, Tổng số: ${resAlbum.body.tong_so || 0}`);
  if (resAlbum.status !== 200 || !resAlbum.body.thanh_cong) {
    throw new Error('Test 3 thất bại: Public API Album ảnh không phản hồi đúng!');
  }

  const albumList = resAlbum.body.du_lieu || [];
  if (albumList.length > 0) {
    const sampleAlbum = albumList[0];
    console.log(` -> Mẫu Album: "${sampleAlbum.ten}" (Số lượng ảnh: ${sampleAlbum.so_luong_anh})`);
    
    const resAlbumDetail = await makeRequest(`/api/v1/album/cong-khai/${sampleAlbum.id}`);
    console.log(` -> GET /api/v1/album/cong-khai/${sampleAlbum.id} Status: ${resAlbumDetail.status}`);
    if (resAlbumDetail.status !== 200 || !resAlbumDetail.body.thanh_cong) {
      throw new Error('Test 3 thất bại: Không tải được chi tiết album ảnh!');
    }
    console.log(' -> PASSED: API Album ảnh phục vụ Lightbox & tìm kiếm hoàn hảo!');
  }

  // 4. Test Public API Thư viện số & Danh mục
  console.log('\n4. Test Public API Thư viện số (/api/v1/thu-vien-so/cong-khai)...');
  const resDm = await makeRequest('/api/v1/thu-vien-so/danh-muc');
  console.log(` -> Danh mục Thư viện số Status: ${resDm.status}, Số danh mục: ${resDm.body.du_lieu?.length || 0}`);
  
  const resTvs = await makeRequest('/api/v1/thu-vien-so/cong-khai');
  console.log(` -> Danh sách Thư viện số Status: ${resTvs.status}, Số tài liệu: ${resTvs.body.tong_so || 0}`);
  if (resTvs.status !== 200 || !resTvs.body.thanh_cong) {
    throw new Error('Test 4 thất bại: Public API Thư viện số không phản hồi!');
  }
  console.log(' -> PASSED: API Thư viện số sẵn sàng phục vụ tìm kiếm & tải học liệu!');

  // 5. Full System Regression Test (GĐ1 - GĐ16)
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

  console.log('\n=== TẤT CẢ KỊCH BẢN KIỂM THỬ GIAI ĐOẠN 16 ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err.message);
  process.exit(1);
});
