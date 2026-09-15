# ==============================================================================
# Multi-stage Dockerfile cho Backend NestJS - THCS Đông Quang
# Tương thích kiến trúc: AMD64 và ARM64 (Oracle Cloud VM.Standard.A1.Flex)
# ==============================================================================

# ------------------------------------------------------------------------------
# Giai đoạn 1: Build source code và chuẩn bị dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt công cụ biên dịch cho native addons (bcrypt, node-gyp) và OpenSSL cho Prisma
RUN apk add --no-cache libc6-compat python3 make g++ openssl

# Copy file định nghĩa package và Prisma schema trước để tận dụng Docker layer cache
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt toàn bộ dependencies (bao gồm devDependencies để build)
RUN npm ci

# Sinh Prisma Client
RUN npx prisma generate

# Copy toàn bộ mã nguồn backend
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Biên dịch NestJS TypeScript sang JavaScript (dist/main.js)
RUN npm run build

# Loại bỏ devDependencies để giảm kích thước node_modules
RUN npm prune --production

# ------------------------------------------------------------------------------
# Giai đoạn 2: Production Runtime Image (Minimal size, an toàn, non-root)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Cài đặt dumb-init để xử lý signals (SIGTERM/SIGINT) đúng cách cho PID 1,
# kèm libc6-compat, openssl và wget cho healthcheck
RUN apk add --no-cache dumb-init libc6-compat openssl wget

# Tạo user/group không quyền root (UID/GID 1001) để chạy ứng dụng an toàn
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Tạo thư mục lưu trữ uploads persistent và phân quyền cho user nestjs
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app

# Copy các artifacts đã biên dịch từ stage builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Chuyển sang người dùng non-root
USER nestjs

# Cổng lắng nghe
EXPOSE 3001

# Kiểm tra sức khỏe container bằng endpoint thực tế /api/v1/kiem-tra
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/v1/kiem-tra || exit 1

# Sử dụng dumb-init làm process supervisor để chuyển tiếp tín hiệu shutdown đúng
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main.js"]
