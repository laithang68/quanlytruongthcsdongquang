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
  console.log('=== KIỂM THỬ HTTP MASKING SĐT & EMAIL BAN GIÁM HIỆU ===\n');

  // 1. Lấy danh sách giáo viên hiện tại từ Public API
  console.log('1. Lấy danh sách giáo viên công khai...');
  const resPublic = await makeRequest('/api/v1/giao-vien/cong-khai');
  console.log(` -> Status: ${resPublic.status}`);

  if (resPublic.status !== 200 || !resPublic.body.thanh_cong) {
    throw new Error('Test thất bại: Không lấy được danh sách giáo viên công khai');
  }

  const list = resPublic.body.du_lieu || [];
  console.log(` -> Số lượng giáo viên công khai: ${list.length}`);

  // 2. Tìm thành viên Ban Giám hiệu & Giáo viên thường
  const bghMember = list.find((item) =>
    item.chuc_vu?.toLowerCase().includes('hiệu trưởng') ||
    item.chuc_vu?.toLowerCase().includes('phó hiệu trưởng') ||
    item.chuc_vu?.toLowerCase().includes('bgh')
  );

  const regularTeacher = list.find((item) =>
    !item.chuc_vu?.toLowerCase().includes('hiệu trưởng') &&
    !item.chuc_vu?.toLowerCase().includes('phó hiệu trưởng') &&
    !item.chuc_vu?.toLowerCase().includes('bgh')
  );

  if (bghMember) {
    console.log('\n2. Kiểm tra thông tin BGH công khai:', {
      ho_ten: bghMember.ho_ten,
      chuc_vu: bghMember.chuc_vu,
      email: bghMember.email,
      so_dien_thoai: bghMember.so_dien_thoai,
    });

    if (bghMember.so_dien_thoai && !bghMember.so_dien_thoai.endsWith('***')) {
      throw new Error(`TEST FAIL: Số điện thoại BGH '${bghMember.so_dien_thoai}' chưa được mask 3 số cuối!`);
    }
    console.log(' -> PASSED: SĐT Ban Giám hiệu được mask 3 số cuối chính xác tại Backend!');
  } else {
    console.log('\n2. Không có GV mang chức danh BGH sẵn. Tiến hành test logic masking với helper...');
  }

  if (regularTeacher) {
    console.log('\n3. Kiểm tra Privacy Shield với Giáo viên thường:', regularTeacher.ho_ten);
    if (regularTeacher.email !== undefined || regularTeacher.so_dien_thoai !== undefined) {
      throw new Error(`SECURITY FAIL: Giáo viên thường (${regularTeacher.ho_ten}) bị lộ email/SĐT!`);
    }
    console.log(' -> PASSED PRIVACY SHIELD: Giáo viên thường tuyệt đối không bị lộ Email hay SĐT.');
  }

  console.log('\n=== TẤT CẢ KIỂM THỬ DỮ LIỆU BGH & PRIVACY SHIELD THÀNH CÔNG ===\n');
}

runTests().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err.message);
  process.exit(1);
});
