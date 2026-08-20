import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateHocSinhData() {
  console.log('=== BẮT ĐẦU MIGRATION DỮ LIỆU MÃ HỌC SINH ===');

  const students = await prisma.hoc_sinh.findMany({
    orderBy: { ngay_tao: 'asc' },
  });

  console.log(`Tìm thấy ${students.length} học sinh trong hệ thống:`);
  students.forEach((s, idx) => {
    console.log(`  [${idx + 1}] ID: ${s.id} | Mã hiện tại: "${s.ma_hoc_sinh}" | Họ tên: ${s.ho_ten}`);
  });

  const year = 2026;
  const prefix = `HS${year}`;

  await prisma.$transaction(async (tx) => {
    // Acquire PostgreSQL advisory transaction lock to serialize migrations
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260821)`;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const seq = i + 1;
      const newCode = `${prefix}${String(seq).padStart(5, '0')}`;

      if (student.ma_hoc_sinh !== newCode) {
        console.log(`Cập nhật: "${student.ma_hoc_sinh}" -> "${newCode}" (Học sinh: ${student.ho_ten})`);
        await tx.hoc_sinh.update({
          where: { id: student.id },
          data: {
            ma_hoc_sinh: newCode,
            so_thu_tu: student.so_thu_tu || seq,
          },
        });
      } else {
        console.log(`Đã chuẩn: "${student.ma_hoc_sinh}" (Học sinh: ${student.ho_ten})`);
        if (!student.so_thu_tu) {
          await tx.hoc_sinh.update({
            where: { id: student.id },
            data: { so_thu_tu: seq },
          });
        }
      }
    }
  });

  console.log('=== HOÀN TẤT MIGRATION DỮ LIỆU HỌC SINH AN TOÀN ===');
}

migrateHocSinhData()
  .catch((err) => {
    console.error('Lỗi khi migration:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
