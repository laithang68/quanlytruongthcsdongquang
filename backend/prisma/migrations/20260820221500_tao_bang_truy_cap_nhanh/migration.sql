-- CreateTable
CREATE TABLE "truy_cap_nhanh" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "anh" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "truy_cap_nhanh_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "truy_cap_nhanh_trang_thai_idx" ON "truy_cap_nhanh"("trang_thai");

-- CreateIndex
CREATE INDEX "truy_cap_nhanh_thu_tu_idx" ON "truy_cap_nhanh"("thu_tu");
