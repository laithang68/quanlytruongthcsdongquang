import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../../database/prisma.service';
import { LayDanhSachVanBanDto } from './dto/lay-danh-sach-van-ban.dto';
import { TaoVanBanDto } from './dto/tao-van-ban.dto';
import { SuaVanBanDto } from './dto/sua-van-ban.dto';
import { DoiTrangThaiVanBanDto } from './dto/doi-trang-thai-van-ban.dto';

@Injectable()
export class VanBanService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Tra cứu Công khai trên Website)
  // -------------------------------------------------------------

  async layDanhSachPublic(
    pageInput?: string,
    limitInput?: string,
    tuKhoa?: string,
    loaiVanBanCode?: string,
    coQuanBanHanh?: string,
    thoiGian?: string,
  ) {
    const page = Math.max(1, parseInt(pageInput || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitInput || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      trang_thai: true,
      da_xoa: false,
    };

    if (tuKhoa && tuKhoa.trim()) {
      const keyword = tuKhoa.trim();
      where.OR = [
        { ten_van_ban: { contains: keyword, mode: 'insensitive' } },
        { so_hieu: { contains: keyword, mode: 'insensitive' } },
        { mo_ta: { contains: keyword, mode: 'insensitive' } },
        { nguoi_ky: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (loaiVanBanCode && loaiVanBanCode.trim()) {
      const code = loaiVanBanCode.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { loai_van_ban_id: code },
            { loai_van_ban: { ma: { equals: code, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    if (coQuanBanHanh && coQuanBanHanh.trim()) {
      const cq = coQuanBanHanh.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { nguoi_ky: { contains: cq, mode: 'insensitive' } },
            { ten_van_ban: { contains: cq, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (thoiGian && thoiGian.trim()) {
      const now = new Date();
      if (thoiGian === 'hom-nay') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        where.ngay_ban_hanh = { gte: startOfDay };
      } else if (thoiGian === '7-ngay') {
        const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        where.ngay_ban_hanh = { gte: days7Ago };
      } else if (thoiGian === '30-ngay') {
        const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        where.ngay_ban_hanh = { gte: days30Ago };
      }
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.van_ban.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_ban_hanh: 'desc' },
        include: {
          loai_van_ban: true,
          tep_tin: true,
          nguoi_tao: {
            select: { id: true, ho_ten: true },
          },
        },
      }),
      this.prisma.van_ban.count({ where }),
    ]);

    return {
      thanh_cong: true,
      du_lieu: danhSach,
      tong_so: tongSo,
      trang: page,
      limit,
      tong_so_trang: Math.ceil(tongSo / limit),
    };
  }

  async layChiTietPublic(id: string) {
    const vanBan = await this.prisma.van_ban.findFirst({
      where: {
        id,
        trang_thai: true,
        da_xoa: false,
      },
      include: {
        loai_van_ban: { select: { id: true, ten: true, ma: true } },
        tep_tin: { select: { id: true, ten_goc: true, url: true, loai_tap_tin: true, kich_thuoc: true } },
        nguoi_tao: { select: { id: true, ho_ten: true } },
      },
    });

    if (!vanBan) {
      throw new NotFoundException('Không tìm thấy văn bản công khai hoặc văn bản đã bị ẩn.');
    }

    return {
      thanh_cong: true,
      du_lieu: vanBan,
    };
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Quản trị Văn bản)
  // -------------------------------------------------------------

  async layDanhSachAdmin(dto: LayDanhSachVanBanDto, user: any) {
    // Limit tối đa 100
    const page = Math.max(1, parseInt(dto.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(dto.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      da_xoa: false,
    };

    if (dto.tu_khoa && dto.tu_khoa.trim()) {
      const keyword = dto.tu_khoa.trim();
      where.OR = [
        { ten_van_ban: { contains: keyword, mode: 'insensitive' } },
        { so_hieu: { contains: keyword, mode: 'insensitive' } },
        { mo_ta: { contains: keyword, mode: 'insensitive' } },
        { nguoi_ky: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (dto.so_hieu && dto.so_hieu.trim()) {
      where.so_hieu = { contains: dto.so_hieu.trim(), mode: 'insensitive' };
    }

    if (dto.loai_van_ban_id && dto.loai_van_ban_id.trim()) {
      where.loai_van_ban_id = dto.loai_van_ban_id.trim();
    }

    if (dto.trang_thai !== undefined && dto.trang_thai !== '') {
      where.trang_thai = dto.trang_thai === 'true';
    }

    if (dto.ngay_tu || dto.ngay_den) {
      where.ngay_ban_hanh = {};
      if (dto.ngay_tu) {
        where.ngay_ban_hanh.gte = new Date(dto.ngay_tu);
      }
      if (dto.ngay_den) {
        where.ngay_ban_hanh.lte = new Date(dto.ngay_den);
      }
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.van_ban.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_tao: 'desc' },
        include: {
          loai_van_ban: { select: { id: true, ten: true, ma: true } },
          tep_tin: { select: { id: true, ten_goc: true, url: true, loai_tap_tin: true, kich_thuoc: true } },
          nguoi_tao: { select: { id: true, ho_ten: true, email: true } },
        },
      }),
      this.prisma.van_ban.count({ where }),
    ]);

    return {
      thanh_cong: true,
      du_lieu: danhSach,
      tong_so: tongSo,
      trang: page,
      limit,
      tong_so_trang: Math.ceil(tongSo / limit),
    };
  }

  async layChiTietAdmin(id: string) {
    const vanBan = await this.prisma.van_ban.findFirst({
      where: { id, da_xoa: false },
      include: {
        loai_van_ban: { select: { id: true, ten: true, ma: true } },
        tep_tin: { select: { id: true, ten_goc: true, url: true, loai_tap_tin: true, kich_thuoc: true } },
        nguoi_tao: { select: { id: true, ho_ten: true, email: true } },
      },
    });

    if (!vanBan) {
      throw new NotFoundException('Không tìm thấy văn bản phù hợp.');
    }

    return {
      thanh_cong: true,
      du_lieu: vanBan,
    };
  }

  async taoVanBan(dto: TaoVanBanDto, user: any, ip?: string, userAgent?: string) {
    // Validation
    if (!dto.ten_van_ban || !dto.ten_van_ban.trim()) {
      throw new BadRequestException('Tên văn bản không được để trống.');
    }
    if (!dto.so_hieu || !dto.so_hieu.trim()) {
      throw new BadRequestException('Số hiệu văn bản không được để trống.');
    }
    if (!dto.loai_van_ban_id || !dto.loai_van_ban_id.trim()) {
      throw new BadRequestException('Vui lòng chọn loại văn bản.');
    }

    const loaiVanBan = await this.prisma.loai_van_ban.findUnique({
      where: { id: dto.loai_van_ban_id },
    });
    if (!loaiVanBan) {
      throw new BadRequestException('Loại văn bản được chọn không tồn tại.');
    }

    if (!dto.ngay_ban_hanh) {
      throw new BadRequestException('Vui lòng nhập ngày ban hành văn bản.');
    }
    const ngayBanHanh = new Date(dto.ngay_ban_hanh);
    if (isNaN(ngayBanHanh.getTime())) {
      throw new BadRequestException('Ngày ban hành văn bản không hợp lệ.');
    }

    if (dto.tep_tin_id && dto.tep_tin_id.trim()) {
      const tepTin = await this.prisma.tep_tin.findUnique({
        where: { id: dto.tep_tin_id },
      });
      if (!tepTin) {
        throw new BadRequestException('Tệp tin đính kèm không tồn tại.');
      }
    }

    const cleanMoTa = dto.mo_ta ? this.sanitizeContent(dto.mo_ta) : null;
    const cleanTenVanBan = this.sanitizeContent(dto.ten_van_ban.trim());

    const vanBanMoi = await this.prisma.van_ban.create({
      data: {
        ten_van_ban: cleanTenVanBan,
        so_hieu: dto.so_hieu.trim(),
        loai_van_ban_id: dto.loai_van_ban_id,
        ngay_ban_hanh: ngayBanHanh,
        nguoi_ky: dto.nguoi_ky ? dto.nguoi_ky.trim() : null,
        mo_ta: cleanMoTa,
        tep_tin_id: dto.tep_tin_id || null,
        trang_thai: dto.trang_thai !== undefined ? dto.trang_thai : true,
        nguoi_tao_id: user.id, // Lấy duy nhất từ JWT
      },
    });

    await this.ghiNhatKy(
      user.id,
      'TAO_VAN_BAN',
      vanBanMoi.id,
      null,
      JSON.stringify({ so_hieu: vanBanMoi.so_hieu, ten_van_ban: vanBanMoi.ten_van_ban }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo văn bản mới thành công.',
      du_lieu: vanBanMoi,
    };
  }

  async suaVanBan(id: string, dto: SuaVanBanDto, user: any, ip?: string, userAgent?: string) {
    const vanBan = await this.prisma.van_ban.findFirst({ where: { id, da_xoa: false } });
    if (!vanBan) {
      throw new NotFoundException('Không tìm thấy văn bản phù hợp.');
    }

    // Ownership Check: GIAO_VIEN / BIEN_TAP_VIEN chỉ được sửa văn bản do mình tạo
    const isRestrictedRole =
      (user.vai_tro.includes('GIAO_VIEN') || user.vai_tro.includes('BIEN_TAP_VIEN')) &&
      !user.vai_tro.includes('SUPER_ADMIN') &&
      !user.vai_tro.includes('QUAN_TRI_VIEN') &&
      !user.vai_tro.includes('BAN_GIAM_HIEU');

    if (isRestrictedRole && vanBan.nguoi_tao_id !== user.id) {
      throw new ForbiddenException('Bạn chỉ có quyền chỉnh sửa văn bản do chính mình tạo.');
    }

    const dataUpdate: any = {};

    if (dto.ten_van_ban && dto.ten_van_ban.trim()) {
      dataUpdate.ten_van_ban = this.sanitizeContent(dto.ten_van_ban.trim());
    }

    if (dto.so_hieu && dto.so_hieu.trim()) {
      dataUpdate.so_hieu = dto.so_hieu.trim();
    }

    if (dto.loai_van_ban_id && dto.loai_van_ban_id.trim()) {
      const loaiVanBan = await this.prisma.loai_van_ban.findUnique({
        where: { id: dto.loai_van_ban_id },
      });
      if (!loaiVanBan) {
        throw new BadRequestException('Loại văn bản không tồn tại.');
      }
      dataUpdate.loai_van_ban_id = dto.loai_van_ban_id;
    }

    if (dto.ngay_ban_hanh) {
      const d = new Date(dto.ngay_ban_hanh);
      if (isNaN(d.getTime())) {
        throw new BadRequestException('Ngày ban hành không hợp lệ.');
      }
      dataUpdate.ngay_ban_hanh = d;
    }

    if (dto.nguoi_ky !== undefined) {
      dataUpdate.nguoi_ky = dto.nguoi_ky ? dto.nguoi_ky.trim() : null;
    }

    if (dto.mo_ta !== undefined) {
      dataUpdate.mo_ta = dto.mo_ta ? this.sanitizeContent(dto.mo_ta) : null;
    }

    if (dto.tep_tin_id !== undefined) {
      if (dto.tep_tin_id) {
        const tepTin = await this.prisma.tep_tin.findUnique({ where: { id: dto.tep_tin_id } });
        if (!tepTin) throw new BadRequestException('Tệp tin đính kèm không tồn tại.');
      }
      dataUpdate.tep_tin_id = dto.tep_tin_id || null;
    }

    if (dto.trang_thai !== undefined) {
      dataUpdate.trang_thai = dto.trang_thai;
    }

    const updated = await this.prisma.van_ban.update({
      where: { id },
      data: dataUpdate,
    });

    await this.ghiNhatKy(
      user.id,
      'SUA_VAN_BAN',
      id,
      JSON.stringify({ so_hieu: vanBan.so_hieu, ten_van_ban: vanBan.ten_van_ban }),
      JSON.stringify({ so_hieu: updated.so_hieu, ten_van_ban: updated.ten_van_ban }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật thông tin văn bản thành công.',
      du_lieu: updated,
    };
  }

  async doiTrangThai(id: string, dto: DoiTrangThaiVanBanDto, user: any, ip?: string, userAgent?: string) {
    const vanBan = await this.prisma.van_ban.findFirst({ where: { id, da_xoa: false } });
    if (!vanBan) {
      throw new NotFoundException('Không tìm thấy văn bản phù hợp.');
    }

    const isRestrictedRole =
      (user.vai_tro.includes('GIAO_VIEN') || user.vai_tro.includes('BIEN_TAP_VIEN')) &&
      !user.vai_tro.includes('SUPER_ADMIN') &&
      !user.vai_tro.includes('QUAN_TRI_VIEN') &&
      !user.vai_tro.includes('BAN_GIAM_HIEU');

    if (isRestrictedRole && vanBan.nguoi_tao_id !== user.id) {
      throw new ForbiddenException('Bạn chỉ có quyền thay đổi trạng thái văn bản do chính mình tạo.');
    }

    const updated = await this.prisma.van_ban.update({
      where: { id },
      data: { trang_thai: dto.trang_thai },
    });

    const action = dto.trang_thai ? 'BAT_CONG_KHAI_VAN_BAN' : 'TAT_CONG_KHAI_VAN_BAN';
    await this.ghiNhatKy(
      user.id,
      action,
      id,
      JSON.stringify({ trang_thai: vanBan.trang_thai }),
      JSON.stringify({ trang_thai: updated.trang_thai }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: dto.trang_thai ? 'Đã bật công khai văn bản.' : 'Đã ẩn công khai văn bản.',
      du_lieu: updated,
    };
  }

  async xoaMem(id: string, user: any, ip?: string, userAgent?: string) {
    const vanBan = await this.prisma.van_ban.findFirst({ where: { id, da_xoa: false } });
    if (!vanBan) {
      throw new NotFoundException('Không tìm thấy văn bản phù hợp.');
    }

    const isRestrictedRole =
      (user.vai_tro.includes('GIAO_VIEN') || user.vai_tro.includes('BIEN_TAP_VIEN')) &&
      !user.vai_tro.includes('SUPER_ADMIN') &&
      !user.vai_tro.includes('QUAN_TRI_VIEN') &&
      !user.vai_tro.includes('BAN_GIAM_HIEU');

    if (isRestrictedRole && vanBan.nguoi_tao_id !== user.id) {
      throw new ForbiddenException('Bạn chỉ có quyền xóa văn bản do chính mình tạo.');
    }

    const updated = await this.prisma.van_ban.update({
      where: { id },
      data: {
        da_xoa: true,
        ngay_xoa: new Date(),
      },
    });

    await this.ghiNhatKy(
      user.id,
      'XOA_MEM_VAN_BAN',
      id,
      JSON.stringify({ da_xoa: false }),
      JSON.stringify({ da_xoa: true, ngay_xoa: updated.ngay_xoa }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa mềm văn bản thành công.',
    };
  }

  // -------------------------------------------------------------
  // HELPER UTILITIES
  // -------------------------------------------------------------

  private sanitizeContent(htmlInput: string): string {
    return sanitizeHtml(htmlInput, {
      allowedTags: [
        'p', 'b', 'i', 'u', 'strong', 'em', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'br', 'hr', 'div', 'span',
      ],
      allowedAttributes: {
        a: ['href', 'name', 'target', 'title'],
        '*': ['class'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      disallowedTagsMode: 'discard',
    });
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
          doi_tuong: 'van_ban',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống văn bản:', e);
    }
  }
}
