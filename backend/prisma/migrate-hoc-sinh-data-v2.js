const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function migrateHocSinhV2() {
  console.log('=== BẮT ĐẦU MIGRATION DỮ LIỆU MÃ HỌC SINH MỚI (HS2660001) + TÀI KHOẢN + LỊCH SỬ LỚP ===');

  const students = await prisma.hoc_sinh.findMany({
    include: { lop_hoc: true },
    orderBy: { ngay_tao: 'asc' },
  });

  console.log(`Tìm thấy ${students.length} học sinh trong hệ thống:`);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260821)`;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const namNhapHoc = student.nam_nhap_hoc || 2026;
      const khoiNhapHoc = student.lop_hoc?.khoi || 6;
      const yy = String(namNhapHoc).slice(-2);
      const seq = i + 1;
      const newCode = `HS${yy}${khoiNhapHoc}${String(seq).padStart(4, '0')}`;

      console.log(`[${i + 1}] Chuyển mã: "${student.ma_hoc_sinh}" -> "${newCode}" (Học sinh: ${student.ho_ten})`);

      // 1. Tạo hoặc Cập nhật tài khoản người dùng cho học sinh
      let nguoiDungId = student.nguoi_dung_id;
      const passwordHash = await bcrypt.hash(newCode, 10);
      const defaultEmail = `${newCode.toLowerCase()}@thcsdongquang.edu.vn`;

      if (!nguoiDungId) {
        // Kiểm tra xem đã có user với tên đăng nhập này chưa
        let user = await tx.nguoi_dung.findFirst({
          where: { OR: [{ ten_dang_nhap: newCode }, { email: defaultEmail }] },
        });

        if (!user) {
          user = await tx.nguoi_dung.create({
            data: {
              ho_ten: student.ho_ten,
              ten_dang_nhap: newCode,
              email: defaultEmail,
              mat_khau: passwordHash,
              mat_khau_mac_dinh: true,
              yeu_cau_doi_mat_khau: true,
              trang_thai: true,
            },
          });
        }
        nguoiDungId = user.id;
      } else {
        await tx.nguoi_dung.update({
          where: { id: nguoiDungId },
          data: {
            ten_dang_nhap: newCode,
            email: defaultEmail,
            mat_khau: passwordHash,
            mat_khau_mac_dinh: true,
            yeu_cau_doi_mat_khau: true,
          },
        });
      }

      // 2. Cập nhật hồ sơ học sinh
      await tx.hoc_sinh.update({
        where: { id: student.id },
        data: {
          ma_hoc_sinh: newCode,
          nam_nhap_hoc: namNhapHoc,
          khoi_nhap_hoc: khoiNhapHoc,
          nguoi_dung_id: nguoiDungId,
          so_thu_tu: student.so_thu_tu || seq,
        },
      });

      // 3. Tạo bản ghi lịch sử lớp đầu tiên nếu chưa có
      if (student.lop_hoc) {
        const existHistory = await tx.lich_su_lop_hoc.findFirst({
          where: {
            hoc_sinh_id: student.id,
            lop_hoc_id: student.lop_hoc_id,
            nam_hoc: student.lop_hoc.nam_hoc,
          },
        });

        if (!existHistory) {
          await tx.lich_su_lop_hoc.create({
            data: {
              hoc_sinh_id: student.id,
              lop_hoc_id: student.lop_hoc_id,
              nam_hoc: student.lop_hoc.nam_hoc,
              khoi: student.lop_hoc.khoi,
              so_thu_tu: student.so_thu_tu || seq,
              trang_thai_hoc_tap: 'DANG_HOC',
            },
          });
        }
      }
    }
  });

  console.log('=== MIGRATION V2 HOÀN TẤT THÀNH CÔNG ===');
}

migrateHocSinhV2()
  .catch((err) => {
    console.error('Lỗi khi migration:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
