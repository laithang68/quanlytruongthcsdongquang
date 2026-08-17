-- CreateTable
CREATE TABLE "gioi_thieu" (
    "id" TEXT NOT NULL,
    "tieu_de_chinh" TEXT NOT NULL,
    "tieu_de_phu" TEXT,
    "anh_nen" TEXT,
    "noi_dung_chinh" TEXT NOT NULL,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "nguoi_tao_id" TEXT,
    "da_xoa" BOOLEAN NOT NULL DEFAULT false,
    "ngay_xoa" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gioi_thieu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gioi_thieu_trang_thai_idx" ON "gioi_thieu"("trang_thai");

-- AddForeignKey
ALTER TABLE "gioi_thieu" ADD CONSTRAINT "gioi_thieu_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
