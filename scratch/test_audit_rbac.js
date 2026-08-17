const http = require('http');

async function sendJson(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function testRBACPermissionCheck() {
  console.log('=== AUDIT TEST 403 FORBIDDEN TRỰC TIẾP TẠI BACKEND ===\n');

  // 1. SuperAdmin Login
  const adminRes = await sendJson('POST', '/api/v1/xac-thuc/dang-nhap', {
    email: 'quantri@dongquang.edu.vn',
    mat_khau: 'DongQuang@2026!',
  });
  const adminToken = adminRes.body.access_token;
  console.log('1. SuperAdmin Login OK:', !!adminToken);

  // 2. Create a test user with NGUOI_XEM role
  const viewerEmail = 'viewer_test_' + Date.now() + '@dongquang.edu.vn';
  const createRes = await sendJson('POST', '/api/v1/nguoi-dung', {
    ho_ten: 'Người Xem Audit',
    email: viewerEmail,
    mat_khau: 'ViewerPassword123!',
    vai_tro: ['NGUOI_XEM'],
  }, adminToken);
  console.log('2. Tạo tài khoản NGUOI_XEM status:', createRes.status);

  // 3. Login as NGUOI_XEM
  const viewerLogin = await sendJson('POST', '/api/v1/xac-thuc/dang-nhap', {
    email: viewerEmail,
    mat_khau: 'ViewerPassword123!',
  });
  const viewerToken = viewerLogin.body.access_token;
  console.log('3. Đăng nhập NGUOI_XEM OK:', !!viewerToken);

  // 4. Try POST /api/v1/bai-viet (Requires bai_viet_tao)
  const createPostRes = await sendJson('POST', '/api/v1/bai-viet', { tieu_de: 'Hack Post' }, viewerToken);
  console.log('4. NGUOI_XEM tạo bài viết (POST /api/v1/bai-viet) -> Status:', createPostRes.status, createPostRes.body.message || createPostRes.body.thong_bao);

  // 5. Try DELETE /api/v1/video/123 (Requires video_xoa)
  const deleteVideoRes = await sendJson('DELETE', '/api/v1/video/123', null, viewerToken);
  console.log('5. NGUOI_XEM xóa video (DELETE /api/v1/video/123) -> Status:', deleteVideoRes.status, deleteVideoRes.body.message || deleteVideoRes.body.thong_bao);

  console.log('\n=== KẾT THÚC TEST 403 FORBIDDEN ===');
}

testRBACPermissionCheck();
