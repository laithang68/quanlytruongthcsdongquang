import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaoVideoDto } from './dto/tao-video.dto';
import { SuaVideoDto } from './dto/sua-video.dto';

@Injectable()
export class VideoService {
  constructor(private readonly db: PrismaService) {}

  private generateSlug(tieuDe: string): string {
    const slug = tieuDe
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `${slug}-${Date.now().toString().slice(-4)}`;
  }

  private async ghiAuditLog(userId: string, hanhDong: string, doiTuongId: string, noiDungCu?: any, noiDungMoi?: any) {
    try {
      await this.db.nhat_ky_he_thong.create({
        data: {
          nguoi_dung_id: userId,
          hanh_dong: hanhDong,
          doi_tuong: 'VIDEO',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu ? JSON.stringify(noiDungCu) : null,
          noi_dung_moi: noiDungMoi ? JSON.stringify(noiDungMoi) : null,
        },
      });
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // PUBLIC APIs
  // -------------------------------------------------------------
  async layDanhSachPublic(page?: string, limit?: string, tuKhoa?: string) {
    const p = Math.max(1, parseInt(page || '1', 10));
    const l = Math.max(1, parseInt(limit || '12', 10));
    const skip = (p - 1) * l;

    const where: any = { trang_thai: true };
    if (tuKhoa) {
      where.OR = [
        { tieu_de: { contains: tuKhoa, mode: 'insensitive' } },
        { mo_ta: { contains: tuKhoa, mode: 'insensitive' } },
      ];
    }

    const [du_lieu, tong_so] = await Promise.all([
      this.db.video.findMany({
        where,
        orderBy: { ngay_tao: 'desc' },
        skip,
        take: l,
        include: {
          nguoi_tao: { select: { ho_ten: true } },
        },
      }),
      this.db.video.count({ where }),
    ]);

    return {
      thanh_cong: true,
      du_lieu,
      tong_so,
      trang_hien_tai: p,
      tong_so_trang: Math.ceil(tong_so / l),
    };
  }

  async layChiTietPublic(id: string) {
    const item = await this.db.video.findFirst({
      where: { id, trang_thai: true },
      include: {
        nguoi_tao: { select: { ho_ten: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy video');
    }

    // Tăng lượt xem
    await this.db.video.update({
      where: { id },
      data: { luot_xem: { increment: 1 } },
    });

    return { thanh_cong: true, du_lieu: item };
  }

  // -------------------------------------------------------------
  // ADMIN APIs
  // -------------------------------------------------------------
  async layDanhSachAdmin(tuKhoa?: string, page?: string, limit?: string) {
    const p = Math.max(1, parseInt(page || '1', 10));
    const l = Math.max(1, parseInt(limit || '10', 10));
    const skip = (p - 1) * l;

    const where: any = {};
    if (tuKhoa) {
      where.OR = [
        { tieu_de: { contains: tuKhoa, mode: 'insensitive' } },
        { mo_ta: { contains: tuKhoa, mode: 'insensitive' } },
      ];
    }

    const [du_lieu, tong_so] = await Promise.all([
      this.db.video.findMany({
        where,
        orderBy: { ngay_tao: 'desc' },
        skip,
        take: l,
        include: {
          nguoi_tao: { select: { ho_ten: true } },
        },
      }),
      this.db.video.count({ where }),
    ]);

    return {
      thanh_cong: true,
      du_lieu,
      tong_so,
      trang_hien_tai: p,
      tong_so_trang: Math.ceil(tong_so / l),
    };
  }

  async taoVideo(dto: TaoVideoDto, user: any) {
    const slug = this.generateSlug(dto.tieu_de);

    const video = await this.db.video.create({
      data: {
        tieu_de: dto.tieu_de,
        slug,
        mo_ta: dto.mo_ta,
        url_video: dto.url_video,
        anh_thumbnail: dto.anh_thumbnail,
        trang_thai: dto.trang_thai ?? true,
        nguoi_tao_id: user.id,
      },
    });

    await this.ghiAuditLog(user.id, 'TAO_VIDEO', video.id, null, video);

    return { thanh_cong: true, thong_bao: 'Tạo video thành công', du_lieu: video };
  }

  async suaVideo(id: string, dto: SuaVideoDto, user: any) {
    const item = await this.db.video.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy video');

    const dataUpdate: any = { ...dto };
    if (dto.tieu_de && dto.tieu_de !== item.tieu_de) {
      dataUpdate.slug = this.generateSlug(dto.tieu_de);
    }

    const video = await this.db.video.update({
      where: { id },
      data: dataUpdate,
    });

    await this.ghiAuditLog(user.id, 'SUA_VIDEO', id, item, video);

    return { thanh_cong: true, thong_bao: 'Cập nhật video thành công', du_lieu: video };
  }

  async doiTrangThai(id: string, trang_thai: boolean, user: any) {
    const item = await this.db.video.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy video');

    const video = await this.db.video.update({
      where: { id },
      data: { trang_thai },
    });

    await this.ghiAuditLog(user.id, 'DOI_TRANG_THAI_VIDEO', id, { trang_thai: item.trang_thai }, { trang_thai });

    return { thanh_cong: true, thong_bao: 'Đổi trạng thái thành công', du_lieu: video };
  }

  async xoaVideo(id: string, user: any) {
    const item = await this.db.video.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy video');

    await this.db.video.delete({ where: { id } });

    await this.ghiAuditLog(user.id, 'XOA_VIDEO', id, item, null);

    return { thanh_cong: true, thong_bao: 'Xóa video thành công' };
  }
}
