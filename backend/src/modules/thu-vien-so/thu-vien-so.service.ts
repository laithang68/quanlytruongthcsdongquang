import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaoTaiLieuDto } from './dto/tao-tai-lieu.dto';
import { SuaTaiLieuDto } from './dto/sua-tai-lieu.dto';

@Injectable()
export class ThuVienSoService {
  constructor(private readonly db: PrismaService) {}

  private async ghiAuditLog(userId: string, hanhDong: string, doiTuongId: string, noiDungCu?: any, noiDungMoi?: any) {
    try {
      await this.db.nhat_ky_he_thong.create({
        data: {
          nguoi_dung_id: userId,
          hanh_dong: hanhDong,
          doi_tuong: 'TAI_LIEU_SO',
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
  // -------------------------------------------------------------
  // PUBLIC APIs
  // -------------------------------------------------------------
  async layDanhSachPublic(tuKhoa?: string, danhMucId?: string, danhMucSlug?: string, page?: string, limit?: string) {
    const p = Math.max(1, parseInt(page || '1', 10));
    const l = Math.max(1, parseInt(limit || '10', 10));
    const skip = (p - 1) * l;

    const where: any = {
      trang_thai: true,
      da_xoa: false,
      doi_tuong: 'CONG_KHAI',
    };

    if (tuKhoa) {
      where.OR = [
        { ten_tai_lieu: { contains: tuKhoa, mode: 'insensitive' } },
        { mo_ta: { contains: tuKhoa, mode: 'insensitive' } },
        { tac_gia: { contains: tuKhoa, mode: 'insensitive' } },
      ];
    }

    if (danhMucSlug) {
      where.danh_muc_tai_lieu = { ma: danhMucSlug };
    } else if (danhMucId) {
      where.danh_muc_tai_lieu_id = danhMucId;
    }

    const [du_lieu, tong_so] = await Promise.all([
      this.db.tai_lieu.findMany({
        where,
        orderBy: { ngay_tao: 'desc' },
        skip,
        take: l,
        include: {
          danh_muc_tai_lieu: true,
          tep_tin: true,
          nguoi_tao: { select: { ho_ten: true } },
        },
      }),
      this.db.tai_lieu.count({ where }),
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
    const item = await this.db.tai_lieu.findFirst({
      where: { id, trang_thai: true, da_xoa: false },
      include: {
        danh_muc_tai_lieu: true,
        tep_tin: true,
        nguoi_tao: { select: { ho_ten: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy tài liệu số');
    }

    // Tăng lượt tải/xem
    await this.db.tai_lieu.update({
      where: { id },
      data: { luot_tai: { increment: 1 } },
    });

    return { thanh_cong: true, du_lieu: item };
  }

  async layDanhSachDanhMucPublic() {
    const CHUAN_6_DANH_MUC = [
      { ten: 'Tài liệu tham khảo', ma: 'tai-lieu-tham-khao', mo_ta: 'Các bộ tài liệu tham khảo chung môn học' },
      { ten: 'Sách giáo khoa điện tử', ma: 'sach-giao-khoa-dien-tu', mo_ta: 'Sách giáo khoa điện tử các khối 6, 7, 8, 9' },
      { ten: 'Sách tham khảo', ma: 'sach-tham-khao', mo_ta: 'Sách tham khảo bổ trợ nâng cao' },
      { ten: 'Tài liệu ôn HSG', ma: 'tai-lieu-on-hsg', mo_ta: 'Bộ đề thi và tài liệu bồi dưỡng học sinh giỏi' },
      { ten: 'Thư viện bài giảng', ma: 'thu-vien-bai-giang', mo_ta: 'Bài giảng điện tử PowerPoint & kho học liệu số' },
      { ten: 'Thư viện giáo án', ma: 'thu-vien-giao-an', mo_ta: 'Giáo án điện tử và kế hoạch bài dạy' },
    ];

    // Khởi tạo/Đồng bộ 6 danh mục chuẩn bằng ma
    for (const dm of CHUAN_6_DANH_MUC) {
      await this.db.danh_muc_tai_lieu.upsert({
        where: { ma: dm.ma },
        update: { ten: dm.ten, mo_ta: dm.mo_ta },
        create: { ten: dm.ten, ma: dm.ma, mo_ta: dm.mo_ta },
      });
    }

    const du_lieu = await this.db.danh_muc_tai_lieu.findMany({
      orderBy: { ngay_tao: 'asc' },
    });

    return { thanh_cong: true, du_lieu };
  }

  // -------------------------------------------------------------
  // ADMIN APIs
  // -------------------------------------------------------------
  async layDanhSachAdmin(tuKhoa?: string, danhMucId?: string, danhMucSlug?: string, page?: string, limit?: string) {
    const p = Math.max(1, parseInt(page || '1', 10));
    const l = Math.max(1, parseInt(limit || '10', 10));
    const skip = (p - 1) * l;

    const where: any = { da_xoa: false };
    if (tuKhoa) {
      where.OR = [
        { ten_tai_lieu: { contains: tuKhoa, mode: 'insensitive' } },
        { mo_ta: { contains: tuKhoa, mode: 'insensitive' } },
        { tac_gia: { contains: tuKhoa, mode: 'insensitive' } },
      ];
    }
    if (danhMucSlug) {
      where.danh_muc_tai_lieu = { ma: danhMucSlug };
    } else if (danhMucId) {
      where.danh_muc_tai_lieu_id = danhMucId;
    }

    const [du_lieu, tong_so] = await Promise.all([
      this.db.tai_lieu.findMany({
        where,
        orderBy: { ngay_tao: 'desc' },
        skip,
        take: l,
        include: {
          danh_muc_tai_lieu: true,
          tep_tin: true,
          nguoi_tao: { select: { ho_ten: true } },
        },
      }),
      this.db.tai_lieu.count({ where }),
    ]);

    return {
      thanh_cong: true,
      du_lieu,
      tong_so,
      trang_hien_tai: p,
      tong_so_trang: Math.ceil(tong_so / l),
    };
  }

  async taoTaiLieu(dto: TaoTaiLieuDto, user: any) {
    const item = await this.db.tai_lieu.create({
      data: {
        ten_tai_lieu: dto.ten_tai_lieu,
        mo_ta: dto.mo_ta,
        danh_muc_tai_lieu_id: dto.danh_muc_tai_lieu_id,
        tac_gia: dto.tac_gia?.trim() || user?.ho_ten || user?.email || 'Ban Chuyên môn',
        doi_tuong: dto.doi_tuong || 'CONG_KHAI',
        tep_tin_id: dto.tep_tin_id,
        duong_dan_lien_ket: dto.duong_dan_lien_ket,
        anh_thumb: dto.anh_thumb,
        trang_thai: dto.trang_thai ?? true,
        nguoi_tao_id: user.id,
      },
    });

    await this.ghiAuditLog(user.id, 'TAO_TAI_LIEU_SO', item.id, null, item);

    return { thanh_cong: true, thong_bao: 'Tạo tài liệu số thành công', du_lieu: item };
  }

  async suaTaiLieu(id: string, dto: SuaTaiLieuDto, user: any) {
    const item = await this.db.tai_lieu.findFirst({ where: { id, da_xoa: false } });
    if (!item) throw new NotFoundException('Không tìm thấy tài liệu số');

    const updated = await this.db.tai_lieu.update({
      where: { id },
      data: { ...dto },
    });

    await this.ghiAuditLog(user.id, 'SUA_TAI_LIEU_SO', id, item, updated);

    return { thanh_cong: true, thong_bao: 'Cập nhật tài liệu thành công', du_lieu: updated };
  }

  async doiTrangThai(id: string, trang_thai: boolean, user: any) {
    const item = await this.db.tai_lieu.findFirst({ where: { id, da_xoa: false } });
    if (!item) throw new NotFoundException('Không tìm thấy tài liệu số');

    const updated = await this.db.tai_lieu.update({
      where: { id },
      data: { trang_thai },
    });

    await this.ghiAuditLog(user.id, 'DOI_TRANG_THAI_TAI_LIEU_SO', id, { trang_thai: item.trang_thai }, { trang_thai });

    return { thanh_cong: true, thong_bao: 'Đổi trạng thái thành công', du_lieu: updated };
  }

  async xoaTaiLieu(id: string, user: any) {
    const item = await this.db.tai_lieu.findFirst({ where: { id, da_xoa: false } });
    if (!item) throw new NotFoundException('Không tìm thấy tài liệu số');

    await this.db.tai_lieu.update({
      where: { id },
      data: { da_xoa: true, ngay_xoa: new Date(), trang_thai: false },
    });

    await this.ghiAuditLog(user.id, 'XOA_TAI_LIEU_SO', id, item, null);

    return { thanh_cong: true, thong_bao: 'Xóa tài liệu thành công' };
  }
}
