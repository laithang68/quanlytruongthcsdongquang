# HƯỚNG DẪN TRIỂN KHAI PRODUCTION (DEPLOY.MD)
## CỔNG THÔNG TIN TRƯỜNG THCS ĐÔNG QUANG

Tài liệu hướng dẫn chi tiết quy trình triển khai hệ thống lên hạ tầng đám mây **Oracle Cloud Always Free** sử dụng kiến trúc Docker Compose, Nginx Reverse Proxy, Next.js 14, NestJS và PostgreSQL 17.

---

## 1. YÊU CẦU MÁY CHỦ (SERVER REQUIREMENTS)

- **Nhà cung cấp:** Oracle Cloud Infrastructure (OCI) - Always Free Tier
- **Loại phiên bản (Shape):** `VM.Standard.A1.Flex` (Bộ vi xử lý Ampere Altra Arm 64-bit)
- **Cấu hình phần cứng:**
  - OCPU: 2 OCPU
  - RAM: 12 GB
  - Ổ đĩa lưu trữ (Boot Volume): 50 GB - 200 GB SSD
- **Hệ điều hành khuyến nghị:** Ubuntu 22.04 LTS (AArch64) hoặc Oracle Linux 9 (aarch64)
- **Mạng (Network / Security List):**
  - Mở cổng Ingress trong OCI Virtual Cloud Network (VCN) Security List:
    - Port `22` (SSH)
    - Port `80` (HTTP)
    - Port `443` (HTTPS)
  - **TUYỆT ĐỐI KHÔNG** mở port `5432` (PostgreSQL), `3000` (Next.js), `3001` (NestJS) ra ngoài Internet.
  - Mở tường lửa trên máy chủ Linux:
    ```bash
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
    sudo netfilter-persistent save # Hoặc iptables-save
    ```

---

## 2. CÀI ĐẶT DOCKER & DOCKER COMPOSE

Trên máy chủ Oracle VM (Ubuntu 22.04 LTS), chạy các lệnh sau:

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt các gói phụ trợ
sudo apt install -y ca-certificates curl gnupg lsb-release git ufw

# 3. Cài đặt Docker chính thức từ Docker repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Cấp quyền chạy Docker không cần sudo cho user hiện tại (ubuntu)
sudo usermod -aG docker $USER
newgrp docker

# 5. Kiểm tra phiên bản
docker --version
docker compose version
```

---

## 3. CẤU TRÚC THƯ MỤC HỆ THỐNG

Sau khi clone repository về thư mục `~/quanlytruongthcsdongquang`:

```text
quanlytruongthcsdongquang/
├── backend/                        # Backend NestJS
│   ├── Dockerfile                  # Multi-stage Dockerfile cho NestJS
│   ├── prisma/
│   │   ├── schema.prisma           # Định nghĩa Schema CSDL
│   │   ├── migrations/             # 11 Migrations CSDL
│   │   └── init-production.js      # Khởi tạo RBAC và Admin an toàn
│   └── src/                        # Mã nguồn NestJS
├── frontend/                       # Frontend Next.js 14
│   ├── Dockerfile                  # Multi-stage Dockerfile cho Next.js
│   └── src/                        # Mã nguồn React/Next.js
├── nginx/
│   └── nginx.conf                  # Cấu hình Reverse Proxy Gateway
├── scripts/
│   ├── backup-db.sh                # Script tự động sao lưu PostgreSQL
│   ├── backup-uploads.sh           # Script tự động sao lưu thư mục tải lên
│   └── restore-db.sh               # Script khôi phục CSDL an toàn
├── docker-compose.production.yml   # Khởi chạy toàn bộ hạ tầng production
├── deploy.sh                       # Script tự động hóa triển khai
├── .env.example                    # File mẫu biến môi trường
└── DEPLOY.md                       # Tài liệu này
```

---

## 4. THIẾT LẬP BIẾN MÔI TRƯỜNG PRODUCTION

Tại thư mục gốc dự án, tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
chmod 600 .env # Chỉ cho phép tài khoản chủ sở hữu đọc/ghi
nano .env
```

Điền các giá trị bí mật thực tế:

| Tên biến | Mô tả | Giá trị mẫu |
| :--- | :--- | :--- |
| `POSTGRES_USER` | Tên người dùng CSDL | `postgres` |
| `POSTGRES_PASSWORD` | Mật khẩu CSDL (Tối thiểu 16 ký tự phức tạp) | *(Tạo mật khẩu mạnh)* |
| `POSTGRES_DB` | Tên CSDL | `thcs_dong_quang` |
| `DATABASE_URL` | Chuỗi kết nối nội bộ cho Prisma | `postgresql://postgres:PASSWORD@postgres:5432/thcs_dong_quang?schema=public` |
| `JWT_SECRET` | Khóa ký Access Token (`openssl rand -base64 32`) | *(Chuỗi ngẫu nhiên 32+ ký tự)* |
| `JWT_REFRESH_SECRET` | Khóa ký Refresh Token (khác JWT_SECRET) | *(Chuỗi ngẫu nhiên 32+ ký tự)* |
| `FRONTEND_URL` | Địa chỉ truy cập Frontend | `http://<PUBLIC_IP_ORACLE>` (hoặc `https://dongquang.edu.vn`) |
| `COOKIE_SECURE` | Cờ Secure cho HttpOnly Cookie | `false` (khi dùng HTTP Public IP) / `true` (khi có HTTPS) |
| `NEXT_PUBLIC_API_URL` | URL API gọi từ Client | Để trống `""` (sử dụng Same-Origin qua Nginx) |
| `QUAN_TRI_EMAIL` | Email đăng nhập Admin | `thangbe6868@gmail.com` |
| `QUAN_TRI_USERNAME` | Tên đăng nhập Admin | `admin` |
| `QUAN_TRI_MAT_KHAU` | Mật khẩu Admin ban đầu | *(Mật khẩu an toàn, đổi sau khi đăng nhập)* |

> [!CAUTION]
> **TUYỆT ĐỐI KHÔNG** commit file `.env` chứa mật khẩu thật lên Git repository. File `.gitignore` đã được cấu hình chặn file `.env`.

---

## 5. TRIỂN KHAI LẦN ĐẦU TIÊN (FIRST DEPLOYMENT)

Chỉ cần chạy script tự động:

```bash
chmod +x deploy.sh scripts/*.sh
./deploy.sh
```

Script sẽ tự động thực hiện:
1. Xác thực các biến môi trường bắt buộc.
2. Tạo các Docker Volume lưu trữ lâu dài (`thcs_dong_quang_postgres_data`, `thcs_dong_quang_uploads_data`, `thcs_dong_quang_backups_data`).
3. Build các Docker image tối ưu cho kiến trúc CPU của máy chủ.
4. Kích hoạt PostgreSQL và chờ cơ sở dữ liệu sẵn sàng.
5. Chạy `npx prisma migrate deploy` để khởi tạo toàn bộ bảng trong CSDL.
6. Chạy `node prisma/init-production.js` để nạp 6 vai trò, 57 quyền RBAC và tạo tài khoản Admin.
7. Khởi chạy toàn bộ hệ thống gồm Frontend, Backend, Database và Nginx.
8. Kiểm tra sức khỏe tự động (Health check) và báo kết quả.

---

## 6. QUẢN LÝ DỊCH VỤ (START / STOP / RESTART)

Sử dụng Docker Compose với file cấu hình production:

```bash
# Xem trạng thái các container
docker compose -f docker-compose.production.yml ps

# Khởi động lại toàn bộ hệ thống
docker compose -f docker-compose.production.yml restart

# Dừng các dịch vụ (Dữ liệu vẫn được giữ an toàn trên Persistent Volumes)
docker compose -f docker-compose.production.yml stop

# Bật lại các dịch vụ đã dừng
docker compose -f docker-compose.production.yml start

# CẢNH BÁO: Không bao giờ thêm cờ -v khi down để tránh rủi ro xóa volume
docker compose -f docker-compose.production.yml down
```

---

## 7. THEO DÕI NHẬT KÝ (LOGS)

```bash
# Xem log toàn bộ hệ thống theo thời gian thực
docker compose -f docker-compose.production.yml logs -f

# Xem log riêng Backend NestJS
docker compose -f docker-compose.production.yml logs -f backend

# Xem log riêng Frontend Next.js
docker compose -f docker-compose.production.yml logs -f frontend

# Xem log riêng Nginx Reverse Proxy
docker compose -f docker-compose.production.yml logs -f nginx

# Xem log riêng PostgreSQL
docker compose -f docker-compose.production.yml logs -f postgres
```

---

## 8. SAO LƯU DỮ LIỆU TỰ ĐỘNG (BACKUP)

Hệ thống cung cấp sẵn 2 script sao lưu độc lập:

1. **Sao lưu Cơ sở dữ liệu:**
   ```bash
   ./scripts/backup-db.sh
   ```
   - Tạo file kết xuất nén: `backups/database/db_thcs_dong_quang_YYYYMMDD_HHMMSS.dump.gz`
   - Tự động dọn dẹp các bản sao lưu cũ hơn 7 ngày.

2. **Sao lưu Tệp tin tải lên (Uploads):**
   ```bash
   ./scripts/backup-uploads.sh
   ```
   - Tạo file lưu trữ nén: `backups/uploads/uploads_YYYYMMDD_HHMMSS.tar.gz`
   - Tự động dọn dẹp các bản sao lưu cũ hơn 14 ngày.

### Thiết lập Crontab tự động:
Chạy `crontab -e` và thêm 2 dòng sau:
```cron
# Sao lưu CSDL hàng ngày vào lúc 02:00 sáng
0 2 * * * /home/ubuntu/quanlytruongthcsdongquang/scripts/backup-db.sh >> /home/ubuntu/quanlytruongthcsdongquang/backups/backup.log 2>&1

# Sao lưu tệp tin tải lên vào 03:00 sáng Chủ Nhật hàng tuần
0 3 * * 0 /home/ubuntu/quanlytruongthcsdongquang/scripts/backup-uploads.sh >> /home/ubuntu/quanlytruongthcsdongquang/backups/backup.log 2>&1
```

---

## 9. KHÔI PHỤC CƠ SỞ DỮ LIỆU (RESTORE)

Khi cần khôi phục lại dữ liệu từ một bản sao lưu:

```bash
./scripts/restore-db.sh backups/database/db_thcs_dong_quang_YYYYMMDD_HHMMSS.dump.gz
```

Script sẽ yêu cầu nhập xác nhận `dong-y` trước khi thực hiện ghi đè để đảm bảo không bị thao tác nhầm lẫn.

---

## 10. CẬP NHẬT MÃ NGUỒN KHI CÓ THAY ĐỔI TRÊN GITHUB

Khi có code mới được commit lên branch `main`:

```bash
cd ~/quanlytruongthcsdongquang
./deploy.sh --pull
```

Script sẽ tự động kéo code mới, rebuild lại container, chạy migration mới (nếu có) và khởi động lại dịch vụ với downtime tối thiểu.

---

## 11. KIỂM TRA SỨC KHỎE HỆ THỐNG (HEALTH CHECK)

Có thể kiểm tra sức khỏe của hệ thống từ bên ngoài hoặc từ máy chủ:

```bash
# Kiểm tra API sức khỏe Backend + Database qua Nginx (Port 80)
curl -i http://localhost/api/v1/kiem-tra
```

**Kết quả bình thường (HTTP 200 OK):**
```json
{
  "thanh_cong": true,
  "trang_thai": "hoat_dong",
  "thoi_gian": "2026-09-15T02:45:00.000Z",
  "dich_vu": "Cong thong tin Dien tu THCS Dong Quang - Backend API Service",
  "database": "ket_noi_tot",
  "thong_ke_he_thong": {
    "so_bai_viet": 12,
    "so_giao_vien": 35,
    "so_hoc_sinh": 480
  }
}
```

Nếu cơ sở dữ liệu gặp sự cố ngắt kết nối, endpoint sẽ trả về **HTTP 503 Service Unavailable** và cờ `"database": "mat_ket_noi"`.

---

## 12. XỬ LÝ SỰ CỐ PHỔ BIẾN (TROUBLESHOOTING)

1. **Không thể truy cập bằng Public IP:**
   - Kiểm tra Security List trên Oracle Cloud Console đã mở Ingress Rule port 80/443 (CIDR: `0.0.0.0/0`) chưa.
   - Kiểm tra iptables trên máy chủ: `sudo iptables -L -n -v | grep 80`.
2. **Đăng nhập báo lỗi hoặc không lưu được phiên:**
   - Nếu đang truy cập qua HTTP bằng Public IP: Kiểm tra `COOKIE_SECURE` trong `.env` đã để là `false` chưa. Nếu để `true`, trình duyệt sẽ từ chối lưu HttpOnly cookie trên kết nối không có SSL.
3. **Database báo lỗi thiếu bộ nhớ:**
   - Kiểm tra bộ nhớ VM bằng `free -m`.
   - File cấu hình `docker-compose.production.yml` đã giới hạn tài nguyên hợp lý (PostgreSQL 2GB, Backend 2GB, Frontend 2GB) đảm bảo 12GB RAM của Oracle VM không bao giờ bị tràn.

---

## 13. CẤU HÌNH DOMAIN & CLOUDFLARE HTTPS (GIAI ĐOẠN TIẾP THEO)

Khi trường đã đăng ký tên miền chính thức (ví dụ: `thcsdongquang.edu.vn`):

1. **Cấu hình DNS trên Cloudflare:**
   - Thêm bản ghi `A` trỏ về Public IP của Oracle VM.
   - Bật đám mây màu cam (Proxy: ON) để kích hoạt Cloudflare CDN, chống DDoS và tự động cấp chứng chỉ SSL miễn phí.
2. **Cập nhật cấu hình trên máy chủ Oracle VM:**
   - Mở file `.env`:
     ```env
     FRONTEND_URL="https://thcsdongquang.edu.vn"
     COOKIE_SECURE=true
     ```
   - Khởi động lại dịch vụ:
     ```bash
     docker compose -f docker-compose.production.yml up -d
     ```
   - Hệ thống sẽ hoạt động ngay lập tức dưới giao thức HTTPS chuẩn quốc tế với đầy đủ tính năng bảo mật Cookie và Same-Origin.

---

## 14. NGUYÊN TẮC BẢO MẬT VẬN HÀNH (SECURITY BEST PRACTICES)

1. Không để cổng 5432 hoặc 3001 lộ ra ngoài Internet.
2. Định kỳ kiểm tra thư mục `backups/` và tải bản sao lưu về nơi an toàn.
3. Đổi mật khẩu tài khoản quản trị viên ngay sau lần đăng nhập đầu tiên.
4. Giữ cập nhật các gói bảo mật hệ điều hành máy chủ Linux bằng `sudo apt update && sudo apt upgrade -y`.
