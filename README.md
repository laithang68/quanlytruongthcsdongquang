# CỔNG THÔNG TIN TRƯỜNG THCS ĐÔNG QUANG

**Đơn vị:** TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG  
**Kiến trúc:** Monorepo gồm `frontend/` (Next.js 14 App Router, TypeScript, Tailwind CSS) và `backend/` (NestJS, TypeScript, Prisma ORM, PostgreSQL).

---

## 1. Cấu trúc Thư mục

- `frontend/`: Giao diện Cổng thông tin công khai và Trang quản trị nhà trường (Next.js 14).
- `backend/`: Dịch vụ REST API, xác thực JWT, RBAC phân quyền, quản lý dữ liệu nghiệp vụ (NestJS).
- `docker-compose.yml`: Cấu hình chạy PostgreSQL cục bộ dành riêng cho môi trường development.
- `.env.example`: Mẫu khai báo biến môi trường chuẩn cho toàn hệ thống.

---

## 2. Hướng dẫn Chạy Cục bộ (Local Development)

### Bước 1: Khởi động Cơ sở dữ liệu PostgreSQL
```bash
docker-compose up -d
```

### Bước 2: Cài đặt và Khởi chạy Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run start:dev
```
- Backend lắng nghe tại: `http://localhost:3001` (API Prefix: `/api/v1`)
- Health check: `http://localhost:3001/api/v1/kiem-tra`

### Bước 3: Cài đặt và Khởi chạy Frontend
```bash
cd frontend
npm install
npm run dev
```
- Giao diện người dùng: `http://localhost:3000`
- Quản trị: `http://localhost:3000/quan-tri`

---

## 3. HƯỚNG DẪN TRIỂN KHAI PRODUCTION (PRODUCTION DEPLOYMENT)

### 3.1. Chuẩn bị Cơ sở dữ liệu PostgreSQL Production
1. Đăng ký dịch vụ PostgreSQL có hỗ trợ SSL và Persistent Storage (Khuyến nghị: **Neon.tech**, **Supabase**, **Render PostgreSQL** hoặc VPS PostgreSQL).
2. Tạo database mới (ví dụ: `thcs_dong_quang`).
3. Lấy chuỗi kết nối `DATABASE_URL` có tham số SSL:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require&schema=public
   ```

### 3.2. Triển khai Backend (Render / Railway / VPS)

#### A. Khai báo Biến Môi trường Backend (Environment Variables)
Cần cấu hình các biến sau trên dashboard của hosting (Render / Railway / VPS):
| Tên biến | Kiểu giá trị | Mô tả & Ví dụ |
|---|---|---|
| `NODE_ENV` | `production` | Bắt buộc để kích hoạt chế độ bảo mật, Secure Cookies và ẩn error stack traces |
| `PORT` | `3001` (hoặc do host cấp) | Cổng lắng nghe của NestJS |
| `DATABASE_URL` | String URI | Chuỗi kết nối PostgreSQL Production với `sslmode=require` |
| `FRONTEND_URL` | String URL | Domain chính thức của Frontend (vd: `https://thcsdongquang.edu.vn`) |
| `JWT_SECRET` | String (>=32 chars) | Khóa bí mật ký Access Token (sinh ngẫu nhiên bằng `openssl rand -base64 32`) |
| `JWT_EXPIRES_IN` | `15m` | Thời hạn sống của Access Token |
| `JWT_REFRESH_SECRET` | String (>=32 chars) | Khóa bí mật Refresh Token (độc lập với `JWT_SECRET`) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Thời hạn sống của Refresh Token |
| `QUAN_TRI_EMAIL` | Email | Email tài khoản Quản trị tối cao (Super Admin) |
| `QUAN_TRI_MAT_KHAU` | Mật khẩu mạnh | Mật khẩu khởi tạo Quản trị viên khi chạy Seed lần đầu |

#### B. Lệnh Build và Start Backend
- **Build Command:**
  ```bash
  npm install && npx prisma generate && npm run build
  ```
- **Pre-deploy / Release Command (Chạy Migration Production):**
  ```bash
  npm run prisma:migrate:deploy
  ```
  *(Lưu ý: TUYỆT ĐỐI KHÔNG dùng `prisma migrate dev` trên môi trường Production).*
- **Start Command:**
  ```bash
  npm run start:prod
  ```
  *(Thực thi `node dist/main`).*

#### C. Khởi tạo Dữ liệu Ban đầu (RBAC & Danh mục chuẩn)
Khi triển khai lần đầu trên database trắng, chạy lệnh seed để tạo 6 vai trò hệ thống, quyền hạn chi tiết và tài khoản Quản trị tối cao:
```bash
npm run seed
```

---

### 3.3. Triển khai Frontend (Vercel / Render / Cloudflare Pages)

#### A. Khai báo Biến Môi trường Frontend
| Tên biến | Giá trị mẫu | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.thcsdongquang.edu.vn` | Domain URL công khai của Backend API |

#### B. Lệnh Build và Start Frontend
- **Root Directory:** `frontend`
- **Framework Preset:** `Next.js`
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`

---

### 3.4. Cấu hình Tên miền & CORS & Cookies

1. **CORS:** Backend đã được thiết kế đọc biến `FRONTEND_URL`. Khi bạn cấu hình `FRONTEND_URL=https://thcsdongquang.edu.vn`, backend sẽ chỉ cho phép domain này gửi request kèm `credentials: true`.
2. **Cookie Security:** Refresh Token được lưu trong `HttpOnly Cookie`. Ở môi trường `NODE_ENV=production`, cờ `secure: true` sẽ tự động được kích hoạt, bắt buộc truyền qua giao thức HTTPS.
3. **Reverse Proxy / Trust Proxy:** Backend đã cấu hình `app.set('trust proxy', 1)` để nhận diện đúng IP client đằng sau Cloudflare/Render load balancer, đảm bảo bộ đếm Rate Limiting hoạt động chính xác cho từng người dùng Internet.

---

### 3.5. Chiến lược Lưu trữ Tệp tin (File Storage)

> [!WARNING]
> **Lưu ý về Ephemeral Filesystem trên Cloud Platform:**
> - Nếu triển khai Backend trên các nền tảng PaaS không có Persistent Disk (như gói miễn phí của Render, Heroku): Thư mục cục bộ `uploads/` sẽ bị xóa sạch mỗi khi container khởi động lại hoặc redeploy phiên bản mới.
> - **Giải pháp khuyến nghị cho Production:**
>   1. **VPS / Dedicated Server:** Dùng trực tiếp ổ cứng máy chủ (Persistent Disk).
>   2. **Cloud Storage (Khuyến nghị cho PaaS):** Tích hợp Cloudflare R2 (Miễn phí 10GB lưu trữ, không tính phí băng thông ra ngoài), Supabase Storage (500MB miễn phí), hoặc AWS S3.
>   3. **Render Persistent Disk:** Nếu tiếp tục sử dụng Render, có thể gắn thêm Persistent Disk mount vào đường dẫn `/uploads`.

---

### 3.6. Kiểm tra Sau khi Triển khai (Health Check)
Gửi HTTP request kiểm tra hệ thống:
```bash
curl -I https://api.your-domain.com/api/v1/kiem-tra
```
- Phản hồi mong đợi: HTTP 200 OK
- Nội dung trả về:
  ```json
  {
    "thanh_cong": true,
    "thong_bao": "Hệ thống đang hoạt động bình thường",
    "trang_thai_backend": "HOAT_DONG",
    "co_so_du_lieu": "DA_KET_NOI",
    "thoi_gian": "2026-09-15T..."
  }
  ```
*(Nếu cơ sở dữ liệu gặp sự cố, endpoint sẽ trả về HTTP 503 Service Unavailable kèm thông báo không làm lộ mật khẩu CSDL).*

---

### 3.7. Kế hoạch Khôi phục Sự cố (Rollback Plan)

1. **Rollback Ứng dụng:**
   - Trên Vercel / Render: Chọn bản build thành công trước đó trong danh sách Deployments và nhấn **Redeploy / Rollback**.
2. **Rollback Database Migration:**
   - Trường hợp migration mới gây lỗi, không tự ý xóa bảng. Sử dụng tính năng Point-in-time Recovery của nhà cung cấp CSDL (Neon/Supabase) để khôi phục trạng thái ổn định gần nhất.
