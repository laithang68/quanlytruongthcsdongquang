import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CapNhatQuyenVaiTroDto } from './dto/cap-nhat-quyen-vai-tro.dto';

// Metadata định nghĩa 18 Module Quản trị và các quyền tương ứng
export const DANH_SACH_MODULE_QUAN_TRI = [
  { ma: 'tong_quan', ten: '1. Tổng quan hệ thống', href: '/quan-tri' },
  { ma: 'gioi_thieu', ten: '2. Giới thiệu chung', href: '/quan-tri/gioi-thieu' },
  { ma: 'nguoi_dung', ten: '3. Quản lý người dùng', href: '/quan-tri/nguoi-dung' },
  { ma: 'bai_viet', ten: '4. Quản lý bài viết', href: '/quan-tri/bai-viet' },
  { ma: 'thong_bao', ten: '5. Quản lý thông báo', href: '/quan-tri/thong-bao' },
  { ma: 'van_ban', ten: '6. Quản lý văn bản', href: '/quan-tri/van-ban' },
  { ma: 'giao_vien', ten: '7. Quản lý giáo viên', href: '/quan-tri/giao-vien' },
  { ma: 'to_chuyen_mon', ten: '8. Quản lý tổ chuyên môn', href: '/quan-tri/to-chuyen-mon' },
  { ma: 'lop_hoc', ten: '9. Quản lý lớp học', href: '/quan-tri/lop-hoc' },
  { ma: 'hoc_sinh', ten: '10. Quản lý học sinh', href: '/quan-tri/hoc-sinh' },
  { ma: 'phu_huynh', ten: '11. Quản lý phụ huynh', href: '/quan-tri/phu-huynh' },
  { ma: 'video', ten: '12. Quản lý video', href: '/quan-tri/video' },
  { ma: 'thu_vien_anh', ten: '13. Quản lý thư viện ảnh', href: '/quan-tri/thu-vien-anh' },
  { ma: 'thu_vien_so', ten: '14. Quản lý thư viện số', href: '/quan-tri/thu-vien-so' },
  { ma: 'hoat_dong', ten: '15. Quản lý hoạt động & sự kiện', href: '/quan-tri/hoat-dong' },
  { ma: 'phan_anh', ten: '16. Thông tin Phản ánh', href: '/quan-tri/phan-anh' },
  { ma: 'nhat_ky', ten: '17. Nhật ký hoạt động', href: '/quan-tri?view=nhat-ky' },
  { ma: 'phan_quyen', ten: '18. Phân quyền hệ thống', href: '/quan-tri/phan-quyen' },
];

@Injectable()
export class PhanQuyenService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Lấy ma trận quyền đầy đủ (Roles, Modules, Permissions, Active Mappings)
  async layMaTranQuyen() {
    const [danhSachVaiTro, danhSachQuyenHan, vaiTroQuyenHan] = await Promise.all([
      this.prisma.vai_tro.findMany({
        orderBy: { ngay_tao: 'asc' },
      }),
      this.prisma.quyen_han.findMany({
        orderBy: { ma: 'asc' },
      }),
      this.prisma.vai_tro_quyen_han.findMany({
        include: {
          vai_tro: { select: { id: true, ma: true } },
          quyen_han: { select: { id: true, ma: true } },
        },
      }),
    ]);

    // Format ma trận mapping: roleCode -> array of permCodes
    const maTran: Record<string, string[]> = {};
    for (const vt of danhSachVaiTro) {
      maTran[vt.ma] = [];
    }

    for (const vtqh of vaiTroQuyenHan) {
      if (vtqh.vai_tro && vtqh.quyen_han) {
        if (!maTran[vtqh.vai_tro.ma]) {
          maTran[vtqh.vai_tro.ma] = [];
        }
        maTran[vtqh.vai_tro.ma].push(vtqh.quyen_han.ma);
      }
    }

    return {
      thanh_cong: true,
      du_lieu: {
        vai_tro: danhSachVaiTro,
        modules: DANH_SACH_MODULE_QUAN_TRI,
        quyen_han: danhSachQuyenHan,
        ma_tran: maTran,
      },
    };
  }

  // 2. Lấy chi tiết quyền hạn của 1 vai trò
  async layChiTietQuyenVaiTro(idOrCode: string) {
    const role = await this.prisma.vai_tro.findFirst({
      where: {
        OR: [{ id: idOrCode }, { ma: idOrCode }],
      },
      include: {
        vai_tro_quyen_han: {
          include: {
            quyen_han: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò yêu cầu.');
    }

    const quyenHanCodes = role.vai_tro_quyen_han.map((item) => item.quyen_han.ma);

    return {
      thanh_cong: true,
      du_lieu: {
        vai_tro: {
          id: role.id,
          ma: role.ma,
          ten: role.ten,
          mo_ta: role.mo_ta,
        },
        quyen_han: quyenHanCodes,
      },
    };
  }

  // 3. Cập nhật ma trận quyền hạn cho 1 vai trò
  async capNhatQuyenVaiTro(
    adminUser: any,
    idOrCode: string,
    dto: CapNhatQuyenVaiTroDto,
    ip?: string,
    userAgent?: string,
  ) {
    const role = await this.prisma.vai_tro.findFirst({
      where: {
        OR: [{ id: idOrCode }, { ma: idOrCode }],
      },
    });

    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò yêu cầu.');
    }

    // Bảo vệ Quản trị tối cao (SUPER_ADMIN)
    if (role.ma === 'SUPER_ADMIN') {
      const isSuperAdmin = adminUser.vai_tro?.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        throw new ForbiddenException('Chỉ tài khoản Quản trị tối cao mới có quyền thay đổi quyền hạn của vai trò này.');
      }
    }

    // Lấy danh sách quyền hiện tại để ghi log
    const currentMappings = await this.prisma.vai_tro_quyen_han.findMany({
      where: { vai_tro_id: role.id },
      include: { quyen_han: true },
    });
    const currentPermCodes = currentMappings.map((m) => m.quyen_han.ma);

    // Xác định danh sách quyền mới (theo IDs hoặc theo Mã)
    let newPerms: { id: string; ma: string }[] = [];

    if (dto.quyen_han_ids && dto.quyen_han_ids.length > 0) {
      newPerms = await this.prisma.quyen_han.findMany({
        where: { id: { in: dto.quyen_han_ids } },
        select: { id: true, ma: true },
      });
    } else if (dto.quyen_han_mas) {
      newPerms = await this.prisma.quyen_han.findMany({
        where: { ma: { in: dto.quyen_han_mas } },
        select: { id: true, ma: true },
      });
    }

    const newPermCodes = newPerms.map((p) => p.ma);

    // Thực hiện cập nhật trong Transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Xóa các mapping cũ của vai trò
      await tx.vai_tro_quyen_han.deleteMany({
        where: { vai_tro_id: role.id },
      });

      // 2. Thêm các mapping mới
      if (newPerms.length > 0) {
        await tx.vai_tro_quyen_han.createMany({
          data: newPerms.map((perm) => ({
            vai_tro_id: role.id,
            quyen_han_id: perm.id,
          })),
        });
      }
    });

    // Ghi nhật ký hoạt động hệ thống
    await this.ghiNhatKy(
      adminUser.id,
      'CAP_NHAT_MA_TRAN_QUYEN',
      role.id,
      JSON.stringify({ vai_tro: role.ma, quyen_han: currentPermCodes }),
      JSON.stringify({ vai_tro: role.ma, quyen_han: newPermCodes }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: `Cập nhật ma trận quyền cho vai trò "${role.ten}" thành công.`,
      du_lieu: {
        vai_tro_ma: role.ma,
        quyen_han: newPermCodes,
      },
    };
  }

  private async ghiNhatKy(
    nguoiDungId: string,
    hanhDong: string,
    doiTuongId: string,
    noiDungCu: string | null,
    noiDungMoi: string | null,
    ip?: string,
    userAgent?: string,
  ) {
    try {
      await this.prisma.nhat_ky_he_thong.create({
        data: {
          nguoi_dung_id: nguoiDungId,
          hanh_dong: hanhDong,
          doi_tuong: 'vai_tro_quyen_han',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống:', e);
    }
  }
}
