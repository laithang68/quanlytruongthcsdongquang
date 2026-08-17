-- CreateTable
CREATE TABLE "video" (
    "id" TEXT NOT NULL,
    "tieu_de" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mo_ta" TEXT,
    "url_video" TEXT NOT NULL,
    "anh_thumbnail" TEXT,
    "luot_xem" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "nguoi_tao_id" TEXT NOT NULL,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_muc_tai_lieu" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "mo_ta" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "danh_muc_tai_lieu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tai_lieu" (
    "id" TEXT NOT NULL,
    "ten_tai_lieu" TEXT NOT NULL,
    "mo_ta" TEXT,
    "danh_muc_tai_lieu_id" TEXT NOT NULL,
    "tac_gia" TEXT,
    "doi_tuong" "DoiTuongThongBao" NOT NULL DEFAULT 'CONG_KHAI',
    "tep_tin_id" TEXT,
    "anh_thumb" TEXT,
    "luot_tai" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "nguoi_tao_id" TEXT NOT NULL,
    "da_xoa" BOOLEAN NOT NULL DEFAULT false,
    "ngay_xoa" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tai_lieu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_slug_key" ON "video"("slug");

-- CreateIndex
CREATE INDEX "video_slug_idx" ON "video"("slug");

-- CreateIndex
CREATE INDEX "video_trang_thai_idx" ON "video"("trang_thai");

-- CreateIndex
CREATE UNIQUE INDEX "danh_muc_tai_lieu_ma_key" ON "danh_muc_tai_lieu"("ma");

-- CreateIndex
CREATE INDEX "tai_lieu_danh_muc_tai_lieu_id_idx" ON "tai_lieu"("danh_muc_tai_lieu_id");

-- CreateIndex
CREATE INDEX "tai_lieu_trang_thai_idx" ON "tai_lieu"("trang_thai");

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tai_lieu" ADD CONSTRAINT "tai_lieu_danh_muc_tai_lieu_id_fkey" FOREIGN KEY ("danh_muc_tai_lieu_id") REFERENCES "danh_muc_tai_lieu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tai_lieu" ADD CONSTRAINT "tai_lieu_tep_tin_id_fkey" FOREIGN KEY ("tep_tin_id") REFERENCES "tep_tin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tai_lieu" ADD CONSTRAINT "tai_lieu_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
