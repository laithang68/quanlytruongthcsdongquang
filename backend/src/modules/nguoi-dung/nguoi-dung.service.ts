import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { XacThucPhienService } from '../xac-thuc/xac-thuc-phien.service';
import { LayDanhSachNguoiDungDto } from './dto/lay-danh-sach-nguoi-dung.dto';
import { TaoNguoiDungDto } from './dto/tao-nguoi-dung.dto';
import { SuaNguoiDungDto } from './dto/sua-nguoi-dung.dto';
import { DatLaiMatKhauDto } from './dto/dat-lai-mat-khau.dto';
import { GanVaiTroDto } from './dto/gan-vai-tro.dto';

@Injectable()
export class NguoiDungService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phienService: XacThucPhienService,
  ) {}

  async layDanhSach(dto: LayDanhSachNguoiDungDto) {
    const page = Math.max(1, parseInt(dto.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(dto.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Tìm kiếm từ khóa (Họ tên, Email, Số điện thoại)
    if (dto.tu_khoa && dto.tu_khoa.trim()) {
      const keyword = dto.tu_khoa.trim();
      where.OR = [
        { ho_ten: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { so_dien_thoai: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // Lọc theo trạng thái
    if (dto.trang_thai !== undefined && dto.trang_thai !== '') {
      if (dto.trang_thai === 'da_xoa') {
        where.da_xoa = true;
      } else {
        where.da_xoa = false;
        where.trang_thai = dto.trang_thai === 'true';
      }
    } else {
      where.da_xoa = false; // Mặc định không hiển thị tài khoản đã xóa mềm
    }

    // Lọc theo vai trò
    if (dto.vai_tro && dto.vai_tro.trim()) {
      where.nguoi_dung_vai_tro = {
        some: {
          vai_tro: {
            ma: dto.vai_tro.trim(),
          },
        },
      };
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.nguoi_dung.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_tao: 'desc' },
        select: {
          id: true,
          ho_ten: true,
          email: true,
          so_dien_thoai: true,
          anh_dai_dien: true,
          trang_thai: true,
          lan_dang_nhap_cuoi: true,
          da_xoa: true,
          ngay_xoa: true,
          ngay_tao: true,
          ngay_cap_nhat: true,
          nguoi_dung_vai_tro: {
            select: {
              vai_tro: {
                select: {
                  id: true,
                  ma: true,
                  ten: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.nguoi_dung.count({ where }),
    ]);

    const duLieuFormat = danhSach.map((u) => ({
      id: u.id,
      ho_ten: u.ho_ten,
      email: u.email,
      so_dien_thoai: u.so_dien_thoai,
      anh_dai_dien: u.anh_dai_dien,
      trang_thai: u.trang_thai,
      lan_dang_nhap_cuoi: u.lan_dang_nhap_cuoi,
      da_xoa: u.da_xoa,
      ngay_xoa: u.ngay_xoa,
      ngay_tao: u.ngay_tao,
      ngay_cap_nhat: u.ngay_cap_nhat,
      vai_tro: u.nguoi_dung_vai_tro.map((r) => r.vai_tro),
    }));

    return {
      thanh_cong: true,
      du_lieu: duLieuFormat,
      tong_so: tongSo,
      trang: page,
      limit,
      tong_so_trang: Math.ceil(tongSo / limit),
    };
  }

  async layChiTiet(id: string) {
    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id },
      select: {
        id: true,
        ho_ten: true,
        email: true,
        so_dien_thoai: true,
        anh_dai_dien: true,
        trang_thai: true,
        lan_dang_nhap_cuoi: true,
        da_xoa: true,
        ngay_xoa: true,
        ngay_tao: true,
        ngay_cap_nhat: true,
        nguoi_dung_vai_tro: {
          select: {
            vai_tro: {
              select: {
                id: true,
                ma: true,
                ten: true,
                mo_ta: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng phù hợp.');
    }

    return {
      thanh_cong: true,
      du_lieu: {
        ...user,
        vai_tro: user.nguoi_dung_vai_tro.map((r) => r.vai_tro),
      },
    };
  }

  async taoNguoiDung(dto: TaoNguoiDungDto, adminUser: any, ip?: string, userAgent?: string) {
    if (!dto.ho_ten || !dto.ho_ten.trim()) {
      throw new BadRequestException('Họ tên người dùng không được để trống.');
    }
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException('Email không được để trống.');
    }
    if (!dto.mat_khau || dto.mat_khau.length < 6) {
      throw new BadRequestException('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
    }

    const emailClean = dto.email.trim().toLowerCase();
    const existing = await this.prisma.nguoi_dung.findUnique({
      where: { email: emailClean },
    });

    if (existing) {
      throw new BadRequestException('Địa chỉ email này đã được sử dụng trong hệ thống.');
    }

    const hashedPassword = await bcrypt.hash(dto.mat_khau, 10);

    const newUser = await this.prisma.nguoi_dung.create({
      data: {
        ho_ten: dto.ho_ten.trim(),
        email: emailClean,
        so_dien_thoai: dto.so_dien_thoai ? dto.so_dien_thoai.trim() : null,
        mat_khau: hashedPassword,
        trang_thai: true,
      },
    });

    // Gán vai trò ban đầu nếu có
    if (dto.vai_tro && dto.vai_tro.length > 0) {
      const roles = await this.prisma.vai_tro.findMany({
        where: { ma: { in: dto.vai_tro } },
      });
      for (const r of roles) {
        await this.prisma.nguoi_dung_vai_tro.create({
          data: {
            nguoi_dung_id: newUser.id,
            vai_tro_id: r.id,
          },
        });
      }
    } else {
      // Mặc định gán NGUOI_XEM nếu không chỉ định
      const defaultRole = await this.prisma.vai_tro.findUnique({ where: { ma: 'NGUOI_XEM' } });
      if (defaultRole) {
        await this.prisma.nguoi_dung_vai_tro.create({
          data: {
            nguoi_dung_id: newUser.id,
            vai_tro_id: defaultRole.id,
          },
        });
      }
    }

    // Ghi nhật ký hệ thống
    await this.ghiNhatKy(
      adminUser.id,
      'TAO_NGUOI_DUNG',
      newUser.id,
      null,
      JSON.stringify({ ho_ten: newUser.ho_ten, email: newUser.email, vai_tro: dto.vai_tro }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo tài khoản người dùng mới thành công.',
      du_lieu: {
        id: newUser.id,
        ho_ten: newUser.ho_ten,
        email: newUser.email,
        so_dien_thoai: newUser.so_dien_thoai,
        trang_thai: newUser.trang_thai,
        ngay_tao: newUser.ngay_tao,
      },
    };
  }

  async suaNguoiDung(id: string, dto: SuaNguoiDungDto, adminUser: any, ip?: string, userAgent?: string) {
    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id },
      include: {
        nguoi_dung_vai_tro: {
          include: { vai_tro: true },
        },
      },
    });
    if (!user || user.da_xoa) {
      throw new NotFoundException('Không tìm thấy người dùng phù hợp.');
    }

    // Bảo vệ SUPER_ADMIN: Chỉ SUPER_ADMIN mới được sửa tài khoản SUPER_ADMIN khác
    this.checkProtectionSuperAdmin(user, adminUser);

    const dataUpdate: any = {};
    if (dto.ho_ten && dto.ho_ten.trim()) {
      dataUpdate.ho_ten = dto.ho_ten.trim();
    }
    if (dto.so_dien_thoai !== undefined) {
      dataUpdate.so_dien_thoai = dto.so_dien_thoai ? dto.so_dien_thoai.trim() : null;
    }
    if (dto.email && dto.email.trim() && dto.email.trim().toLowerCase() !== user.email) {
      const emailClean = dto.email.trim().toLowerCase();
      const existing = await this.prisma.nguoi_dung.findUnique({ where: { email: emailClean } });
      if (existing) {
        throw new BadRequestException('Địa chỉ email mới đã tồn tại trên hệ thống.');
      }
      dataUpdate.email = emailClean;
    }

    const updatedUser = await this.prisma.nguoi_dung.update({
      where: { id },
      data: dataUpdate,
    });

    await this.ghiNhatKy(
      adminUser.id,
      'SUA_NGUOI_DUNG',
      id,
      JSON.stringify({ ho_ten: user.ho_ten, email: user.email, so_dien_thoai: user.so_dien_thoai }),
      JSON.stringify({ ho_ten: updatedUser.ho_ten, email: updatedUser.email, so_dien_thoai: updatedUser.so_dien_thoai }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật thông tin người dùng thành công.',
      du_lieu: {
        id: updatedUser.id,
        ho_ten: updatedUser.ho_ten,
        email: updatedUser.email,
        so_dien_thoai: updatedUser.so_dien_thoai,
      },
    };
  }

  async khoaTaiKhoan(id: string, adminUser: any, ip?: string, userAgent?: string) {
    // 1. Không cho phép tự khóa chính tài khoản của mình
    if (id === adminUser.id) {
      throw new ForbiddenException('Bạn không thể tự khóa tài khoản của chính mình.');
    }

    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id },
      include: {
        nguoi_dung_vai_tro: {
          include: { vai_tro: true },
        },
      },
    });

    if (!user || user.da_xoa) {
      throw new NotFoundException('Không tìm thấy người dùng phù hợp.');
    }

    // Bảo vệ SUPER_ADMIN: Chỉ SUPER_ADMIN mới được khóa tài khoản SUPER_ADMIN khác
    this.checkProtectionSuperAdmin(user, adminUser);

    // 2. Không cho phép khóa SUPER_ADMIN cuối cùng
    const isSuperAdmin = user.nguoi_dung_vai_tro.some((r) => r.vai_tro.ma === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      await this.kiemTraDemSuperAdminConLai('Không thể khóa tài khoản Super Admin cuối cùng trong hệ thống.');
    }

    const updatedUser = await this.prisma.nguoi_dung.update({
      where: { id },
      data: { trang_thai: false },
    });

    // 3. Thu hồi toàn bộ phiên đăng nhập hiện tại phía Server
    this.phienService.thuHoiToanBoPhienNguoiDung(id);

    await this.ghiNhatKy(
      adminUser.id,
      'KHOA_TAI_KHOAN',
      id,
      JSON.stringify({ trang_thai: true }),
      JSON.stringify({ trang_thai: false }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Khóa tài khoản người dùng thành công.',
    };
  }

  async moKhoaTaiKhoan(id: string, adminUser: any, ip?: string, userAgent?: string) {
    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id },
      include: {
        nguoi_dung_vai_tro: {
          include: { vai_tro: true },
        },
      },
    });
    if (!user || user.da_xoa) {
      throw new NotFoundException('Không tìm thấy người dùng phù hợp.');
    }

    // Bảo vệ SUPER_ADMIN: Chỉ SUPER_ADMIN mới được mở khóa tài khoản SUPER_ADMIN khác
    this.checkProtectionSuperAdmin(user, adminUser);

    await this.prisma.nguoi_dung.update({
      where: { id },
      data: { trang_thai: true },
    });

    await this.ghiNhatKy(
      adminUser.id,
      'MO_KHOA_TAI_KHOAN',
      id,
      JSON.stringify({ trang_thai: false }),
      JSON.stringify({ trang_thai: true }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Mở khóa tài khoản người dùng thành công.',
    };
  }

  async xoaMemTaiKhoan(id: string, adminUser: any, ip?: string, userAgent?: string) {
    // 1. Không cho phép tự xóa chính mình
    if (id === adminUser.id) {
      throw new ForbiddenException('Bạn không thể tự xóa tài khoản của chính mình.');
    }

    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id },
      include: {
        nguoi_dung_vai_tro: {
          include: { vai_tro: true },
        },
      },
    });

    if (!user || user.da_xoa) {
      throw new NotFoundException('Không tìm thấy người dùng phù hợp.');
    }

    // Bảo vệ SUPER_ADMIN: Chỉ SUPER_ADMIN mới được xóa tài khoản SUPER_ADMIN khác
    this.checkProtectionSuperAdmin(user, adminUser);

    // 2. Không cho phép xóa SUPER_ADMIN cuối cùng
    const isSuperAdmin = user.nguoi_dung_vai_tro.some((r) => r.vai_tro.ma === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      await this.kiemTraDemSuperAdminConLai('Không thể xóa tài khoản Super Admin cuối cùng trong hệ thống.');
    }

    await this.prisma.nguoi_dung.update({
      where: { id },
      data: { da_xoa: true, ngay_xoa: new Date() },
    });

    // 3. Thu hồi phiên đăng nhập
    this.phienService.thuHoiToanBoPhienNguoiDung(id);

    await this.ghiNhatKy(
      adminUser.id,
      'XOA_MEM_NGUOI_DUNG',
      id,
      JSON.stringify({ da_xoa: false }),
      JSON.stringify({ da_xoa: true, ngay_xoa: new Date() }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa mềm tài khoản người dùng thành công.',
    };
  }

  async datLaiMatKhau(id: string, dto: DatLaiMatKhauDto, adminUser: any, ip?: string, userAgent?: string) {
    if (!dto.mat_khau_moi || dto.mat_khau_moi.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.');
    }

    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id },
      include: {
        nguoi_dung_vai_tro: {
          include: { vai_tro: true },
        },
      },
    });
    if (!user || user.da_xoa) {
      throw new NotFoundException('Không tìm thấy người dùng phù hợp.');
    }

    // Bảo vệ SUPER_ADMIN: Chỉ SUPER_ADMIN mới được đặt lại mật khẩu cho tài khoản SUPER_ADMIN khác
    this.checkProtectionSuperAdmin(user, adminUser);

    const hashedPassword = await bcrypt.hash(dto.mat_khau_moi, 10);

    await this.prisma.nguoi_dung.update({
      where: { id },
      data: { mat_khau: hashedPassword },
    });

    // Thu hồi các phiên cũ của người dùng vừa bị đổi mật khẩu
    this.phienService.thuHoiToanBoPhienNguoiDung(id);

    await this.ghiNhatKy(
      adminUser.id,
      'DAT_LAI_MAT_KHAU',
      id,
      null,
      JSON.stringify({ thong_bao: 'Đặt lại mật khẩu thành công' }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Đặt lại mật khẩu thành công. Các phiên đăng nhập cũ đã được vô hiệu hóa.',
    };
  }

  async ganVaiTro(id: string, dto: GanVaiTroDto, adminUser: any, ip?: string, userAgent?: string) {
    if (!dto.vai_tro || !Array.isArray(dto.vai_tro)) {
      throw new BadRequestException('Danh sách vai trò không hợp lệ.');
    }

    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id },
      include: {
        nguoi_dung_vai_tro: {
          include: { vai_tro: true },
        },
      },
    });

    if (!user || user.da_xoa) {
      throw new NotFoundException('Không tìm thấy người dùng phù hợp.');
    }

    // Bảo vệ SUPER_ADMIN: Chỉ SUPER_ADMIN mới được hạ/thay đổi vai trò của tài khoản SUPER_ADMIN khác
    this.checkProtectionSuperAdmin(user, adminUser);

    const currentRoles = user.nguoi_dung_vai_tro.map((r) => r.vai_tro.ma);

    // Kiểm tra quyền gán SUPER_ADMIN: Chỉ SUPER_ADMIN mới được gán vai trò SUPER_ADMIN cho người khác
    const willBeSuperAdmin = dto.vai_tro.includes('SUPER_ADMIN');
    if (willBeSuperAdmin) {
      const actingRoles = adminUser.vai_tro || [];
      const isActingSuperAdmin = actingRoles.includes('SUPER_ADMIN');
      if (!isActingSuperAdmin) {
        throw new ForbiddenException(
          'Bạn không có quyền gán vai trò Quản trị tối cao (SUPER_ADMIN) cho tài khoản khác.',
        );
      }
    }

    // Không cho phép tự hạ vai trò nếu chính mình đang thao tác và bị mất SUPER_ADMIN / QUAN_TRI_VIEN
    if (id === adminUser.id) {
      const willKeepAdmin = dto.vai_tro.includes('SUPER_ADMIN') || dto.vai_tro.includes('QUAN_TRI_VIEN');
      if (!willKeepAdmin) {
        throw new ForbiddenException('Bạn không thể tự tước vai trò quản trị của chính mình.');
      }
    }

    // Nếu đang tước SUPER_ADMIN của ai đó, kiểm tra xem còn lại bao nhiêu SUPER_ADMIN
    const wasSuperAdmin = currentRoles.includes('SUPER_ADMIN');
    if (wasSuperAdmin && !willBeSuperAdmin) {
      await this.kiemTraDemSuperAdminConLai('Không thể tước vai trò Super Admin của tài khoản cuối cùng.');
    }

    // Lấy ID các vai trò cần gán
    const validRoles = await this.prisma.vai_tro.findMany({
      where: { ma: { in: dto.vai_tro } },
    });

    // Xóa vai trò cũ và gán vai trò mới trong Transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.nguoi_dung_vai_tro.deleteMany({
        where: { nguoi_dung_id: id },
      });

      for (const role of validRoles) {
        await tx.nguoi_dung_vai_tro.create({
          data: {
            nguoi_dung_id: id,
            vai_tro_id: role.id,
          },
        });
      }
    });

    await this.ghiNhatKy(
      adminUser.id,
      'GAN_VAI_TRO',
      id,
      JSON.stringify({ vai_tro: currentRoles }),
      JSON.stringify({ vai_tro: dto.vai_tro }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật danh sách vai trò thành công.',
    };
  }

  private checkProtectionSuperAdmin(targetUser: any, adminUser: any) {
    const isTargetSuperAdmin = targetUser?.nguoi_dung_vai_tro?.some(
      (r: any) => r.vai_tro?.ma === 'SUPER_ADMIN',
    );
    if (isTargetSuperAdmin) {
      const isActingSuperAdmin = adminUser?.vai_tro?.includes('SUPER_ADMIN');
      if (!isActingSuperAdmin) {
        throw new ForbiddenException(
          'Chỉ tài khoản Quản trị tối cao (SUPER_ADMIN) mới có quyền thao tác trên tài khoản Quản trị tối cao khác.',
        );
      }
    }
  }

  private async kiemTraDemSuperAdminConLai(errorMessage: string) {
    const count = await this.prisma.nguoi_dung.count({
      where: {
        da_xoa: false,
        trang_thai: true,
        nguoi_dung_vai_tro: {
          some: {
            vai_tro: {
              ma: 'SUPER_ADMIN',
            },
          },
        },
      },
    });

    if (count <= 1) {
      throw new ForbiddenException(errorMessage);
    }
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
          doi_tuong: 'nguoi_dung',
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
