# ==============================================================================
# Multi-stage Dockerfile cho Frontend Next.js 14 - THCS Đông Quang
# Tương thích kiến trúc: AMD64 và ARM64 (Oracle Cloud VM.Standard.A1.Flex)
# ==============================================================================

# ------------------------------------------------------------------------------
# Giai đoạn 1: Build source code Next.js
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt libc6-compat để hỗ trợ Next.js SWC binary trên Alpine
RUN apk add --no-cache libc6-compat

# Copy định nghĩa dependencies
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm devDependencies để build)
RUN npm ci

# Copy toàn bộ mã nguồn frontend
COPY . .

# Biến build-time cho API URL (để trống khi deploy cùng Nginx reverse proxy Same-Origin)
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Biên dịch Next.js production build
RUN npm run build

# Loại bỏ devDependencies để thu gọn node_modules
RUN npm prune --production

# ------------------------------------------------------------------------------
# Giai đoạn 2: Production Runtime Image (Minimal, an toàn, non-root)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Cài đặt dumb-init để quản lý process signal và wget cho healthcheck
RUN apk add --no-cache dumb-init libc6-compat wget

# Tạo user/group non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy artifacts đã build từ stage builder
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Chuyển sang user non-root
USER nextjs

# Cổng lắng nghe
EXPOSE 3000

# Kiểm tra sức khỏe container bằng route gốc /
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

# Sử dụng dumb-init làm supervisor
ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "start"]
