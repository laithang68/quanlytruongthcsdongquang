-- CreateEnum
CREATE TYPE "TrangThaiBaiViet" AS ENUM ('NHAP', 'CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'DA_XUAT_BAN', 'DA_LUU_TRU');

-- CreateEnum
CREATE TYPE "DoiTuongThongBao" AS ENUM ('CONG_KHAI', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HYNH');

-- CreateEnum
CREATE TYPE "TrangThaiLienHe" AS ENUM ('MOI', 'DANG_XU_LY', 'DA_XU_LY');

-- CreateTable
CREATE TABLE "nguoi_dung" (
    "id" TEXT NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "so_dien_thoai" TEXT,
    "mat_khau" TEXT NOT NULL,
    "anh_dai_dien" TEXT,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "lan_dang_nhap_cuoi" TIMESTAMP(3),
    "da_xoa" BOOLEAN NOT NULL DEFAULT false,
    "ngay_xoa" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vai_tro" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "mo_ta" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vai_tro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quyen_han" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "mo_ta" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quyen_han_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nguoi_dung_vai_tro" (
    "nguoi_dung_id" TEXT NOT NULL,
    "vai_tro_id" TEXT NOT NULL,

    CONSTRAINT "nguoi_dung_vai_tro_pkey" PRIMARY KEY ("nguoi_dung_id","vai_tro_id")
);

-- CreateTable
CREATE TABLE "vai_tro_quyen_han" (
    "vai_tro_id" TEXT NOT NULL,
    "quyen_han_id" TEXT NOT NULL,

    CONSTRAINT "vai_tro_quyen_han_pkey" PRIMARY KEY ("vai_tro_id","quyen_han_id")
);

-- CreateTable
CREATE TABLE "danh_muc" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mo_ta" TEXT,
    "danh_muc_cha_id" TEXT,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "danh_muc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bai_viet" (
    "id" TEXT NOT NULL,
    "tieu_de" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mo_ta" TEXT,
    "noi_dung" TEXT NOT NULL,
    "anh_dai_dien" TEXT,
    "danh_muc_id" TEXT NOT NULL,
    "tac_gia_id" TEXT NOT NULL,
    "trang_thai" "TrangThaiBaiViet" NOT NULL DEFAULT 'NHAP',
    "luot_xem" INTEGER NOT NULL DEFAULT 0,
    "ngay_gui_duyet" TIMESTAMP(3),
    "ngay_duyet" TIMESTAMP(3),
    "ngay_xuat_ban" TIMESTAMP(3),
    "da_xoa" BOOLEAN NOT NULL DEFAULT false,
    "ngay_xoa" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bai_viet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "the" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "the_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bai_viet_the" (
    "bai_viet_id" TEXT NOT NULL,
    "the_id" TEXT NOT NULL,

    CONSTRAINT "bai_viet_the_pkey" PRIMARY KEY ("bai_viet_id","the_id")
);

-- CreateTable
CREATE TABLE "thong_bao" (
    "id" TEXT NOT NULL,
    "tieu_de" TEXT NOT NULL,
    "noi_dung" TEXT NOT NULL,
    "doi_tuong" "DoiTuongThongBao" NOT NULL DEFAULT 'CONG_KHAI',
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "nguoi_tao_id" TEXT NOT NULL,
    "ngay_bat_dau" TIMESTAMP(3),
    "ngay_ket_thuc" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thong_bao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loai_van_ban" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "mo_ta" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loai_van_ban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "van_ban" (
    "id" TEXT NOT NULL,
    "ten_van_ban" TEXT NOT NULL,
    "so_hieu" TEXT NOT NULL,
    "loai_van_ban_id" TEXT NOT NULL,
    "ngay_ban_hanh" TIMESTAMP(3) NOT NULL,
    "nguoi_ky" TEXT,
    "mo_ta" TEXT,
    "tep_tin_id" TEXT,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "nguoi_tao_id" TEXT NOT NULL,
    "da_xoa" BOOLEAN NOT NULL DEFAULT false,
    "ngay_xoa" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "van_ban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "to_chuyen_mon" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "mo_ta" TEXT,
    "truong_to_id" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "to_chuyen_mon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giao_vien" (
    "id" TEXT NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "anh_dai_dien" TEXT,
    "chuc_vu" TEXT,
    "to_chuyen_mon_id" TEXT NOT NULL,
    "trinh_do" TEXT,
    "email" TEXT,
    "so_dien_thoai" TEXT,
    "gioi_thieu" TEXT,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "da_xoa" BOOLEAN NOT NULL DEFAULT false,
    "ngay_xoa" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "giao_vien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mo_ta" TEXT,
    "anh_dai_dien" TEXT,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "nguoi_tao_id" TEXT NOT NULL,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tep_tin" (
    "id" TEXT NOT NULL,
    "ten_goc" TEXT NOT NULL,
    "ten_luu_tru" TEXT NOT NULL,
    "duong_dan" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "loai_tap_tin" TEXT NOT NULL,
    "kich_thuoc" INTEGER NOT NULL,
    "nguoi_tai_len_id" TEXT NOT NULL,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tep_tin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_tep_tin" (
    "album_id" TEXT NOT NULL,
    "tep_tin_id" TEXT NOT NULL,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "album_tep_tin_pkey" PRIMARY KEY ("album_id","tep_tin_id")
);

-- CreateTable
CREATE TABLE "thanh_tich" (
    "id" TEXT NOT NULL,
    "tieu_de" TEXT NOT NULL,
    "doi_tuong" TEXT NOT NULL,
    "cap" TEXT,
    "nam_hoc" TEXT NOT NULL,
    "noi_dung" TEXT,
    "anh_dai_dien" TEXT,
    "tep_minh_chung_id" TEXT,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "nguoi_tao_id" TEXT NOT NULL,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thanh_tich_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tuyen_sinh" (
    "id" TEXT NOT NULL,
    "tieu_de" TEXT NOT NULL,
    "nam_hoc" TEXT NOT NULL,
    "noi_dung" TEXT NOT NULL,
    "thoi_gian" TEXT,
    "dieu_kien" TEXT,
    "ho_so" TEXT,
    "huong_dan" TEXT,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "nguoi_tao_id" TEXT NOT NULL,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tuyen_sinh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lien_he" (
    "id" TEXT NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "so_dien_thoai" TEXT NOT NULL,
    "email" TEXT,
    "noi_dung" TEXT NOT NULL,
    "trang_thai" "TrangThaiLienHe" NOT NULL DEFAULT 'MOI',
    "nguoi_xu_ly_id" TEXT,
    "ngay_xu_ly" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lien_he_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cau_hinh" (
    "id" TEXT NOT NULL,
    "ma_cau_hinh" TEXT NOT NULL,
    "ten_cau_hinh" TEXT NOT NULL,
    "gia_tri" TEXT NOT NULL,
    "mo_ta" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cau_hinh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky_he_thong" (
    "id" TEXT NOT NULL,
    "nguoi_dung_id" TEXT,
    "hanh_dong" TEXT NOT NULL,
    "doi_tuong" TEXT NOT NULL,
    "doi_tuong_id" TEXT,
    "noi_dung_cu" TEXT,
    "noi_dung_moi" TEXT,
    "dia_chi_ip" TEXT,
    "thong_tin_thiet_bi" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_he_thong_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_email_key" ON "nguoi_dung"("email");

-- CreateIndex
CREATE INDEX "nguoi_dung_email_idx" ON "nguoi_dung"("email");

-- CreateIndex
CREATE INDEX "nguoi_dung_trang_thai_idx" ON "nguoi_dung"("trang_thai");

-- CreateIndex
CREATE UNIQUE INDEX "vai_tro_ma_key" ON "vai_tro"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "quyen_han_ma_key" ON "quyen_han"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "danh_muc_slug_key" ON "danh_muc"("slug");

-- CreateIndex
CREATE INDEX "danh_muc_slug_idx" ON "danh_muc"("slug");

-- CreateIndex
CREATE INDEX "danh_muc_danh_muc_cha_id_idx" ON "danh_muc"("danh_muc_cha_id");

-- CreateIndex
CREATE UNIQUE INDEX "bai_viet_slug_key" ON "bai_viet"("slug");

-- CreateIndex
CREATE INDEX "bai_viet_slug_idx" ON "bai_viet"("slug");

-- CreateIndex
CREATE INDEX "bai_viet_trang_thai_idx" ON "bai_viet"("trang_thai");

-- CreateIndex
CREATE INDEX "bai_viet_danh_muc_id_idx" ON "bai_viet"("danh_muc_id");

-- CreateIndex
CREATE INDEX "bai_viet_tac_gia_id_idx" ON "bai_viet"("tac_gia_id");

-- CreateIndex
CREATE UNIQUE INDEX "the_slug_key" ON "the"("slug");

-- CreateIndex
CREATE INDEX "the_slug_idx" ON "the"("slug");

-- CreateIndex
CREATE INDEX "thong_bao_trang_thai_idx" ON "thong_bao"("trang_thai");

-- CreateIndex
CREATE INDEX "thong_bao_doi_tuong_idx" ON "thong_bao"("doi_tuong");

-- CreateIndex
CREATE UNIQUE INDEX "loai_van_ban_ma_key" ON "loai_van_ban"("ma");

-- CreateIndex
CREATE INDEX "van_ban_so_hieu_idx" ON "van_ban"("so_hieu");

-- CreateIndex
CREATE INDEX "van_ban_loai_van_ban_id_idx" ON "van_ban"("loai_van_ban_id");

-- CreateIndex
CREATE INDEX "giao_vien_to_chuyen_mon_id_idx" ON "giao_vien"("to_chuyen_mon_id");

-- CreateIndex
CREATE UNIQUE INDEX "album_slug_key" ON "album"("slug");

-- CreateIndex
CREATE INDEX "album_slug_idx" ON "album"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cau_hinh_ma_cau_hinh_key" ON "cau_hinh"("ma_cau_hinh");

-- AddForeignKey
ALTER TABLE "nguoi_dung_vai_tro" ADD CONSTRAINT "nguoi_dung_vai_tro_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nguoi_dung_vai_tro" ADD CONSTRAINT "nguoi_dung_vai_tro_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "vai_tro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vai_tro_quyen_han" ADD CONSTRAINT "vai_tro_quyen_han_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "vai_tro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vai_tro_quyen_han" ADD CONSTRAINT "vai_tro_quyen_han_quyen_han_id_fkey" FOREIGN KEY ("quyen_han_id") REFERENCES "quyen_han"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "danh_muc" ADD CONSTRAINT "danh_muc_danh_muc_cha_id_fkey" FOREIGN KEY ("danh_muc_cha_id") REFERENCES "danh_muc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bai_viet" ADD CONSTRAINT "bai_viet_danh_muc_id_fkey" FOREIGN KEY ("danh_muc_id") REFERENCES "danh_muc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bai_viet" ADD CONSTRAINT "bai_viet_tac_gia_id_fkey" FOREIGN KEY ("tac_gia_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bai_viet_the" ADD CONSTRAINT "bai_viet_the_bai_viet_id_fkey" FOREIGN KEY ("bai_viet_id") REFERENCES "bai_viet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bai_viet_the" ADD CONSTRAINT "bai_viet_the_the_id_fkey" FOREIGN KEY ("the_id") REFERENCES "the"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thong_bao" ADD CONSTRAINT "thong_bao_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "van_ban" ADD CONSTRAINT "van_ban_loai_van_ban_id_fkey" FOREIGN KEY ("loai_van_ban_id") REFERENCES "loai_van_ban"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "van_ban" ADD CONSTRAINT "van_ban_tep_tin_id_fkey" FOREIGN KEY ("tep_tin_id") REFERENCES "tep_tin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "van_ban" ADD CONSTRAINT "van_ban_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_vien" ADD CONSTRAINT "giao_vien_to_chuyen_mon_id_fkey" FOREIGN KEY ("to_chuyen_mon_id") REFERENCES "to_chuyen_mon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album" ADD CONSTRAINT "album_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_tin" ADD CONSTRAINT "tep_tin_nguoi_tai_len_id_fkey" FOREIGN KEY ("nguoi_tai_len_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_tep_tin" ADD CONSTRAINT "album_tep_tin_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_tep_tin" ADD CONSTRAINT "album_tep_tin_tep_tin_id_fkey" FOREIGN KEY ("tep_tin_id") REFERENCES "tep_tin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_tich" ADD CONSTRAINT "thanh_tich_tep_minh_chung_id_fkey" FOREIGN KEY ("tep_minh_chung_id") REFERENCES "tep_tin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_tich" ADD CONSTRAINT "thanh_tich_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuyen_sinh" ADD CONSTRAINT "tuyen_sinh_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lien_he" ADD CONSTRAINT "lien_he_nguoi_xu_ly_id_fkey" FOREIGN KEY ("nguoi_xu_ly_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_he_thong" ADD CONSTRAINT "nhat_ky_he_thong_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
