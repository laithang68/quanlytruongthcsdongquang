const http = require('http');
const { execSync } = require('child_process');

const BASE_URL = 'http://127.0.0.1:3001';

function makeRequest(pathStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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
    req.end();
  });
}

async function runTests() {
  console.log('=== KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 17.1: ĐỒNG BỘ GIAO DIỆN CỔNG QUẢN TRỊ ===\n');

  // 1. Prisma Validate
  console.log('1. Prisma Database Audit:');
  const validateOut = execSync('npx prisma validate', { cwd: __dirname + '/../backend' }).toString();
  console.log(' -> Validate:', validateOut.trim());

  // 2. Test Live Statistics Endpoint (Dashboard API)
  console.log('\n2. Test GET /api/v1/kiem-tra/thong-ke...');
  const resStat = await makeRequest('/api/v1/kiem-tra/thong-ke');
  console.log(` -> Status: ${resStat.status}, Du lieu thong ke:`, resStat.body.du_lieu);
  if (resStat.status !== 200 || !resStat.body.thanh_cong) {
    throw new Error('Test Thong ke API failed!');
  }

  // 3. System Regression Test (Public & Auth APIs)
  console.log('\n3. Regression test 9 public endpoints...');
  const routes = [
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

  for (const r of routes) {
    const res = await makeRequest(r);
    console.log(` -> ${r}: Status ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Regression test failed at: ${r}`);
    }
  }

  console.log('\n=== TẤT CẢ KỊCH BẢN KIỂM THỬ GIAI ĐOẠN 17.1 ĐÃ ĐẠT 100% THÀNH CÔNG ===\n');
}

runTests().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err.message);
  process.exit(1);
});
