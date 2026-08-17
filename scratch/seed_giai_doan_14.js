const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dữ liệu Giai đoạn 14 (Văn bản chỉ đạo)...');

  // Lấy ID người dùng admin
  const adminUser = await prisma.nguoi_dung.findFirst({ where: { da_xoa: false } });
  if (!adminUser) {
    console.error('Không tìm thấy admin user.');
    return;
  }
  const adminId = adminUser.id;

  // Lấy map các loại văn bản theo ma
  const loaiMap = {};
  const loaiList = await prisma.loai_van_ban.findMany();
  loaiList.forEach((l) => (loaiMap[l.ma] = l.id));

  // Danh sách mẫu các văn bản chính thức
  const vanBanList = [
    {
      so_hieu: '45/TB-THCSDQ',
      ten_van_ban: 'Thông báo Kế hoạch tổ chức dạy học 2 buổi/ngày năm học 2026-2027',
      loai_van_ban_ma: 'thong-bao-nha-truong',
      ngay_ban_hanh: new Date('2026-08-10'),
      nguoi_ky: 'Hiệu trưởng - Lê Văn B',
      mo_ta: 'Thông báo chi tiết thời gian biểu, kế hoạch bồi dưỡng học sinh giỏi và phụ đạo học sinh năm học mới.',
      trang_thai: true,
      nguoi_tao_id: adminId,
    },
    {
      so_hieu: '12/UBND-ĐQ',
      ten_van_ban: 'Quyết định Về việc phê duyệt kế hoạch đảm bảo an ninh trật tự và an toàn giao thông cổng trường học năm 2026',
      loai_van_ban_ma: 'van-ban-phuong-xa',
      ngay_ban_hanh: new Date('2026-08-05'),
      nguoi_ky: 'Chủ tịch UBND Phường - Trần Văn C',
      mo_ta: 'Phối hợp lực lượng công an phường phân luồng giao thông giờ cao điểm trước cổng Trường THCS Đông Quang.',
      trang_thai: true,
      nguoi_tao_id: adminId,
    },
    {
      so_hieu: '1852/SGDĐT-GDTHCS',
      ten_van_ban: 'Hướng dẫn Thực hiện nhiệm vụ Giáo dục Trung học cơ sở năm học 2026-2027 trên địa bàn tỉnh Thanh Hóa',
      loai_van_ban_ma: 'van-ban-so-gddt',
      ngay_ban_hanh: new Date('2026-08-01'),
      nguoi_ky: 'Giám đốc Sở GD&ĐT',
      mo_ta: 'Văn bản chỉ đạo các phòng GD&ĐT và các trường THCS nâng cao chất lượng dạy học Chương trình GDPT 2018.',
      trang_thai: true,
      nguoi_tao_id: adminId,
    },
    {
      so_hieu: '2841/BGDĐT-GDTrH',
      ten_van_ban: 'Chỉ thị Về việc tổ chức khai giảng và các hoạt động đầu năm học mới 2026-2027',
      loai_van_ban_ma: 'van-ban-bo-gddt',
      ngay_ban_hanh: new Date('2026-07-28'),
      nguoi_ky: 'Bộ trưởng Bộ GD&ĐT',
      mo_ta: 'Chỉ đạo toàn quốc tổ chức Lễ Khai giảng ngắn gọn, trang trọng, lấy học sinh làm trung tâm.',
      trang_thai: true,
      nguoi_tao_id: adminId,
    },
    {
      so_hieu: '48/TB-THCSDQ',
      ten_van_ban: 'Thông báo Quy định về đồng phục, tác phong học sinh năm học 2026-2027',
      loai_van_ban_ma: 'thong-bao-nha-truong',
      ngay_ban_hanh: new Date('2026-08-12'),
      nguoi_ky: 'Phó Hiệu trưởng - Nguyễn Thị D',
      mo_ta: 'Hướng dẫn quy chuẩn đồng phục chính khóa, đồng phục thể dục và thẻ học sinh Trường THCS Đông Quang.',
      trang_thai: true,
      nguoi_tao_id: adminId,
    },
  ];

  for (const item of vanBanList) {
    const typeId = loaiMap[item.loai_van_ban_ma] || loaiList[0].id;
    const existing = await prisma.van_ban.findFirst({
      where: { so_hieu: item.so_hieu },
    });

    if (!existing) {
      await prisma.van_ban.create({
        data: {
          so_hieu: item.so_hieu,
          ten_van_ban: item.ten_van_ban,
          loai_van_ban_id: typeId,
          ngay_ban_hanh: item.ngay_ban_hanh,
          nguoi_ky: item.nguoi_ky,
          mo_ta: item.mo_ta,
          trang_thai: item.trang_thai,
          nguoi_tao_id: item.nguoi_tao_id,
        },
      });
      console.log(`+ Đã tạo văn bản: ${item.so_hieu} - ${item.ten_van_ban}`);
    }
  }

  console.log('Seeding Giai đoạn 14 thành công!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
