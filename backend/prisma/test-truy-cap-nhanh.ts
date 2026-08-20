import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ MODULE TRUY CẬP NHANH ===');
  let passed = 0;
  let total = 5;

  try {
    // 1. Kiểm tra seed data
    const count = await prisma.truy_cap_nhanh.count();
    console.log(`[TEST 1] Tổng số banner trong DB: ${count}`);
    if (count >= 5) {
      console.log('✓ PASS Test 1: Đã khởi tạo dữ liệu mẫu chuẩn thành công.');
      passed++;
    } else {
      console.error('✗ FAIL Test 1: Thiếu dữ liệu mẫu.');
    }

    // 2. Kiểm tra truy vấn Public (chỉ lấy trang_thai = true và sắp xếp theo thu_tu)
    const publicList = await prisma.truy_cap_nhanh.findMany({
      where: { trang_thai: true },
      orderBy: [{ thu_tu: 'asc' }, { ngay_tao: 'asc' }],
    });
    console.log(`[TEST 2] Số banner public hoạt động: ${publicList.length}`);
    const isSorted = publicList.every((item, i) => i === 0 || item.thu_tu >= publicList[i - 1].thu_tu);
    if (publicList.length > 0 && isSorted) {
      console.log('✓ PASS Test 2: Public query lọc đúng trang_thai=true và sắp xếp thu_tu ASC.');
      passed++;
    } else {
      console.error('✗ FAIL Test 2: Lỗi sắp xếp hoặc lọc public.');
    }

    // 3. Kiểm tra Thêm mới banner
    const newBanner = await prisma.truy_cap_nhanh.create({
      data: {
        ten: 'Banner Kiểm Thử Tự Động',
        anh: '/images/test-banner.png',
        url: 'https://test.edu.vn',
        thu_tu: 99,
        trang_thai: false,
      },
    });
    if (newBanner && newBanner.id) {
      console.log('✓ PASS Test 3: Thêm mới banner thành công.');
      passed++;
    } else {
      console.error('✗ FAIL Test 3: Không thể tạo banner mới.');
    }

    // 4. Kiểm tra Cập nhật banner
    const updated = await prisma.truy_cap_nhanh.update({
      where: { id: newBanner.id },
      data: { ten: 'Banner Kiểm Thử Đã Sửa', thu_tu: 100 },
    });
    if (updated.ten === 'Banner Kiểm Thử Đã Sửa' && updated.thu_tu === 100) {
      console.log('✓ PASS Test 4: Cập nhật banner thành công.');
      passed++;
    } else {
      console.error('✗ FAIL Test 4: Cập nhật dữ liệu thất bại.');
    }

    // 5. Kiểm tra Xóa banner
    await prisma.truy_cap_nhanh.delete({
      where: { id: newBanner.id },
    });
    const checkDeleted = await prisma.truy_cap_nhanh.findUnique({
      where: { id: newBanner.id },
    });
    if (!checkDeleted) {
      console.log('✓ PASS Test 5: Xóa banner thành công.');
      passed++;
    } else {
      console.error('✗ FAIL Test 5: Không thể xóa banner.');
    }

    console.log(`\n=== KẾT QUẢ: ${passed}/${total} TESTS PASSED ===`);
  } catch (error) {
    console.error('Lỗi khi chạy kiểm thử:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
