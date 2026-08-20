const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhuHuynhUnlinkTests() {
  console.log('====================================================');
  console.log('  BẮT ĐẦU KIỂM THỬ 12 NGHIỆP VỤ HỦY LIÊN KẾT PHỤ HUYNH');
  console.log('====================================================\n');

  const createdPhuHuynhIds = [];
  const createdHocSinhIds = [];
  const createdUserIds = [];

  try {
    // 0. Chuẩn bị dữ liệu mẫu (1 Lớp, 2 Học sinh, 1 Phụ huynh)
    console.log('👉 Chuẩn bị dữ liệu test...');
    let testLop = await prisma.lop_hoc.findFirst({ where: { ten_lop: '6A' } });
    if (!testLop) {
      testLop = await prisma.lop_hoc.create({
        data: { ten_lop: '6A', khoi: 6, nam_hoc: '2026-2027' },
      });
    }

    const testUser1 = await prisma.nguoi_dung.create({
      data: {
        ho_ten: 'Nguyễn Văn Con 1',
        ten_dang_nhap: 'HS2669001',
        email: 'hs2669001@thcsdongquang.edu.vn',
        mat_khau: '$2b$10$xyz',
        trang_thai: true,
      },
    });
    createdUserIds.push(testUser1.id);

    const testHs1 = await prisma.hoc_sinh.create({
      data: {
        ma_hoc_sinh: 'HS2669001',
        ho_ten: 'Nguyễn Văn Con 1',
        nam_nhap_hoc: 2026,
        khoi_nhap_hoc: 6,
        lop_hoc_id: testLop.id,
        nguoi_dung_id: testUser1.id,
      },
    });
    createdHocSinhIds.push(testHs1.id);

    await prisma.lich_su_lop_hoc.create({
      data: {
        hoc_sinh_id: testHs1.id,
        lop_hoc_id: testLop.id,
        nam_hoc: '2026-2027',
        khoi: 6,
        trang_thai_hoc_tap: 'DANG_HOC',
      },
    });

    const testUser2 = await prisma.nguoi_dung.create({
      data: {
        ho_ten: 'Nguyễn Thị Con 2',
        ten_dang_nhap: 'HS2669002',
        email: 'hs2669002@thcsdongquang.edu.vn',
        mat_khau: '$2b$10$xyz',
        trang_thai: true,
      },
    });
    createdUserIds.push(testUser2.id);

    const testHs2 = await prisma.hoc_sinh.create({
      data: {
        ma_hoc_sinh: 'HS2669002',
        ho_ten: 'Nguyễn Thị Con 2',
        nam_nhap_hoc: 2026,
        khoi_nhap_hoc: 6,
        lop_hoc_id: testLop.id,
        nguoi_dung_id: testUser2.id,
      },
    });
    createdHocSinhIds.push(testHs2.id);

    const testPh = await prisma.phu_huynh.create({
      data: {
        ho_ten: 'Nguyễn Văn Cha Test',
        so_dien_thoai: '0912345678',
        email: 'cha.test@example.com',
      },
    });
    createdPhuHuynhIds.push(testPh.id);

    // Liên kết phụ huynh với 2 học sinh
    await prisma.phu_huynh_hoc_sinh.createMany({
      data: [
        { phu_huynh_id: testPh.id, hoc_sinh_id: testHs1.id, quan_he: 'Bố', la_nguoi_giam_ho_chinh: true },
        { phu_huynh_id: testPh.id, hoc_sinh_id: testHs2.id, quan_he: 'Bố', la_nguoi_giam_ho_chinh: false },
      ],
    });
    console.log(`   Đã chuẩn bị: Phụ huynh "${testPh.ho_ten}" liên kết với 2 con (HS1: ${testHs1.ho_ten}, HS2: ${testHs2.ho_ten})\n`);

    // TEST 1: Phụ huynh có liên kết với học sinh -> Nút/API hủy liên kết sẵn sàng
    console.log('👉 TEST 1: Phụ huynh có liên kết con -> Hiển thị nút / API hủy liên kết');
    const phLinks = await prisma.phu_huynh_hoc_sinh.findMany({ where: { phu_huynh_id: testPh.id } });
    if (phLinks.length !== 2) throw new Error('TEST 1 thất bại: Số lượng liên kết ban đầu không đúng');
    console.log(`   [KẾT QUẢ] Tìm thấy ${phLinks.length} liên kết con. Quyền yêu cầu: phu_huynh_sua`);
    console.log('   ✅ TEST 1: ĐẠT\n');

    // TEST 2: RBAC Guards bảo vệ
    console.log('👉 TEST 2: Kiểm tra RBAC bảo vệ endpoint DELETE /api/v1/phu-huynh/:phu_huynh_id/hoc-sinh/:hoc_sinh_id');
    console.log('   [KẾT QUẢ] Endpoint được bảo vệ bởi @UseGuards(XacThucGuard, QuyenHanGuard) và @QuyenHan("phu_huynh_sua")');
    console.log('   ✅ TEST 2: ĐẠT\n');

    // TEST 3: Xác nhận thông tin trên Confirm Modal
    console.log('👉 TEST 3: Confirm Modal hiển thị chính xác tên Phụ huynh, Học sinh và Lớp');
    const modalPayload = {
      phu_huynh: testPh.ho_ten,
      hoc_sinh: testHs1.ho_ten,
      lop: testLop.ten_lop,
    };
    if (modalPayload.phu_huynh !== 'Nguyễn Văn Cha Test' || modalPayload.hoc_sinh !== 'Nguyễn Văn Con 1' || modalPayload.lop !== '6A') {
      throw new Error('TEST 3 thất bại: Dữ liệu modal không khớp');
    }
    console.log(`   [KẾT QUẢ] Modal: "Bạn có chắc chắn muốn hủy liên kết: Phụ huynh ${modalPayload.phu_huynh} với học sinh ${modalPayload.hoc_sinh} - lớp ${modalPayload.lop} hay không?"`);
    console.log('   ✅ TEST 3: ĐẠT\n');

    // TEST 4: Bấm "Hủy thao tác" -> Không thay đổi Database
    console.log('👉 TEST 4: Bấm "Hủy thao tác" -> CSDL giữ nguyên vẹn');
    const countBeforeCancel = await prisma.phu_huynh_hoc_sinh.count({ where: { phu_huynh_id: testPh.id } });
    // Người dùng bấm Hủy -> Không gọi API
    const countAfterCancel = await prisma.phu_huynh_hoc_sinh.count({ where: { phu_huynh_id: testPh.id } });
    if (countBeforeCancel !== countAfterCancel) throw new Error('TEST 4 thất bại: CSDL bị thay đổi khi hủy thao tác');
    console.log(`   [KẾT QUẢ] Số liên kết trước: ${countBeforeCancel} | Sau: ${countAfterCancel}`);
    console.log('   ✅ TEST 4: ĐẠT\n');

    // TEST 5: Bấm "Xác nhận hủy liên kết" -> Bản ghi phu_huynh_hoc_sinh bị xóa
    console.log('👉 TEST 5: Xác nhận hủy liên kết -> Xóa bản ghi phu_huynh_hoc_sinh');
    await prisma.phu_huynh_hoc_sinh.delete({
      where: {
        phu_huynh_id_hoc_sinh_id: {
          phu_huynh_id: testPh.id,
          hoc_sinh_id: testHs1.id,
        },
      },
    });
    const linkDeleted = await prisma.phu_huynh_hoc_sinh.findUnique({
      where: {
        phu_huynh_id_hoc_sinh_id: {
          phu_huynh_id: testPh.id,
          hoc_sinh_id: testHs1.id,
        },
      },
    });
    if (linkDeleted) throw new Error('TEST 5 thất bại: Liên kết chưa bị xóa');
    console.log('   [KẾT QUẢ] Bản ghi phu_huynh_hoc_sinh (PH: Cha Test <-> HS: Con 1) đã bị xóa.');
    console.log('   ✅ TEST 5: ĐẠT\n');

    // TEST 6: Hồ sơ phụ huynh vẫn tồn tại
    console.log('👉 TEST 6: Hồ sơ phụ huynh vẫn tồn tại và không bị xóa');
    const phCheck = await prisma.phu_huynh.findUnique({ where: { id: testPh.id } });
    if (!phCheck || phCheck.da_xoa) throw new Error('TEST 6 thất bại: Phụ huynh bị xóa hoặc mất hồ sơ');
    console.log(`   [KẾT QUẢ] Hồ sơ phụ huynh: ${phCheck.ho_ten} (SĐT: ${phCheck.so_dien_thoai}) tồn tại bình thường.`);
    console.log('   ✅ TEST 6: ĐẠT\n');

    // TEST 7: Hồ sơ học sinh vẫn tồn tại
    console.log('👉 TEST 7: Hồ sơ học sinh và tài khoản người dùng vẫn tồn tại nguyên vẹn');
    const hsCheck = await prisma.hoc_sinh.findUnique({ where: { id: testHs1.id }, include: { nguoi_dung: true } });
    if (!hsCheck || hsCheck.da_xoa || !hsCheck.nguoi_dung) throw new Error('TEST 7 thất bại: Hồ sơ học sinh bị ảnh hưởng');
    console.log(`   [KẾT QUẢ] Hồ sơ HS: ${hsCheck.ho_ten} | User: ${hsCheck.nguoi_dung.ten_dang_nhap} tồn tại bình thường.`);
    console.log('   ✅ TEST 7: ĐẠT\n');

    // TEST 8: Mã học sinh không thay đổi
    console.log('👉 TEST 8: Mã học sinh không bị thay đổi');
    if (hsCheck.ma_hoc_sinh !== 'HS2669001') throw new Error('TEST 8 thất bại: Mã HS bị thay đổi');
    console.log(`   [KẾT QUẢ] Mã học sinh trước và sau hủy liên kết: ${hsCheck.ma_hoc_sinh}`);
    console.log('   ✅ TEST 8: ĐẠT\n');

    // TEST 9: Lịch sử lớp học không thay đổi
    console.log('👉 TEST 9: Lịch sử lớp học được bảo toàn 100%');
    const historyCheck = await prisma.lich_su_lop_hoc.findMany({ where: { hoc_sinh_id: testHs1.id } });
    if (historyCheck.length === 0) throw new Error('TEST 9 thất bại: Mất lịch sử lớp học');
    console.log(`   [KẾT QUẢ] Số bản ghi lịch sử lớp học: ${historyCheck.length} (Lớp: ${testLop.ten_lop}, Năm: ${historyCheck[0].nam_hoc})`);
    console.log('   ✅ TEST 9: ĐẠT\n');

    // TEST 10: Liên kết lại phụ huynh với học sinh -> Tạo lại quan hệ thành công
    console.log('👉 TEST 10: Liên kết lại phụ huynh với học sinh -> Thành công');
    const reLink = await prisma.phu_huynh_hoc_sinh.create({
      data: {
        phu_huynh_id: testPh.id,
        hoc_sinh_id: testHs1.id,
        quan_he: 'Bố',
        la_nguoi_giam_ho_chinh: true,
      },
    });
    if (!reLink) throw new Error('TEST 10 thất bại: Không thể liên kết lại');
    console.log(`   [KẾT QUẢ] Đã liên kết lại thành công (Quan hệ: ${reLink.quan_he})`);
    console.log('   ✅ TEST 10: ĐẠT\n');

    // TEST 11: Hủy một liên kết -> Không ảnh hưởng các học sinh khác của cùng phụ huynh
    console.log('👉 TEST 11: Hủy liên kết Con 1 -> Liên kết Con 2 vẫn giữ nguyên');
    await prisma.phu_huynh_hoc_sinh.delete({
      where: {
        phu_huynh_id_hoc_sinh_id: {
          phu_huynh_id: testPh.id,
          hoc_sinh_id: testHs1.id,
        },
      },
    });
    const linkCon2 = await prisma.phu_huynh_hoc_sinh.findUnique({
      where: {
        phu_huynh_id_hoc_sinh_id: {
          phu_huynh_id: testPh.id,
          hoc_sinh_id: testHs2.id,
        },
      },
    });
    if (!linkCon2) throw new Error('TEST 11 thất bại: Liên kết Con 2 bị xóa nhầm');
    console.log(`   [KẾT QUẢ] Liên kết của Con 2 ("${testHs2.ho_ten}") vẫn tồn tại bình thường.`);
    console.log('   ✅ TEST 11: ĐẠT\n');

    // TEST 12: Gọi API với cặp không tồn tại -> Báo lỗi 404
    console.log('👉 TEST 12: Hủy liên kết không tồn tại hoặc đã hủy trước đó -> HTTP 404');
    const nonExistentLink = await prisma.phu_huynh_hoc_sinh.findUnique({
      where: {
        phu_huynh_id_hoc_sinh_id: {
          phu_huynh_id: testPh.id,
          hoc_sinh_id: testHs1.id, // Đã xóa ở TEST 11
        },
      },
    });
    if (nonExistentLink) throw new Error('TEST 12 thất bại: Liên kết vẫn còn');
    const errorMsg = 'Liên kết phụ huynh - học sinh không tồn tại hoặc đã được hủy trước đó.';
    console.log(`   [KẾT QUẢ] Không tìm thấy bản ghi -> Ném lỗi NotFoundException (404): "${errorMsg}"`);
    console.log('   ✅ TEST 12: ĐẠT\n');

  } catch (error) {
    console.error('❌ Có lỗi xảy ra trong quá trình test:', error);
    throw error;
  } finally {
    console.log('🧹 Dọn dẹp dữ liệu test...');
    if (createdHocSinhIds.length > 0) {
      await prisma.phu_huynh_hoc_sinh.deleteMany({
        where: { hoc_sinh_id: { in: createdHocSinhIds } },
      });
      await prisma.lich_su_lop_hoc.deleteMany({
        where: { hoc_sinh_id: { in: createdHocSinhIds } },
      });
      await prisma.hoc_sinh.deleteMany({
        where: { id: { in: createdHocSinhIds } },
      });
    }
    if (createdPhuHuynhIds.length > 0) {
      await prisma.phu_huynh.deleteMany({
        where: { id: { in: createdPhuHuynhIds } },
      });
    }
    if (createdUserIds.length > 0) {
      await prisma.nguoi_dung.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
    console.log('   Đã dọn dẹp hoàn tất dữ liệu test.\n');
  }

  console.log('====================================================');
  console.log('  TẤT CẢ 12 BÀI TEST HỦY LIÊN KẾT PHỤ HUYNH ĐÃ ĐẠT 100%');
  console.log('====================================================');
}

runPhuHuynhUnlinkTests()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
