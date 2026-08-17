import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaoGioiThieuDto } from './dto/tao-gioi-thieu.dto';
import { CapNhatGioiThieuDto } from './dto/cap-nhat-gioi-thieu.dto';

@Injectable()
export class GioiThieuService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Public API: Lấy bản ghi hiển thị mới nhất cho trang công khai
  async layGioiThieuCongKhai() {
    const item = await this.prisma.gioi_thieu.findFirst({
      where: {
        trang_thai: true,
        da_xoa: false,
      },
      orderBy: {
        ngay_cap_nhat: 'desc',
      },
      select: {
        id: true,
        tieu_de_chinh: true,
        tieu_de_phu: true,
        anh_nen: true,
        noi_dung_chinh: true,
        ngay_cap_nhat: true,
      },
    });

    return {
      thanh_cong: true,
      du_lieu: item || null,
    };
  }

  // 2. Admin API: Danh sách bản ghi quản trị
  async layDanhSachQuanTri(page = 1, limit = 10, tuKhoa?: string, trangThai?: string) {
    const skip = (page - 1) * limit;
    const where: any = { da_xoa: false };

    if (tuKhoa && tuKhoa.trim()) {
      const keyword = tuKhoa.trim();
      where.OR = [
        { tieu_de_chinh: { contains: keyword, mode: 'insensitive' } },
        { tieu_de_phu: { contains: keyword, mode: 'insensitive' } },
        { noi_dung_chinh: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (trangThai === 'true') where.trang_thai = true;
    if (trangThai === 'false') where.trang_thai = false;

    const [items, total] = await Promise.all([
      this.prisma.gioi_thieu.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_cap_nhat: 'desc' },
        include: {
          nguoi_tao: {
            select: { id: true, ho_ten: true, email: true },
          },
        },
      }),
      this.prisma.gioi_thieu.count({ where }),
    ]);

    return {
      thanh_cong: true,
      du_lieu: items,
      tong_so: total,
      trang: page,
      tong_so_trang: Math.ceil(total / limit) || 1,
    };
  }

  // 3. Admin API: Chi tiết bản ghi
  async layChiTiet(id: string) {
    const item = await this.prisma.gioi_thieu.findFirst({
      where: { id, da_xoa: false },
      include: {
        nguoi_tao: {
          select: { id: true, ho_ten: true, email: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy nội dung giới thiệu yêu cầu.');
    }

    return {
      thanh_cong: true,
      du_lieu: item,
    };
  }

  // 4. Admin API: Tạo mới
  async taoMoi(user: any, dto: TaoGioiThieuDto) {
    const item = await this.prisma.gioi_thieu.create({
      data: {
        tieu_de_chinh: dto.tieu_de_chinh.trim(),
        tieu_de_phu: dto.tieu_de_phu?.trim() || null,
        anh_nen: dto.anh_nen?.trim() || null,
        noi_dung_chinh: dto.noi_dung_chinh,
        trang_thai: dto.trang_thai !== undefined ? dto.trang_thai : true,
        nguoi_tao_id: user.id,
      },
    });

    return {
      thanh_cong: true,
      thong_bao: 'Tạo mới nội dung giới thiệu thành công',
      du_lieu: item,
    };
  }

  // 5. Admin API: Cập nhật
  async capNhat(id: string, dto: CapNhatGioiThieuDto) {
    await this.layChiTiet(id);

    const item = await this.prisma.gioi_thieu.update({
      where: { id },
      data: {
        ...(dto.tieu_de_chinh !== undefined && { tieu_de_chinh: dto.tieu_de_chinh.trim() }),
        ...(dto.tieu_de_phu !== undefined && { tieu_de_phu: dto.tieu_de_phu ? dto.tieu_de_phu.trim() : null }),
        ...(dto.anh_nen !== undefined && { anh_nen: dto.anh_nen ? dto.anh_nen.trim() : null }),
        ...(dto.noi_dung_chinh !== undefined && { noi_dung_chinh: dto.noi_dung_chinh }),
        ...(dto.trang_thai !== undefined && { trang_thai: dto.trang_thai }),
      },
    });

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật nội dung giới thiệu thành công',
      du_lieu: item,
    };
  }

  // 6. Admin API: Đổi trạng thái Bật/Tắt Hiển thị
  async doiTrangThai(id: string, trangThai?: boolean) {
    const item = await this.layChiTiet(id);
    const newStatus = trangThai !== undefined ? trangThai : !item.du_lieu.trang_thai;

    const updated = await this.prisma.gioi_thieu.update({
      where: { id },
      data: { trang_thai: newStatus },
    });

    return {
      thanh_cong: true,
      thong_bao: `Đã ${newStatus ? 'hiển thị' : 'ẩn'} nội dung giới thiệu`,
      du_lieu: updated,
    };
  }

  // 7. Admin API: Xóa mềm
  async xoaMem(id: string) {
    await this.layChiTiet(id);

    await this.prisma.gioi_thieu.update({
      where: { id },
      data: {
        da_xoa: true,
        ngay_xoa: new Date(),
      },
    });

    return {
      thanh_cong: true,
      thong_bao: 'Đã xóa nội dung giới thiệu',
    };
  }
}
