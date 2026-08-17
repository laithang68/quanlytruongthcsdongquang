import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaoAlbumDto } from './dto/tao-album.dto';
import { SuaAlbumDto } from './dto/sua-album.dto';

@Injectable()
export class AlbumService {
  constructor(private readonly db: PrismaService) {}

  private generateSlug(ten: string): string {
    const slug = ten
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
          doi_tuong: 'ALBUM',
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
        { ten: { contains: tuKhoa, mode: 'insensitive' } },
        { mo_ta: { contains: tuKhoa, mode: 'insensitive' } },
      ];
    }

    const [albums, tong_so] = await Promise.all([
      this.db.album.findMany({
        where,
        orderBy: { ngay_tao: 'desc' },
        skip,
        take: l,
        include: {
          album_tep_tin: {
            include: { tep_tin: true },
            orderBy: { thu_tu: 'asc' },
          },
          nguoi_tao: { select: { ho_ten: true } },
        },
      }),
      this.db.album.count({ where }),
    ]);

    const du_lieu = albums.map((al) => ({
      ...al,
      so_luong_anh: al.album_tep_tin.length,
      danh_sach_anh: al.album_tep_tin.map((at) => at.tep_tin),
    }));

    return {
      thanh_cong: true,
      du_lieu,
      tong_so,
      trang_hien_tai: p,
      tong_so_trang: Math.ceil(tong_so / l),
    };
  }

  async layChiTietPublic(id: string) {
    const album = await this.db.album.findFirst({
      where: { id, trang_thai: true },
      include: {
        album_tep_tin: {
          include: { tep_tin: true },
          orderBy: { thu_tu: 'asc' },
        },
        nguoi_tao: { select: { ho_ten: true } },
      },
    });

    if (!album) {
      throw new NotFoundException('Không tìm thấy album ảnh');
    }

    return {
      thanh_cong: true,
      du_lieu: {
        ...album,
        so_luong_anh: album.album_tep_tin.length,
        danh_sach_anh: album.album_tep_tin.map((at) => at.tep_tin),
      },
    };
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
        { ten: { contains: tuKhoa, mode: 'insensitive' } },
        { mo_ta: { contains: tuKhoa, mode: 'insensitive' } },
      ];
    }

    const [albums, tong_so] = await Promise.all([
      this.db.album.findMany({
        where,
        orderBy: { ngay_tao: 'desc' },
        skip,
        take: l,
        include: {
          album_tep_tin: { include: { tep_tin: true } },
          nguoi_tao: { select: { ho_ten: true } },
        },
      }),
      this.db.album.count({ where }),
    ]);

    const du_lieu = albums.map((al) => ({
      ...al,
      so_luong_anh: al.album_tep_tin.length,
      danh_sach_anh: al.album_tep_tin.map((at) => at.tep_tin),
    }));

    return {
      thanh_cong: true,
      du_lieu,
      tong_so,
      trang_hien_tai: p,
      tong_so_trang: Math.ceil(tong_so / l),
    };
  }

  async taoAlbum(dto: TaoAlbumDto, user: any) {
    const slug = this.generateSlug(dto.ten);

    const album = await this.db.album.create({
      data: {
        ten: dto.ten,
        slug,
        mo_ta: dto.mo_ta,
        anh_dai_dien: dto.anh_dai_dien,
        trang_thai: dto.trang_thai ?? true,
        nguoi_tao_id: user.id,
      },
    });

    if (dto.tep_tin_ids && dto.tep_tin_ids.length > 0) {
      await this.db.album_tep_tin.createMany({
        data: dto.tep_tin_ids.map((tep_tin_id, idx) => ({
          album_id: album.id,
          tep_tin_id,
          thu_tu: idx,
        })),
      });
    }

    await this.ghiAuditLog(user.id, 'TAO_ALBUM', album.id, null, album);

    return { thanh_cong: true, thong_bao: 'Tạo album ảnh thành công', du_lieu: album };
  }

  async suaAlbum(id: string, dto: SuaAlbumDto, user: any) {
    const item = await this.db.album.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy album ảnh');

    const dataUpdate: any = {
      ten: dto.ten,
      mo_ta: dto.mo_ta,
      anh_dai_dien: dto.anh_dai_dien,
      trang_thai: dto.trang_thai,
    };
    if (dto.ten && dto.ten !== item.ten) {
      dataUpdate.slug = this.generateSlug(dto.ten);
    }

    const album = await this.db.album.update({
      where: { id },
      data: dataUpdate,
    });

    if (dto.tep_tin_ids) {
      await this.db.album_tep_tin.deleteMany({ where: { album_id: id } });
      if (dto.tep_tin_ids.length > 0) {
        await this.db.album_tep_tin.createMany({
          data: dto.tep_tin_ids.map((tep_tin_id, idx) => ({
            album_id: id,
            tep_tin_id,
            thu_tu: idx,
          })),
        });
      }
    }

    await this.ghiAuditLog(user.id, 'SUA_ALBUM', id, item, album);

    return { thanh_cong: true, thong_bao: 'Cập nhật album ảnh thành công', du_lieu: album };
  }

  async doiTrangThai(id: string, trang_thai: boolean, user: any) {
    const item = await this.db.album.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy album ảnh');

    const album = await this.db.album.update({
      where: { id },
      data: { trang_thai },
    });

    await this.ghiAuditLog(user.id, 'DOI_TRANG_THAI_ALBUM', id, { trang_thai: item.trang_thai }, { trang_thai });

    return { thanh_cong: true, thong_bao: 'Đổi trạng thái thành công', du_lieu: album };
  }

  async xoaAlbum(id: string, user: any) {
    const item = await this.db.album.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy album ảnh');

    await this.db.album.delete({ where: { id } });

    await this.ghiAuditLog(user.id, 'XOA_ALBUM', id, item, null);

    return { thanh_cong: true, thong_bao: 'Xóa album ảnh thành công' };
  }
}
