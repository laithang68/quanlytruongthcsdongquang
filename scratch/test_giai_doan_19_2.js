const http = require('http');
const { execSync } = require('child_process');

async function sendRequest(method, path, body, token, isMultipart = false) {
  return new Promise((resolve, reject) => {
    let headers = {};
    let dataStr = '';

    if (isMultipart) {
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      dataStr =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="test_document.pdf"\r\n` +
        `Content-Type: application/pdf\r\n\r\n` +
        `Dummy PDF content for GĐ19.2 testing\r\n` +
        `--${boundary}--\r\n`;
    } else if (body) {
      dataStr = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    if (dataStr) {
      headers['Content-Length'] = Buffer.byteLength(dataStr);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method,
      headers,
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

async function runTests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 19.2: HARDENING RBAC & LỌC MENU ADMIN THEO QUYỀN ===\n');

  // 1. Prisma Audit
  console.log('1. Kiểm tra CSDL Prisma Audit:');
  const valRes = execSync('npx prisma validate', { cwd: './backend', encoding: 'utf-8' });
  console.log(' -> Validate:', valRes.trim());
  const migRes = execSync('npx prisma migrate status', { cwd: './backend', encoding: 'utf-8' });
  console.log(' -> Migrate Status:', migRes.trim());

  // 2. SuperAdmin Login
  console.log('\n2. Đăng nhập tài khoản SuperAdmin:');
  const adminLogin = await sendRequest('POST', '/api/v1/xac-thuc/dang-nhap', {
    email: 'quantri@dongquang.edu.vn',
    mat_khau: 'DongQuang@2026!',
  });
  if (adminLogin.status !== 201 && adminLogin.status !== 200) {
    console.error(' ❌ SuperAdmin Login thất bại:', adminLogin);
    process.exit(1);
  }
  const adminToken = adminLogin.body.access_token;
  console.log(' -> SuperAdmin Token cấp thành công');

  // 3. Create NGUOI_XEM test account
  console.log('\n3. Tạo tài khoản NGUOI_XEM (chỉ có quyền xem):');
  const viewerEmail = 'viewer_19_2_' + Date.now() + '@dongquang.edu.vn';
  const createViewer = await sendRequest('POST', '/api/v1/nguoi-dung', {
    ho_ten: 'Người Xem Test 19.2',
    email: viewerEmail,
    mat_khau: 'ViewerPassword123!',
    vai_tro: ['NGUOI_XEM'],
  }, adminToken);
  console.log(' -> Tạo NGUOI_XEM Status:', createViewer.status);

  const viewerLogin = await sendRequest('POST', '/api/v1/xac-thuc/dang-nhap', {
    email: viewerEmail,
    mat_khau: 'ViewerPassword123!',
  });
  const viewerToken = viewerLogin.body.access_token;
  console.log(' -> Đăng nhập NGUOI_XEM Token cấp thành công');

  // 4. Test API Lớp học (GET /api/v1/lop-hoc & GET /api/v1/lop-hoc/:id)
  console.log('\n4. Kiểm tra Bảo vệ API Lớp học (GET /api/v1/lop-hoc):');
  const noTokenLopHoc = await sendRequest('GET', '/api/v1/lop-hoc');
  console.log(' -> GET /api/v1/lop-hoc không Token:', noTokenLopHoc.status, '(Kỳ vọng: 401)');
  if (noTokenLopHoc.status !== 401) {
    console.error(' ❌ Thất bại: API lớp học không trả về 401 khi chưa đăng nhập!');
    process.exit(1);
  }

  const noTokenLopHocDetail = await sendRequest('GET', '/api/v1/lop-hoc/123');
  console.log(' -> GET /api/v1/lop-hoc/123 không Token:', noTokenLopHocDetail.status, '(Kỳ vọng: 401)');
  if (noTokenLopHocDetail.status !== 401) {
    console.error(' ❌ Thất bại: API chi tiết lớp học không trả về 401 khi chưa đăng nhập!');
    process.exit(1);
  }

  const withTokenLopHoc = await sendRequest('GET', '/api/v1/lop-hoc', null, adminToken);
  console.log(' -> GET /api/v1/lop-hoc có Token SuperAdmin:', withTokenLopHoc.status, '(Kỳ vọng: 200)');
  if (withTokenLopHoc.status !== 200) {
    console.error(' ❌ Thất bại: API lớp học có Token không trả về 200!');
    process.exit(1);
  }

  // 5. Test Upload Tệp tin (POST /api/v1/tep-tin/upload)
  console.log('\n5. Kiểm tra Bảo vệ API Upload Tệp tin (POST /api/v1/tep-tin/upload):');
  const uploadNoPerm = await sendRequest('POST', '/api/v1/tep-tin/upload', null, viewerToken, true);
  console.log(' -> NGUOI_XEM Upload Tệp tin (POST /api/v1/tep-tin/upload):', uploadNoPerm.status, '(Kỳ vọng: 403)');
  if (uploadNoPerm.status !== 403) {
    console.error(' ❌ Thất bại: NGUOI_XEM upload file không bị chặn 403 Forbidden!');
    process.exit(1);
  }

  const uploadWithPerm = await sendRequest('POST', '/api/v1/tep-tin/upload', null, adminToken, true);
  console.log(' -> SuperAdmin Upload Tệp tin (POST /api/v1/tep-tin/upload):', uploadWithPerm.status, '(Kỳ vọng: 200 hoặc 201)');
  if (uploadWithPerm.status !== 200 && uploadWithPerm.status !== 201) {
    console.error(' ❌ Thất bại: SuperAdmin upload file thất bại:', uploadWithPerm);
    process.exit(1);
  }

  // 6. Regression test 9 Public API Endpoints
  console.log('\n6. Regression test 9 Public API Endpoints:');
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
    const r = await sendRequest('GET', ep);
    if (r.status === 200) {
      console.log(` -> ${ep}: Status 200 OK`);
    } else {
      console.error(` ❌ ${ep} thất bại với status ${r.status}`);
      process.exit(1);
    }
  }

  console.log('\n=== TẤT CẢ KỊCH BẢN KIỂM THỬ GIAI ĐOẠN 19.2 ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
