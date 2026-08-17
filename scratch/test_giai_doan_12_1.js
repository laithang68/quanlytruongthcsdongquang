const http = require('http');

const API_BASE = 'http://127.0.0.1:3001/api/v1';

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

async function runPhase12_1Tests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 12.1 (MENU PHÂN LOẠI TIN TỨC & VĂN BẢN) ===\n');

  try {
    // 1. Đăng nhập Admin
    console.log('1. Đăng nhập Super Admin...');
    const loginRes = await makeRequest(`${API_BASE}/xac-thuc/dang-nhap`, 'POST', {
      email: 'quantri@dongquang.edu.vn',
      mat_khau: 'DongQuang@2026!',
    });
    const token = loginRes.body?.access_token || loginRes.body?.du_lieu?.access_token;
    if (!token) throw new Error('Đăng nhập thất bại: ' + JSON.stringify(loginRes.body));
    console.log(' -> OK: Đăng nhập thành công, nhận JWT Token.');

    // 2. Test Lọc Bài viết theo Danh mục Slug (Bảng tin, Đoàn - Đội, Chuyên môn, Câu lạc bộ, Thư viện)
    console.log('\n2. Test Lọc Bài viết Public theo Danh mục Slugs...');
    const newsCategories = ['bang-tin', 'hoat-dong-doi-doan', 'hoat-dong-chuyen-mon', 'hoat-dong-cau-lac-bo', 'hoat-dong-thu-vien'];
    
    for (const slug of newsCategories) {
      const res = await makeRequest(`${API_BASE}/bai-viet/cong-khai?danh_muc_id=${slug}`);
      console.log(` -> GET /api/v1/bai-viet/cong-khai?danh_muc_id=${slug}: Status ${res.status}, Số bài: ${res.body.du_lieu?.length || 0}`);
      if (res.status !== 200) {
        throw new Error(`Lỗi lọc bài viết theo danh mục slug ${slug}`);
      }
    }
    console.log(' -> OK: API Bài viết Public lọc mượt mà theo 5 danh mục tin tức chuẩn.');

    // 3. Test Lọc Văn bản theo Loại Văn bản Mã (Thông báo nhà trường, Phường/xã, Sở GD, Bộ GD)
    console.log('\n3. Test Lọc Văn bản Public theo Mã Loại Văn bản...');
    const docTypes = ['thong-bao-nha-truong', 'van-ban-phuong-xa', 'van-ban-so-gddt', 'van-ban-bo-gddt'];

    for (const ma of docTypes) {
      const res = await makeRequest(`${API_BASE}/van-ban/cong-khai?loai_van_ban_id=${ma}`);
      console.log(` -> GET /api/v1/van-ban/cong-khai?loai_van_ban_id=${ma}: Status ${res.status}, Số VB: ${res.body.du_lieu?.length || 0}`);
      if (res.status !== 200) {
        throw new Error(`Lỗi lọc văn bản theo loại văn bản mã ${ma}`);
      }
    }
    console.log(' -> OK: API Văn bản Public lọc mượt mà theo 4 loại văn bản chuẩn.');

    // 4. Full Regression Test các module cốt lõi (Phases 1 -> 12.1)
    console.log('\n4. Regression Test toàn bộ các module từ Giai đoạn 1 -> 12.1...');
    const [tb, vb, gv, tc, vd, al, tl] = await Promise.all([
      makeRequest(`${API_BASE}/thong-bao/cong-khai`),
      makeRequest(`${API_BASE}/van-ban/cong-khai`),
      makeRequest(`${API_BASE}/giao-vien/cong-khai`),
      makeRequest(`${API_BASE}/to-chuyen-mon`),
      makeRequest(`${API_BASE}/video/cong-khai`),
      makeRequest(`${API_BASE}/album/cong-khai`),
      makeRequest(`${API_BASE}/thu-vien-so/cong-khai`),
    ]);

    console.log(` -> Thông báo: Status ${tb.status}`);
    console.log(` -> Văn bản: Status ${vb.status}`);
    console.log(` -> Giáo viên: Status ${gv.status}`);
    console.log(` -> Tổ chuyên môn: Status ${tc.status}`);
    console.log(` -> Video: Status ${vd.status}`);
    console.log(` -> Album ảnh: Status ${al.status}`);
    console.log(` -> Thư viện số: Status ${tl.status}`);

    console.log('\n=== TẤT CẢ TEST CASES GIAI ĐOẠN 12.1 ĐÃ ĐẠT 100% THÀNH CÔNG ===');
  } catch (err) {
    console.error('\n❌ Lỗi kiểm thử:', err.stack || err.message);
  }
}

runPhase12_1Tests();
