import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaoLienHeDto } from './dto/tao-lien-he.dto';
import { LayDanhSachLienHeDto } from './dto/lay-danh-sach-lien-he.dto';
import { CapNhatTrangThaiLienHeDto } from './dto/cap-nhat-trang-thai.dto';
import { TrangThaiLienHe } from '@prisma/client';
import { Response } from 'express';
import * as XLSX from 'xlsx';

@Injectable()
export class LienHeService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Công dân gửi phản ánh / liên hệ)
  // -------------------------------------------------------------
  async taoPublic(dto: TaoLienHeDto) {
    if (!dto.ho_ten || !dto.ho_ten.trim()) {
      throw new BadRequestException('Họ và tên không được để trống.');
    }

    if (!dto.so_dien_thoai || !dto.so_dien_thoai.trim()) {
      throw new BadRequestException('Số điện thoại không được để trống.');
    }

    // Validation định dạng số điện thoại Việt Nam căn bản
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    const cleanPhone = dto.so_dien_thoai.trim().replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      throw new BadRequestException('Số điện thoại không đúng định dạng hợp lệ.');
    }

    if (dto.email && dto.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email.trim())) {
        throw new BadRequestException('Địa chỉ Email không hợp lệ.');
      }
    }

    if (!dto.noi_dung || !dto.noi_dung.trim()) {
      throw new BadRequestException('Nội dung phản ánh không được để trống.');
    }

    const item = await this.prisma.lien_he.create({
      data: {
        ho_ten: dto.ho_ten.trim(),
        so_dien_thoai: cleanPhone,
        email: dto.email ? dto.email.trim() : null,
        noi_dung: dto.noi_dung.trim(),
        trang_thai: TrangThaiLienHe.MOI,
      },
    });

    return {
      thanh_cong: true,
      thong_bao: 'Gửi thông tin phản ánh thành công. Nhà trường đã tiếp nhận thông tin của bạn.',
      du_lieu: {
        id: item.id,
        ngay_tao: item.ngay_tao,
      },
    };
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Quản trị Thông tin phản ánh)
  // -------------------------------------------------------------
  async layDanhSachAdmin(dto: LayDanhSachLienHeDto) {
    const page = Math.max(1, parseInt(dto.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(dto.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.trang_thai && dto.trang_thai.trim()) {
      const statusKey = dto.trang_thai.trim().toUpperCase();
      if (Object.values(TrangThaiLienHe).includes(statusKey as TrangThaiLienHe)) {
        where.trang_thai = statusKey as TrangThaiLienHe;
      }
    }

    if (dto.tu_khoa && dto.tu_khoa.trim()) {
      const keyword = dto.tu_khoa.trim();
      where.OR = [
        { ho_ten: { contains: keyword, mode: 'insensitive' } },
        { so_dien_thoai: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { noi_dung: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.lien_he.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_tao: 'desc' },
        include: {
          nguoi_xu_ly: {
            select: { id: true, ho_ten: true, email: true },
          },
        },
      }),
      this.prisma.lien_he.count({ where }),
    ]);

    return {
      thanh_cong: true,
      du_lieu: danhSach,
      tong_so: tongSo,
      trang_hien_tai: page,
      tong_so_trang: Math.ceil(tongSo / limit) || 1,
    };
  }

  async layChiTietAdmin(id: string) {
    const item = await this.prisma.lien_he.findUnique({
      where: { id },
      include: {
        nguoi_xu_ly: {
          select: { id: true, ho_ten: true, email: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Thông tin phản ánh không tồn tại trên hệ thống.');
    }

    return {
      thanh_cong: true,
      du_lieu: item,
    };
  }

  async capNhatTrangThai(
    id: string,
    dto: CapNhatTrangThaiLienHeDto,
    user: any,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.lien_he.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Thông tin phản ánh không tồn tại.');
    }

    if (!Object.values(TrangThaiLienHe).includes(dto.trang_thai)) {
      throw new BadRequestException('Trạng thái xử lý không hợp lệ.');
    }

    const updated = await this.prisma.lien_he.update({
      where: { id },
      data: {
        trang_thai: dto.trang_thai,
        nguoi_xu_ly_id: user.id,
        ngay_xu_ly: new Date(),
      },
      include: {
        nguoi_xu_ly: {
          select: { id: true, ho_ten: true, email: true },
        },
      },
    });

    await this.ghiNhatKy(
      user.id,
      'CAP_NHAT_TRANG_THAI_PHAN_ANH',
      id,
      JSON.stringify({ trang_thai: existing.trang_thai }),
      JSON.stringify({ trang_thai: updated.trang_thai, nguoi_xu_ly_id: user.id }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật trạng thái xử lý phản ánh thành công.',
      du_lieu: updated,
    };
  }

  async xoaLienHe(id: string, user: any, ip?: string, userAgent?: string) {
    const existing = await this.prisma.lien_he.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Thông tin phản ánh không tồn tại.');
    }

    await this.prisma.lien_he.delete({ where: { id } });

    await this.ghiNhatKy(
      user.id,
      'XOA_PHAN_ANH',
      id,
      JSON.stringify({ ho_ten: existing.ho_ten, noi_dung: existing.noi_dung }),
      null,
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa phản ánh thành công.',
    };
  }

  // -------------------------------------------------------------
  // XUẤT EXCEL THÔNG TIN PHẢN ÁNH FROM DATABASE
  // -------------------------------------------------------------
  async xuatExcel(dto: LayDanhSachLienHeDto, res: Response, user: any, ip?: string, userAgent?: string) {
    const where: any = {};

    if (dto.trang_thai && dto.trang_thai.trim()) {
      const statusKey = dto.trang_thai.trim().toUpperCase();
      if (Object.values(TrangThaiLienHe).includes(statusKey as TrangThaiLienHe)) {
        where.trang_thai = statusKey as TrangThaiLienHe;
      }
    }

    if (dto.tu_khoa && dto.tu_khoa.trim()) {
      const keyword = dto.tu_khoa.trim();
      where.OR = [
        { ho_ten: { contains: keyword, mode: 'insensitive' } },
        { so_dien_thoai: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { noi_dung: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const danhSach = await this.prisma.lien_he.findMany({
      where,
      orderBy: { ngay_tao: 'desc' },
      include: {
        nguoi_xu_ly: {
          select: { ho_ten: true },
        },
      },
    });

    const formatTrangThai = (tt: TrangThaiLienHe) => {
      switch (tt) {
        case TrangThaiLienHe.MOI:
          return 'Mới (Chưa xử lý)';
        case TrangThaiLienHe.DANG_XU_LY:
          return 'Đang xử lý';
        case TrangThaiLienHe.DA_XU_LY:
          return 'Đã xử lý';
        default:
          return tt;
      }
    };

    const excelRows = danhSach.map((item, index) => ({
      'STT': index + 1,
      'Họ và tên': item.ho_ten,
      'Số điện thoại': item.so_dien_thoai,
      'Email': item.email || '',
      'Nội dung phản ánh': item.noi_dung,
      'Thời gian gửi': new Date(item.ngay_tao).toLocaleString('vi-VN'),
      'Trạng thái': formatTrangThai(item.trang_thai),
      'Người xử lý': item.nguoi_xu_ly?.ho_ten || '',
      'Thời gian xử lý': item.ngay_xu_ly ? new Date(item.ngay_xu_ly).toLocaleString('vi-VN') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ThongTinPhanAnh');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    if (user?.id) {
      await this.ghiNhatKy(
        user.id,
        'XUAT_EXCEL_PHAN_ANH',
        null,
        null,
        JSON.stringify({ tong_so_ban_ghi: danhSach.length }),
        ip,
        userAgent,
      );
    }

    const fileName = `Danh_sach_phan_anh_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  }

  // -------------------------------------------------------------
  // GHI NHẬT KÝ HỆ THỐNG (AUDIT LOG)
  // -------------------------------------------------------------
  private async ghiNhatKy(
    nguoiDungId: string,
    hanhDong: string,
    doiTuongId: string | null,
    noiDungCu: string | null,
    noiDungMoi: string | null,
    diaChiIp?: string,
    thongTinThietBi?: string,
  ) {
    try {
      await this.prisma.nhat_ky_he_thong.create({
        data: {
          nguoi_dung_id: nguoiDungId,
          hanh_dong: hanhDong,
          doi_tuong: 'LIEN_HE',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: diaChiIp || '127.0.0.1',
          thong_tin_thiet_bi: thongTinThietBi || 'Web Browser',
        },
      });
    } catch (e) {
      console.error('Lỗi ghi nhật ký hệ thống:', e);
    }
  }
}
