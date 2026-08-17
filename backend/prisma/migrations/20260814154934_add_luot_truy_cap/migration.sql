-- CreateTable
CREATE TABLE "luot_truy_cap" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "lan_cuoi_hoat_dong" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "luot_truy_cap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "luot_truy_cap_session_id_idx" ON "luot_truy_cap"("session_id");

-- CreateIndex
CREATE INDEX "luot_truy_cap_ngay_tao_idx" ON "luot_truy_cap"("ngay_tao");

-- CreateIndex
CREATE INDEX "luot_truy_cap_lan_cuoi_hoat_dong_idx" ON "luot_truy_cap"("lan_cuoi_hoat_dong");
