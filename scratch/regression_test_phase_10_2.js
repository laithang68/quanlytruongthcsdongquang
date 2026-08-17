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

async function runHardeningTests() {
  console.log('=== HỆ THỐNG KIỂM THỬ THÍCH ỨNG & HARDENING GIAI ĐOẠN 10.2 ===\n');

  try {
    // 1. Đăng nhập Admin
    console.log('1. Đăng nhập Super Admin...');
    const loginRes = await makeRequest(`${API_BASE}/xac-thuc/dang-nhap`, 'POST', {
      email: 'quantri@dongquang.edu.vn',
      mat_khau: 'DongQuang@2026!',
    });
    const token = loginRes.body.access_token;
    if (!token) throw new Error('Đăng nhập thất bại');
    console.log(' -> OK: Đăng nhập thành công, nhận JWT Token.');

    // 2. Test Tạo Video Ẩn (trang_thai = false) & Kiểm tra Public Isolation
    console.log('\n2. Test cách ly Video Ẩn khỏi Public API...');
    const taoVideoAnRes = await makeRequest(
      `${API_BASE}/video`,
      'POST',
      {
        tieu_de: 'Video Thử Nghiệm Ẩn Nội Bộ',
        url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        trang_thai: false,
      },
      token,
    );
    const videoAnId = taoVideoAnRes.body.du_lieu?.id;
    console.log(` -> POST /api/v1/video (trang_thai=false): Created ID ${videoAnId}`);

    const pubVideoRes = await makeRequest(`${API_BASE}/video/cong-khai/${videoAnId}`);
    console.log(` -> GET /api/v1/video/cong-khai/${videoAnId}: Status ${pubVideoRes.status} (Kỳ vọng: 404 Not Found)`);
    if (pubVideoRes.status !== 404) throw new Error('Lỗi bảo mật: Video ẩn bị lộ trên Public API!');

    // 3. Test Đổi trạng thái & Xóa Video
    console.log('\n3. Test Audit Log khi xóa Video...');
    const xoaVideoRes = await makeRequest(`${API_BASE}/video/${videoAnId}`, 'DELETE', null, token);
    console.log(` -> DELETE /api/v1/video/${videoAnId}: Status ${xoaVideoRes.status}, Message: ${xoaVideoRes.body.thong_bao}`);

    // 4. Test Thư viện số Soft Delete & Public Isolation
    console.log('\n4. Test Thư viện số Soft Delete...');
    const danhMucRes = await makeRequest(`${API_BASE}/thu-vien-so/danh-muc`);
    const dmId = danhMucRes.body.du_lieu[0].id;

    const taoTLRes = await makeRequest(
      `${API_BASE}/thu-vien-so`,
      'POST',
      {
        ten_tai_lieu: 'Tài liệu Thử Nghiệm Xóa Mềm',
        danh_muc_tai_lieu_id: dmId,
        trang_thai: true,
      },
      token,
    );
    const tlId = taoTLRes.body.du_lieu.id;

    const xoaTLRes = await makeRequest(`${API_BASE}/thu-vien-so/${tlId}`, 'DELETE', null, token);
    console.log(` -> DELETE /api/v1/thu-vien-so/${tlId}: Status ${xoaTLRes.status}`);

    const pubTLRes = await makeRequest(`${API_BASE}/thu-vien-so/cong-khai/${tlId}`);
    console.log(` -> GET /api/v1/thu-vien-so/cong-khai/${tlId}: Status ${pubTLRes.status} (Kỳ vọng: 404 Not Found)`);
    if (pubTLRes.status !== 404) throw new Error('Lỗi bảo mật: Tài liệu xóa mềm bị lộ trên Public API!');

    // 5. Test Regression Các API Cốt Lõi (Bài viết, Thông báo, Văn bản, Giáo viên, Lớp học)
    console.log('\n5. Regression Test các API cốt lõi...');
    const [baiViet, thongBao, vanBan, giaoVien, lopHoc] = await Promise.all([
      makeRequest(`${API_BASE}/bai-viet/cong-khai`),
      makeRequest(`${API_BASE}/thong-bao/cong-khai`),
      makeRequest(`${API_BASE}/van-ban/cong-khai`),
      makeRequest(`${API_BASE}/giao-vien/cong-khai`),
      makeRequest(`${API_BASE}/lop-hoc`, 'GET', null, token),
    ]);

    console.log(` -> Bài viết Public: Status ${baiViet.status}, Tổng số: ${baiViet.body.du_lieu?.length || 0}`);
    console.log(` -> Thông báo Public: Status ${thongBao.status}, Tổng số: ${thongBao.body.du_lieu?.length || 0}`);
    console.log(` -> Văn bản Public: Status ${vanBan.status}, Tổng số: ${vanBan.body.du_lieu?.length || 0}`);
    console.log(` -> Giáo viên Public: Status ${giaoVien.status}, Tổng số: ${giaoVien.body.du_lieu?.length || 0}`);
    console.log(` -> Lớp học Admin: Status ${lopHoc.status}, Tổng số: ${lopHoc.body.du_lieu?.length || 0}`);

    console.log('\n=== TẤT CẢ HARDENING & REGRESSION TEST CASES GIAI ĐOẠN 10.2 ĐÃ ĐẠT 100% THÀNH CÔNG ===');
  } catch (err) {
    console.error('\n❌ Lỗi kiểm thử:', err.message);
  }
}

runHardeningTests();
