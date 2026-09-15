const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('=====================================================');
  console.log('KHỞI TẠO DỮ LIỆU BAN ĐẦU CHO PRODUCTION (THCS ĐÔNG QUANG)');
  console.log('=====================================================');

  // 1. Khởi tạo 6 Vai trò hệ thống chuẩn RBAC (An toàn với upsert)
  const vaiTroData = [
    { ma: 'SUPER_ADMIN', ten: 'Quản trị tối cao', mo_ta: 'Toàn quyền quản trị hệ thống' },
    { ma: 'QUAN_TRI_VIEN', ten: 'Quản trị viên', mo_ta: 'Quản trị nội dung và người dùng' },
    { ma: 'BAN_GIAM_HIEU', ten: 'Ban giám hiệu', mo_ta: 'Duyệt và xuất bản nội dung, quản lý chuyên môn' },
    { ma: 'GIAO_VIEN', ten: 'Giáo viên', mo_ta: 'Quản lý thông báo và thông tin chuyên môn' },
    { ma: 'BIEN_TAP_VIEN', ten: 'Biên tập viên', mo_ta: 'Soạn thảo và quản lý bài viết, truyền thông' },
    { ma: 'NGUOI_XEM', ten: 'Người xem', mo_ta: 'Quyền xem nội dung nội bộ' },
  ];

  const mapVaiTro = new Map();
  for (const vt of vaiTroData) {
    const role = await prisma.vai_tro.upsert({
      where: { ma: vt.ma },
      update: { ten: vt.ten, mo_ta: vt.mo_ta },
      create: vt,
    });
    mapVaiTro.set(vt.ma, role);
  }
  console.log('✓ 1. Đã đảm bảo 6 vai trò hệ thống (RBAC) tồn tại');

  // 2. Khởi tạo 57 Quyền hạn chi tiết cho các Module Quản trị
  const quyenHanData = [
    { ma: 'tong_quan_xem', ten: 'Xem tổng quan', mo_ta: 'Xem bảng điều khiển thống kê hệ thống' },
    { ma: 'gioi_thieu_xem', ten: 'Xem giới thiệu', mo_ta: 'Xem nội dung giới thiệu' },
    { ma: 'gioi_thieu_tao', ten: 'Tạo giới thiệu', mo_ta: 'Tạo bản ghi giới thiệu mới' },
    { ma: 'gioi_thieu_sua', ten: 'Sửa giới thiệu', mo_ta: 'Chỉnh sửa nội dung giới thiệu' },
    { ma: 'gioi_thieu_xoa', ten: 'Xóa giới thiệu', mo_ta: 'Xóa bản ghi giới thiệu' },
    { ma: 'nguoi_dung_xem', ten: 'Xem người dùng', mo_ta: 'Xem danh sách và chi tiết người dùng' },
    { ma: 'nguoi_dung_tao', ten: 'Tạo người dùng', mo_ta: 'Tạo tài khoản người dùng mới' },
    { ma: 'nguoi_dung_sua', ten: 'Sửa người dùng', mo_ta: 'Chỉnh sửa thông tin người dùng' },
    { ma: 'nguoi_dung_khoa', ten: 'Khóa người dùng', mo_ta: 'Khóa và mở khóa tài khoản người dùng' },
    { ma: 'nguoi_dung_xoa', ten: 'Xóa người dùng', mo_ta: 'Xóa mềm người dùng' },
    { ma: 'nguoi_dung_dat_lai_mat_khau', ten: 'Đặt lại mật khẩu', mo_ta: 'Đặt lại mật khẩu tài khoản người dùng' },
    { ma: 'nguoi_dung_gan_vai_tro', ten: 'Gán vai trò', mo_ta: 'Gán và bỏ vai trò người dùng' },
    { ma: 'bai_viet_xem', ten: 'Xem bài viết', mo_ta: 'Xem danh sách và chi tiết bài viết' },
    { ma: 'bai_viet_tao', ten: 'Tạo bài viết', mo_ta: 'Tạo bài viết mới' },
    { ma: 'bai_viet_sua', ten: 'Sửa bài viết', mo_ta: 'Chỉnh sửa bài viết' },
    { ma: 'bai_viet_xoa', ten: 'Xóa bài viết', mo_ta: 'Xóa bài viết' },
    { ma: 'bai_viet_duyet', ten: 'Duyệt bài viết', mo_ta: 'Phê duyệt bài viết' },
    { ma: 'bai_viet_xuat_ban', ten: 'Xuất bản bài viết', mo_ta: 'Xuất bản bài viết lên cổng thông tin' },
    { ma: 'thong_bao_xem', ten: 'Xem thông báo', mo_ta: 'Xem danh sách thông báo' },
    { ma: 'thong_bao_tao', ten: 'Tạo thông báo', mo_ta: 'Tạo thông báo mới' },
    { ma: 'thong_bao_sua', ten: 'Sửa thông báo', mo_ta: 'Sửa thông báo' },
    { ma: 'thong_bao_xoa', ten: 'Xóa thông báo', mo_ta: 'Xóa thông báo' },
    { ma: 'thong_bao_duyet', ten: 'Duyệt thông báo', mo_ta: 'Duyệt thông báo' },
    { ma: 'thong_bao_xuat_ban', ten: 'Xuất bản thông báo', mo_ta: 'Xuất bản thông báo' },
    { ma: 'van_ban_xem', ten: 'Xem văn bản', mo_ta: 'Xem danh mục văn bản' },
    { ma: 'van_ban_tao', ten: 'Tạo văn bản', mo_ta: 'Tải lên văn bản mới' },
    { ma: 'van_ban_sua', ten: 'Sửa văn bản', mo_ta: 'Sửa thông tin văn bản' },
    { ma: 'van_ban_xoa', ten: 'Xóa văn bản', mo_ta: 'Xóa văn bản' },
    { ma: 'van_ban_duyet', ten: 'Duyệt văn bản', mo_ta: 'Duyệt văn bản' },
    { ma: 'van_ban_xuat_excel', ten: 'Xuất Excel văn bản', mo_ta: 'Xuất biểu mẫu Excel văn bản' },
    { ma: 'giao_vien_xem', ten: 'Xem giáo viên', mo_ta: 'Xem danh sách giáo viên' },
    { ma: 'giao_vien_tao', ten: 'Tạo giáo viên', mo_ta: 'Thêm giáo viên mới' },
    { ma: 'giao_vien_sua', ten: 'Sửa giáo viên', mo_ta: 'Cập nhật hồ sơ giáo viên' },
    { ma: 'giao_vien_xoa', ten: 'Xóa giáo viên', mo_ta: 'Xóa hồ sơ giáo viên' },
    { ma: 'giao_vien_xuat_excel', ten: 'Xuất Excel giáo viên', mo_ta: 'Xuất hồ sơ giáo viên' },
    { ma: 'to_chuyen_mon_xem', ten: 'Xem tổ chuyên môn', mo_ta: 'Xem danh sách tổ chuyên môn' },
    { ma: 'to_chuyen_mon_tao', ten: 'Tạo tổ chuyên môn', mo_ta: 'Thêm tổ chuyên môn mới' },
    { ma: 'to_chuyen_mon_sua', ten: 'Sửa tổ chuyên môn', mo_ta: 'Sửa thông tin tổ chuyên môn' },
    { ma: 'to_chuyen_mon_xoa', ten: 'Xóa tổ chuyên môn', mo_ta: 'Xóa tổ chuyên môn' },
    { ma: 'lop_hoc_xem', ten: 'Xem lớp học', mo_ta: 'Xem danh sách lớp học' },
    { ma: 'lop_hoc_tao', ten: 'Tạo lớp học', mo_ta: 'Tạo lớp học mới' },
    { ma: 'lop_hoc_sua', ten: 'Sửa lớp học', mo_ta: 'Chỉnh sửa lớp học và gán GVCN' },
    { ma: 'lop_hoc_xoa', ten: 'Xóa lớp học', mo_ta: 'Xóa lớp học' },
    { ma: 'lop_hoc_xuat_excel', ten: 'Xuất Excel lớp học', mo_ta: 'Xuất danh sách lớp học' },
    { ma: 'hoc_sinh_xem', ten: 'Xem học sinh', mo_ta: 'Xem hồ sơ học sinh' },
    { ma: 'hoc_sinh_tao', ten: 'Tạo học sinh', mo_ta: 'Tạo hồ sơ học sinh mới' },
    { ma: 'hoc_sinh_sua', ten: 'Sửa học sinh', mo_ta: 'Sửa thông tin học sinh và chuyển lớp' },
    { ma: 'hoc_sinh_xoa', ten: 'Xóa học sinh', mo_ta: 'Xóa mềm hồ sơ học sinh' },
    { ma: 'hoc_sinh_xuat_excel', ten: 'Xuất Excel học sinh', mo_ta: 'Xuất danh sách học sinh' },
    { ma: 'phu_huynh_xem', ten: 'Xem phụ huynh', mo_ta: 'Xem danh sách phụ huynh' },
    { ma: 'phu_huynh_tao', ten: 'Tạo phụ huynh', mo_ta: 'Thêm phụ huynh mới' },
    { ma: 'phu_huynh_sua', ten: 'Sửa phụ huynh', mo_ta: 'Sửa thông tin phụ huynh' },
    { ma: 'phu_huynh_xoa', ten: 'Xóa phụ huynh', mo_ta: 'Xóa mềm thông tin phụ huynh' },
    { ma: 'phu_huynh_xuat_excel', ten: 'Xuất Excel phụ huynh', mo_ta: 'Xuất danh sách phụ huynh' },
    { ma: 'video_xem', ten: 'Xem video', mo_ta: 'Xem danh sách và chi tiết video' },
    { ma: 'video_tao', ten: 'Tạo video', mo_ta: 'Thêm video mới' },
    { ma: 'video_sua', ten: 'Sửa video', mo_ta: 'Chỉnh sửa video và đổi trạng thái' },
    { ma: 'video_xoa', ten: 'Xóa video', mo_ta: 'Xóa video' },
    { ma: 'video_duyet', ten: 'Duyệt video', mo_ta: 'Duyệt video' },
    { ma: 'video_xuat_ban', ten: 'Xuất bản video', mo_ta: 'Xuất bản video' },
    { ma: 'video_upload', ten: 'Upload video', mo_ta: 'Tải tệp video lên' },
    { ma: 'thu_vien_anh_xem', ten: 'Xem thư viện ảnh', mo_ta: 'Xem danh sách album ảnh' },
    { ma: 'thu_vien_anh_tao', ten: 'Tạo album ảnh', mo_ta: 'Tạo album ảnh mới' },
    { ma: 'thu_vien_anh_sua', ten: 'Sửa album ảnh', mo_ta: 'Sửa thông tin album và quản lý tệp' },
    { ma: 'thu_vien_anh_xoa', ten: 'Xóa album ảnh', mo_ta: 'Xóa album ảnh' },
    { ma: 'thu_vien_anh_duyet', ten: 'Duyệt album ảnh', mo_ta: 'Duyệt album ảnh' },
    { ma: 'thu_vien_anh_xuat_ban', ten: 'Xuất bản album ảnh', mo_ta: 'Xuất bản album ảnh' },
    { ma: 'thu_vien_anh_upload', ten: 'Upload ảnh', mo_ta: 'Tải tệp ảnh lên thư viện' },
    { ma: 'thu_vien_so_xem', ten: 'Xem thư viện số', mo_ta: 'Xem tài liệu điện tử' },
    { ma: 'thu_vien_so_tao', ten: 'Tạo tài liệu số', mo_ta: 'Tải lên tài liệu số mới' },
    { ma: 'thu_vien_so_sua', ten: 'Sửa tài liệu số', mo_ta: 'Sửa thông tin tài liệu số' },
    { ma: 'thu_vien_so_xoa', ten: 'Xóa tài liệu số', mo_ta: 'Xóa tài liệu số' },
    { ma: 'thu_vien_so_duyet', ten: 'Duyệt tài liệu số', mo_ta: 'Duyệt tài liệu số' },
    { ma: 'thu_vien_so_xuat_ban', ten: 'Xuất bản tài liệu số', mo_ta: 'Xuất bản tài liệu số' },
    { ma: 'thu_vien_so_upload', ten: 'Upload tài liệu số', mo_ta: 'Tải tệp tài liệu số' },
    { ma: 'thu_vien_so_xuat_excel', ten: 'Xuất Excel thư viện số', mo_ta: 'Xuất danh sách thư viện số' },
    { ma: 'hoat_dong_xem', ten: 'Xem hoạt động', mo_ta: 'Xem sự kiện hoạt động' },
    { ma: 'hoat_dong_tao', ten: 'Tạo hoạt động', mo_ta: 'Tạo hoạt động mới' },
    { ma: 'hoat_dong_sua', ten: 'Sửa hoạt động', mo_ta: 'Sửa hoạt động' },
    { ma: 'hoat_dong_xoa', ten: 'Xóa hoạt động', mo_ta: 'Xóa hoạt động' },
    { ma: 'hoat_dong_duyet', ten: 'Duyệt hoạt động', mo_ta: 'Duyệt hoạt động' },
    { ma: 'hoat_dong_xuat_ban', ten: 'Xuất bản hoạt động', mo_ta: 'Xuất bản hoạt động' },
    { ma: 'phan_anh_xem', ten: 'Xem phản ánh', mo_ta: 'Xem danh sách phản ánh' },
    { ma: 'phan_anh_sua', ten: 'Xử lý phản ánh', mo_ta: 'Cập nhật trạng thái phản ánh' },
    { ma: 'phan_anh_xoa', ten: 'Xóa phản ánh', mo_ta: 'Xóa phản ánh' },
    { ma: 'phan_anh_xuat_excel', ten: 'Xuất Excel phản ánh', mo_ta: 'Xuất danh sách phản ánh' },
    { ma: 'nhat_ky_xem', ten: 'Xem nhật ký', mo_ta: 'Xem nhật ký hoạt động hệ thống' },
    { ma: 'phan_quyen_xem', ten: 'Xem phân quyền', mo_ta: 'Xem ma trận phân quyền' },
    { ma: 'phan_quyen_sua', ten: 'Chỉnh sửa phân quyền', mo_ta: 'Thay đổi ma trận phân quyền vai trò' },
  ];

  const mapQuyenHan = new Map();
  for (const qh of quyenHanData) {
    const perm = await prisma.quyen_han.upsert({
      where: { ma: qh.ma },
      update: { ten: qh.ten, mo_ta: qh.mo_ta },
      create: qh,
    });
    mapQuyenHan.set(qh.ma, perm);
  }
  console.log(`✓ 2. Đã đảm bảo ${quyenHanData.length} quyền hạn chi tiết tồn tại`);

  // 3. Gán Quyền cho Vai trò (RBAC Matrix)
  const allPermKeys = Array.from(mapQuyenHan.keys());
  const rbacMatrix = {
    SUPER_ADMIN: allPermKeys,
    QUAN_TRI_VIEN: allPermKeys,
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
  console.log('✓ 3. Đã đồng bộ ma trận phân quyền vai trò');

  // 4. Khởi tạo / Bảo đảm Tài khoản Quản trị viên (Super Admin)
  const adminEmail = (process.env.QUAN_TRI_EMAIL || 'thangbe6868@gmail.com').trim().toLowerCase();
  const adminUsername = (process.env.QUAN_TRI_USERNAME || 'admin').trim();
  const explicitPassword = process.env.QUAN_TRI_MAT_KHAU ? process.env.QUAN_TRI_MAT_KHAU.trim() : '';

  const existingAdmin = await prisma.nguoi_dung.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { ten_dang_nhap: adminUsername },
      ],
    },
    include: {
      nguoi_dung_vai_tro: true,
    },
  });

  const superAdminRole = mapVaiTro.get('SUPER_ADMIN');
  const quanTriVienRole = mapVaiTro.get('QUAN_TRI_VIEN');

  if (existingAdmin) {
    console.log(`ℹ Tài khoản admin (${existingAdmin.email}) đã tồn tại trong database.`);
    
    await prisma.nguoi_dung.update({
      where: { id: existingAdmin.id },
      data: {
        email: adminEmail,
        trang_thai: true,
        da_xoa: false,
        ten_dang_nhap: adminUsername,
      },
    });

    if (superAdminRole) {
      await prisma.nguoi_dung_vai_tro.upsert({
        where: {
          nguoi_dung_id_vai_tro_id: {
            nguoi_dung_id: existingAdmin.id,
            vai_tro_id: superAdminRole.id,
          },
        },
        update: {},
        create: {
          nguoi_dung_id: existingAdmin.id,
          vai_tro_id: superAdminRole.id,
        },
      });
    }

    if (quanTriVienRole) {
      await prisma.nguoi_dung_vai_tro.upsert({
        where: {
          nguoi_dung_id_vai_tro_id: {
            nguoi_dung_id: existingAdmin.id,
            vai_tro_id: quanTriVienRole.id,
          },
        },
        update: {},
        create: {
          nguoi_dung_id: existingAdmin.id,
          vai_tro_id: quanTriVienRole.id,
        },
      });
    }

    if (process.env.RESET_ADMIN_PASSWORD === 'true' && explicitPassword) {
      const hashedPassword = await bcrypt.hash(explicitPassword, 10);
      await prisma.nguoi_dung.update({
        where: { id: existingAdmin.id },
        data: { mat_khau: hashedPassword },
      });
      console.log('✓ [RESET] Đã cập nhật mật khẩu mới cho admin từ biến môi trường QUAN_TRI_MAT_KHAU');
    } else {
      console.log('✓ Giữ nguyên mật khẩu hiện tại của admin (an toàn cho dữ liệu production).');
    }
  } else {
    let initialPassword = explicitPassword;
    let isGenerated = false;

    if (!initialPassword) {
      initialPassword = crypto.randomBytes(12).toString('base64url');
      isGenerated = true;
    }

    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    const newAdmin = await prisma.nguoi_dung.create({
      data: {
        ho_ten: 'Quản trị viên Hệ thống',
        email: adminEmail,
        ten_dang_nhap: adminUsername,
        mat_khau: hashedPassword,
        trang_thai: true,
        da_xoa: false,
        yeu_cau_doi_mat_khau: isGenerated,
      },
    });

    if (superAdminRole) {
      await prisma.nguoi_dung_vai_tro.create({
        data: {
          nguoi_dung_id: newAdmin.id,
          vai_tro_id: superAdminRole.id,
        },
      });
    }

    if (quanTriVienRole) {
      await prisma.nguoi_dung_vai_tro.create({
        data: {
          nguoi_dung_id: newAdmin.id,
          vai_tro_id: quanTriVienRole.id,
        },
      });
    }

    console.log('-----------------------------------------------------');
    console.log('✓ ĐÃ TẠO MỚI TÀI KHOẢN ADMIN PRODUCTION THÀNH CÔNG:');
    console.log(`  - Email đăng nhập:    ${adminEmail}`);
    console.log(`  - Tên đăng nhập:      ${adminUsername}`);
    if (isGenerated) {
      console.log(`  - Mật khẩu tạo ngẫu nhiên: ${initialPassword}`);
      console.log('  (!) QUAN TRỌNG: Hãy lưu lại mật khẩu này và đổi ngay sau lần đăng nhập đầu tiên!');
    } else {
      console.log('  - Mật khẩu:           (Đã thiết lập theo biến môi trường QUAN_TRI_MAT_KHAU)');
    }
    console.log('-----------------------------------------------------');
  }

  // 5. Bảo đảm các danh mục chuẩn tồn tại
  const chucVuSample = [
    { ma: 'HIEU_TRUONG', ten: 'Hiệu trưởng', mo_ta: 'Ban Giám hiệu - Quản lý chung', thu_tu: 1 },
    { ma: 'HIEU_PHO', ten: 'Hiệu phó', mo_ta: 'Ban Giám hiệu - Phó hiệu trưởng', thu_tu: 2 },
    { ma: 'GIAO_VIEN', ten: 'Giáo viên', mo_ta: 'Giáo viên bộ môn / Giáo viên chủ nhiệm', thu_tu: 3 },
    { ma: 'GIAO_VU', ten: 'Giáo vụ', mo_ta: 'Cán bộ giáo vụ', thu_tu: 4 },
    { ma: 'KE_TOAN', ten: 'Kế toán', mo_ta: 'Cán bộ kế toán - tài chính', thu_tu: 5 },
    { ma: 'NHAN_VIEN', ten: 'Nhân viên', mo_ta: 'Nhân viên hành chính / phục vụ', thu_tu: 6 },
  ];
  for (const cv of chucVuSample) {
    await prisma.danh_muc_chuc_vu.upsert({
      where: { ma: cv.ma },
      update: { ten: cv.ten },
      create: cv,
    });
  }

  const boMonSample = [
    { ma: 'TOAN', ten: 'Toán', mo_ta: 'Bộ môn Toán học', thu_tu: 1 },
    { ma: 'NGU_VAN', ten: 'Ngữ văn', mo_ta: 'Bộ môn Ngữ văn', thu_tu: 2 },
    { ma: 'TIENG_ANH', ten: 'Tiếng Anh', mo_ta: 'Bộ môn Ngoại ngữ (Tiếng Anh)', thu_tu: 3 },
    { ma: 'VAT_LY', ten: 'Vật lý', mo_ta: 'Bộ môn Vật lý', thu_tu: 4 },
    { ma: 'HOA_HOC', ten: 'Hóa học', mo_ta: 'Bộ môn Hóa học', thu_tu: 5 },
    { ma: 'SINH_HOC', ten: 'Sinh học', mo_ta: 'Bộ môn Sinh học', thu_tu: 6 },
    { ma: 'LICH_SU', ten: 'Lịch sử', mo_ta: 'Bộ môn Lịch sử', thu_tu: 7 },
    { ma: 'DIA_LY', ten: 'Địa lý', mo_ta: 'Bộ môn Địa lý', thu_tu: 8 },
    { ma: 'GDCD', ten: 'GDCD', mo_ta: 'Bộ môn Giáo dục công dân', thu_tu: 9 },
    { ma: 'TIN_HOC', ten: 'Tin học', mo_ta: 'Bộ môn Tin học', thu_tu: 10 },
    { ma: 'CONG_NGHE', ten: 'Công nghệ', mo_ta: 'Bộ môn Công nghệ', thu_tu: 11 },
    { ma: 'AM_NHAC', ten: 'Âm nhạc', mo_ta: 'Bộ môn Âm nhạc', thu_tu: 12 },
    { ma: 'MY_THUAT', ten: 'Mỹ thuật', mo_ta: 'Bộ môn Mỹ thuật', thu_tu: 13 },
    { ma: 'THE_DUC', ten: 'Thể dục', mo_ta: 'Bộ môn Giáo dục thể chất', thu_tu: 14 },
  ];
  for (const bm of boMonSample) {
    await prisma.danh_muc_bo_mon.upsert({
      where: { ma: bm.ma },
      update: { ten: bm.ten },
      create: bm,
    });
  }

  console.log('=====================================================');
  console.log('✓ HOÀN TẤT KHỞI TẠO DỮ LIỆU PRODUCTION THÀNH CÔNG');
  console.log('=====================================================');
}

main()
  .catch((e) => {
    console.error('Lỗi khi khởi tạo dữ liệu production:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
