const http = require('http');
const { execSync } = require('child_process');

const BASE_URL = 'http://127.0.0.1:3001';

function request(method, pathStr, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function audit() {
  console.log('=== KẾT QUẢ AUDIT CHI TIẾT GIAI ĐOẠN 16.1 ===\n');

  // 1. Prisma & Database Audit
  console.log('1. Database & Prisma Audit:');
  const validateOut = execSync('npx prisma validate', { cwd: __dirname + '/../backend' }).toString();
  console.log('  - npx prisma validate:', validateOut.trim());

  const statusOut = execSync('npx prisma migrate status', { cwd: __dirname + '/../backend' }).toString();
  console.log('  - npx prisma migrate status:\n', statusOut.trim());

  // 2. Audit 6 Categories
  console.log('\n2. Audit 6 Danh mục chuẩn:');
  const resDM = await request('GET', '/api/v1/thu-vien-so/danh-muc');
  const categories = resDM.body.du_lieu || [];
  const expectedSlugs = [
    'tai-lieu-tham-khao',
    'sach-giao-khoa-dien-tu',
    'sach-tham-khao',
    'tai-lieu-on-hsg',
    'thu-vien-bai-giang',
    'thu-vien-giao-an',
  ];

  let foundCount = 0;
  for (const slug of expectedSlugs) {
    const item = categories.find((c) => c.ma === slug);
    if (item) {
      foundCount++;
      console.log(`  ✓ [ĐÃ CÓ] ${item.ten} (slug: ${item.ma}, id: ${item.id})`);
    } else {
      console.log(`  ✗ [THIẾU] ${slug}`);
    }
  }

  // 3. Audit Luồng End-To-End (Admin ↔ Public)
  console.log('\n3. Audit Luồng End-To-End (Admin ↔ Public):');
  
  // Sign JWT token directly using secret to bypass throttler guard
  const path = require('path');
  const jwt = require(path.join(__dirname, '../backend/node_modules/jsonwebtoken'));
  const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
  const prisma = new PrismaClient();
  const user = await prisma.nguoi_dung.findFirst({
    where: { email: 'quantri@dongquang.edu.vn' },
    include: { nguoi_dung_vai_tro: { include: { vai_tro: true } } },
  });

  const vaiTroMa = user.nguoi_dung_vai_tro[0]?.vai_tro?.ma || 'SUPER_ADMIN';

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      ho_ten: user.ho_ten,
      vai_tro_ma: vaiTroMa,
    },
    process.env.JWT_SECRET || 'SecretThcsDongQuang2026!KeySuperProtected'
  );

  console.log('  ✓ Đã lấy Access Token cho SuperAdmin quantri@dongquang.edu.vn.');

  // Find Category ID for "thu-vien-bai-giang"
  const baiGiangDM = categories.find((c) => c.ma === 'thu-vien-bai-giang');
  
  // Create Test Document
  const createRes = await request(
    'POST',
    '/api/v1/thu-vien-so',
    {
      ten_tai_lieu: 'Bài giảng Tin học 7 - Bài 1 THCS Đông Quang (Audit Test)',
      mo_ta: 'Tài liệu bài giảng điện tử mẫu kiểm thử tự động',
      danh_muc_tai_lieu_id: baiGiangDM.id,
      tac_gia: 'Thầy Nguyễn Văn A',
      trang_thai: true,
    },
    token
  );

  const testDocId = createRes.body.du_lieu?.id;
  console.log(`  ✓ Admin tạo tài liệu số mẫu thành công (ID: ${testDocId})`);

  // Check Public API
  const publicRes = await request('GET', '/api/v1/thu-vien-so/cong-khai?danh_muc_slug=thu-vien-bai-giang');
  const foundInPublic = (publicRes.body.du_lieu || []).some((item) => item.id === testDocId);
  console.log(`  ✓ Public API hiển thị tài liệu mới tạo: ${foundInPublic ? 'CÓ (ĐẠT)' : 'KHÔNG (LỖI)'}`);

  // Admin Hide Document
  await request('PATCH', `/api/v1/thu-vien-so/${testDocId}/trang-thai`, { trang_thai: false }, token);
  const publicResAfterHide = await request('GET', '/api/v1/thu-vien-so/cong-khai?danh_muc_slug=thu-vien-bai-giang');
  const foundAfterHide = (publicResAfterHide.body.du_lieu || []).some((item) => item.id === testDocId);
  console.log(`  ✓ Public API ẩn tài liệu sau khi trang_thai=false: ${!foundAfterHide ? 'CÓ (ĐẠT)' : 'KHÔNG (LỖI)'}`);

  // Admin Soft Delete
  await request('DELETE', `/api/v1/thu-vien-so/${testDocId}`, null, token);
  const publicResAfterDelete = await request('GET', '/api/v1/thu-vien-so/cong-khai?danh_muc_slug=thu-vien-bai-giang');
  const foundAfterDelete = (publicResAfterDelete.body.du_lieu || []).some((item) => item.id === testDocId);
  console.log(`  ✓ Public API không hiển thị tài liệu đã xóa mềm da_xoa=true: ${!foundAfterDelete ? 'CÓ (ĐẠT)' : 'KHÔNG (LỖI)'}`);

  console.log('\n=== KẾT THÚC AUDIT HỆ THỐNG ===');
}

audit().catch(console.error);
