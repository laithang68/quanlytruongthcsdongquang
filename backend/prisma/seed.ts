import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu Seed dữ liệu Phân quyền RBAC THCS Đông Quang ---');

  // 1. Dữ liệu Vai trò (6 Vai trò hệ thống)
  const vaiTroData = [
    { ma: 'SUPER_ADMIN', ten: 'Quản trị tối cao', mo_ta: 'Toàn quyền quản trị hệ thống' },
    { ma: 'QUAN_TRI_VIEN', ten: 'Quản trị viên', mo_ta: 'Quản trị nội dung và người dùng' },
    { ma: 'BAN_GIAM_HIEU', ten: 'Ban giám hiệu', mo_ta: 'Duyệt và xuất bản nội dung, quản lý chuyên môn' },
    { ma: 'GIAO_VIEN', ten: 'Giáo viên', mo_ta: 'Quản lý thông báo và thông tin chuyên môn' },
    { ma: 'BIEN_TAP_VIEN', ten: 'Biên tập viên', mo_ta: 'Soạn thảo và quản lý bài viết, truyền thông' },
    { ma: 'NGUOI_XEM', ten: 'Người xem', mo_ta: 'Quyền xem nội dung nội bộ' },
  ];

  const mapVaiTro = new Map<string, any>();
  for (const vt of vaiTroData) {
    const role = await prisma.vai_tro.upsert({
      where: { ma: vt.ma },
      update: { ten: vt.ten, mo_ta: vt.mo_ta },
      create: vt,
    });
    mapVaiTro.set(vt.ma, role);
  }
  console.log('✓ Đã khởi tạo 6 vai trò thành công');

  // 2. Dữ liệu Quyền hạn chi tiết cho 18 Module Quản trị
  const quyenHanData = [
    // 1. Tổng quan hệ thống
    { ma: 'tong_quan_xem', ten: 'Xem tổng quan', mo_ta: 'Xem bảng điều khiển thống kê hệ thống' },

    // 2. Giới thiệu chung
    { ma: 'gioi_thieu_xem', ten: 'Xem giới thiệu', mo_ta: 'Xem nội dung giới thiệu' },
    { ma: 'gioi_thieu_tao', ten: 'Tạo giới thiệu', mo_ta: 'Tạo bản ghi giới thiệu mới' },
    { ma: 'gioi_thieu_sua', ten: 'Sửa giới thiệu', mo_ta: 'Chỉnh sửa nội dung giới thiệu' },
    { ma: 'gioi_thieu_xoa', ten: 'Xóa giới thiệu', mo_ta: 'Xóa bản ghi giới thiệu' },

    // 3. Quản lý người dùng
    { ma: 'nguoi_dung_xem', ten: 'Xem người dùng', mo_ta: 'Xem danh sách và chi tiết người dùng' },
    { ma: 'nguoi_dung_tao', ten: 'Tạo người dùng', mo_ta: 'Tạo tài khoản người dùng mới' },
    { ma: 'nguoi_dung_sua', ten: 'Sửa người dùng', mo_ta: 'Chỉnh sửa thông tin người dùng' },
    { ma: 'nguoi_dung_khoa', ten: 'Khóa người dùng', mo_ta: 'Khóa và mở khóa tài khoản người dùng' },
    { ma: 'nguoi_dung_xoa', ten: 'Xóa người dùng', mo_ta: 'Xóa mềm người dùng' },
    { ma: 'nguoi_dung_dat_lai_mat_khau', ten: 'Đặt lại mật khẩu', mo_ta: 'Đặt lại mật khẩu tài khoản người dùng' },
    { ma: 'nguoi_dung_gan_vai_tro', ten: 'Gán vai trò', mo_ta: 'Gán và bỏ vai trò người dùng' },

    // 4. Quản lý bài viết
    { ma: 'bai_viet_xem', ten: 'Xem bài viết', mo_ta: 'Xem danh sách và chi tiết bài viết' },
    { ma: 'bai_viet_tao', ten: 'Tạo bài viết', mo_ta: 'Tạo bài viết mới' },
    { ma: 'bai_viet_sua', ten: 'Sửa bài viết', mo_ta: 'Chỉnh sửa bài viết' },
    { ma: 'bai_viet_xoa', ten: 'Xóa bài viết', mo_ta: 'Xóa bài viết' },
    { ma: 'bai_viet_duyet', ten: 'Duyệt bài viết', mo_ta: 'Phê duyệt bài viết' },
    { ma: 'bai_viet_xuat_ban', ten: 'Xuất bản bài viết', mo_ta: 'Xuất bản bài viết lên cổng thông tin' },

    // 5. Quản lý thông báo
    { ma: 'thong_bao_xem', ten: 'Xem thông báo', mo_ta: 'Xem danh sách thông báo' },
    { ma: 'thong_bao_tao', ten: 'Tạo thông báo', mo_ta: 'Tạo thông báo mới' },
    { ma: 'thong_bao_sua', ten: 'Sửa thông báo', mo_ta: 'Sửa thông báo' },
    { ma: 'thong_bao_xoa', ten: 'Xóa thông báo', mo_ta: 'Xóa thông báo' },
    { ma: 'thong_bao_duyet', ten: 'Duyệt thông báo', mo_ta: 'Duyệt thông báo' },
    { ma: 'thong_bao_xuat_ban', ten: 'Xuất bản thông báo', mo_ta: 'Xuất bản thông báo' },

    // 6. Quản lý văn bản
    { ma: 'van_ban_xem', ten: 'Xem văn bản', mo_ta: 'Xem danh mục văn bản' },
    { ma: 'van_ban_tao', ten: 'Tạo văn bản', mo_ta: 'Tải lên văn bản mới' },
    { ma: 'van_ban_sua', ten: 'Sửa văn bản', mo_ta: 'Sửa thông tin văn bản' },
    { ma: 'van_ban_xoa', ten: 'Xóa văn bản', mo_ta: 'Xóa văn bản' },
    { ma: 'van_ban_duyet', ten: 'Duyệt văn bản', mo_ta: 'Duyệt văn bản' },
    { ma: 'van_ban_xuat_excel', ten: 'Xuất Excel văn bản', mo_ta: 'Xuất biểu mẫu Excel văn bản' },

    // 7. Quản lý giáo viên
    { ma: 'giao_vien_xem', ten: 'Xem giáo viên', mo_ta: 'Xem danh sách giáo viên' },
    { ma: 'giao_vien_tao', ten: 'Tạo giáo viên', mo_ta: 'Thêm giáo viên mới' },
    { ma: 'giao_vien_sua', ten: 'Sửa giáo viên', mo_ta: 'Cập nhật hồ sơ giáo viên' },
    { ma: 'giao_vien_xoa', ten: 'Xóa giáo viên', mo_ta: 'Xóa hồ sơ giáo viên' },
    { ma: 'giao_vien_xuat_excel', ten: 'Xuất Excel giáo viên', mo_ta: 'Xuất hồ sơ giáo viên' },

    // 8. Quản lý tổ chuyên môn
    { ma: 'to_chuyen_mon_xem', ten: 'Xem tổ chuyên môn', mo_ta: 'Xem danh sách tổ chuyên môn' },
    { ma: 'to_chuyen_mon_tao', ten: 'Tạo tổ chuyên môn', mo_ta: 'Thêm tổ chuyên môn mới' },
    { ma: 'to_chuyen_mon_sua', ten: 'Sửa tổ chuyên môn', mo_ta: 'Sửa thông tin tổ chuyên môn' },
    { ma: 'to_chuyen_mon_xoa', ten: 'Xóa tổ chuyên môn', mo_ta: 'Xóa tổ chuyên môn' },

    // 9. Quản lý lớp học
    { ma: 'lop_hoc_xem', ten: 'Xem lớp học', mo_ta: 'Xem danh sách lớp học' },
    { ma: 'lop_hoc_tao', ten: 'Tạo lớp học', mo_ta: 'Tạo lớp học mới' },
    { ma: 'lop_hoc_sua', ten: 'Sửa lớp học', mo_ta: 'Chỉnh sửa lớp học và gán GVCN' },
    { ma: 'lop_hoc_xoa', ten: 'Xóa lớp học', mo_ta: 'Xóa lớp học' },
    { ma: 'lop_hoc_xuat_excel', ten: 'Xuất Excel lớp học', mo_ta: 'Xuất danh sách lớp học' },

    // 10. Quản lý học sinh
    { ma: 'hoc_sinh_xem', ten: 'Xem học sinh', mo_ta: 'Xem hồ sơ học sinh' },
    { ma: 'hoc_sinh_tao', ten: 'Tạo học sinh', mo_ta: 'Tạo hồ sơ học sinh mới' },
    { ma: 'hoc_sinh_sua', ten: 'Sửa học sinh', mo_ta: 'Sửa thông tin học sinh và chuyển lớp' },
    { ma: 'hoc_sinh_xoa', ten: 'Xóa học sinh', mo_ta: 'Xóa mềm hồ sơ học sinh' },
    { ma: 'hoc_sinh_xuat_excel', ten: 'Xuất Excel học sinh', mo_ta: 'Xuất danh sách học sinh' },

    // 11. Quản lý phụ huynh
    { ma: 'phu_huynh_xem', ten: 'Xem phụ huynh', mo_ta: 'Xem danh sách phụ huynh' },
    { ma: 'phu_huynh_tao', ten: 'Tạo phụ huynh', mo_ta: 'Thêm phụ huynh mới' },
    { ma: 'phu_huynh_sua', ten: 'Sửa phụ huynh', mo_ta: 'Sửa thông tin phụ huynh' },
    { ma: 'phu_huynh_xoa', ten: 'Xóa phụ huynh', mo_ta: 'Xóa mềm thông tin phụ huynh' },
    { ma: 'phu_huynh_xuat_excel', ten: 'Xuất Excel phụ huynh', mo_ta: 'Xuất danh sách phụ huynh' },

    // 12. Quản lý video
    { ma: 'video_xem', ten: 'Xem video', mo_ta: 'Xem danh sách và chi tiết video' },
    { ma: 'video_tao', ten: 'Tạo video', mo_ta: 'Thêm video mới' },
    { ma: 'video_sua', ten: 'Sửa video', mo_ta: 'Chỉnh sửa video và đổi trạng thái' },
    { ma: 'video_xoa', ten: 'Xóa video', mo_ta: 'Xóa video' },
    { ma: 'video_duyet', ten: 'Duyệt video', mo_ta: 'Duyệt video' },
    { ma: 'video_xuat_ban', ten: 'Xuất bản video', mo_ta: 'Xuất bản video' },
    { ma: 'video_upload', ten: 'Upload video', mo_ta: 'Tải tệp video lên' },

    // 13. Quản lý thư viện ảnh
    { ma: 'thu_vien_anh_xem', ten: 'Xem thư viện ảnh', mo_ta: 'Xem danh sách album ảnh' },
    { ma: 'thu_vien_anh_tao', ten: 'Tạo album ảnh', mo_ta: 'Tạo album ảnh mới' },
    { ma: 'thu_vien_anh_sua', ten: 'Sửa album ảnh', mo_ta: 'Sửa thông tin album và quản lý tệp' },
    { ma: 'thu_vien_anh_xoa', ten: 'Xóa album ảnh', mo_ta: 'Xóa album ảnh' },
    { ma: 'thu_vien_anh_duyet', ten: 'Duyệt album ảnh', mo_ta: 'Duyệt album ảnh' },
    { ma: 'thu_vien_anh_xuat_ban', ten: 'Xuất bản album ảnh', mo_ta: 'Xuất bản album ảnh' },
    { ma: 'thu_vien_anh_upload', ten: 'Upload ảnh', mo_ta: 'Tải tệp ảnh lên thư viện' },

    // 14. Quản lý thư viện số
    { ma: 'thu_vien_so_xem', ten: 'Xem thư viện số', mo_ta: 'Xem tài liệu điện tử' },
    { ma: 'thu_vien_so_tao', ten: 'Tạo tài liệu số', mo_ta: 'Tải lên tài liệu số mới' },
    { ma: 'thu_vien_so_sua', ten: 'Sửa tài liệu số', mo_ta: 'Sửa thông tin tài liệu số' },
    { ma: 'thu_vien_so_xoa', ten: 'Xóa tài liệu số', mo_ta: 'Xóa tài liệu số' },
    { ma: 'thu_vien_so_duyet', ten: 'Duyệt tài liệu số', mo_ta: 'Duyệt tài liệu số' },
    { ma: 'thu_vien_so_xuat_ban', ten: 'Xuất bản tài liệu số', mo_ta: 'Xuất bản tài liệu số' },
    { ma: 'thu_vien_so_upload', ten: 'Upload tài liệu số', mo_ta: 'Tải tệp tài liệu số' },
    { ma: 'thu_vien_so_xuat_excel', ten: 'Xuất Excel thư viện số', mo_ta: 'Xuất danh sách thư viện số' },

    // 15. Quản lý hoạt động & sự kiện
    { ma: 'hoat_dong_xem', ten: 'Xem hoạt động', mo_ta: 'Xem sự kiện hoạt động' },
    { ma: 'hoat_dong_tao', ten: 'Tạo hoạt động', mo_ta: 'Tạo hoạt động mới' },
    { ma: 'hoat_dong_sua', ten: 'Sửa hoạt động', mo_ta: 'Sửa hoạt động' },
    { ma: 'hoat_dong_xoa', ten: 'Xóa hoạt động', mo_ta: 'Xóa hoạt động' },
    { ma: 'hoat_dong_duyet', ten: 'Duyệt hoạt động', mo_ta: 'Duyệt hoạt động' },
    { ma: 'hoat_dong_xuat_ban', ten: 'Xuất bản hoạt động', mo_ta: 'Xuất bản hoạt động' },

    // 16. Thông tin phản ánh
    { ma: 'phan_anh_xem', ten: 'Xem phản ánh', mo_ta: 'Xem danh sách phản ánh' },
    { ma: 'phan_anh_sua', ten: 'Xử lý phản ánh', mo_ta: 'Cập nhật trạng thái phản ánh' },
    { ma: 'phan_anh_xoa', ten: 'Xóa phản ánh', mo_ta: 'Xóa phản ánh' },
    { ma: 'phan_anh_xuat_excel', ten: 'Xuất Excel phản ánh', mo_ta: 'Xuất danh sách phản ánh' },

    // 17. Nhật ký hoạt động
    { ma: 'nhat_ky_xem', ten: 'Xem nhật ký', mo_ta: 'Xem nhật ký hoạt động hệ thống' },

    // 18. Phân quyền hệ thống
    { ma: 'phan_quyen_xem', ten: 'Xem phân quyền', mo_ta: 'Xem ma trận phân quyền' },
    { ma: 'phan_quyen_sua', ten: 'Chỉnh sửa phân quyền', mo_ta: 'Thay đổi ma trận phân quyền vai trò' },
  ];

  const mapQuyenHan = new Map<string, any>();
  for (const qh of quyenHanData) {
    const perm = await prisma.quyen_han.upsert({
      where: { ma: qh.ma },
      update: { ten: qh.ten, mo_ta: qh.mo_ta },
      create: qh,
    });
    mapQuyenHan.set(qh.ma, perm);
  }
  console.log(`✓ Đã khởi tạo ${quyenHanData.length} quyền hạn chi tiết thành công`);

  // 3. Gán Quyền cho Vai trò (RBAC Default Matrix theo Yêu cầu VII)
  const allPermKeys = Array.from(mapQuyenHan.keys());

  const rbacMatrix: Record<string, string[]> = {
    // 1. QUẢN TRỊ TỐI CAO: Toàn quyền tất cả module
    SUPER_ADMIN: allPermKeys,

    // 2. QUẢN TRỊ VIÊN: Toàn quyền tất cả module quản trị
    QUAN_TRI_VIEN: allPermKeys,

    // 3. BAN GIÁM HIỆU
    BAN_GIAM_HIEU: [
      'tong_quan_xem',
      'gioi_thieu_xem', 'gioi_thieu_sua',
      'bai_viet_xem', 'bai_viet_tao', 'bai_viet_sua', 'bai_viet_duyet', 'bai_viet_xuat_ban',
      'thong_bao_xem', 'thong_bao_tao', 'thong_bao_sua', 'thong_bao_duyet', 'thong_bao_xuat_ban',
      'van_ban_xem', 'van_ban_tao', 'van_ban_sua', 'van_ban_duyet', 'van_ban_xuat_excel',
      'giao_vien_xem', 'giao_vien_sua', 'giao_vien_xuat_excel',
      'to_chuyen_mon_xem', 'to_chuyen_mon_sua',
      'lop_hoc_xem', 'lop_hoc_tao', 'lop_hoc_sua', 'lop_hoc_xuat_excel',
      'hoc_sinh_xem', 'hoc_sinh_tao', 'hoc_sinh_sua', 'hoc_sinh_xuat_excel',
      'phu_huynh_xem', 'phu_huynh_sua', 'phu_huynh_xuat_excel',
      'video_xem', 'video_duyet', 'video_xuat_ban',
      'thu_vien_anh_xem', 'thu_vien_anh_duyet', 'thu_vien_anh_xuat_ban',
      'thu_vien_so_xem', 'thu_vien_so_duyet', 'thu_vien_so_xuat_ban', 'thu_vien_so_xuat_excel',
      'hoat_dong_xem', 'hoat_dong_tao', 'hoat_dong_sua', 'hoat_dong_duyet', 'hoat_dong_xuat_ban',
      'phan_anh_xem', 'phan_anh_sua', 'phan_anh_xuat_excel',
      'nhat_ky_xem',
    ],

    // 4. GIÁO VIÊN
    GIAO_VIEN: [
      'tong_quan_xem',
      'gioi_thieu_xem',
      'bai_viet_xem', 'bai_viet_tao',
      'thong_bao_xem',
      'van_ban_xem',
      'giao_vien_xem',
      'to_chuyen_mon_xem',
      'lop_hoc_xem',
      'hoc_sinh_xem',
      'phu_huynh_xem',
      'video_xem', 'video_tao', 'video_upload',
      'thu_vien_anh_xem', 'thu_vien_anh_tao', 'thu_vien_anh_upload',
      'thu_vien_so_xem', 'thu_vien_so_tao', 'thu_vien_so_upload',
      'hoat_dong_xem', 'hoat_dong_tao',
    ],

    // 5. BIÊN TẬP VIÊN
    BIEN_TAP_VIEN: [
      'tong_quan_xem',
      'gioi_thieu_xem',
      'bai_viet_xem', 'bai_viet_tao', 'bai_viet_sua', 'bai_viet_xoa', 'bai_viet_xuat_ban',
      'thong_bao_xem', 'thong_bao_tao', 'thong_bao_sua', 'thong_bao_xoa', 'thong_bao_xuat_ban',
      'van_ban_xem', 'van_ban_tao', 'van_ban_sua', 'van_ban_xoa',
      'giao_vien_xem',
      'to_chuyen_mon_xem',
      'lop_hoc_xem',
      'hoc_sinh_xem',
      'phu_huynh_xem',
      'video_xem', 'video_tao', 'video_sua', 'video_xoa', 'video_xuat_ban', 'video_upload',
      'thu_vien_anh_xem', 'thu_vien_anh_tao', 'thu_vien_anh_sua', 'thu_vien_anh_xoa', 'thu_vien_anh_xuat_ban', 'thu_vien_anh_upload',
      'thu_vien_so_xem', 'thu_vien_so_tao', 'thu_vien_so_sua', 'thu_vien_so_xoa', 'thu_vien_so_xuat_ban', 'thu_vien_so_upload',
      'hoat_dong_xem', 'hoat_dong_tao', 'hoat_dong_sua', 'hoat_dong_xoa', 'hoat_dong_xuat_ban',
    ],

    // 6. NGƯỜI XEM: Chỉ VIEW các module được phép
    NGUOI_XEM: [
      'tong_quan_xem',
      'gioi_thieu_xem',
      'bai_viet_xem',
      'thong_bao_xem',
      'van_ban_xem',
      'giao_vien_xem',
      'to_chuyen_mon_xem',
      'lop_hoc_xem',
      'hoc_sinh_xem',
      'phu_huynh_xem',
      'video_xem',
      'thu_vien_anh_xem',
      'thu_vien_so_xem',
      'hoat_dong_xem',
    ],
  };

  for (const [roleCode, permKeys] of Object.entries(rbacMatrix)) {
    const role = mapVaiTro.get(roleCode);
    if (!role) continue;

    for (const pKey of permKeys) {
      const perm = mapQuyenHan.get(pKey);
      if (!perm) continue;

      await prisma.vai_tro_quyen_han.upsert({
        where: {
          vai_tro_id_quyen_han_id: {
            vai_tro_id: role.id,
            quyen_han_id: perm.id,
          },
        },
        update: {},
        create: {
          vai_tro_id: role.id,
          quyen_han_id: perm.id,
        },
      });
    }
  }
  console.log('✓ Đã gán ma trận quyền RBAC chính thức thành công');

  // 4. Tạo / Cập nhật Tài khoản Super Admin
  const adminEmail = process.env.QUAN_TRI_EMAIL || 'quantri@dongquang.edu.vn';
  const adminPasswordRaw = process.env.QUAN_TRI_MAT_KHAU || 'DongQuang@2026!';
  const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);

  const superAdminUser = await prisma.nguoi_dung.upsert({
    where: { email: adminEmail },
    update: {
      mat_khau: hashedPassword,
      trang_thai: true,
      da_xoa: false,
    },
    create: {
      ho_ten: 'Quản trị viên Hệ thống',
      email: adminEmail,
      mat_khau: hashedPassword,
      so_dien_thoai: '0988888888',
      trang_thai: true,
    },
  });

  const superAdminRole = mapVaiTro.get('SUPER_ADMIN');
  if (superAdminRole) {
    await prisma.nguoi_dung_vai_tro.upsert({
      where: {
        nguoi_dung_id_vai_tro_id: {
          nguoi_dung_id: superAdminUser.id,
          vai_tro_id: superAdminRole.id,
        },
      },
      update: {},
      create: {
        nguoi_dung_id: superAdminUser.id,
        vai_tro_id: superAdminRole.id,
      },
    });
  }
  console.log(`✓ Đã khởi tạo tài khoản Super Admin (${adminEmail}) thành công`);

  // 5. Khởi tạo Danh mục Bài viết mẫu
  const danhMucSample = [
    { ten: 'Bảng tin Nhà trường', slug: 'bang-tin', thu_tu: 1 },
    { ten: 'Hoạt động Đoàn - Đội', slug: 'hoat-dong-doi-doan', thu_tu: 2 },
    { ten: 'Hoạt động Chuyên môn', slug: 'hoat-dong-chuyen-mon', thu_tu: 3 },
    { ten: 'Hoạt động Câu lạc bộ', slug: 'hoat-dong-cau-lac-bo', thu_tu: 4 },
    { ten: 'Hoạt động Thư viện', slug: 'hoat-dong-thu-vien', thu_tu: 5 },
    { ten: 'Tin tức & Sự kiện', slug: 'tin-tuc-su-kien', thu_tu: 6 },
  ];

  for (const dm of danhMucSample) {
    await prisma.danh_muc.upsert({
      where: { slug: dm.slug },
      update: { ten: dm.ten, thu_tu: dm.thu_tu },
      create: dm,
    });
  }

  // 6. Khởi tạo LoaiVanBan mẫu
  const loaiVanBanSample = [
    { ten: 'Thông báo Nhà trường', ma: 'thong-bao-nha-truong' },
    { ten: 'Văn bản Phường / Xã', ma: 'van-ban-phuong-xa' },
    { ten: 'Văn bản Sở GD&ĐT', ma: 'van-ban-so-gddt' },
    { ten: 'Văn bản Bộ GD&ĐT', ma: 'van-ban-bo-gddt' },
    { ten: 'Văn bản Chỉ đạo', ma: 'van-ban-chi-dao' },
    { ten: 'Kế hoạch Giáo dục', ma: 'ke-hoach-giao-duc' },
  ];

  for (const lvb of loaiVanBanSample) {
    await prisma.loai_van_ban.upsert({
      where: { ma: lvb.ma },
      update: { ten: lvb.ten },
      create: lvb,
    });
  }

  // 7. Khởi tạo Tổ chuyên môn mẫu
  const toChuyenMonSample = [
    { ten: 'Tổ Ban Giám hiệu - Hành chính', mo_ta: 'Phụ trách công tác quản lý chỉ đạo và văn phòng trường' },
    { ten: 'Tổ Toán - Tin học', mo_ta: 'Phụ trách chuyên môn môn Toán và môn Tin học' },
    { ten: 'Tổ Ngữ văn - Lịch sử - Địa lý', mo_ta: 'Phụ trách chuyên môn các môn Xã hội' },
    { ten: 'Tổ Khoa học Tự nhiên', mo_ta: 'Phụ trách chuyên môn môn Vật lý, Hóa học, Sinh học' },
    { ten: 'Tổ Ngoại ngữ - Nghệ thuật - Thể dục', mo_ta: 'Phụ trách môn Tiếng Anh, Âm nhạc, Mỹ thuật, Thể dục' },
  ];

  for (const tcm of toChuyenMonSample) {
    const existing = await prisma.to_chuyen_mon.findFirst({
      where: { ten: tcm.ten },
    });
    if (!existing) {
      await prisma.to_chuyen_mon.create({
        data: tcm,
      });
    }
  }

  console.log('--- Hoàn tất Seed dữ liệu Cơ sở Dữ liệu THCS Đông Quang ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
