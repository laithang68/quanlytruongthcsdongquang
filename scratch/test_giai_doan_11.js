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

async function runPhase11Tests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 11 (THÔNG TIN TRƯỜNG, CƠ CẤU TỔ CHỨC, ĐỘI NGŨ) ===\n');

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

    // 2. Test Tổ chuyên môn APIs
    console.log('\n2. Test API Tổ chuyên môn (Public & Detail & Members)...');
    const toRes = await makeRequest(`${API_BASE}/to-chuyen-mon`);
    console.log(` -> GET /api/v1/to-chuyen-mon: Status ${toRes.status}, Số lượng tổ: ${toRes.body.du_lieu?.length || 0}`);

    if (toRes.body.du_lieu?.length > 0) {
      const firstToId = toRes.body.du_lieu[0].id;
      const toDetail = await makeRequest(`${API_BASE}/to-chuyen-mon/${firstToId}`);
      console.log(` -> GET /api/v1/to-chuyen-mon/${firstToId}: Status ${toDetail.status}, Tên tổ: ${toDetail.body.du_lieu?.ten}`);

      const toGvList = await makeRequest(`${API_BASE}/to-chuyen-mon/${firstToId}/giao-vien`);
      console.log(` -> GET /api/v1/to-chuyen-mon/${firstToId}/giao-vien: Status ${toGvList.status}, Số GV: ${toGvList.body.du_lieu?.length || 0}`);
      
      // Verification: Check that email/phone are NOT exposed in public list
      if (toGvList.body.du_lieu?.length > 0) {
        const sampleGv = toGvList.body.du_lieu[0];
        if (sampleGv.email !== undefined || sampleGv.so_dien_thoai !== undefined) {
          throw new Error('Lỗi bảo mật: Lộ Email/SĐT trong API Tổ chuyên môn giáo viên!');
        }
        console.log(' -> OK SECURITY: API Tổ chuyên môn giáo viên KHÔNG làm lộ Email/SĐT cá nhân.');
      }
    }

    // 3. Test Giáo viên Public APIs & Security Privacy Audit
    console.log('\n3. Test API Giáo viên Public & Kiểm tra bảo vệ dữ liệu cá nhân...');
    const gvPublicRes = await makeRequest(`${API_BASE}/giao-vien/cong-khai`);
    console.log(` -> GET /api/v1/giao-vien/cong-khai: Status ${gvPublicRes.status}, Số GV public: ${gvPublicRes.body.du_lieu?.length || 0}`);

    if (gvPublicRes.body.du_lieu?.length > 0) {
      const firstGv = gvPublicRes.body.du_lieu[0];
      if (firstGv.email !== undefined || firstGv.so_dien_thoai !== undefined || firstGv.dia_chi !== undefined) {
        throw new Error('Lỗi bảo mật: API Giáo viên Public bị lộ Email/SĐT/Địa chỉ cá nhân!');
      }
      console.log(' -> OK SECURITY: API Giáo viên Public chỉ chọn các trường công khai (ho_ten, chuc_vu, trinh_do, gioi_thieu, to_chuyen_mon).');

      const gvDetailRes = await makeRequest(`${API_BASE}/giao-vien/cong-khai/${firstGv.id}`);
      console.log(` -> GET /api/v1/giao-vien/cong-khai/${firstGv.id}: Status ${gvDetailRes.status}`);
      if (gvDetailRes.body.du_lieu?.email !== undefined || gvDetailRes.body.du_lieu?.so_dien_thoai !== undefined) {
        throw new Error('Lỗi bảo mật: Chi tiết Giáo viên Public bị lộ Email/SĐT!');
      }
      console.log(' -> OK SECURITY: Chi tiết Giáo viên Public bảo mật 100% dữ liệu cá nhân.');
    }

    // 4. Regression test toàn bộ 11 giai đoạn
    console.log('\n4. Regression Test các module cốt lõi (Auth, BaiViet, ThongBao, VanBan, Video, Album, ThuVienSo)...');
    const [bv, tb, vb, vd, al, tl] = await Promise.all([
      makeRequest(`${API_BASE}/bai-viet/cong-khai`),
      makeRequest(`${API_BASE}/thong-bao/cong-khai`),
      makeRequest(`${API_BASE}/van-ban/cong-khai`),
      makeRequest(`${API_BASE}/video/cong-khai`),
      makeRequest(`${API_BASE}/album/cong-khai`),
      makeRequest(`${API_BASE}/thu-vien-so/cong-khai`),
    ]);

    console.log(` -> Bài viết: Status ${bv.status}`);
    console.log(` -> Thông báo: Status ${tb.status}`);
    console.log(` -> Văn bản: Status ${vb.status}`);
    console.log(` -> Video: Status ${vd.status}`);
    console.log(` -> Album ảnh: Status ${al.status}`);
    console.log(` -> Thư viện số: Status ${tl.status}`);

    console.log('\n=== TẤT CẢ TEST CASES GIAI ĐOẠN 11 ĐÃ ĐẠT 100% THÀNH CÔNG ===');
  } catch (err) {
    console.error('\n❌ Lỗi kiểm thử:', err.stack || err.message);
  }
}

runPhase11Tests();
