import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../../database/prisma.service';
import { LayDanhSachGiaoVienDto } from './dto/lay-danh-sach-giao-vien.dto';
import { TaoGiaoVienDto } from './dto/tao-giao-vien.dto';
import { SuaGiaoVienDto } from './dto/sua-giao-vien.dto';

@Injectable()
export class GiaoVienService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Trang giới thiệu công khai trên Website)
  // -------------------------------------------------------------

  private maskPhone(phone?: string | null): string | null {
    if (!phone || !phone.trim()) return null;
    const trimmed = phone.trim();
    if (trimmed.length <= 3) return '***';
    return trimmed.slice(0, -3) + '***';
  }

  private isBanGiamHieu(chucVu?: string | null, chucVuMa?: string | null): boolean {
    if (chucVuMa) {
      return chucVuMa === 'HIEU_TRUONG' || chucVuMa === 'HIEU_PHO';
    }
    if (!chucVu) return false;
    const cv = chucVu.toLowerCase();
    return (
      cv.includes('hiệu trưởng') ||
      cv.includes('phó hiệu trưởng') ||
      cv.includes('ban giám hiệu') ||
      cv.includes('bgh')
    );
  }

  async layDanhSachPublic(
    toChuyenMonId?: string,
    tuKhoa?: string,
    chucVu?: string,
    chucVuId?: string,
    boMonId?: string,
  ) {
    const where: any = {
      trang_thai: true,
      da_xoa: false,
    };

    if (toChuyenMonId && toChuyenMonId.trim()) {
      where.to_chuyen_mon_id = toChuyenMonId.trim();
    }

    if (chucVuId && chucVuId.trim()) {
      where.chuc_vu_id = chucVuId.trim();
    }

    if (boMonId && boMonId.trim()) {
      where.bo_mon_id = boMonId.trim();
    }

    if (tuKhoa && tuKhoa.trim()) {
      const kw = tuKhoa.trim();
      where.OR = [
        { ho_ten: { contains: kw, mode: 'insensitive' } },
        { chuc_vu: { contains: kw, mode: 'insensitive' } },
        { trinh_do: { contains: kw, mode: 'insensitive' } },
        { danh_muc_chuc_vu: { ten: { contains: kw, mode: 'insensitive' } } },
        { danh_muc_bo_mon: { ten: { contains: kw, mode: 'insensitive' } } },
      ];
    }

    if (chucVu && chucVu.trim()) {
      where.chuc_vu = { contains: chucVu.trim(), mode: 'insensitive' };
    }

    const list = await this.prisma.giao_vien.findMany({
      where,
      orderBy: { ho_ten: 'asc' },
      select: {
        id: true,
        ho_ten: true,
        anh_dai_dien: true,
        chuc_vu: true,
        chuc_vu_id: true,
        bo_mon_id: true,
        trinh_do: true,
        gioi_thieu: true,
        email: true,
        so_dien_thoai: true,
        danh_muc_chuc_vu: { select: { id: true, ten: true, ma: true } },
        danh_muc_bo_mon: { select: { id: true, ten: true, ma: true } },
        to_chuyen_mon: { select: { id: true, ten: true } },
      },
    });

    // SECURITY: Chỉ trả Email + SĐT Masked cho Ban Giám hiệu, ẩn hoàn toàn cho giáo viên thông thường
    const duLieuFormatted = list.map((gv) => {
      const isBGH = this.isBanGiamHieu(gv.chuc_vu, gv.danh_muc_chuc_vu?.ma);
      return {
        id: gv.id,
        ho_ten: gv.ho_ten,
        anh_dai_dien: gv.anh_dai_dien,
        chuc_vu: gv.danh_muc_chuc_vu?.ten || gv.chuc_vu,
        chuc_vu_id: gv.chuc_vu_id,
        bo_mon_id: gv.bo_mon_id,
        danh_muc_chuc_vu: gv.danh_muc_chuc_vu,
        danh_muc_bo_mon: gv.danh_muc_bo_mon,
        trinh_do: gv.trinh_do,
        gioi_thieu: gv.gioi_thieu,
        to_chuyen_mon: gv.to_chuyen_mon,
        email: isBGH ? gv.email || null : undefined,
        so_dien_thoai: isBGH ? this.maskPhone(gv.so_dien_thoai) : undefined,
      };
    });

    return {
      thanh_cong: true,
      du_lieu: duLieuFormatted,
    };
  }

  async layChiTietPublic(id: string) {
    const gv = await this.prisma.giao_vien.findFirst({
      where: {
        id,
        trang_thai: true,
        da_xoa: false,
      },
      select: {
        id: true,
        ho_ten: true,
        anh_dai_dien: true,
        chuc_vu: true,
        chuc_vu_id: true,
        bo_mon_id: true,
        trinh_do: true,
        gioi_thieu: true,
        email: true,
        so_dien_thoai: true,
        danh_muc_chuc_vu: { select: { id: true, ten: true, ma: true } },
        danh_muc_bo_mon: { select: { id: true, ten: true, ma: true } },
        to_chuyen_mon: { select: { id: true, ten: true } },
      },
    });

    if (!gv) {
      throw new NotFoundException('Không tìm thấy thông tin giáo viên.');
    }

    const isBGH = this.isBanGiamHieu(gv.chuc_vu, gv.danh_muc_chuc_vu?.ma);
    const duLieuFormatted = {
      id: gv.id,
      ho_ten: gv.ho_ten,
      anh_dai_dien: gv.anh_dai_dien,
      chuc_vu: gv.danh_muc_chuc_vu?.ten || gv.chuc_vu,
      chuc_vu_id: gv.chuc_vu_id,
      bo_mon_id: gv.bo_mon_id,
      danh_muc_chuc_vu: gv.danh_muc_chuc_vu,
      danh_muc_bo_mon: gv.danh_muc_bo_mon,
      trinh_do: gv.trinh_do,
      gioi_thieu: gv.gioi_thieu,
      to_chuyen_mon: gv.to_chuyen_mon,
      email: isBGH ? gv.email || null : undefined,
      so_dien_thoai: isBGH ? this.maskPhone(gv.so_dien_thoai) : undefined,
    };

    return {
      thanh_cong: true,
      du_lieu: duLieuFormatted,
    };
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Quản trị Giáo viên)
  // -------------------------------------------------------------

  async layDanhSachAdmin(dto: LayDanhSachGiaoVienDto) {
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
        { ho_ten: { contains: keyword, mode: 'insensitive' } },
        { chuc_vu: { contains: keyword, mode: 'insensitive' } },
        { trinh_do: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { so_dien_thoai: { contains: keyword, mode: 'insensitive' } },
        { danh_muc_chuc_vu: { ten: { contains: keyword, mode: 'insensitive' } } },
        { danh_muc_bo_mon: { ten: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    if (dto.to_chuyen_mon_id && dto.to_chuyen_mon_id.trim()) {
      where.to_chuyen_mon_id = dto.to_chuyen_mon_id.trim();
    }

    if (dto.chuc_vu_id && dto.chuc_vu_id.trim()) {
      where.chuc_vu_id = dto.chuc_vu_id.trim();
    }

    if (dto.bo_mon_id && dto.bo_mon_id.trim()) {
      where.bo_mon_id = dto.bo_mon_id.trim();
    }

    if (dto.trang_thai !== undefined && dto.trang_thai !== '') {
      where.trang_thai = dto.trang_thai === 'true';
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.giao_vien.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ho_ten: 'asc' },
        include: {
          danh_muc_chuc_vu: { select: { id: true, ten: true, ma: true } },
          danh_muc_bo_mon: { select: { id: true, ten: true, ma: true } },
          to_chuyen_mon: { select: { id: true, ten: true, truong_to_id: true } },
        },
      }),
      this.prisma.giao_vien.count({ where }),
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
    const gv = await this.prisma.giao_vien.findFirst({
      where: { id, da_xoa: false },
      include: {
        danh_muc_chuc_vu: { select: { id: true, ten: true, ma: true } },
        danh_muc_bo_mon: { select: { id: true, ten: true, ma: true } },
        to_chuyen_mon: { select: { id: true, ten: true, truong_to_id: true } },
      },
    });

    if (!gv) {
      throw new NotFoundException('Không tìm thấy thông tin giáo viên.');
    }

    return {
      thanh_cong: true,
      du_lieu: gv,
    };
  }

  async taoGiaoVien(dto: TaoGiaoVienDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.ho_ten || !dto.ho_ten.trim()) {
      throw new BadRequestException('Họ tên giáo viên không được để trống.');
    }

    if (!dto.to_chuyen_mon_id || !dto.to_chuyen_mon_id.trim()) {
      throw new BadRequestException('Vui lòng chọn tổ chuyên môn cho giáo viên.');
    }

    const to = await this.prisma.to_chuyen_mon.findUnique({
      where: { id: dto.to_chuyen_mon_id },
    });
    if (!to) {
      throw new BadRequestException('Tổ chuyên môn được chọn không tồn tại.');
    }

    let chucVuObj: any = null;
    if (dto.chuc_vu_id && dto.chuc_vu_id.trim()) {
      chucVuObj = await this.prisma.danh_muc_chuc_vu.findFirst({
        where: { id: dto.chuc_vu_id.trim(), trang_thai: true },
      });
      if (!chucVuObj) {
        throw new BadRequestException('Chức vụ được chọn không hợp lệ hoặc đã bị vô hiệu hóa.');
      }
    }

    let boMonObj: any = null;
    if (dto.bo_mon_id && dto.bo_mon_id.trim()) {
      boMonObj = await this.prisma.danh_muc_bo_mon.findFirst({
        where: { id: dto.bo_mon_id.trim(), trang_thai: true },
      });
      if (!boMonObj) {
        throw new BadRequestException('Bộ môn được chọn không hợp lệ hoặc đã bị vô hiệu hóa.');
      }
    }

    // BUSINESS VALIDATION (PHASE 2.16):
    // Nếu Chức vụ = GIAO_VIEN -> bắt buộc phải chọn Bộ môn
    if (chucVuObj && chucVuObj.ma === 'GIAO_VIEN' && !boMonObj) {
      throw new BadRequestException('Giáo viên chuyên môn bắt buộc phải chọn Bộ môn giảng dạy.');
    }

    // Tạo fallback text chuc_vu nếu không truyền
    let textChucVu = dto.chuc_vu ? dto.chuc_vu.trim() : null;
    if (!textChucVu && chucVuObj) {
      textChucVu = chucVuObj.ten + (boMonObj ? ` ${boMonObj.ten}` : '');
    }

    const cleanGioiThieu = dto.gioi_thieu ? this.sanitizeContent(dto.gioi_thieu) : null;

    const gvMoi = await this.prisma.giao_vien.create({
      data: {
        ho_ten: dto.ho_ten.trim(),
        to_chuyen_mon_id: dto.to_chuyen_mon_id,
        anh_dai_dien: dto.anh_dai_dien || null,
        chuc_vu: textChucVu,
        chuc_vu_id: chucVuObj ? chucVuObj.id : null,
        bo_mon_id: boMonObj ? boMonObj.id : null,
        trinh_do: dto.trinh_do ? dto.trinh_do.trim() : null,
        email: dto.email ? dto.email.trim() : null,
        so_dien_thoai: dto.so_dien_thoai ? dto.so_dien_thoai.trim() : null,
        gioi_thieu: cleanGioiThieu,
        trang_thai: dto.trang_thai !== undefined ? dto.trang_thai : true,
      },
      include: {
        danh_muc_chuc_vu: { select: { id: true, ten: true, ma: true } },
        danh_muc_bo_mon: { select: { id: true, ten: true, ma: true } },
        to_chuyen_mon: { select: { id: true, ten: true, truong_to_id: true } },
      },
    });

    await this.ghiNhatKy(
      user.id,
      'TAO_GIAO_VIEN',
      gvMoi.id,
      null,
      JSON.stringify({
        ho_ten: gvMoi.ho_ten,
        to_chuyen_mon_id: gvMoi.to_chuyen_mon_id,
        chuc_vu_id: gvMoi.chuc_vu_id,
        bo_mon_id: gvMoi.bo_mon_id,
      }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo hồ sơ giáo viên mới thành công.',
      du_lieu: gvMoi,
    };
  }

  // MỤC 5: CHUYỂN GIÁO VIÊN SANG TỔ KHÁC (Prisma Transaction)
  async suaGiaoVien(id: string, dto: SuaGiaoVienDto, user: any, ip?: string, userAgent?: string) {
    const gv = await this.prisma.giao_vien.findFirst({
      where: { id, da_xoa: false },
      include: {
        danh_muc_chuc_vu: true,
        danh_muc_bo_mon: true,
      },
    });
    if (!gv) {
      throw new NotFoundException('Không tìm thấy hồ sơ giáo viên.');
    }

    const dataUpdate: any = {};

    if (dto.ho_ten && dto.ho_ten.trim()) {
      dataUpdate.ho_ten = dto.ho_ten.trim();
    }

    let isChangingDepartment = false;
    if (dto.to_chuyen_mon_id && dto.to_chuyen_mon_id !== gv.to_chuyen_mon_id) {
      const toMoi = await this.prisma.to_chuyen_mon.findUnique({
        where: { id: dto.to_chuyen_mon_id },
      });
      if (!toMoi) {
        throw new BadRequestException('Tổ chuyên môn mới không tồn tại.');
      }
      dataUpdate.to_chuyen_mon_id = dto.to_chuyen_mon_id;
      isChangingDepartment = true;
    }

    // Xử lý Chức vụ
    let effectiveChucVu = gv.danh_muc_chuc_vu;
    if (dto.chuc_vu_id !== undefined) {
      if (dto.chuc_vu_id && dto.chuc_vu_id.trim()) {
        const chucVuObj = await this.prisma.danh_muc_chuc_vu.findFirst({
          where: { id: dto.chuc_vu_id.trim(), trang_thai: true },
        });
        if (!chucVuObj) {
          throw new BadRequestException('Chức vụ được chọn không hợp lệ hoặc đã bị vô hiệu hóa.');
        }
        dataUpdate.chuc_vu_id = chucVuObj.id;
        effectiveChucVu = chucVuObj;
      } else {
        dataUpdate.chuc_vu_id = null;
        effectiveChucVu = null;
      }
    }

    // Xử lý Bộ môn
    let effectiveBoMon = gv.danh_muc_bo_mon;
    if (dto.bo_mon_id !== undefined) {
      if (dto.bo_mon_id && dto.bo_mon_id.trim()) {
        const boMonObj = await this.prisma.danh_muc_bo_mon.findFirst({
          where: { id: dto.bo_mon_id.trim(), trang_thai: true },
        });
        if (!boMonObj) {
          throw new BadRequestException('Bộ môn được chọn không hợp lệ hoặc đã bị vô hiệu hóa.');
        }
        dataUpdate.bo_mon_id = boMonObj.id;
        effectiveBoMon = boMonObj;
      } else {
        dataUpdate.bo_mon_id = null;
        effectiveBoMon = null;
      }
    }

    // BUSINESS VALIDATION (PHASE 2.16):
    // Nếu Chức vụ = GIAO_VIEN -> bắt buộc phải có Bộ môn
    if (effectiveChucVu && effectiveChucVu.ma === 'GIAO_VIEN' && !effectiveBoMon) {
      throw new BadRequestException('Giáo viên chuyên môn bắt buộc phải chọn Bộ môn giảng dạy.');
    }

    if (dto.chuc_vu !== undefined) {
      dataUpdate.chuc_vu = dto.chuc_vu ? dto.chuc_vu.trim() : null;
    } else if (effectiveChucVu) {
      dataUpdate.chuc_vu = effectiveChucVu.ten + (effectiveBoMon ? ` ${effectiveBoMon.ten}` : '');
    }

    if (dto.anh_dai_dien !== undefined) {
      dataUpdate.anh_dai_dien = dto.anh_dai_dien || null;
    }
    if (dto.trinh_do !== undefined) {
      dataUpdate.trinh_do = dto.trinh_do ? dto.trinh_do.trim() : null;
    }
    if (dto.email !== undefined) {
      dataUpdate.email = dto.email ? dto.email.trim() : null;
    }
    if (dto.so_dien_thoai !== undefined) {
      dataUpdate.so_dien_thoai = dto.so_dien_thoai ? dto.so_dien_thoai.trim() : null;
    }
    if (dto.gioi_thieu !== undefined) {
      dataUpdate.gioi_thieu = dto.gioi_thieu ? this.sanitizeContent(dto.gioi_thieu) : null;
    }
    if (dto.trang_thai !== undefined) {
      dataUpdate.trang_thai = dto.trang_thai;
    }

    // Thực hiện trong Prisma Transaction nguyên tử
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Nếu giáo viên đang là Tổ trưởng tổ cũ và đang chuyển tổ -> Gỡ truong_to_id = null ở tổ cũ
      if (isChangingDepartment) {
        await tx.to_chuyen_mon.updateMany({
          where: { truong_to_id: id },
          data: { truong_to_id: null },
        });
      }

      // 2. Cập nhật hồ sơ giáo viên
      return tx.giao_vien.update({
        where: { id },
        data: dataUpdate,
        include: {
          danh_muc_chuc_vu: { select: { id: true, ten: true, ma: true } },
          danh_muc_bo_mon: { select: { id: true, ten: true, ma: true } },
          to_chuyen_mon: { select: { id: true, ten: true, truong_to_id: true } },
        },
      });
    });

    await this.ghiNhatKy(
      user.id,
      'SUA_GIAO_VIEN',
      id,
      JSON.stringify({
        ho_ten: gv.ho_ten,
        to_chuyen_mon_id: gv.to_chuyen_mon_id,
        chuc_vu_id: gv.chuc_vu_id,
        bo_mon_id: gv.bo_mon_id,
      }),
      JSON.stringify({
        ho_ten: updated.ho_ten,
        to_chuyen_mon_id: updated.to_chuyen_mon_id,
        chuc_vu_id: updated.chuc_vu_id,
        bo_mon_id: updated.bo_mon_id,
      }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật hồ sơ giáo viên thành công.',
      du_lieu: updated,
    };
  }

  // MỤC 4: XÓA MỀM TỔ TRƯỜNG (Prisma Transaction)
  async xoaMem(id: string, user: any, ip?: string, userAgent?: string) {
    const gv = await this.prisma.giao_vien.findFirst({ where: { id, da_xoa: false } });
    if (!gv) {
      throw new NotFoundException('Không tìm thấy hồ sơ giáo viên.');
    }

    // Thực hiện trong Prisma Transaction nguyên tử
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Nếu giáo viên đang làm Tổ trưởng chuyên môn -> Gỡ truong_to_id = null
      await tx.to_chuyen_mon.updateMany({
        where: { truong_to_id: id },
        data: { truong_to_id: null },
      });

      // 2. Đánh dấu xóa mềm giáo viên
      return tx.giao_vien.update({
        where: { id },
        data: {
          da_xoa: true,
          ngay_xoa: new Date(),
        },
      });
    });

    await this.ghiNhatKy(
      user.id,
      'XOA_GIAO_VIEN',
      id,
      JSON.stringify({ da_xoa: false }),
      JSON.stringify({ da_xoa: true, ngay_xoa: updated.ngay_xoa }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa mềm hồ sơ giáo viên thành công.',
    };
  }

  private sanitizeContent(htmlInput: string): string {
    return sanitizeHtml(htmlInput, {
      allowedTags: ['p', 'b', 'i', 'u', 'strong', 'em', 'br', 'div', 'span', 'ul', 'li'],
      allowedAttributes: {},
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
          doi_tuong: 'giao_vien',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống giáo viên:', e);
    }
  }
}
