import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaoLopHocDto } from './dto/tao-lop-hoc.dto';
import { SuaLopHocDto } from './dto/sua-lop-hoc.dto';

@Injectable()
export class LopHocService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(khoi?: number, namHoc?: string) {
    const where: any = {};
    if (khoi) where.khoi = khoi;
    if (namHoc && namHoc.trim()) where.nam_hoc = namHoc.trim();

    const list = await this.prisma.lop_hoc.findMany({
      where,
      orderBy: [{ khoi: 'asc' }, { ten_lop: 'asc' }],
      include: {
        gvcn: { select: { id: true, ho_ten: true, so_dien_thoai: true, email: true } },
        _count: { select: { hoc_sinh: { where: { da_xoa: false } } } },
      },
    });

    const result = list.map((l) => ({
      ...l,
      so_luong_hoc_sinh: l._count.hoc_sinh,
    }));

    return {
      thanh_cong: true,
      du_lieu: result,
    };
  }

  async layChiTiet(id: string) {
    const lop = await this.prisma.lop_hoc.findUnique({
      where: { id },
      include: {
        gvcn: { select: { id: true, ho_ten: true, so_dien_thoai: true, email: true } },
        _count: { select: { hoc_sinh: { where: { da_xoa: false } } } },
      },
    });

    if (!lop) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }

    return {
      thanh_cong: true,
      du_lieu: {
        ...lop,
        so_luong_hoc_sinh: lop._count.hoc_sinh,
      },
    };
  }

  async taoLopHoc(dto: TaoLopHocDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.ten_lop || !dto.ten_lop.trim()) {
      throw new BadRequestException('Tên lớp học không được để trống.');
    }
    if (!dto.khoi || dto.khoi < 6 || dto.khoi > 9) {
      throw new BadRequestException('Khối học phải nằm trong khoảng 6 đến 9.');
    }
    if (!dto.nam_hoc || !dto.nam_hoc.trim()) {
      throw new BadRequestException('Năm học không được để trống.');
    }

    const existing = await this.prisma.lop_hoc.findFirst({
      where: {
        ten_lop: { equals: dto.ten_lop.trim(), mode: 'insensitive' },
        nam_hoc: dto.nam_hoc.trim(),
      },
    });
    if (existing) {
      throw new BadRequestException(`Lớp ${dto.ten_lop} đã tồn tại trong năm học ${dto.nam_hoc}.`);
    }

    if (dto.gvcn_id) {
      const gv = await this.prisma.giao_vien.findFirst({
        where: { id: dto.gvcn_id, da_xoa: false },
      });
      if (!gv) {
        throw new BadRequestException('Giáo viên chủ nhiệm được chọn không tồn tại hoặc đã bị xóa.');
      }
    }

    const lopMoi = await this.prisma.lop_hoc.create({
      data: {
        ten_lop: dto.ten_lop.trim(),
        khoi: dto.khoi,
        nam_hoc: dto.nam_hoc.trim(),
        gvcn_id: dto.gvcn_id || null,
        mo_ta: dto.mo_ta ? dto.mo_ta.trim() : null,
        trang_thai: dto.trang_thai !== undefined ? dto.trang_thai : true,
      },
    });

    await this.ghiNhatKy(
      user.id,
      'TAO_LOP_HOC',
      lopMoi.id,
      null,
      JSON.stringify({ ten_lop: lopMoi.ten_lop, nam_hoc: lopMoi.nam_hoc }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo lớp học mới thành công.',
      du_lieu: lopMoi,
    };
  }

  async suaLopHoc(id: string, dto: SuaLopHocDto, user: any, ip?: string, userAgent?: string) {
    const lop = await this.prisma.lop_hoc.findUnique({ where: { id } });
    if (!lop) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }

    const dataUpdate: any = {};

    if (dto.ten_lop && dto.ten_lop.trim()) {
      const namHocCheck = dto.nam_hoc ? dto.nam_hoc.trim() : lop.nam_hoc;
      const existing = await this.prisma.lop_hoc.findFirst({
        where: {
          ten_lop: { equals: dto.ten_lop.trim(), mode: 'insensitive' },
          nam_hoc: namHocCheck,
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException(`Lớp ${dto.ten_lop} đã trùng với lớp khác trong năm học ${namHocCheck}.`);
      }
      dataUpdate.ten_lop = dto.ten_lop.trim();
    }

    if (dto.khoi) {
      if (dto.khoi < 6 || dto.khoi > 9) {
        throw new BadRequestException('Khối học phải nằm trong khoảng 6 đến 9.');
      }
      dataUpdate.khoi = dto.khoi;
    }

    if (dto.nam_hoc && dto.nam_hoc.trim()) {
      dataUpdate.nam_hoc = dto.nam_hoc.trim();
    }

    if (dto.gvcn_id !== undefined) {
      if (dto.gvcn_id) {
        const gv = await this.prisma.giao_vien.findFirst({
          where: { id: dto.gvcn_id, da_xoa: false },
        });
        if (!gv) {
          throw new BadRequestException('Giáo viên chủ nhiệm được chọn không tồn tại hoặc đã bị xóa.');
        }
        dataUpdate.gvcn_id = dto.gvcn_id;
      } else {
        dataUpdate.gvcn_id = null;
      }
    }

    if (dto.mo_ta !== undefined) {
      dataUpdate.mo_ta = dto.mo_ta ? dto.mo_ta.trim() : null;
    }
    if (dto.trang_thai !== undefined) {
      dataUpdate.trang_thai = dto.trang_thai;
    }

    const updated = await this.prisma.lop_hoc.update({
      where: { id },
      data: dataUpdate,
    });

    await this.ghiNhatKy(
      user.id,
      'SUA_LOP_HOC',
      id,
      JSON.stringify({ ten_lop: lop.ten_lop, gvcn_id: lop.gvcn_id }),
      JSON.stringify({ ten_lop: updated.ten_lop, gvcn_id: updated.gvcn_id }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật thông tin lớp học thành công.',
      du_lieu: updated,
    };
  }

  async xoaLopHoc(id: string, user: any, ip?: string, userAgent?: string) {
    const lop = await this.prisma.lop_hoc.findUnique({
      where: { id },
      include: {
        _count: { select: { hoc_sinh: { where: { da_xoa: false } } } },
      },
    });

    if (!lop) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }

    if (lop._count.hoc_sinh > 0) {
      throw new BadRequestException(
        `Không thể xóa lớp học đang có ${lop._count.hoc_sinh} học sinh. Vui lòng chuyển học sinh sang lớp khác trước.`,
      );
    }

    await this.prisma.lop_hoc.delete({ where: { id } });

    await this.ghiNhatKy(
      user.id,
      'XOA_LOP_HOC',
      id,
      JSON.stringify({ ten_lop: lop.ten_lop }),
      null,
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa lớp học thành công.',
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
          doi_tuong: 'lop_hoc',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống lớp học:', e);
    }
  }
}
