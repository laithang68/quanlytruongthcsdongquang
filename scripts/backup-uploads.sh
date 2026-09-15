#!/usr/bin/env bash
# ==============================================================================
# Script sao lưu tệp tin tải lên (Uploads) - THCS Đông Quang
# Tần suất khuyến nghị: Chạy hàng tuần qua Cron (0 3 * * 0 - 3h sáng Chủ Nhật)
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/uploads}"
VOLUME_NAME="thcs_dong_quang_uploads_data"
RETENTION_DAYS=14
MIN_DISK_FREE_MB=2048

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"

echo "=========================================================="
echo "BẮT ĐẦU SAO LƯU DỮ LIỆU UPLOADS"
echo "Thời gian: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================================="

# 1. Tạo thư mục chứa backup
mkdir -p "$BACKUP_DIR"

# 2. Kiểm tra dung lượng đĩa trống
AVAILABLE_MB=$(df -m "$BACKUP_DIR" | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_MB" -lt "$MIN_DISK_FREE_MB" ]; then
    echo "[-] LỖI: Dung lượng đĩa trống không đủ (${AVAILABLE_MB}MB < ${MIN_DISK_FREE_MB}MB). Hủy sao lưu uploads." >&2
    exit 1
fi

# 3. Kiểm tra volume có tồn tại không
if ! docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
    echo "[-] CẢNH BÁO: Docker volume $VOLUME_NAME không tồn tại. Thử kiểm tra thư mục uploads cục bộ..."
    if [ -d "$ROOT_DIR/backend/uploads" ]; then
        tar -czf "$BACKUP_FILE" -C "$ROOT_DIR/backend/uploads" .
    else
        echo "[-] LỖI: Không tìm thấy nguồn dữ liệu uploads!" >&2
        exit 1
    fi
else
    # 4. Sao lưu dữ liệu trực tiếp từ Docker named volume thông qua container phụ trợ an toàn (Read-Only)
    echo "[+] Đang nén dữ liệu từ Docker volume: $VOLUME_NAME..."
    docker run --rm \
        -v "$VOLUME_NAME":/source_uploads:ro \
        -v "$BACKUP_DIR":/target_backups \
        alpine:latest \
        tar -czf "/target_backups/uploads_${TIMESTAMP}.tar.gz" -C /source_uploads .
fi

# 5. Kiểm tra kết quả
if [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "[✓] SAO LƯU UPLOADS THÀNH CÔNG: $BACKUP_FILE (Kích thước: $BACKUP_SIZE)"
else
    echo "[-] LỖI: File sao lưu uploads rỗng hoặc tạo thất bại!" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 6. Dọn dẹp bản sao lưu cũ
echo "[+] Đang dọn dẹp bản sao lưu uploads cũ hơn $RETENTION_DAYS ngày..."
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete || true

echo "=========================================================="
echo "HOÀN TẤT SAO LƯU UPLOADS"
echo "=========================================================="
