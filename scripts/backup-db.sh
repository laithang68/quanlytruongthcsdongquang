#!/usr/bin/env bash
# ==============================================================================
# Script sao lưu tự động Cơ sở dữ liệu PostgreSQL - THCS Đông Quang
# Tần suất khuyến nghị: Chạy hàng ngày qua Cron (0 2 * * * - lúc 2h sáng)
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    # Load biến môi trường từ .env
    set -a
    source "$ENV_FILE"
    set +a
fi

CONTAINER_NAME="thcs_dong_quang_postgres"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-thcs_dong_quang}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/database}"
RETENTION_DAYS=7
MIN_DISK_FREE_MB=1024

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.dump.gz"

echo "=========================================================="
echo "BẮT ĐẦU SAO LƯU DATABASE: $DB_NAME"
echo "Thời gian: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================================="

# 1. Tạo thư mục chứa backup nếu chưa có
mkdir -p "$BACKUP_DIR"

# 2. Kiểm tra dung lượng đĩa trống trên host (tối thiểu 1GB)
AVAILABLE_MB=$(df -m "$BACKUP_DIR" | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_MB" -lt "$MIN_DISK_FREE_MB" ]; then
    echo "[-] LỖI: Dung lượng đĩa trống không đủ (${AVAILABLE_MB}MB < ${MIN_DISK_FREE_MB}MB). Hủy sao lưu để bảo vệ hệ thống." >&2
    exit 1
fi

# 3. Kiểm tra container postgres có đang hoạt động không
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[-] LỖI: Container ${CONTAINER_NAME} không hoạt động!" >&2
    exit 1
fi

# 4. Thực hiện pg_dump định dạng custom (-Fc) kết hợp nén gzip
echo "[+] Đang kết xuất và nén cơ sở dữ liệu từ container..."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER_NAME" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc --no-owner --clean --if-exists | gzip > "$BACKUP_FILE"

# 5. Kiểm tra tính hợp lệ và dung lượng file backup
if [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "[✓] SAO LƯU THÀNH CÔNG: $BACKUP_FILE (Kích thước: $BACKUP_SIZE)"
else
    echo "[-] LỖI: File sao lưu rỗng hoặc tạo thất bại!" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 6. Dọn dẹp bản sao lưu cũ (giữ lại 7 ngày gần nhất)
echo "[+] Đang dọn dẹp các bản sao lưu cũ hơn $RETENTION_DAYS ngày..."
find "$BACKUP_DIR" -name "db_${DB_NAME}_*.dump.gz" -type f -mtime +$RETENTION_DAYS -delete || true

echo "=========================================================="
echo "HOÀN TẤT SAO LƯU CƠ SỞ DỮ LIỆU"
echo "=========================================================="
