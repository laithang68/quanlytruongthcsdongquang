# CỔNG THÔNG TIN TRƯỜNG THCS ĐÔNG QUANG

**Đơn vị:** TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG

## Cấu trúc Dự án (Monorepo)

- `frontend/`: Ứng dụng Next.js (TypeScript, Tailwind CSS, App Router)
- `backend/`: Ứng dụng NestJS (TypeScript, Prisma ORM, PostgreSQL)
- `tai-lieu/`: Tài liệu kỹ thuật dự án
- `docker-compose.yml`: Cấu hình chạy PostgreSQL cục bộ
- `.env.example`: Mẫu cấu hình biến môi trường

## Hướng dẫn Chạy Hệ thống

### 1. Khởi động PostgreSQL
Môi trường mặc định sử dụng PostgreSQL Server 17 chạy tại `localhost:5432`.

### 2. Khởi động Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init_giai_doan_2
npx prisma db seed
npm run start:dev
```

### 3. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Kiểm tra trạng thái
- Frontend: `http://localhost:3000`
- Backend API Kiểm tra: `http://localhost:3001/api/v1/kiem-tra`
