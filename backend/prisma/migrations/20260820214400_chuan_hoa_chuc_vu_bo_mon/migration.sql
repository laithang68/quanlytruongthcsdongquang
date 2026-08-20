-- AlterTable
ALTER TABLE "giao_vien" ADD COLUMN     "bo_mon_id" TEXT,
ADD COLUMN     "chuc_vu_id" TEXT;

-- CreateTable
CREATE TABLE "danh_muc_chuc_vu" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "mo_ta" TEXT,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "danh_muc_chuc_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_muc_bo_mon" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "mo_ta" TEXT,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "danh_muc_bo_mon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "danh_muc_chuc_vu_ma_key" ON "danh_muc_chuc_vu"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "danh_muc_bo_mon_ma_key" ON "danh_muc_bo_mon"("ma");

-- CreateIndex
CREATE INDEX "giao_vien_chuc_vu_id_idx" ON "giao_vien"("chuc_vu_id");

-- CreateIndex
CREATE INDEX "giao_vien_bo_mon_id_idx" ON "giao_vien"("bo_mon_id");

-- AddForeignKey
ALTER TABLE "giao_vien" ADD CONSTRAINT "giao_vien_chuc_vu_id_fkey" FOREIGN KEY ("chuc_vu_id") REFERENCES "danh_muc_chuc_vu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_vien" ADD CONSTRAINT "giao_vien_bo_mon_id_fkey" FOREIGN KEY ("bo_mon_id") REFERENCES "danh_muc_bo_mon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
