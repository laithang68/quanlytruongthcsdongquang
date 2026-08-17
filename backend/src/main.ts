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

  // Tích hợp Cookie Parser cho HttpOnly Cookie
  app.use(cookieParser());

  // Phục vụ file tĩnh trong thư mục uploads/ với CORS & PDF headers chuẩn
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads'), {
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

  // Xử lý route gốc / trả về thông tin API thay vì 404
  app.use((req, res, next) => {
    if (req.path === '/' || req.path === '') {
      return res.json({
        thanh_cong: true,
        thong_bao: 'Cổng thông tin Trường THCS Đông Quang - Backend API Service đang hoạt động',
        api_prefix: '/api/v1',
        frontend_website: 'http://localhost:3000',
        quan_tri_admin: 'http://localhost:3000/quan-tri',
      });
    }
    next();
  });

  // Thiết lập Global Prefix theo quy định API
  app.setGlobalPrefix('api/v1');

  // Cấu hình CORS an toàn với Credentials
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend NestJS đang chạy tại: http://localhost:${port}/api/v1`);
}

bootstrap();
