import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !jwtRefreshSecret) {
    console.error(
      'Lỗi cấu hình nghiêm trọng: JWT_SECRET hoặc JWT_REFRESH_SECRET chưa được thiết lập trong biến môi trường.',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Cấu hình trust proxy để nhận diện đúng IP client đằng sau Reverse Proxy / Load Balancer (Render, Vercel, Railway, Cloudflare)
  const expressApp = app.getHttpAdapter().getInstance() as express.Express;
  expressApp.set('trust proxy', 1);

  // Tích hợp Cookie Parser cho HttpOnly Cookie
  app.use(cookieParser());

  // Phục vụ file tĩnh trong thư mục uploads/ với CORS & PDF headers chuẩn, cấm truy cập dotfiles (.env)
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads'), {
      dotfiles: 'deny',
      setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        if (filePath.toLowerCase().endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');
        }
      },
    }),
  );

  // Xử lý route gốc / trả về thông tin API thay vì 404 (Sử dụng FRONTEND_URL từ biến môi trường)
  const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins: string[] = rawFrontendUrl
    .split(',')
    .map((u) => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    if (!allowedOrigins.includes('http://localhost:3000')) allowedOrigins.push('http://localhost:3000');
    if (!allowedOrigins.includes('http://127.0.0.1:3000')) allowedOrigins.push('http://127.0.0.1:3000');
  }

  app.use((req, res, next) => {
    if (req.path === '/' || req.path === '') {
      const primaryFrontendUrl = allowedOrigins[0] || 'http://localhost:3000';
      return res.json({
        thanh_cong: true,
        thong_bao: 'Cổng thông tin Trường THCS Đông Quang - Backend API Service đang hoạt động',
        api_prefix: '/api/v1',
        frontend_website: primaryFrontendUrl,
        quan_tri_admin: `${primaryFrontendUrl}/quan-tri`,
      });
    }
    next();
  });

  // Thiết lập Global Prefix theo quy định API
  app.setGlobalPrefix('api/v1');

  // Cấu hình CORS an toàn với Credentials cho domain Frontend
  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (curl, server-to-server, mobile app, internal proxy)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Kích hoạt Graceful Shutdown hooks cho Docker signal handling (SIGTERM, SIGINT)
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend NestJS đang chạy tại cổng: ${port} (api prefix: /api/v1)`);
}

bootstrap();

