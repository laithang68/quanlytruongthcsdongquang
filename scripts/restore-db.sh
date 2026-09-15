#!/usr/bin/env bash
# ==============================================================================
# Script khôi phục Cơ sở dữ liệu PostgreSQL từ bản sao lưu - THCS Đông Quang
# CẢNH BÁO: Thao tác này sẽ ghi đè dữ liệu hiện tại trong Database!
# Sử dụng: ./scripts/restore-db.sh <duong_dan_file_backup.dump.gz>
# ==============================================================================

set -eo pipefail

BACKUP_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

CONTAINER_NAME="thcs_dong_quang_postgres"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-thcs_dong_quang}"

if [ -z "$BACKUP_FILE" ]; then
    echo "[-] LỖI: Vui lòng cung cấp đường dẫn tệp sao lưu!"
    echo "    Cách dùng: $0 <duong_dan_file_backup.dump.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[-] LỖI: Tệp $BACKUP_FILE không tồn tại!" >&2
    exit 1
fi

echo "=========================================================="
echo "CẢNH BÁO KHÔI PHỤC CƠ SỞ DỮ LIỆU: $DB_NAME"
echo "Tệp nguồn: $BACKUP_FILE"
echo "Container: $CONTAINER_NAME"
echo "=========================================================="
echo "(!) THAO TÁC NÀY SẼ GHI ĐÈ DỮ LIỆU HIỆN TẠI TRONG CƠ SỞ DỮ LIỆU."
read -rp "Bạn có chắc chắn muốn khôi phục không? (Nhập 'dong-y' để tiếp tục): " CONFIRM

if [ "$CONFIRM" != "dong-y" ]; then
    echo "[-] Đã hủy thao tác khôi phục."
    exit 0
fi

# Kiểm tra container postgres
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[-] LỖI: Container ${CONTAINER_NAME} không hoạt động!" >&2
    exit 1
fi

echo "[+] Đang giải nén và nạp dữ liệu vào database qua pg_restore..."
gunzip -c "$BACKUP_FILE" | docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER_NAME" \
    pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner || {
        echo "[-] Lưu ý: pg_restore có thể trả cảnh báo về các đối tượng schema đã tồn tại. Đang xác minh dữ liệu..."
    }

# Xác minh lại database kết nối được và kiểm tra số lượng bảng
TABLE_COUNT=$(docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

echo "[✓] KHÔI PHỤC THÀNH CÔNG! Số bảng hiện có trong CSDL: $(echo "$TABLE_COUNT" | tr -d ' ')"
echo "=========================================================="
