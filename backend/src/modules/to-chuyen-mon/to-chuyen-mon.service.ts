import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaoToChuyenMonDto } from './dto/tao-to-chuyen-mon.dto';
import { SuaToChuyenMonDto } from './dto/sua-to-chuyen-mon.dto';

@Injectable()
export class ToChuyenMonService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach() {
    const list = await this.prisma.to_chuyen_mon.findMany({
      orderBy: { ten: 'asc' },
      include: {
        _count: {
          select: { giao_vien: { where: { da_xoa: false } } },
        },
      },
    });

    // Lấy thông tin Tổ trưởng chuyên môn (chỉ lấy nếu giáo viên chưa bị xóa mềm)
    const result = await Promise.all(
      list.map(async (t) => {
        let truong_to: any = null;
        if (t.truong_to_id) {
          truong_to = await this.prisma.giao_vien.findFirst({
            where: { id: t.truong_to_id, da_xoa: false },
            select: { id: true, ho_ten: true, chuc_vu: true, anh_dai_dien: true },
          });
        }
        return {
          ...t,
          so_luong_giao_vien: t._count.giao_vien,
          truong_to,
        };
      }),
    );

    return {
      thanh_cong: true,
      du_lieu: result,
    };
  }

  async layChiTiet(id: string) {
    const to = await this.prisma.to_chuyen_mon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { giao_vien: { where: { da_xoa: false } } },
        },
      },
    });

    if (!to) {
      throw new NotFoundException('Không tìm thấy tổ chuyên môn.');
    }

    let truong_to: any = null;
    if (to.truong_to_id) {
      truong_to = await this.prisma.giao_vien.findFirst({
        where: { id: to.truong_to_id, da_xoa: false },
        select: { id: true, ho_ten: true, chuc_vu: true, anh_dai_dien: true },
      });
    }

    return {
      thanh_cong: true,
      du_lieu: {
        ...to,
        so_luong_giao_vien: to._count.giao_vien,
        truong_to,
      },
    };
  }

  async layDanhSachGiaoVien(id: string) {
    const to = await this.prisma.to_chuyen_mon.findUnique({ where: { id } });
    if (!to) {
      throw new NotFoundException('Không tìm thấy tổ chuyên môn.');
    }

    const danhSachGiaoVien = await this.prisma.giao_vien.findMany({
      where: {
        to_chuyen_mon_id: id,
        trang_thai: true,
        da_xoa: false,
      },
      orderBy: { ho_ten: 'asc' },
      select: {
        id: true,
        ho_ten: true,
        anh_dai_dien: true,
        chuc_vu: true,
        trinh_do: true,
        gioi_thieu: true,
        to_chuyen_mon_id: true,
      },
    });

    return {
      thanh_cong: true,
      du_lieu: danhSachGiaoVien,
    };
  }

  async taoToChuyenMon(dto: TaoToChuyenMonDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.ten || !dto.ten.trim()) {
      throw new BadRequestException('Tên tổ chuyên môn không được để trống.');
    }

    const existing = await this.prisma.to_chuyen_mon.findFirst({
      where: { ten: { equals: dto.ten.trim(), mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException('Tên tổ chuyên môn đã tồn tại trong hệ thống.');
    }

    const newTo = await this.prisma.to_chuyen_mon.create({
      data: {
        ten: dto.ten.trim(),
        mo_ta: dto.mo_ta ? dto.mo_ta.trim() : null,
      },
    });

    await this.ghiNhatKy(
      user.id,
      'TAO_TO_CHUYEN_MON',
      newTo.id,
      null,
      JSON.stringify({ ten: newTo.ten }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo tổ chuyên môn mới thành công.',
      du_lieu: newTo,
    };
  }

  async suaToChuyenMon(id: string, dto: SuaToChuyenMonDto, user: any, ip?: string, userAgent?: string) {
    const to = await this.prisma.to_chuyen_mon.findUnique({ where: { id } });
    if (!to) {
      throw new NotFoundException('Không tìm thấy tổ chuyên môn.');
    }

    const dataUpdate: any = {};

    if (dto.ten && dto.ten.trim()) {
      const existing = await this.prisma.to_chuyen_mon.findFirst({
        where: {
          ten: { equals: dto.ten.trim(), mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException('Tên tổ chuyên môn đã trùng với tổ khác.');
      }
      dataUpdate.ten = dto.ten.trim();
    }

    if (dto.mo_ta !== undefined) {
      dataUpdate.mo_ta = dto.mo_ta ? dto.mo_ta.trim() : null;
    }

    if (dto.truong_to_id !== undefined) {
      if (dto.truong_to_id && dto.truong_to_id.trim()) {
        const targetId = dto.truong_to_id.trim();

        // 1. Kiểm tra giáo viên có tồn tại trong cơ sở dữ liệu không
        const gvFull = await this.prisma.giao_vien.findUnique({
          where: { id: targetId },
        });

        if (!gvFull) {
          throw new BadRequestException('Giáo viên được chọn làm Tổ trưởng không tồn tại.');
        }

        // 2. Chặn giáo viên đã bị xóa mềm (da_xoa = true) làm Tổ trưởng (Mục 6)
        if (gvFull.da_xoa) {
          throw new BadRequestException('Không thể chọn giáo viên đã bị xóa mềm làm Tổ trưởng.');
        }

        // 3. Chặn giáo viên thuộc tổ khác làm Tổ trưởng tổ này (Mục 2)
        if (gvFull.to_chuyen_mon_id !== id) {
          throw new BadRequestException(
            'Giáo viên được chọn làm Tổ trưởng phải thuộc chính tổ chuyên môn này.',
          );
        }

        dataUpdate.truong_to_id = targetId;
      } else {
        dataUpdate.truong_to_id = null;
      }
    }

    const updated = await this.prisma.to_chuyen_mon.update({
      where: { id },
      data: dataUpdate,
    });

    const isAssigningLeader = dto.truong_to_id !== undefined && dto.truong_to_id !== to.truong_to_id;
    const action = isAssigningLeader ? 'GAN_TO_TRUONG' : 'SUA_TO_CHUYEN_MON';

    await this.ghiNhatKy(
      user.id,
      action,
      id,
      JSON.stringify({ ten: to.ten, truong_to_id: to.truong_to_id }),
      JSON.stringify({ ten: updated.ten, truong_to_id: updated.truong_to_id }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật thông tin tổ chuyên môn thành công.',
      du_lieu: updated,
    };
  }

  async xoaToChuyenMon(id: string, user: any, ip?: string, userAgent?: string) {
    const to = await this.prisma.to_chuyen_mon.findUnique({
      where: { id },
      include: {
        _count: { select: { giao_vien: { where: { da_xoa: false } } } },
      },
    });

    if (!to) {
      throw new NotFoundException('Không tìm thấy tổ chuyên môn.');
    }

    if (to._count.giao_vien > 0) {
      throw new BadRequestException(
        `Không thể xóa tổ chuyên môn đang chứa ${to._count.giao_vien} giáo viên. Vui lòng chuyển giáo viên sang tổ khác trước.`,
      );
    }

    await this.prisma.to_chuyen_mon.delete({ where: { id } });

    await this.ghiNhatKy(
      user.id,
      'XOA_TO_CHUYEN_MON',
      id,
      JSON.stringify({ ten: to.ten }),
      null,
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa tổ chuyên môn thành công.',
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
          doi_tuong: 'to_chuyen_mon',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống tổ chuyên môn:', e);
    }
  }
}
