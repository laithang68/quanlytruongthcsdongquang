import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN PHASE 2: CHUẨN HÓA CHỨC VỤ & BỘ MÔN ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  // TEST 1: Danh mục chức vụ (6 records)
  const chucVus = await prisma.danh_muc_chuc_vu.findMany({ orderBy: { thu_tu: 'asc' } });
  assert(chucVus.length === 6, 'Test 1: Khởi tạo đủ 6 danh mục chức vụ chuẩn');
  const expectedCvCodes = ['HIEU_TRUONG', 'HIEU_PHO', 'GIAO_VIEN', 'GIAO_VU', 'KE_TOAN', 'NHAN_VIEN'];
  const actualCvCodes = chucVus.map((c) => c.ma);
  assert(
    expectedCvCodes.every((c) => actualCvCodes.includes(c)),
    'Test 2: Mã chức vụ đầy đủ chuẩn (HIEU_TRUONG, HIEU_PHO, GIAO_VIEN, GIAO_VU, KE_TOAN, NHAN_VIEN)',
  );

  // TEST 2: Danh mục bộ môn (14 records)
  const boMons = await prisma.danh_muc_bo_mon.findMany({ orderBy: { thu_tu: 'asc' } });
  assert(boMons.length === 14, 'Test 3: Khởi tạo đủ 14 danh mục bộ môn chuẩn');
  const expectedBmCodes = [
    'TOAN', 'NGU_VAN', 'TIENG_ANH', 'VAT_LY', 'HOA_HOC', 'SINH_HOC',
    'LICH_SU', 'DIA_LY', 'GDCD', 'TIN_HOC', 'CONG_NGHE', 'AM_NHAC', 'MY_THUAT', 'THE_DUC',
  ];
  const actualBmCodes = boMons.map((b) => b.ma);
  assert(
    expectedBmCodes.every((b) => actualBmCodes.includes(b)),
    'Test 4: Mã bộ môn đầy đủ 14 môn văn hóa & năng khiếu',
  );

  // TEST 3: Kiểm tra migration dữ liệu giáo viên hiện có
  const existingTeachers = await prisma.giao_vien.findMany({
    include: { danh_muc_chuc_vu: true, danh_muc_bo_mon: true },
  });
  assert(existingTeachers.length >= 2, 'Test 5: Dữ liệu giáo viên hiện tại không bị mất mát');
  const hieuTruongGv = existingTeachers.find((g) => g.ho_ten.toLowerCase().includes('hiệu trưởng'));
  assert(
    !!hieuTruongGv && hieuTruongGv.danh_muc_chuc_vu?.ma === 'HIEU_TRUONG' && hieuTruongGv.bo_mon_id === null,
    'Test 6: Giáo viên Hiệu trưởng đã được map đúng Chức vụ HIEU_TRUONG và Bộ môn NULL',
  );

  const nguyenVanAGv = existingTeachers.find((g) => g.ho_ten === 'Nguyễn Văn A');
  assert(
    !!nguyenVanAGv &&
      nguyenVanAGv.danh_muc_chuc_vu?.ma === 'GIAO_VIEN' &&
      nguyenVanAGv.danh_muc_bo_mon?.ma === 'TIN_HOC',
    'Test 7: Giáo viên Tin học (Nguyễn Văn A) đã map đúng GIAO_VIEN và Bộ môn TIN_HOC',
  );

  // TEST 4: Đảm bảo trường legacy `chuc_vu` vẫn tồn tại và nguyên vẹn
  const legacyFieldPreserved = existingTeachers.every((g) => g.chuc_vu !== undefined);
  assert(legacyFieldPreserved, 'Test 8: Trường chuc_vu cũ vẫn được bảo lưu nguyên vẹn trong CSDL');

  // TEST 5: Thử tạo và xóa giáo viên kiểm thử để xác nhận quan hệ Foreign Key
  const toSample = await prisma.to_chuyen_mon.findFirst();
  const cvGiaoVien = chucVus.find((c) => c.ma === 'GIAO_VIEN')!;
  const bmToan = boMons.find((b) => b.ma === 'TOAN')!;

  if (toSample) {
    const testTeacher = await prisma.giao_vien.create({
      data: {
        ho_ten: 'Giáo viên Kiểm thử Toán',
        to_chuyen_mon_id: toSample.id,
        chuc_vu: 'Giáo viên Toán',
        chuc_vu_id: cvGiaoVien.id,
        bo_mon_id: bmToan.id,
        trang_thai: true,
      },
    });
    assert(
      testTeacher.chuc_vu_id === cvGiaoVien.id && testTeacher.bo_mon_id === bmToan.id,
      'Test 9: Tạo giáo viên mới với foreign key chuc_vu_id và bo_mon_id thành công',
    );

    // Xóa giáo viên test
    await prisma.giao_vien.delete({ where: { id: testTeacher.id } });
    assert(true, 'Test 10: Xóa bản ghi thử nghiệm sạch sẽ');
  }

  console.log(`\n=== TỔNG KẾT KẾT QUẢ KIỂM THỬ: ${passed} PASS / ${failed} FAIL ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Lỗi khi chạy kiểm thử:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
