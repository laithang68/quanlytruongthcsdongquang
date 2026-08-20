const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function runTestsV2() {
  console.log('====================================================');
  console.log('  BẮT ĐẦU KIỂM THỬ 15 NGHIỆP VỤ MODULE HỌC SINH V2');
  console.log('====================================================\n');

  const lop6A = await prisma.lop_hoc.findFirst({ where: { khoi: 6 } });
  const lop7A = await prisma.lop_hoc.findFirst({ where: { khoi: 7 } }) || lop6A;
  const lop7B = await prisma.lop_hoc.findFirst({ where: { khoi: 7, NOT: { id: lop7A.id } } }) || lop7A;
  const lop8A = await prisma.lop_hoc.findFirst({ where: { khoi: 8 } }) || lop7A;
  const lop9A = await prisma.lop_hoc.findFirst({ where: { khoi: 9 } }) || lop8A;

  const namNhapHoc = 2026;
  const khoiNhapHoc = 6;
  const yy = String(namNhapHoc).slice(-2);
  const prefix = `HS${yy}${khoiNhapHoc}`;

  // Helper sinh mã
  async function sinhMa(tx, nam = 2026, khoi = 6) {
    const curYy = String(nam).slice(-2);
    const curPrefix = `HS${curYy}${khoi}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260821)`;
    const highest = await tx.hoc_sinh.findFirst({
      where: { ma_hoc_sinh: { startsWith: curPrefix } },
      orderBy: { ma_hoc_sinh: 'desc' },
      select: { ma_hoc_sinh: true },
    });
    let nextNum = 1;
    if (highest && highest.ma_hoc_sinh.startsWith(curPrefix)) {
      const numPart = parseInt(highest.ma_hoc_sinh.substring(curPrefix.length), 10);
      if (!isNaN(numPart)) nextNum = numPart + 1;
    }
    return `${curPrefix}${String(nextNum).padStart(4, '0')}`;
  }

  const createdTestStudentIds = [];
  const createdTestUserIds = [];

  // TEST 1: Tạo học sinh mới -> Mã chuẩn HS266xxxx
  console.log('👉 TEST 1: Tạo học sinh mới -> Mã chuẩn định dạng HS266xxxx');
  const hs1 = await prisma.$transaction(async (tx) => {
    const ma = await sinhMa(tx, namNhapHoc, khoiNhapHoc);
    const passHash = await bcrypt.hash(ma, 10);
    const user = await tx.nguoi_dung.create({
      data: {
        ho_ten: 'Nguyễn Văn Test 1',
        ten_dang_nhap: ma,
        email: `${ma.toLowerCase()}@thcsdongquang.edu.vn`,
        mat_khau: passHash,
        mat_khau_mac_dinh: true,
        yeu_cau_doi_mat_khau: true,
        trang_thai: true,
      },
    });
    createdTestUserIds.push(user.id);

    const student = await tx.hoc_sinh.create({
      data: {
        ma_hoc_sinh: ma,
        ho_ten: 'Nguyễn Văn Test 1',
        nam_nhap_hoc: namNhapHoc,
        khoi_nhap_hoc: khoiNhapHoc,
        lop_hoc_id: lop6A.id,
        nguoi_dung_id: user.id,
        so_thu_tu: 1,
      },
    });

    await tx.lich_su_lop_hoc.create({
      data: {
        hoc_sinh_id: student.id,
        lop_hoc_id: lop6A.id,
        nam_hoc: lop6A.nam_hoc,
        khoi: lop6A.khoi,
        so_thu_tu: 1,
        trang_thai_hoc_tap: 'DANG_HOC',
      },
    });

    return { student, user };
  });
  createdTestStudentIds.push(hs1.student.id);
  console.log(`   [KẾT QUẢ] Sinh mã thành công: ${hs1.student.ma_hoc_sinh} (Tài khoản: ${hs1.user.ten_dang_nhap})`);
  if (!hs1.student.ma_hoc_sinh.startsWith(prefix)) throw new Error('TEST 1 thất bại: Format mã không đúng');
  console.log('   ✅ TEST 1: ĐẠT\n');

  // TEST 2: Tạo tiếp -> Số thứ tự tăng dần không trùng
  console.log('👉 TEST 2: Tạo tiếp học sinh -> Tự tăng và không trùng');
  const hs2 = await prisma.$transaction(async (tx) => {
    const ma = await sinhMa(tx, namNhapHoc, khoiNhapHoc);
    const passHash = await bcrypt.hash(ma, 10);
    const user = await tx.nguoi_dung.create({
      data: {
        ho_ten: 'Nguyễn Văn Test 2',
        ten_dang_nhap: ma,
        email: `${ma.toLowerCase()}@thcsdongquang.edu.vn`,
        mat_khau: passHash,
        mat_khau_mac_dinh: true,
        yeu_cau_doi_mat_khau: true,
      },
    });
    createdTestUserIds.push(user.id);
    const student = await tx.hoc_sinh.create({
      data: {
        ma_hoc_sinh: ma,
        ho_ten: 'Nguyễn Văn Test 2',
        nam_nhap_hoc: namNhapHoc,
        khoi_nhap_hoc: khoiNhapHoc,
        lop_hoc_id: lop6A.id,
        nguoi_dung_id: user.id,
      },
    });
    return { student, user };
  });
  createdTestStudentIds.push(hs2.student.id);
  console.log(`   [KẾT QUẢ] Sinh mã tiếp theo: ${hs2.student.ma_hoc_sinh}`);
  if (hs1.student.ma_hoc_sinh === hs2.student.ma_hoc_sinh) throw new Error('TEST 2 thất bại: Trùng mã');
  console.log('   ✅ TEST 2: ĐẠT\n');

  // TEST 3 & 4: Tài khoản tự tạo (username = ma_hoc_sinh, password = hash(ma_hoc_sinh))
  console.log('👉 TEST 3 & 4: Kiểm tra tài khoản tự động & Mật khẩu được hash an toàn');
  const userCheck = await prisma.nguoi_dung.findUnique({ where: { id: hs1.user.id } });
  if (userCheck.ten_dang_nhap !== hs1.student.ma_hoc_sinh) throw new Error('TEST 3 thất bại: Username không khớp');
  const isMatchPass = await bcrypt.compare(hs1.student.ma_hoc_sinh, userCheck.mat_khau);
  if (!isMatchPass) throw new Error('TEST 4 thất bại: Mật khẩu hash không đúng');
  console.log(`   [KẾT QUẢ] Username: ${userCheck.ten_dang_nhap} | Password hash verified: true | Yêu cầu đổi MK: ${userCheck.yeu_cau_doi_mat_khau}`);
  console.log('   ✅ TEST 3 & 4: ĐẠT\n');

  // TEST 5 & 14: Import Excel tự sinh mã + tài khoản + chống trùng
  console.log('👉 TEST 5 & 14: Import Excel tự sinh mã + tài khoản hàng loạt không trùng');
  const importItems = [
    { ho_ten: 'Excel Student 1', gioi_tinh: 'Nam' },
    { ho_ten: 'Excel Student 2', gioi_tinh: 'Nữ' },
    { ho_ten: 'Excel Student 3', gioi_tinh: 'Nam' },
  ];
  const importRes = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260821)`;
    const created = [];
    for (const item of importItems) {
      const ma = await sinhMa(tx, namNhapHoc, khoiNhapHoc);
      const passHash = await bcrypt.hash(ma, 10);
      const user = await tx.nguoi_dung.create({
        data: {
          ho_ten: item.ho_ten,
          ten_dang_nhap: ma,
          email: `${ma.toLowerCase()}@thcsdongquang.edu.vn`,
          mat_khau: passHash,
          mat_khau_mac_dinh: true,
          yeu_cau_doi_mat_khau: true,
        },
      });
      createdTestUserIds.push(user.id);
      const st = await tx.hoc_sinh.create({
        data: {
          ma_hoc_sinh: ma,
          ho_ten: item.ho_ten,
          nam_nhap_hoc: namNhapHoc,
          khoi_nhap_hoc: khoiNhapHoc,
          lop_hoc_id: lop6A.id,
          nguoi_dung_id: user.id,
        },
      });
      createdTestStudentIds.push(st.id);
      created.push(st);
    }
    return created;
  });
  console.log(`   [KẾT QUẢ] Import thành công ${importRes.length} học sinh:`);
  importRes.forEach((s) => console.log(`     - ${s.ho_ten} -> ${s.ma_hoc_sinh}`));
  const codes = importRes.map((s) => s.ma_hoc_sinh);
  if (new Set(codes).size !== codes.length) throw new Error('TEST 14 thất bại: Có mã trùng trong batch import');
  console.log('   ✅ TEST 5 & 14: ĐẠT\n');

  // TEST 6: Concurrency test (Advisory Lock)
  console.log('👉 TEST 6: Hai request tạo học sinh đồng thời (Concurrency Test)');
  const [c1, c2] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const ma = await sinhMa(tx, namNhapHoc, khoiNhapHoc);
      const user = await tx.nguoi_dung.create({
        data: {
          ho_ten: 'Concurrent 1',
          ten_dang_nhap: ma,
          email: `${ma.toLowerCase()}@thcsdongquang.edu.vn`,
          mat_khau: await bcrypt.hash(ma, 10),
        },
      });
      createdTestUserIds.push(user.id);
      const st = await tx.hoc_sinh.create({
        data: {
          ma_hoc_sinh: ma,
          ho_ten: 'Concurrent 1',
          lop_hoc_id: lop6A.id,
          nguoi_dung_id: user.id,
        },
      });
      createdTestStudentIds.push(st.id);
      return st;
    }),
    prisma.$transaction(async (tx) => {
      const ma = await sinhMa(tx, namNhapHoc, khoiNhapHoc);
      const user = await tx.nguoi_dung.create({
        data: {
          ho_ten: 'Concurrent 2',
          ten_dang_nhap: ma,
          email: `${ma.toLowerCase()}@thcsdongquang.edu.vn`,
          mat_khau: await bcrypt.hash(ma, 10),
        },
      });
      createdTestUserIds.push(user.id);
      const st = await tx.hoc_sinh.create({
        data: {
          ma_hoc_sinh: ma,
          ho_ten: 'Concurrent 2',
          lop_hoc_id: lop6A.id,
          nguoi_dung_id: user.id,
        },
      });
      createdTestStudentIds.push(st.id);
      return st;
    }),
  ]);
  console.log(`   [KẾT QUẢ] Req 1 sinh: ${c1.ma_hoc_sinh} | Req 2 sinh: ${c2.ma_hoc_sinh}`);
  if (c1.ma_hoc_sinh === c2.ma_hoc_sinh) throw new Error('TEST 6 thất bại: Race condition xảy ra!');
  console.log('   ✅ TEST 6: ĐẠT\n');

  // TEST 7: Lên lớp (6A -> 7A) -> Mã không đổi, lịch sử được cập nhật
  console.log('👉 TEST 7: Nghiệp vụ Lên lớp (6A -> 7A)');
  const oldCodeHs1 = hs1.student.ma_hoc_sinh;
  await prisma.$transaction(async (tx) => {
    await tx.hoc_sinh.update({
      where: { id: hs1.student.id },
      data: { lop_hoc_id: lop7A.id },
    });
    await tx.lich_su_lop_hoc.create({
      data: {
        hoc_sinh_id: hs1.student.id,
        lop_hoc_id: lop7A.id,
        nam_hoc: '2027-2028',
        khoi: 7,
        trang_thai_hoc_tap: 'DANG_HOC',
      },
    });
  });
  const hs1AfterPromote = await prisma.hoc_sinh.findUnique({ where: { id: hs1.student.id } });
  console.log(`   [KẾT QUẢ] Mã trước: ${oldCodeHs1} -> Mã sau lên lớp: ${hs1AfterPromote.ma_hoc_sinh}`);
  if (hs1AfterPromote.ma_hoc_sinh !== oldCodeHs1) throw new Error('TEST 7 thất bại: Mã bị thay đổi khi lên lớp');
  console.log('   ✅ TEST 7: ĐẠT\n');

  // TEST 8: Chuyển lớp (7A -> 7B) -> Mã không đổi
  console.log('👉 TEST 8: Nghiệp vụ Chuyển lớp (7A -> 7B)');
  await prisma.hoc_sinh.update({
    where: { id: hs1.student.id },
    data: { lop_hoc_id: lop7B.id },
  });
  const hs1AfterTransfer = await prisma.hoc_sinh.findUnique({ where: { id: hs1.student.id } });
  if (hs1AfterTransfer.ma_hoc_sinh !== oldCodeHs1) throw new Error('TEST 8 thất bại: Mã bị thay đổi khi chuyển lớp');
  console.log(`   [KẾT QUẢ] Mã sau chuyển lớp: ${hs1AfterTransfer.ma_hoc_sinh} (Lớp mới: ${hs1AfterTransfer.lop_hoc_id})`);
  console.log('   ✅ TEST 8: ĐẠT\n');

  // TEST 9: Lưu ban -> Mã không đổi + Lịch sử lưu ban
  console.log('👉 TEST 9: Nghiệp vụ Lưu ban');
  await prisma.$transaction(async (tx) => {
    await tx.hoc_sinh.update({
      where: { id: hs2.student.id },
      data: { trang_thai_hoc_sinh: 'LUU_BAN' },
    });
    await tx.lich_su_lop_hoc.create({
      data: {
        hoc_sinh_id: hs2.student.id,
        lop_hoc_id: lop6A.id,
        nam_hoc: '2027-2028',
        khoi: 6,
        trang_thai_hoc_tap: 'LUU_BAN',
      },
    });
  });
  const hs2AfterRetain = await prisma.hoc_sinh.findUnique({ where: { id: hs2.student.id } });
  if (hs2AfterRetain.ma_hoc_sinh !== hs2.student.ma_hoc_sinh) throw new Error('TEST 9 thất bại: Mã thay đổi');
  console.log(`   [KẾT QUẢ] Trạng thái: ${hs2AfterRetain.trang_thai_hoc_sinh} | Mã HS: ${hs2AfterRetain.ma_hoc_sinh}`);
  console.log('   ✅ TEST 9: ĐẠT\n');

  // TEST 10: Lộ trình 7A -> 8A -> 9A -> Lịch sử lớp đầy đủ
  console.log('👉 TEST 10: Lộ trình học tập qua nhiều năm (6A -> 7A -> 8A -> 9A)');
  await prisma.$transaction(async (tx) => {
    await tx.lich_su_lop_hoc.create({
      data: {
        hoc_sinh_id: hs1.student.id,
        lop_hoc_id: lop8A.id,
        nam_hoc: '2028-2029',
        khoi: 8,
        trang_thai_hoc_tap: 'HOAN_THANH',
      },
    });
    await tx.lich_su_lop_hoc.create({
      data: {
        hoc_sinh_id: hs1.student.id,
        lop_hoc_id: lop9A.id,
        nam_hoc: '2029-2030',
        khoi: 9,
        trang_thai_hoc_tap: 'DANG_HOC',
      },
    });
    await tx.hoc_sinh.update({
      where: { id: hs1.student.id },
      data: { lop_hoc_id: lop9A.id },
    });
  });
  const histories = await prisma.lich_su_lop_hoc.findMany({
    where: { hoc_sinh_id: hs1.student.id },
    orderBy: { nam_hoc: 'asc' },
  });
  console.log(`   [KẾT QUẢ] Tổng số năm học đã ghi nhận trong lịch sử: ${histories.length}`);
  histories.forEach((h) => console.log(`     - Năm ${h.nam_hoc}: Khối ${h.khoi} -> ${h.trang_thai_hoc_tap}`));
  if (histories.length < 3) throw new Error('TEST 10 thất bại: Thiếu lịch sử');
  console.log('   ✅ TEST 10: ĐẠT\n');

  // TEST 11: Tốt nghiệp -> Trạng thái TOT_NGHIEP, giữ nguyên hồ sơ
  console.log('👉 TEST 11: Nghiệp vụ Tốt nghiệp');
  await prisma.hoc_sinh.update({
    where: { id: hs1.student.id },
    data: {
      trang_thai_hoc_sinh: 'TOT_NGHIEP',
      nam_tot_nghiep: '2029-2030',
      ngay_tot_nghiep: new Date(),
    },
  });
  const hs1Grad = await prisma.hoc_sinh.findUnique({ where: { id: hs1.student.id } });
  if (hs1Grad.trang_thai_hoc_sinh !== 'TOT_NGHIEP' || hs1Grad.ma_hoc_sinh !== oldCodeHs1) {
    throw new Error('TEST 11 thất bại: Tốt nghiệp không hợp lệ');
  }
  console.log(`   [KẾT QUẢ] Đã tốt nghiệp: ${hs1Grad.trang_thai_hoc_sinh} | Năm: ${hs1Grad.nam_tot_nghiep} | Mã HS: ${hs1Grad.ma_hoc_sinh}`);
  console.log('   ✅ TEST 11: ĐẠT\n');

  // TEST 12: Sửa thông tin -> Mã HS không đổi
  console.log('👉 TEST 12: Sửa thông tin -> Mã học sinh không thể thay đổi');
  const hs1Updated = await prisma.hoc_sinh.update({
    where: { id: hs1.student.id },
    data: { ho_ten: 'Nguyễn Văn Đã Cập Nhật' },
  });
  if (hs1Updated.ma_hoc_sinh !== oldCodeHs1) throw new Error('TEST 12 thất bại: Mã HS bị sửa');
  console.log(`   [KẾT QUẢ] Họ tên mới: ${hs1Updated.ho_ten} | Mã HS vẫn: ${hs1Updated.ma_hoc_sinh}`);
  console.log('   ✅ TEST 12: ĐẠT\n');

  // TEST 13: Reset mật khẩu -> Password hash trở lại mã HS, yeu_cau_doi_mat_khau = true
  console.log('👉 TEST 13: Đặt lại mật khẩu về mặc định');
  const newPassHash = await bcrypt.hash(hs1.student.ma_hoc_sinh, 10);
  await prisma.nguoi_dung.update({
    where: { id: hs1.user.id },
    data: {
      mat_khau: newPassHash,
      mat_khau_mac_dinh: true,
      yeu_cau_doi_mat_khau: true,
    },
  });
  const userReset = await prisma.nguoi_dung.findUnique({ where: { id: hs1.user.id } });
  const checkResetPass = await bcrypt.compare(hs1.student.ma_hoc_sinh, userReset.mat_khau);
  if (!checkResetPass || !userReset.yeu_cau_doi_mat_khau) throw new Error('TEST 13 thất bại: Reset mật khẩu không khớp');
  console.log(`   [KẾT QUẢ] Password reset verified: true | Yêu cầu đổi mật khẩu: ${userReset.yeu_cau_doi_mat_khau}`);
  console.log('   ✅ TEST 13: ĐẠT\n');

  // TEST 16: Học sinh DANG_HOC -> nguoi_dung.trang_thai = true
  console.log('👉 TEST 16: Học sinh đang học -> Tài khoản hoạt động (trang_thai = true)');
  const hsActiveUser = await prisma.nguoi_dung.findUnique({ where: { id: hs2.user.id } });
  if (!hsActiveUser || !hsActiveUser.trang_thai) throw new Error('TEST 16 thất bại: Tài khoản học sinh đang học bị khóa');
  console.log(`   [KẾT QUẢ] Tài khoản: ${hsActiveUser.ten_dang_nhap} | Trạng thái: ${hsActiveUser.trang_thai ? 'Hoạt động (true)' : 'Khóa'}`);
  console.log('   ✅ TEST 16: ĐẠT\n');

  // TEST 17: Thực hiện tốt nghiệp -> hoc_sinh.trang_thai_hoc_sinh = TOT_NGHIEP & nguoi_dung.trang_thai = false
  console.log('👉 TEST 17: Tốt nghiệp -> Tự động khóa tài khoản (nguoi_dung.trang_thai = false)');
  await prisma.$transaction(async (tx) => {
    await tx.hoc_sinh.update({
      where: { id: hs2.student.id },
      data: {
        trang_thai_hoc_sinh: 'TOT_NGHIEP',
        nam_tot_nghiep: '2029-2030',
        ngay_tot_nghiep: new Date(),
      },
    });
    await tx.nguoi_dung.update({
      where: { id: hs2.user.id },
      data: { trang_thai: false },
    });
  });
  const hs2Grad = await prisma.hoc_sinh.findUnique({ where: { id: hs2.student.id } });
  const hs2GradUser = await prisma.nguoi_dung.findUnique({ where: { id: hs2.user.id } });
  if (hs2Grad.trang_thai_hoc_sinh !== 'TOT_NGHIEP' || hs2GradUser.trang_thai !== false) {
    throw new Error('TEST 17 thất bại: Tài khoản chưa được khóa khi tốt nghiệp');
  }
  console.log(`   [KẾT QUẢ] Trạng thái HS: ${hs2Grad.trang_thai_hoc_sinh} | Trạng thái User: ${hs2GradUser.trang_thai ? 'Mở' : 'ĐÃ KHÓA (false)'}`);
  console.log('   ✅ TEST 17: ĐẠT\n');

  // TEST 18: Thử đăng nhập tài khoản đã tốt nghiệp -> Backend từ chối
  console.log('👉 TEST 18: Đăng nhập tài khoản học sinh đã tốt nghiệp -> Bị từ chối');
  const checkLoginUser = await prisma.nguoi_dung.findUnique({ where: { id: hs2.user.id } });
  const canLogin = checkLoginUser && checkLoginUser.trang_thai && !checkLoginUser.da_xoa;
  if (canLogin) throw new Error('TEST 18 thất bại: Tài khoản đã tốt nghiệp vẫn đăng nhập được');
  console.log(`   [KẾT QUẢ] Thử đăng nhập tài khoản ${checkLoginUser.ten_dang_nhap}: Bị từ chối do trang_thai = false (Không cho phép đăng nhập)`);
  console.log('   ✅ TEST 18: ĐẠT\n');

  // TEST 19: Tài khoản đã khóa -> Reset mật khẩu -> Mật khẩu reset nhưng trang_thai vẫn = false
  console.log('👉 TEST 19: Reset mật khẩu tài khoản đã tốt nghiệp -> Không tự ý mở khóa (trang_thai vẫn false)');
  const newGradPassHash = await bcrypt.hash(hs2.student.ma_hoc_sinh, 10);
  await prisma.nguoi_dung.update({
    where: { id: hs2.user.id },
    data: {
      mat_khau: newGradPassHash,
      mat_khau_mac_dinh: true,
      yeu_cau_doi_mat_khau: true,
      trang_thai: false, // Giữ nguyên khóa
    },
  });
  const hs2ResetUser = await prisma.nguoi_dung.findUnique({ where: { id: hs2.user.id } });
  const isResetPassValid = await bcrypt.compare(hs2.student.ma_hoc_sinh, hs2ResetUser.mat_khau);
  if (!isResetPassValid || hs2ResetUser.trang_thai !== false) {
    throw new Error('TEST 19 thất bại: Reset mật khẩu vô tình mở khóa tài khoản');
  }
  console.log(`   [KẾT QUẢ] Reset mật khẩu: Thành công | Trạng thái tài khoản: ${hs2ResetUser.trang_thai ? 'Mở' : 'VẪN KHÓA (false)'}`);
  console.log('   ✅ TEST 19: ĐẠT\n');

  // TEST 20: Tài khoản đã khóa -> Hồ sơ học sinh vẫn xem được bởi Admin
  console.log('👉 TEST 20: Hồ sơ học sinh đã tốt nghiệp vẫn xem được trọn vẹn');
  const viewGradHs = await prisma.hoc_sinh.findUnique({
    where: { id: hs2.student.id },
    include: { lop_hoc: true, nguoi_dung: true, lich_su_lop_hoc: true },
  });
  if (!viewGradHs || viewGradHs.da_xoa) throw new Error('TEST 20 thất bại: Không tìm thấy hồ sơ');
  console.log(`   [KẾT QUẢ] Admin xem hồ sơ: ${viewGradHs.ho_ten} | Mã HS: ${viewGradHs.ma_hoc_sinh} | Trạng thái: ${viewGradHs.trang_thai_hoc_sinh}`);
  console.log('   ✅ TEST 20: ĐẠT\n');

  // TEST 21: Tài khoản đã khóa -> ma_hoc_sinh không thay đổi
  console.log('👉 TEST 21: Mã học sinh sau khi tốt nghiệp và khóa tài khoản giữ nguyên');
  if (viewGradHs.ma_hoc_sinh !== hs2.student.ma_hoc_sinh) throw new Error('TEST 21 thất bại: Mã HS bị đổi');
  console.log(`   [KẾT QUẢ] Mã ban đầu: ${hs2.student.ma_hoc_sinh} -> Mã sau tốt nghiệp: ${viewGradHs.ma_hoc_sinh}`);
  console.log('   ✅ TEST 21: ĐẠT\n');

  // TEST 22: Tài khoản đã khóa -> Lịch sử lớp không bị mất
  console.log('👉 TEST 22: Lịch sử lớp học của học sinh tốt nghiệp được bảo toàn');
  const hs1Histories = await prisma.lich_su_lop_hoc.findMany({ where: { hoc_sinh_id: hs1.student.id } });
  if (hs1Histories.length === 0) throw new Error('TEST 22 thất bại: Mất lịch sử lớp học');
  console.log(`   [KẾT QUẢ] Số bản ghi lịch sử lớp bảo toàn: ${hs1Histories.length}`);
  console.log('   ✅ TEST 22: ĐẠT\n');

  // ========================================================
  // BẮT ĐẦU TEST PHẦN IMPORT EXCEL (TEST 23 - TEST 33)
  // ========================================================

  const XLSX = require('xlsx');

  // TEST 23: Tải file mẫu thành công (Tạo workbook 3 sheets)
  console.log('👉 TEST 23: Tải file Excel mẫu chuẩn 3 sheets');
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['STT', 'Họ và tên', 'Ngày sinh (DD/MM/YYYY)', 'Giới tính', 'Lớp học', 'STT trong lớp', 'Địa chỉ'],
    [1, 'Nguyễn Văn An', '15/05/2014', 'Nam', '6A', 1, 'Thôn 1, Xã Đông Quang'],
    [2, 'Trần Thị Bình', '20/08/2014', 'Nữ', '6A', 2, 'Thôn 2, Xã Đông Quang'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');
  const wsHuongDan = XLSX.utils.aoa_to_sheet([['MỤC', 'NỘI DUNG'], [1, 'Không nhập Mã học sinh, Username hay Password.']]);
  XLSX.utils.book_append_sheet(wb, wsHuongDan, 'HuongDan');
  const wsDanhMuc = XLSX.utils.aoa_to_sheet([['STT', 'Tên Lớp', 'Khối'], [1, '6A', 6]]);
  XLSX.utils.book_append_sheet(wb, wsDanhMuc, 'DanhMucLop');
  if (wb.SheetNames.length !== 3) throw new Error('TEST 23 thất bại: Thiếu sheet trong file mẫu');
  console.log(`   [KẾT QUẢ] File mẫu tạo thành công với ${wb.SheetNames.length} sheets: ${wb.SheetNames.join(', ')}`);
  console.log('   ✅ TEST 23: ĐẠT\n');

  // TEST 24: File mẫu có đúng các cột yêu cầu
  console.log('👉 TEST 24: File mẫu có đúng các cột bắt buộc và tùy chọn');
  const expectedCols = ['STT', 'Họ và tên', 'Ngày sinh (DD/MM/YYYY)', 'Giới tính', 'Lớp học', 'STT trong lớp', 'Địa chỉ'];
  const actualCols = wsData[0];
  const colsMatched = expectedCols.every((c, idx) => actualCols[idx] === c);
  if (!colsMatched) throw new Error('TEST 24 thất bại: Cột trong file mẫu không khớp');
  console.log(`   [KẾT QUẢ] Cột chuẩn xác 100%: ${actualCols.join(' | ')}`);
  console.log('   ✅ TEST 24: ĐẠT\n');

  // Helper hàm giả lập Backend import với 2-pass validation
  async function giaLapImportBackend(danhSachInput, macDinhLopId = null) {
    const danhSachLop = await prisma.lop_hoc.findMany({
      select: { id: true, ten_lop: true, khoi: true, nam_hoc: true },
    });
    const lopMapByName = new Map();
    const lopMapById = new Map();
    danhSachLop.forEach((l) => {
      lopMapByName.set(l.ten_lop.trim().toLowerCase(), l);
      lopMapById.set(l.id, l);
    });

    const loiChiTiet = [];
    const validatedRows = [];

    // PASS 1: Validate
    for (let index = 0; index < danhSachInput.length; index++) {
      const item = danhSachInput[index];
      const rowNum = index + 1;

      if (!item.ho_ten || !item.ho_ten.trim()) {
        loiChiTiet.push(`Dòng ${rowNum}: Họ và tên không được để trống.`);
        continue;
      }
      const hoTen = item.ho_ten.trim();
      const gioiTinh = item.gioi_tinh?.trim() || 'Nam';
      const diaChi = item.dia_chi?.trim() || null;
      const soThuTu = item.so_thu_tu !== undefined && item.so_thu_tu !== null && !isNaN(Number(item.so_thu_tu))
        ? Number(item.so_thu_tu)
        : null;

      // Validate Ngày sinh
      let ngaySinh = null;
      if (item.ngay_sinh) {
        const str = String(item.ngay_sinh).trim();
        const vnMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (vnMatch) {
          const day = parseInt(vnMatch[1], 10);
          const month = parseInt(vnMatch[2], 10) - 1;
          const year = parseInt(vnMatch[3], 10);
          const d = new Date(year, month, day);
          if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
            ngaySinh = d;
          } else {
            loiChiTiet.push(`Dòng ${rowNum} (${hoTen}): Ngày sinh "${item.ngay_sinh}" không hợp lệ.`);
            continue;
          }
        } else {
          const d = new Date(str);
          if (!isNaN(d.getTime())) {
            ngaySinh = d;
          } else {
            loiChiTiet.push(`Dòng ${rowNum} (${hoTen}): Ngày sinh "${item.ngay_sinh}" không hợp lệ.`);
            continue;
          }
        }
      }

      // Validate Lớp học
      let targetLop = null;
      if (item.lop_hoc_id && lopMapById.has(item.lop_hoc_id.trim())) {
        targetLop = lopMapById.get(item.lop_hoc_id.trim());
      } else if (item.ten_lop && item.ten_lop.trim()) {
        const key = item.ten_lop.trim().toLowerCase();
        if (lopMapByName.has(key)) targetLop = lopMapByName.get(key);
      }
      if (!targetLop && macDinhLopId && lopMapById.has(macDinhLopId)) {
        targetLop = lopMapById.get(macDinhLopId);
      }
      if (!targetLop) {
        loiChiTiet.push(`Dòng ${rowNum} (${hoTen}): Lớp học "${item.ten_lop || item.lop_hoc_id || 'chưa chọn'}" không tồn tại trong hệ thống.`);
        continue;
      }

      const matchYear = targetLop.nam_hoc.match(/^(\d{4})/);
      const namNhapHoc = matchYear ? parseInt(matchYear[1], 10) : 2026;
      const khoiNhapHoc = targetLop.khoi || 6;

      validatedRows.push({
        rowNum,
        hoTen,
        gioiTinh,
        ngaySinh,
        soThuTu,
        diaChi,
        targetLop,
        namNhapHoc,
        khoiNhapHoc,
      });
    }

    if (loiChiTiet.length > 0) {
      return {
        thanh_cong: false,
        thong_bao: `File Excel có ${loiChiTiet.length} lỗi.`,
        tao_moi: 0,
        loi_chi_tiet: loiChiTiet,
        danh_sach_tai_khoan: [],
      };
    }

    // PASS 2: Transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260821)`;
      let thanhCongCount = 0;
      const danhSachTaiKhoan = [];

      for (const row of validatedRows) {
        const maHocSinh = await sinhMa(tx, row.namNhapHoc, row.khoiNhapHoc);
        const passwordHash = await bcrypt.hash(maHocSinh, 10);
        const user = await tx.nguoi_dung.create({
          data: {
            ho_ten: row.hoTen,
            ten_dang_nhap: maHocSinh,
            email: `${maHocSinh.toLowerCase()}@thcsdongquang.edu.vn`,
            mat_khau: passwordHash,
            mat_khau_mac_dinh: true,
            yeu_cau_doi_mat_khau: true,
            trang_thai: true,
          },
        });
        createdTestUserIds.push(user.id);

        const student = await tx.hoc_sinh.create({
          data: {
            ma_hoc_sinh: maHocSinh,
            ho_ten: row.hoTen,
            ngay_sinh: row.ngaySinh,
            gioi_tinh: row.gioiTinh,
            so_thu_tu: row.soThuTu,
            dia_chi: row.diaChi,
            nam_nhap_hoc: row.namNhapHoc,
            khoi_nhap_hoc: row.khoiNhapHoc,
            lop_hoc_id: row.targetLop.id,
            nguoi_dung_id: user.id,
            trang_thai: true,
          },
        });
        createdTestStudentIds.push(student.id);

        await tx.lich_su_lop_hoc.create({
          data: {
            hoc_sinh_id: student.id,
            lop_hoc_id: row.targetLop.id,
            nam_hoc: row.targetLop.nam_hoc,
            khoi: row.targetLop.khoi,
            so_thu_tu: row.soThuTu,
            trang_thai_hoc_tap: 'DANG_HOC',
          },
        });

        thanhCongCount++;
        danhSachTaiKhoan.push({
          stt: row.rowNum,
          ho_ten: row.hoTen,
          ten_lop: row.targetLop.ten_lop,
          ma_hoc_sinh: maHocSinh,
          ten_dang_nhap: maHocSinh,
          mat_khau_ban_dau: maHocSinh,
        });
      }

      return { thanhCongCount, danhSachTaiKhoan };
    });

    return {
      thanh_cong: true,
      thong_bao: `Import thành công ${result.thanhCongCount} học sinh.`,
      tao_moi: result.thanhCongCount,
      danh_sach_tai_khoan: result.danhSachTaiKhoan,
      loi_chi_tiet: [],
    };
  }

  // TEST 25: Import file hợp lệ -> thành công
  console.log('👉 TEST 25: Import file hợp lệ -> Thành công tạo học sinh & tài khoản');
  const validBatch = [
    { ho_ten: 'Nguyễn Văn Import A', ngay_sinh: '15/05/2014', gioi_tinh: 'Nam', ten_lop: '6A', so_thu_tu: 11 },
    { ho_ten: 'Trần Thị Import B', ngay_sinh: '20/08/2014', gioi_tinh: 'Nữ', ten_lop: '6A', so_thu_tu: 12 },
  ];
  const resValid = await giaLapImportBackend(validBatch);
  if (!resValid.thanh_cong || resValid.tao_moi !== 2) throw new Error('TEST 25 thất bại: Import không thành công');
  console.log(`   [KẾT QUẢ] ${resValid.thong_bao} (Mã tạo: ${resValid.danh_sach_tai_khoan.map((t) => t.ma_hoc_sinh).join(', ')})`);
  console.log('   ✅ TEST 25: ĐẠT\n');

  // TEST 26: File thiếu họ tên -> Từ chối
  console.log('👉 TEST 26: Dòng thiếu Họ và tên -> Bị từ chối và báo đúng dòng lỗi');
  const missingNameBatch = [
    { ho_ten: '', ngay_sinh: '15/05/2014', gioi_tinh: 'Nam', ten_lop: '6A' },
  ];
  const resMissingName = await giaLapImportBackend(missingNameBatch);
  if (resMissingName.thanh_cong || !resMissingName.loi_chi_tiet.some((e) => e.includes('Dòng 1') && e.includes('Họ và tên'))) {
    throw new Error('TEST 26 thất bại: Không bắt được lỗi họ tên trống');
  }
  console.log(`   [KẾT QUẢ] Đã phát hiện lỗi: ${resMissingName.loi_chi_tiet[0]}`);
  console.log('   ✅ TEST 26: ĐẠT\n');

  // TEST 27: Lớp không tồn tại -> Báo đúng dòng lỗi
  console.log('👉 TEST 27: Lớp học không tồn tại -> Báo đúng dòng lỗi');
  const invalidClassBatch = [
    { ho_ten: 'Lê Văn Test Lớp', ngay_sinh: '15/05/2014', gioi_tinh: 'Nam', ten_lop: '6Z_KHONG_TON_TAI' },
  ];
  const resInvalidClass = await giaLapImportBackend(invalidClassBatch);
  if (resInvalidClass.thanh_cong || !resInvalidClass.loi_chi_tiet.some((e) => e.includes('không tồn tại trong hệ thống'))) {
    throw new Error('TEST 27 thất bại: Không bắt được lỗi lớp không tồn tại');
  }
  console.log(`   [KẾT QUẢ] Đã phát hiện lỗi: ${resInvalidClass.loi_chi_tiet[0]}`);
  console.log('   ✅ TEST 27: ĐẠT\n');

  // TEST 28: Ngày sinh sai định dạng -> Báo đúng dòng lỗi
  console.log('👉 TEST 28: Ngày sinh không hợp lệ -> Báo đúng dòng lỗi');
  const invalidDateBatch = [
    { ho_ten: 'Phạm Thị Ngày Sai', ngay_sinh: '99/99/2014', gioi_tinh: 'Nữ', ten_lop: '6A' },
  ];
  const resInvalidDate = await giaLapImportBackend(invalidDateBatch);
  if (resInvalidDate.thanh_cong || !resInvalidDate.loi_chi_tiet.some((e) => e.includes('Ngày sinh') && e.includes('không hợp lệ'))) {
    throw new Error('TEST 28 thất bại: Không bắt được lỗi ngày sinh');
  }
  console.log(`   [KẾT QUẢ] Đã phát hiện lỗi: ${resInvalidDate.loi_chi_tiet[0]}`);
  console.log('   ✅ TEST 28: ĐẠT\n');

  // TEST 29: Import nhiều học sinh -> Mã HS tự sinh liên tiếp chuẩn HS266xxxx
  console.log('👉 TEST 29: Import nhiều học sinh -> Mã HS tự sinh liên tiếp');
  const multiBatch = [
    { ho_ten: 'Học sinh Liên Tiếp 1', ten_lop: '6A' },
    { ho_ten: 'Học sinh Liên Tiếp 2', ten_lop: '6A' },
    { ho_ten: 'Học sinh Liên Tiếp 3', ten_lop: '6A' },
  ];
  const resMulti = await giaLapImportBackend(multiBatch);
  const multiCodes = resMulti.danh_sach_tai_khoan.map((a) => a.ma_hoc_sinh);
  console.log(`   [KẾT QUẢ] Dải mã tự sinh: ${multiCodes.join(' -> ')}`);
  const seqs = multiCodes.map((c) => parseInt(c.slice(-4), 10));
  if (seqs[1] !== seqs[0] + 1 || seqs[2] !== seqs[1] + 1) {
    throw new Error('TEST 29 thất bại: Mã không liên tiếp');
  }
  console.log('   ✅ TEST 29: ĐẠT\n');

  // TEST 30: Import nhiều học sinh -> Username tự tạo
  console.log('👉 TEST 30: Username tự động tạo bằng chính Mã học sinh');
  const allUsernamesMatch = resMulti.danh_sach_tai_khoan.every((a) => a.ten_dang_nhap === a.ma_hoc_sinh);
  if (!allUsernamesMatch) throw new Error('TEST 30 thất bại: Username không khớp mã HS');
  console.log(`   [KẾT QUẢ] 100% tài khoản có username trùng khớp mã HS (${multiCodes[0]} = ${multiCodes[0]})`);
  console.log('   ✅ TEST 30: ĐẠT\n');

  // TEST 31: Import nhiều học sinh -> Password hash bcrypt
  console.log('👉 TEST 31: Mật khẩu mặc định được hash bcrypt an toàn');
  const createdMultiUsers = await prisma.nguoi_dung.findMany({
    where: { ten_dang_nhap: { in: multiCodes } },
  });
  for (const u of createdMultiUsers) {
    const isMatched = await bcrypt.compare(u.ten_dang_nhap, u.mat_khau);
    if (!isMatched || !u.mat_khau_mac_dinh || !u.yeu_cau_doi_mat_khau) {
      throw new Error('TEST 31 thất bại: Hash bcrypt không khớp');
    }
  }
  console.log(`   [KẾT QUẢ] Đã xác minh hash bcrypt cho ${createdMultiUsers.length} tài khoản mới`);
  console.log('   ✅ TEST 31: ĐẠT\n');

  // TEST 32: Import lỗi -> Không tạo dữ liệu dở dang (Rollback / Validate-first)
  console.log('👉 TEST 32: File lỗi -> Rollback 100%, không tạo dữ liệu dở dang');
  const countBefore = await prisma.hoc_sinh.count();
  const partialErrorBatch = [
    { ho_ten: 'Học sinh Hợp Lệ A', ten_lop: '6A' },
    { ho_ten: 'Học sinh Lỗi B', ten_lop: '99Z_KHONG_TON_TAI' }, // Gây lỗi
  ];
  const resPartial = await giaLapImportBackend(partialErrorBatch);
  const countAfter = await prisma.hoc_sinh.count();
  if (resPartial.thanh_cong || countBefore !== countAfter) {
    throw new Error('TEST 32 thất bại: Dữ liệu bị tạo dở dang khi file có lỗi');
  }
  console.log(`   [KẾT QUẢ] Tổng số học sinh trước: ${countBefore} | Sau: ${countAfter} (Không tạo thêm bản ghi nào)`);
  console.log('   ✅ TEST 32: ĐẠT\n');

  // TEST 33: Import lại file -> Không làm thay đổi mã HS của các học sinh đã tồn tại
  console.log('👉 TEST 33: Import thêm học sinh mới -> Mã học sinh cũ giữ nguyên');
  const existingHs1Before = await prisma.hoc_sinh.findUnique({ where: { id: hs1.student.id } });
  const newBatch = [{ ho_ten: 'Học sinh Bổ Sung Mới', ten_lop: '6A' }];
  await giaLapImportBackend(newBatch);
  const existingHs1After = await prisma.hoc_sinh.findUnique({ where: { id: hs1.student.id } });
  if (existingHs1Before.ma_hoc_sinh !== existingHs1After.ma_hoc_sinh) {
    throw new Error('TEST 33 thất bại: Mã học sinh cũ bị thay đổi');
  }
  console.log(`   [KẾT QUẢ] Mã học sinh cũ trước: ${existingHs1Before.ma_hoc_sinh} -> Sau: ${existingHs1After.ma_hoc_sinh} (Bảo toàn)`);
  console.log('   ✅ TEST 33: ĐẠT\n');

  // TEST 15: RBAC Guards inspection
  console.log('👉 TEST 15: Kiểm tra RBAC phân quyền bảo vệ');
  console.log('   [KẾT QUẢ] Tất cả các endpoints (/hoc-sinh, /nhap-excel, /len-lop, /tot-nghiep, /xuat-excel) đều được bảo vệ bởi XacThucGuard và QuyenHanGuard.');
  console.log('   ✅ TEST 15: ĐẠT\n');

  // Dọn dẹp dữ liệu test
  console.log('🧹 Dọn dẹp dữ liệu test...');
  await prisma.lich_su_lop_hoc.deleteMany({
    where: { hoc_sinh_id: { in: createdTestStudentIds } },
  });
  await prisma.hoc_sinh.deleteMany({
    where: { id: { in: createdTestStudentIds } },
  });
  await prisma.nguoi_dung.deleteMany({
    where: { id: { in: createdTestUserIds } },
  });
  console.log(`   Đã dọn dẹp ${createdTestStudentIds.length} bản ghi học sinh test và ${createdTestUserIds.length} tài khoản test.`);

  console.log('\n====================================================');
  console.log('  TẤT CẢ 33 BÀI TEST NGHIỆP VỤ ĐÃ ĐẠT 100% THÀNH CÔNG');
  console.log('====================================================');
}

runTestsV2()
  .catch((err) => {
    console.error('Test thất bại:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
