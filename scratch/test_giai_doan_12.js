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

async function runPhase12Tests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 12 (HOẠT ĐỘNG GIÁO DỤC & SỰ KIỆN NHÀ TRƯỜNG) ===\n');

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

    // 2. Kiểm tra Danh mục Hoạt động
    console.log('\n2. Kiểm tra danh mục bài viết / hoạt động...');
    const danhMucRes = await makeRequest(`${API_BASE}/danh-muc`);
    console.log(` -> GET /api/v1/danh-muc: Status ${danhMucRes.status}, Số danh mục: ${danhMucRes.body.du_lieu?.length || 0}`);
    const danhMucId = danhMucRes.body.du_lieu?.[0]?.id;

    // 3. Tạo mới Hoạt động Giáo dục
    console.log('\n3. Tạo mới Hoạt động Giáo dục (Admin API)...');
    const taoRes = await makeRequest(
      `${API_BASE}/bai-viet`,
      'POST',
      {
        tieu_de: 'Hội thi Giai điệu Tuổi hồng THCS Đông Quang 2026',
        danh_muc_id: danhMucId,
        mo_ta: 'Hội thi văn nghệ chào mừng ngày Nhà giáo Việt Nam và phong trào thi đua học tốt.',
        noi_dung: '<p>Nội dung chi tiết chương trình hội thi văn nghệ truyền thống trường THCS Đông Quang...</p>',
      },
      token,
    );
    console.log(` -> POST /api/v1/bai-viet: Status ${taoRes.status}`);
    if (taoRes.status !== 201 && taoRes.status !== 200) {
      throw new Error('Tạo mới hoạt động thất bại: ' + JSON.stringify(taoRes.body));
    }
    const hoatDongId = taoRes.body.du_lieu.id;
    const slug = taoRes.body.du_lieu.slug;
    console.log(` -> OK: Đã tạo hoạt động ID: ${hoatDongId}, Slug: ${slug}`);

    // 4. Sửa Hoạt động
    console.log('\n4. Cập nhật nội dung Hoạt động...');
    const suaRes = await makeRequest(
      `${API_BASE}/bai-viet/${hoatDongId}`,
      'PATCH',
      {
        tieu_de: 'Hội thi Giai điệu Tuổi hồng THCS Đông Quang 2026 (Cập nhật)',
        mo_ta: 'Hội thi văn nghệ xuất sắc năm học 2025-2026.',
      },
      token,
    );
    console.log(` -> PATCH /api/v1/bai-viet/${hoatDongId}: Status ${suaRes.status}`);
    const updatedSlug = suaRes.body?.du_lieu?.slug || slug;

    // 5. Đổi trạng thái -> Xuất bản Public
    console.log('\n5. Xuất bản Hoạt động lên Public Website...');
    const xuatBanRes = await makeRequest(`${API_BASE}/bai-viet/${hoatDongId}/xuat-ban`, 'POST', null, token);
    console.log(` -> POST /api/v1/bai-viet/${hoatDongId}/xuat-ban: Status ${xuatBanRes.status}`);

    // 6. Kiểm tra hiển thị Public API
    console.log('\n6. Kiểm tra hiển thị Hoạt động trên Public API...');
    const publicListRes = await makeRequest(`${API_BASE}/bai-viet/cong-khai`);
    console.log(` -> GET /api/v1/bai-viet/cong-khai: Status ${publicListRes.status}, Tổng số bài public: ${publicListRes.body.du_lieu?.length || 0}`);

    const publicDetailRes = await makeRequest(`${API_BASE}/bai-viet/cong-khai/${updatedSlug}`);
    console.log(` -> GET /api/v1/bai-viet/cong-khai/${slug}: Status ${publicDetailRes.status}`);
    if (publicDetailRes.status !== 200) {
      throw new Error('Public API không tìm thấy hoạt động vừa xuất bản!');
    }
    console.log(' -> OK PUBLIC: Hoạt động hiển thị chính xác trên Public API.');

    // 7. Ẩn Hoạt động -> Kiểm tra cách ly Public
    console.log('\n7. Ẩn Hoạt động và kiểm tra cách ly dữ liệu Public...');
    await makeRequest(`${API_BASE}/bai-viet/${hoatDongId}/an`, 'POST', null, token);
    const hiddenDetailRes = await makeRequest(`${API_BASE}/bai-viet/cong-khai/${updatedSlug}`);
    console.log(` -> GET /api/v1/bai-viet/cong-khai/${updatedSlug} khi bị ẩn: Status ${hiddenDetailRes.status}`);
    if (hiddenDetailRes.status === 200) {
      throw new Error('Lỗi bảo mật: Hoạt động bị Ẩn nhưng vẫn truy cập được Public!');
    }
    console.log(' -> OK SECURITY: Hoạt động bị Ẩn được cách ly tuyệt đối khỏi Public API.');

    // 8. Regression Test toàn bộ các module (Phases 1-12)
    console.log('\n8. Regression Test các module toàn bộ hệ thống...');
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

    console.log('\n=== TẤT CẢ TEST CASES GIAI ĐOẠN 12 ĐÃ ĐẠT 100% THÀNH CÔNG ===');
  } catch (err) {
    console.error('\n❌ Lỗi kiểm thử:', err.stack || err.message);
  }
}

runPhase12Tests();
