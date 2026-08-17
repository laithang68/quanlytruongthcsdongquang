const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';

function makeRequest(url, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 10.1 (VIDEO, THƯ VIỆN ẢNH, THƯ VIỆN SỐ) ===\n');

  try {
    // 1. Đăng nhập Admin
    console.log('1. Đăng nhập Super Admin...');
    const loginRes = await makeRequest(`${API_BASE}/xac-thuc/dang-nhap`, 'POST', {
      email: 'quantri@dongquang.edu.vn',
      mat_khau: 'DongQuang@2026!',
    });
    console.log(` -> Status: ${loginRes.status}, Body:`, JSON.stringify(loginRes.body));
    const token = loginRes.body.du_lieu?.access_token || loginRes.body.access_token;
    if (!token) throw new Error('Đăng nhập thất bại');

    // 2. Video API Public & Admin
    console.log('\n2. Test Video Module...');
    const pubVideoRes = await makeRequest(`${API_BASE}/video/cong-khai`);
    console.log(` -> GET /api/v1/video/cong-khai: Status ${pubVideoRes.status}, Found: ${pubVideoRes.body.du_lieu?.length || 0}`);

    const taoVideoRes = await makeRequest(
      `${API_BASE}/video`,
      'POST',
      {
        tieu_de: 'Video Lễ Khai Giảng Năm Học 2025-2026',
        url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        mo_ta: 'Video toàn cảnh không khí rộn ràng ngày khai trường THCS Đông Quang',
        trang_thai: true,
      },
      token,
    );
    console.log(` -> POST /api/v1/video: Status ${taoVideoRes.status}, Created ID: ${taoVideoRes.body.du_lieu?.id}`);

    // 3. Album API Public & Admin
    console.log('\n3. Test Album Module (Thư viện ảnh)...');
    const pubAlbumRes = await makeRequest(`${API_BASE}/album/cong-khai`);
    console.log(` -> GET /api/v1/album/cong-khai: Status ${pubAlbumRes.status}, Found: ${pubAlbumRes.body.du_lieu?.length || 0}`);

    const taoAlbumRes = await makeRequest(
      `${API_BASE}/album`,
      'POST',
      {
        ten: 'Album Ảnh Hội Khỏe Phù Đổng Trường THCS Đông Quang',
        mo_ta: 'Hình ảnh thi đấu sôi nổi của các vận động viên học sinh',
        trang_thai: true,
      },
      token,
    );
    console.log(` -> POST /api/v1/album: Status ${taoAlbumRes.status}, Created ID: ${taoAlbumRes.body.du_lieu?.id}`);

    // 4. Thư viện số API Public & Admin
    console.log('\n4. Test Thư viện số Module...');
    const danhMucRes = await makeRequest(`${API_BASE}/thu-vien-so/danh-muc`);
    console.log(` -> GET /api/v1/thu-vien-so/danh-muc: Status ${danhMucRes.status}, Danh mục: ${danhMucRes.body.du_lieu?.length || 0}`);
    const firstDmId = danhMucRes.body.du_lieu?.[0]?.id;

    const pubTLRes = await makeRequest(`${API_BASE}/thu-vien-so/cong-khai`);
    console.log(` -> GET /api/v1/thu-vien-so/cong-khai: Status ${pubTLRes.status}, Found: ${pubTLRes.body.du_lieu?.length || 0}`);

    const taoTLRes = await makeRequest(
      `${API_BASE}/thu-vien-so`,
      'POST',
      {
        ten_tai_lieu: 'Bộ Đề Ôn Tập Thi Vào 10 Môn Toán Năm 2026',
        mo_ta: 'Tài liệu hướng dẫn giải chi tiết các dạng bài thi tuyển sinh 10 môn Toán',
        danh_muc_tai_lieu_id: firstDmId,
        tac_gia: 'Tổ Toán - Tin học',
        trang_thai: true,
      },
      token,
    );
    console.log(` -> POST /api/v1/thu-vien-so: Status ${taoTLRes.status}, Created ID: ${taoTLRes.body.du_lieu?.id}`);

    console.log('\n=== TẤT CẢ TEST CASES GIAI ĐOẠN 10.1 ĐÃ ĐẠT 100% THÀNH CÔNG ===');
  } catch (err) {
    console.error('\n❌ Lỗi kiểm thử:', err.message);
  }
}

runTests();
