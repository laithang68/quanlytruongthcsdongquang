#!/usr/bin/env bash
# ==============================================================================
# Script triển khai tự động Production - Cổng thông tin THCS Đông Quang
# Sử dụng trên Oracle Cloud Always Free VM (Linux Ubuntu / Oracle Linux ARM64/AMD64)
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env"

echo "=========================================================="
echo "  BẮT ĐẦU TRIỂN KHAI PRODUCTION - THCS ĐÔNG QUANG"
echo "  Thời gian: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================================="

# ------------------------------------------------------------------------------
# 1. Kiểm tra môi trường & Công cụ bắt buộc
# ------------------------------------------------------------------------------
echo "[+] 1/7. Kiểm tra hệ thống và công cụ..."

if ! command -v docker >/dev/null 2>&1; then
    echo "[-] LỖI: Docker chưa được cài đặt. Vui lòng cài đặt Docker trước." >&2
    exit 1
fi

DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "[-] LỖI: Docker Compose chưa được cài đặt." >&2
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "[-] LỖI: Tệp cấu hình '$ENV_FILE' không tồn tại!" >&2
    echo "    Vui lòng tạo '$ENV_FILE' từ '.env.example' và điền secret production trước khi chạy deploy." >&2
    exit 1
fi

# Nạp biến môi trường để kiểm tra các biến bắt buộc
set -a
source "$ENV_FILE"
set +a

MISSING_VARS=()
[ -z "$POSTGRES_PASSWORD" ] && MISSING_VARS+=("POSTGRES_PASSWORD")
[ -z "$JWT_SECRET" ] && MISSING_VARS+=("JWT_SECRET")
[ -z "$JWT_REFRESH_SECRET" ] && MISSING_VARS+=("JWT_REFRESH_SECRET")

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "[-] LỖI: Các biến môi trường bắt buộc sau chưa được thiết lập trong $ENV_FILE:" >&2
    for v in "${MISSING_VARS[@]}"; do
        echo "    - $v" >&2
    done
    exit 1
fi
echo "[✓] Đã xác thực đầy đủ các biến môi trường production."

# ------------------------------------------------------------------------------
# 2. Cập nhật mã nguồn mới nhất từ Git (nếu truyền cờ --pull hoặc mặc định)
# ------------------------------------------------------------------------------
if [ "$1" == "--pull" ] || [ -d ".git" ]; then
    echo "[+] 2/7. Đồng bộ mã nguồn từ git repository..."
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        git fetch origin main || true
        # Chỉ cập nhật nếu không có thay đổi cục bộ chưa commit
        if git diff-index --quiet HEAD --; then
            git pull --ff-only origin main || echo "[!] Cảnh báo: Không thể fast-forward git pull, tiếp tục với mã nguồn hiện tại."
        else
            echo "[!] Cảnh báo: Thư mục có thay đổi chưa commit. Bỏ qua git pull để tránh xung đột."
        fi
    fi
else
    echo "[+] 2/7. Bỏ qua git pull."
fi

# ------------------------------------------------------------------------------
# 3. Đảm bảo Persistent Volumes tồn tại an toàn (Không bao giờ xóa)
# ------------------------------------------------------------------------------
echo "[+] 3/7. Đảm bảo các volume lưu trữ dữ liệu lâu dài (Persistent Volumes)..."
docker volume create thcs_dong_quang_postgres_data >/dev/null 2>&1 || true
docker volume create thcs_dong_quang_uploads_data >/dev/null 2>&1 || true
docker volume create thcs_dong_quang_backups_data >/dev/null 2>&1 || true
mkdir -p backups/database backups/uploads
echo "[✓] Các persistent volume đã sẵn sàng."

# ------------------------------------------------------------------------------
# 4. Build Docker Images cho Production
# ------------------------------------------------------------------------------
echo "[+] 4/7. Đang build Docker Images (Frontend Next.js, Backend NestJS)..."
$DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" build --parallel
echo "[✓] Build Docker Images thành công."

# ------------------------------------------------------------------------------
# 5. Khởi động PostgreSQL và Chạy Prisma Migration Deploy
# ------------------------------------------------------------------------------
echo "[+] 5/7. Khởi động cơ sở dữ liệu và thực hiện di chuyển lược đồ (Prisma Migrate Deploy)..."
$DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d postgres

echo "    Đang chờ PostgreSQL sẵn sàng nhận kết nối..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker exec thcs_dong_quang_postgres pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-thcs_dong_quang}" >/dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "[-] LỖI: PostgreSQL không sẵn sàng sau ${MAX_RETRIES} giây. Hủy deployment!" >&2
        exit 1
    fi
    sleep 1
done
echo "[✓] PostgreSQL đã kết nối thành công."

echo "    Đang áp dụng migration vào database..."
if ! $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy; then
    echo "[-] LỖI NGHIÊM TRỌNG: 'prisma migrate deploy' thất bại! Dừng triển khai để bảo vệ dữ liệu." >&2
    exit 1
fi
echo "[✓] Migration đã được áp dụng thành công."

echo "    Đang đồng bộ vai trò, quyền hạn RBAC và tài khoản Quản trị viên..."
$DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" run --rm backend npm run init:prod || {
    echo "[!] Cảnh báo: Lỗi khi chạy init:prod. Kiểm tra lại dữ liệu ban đầu."
}

# ------------------------------------------------------------------------------
# 6. Khởi động toàn bộ dịch vụ (Backend, Frontend, Nginx)
# ------------------------------------------------------------------------------
echo "[+] 6/7. Khởi động các dịch vụ Production..."
# TUYỆT ĐỐI KHÔNG dùng down -v
$DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d --remove-orphans
echo "[✓] Các container đã được kích hoạt."

# ------------------------------------------------------------------------------
# 7. Kiểm tra sức khỏe hệ thống (Health Check)
# ------------------------------------------------------------------------------
echo "[+] 7/7. Kiểm tra trạng thái hoạt động thực tế..."
echo "    Đang chờ các dịch vụ ổn định..."
sleep 8

HEALTH_PASSED=true

# 1. Kiểm tra Backend qua internal port 3001
echo "    Kiểm tra Backend Health API (/api/v1/kiem-tra)..."
BACKEND_STATUS=$(docker exec thcs_dong_quang_backend wget -qO- http://127.0.0.1:3001/api/v1/kiem-tra 2>/dev/null || echo "FAILED")
if echo "$BACKEND_STATUS" | grep -q '"trang_thai":"hoat_dong"'; then
    echo "    [✓] Backend + Database kết nối hoàn hảo."
else
    echo "    [-] Backend Health Check thất bại! Nội dung trả về: $BACKEND_STATUS" >&2
    HEALTH_PASSED=false
fi

# 2. Kiểm tra Frontend qua internal port 3000
echo "    Kiểm tra Frontend HTML render (/)..."
FRONTEND_STATUS=$(docker exec thcs_dong_quang_frontend wget -qO- http://127.0.0.1:3000/ 2>/dev/null || echo "FAILED")
if [ "$FRONTEND_STATUS" != "FAILED" ] && [ -n "$FRONTEND_STATUS" ]; then
    echo "    [✓] Frontend Next.js đang phục vụ trang chủ."
else
    echo "    [-] Frontend Health Check thất bại!" >&2
    HEALTH_PASSED=false
fi

# 3. Kiểm tra Nginx Reverse Proxy qua port 80
echo "    Kiểm tra Nginx Gateway (Port 80)..."
NGINX_STATUS=$(docker exec thcs_dong_quang_nginx wget -qO- http://127.0.0.1/api/v1/kiem-tra 2>/dev/null || echo "FAILED")
if echo "$NGINX_STATUS" | grep -q '"trang_thai":"hoat_dong"'; then
    echo "    [✓] Nginx Reverse Proxy điều tuyến chính xác."
else
    echo "    [-] Nginx Proxy Check thất bại! Nội dung: $NGINX_STATUS" >&2
    HEALTH_PASSED=false
fi

echo "=========================================================="
if [ "$HEALTH_PASSED" = true ]; then
    echo "  KẾT QUẢ: TRIỂN KHAI THÀNH CÔNG (PASS)"
    echo "  Hệ thống Cổng thông tin THCS Đông Quang đã sẵn sàng!"
    echo "  Truy cập hệ thống: http://<PUBLIC_IP>/"
    echo "  Trang quản trị:    http://<PUBLIC_IP>/dang-nhap"
    echo "=========================================================="
    exit 0
else
    echo "  KẾT QUẢ: TRIỂN KHAI CÓ LỖI (FAIL)"
    echo "  Vui lòng kiểm tra logs bằng: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs -n 50"
    echo "=========================================================="
    exit 1
fi
