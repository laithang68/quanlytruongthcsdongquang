const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dữ liệu Giai đoạn 13 (Thông báo & Lịch hoạt động)...');

  // Lấy hoặc gán ID người tạo admin
  const adminUser = await prisma.nguoi_dung.findFirst({
    where: { da_xoa: false },
  });

  if (!adminUser) {
    console.error('Không tìm thấy người dùng admin để tạo thông báo.');
    return;
  }

  const adminId = adminUser.id;

  // 1. DANH SÁCH THÔNG BÁO MẪU
  const thongBaoList = [
    {
      tieu_de: 'Thông báo Kế hoạch Tựu trường và Khai giảng Năm học 2026-2027',
      noi_dung: `<p>Ban BGH Trường THCS Đông Quang trân trọng thông báo tới toàn thể cán bộ, giáo viên, nhân viên, học sinh và quý phụ huynh kế hoạch tựu trường:</p>
<ul>
  <li><strong>Ngày Tựu trường:</strong> 08:00 Ngày 25/08/2026 (Thứ Ba).</li>
  <li><strong>Địa điểm:</strong> Sân trường THCS Đông Quang.</li>
  <li><strong>Trang phục:</strong> Đồng phục nhà trường, khăn quàng đỏ.</li>
  <li><strong>Lễ Khai giảng chính thức:</strong> 07:30 Ngày 05/09/2026 (Thứ Bảy).</li>
</ul>
<p>Yêu cầu các GVCN đôn đốc học sinh tham gia đầy đủ, đúng giờ.</p>`,
      doi_tuong: 'CONG_KHAI',
      trang_thai: true,
      nguoi_tao_id: adminId,
      ngay_bat_dau: new Date('2026-08-20T08:00:00Z'),
      ngay_ket_thuc: new Date('2026-09-06T17:00:00Z'),
    },
    {
      tieu_de: 'Thông báo Họp Phụ huynh Đầu năm học 2026-2027',
      noi_dung: `<p>Nhà trường trân trọng kính mời Toàn thể Quý Phụ huynh học sinh các khối 6, 7, 8, 9 về dự Buổi họp Phụ huynh Đầu năm học:</p>
<p>📍 <strong>Thời gian:</strong> 14:00 Ngày 30/08/2026 (Chủ Nhật).</p>
<p>📍 <strong>Địa điểm:</strong> Phòng học các lớp THCS Đông Quang.</p>
<p>📍 <strong>Nội dung:</strong> Thông qua phương hướng năm học mới, bàn giao tài liệu học tập và bầu Ban đại diện cha mẹ học sinh lớp.</p>`,
      doi_tuong: 'CONG_KHAI',
      trang_thai: true,
      nguoi_tao_id: adminId,
      ngay_bat_dau: new Date('2026-08-22T08:00:00Z'),
      ngay_ket_thuc: new Date('2026-08-31T17:00:00Z'),
    },
    {
      tieu_de: 'Thông báo Lịch tiêm chủng y tế học đường & Khám sức khỏe định kỳ',
      noi_dung: `<p>Trường THCS Đông Quang phối hợp cùng Trạm Y tế Phường Đông Quang tổ chức chương trình khám sức khỏe tổng quát và rà soát tiêm chủng học đường năm học 2026-2027.</p>
<p>📍 <strong>Đối tượng:</strong> Học sinh khối 6 và khối 7.</p>
<p>📍 <strong>Thời gian thực hiện:</strong> Ngày 12/09/2026 (Thứ Bảy).</p>`,
      doi_tuong: 'CONG_KHAI',
      trang_thai: true,
      nguoi_tao_id: adminId,
      ngay_bat_dau: new Date('2026-09-01T08:00:00Z'),
      ngay_ket_thuc: new Date('2026-09-15T17:00:00Z'),
    },
    {
      tieu_de: 'Lịch Hoạt động: Hội nghị Tập huấn Chuyên môn Giáo viên THCS',
      noi_dung: `<p>Nhà trường tổ chức Hội nghị Tập huấn Chuyên môn nâng cao năng lực dạy học số và đổi mới phương pháp giảng dạy Chương trình GDPT 2018.</p>
<p>📅 <strong>Ngày thực hiện:</strong> 27/08/2026</p>
<p>⏰ <strong>Thời gian:</strong> 08:00 - 11:30</p>
<p>📍 <strong>Địa điểm:</strong> Hội trường đa năng THCS Đông Quang</p>
<p>👥 <strong>Đối tượng:</strong> Toàn thể cán bộ, giáo viên các tổ chuyên môn</p>`,
      doi_tuong: 'CONG_KHAI',
      trang_thai: true,
      nguoi_tao_id: adminId,
      ngay_bat_dau: new Date('2026-08-27T08:00:00Z'),
      ngay_ket_thuc: new Date('2026-08-27T11:30:00Z'),
    },
    {
      tieu_de: 'Lịch Hoạt động: Ngày hội Trồng cây & Lao động Vệ sinh Quang cảnh Trường',
      noi_dung: `<p>Đoàn Thanh niên và Liên đội Trường THCS Đông Quang phát động Ngày hội Vệ sinh môi trường và chăm sóc công trình măng non chào mừng năm học mới.</p>
<p>📅 <strong>Ngày thực hiện:</strong> 29/08/2026</p>
<p>⏰ <strong>Thời gian:</strong> 07:30 - 10:30</p>
<p>📍 <strong>Địa điểm:</strong> Khuôn viên sân trường & phòng học</p>
<p>👥 <strong>Đối tượng:</strong> Đoàn viên, Đội viên học sinh toàn trường</p>`,
      doi_tuong: 'CONG_KHAI',
      trang_thai: true,
      nguoi_tao_id: adminId,
      ngay_bat_dau: new Date('2026-08-29T07:30:00Z'),
      ngay_ket_thuc: new Date('2026-08-29T10:30:00Z'),
    },
    {
      tieu_de: 'Lịch Hoạt động: Ngoại khóa Tuyên truyền Luật Giao thông Đường bộ',
      noi_dung: `<p>Chương trình giáo dục ngoại khóa phối hợp với Công an Phường Đông Quang tuyên truyền An toàn giao thông học đường và trao tặng mũ bảo hiểm cho học sinh.</p>
<p>📅 <strong>Ngày thực hiện:</strong> 08/09/2026</p>
<p>⏰ <strong>Thời gian:</strong> 14:00 - 16:30</p>
<p>📍 <strong>Địa điểm:</strong> Sân trường THCS Đông Quang</p>
<p>👥 <strong>Đối tượng:</strong> Cán bộ giáo viên & Học sinh toàn trường</p>`,
      doi_tuong: 'CONG_KHAI',
      trang_thai: true,
      nguoi_tao_id: adminId,
      ngay_bat_dau: new Date('2026-09-08T14:00:00Z'),
      ngay_ket_thuc: new Date('2026-09-08T16:30:00Z'),
    },
  ];

  for (const item of thongBaoList) {
    const existing = await prisma.thong_bao.findFirst({
      where: { tieu_de: item.tieu_de },
    });
    if (!existing) {
      await prisma.thong_bao.create({ data: item });
      console.log(`+ Da tao: ${item.tieu_de}`);
    }
  }

  console.log('Seeding Giai đoạn 13 thành công!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
