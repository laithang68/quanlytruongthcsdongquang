import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaoTruyCapNhanhDto } from './dto/tao-truy-cap-nhanh.dto';
import { SuaTruyCapNhanhDto } from './dto/sua-truy-cap-nhanh.dto';

@Injectable()
export class TruyCapNhanhService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Trang chủ)
  // -------------------------------------------------------------

  async layDanhSachPublic() {
    const list = await this.prisma.truy_cap_nhanh.findMany({
      where: { trang_thai: true },
      orderBy: [{ thu_tu: 'asc' }, { ngay_tao: 'asc' }],
    });

    return {
      thanh_cong: true,
      du_lieu: list,
    };
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Quản trị CMS)
  // -------------------------------------------------------------

  async layDanhSachAdmin() {
    const list = await this.prisma.truy_cap_nhanh.findMany({
      orderBy: [{ thu_tu: 'asc' }, { ngay_tao: 'asc' }],
    });

    return {
      thanh_cong: true,
      du_lieu: list,
      tong_so: list.length,
    };
  }

  async layChiTietAdmin(id: string) {
    const item = await this.prisma.truy_cap_nhanh.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy liên kết truy cập nhanh.');
    }

    return {
      thanh_cong: true,
      du_lieu: item,
    };
  }

  async taoTruyCapNhanh(dto: TaoTruyCapNhanhDto, user?: any, ip?: string, userAgent?: string) {
    if (!dto.ten || !dto.ten.trim()) {
      throw new BadRequestException('Tên liên kết không được để trống.');
    }

    if (!dto.anh || !dto.anh.trim()) {
      throw new BadRequestException('Hình ảnh banner không được để trống.');
    }

    if (!dto.url || !dto.url.trim()) {
      throw new BadRequestException('Đường dẫn URL liên kết không được để trống.');
    }

    const itemMoi = await this.prisma.truy_cap_nhanh.create({
      data: {
        ten: dto.ten.trim(),
        anh: dto.anh.trim(),
        url: dto.url.trim(),
        thu_tu: dto.thu_tu !== undefined ? Number(dto.thu_tu) : 0,
        trang_thai: dto.trang_thai !== undefined ? Boolean(dto.trang_thai) : true,
      },
    });

    if (user?.id) {
      await this.ghiNhatKy(
        user.id,
        'TAO_TRUY_CAP_NHANH',
        itemMoi.id,
        null,
        JSON.stringify({ ten: itemMoi.ten, url: itemMoi.url }),
        ip,
        userAgent,
      );
    }

    return {
      thanh_cong: true,
      thong_bao: 'Tạo liên kết truy cập nhanh thành công.',
      du_lieu: itemMoi,
    };
  }

  async suaTruyCapNhanh(id: string, dto: SuaTruyCapNhanhDto, user?: any, ip?: string, userAgent?: string) {
    const itemCu = await this.prisma.truy_cap_nhanh.findUnique({
      where: { id },
    });

    if (!itemCu) {
      throw new NotFoundException('Không tìm thấy liên kết truy cập nhanh.');
    }

    const dataUpdate: any = {};

    if (dto.ten !== undefined) {
      if (!dto.ten.trim()) throw new BadRequestException('Tên liên kết không được để trống.');
      dataUpdate.ten = dto.ten.trim();
    }

    if (dto.anh !== undefined) {
      if (!dto.anh.trim()) throw new BadRequestException('Hình ảnh banner không được để trống.');
      dataUpdate.anh = dto.anh.trim();
    }

    if (dto.url !== undefined) {
      if (!dto.url.trim()) throw new BadRequestException('Đường dẫn URL liên kết không được để trống.');
      dataUpdate.url = dto.url.trim();
    }

    if (dto.thu_tu !== undefined) {
      dataUpdate.thu_tu = Number(dto.thu_tu);
    }

    if (dto.trang_thai !== undefined) {
      dataUpdate.trang_thai = Boolean(dto.trang_thai);
    }

    const itemCapNhat = await this.prisma.truy_cap_nhanh.update({
      where: { id },
      data: dataUpdate,
    });

    if (user?.id) {
      await this.ghiNhatKy(
        user.id,
        'SUA_TRUY_CAP_NHANH',
        id,
        JSON.stringify({ ten: itemCu.ten, url: itemCu.url, trang_thai: itemCu.trang_thai }),
        JSON.stringify({ ten: itemCapNhat.ten, url: itemCapNhat.url, trang_thai: itemCapNhat.trang_thai }),
        ip,
        userAgent,
      );
    }

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật liên kết truy cập nhanh thành công.',
      du_lieu: itemCapNhat,
    };
  }

  async xoaTruyCapNhanh(id: string, user?: any, ip?: string, userAgent?: string) {
    const itemCu = await this.prisma.truy_cap_nhanh.findUnique({
      where: { id },
    });

    if (!itemCu) {
      throw new NotFoundException('Không tìm thấy liên kết truy cập nhanh.');
    }

    await this.prisma.truy_cap_nhanh.delete({
      where: { id },
    });

    if (user?.id) {
      await this.ghiNhatKy(
        user.id,
        'XOA_TRUY_CAP_NHANH',
        id,
        JSON.stringify({ ten: itemCu.ten, url: itemCu.url }),
        null,
        ip,
        userAgent,
      );
    }

    return {
      thanh_cong: true,
      thong_bao: 'Xóa liên kết truy cập nhanh thành công.',
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
          doi_tuong: 'truy_cap_nhanh',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống truy cập nhanh:', e);
    }
  }
}
