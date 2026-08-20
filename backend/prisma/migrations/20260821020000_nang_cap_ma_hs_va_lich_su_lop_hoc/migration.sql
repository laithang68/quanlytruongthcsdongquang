-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TrangThaiHocSinh" AS ENUM ('DANG_HOC', 'LUU_BAN', 'THOI_HOC', 'CHUYEN_TRUONG', 'TOT_NGHIEP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable nguoi_dung
ALTER TABLE "nguoi_dung" ADD COLUMN IF NOT EXISTS "ten_dang_nhap" TEXT;
ALTER TABLE "nguoi_dung" ADD COLUMN IF NOT EXISTS "mat_khau_mac_dinh" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "nguoi_dung" ADD COLUMN IF NOT EXISTS "yeu_cau_doi_mat_khau" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "nguoi_dung_ten_dang_nhap_key" ON "nguoi_dung"("ten_dang_nhap");
CREATE INDEX IF NOT EXISTS "nguoi_dung_ten_dang_nhap_idx" ON "nguoi_dung"("ten_dang_nhap");

-- AlterTable hoc_sinh
ALTER TABLE "hoc_sinh" ADD COLUMN IF NOT EXISTS "nam_nhap_hoc" INTEGER NOT NULL DEFAULT 2026;
ALTER TABLE "hoc_sinh" ADD COLUMN IF NOT EXISTS "khoi_nhap_hoc" INTEGER NOT NULL DEFAULT 6;
ALTER TABLE "hoc_sinh" ADD COLUMN IF NOT EXISTS "trang_thai_hoc_sinh" "TrangThaiHocSinh" NOT NULL DEFAULT 'DANG_HOC';
ALTER TABLE "hoc_sinh" ADD COLUMN IF NOT EXISTS "nam_tot_nghiep" TEXT;
ALTER TABLE "hoc_sinh" ADD COLUMN IF NOT EXISTS "ngay_tot_nghiep" TIMESTAMP(3);
ALTER TABLE "hoc_sinh" ADD COLUMN IF NOT EXISTS "nguoi_dung_id" TEXT;

-- CreateIndex for hoc_sinh
CREATE UNIQUE INDEX IF NOT EXISTS "hoc_sinh_nguoi_dung_id_key" ON "hoc_sinh"("nguoi_dung_id");
CREATE INDEX IF NOT EXISTS "hoc_sinh_nam_nhap_hoc_idx" ON "hoc_sinh"("nam_nhap_hoc");
CREATE INDEX IF NOT EXISTS "hoc_sinh_khoi_nhap_hoc_idx" ON "hoc_sinh"("khoi_nhap_hoc");
CREATE INDEX IF NOT EXISTS "hoc_sinh_trang_thai_hoc_sinh_idx" ON "hoc_sinh"("trang_thai_hoc_sinh");

-- CreateTable lich_su_lop_hoc
CREATE TABLE IF NOT EXISTS "lich_su_lop_hoc" (
    "id" TEXT NOT NULL,
    "hoc_sinh_id" TEXT NOT NULL,
    "lop_hoc_id" TEXT NOT NULL,
    "nam_hoc" TEXT NOT NULL,
    "khoi" INTEGER NOT NULL,
    "so_thu_tu" INTEGER,
    "trang_thai_hoc_tap" TEXT NOT NULL DEFAULT 'DANG_HOC',
    "ngay_bat_dau" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_ket_thuc" TIMESTAMP(3),
    "ghi_chu" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lich_su_lop_hoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for lich_su_lop_hoc
CREATE UNIQUE INDEX IF NOT EXISTS "lich_su_lop_hoc_hoc_sinh_id_nam_hoc_lop_hoc_id_key" ON "lich_su_lop_hoc"("hoc_sinh_id", "nam_hoc", "lop_hoc_id");
CREATE INDEX IF NOT EXISTS "lich_su_lop_hoc_hoc_sinh_id_idx" ON "lich_su_lop_hoc"("hoc_sinh_id");
CREATE INDEX IF NOT EXISTS "lich_su_lop_hoc_lop_hoc_id_idx" ON "lich_su_lop_hoc"("lop_hoc_id");
CREATE INDEX IF NOT EXISTS "lich_su_lop_hoc_nam_hoc_idx" ON "lich_su_lop_hoc"("nam_hoc");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "hoc_sinh" ADD CONSTRAINT "hoc_sinh_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "lich_su_lop_hoc" ADD CONSTRAINT "lich_su_lop_hoc_hoc_sinh_id_fkey" FOREIGN KEY ("hoc_sinh_id") REFERENCES "hoc_sinh"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "lich_su_lop_hoc" ADD CONSTRAINT "lich_su_lop_hoc_lop_hoc_id_fkey" FOREIGN KEY ("lop_hoc_id") REFERENCES "lop_hoc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
