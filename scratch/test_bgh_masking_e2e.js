const http = require('http');

const BASE_URL = 'http://127.0.0.1:3001';

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: headers,
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('=== KIỂM THỬ E2E: THÔNG TIN LIÊN HỆ BAN GIÁM HIỆU & SĐT MASKED (0912345***) ===\n');

  // 1. Đăng nhập Admin
  console.log('1. Đăng nhập tài khoản Admin...');
  const loginRes = await makeRequest('/api/v1/xac-thuc/dang-nhap', 'POST', {
    email: 'quantri@dongquang.edu.vn',
    mat_khau: 'DongQuang@2026!',
  });

  if (loginRes.status !== 200 || !loginRes.body.thanh_cong) {
    throw new Error('Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản admin.');
  }

  const token = loginRes.body.du_lieu.access_token;
  console.log(' -> Đăng nhập thành công!');

  // 2. Lấy danh sách Tổ chuyên môn để gán
  const toRes = await makeRequest('/api/v1/to-chuyen-mon', 'GET');
  const toId = toRes.body.du_lieu[0]?.id;

  // 3. Tạo Cán bộ Ban Giám hiệu (Hiệu trưởng)
  console.log('\n2. Tạo mới Cán bộ Ban Giám hiệu (Hiệu trưởng) qua Admin API...');
  const gvPayload = {
    ho_ten: 'Trần Văn Hiệu Trưởng',
    chuc_vu: 'Hiệu trưởng',
    trinh_do: 'Thạc sĩ Quản lý Giáo dục',
    email: 'hieutruong@thcsdongquang.edu.vn',
    so_dien_thoai: '0912345678',
    to_chuyen_mon_id: toId,
    trang_thai: true,
  };

  const createRes = await makeRequest('/api/v1/giao-vien', 'POST', gvPayload, token);
  console.log(` -> POST /api/v1/giao-vien: Status ${createRes.status}`);

  let createdId = createRes.body.du_lieu?.id;
  if (!createdId) {
    // Nếu trùng email/SĐT hoặc đã tồn tại, lấy danh sách admin để lấy ID
    const listRes = await makeRequest('/api/v1/giao-vien', 'GET', null, token);
    const existing = listRes.body.du_lieu?.items?.find((i) => i.chuc_vu === 'Hiệu trưởng');
    if (existing) createdId = existing.id;
  }

  console.log(` -> ID Ban Giám hiệu: ${createdId}`);

  // 4. Test Public API GET /api/v1/giao-vien/cong-khai
  console.log('\n3. Test Public API GET /api/v1/giao-vien/cong-khai...');
  const publicRes = await makeRequest('/api/v1/giao-vien/cong-khai');
  console.log(` -> Status: ${publicRes.status}`);

  const publicList = publicRes.body.du_lieu || [];
  const bghPublic = publicList.find((i) => i.id === createdId || i.chuc_vu === 'Hiệu trưởng');

  if (!bghPublic) {
    throw new Error('Không tìm thấy cán bộ BGH trong Public API!');
  }

  console.log(' -> Thông tin BGH trả về cho Public Website:');
  console.log(`    - Họ tên: "${bghPublic.ho_ten}"`);
  console.log(`    - Chức vụ: "${bghPublic.chuc_vu}"`);
  console.log(`    - Trình độ: "${bghPublic.trinh_do}"`);
  console.log(`    - Email: "${bghPublic.email}"`);
  console.log(`    - Điện thoại: "${bghPublic.so_dien_thoai}"`);

  // KIỂM TRẢ SĐT MASKED 3 SỐ CUỐI
  if (bghPublic.so_dien_thoai !== '0912345***') {
    throw new Error(`KẾT QUẢ SAI: SĐT Public phải là '0912345***', thực tế nhận được '${bghPublic.so_dien_thoai}'`);
  }
  console.log(' -> PASSED SĐT MASKING: Số điện thoại đã được che 3 số cuối tại Backend (0912345***)!');

  // KIỂM TRẢ EMAIL FULL
  if (bghPublic.email !== 'hieutruong@thcsdongquang.edu.vn') {
    throw new Error(`KẾT QUẢ SAI: Email không khớp ('${bghPublic.email}')`);
  }
  console.log(' -> PASSED EMAIL: Email BGH hiển thị đầy đủ (hieutruong@thcsdongquang.edu.vn).');

  // KIỂM TRA BẢO MẬT: SĐT RAW KHÔNG XUẤT HIỆN TRONG RESPONSE JSON
  if (publicRes.raw.includes('0912345678')) {
    throw new Error('VI PHẠM BẢO MẬT: Chuỗi JSON Public API chứa SĐT nguyên bản 0912345678!');
  }
  console.log(' -> PASSED SECURITY: Public API JSON Response KHÔNG CHỨA SĐT nguyên bản 0912345678.');

  // 5. Test Public API GET /api/v1/giao-vien/cong-khai/:id
  console.log(`\n4. Test Public API GET /api/v1/giao-vien/cong-khai/${createdId}...`);
  const detailRes = await makeRequest(`/api/v1/giao-vien/cong-khai/${createdId}`);
  const detail = detailRes.body.du_lieu;

  if (detail.so_dien_thoai !== '0912345***' || detail.email !== 'hieutruong@thcsdongquang.edu.vn') {
    throw new Error('Test Detail API BGH thất bại!');
  }
  console.log(' -> PASSED DETAIL API: Trang chi tiết BGH công khai đúng SĐT masked (0912345***) & Email.');

  // 6. Test Admin API GET /api/v1/giao-vien/:id (RBAC)
  console.log(`\n5. Test Admin API GET /api/v1/giao-vien/${createdId} (Admin RBAC)...`);
  const adminDetailRes = await makeRequest(`/api/v1/giao-vien/${createdId}`, 'GET', null, token);
  const adminDetail = adminDetailRes.body.du_lieu;

  console.log(` -> Admin API SĐT: "${adminDetail.so_dien_thoai}"`);
  if (adminDetail.so_dien_thoai !== '0912345678') {
    throw new Error('Test Admin API thất bại: Admin phải nhận được SĐT gốc!');
  }
  console.log(' -> PASSED ADMIN RBAC: Admin API vẫn nhận đầy đủ SĐT gốc (0912345678).');

  console.log('\n=== TẤT CẢ TEST CASES CHO THÔNG TIN BAN GIÁM HIỆU ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err.message);
  process.exit(1);
});
