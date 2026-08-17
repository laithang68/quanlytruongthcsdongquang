-- CreateTable
CREATE TABLE "lop_hoc" (
    "id" TEXT NOT NULL,
    "ten_lop" TEXT NOT NULL,
    "khoi" INTEGER NOT NULL,
    "nam_hoc" TEXT NOT NULL,
    "gvcn_id" TEXT,
    "mo_ta" TEXT,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lop_hoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hoc_sinh" (
    "id" TEXT NOT NULL,
    "ma_hoc_sinh" TEXT NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "ngay_sinh" TIMESTAMP(3),
    "gioi_tinh" TEXT,
    "dia_chi" TEXT,
    "lop_hoc_id" TEXT NOT NULL,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "da_xoa" BOOLEAN NOT NULL DEFAULT false,
    "ngay_xoa" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hoc_sinh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phu_huynh" (
    "id" TEXT NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "so_dien_thoai" TEXT,
    "email" TEXT,
    "dia_chi" TEXT,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "da_xoa" BOOLEAN NOT NULL DEFAULT false,
    "ngay_xoa" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phu_huynh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phu_huynh_hoc_sinh" (
    "phu_huynh_id" TEXT NOT NULL,
    "hoc_sinh_id" TEXT NOT NULL,
    "quan_he" TEXT NOT NULL DEFAULT 'Bố/Mẹ',
    "la_nguoi_giam_ho_chinh" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "phu_huynh_hoc_sinh_pkey" PRIMARY KEY ("phu_huynh_id","hoc_sinh_id")
);

-- CreateIndex
CREATE INDEX "lop_hoc_khoi_idx" ON "lop_hoc"("khoi");

-- CreateIndex
CREATE INDEX "lop_hoc_nam_hoc_idx" ON "lop_hoc"("nam_hoc");

-- CreateIndex
CREATE UNIQUE INDEX "hoc_sinh_ma_hoc_sinh_key" ON "hoc_sinh"("ma_hoc_sinh");

-- CreateIndex
CREATE INDEX "hoc_sinh_ma_hoc_sinh_idx" ON "hoc_sinh"("ma_hoc_sinh");

-- CreateIndex
CREATE INDEX "hoc_sinh_lop_hoc_id_idx" ON "hoc_sinh"("lop_hoc_id");

-- AddForeignKey
ALTER TABLE "lop_hoc" ADD CONSTRAINT "lop_hoc_gvcn_id_fkey" FOREIGN KEY ("gvcn_id") REFERENCES "giao_vien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoc_sinh" ADD CONSTRAINT "hoc_sinh_lop_hoc_id_fkey" FOREIGN KEY ("lop_hoc_id") REFERENCES "lop_hoc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phu_huynh_hoc_sinh" ADD CONSTRAINT "phu_huynh_hoc_sinh_phu_huynh_id_fkey" FOREIGN KEY ("phu_huynh_id") REFERENCES "phu_huynh"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phu_huynh_hoc_sinh" ADD CONSTRAINT "phu_huynh_hoc_sinh_hoc_sinh_id_fkey" FOREIGN KEY ("hoc_sinh_id") REFERENCES "hoc_sinh"("id") ON DELETE CASCADE ON UPDATE CASCADE;
