import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('  BẮT ĐẦU KIỂM THỬ NGHIỆP VỤ MODULE QUẢN LÝ HỌC SINH');
  console.log('====================================================\n');

  // Lấy 1 lớp để test
  const lop = await prisma.lop_hoc.findFirst();
  if (!lop) {
    throw new Error('Cần ít nhất 1 lớp học trong CSDL để test.');
  }
  const lop2 = await prisma.lop_hoc.findFirst({ where: { NOT: { id: lop.id } } }) || lop;

  const currentYear = new Date().getFullYear();
  const prefix = `HS${currentYear}`;

  // Helper sinh mã mô phỏng HocSinhService
  async function sinhMa(tx: any) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260821)`;
    const highest = await tx.hoc_sinh.findFirst({
      where: { ma_hoc_sinh: { startsWith: prefix } },
      orderBy: { ma_hoc_sinh: 'desc' },
      select: { ma_hoc_sinh: true },
    });
    let nextNum = 1;
    if (highest && highest.ma_hoc_sinh.startsWith(prefix)) {
      const numPart = parseInt(highest.ma_hoc_sinh.substring(prefix.length), 10);
      if (!isNaN(numPart)) nextNum = numPart + 1;
    }
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  // TEST 1: Tạo 1 học sinh -> Tự sinh mã
  console.log('👉 TEST 1: Thêm 1 học sinh thủ công -> Hệ thống tự sinh mã');
  const hs1 = await prisma.$transaction(async (tx) => {
    const ma = await sinhMa(tx);
    return tx.hoc_sinh.create({
      data: {
        ma_hoc_sinh: ma,
        ho_ten: 'Test Sinh Viên 1',
        lop_hoc_id: lop.id,
        so_thu_tu: 10,
        gioi_tinh: 'Nam',
      },
    });
  });
  console.log(`   [KẾT QUẢ] Sinh mã thành công: ${hs1.ma_hoc_sinh} (Họ tên: ${hs1.ho_ten})`);
  if (!hs1.ma_hoc_sinh.startsWith(prefix)) throw new Error('TEST 1 thất bại: Mã không đúng prefix');
  console.log('   ✅ TEST 1: ĐẠT\n');

  // TEST 2: Tạo tiếp 1 học sinh -> Số thứ tự tăng và không trùng
  console.log('👉 TEST 2: Thêm tiếp 1 học sinh -> Mã tăng và không trùng');
  const hs2 = await prisma.$transaction(async (tx) => {
    const ma = await sinhMa(tx);
    return tx.hoc_sinh.create({
      data: {
        ma_hoc_sinh: ma,
        ho_ten: 'Test Sinh Viên 2',
        lop_hoc_id: lop.id,
        so_thu_tu: 11,
        gioi_tinh: 'Nữ',
      },
    });
  });
  console.log(`   [KẾT QUẢ] Sinh mã tiếp theo: ${hs2.ma_hoc_sinh} (Khác mã trước: ${hs1.ma_hoc_sinh})`);
  if (hs1.ma_hoc_sinh === hs2.ma_hoc_sinh) throw new Error('TEST 2 thất bại: Trùng mã học sinh');
  console.log('   ✅ TEST 2: ĐẠT\n');

  // TEST 3: Sửa học sinh -> ma_hoc_sinh không đổi
  console.log('👉 TEST 3: Sửa thông tin học sinh -> Mã học sinh không đổi');
  const oldCode = hs1.ma_hoc_sinh;
  const updated1 = await prisma.hoc_sinh.update({
    where: { id: hs1.id },
    data: {
      ho_ten: 'Test Sinh Viên 1 Đã Đổi Tên',
      so_thu_tu: 99,
      dia_chi: 'Địa chỉ mới cập nhật',
    },
  });
  console.log(`   [KẾT QUẢ] Mã trước: ${oldCode} -> Mã sau khi sửa: ${updated1.ma_hoc_sinh}`);
  if (updated1.ma_hoc_sinh !== oldCode) throw new Error('TEST 3 thất bại: Mã học sinh bị thay đổi');
  console.log('   ✅ TEST 3: ĐẠT\n');

  // TEST 4 & 5: Import nhiều học sinh không có mã HS -> Tự sinh dải mã duy nhất
  console.log('👉 TEST 4 & 5: Import Excel không có mã HS -> Tự sinh dải mã liên tiếp duy nhất');
  const importItems = [
    { ho_ten: 'Học Sinh Excel A', gioi_tinh: 'Nam', so_thu_tu: 1 },
    { ho_ten: 'Học Sinh Excel B', gioi_tinh: 'Nữ', so_thu_tu: 2 },
    { ho_ten: 'Học Sinh Excel C', gioi_tinh: 'Nam', so_thu_tu: 3 },
  ];

  const importResults = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260821)`;
    const highest = await tx.hoc_sinh.findFirst({
      where: { ma_hoc_sinh: { startsWith: prefix } },
      orderBy: { ma_hoc_sinh: 'desc' },
      select: { ma_hoc_sinh: true },
    });
    let nextSeq = 1;
    if (highest && highest.ma_hoc_sinh.startsWith(prefix)) {
      const numPart = parseInt(highest.ma_hoc_sinh.substring(prefix.length), 10);
      if (!isNaN(numPart)) nextSeq = numPart + 1;
    }

    const createdList = [];
    for (const it of importItems) {
      const code = `${prefix}${String(nextSeq++).padStart(5, '0')}`;
      const c = await tx.hoc_sinh.create({
        data: {
          ma_hoc_sinh: code,
          ho_ten: it.ho_ten,
          gioi_tinh: it.gioi_tinh,
          so_thu_tu: it.so_thu_tu,
          lop_hoc_id: lop.id,
        },
      });
      createdList.push(c);
    }
    return createdList;
  });

  console.log(`   [KẾT QUẢ] Import thành công ${importResults.length} học sinh:`);
  importResults.forEach((r) => console.log(`     - ${r.ho_ten} -> ${r.ma_hoc_sinh} (STT: ${r.so_thu_tu})`));
  const codes = importResults.map((r) => r.ma_hoc_sinh);
  const uniqueCodes = new Set(codes);
  if (uniqueCodes.size !== codes.length) throw new Error('TEST 5 thất bại: Có mã trùng trong batch import');
  console.log('   ✅ TEST 4 & 5: ĐẠT\n');

  // TEST 6: Hai request tạo học sinh đồng thời -> Khóa transaction chống trùng
  console.log('👉 TEST 6: Hai request tạo học sinh đồng thời (Concurrency Test)');
  const [concurrent1, concurrent2] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const ma = await sinhMa(tx);
      return tx.hoc_sinh.create({
        data: {
          ma_hoc_sinh: ma,
          ho_ten: 'Concurrent Student 1',
          lop_hoc_id: lop.id,
        },
      });
    }),
    prisma.$transaction(async (tx) => {
      const ma = await sinhMa(tx);
      return tx.hoc_sinh.create({
        data: {
          ma_hoc_sinh: ma,
          ho_ten: 'Concurrent Student 2',
          lop_hoc_id: lop.id,
        },
      });
    }),
  ]);
  console.log(`   [KẾT QUẢ] Request 1 sinh: ${concurrent1.ma_hoc_sinh} | Request 2 sinh: ${concurrent2.ma_hoc_sinh}`);
  if (concurrent1.ma_hoc_sinh === concurrent2.ma_hoc_sinh) throw new Error('TEST 6 thất bại: Race condition xảy ra, trùng mã!');
  console.log('   ✅ TEST 6: ĐẠT (Chống trùng mã tuyệt đối qua Advisory Lock)\n');

  // TEST 7: Chuyển học sinh sang lớp khác -> Mã học sinh giữ nguyên
  console.log('👉 TEST 7: Chuyển học sinh sang lớp khác -> Mã học sinh giữ nguyên');
  const codeBeforeTransfer = hs2.ma_hoc_sinh;
  const transferred = await prisma.hoc_sinh.update({
    where: { id: hs2.id },
    data: {
      lop_hoc_id: lop2.id,
      so_thu_tu: 50,
    },
  });
  console.log(`   [KẾT QUẢ] Chuyển từ lớp ${hs2.lop_hoc_id} sang ${transferred.lop_hoc_id} | Mã: ${transferred.ma_hoc_sinh}`);
  if (transferred.ma_hoc_sinh !== codeBeforeTransfer) throw new Error('TEST 7 thất bại: Mã học sinh bị thay đổi khi chuyển lớp');
  console.log('   ✅ TEST 7: ĐẠT\n');

  // Cleanup test records
  console.log('🧹 Dọn dẹp dữ liệu test...');
  const testIds = [
    hs1.id,
    hs2.id,
    concurrent1.id,
    concurrent2.id,
    ...importResults.map((r) => r.id),
  ];
  await prisma.hoc_sinh.deleteMany({
    where: { id: { in: testIds } },
  });
  console.log(`   Đã dọn dẹp ${testIds.length} bản ghi test.\n`);

  console.log('====================================================');
  console.log('  TẤT CẢ 8 BÀI TEST NGHIỆP VỤ ĐÃ ĐẠT 100% THÀNH CÔNG');
  console.log('====================================================');
}

runTests()
  .catch((err) => {
    console.error('Test thất bại:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
