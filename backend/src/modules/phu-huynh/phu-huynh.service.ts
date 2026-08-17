import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaoPhuHuynhDto } from './dto/tao-phu-huynh.dto';
import { SuaPhuHuynhDto } from './dto/sua-phu-huynh.dto';
import { LienKetPhuHuynhDto } from './dto/lien-ket-phu-huynh.dto';

@Injectable()
export class PhuHuynhService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(tuKhoa?: string, page: string = '1', limit: string = '10') {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      da_xoa: false,
    };

    if (tuKhoa && tuKhoa.trim()) {
      const keyword = tuKhoa.trim();
      where.OR = [
        { ho_ten: { contains: keyword, mode: 'insensitive' } },
        { so_dien_thoai: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.phu_huynh.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { ho_ten: 'asc' },
        include: {
          phu_huynh_hoc_sinh: {
            include: {
              hoc_sinh: {
                select: {
                  id: true,
                  ma_hoc_sinh: true,
                  ho_ten: true,
                  lop_hoc: { select: { id: true, ten_lop: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.phu_huynh.count({ where }),
    ]);

    return {
      thanh_cong: true,
      du_lieu: danhSach,
      tong_so: tongSo,
      trang: pageNum,
      limit: limitNum,
      tong_so_trang: Math.ceil(tongSo / limitNum),
    };
  }

  async layChiTiet(id: string) {
    const ph = await this.prisma.phu_huynh.findFirst({
      where: { id, da_xoa: false },
      include: {
        phu_huynh_hoc_sinh: {
          include: {
            hoc_sinh: {
              include: {
                lop_hoc: { select: { id: true, ten_lop: true, khoi: true, nam_hoc: true } },
              },
            },
          },
        },
      },
    });

    if (!ph) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh.');
    }

    return {
      thanh_cong: true,
      du_lieu: ph,
    };
  }

  async taoPhuHuynh(dto: TaoPhuHuynhDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.ho_ten || !dto.ho_ten.trim()) {
      throw new BadRequestException('Họ tên phụ huynh không được để trống.');
    }

    const phMoi = await this.prisma.phu_huynh.create({
      data: {
        ho_ten: dto.ho_ten.trim(),
        so_dien_thoai: dto.so_dien_thoai ? dto.so_dien_thoai.trim() : null,
        email: dto.email ? dto.email.trim() : null,
        dia_chi: dto.dia_chi ? dto.dia_chi.trim() : null,
        trang_thai: dto.trang_thai !== undefined ? dto.trang_thai : true,
      },
    });

    await this.ghiNhatKy(
      user.id,
      'TAO_PHU_HUYNH',
      phMoi.id,
      null,
      JSON.stringify({ ho_ten: phMoi.ho_ten, so_dien_thoai: phMoi.so_dien_thoai }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo hồ sơ phụ huynh mới thành công.',
      du_lieu: phMoi,
    };
  }

  async suaPhuHuynh(id: string, dto: SuaPhuHuynhDto, user: any, ip?: string, userAgent?: string) {
    const ph = await this.prisma.phu_huynh.findFirst({ where: { id, da_xoa: false } });
    if (!ph) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh.');
    }

    const dataUpdate: any = {};

    if (dto.ho_ten && dto.ho_ten.trim()) {
      dataUpdate.ho_ten = dto.ho_ten.trim();
    }
    if (dto.so_dien_thoai !== undefined) {
      dataUpdate.so_dien_thoai = dto.so_dien_thoai ? dto.so_dien_thoai.trim() : null;
    }
    if (dto.email !== undefined) {
      dataUpdate.email = dto.email ? dto.email.trim() : null;
    }
    if (dto.dia_chi !== undefined) {
      dataUpdate.dia_chi = dto.dia_chi ? dto.dia_chi.trim() : null;
    }
    if (dto.trang_thai !== undefined) {
      dataUpdate.trang_thai = dto.trang_thai;
    }

    const updated = await this.prisma.phu_huynh.update({
      where: { id },
      data: dataUpdate,
    });

    await this.ghiNhatKy(
      user.id,
      'SUA_PHU_HUYNH',
      id,
      JSON.stringify({ ho_ten: ph.ho_ten }),
      JSON.stringify({ ho_ten: updated.ho_ten }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật thông tin phụ huynh thành công.',
      du_lieu: updated,
    };
  }

  // LIÊN KẾT PHỤ HUYNH VỚI HỌC SINH
  async lienKetPhuHuynhHocSinh(dto: LienKetPhuHuynhDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.phu_huynh_id || !dto.hoc_sinh_id) {
      throw new BadRequestException('Vui lòng chọn phụ huynh và học sinh cần liên kết.');
    }

    const ph = await this.prisma.phu_huynh.findFirst({ where: { id: dto.phu_huynh_id, da_xoa: false } });
    if (!ph) throw new BadRequestException('Phụ huynh không tồn tại hoặc đã bị xóa.');

    const hs = await this.prisma.hoc_sinh.findFirst({ where: { id: dto.hoc_sinh_id, da_xoa: false } });
    if (!hs) throw new BadRequestException('Học sinh không tồn tại hoặc đã bị xóa.');

    const link = await this.prisma.phu_huynh_hoc_sinh.upsert({
      where: {
        phu_huynh_id_hoc_sinh_id: {
          phu_huynh_id: dto.phu_huynh_id,
          hoc_sinh_id: dto.hoc_sinh_id,
        },
      },
      update: {
        quan_he: dto.quan_he || 'Bố/Mẹ',
        la_nguoi_giam_ho_chinh: dto.la_nguoi_giam_ho_chinh !== undefined ? dto.la_nguoi_giam_ho_chinh : true,
      },
      create: {
        phu_huynh_id: dto.phu_huynh_id,
        hoc_sinh_id: dto.hoc_sinh_id,
        quan_he: dto.quan_he || 'Bố/Mẹ',
        la_nguoi_giam_ho_chinh: dto.la_nguoi_giam_ho_chinh !== undefined ? dto.la_nguoi_giam_ho_chinh : true,
      },
    });

    await this.ghiNhatKy(
      user.id,
      'LIEN_KET_PHU_HUYNH',
      dto.phu_huynh_id,
      null,
      JSON.stringify({ phu_huynh: ph.ho_ten, hoc_sinh: hs.ho_ten, quan_he: link.quan_he }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: `Liên kết phụ huynh ${ph.ho_ten} với học sinh ${hs.ho_ten} thành công.`,
      du_lieu: link,
    };
  }

  async xoaMem(id: string, user: any, ip?: string, userAgent?: string) {
    const ph = await this.prisma.phu_huynh.findFirst({ where: { id, da_xoa: false } });
    if (!ph) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh.');
    }

    const updated = await this.prisma.phu_huynh.update({
      where: { id },
      data: {
        da_xoa: true,
        ngay_xoa: new Date(),
      },
    });

    await this.ghiNhatKy(
      user.id,
      'XOA_PHU_HUYNH',
      id,
      JSON.stringify({ da_xoa: false }),
      JSON.stringify({ da_xoa: true, ngay_xoa: updated.ngay_xoa }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa mềm thông tin phụ huynh thành công.',
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
          doi_tuong: 'phu_huynh',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống phụ huynh:', e);
    }
  }
}
