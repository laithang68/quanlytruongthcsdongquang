import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LayDanhSachHocSinhDto } from './dto/lay-danh-sach-hoc-sinh.dto';
import { TaoHocSinhDto } from './dto/tao-hoc-sinh.dto';
import { SuaHocSinhDto } from './dto/sua-hoc-sinh.dto';
import { ChuyenLopDto } from './dto/chuyen-lop.dto';

@Injectable()
export class HocSinhService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Tra cứu học sinh theo lớp công khai)
  // -------------------------------------------------------------

  async layDanhSachPublic(lopHocId?: string) {
    const where: any = {
      trang_thai: true,
      da_xoa: false,
    };

    if (lopHocId && lopHocId.trim()) {
      where.lop_hoc_id = lopHocId.trim();
    }

    // SECURITY: Chỉ trả thông tin cơ bản, KHÔNG trả về địa chỉ hay thông tin nhạy cảm
    const list = await this.prisma.hoc_sinh.findMany({
      where,
      orderBy: { ho_ten: 'asc' },
      select: {
        id: true,
        ma_hoc_sinh: true,
        ho_ten: true,
        gioi_tinh: true,
        lop_hoc: {
          select: { id: true, ten_lop: true, khoi: true, nam_hoc: true },
        },
      },
    });

    return {
      thanh_cong: true,
      du_lieu: list,
    };
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Quản trị Học sinh)
  // -------------------------------------------------------------

  async layDanhSachAdmin(dto: LayDanhSachHocSinhDto) {
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
        { ma_hoc_sinh: { contains: keyword, mode: 'insensitive' } },
        { dia_chi: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (dto.lop_hoc_id && dto.lop_hoc_id.trim()) {
      where.lop_hoc_id = dto.lop_hoc_id.trim();
    }

    if (dto.khoi) {
      const khoiNum = parseInt(dto.khoi, 10);
      where.lop_hoc = { khoi: khoiNum };
    }

    if (dto.trang_thai !== undefined && dto.trang_thai !== '') {
      where.trang_thai = dto.trang_thai === 'true';
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.hoc_sinh.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ho_ten: 'asc' },
        include: {
          lop_hoc: { select: { id: true, ten_lop: true, khoi: true, nam_hoc: true } },
          phu_huynh_hoc_sinh: {
            include: {
              phu_huynh: { select: { id: true, ho_ten: true, so_dien_thoai: true } },
            },
          },
        },
      }),
      this.prisma.hoc_sinh.count({ where }),
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
    const hs = await this.prisma.hoc_sinh.findFirst({
      where: { id, da_xoa: false },
      include: {
        lop_hoc: {
          select: {
            id: true,
            ten_lop: true,
            khoi: true,
            nam_hoc: true,
            gvcn: { select: { id: true, ho_ten: true, so_dien_thoai: true } },
          },
        },
        phu_huynh_hoc_sinh: {
          include: {
            phu_huynh: true,
          },
        },
      },
    });

    if (!hs) {
      throw new NotFoundException('Không tìm thấy hồ sơ học sinh.');
    }

    return {
      thanh_cong: true,
      du_lieu: hs,
    };
  }

  async taoHocSinh(dto: TaoHocSinhDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.ma_hoc_sinh || !dto.ma_hoc_sinh.trim()) {
      throw new BadRequestException('Mã học sinh không được để trống.');
    }
    if (!dto.ho_ten || !dto.ho_ten.trim()) {
      throw new BadRequestException('Họ tên học sinh không được để trống.');
    }
    if (!dto.lop_hoc_id || !dto.lop_hoc_id.trim()) {
      throw new BadRequestException('Vui lòng chọn lớp học cho học sinh.');
    }

    const lop = await this.prisma.lop_hoc.findUnique({
      where: { id: dto.lop_hoc_id },
    });
    if (!lop) {
      throw new BadRequestException('Lớp học được chọn không tồn tại.');
    }

    const existingMa = await this.prisma.hoc_sinh.findFirst({
      where: { ma_hoc_sinh: { equals: dto.ma_hoc_sinh.trim(), mode: 'insensitive' } },
    });
    if (existingMa) {
      throw new BadRequestException(`Mã học sinh ${dto.ma_hoc_sinh} đã tồn tại trong hệ thống.`);
    }

    const ngaySinhParsed = dto.ngay_sinh ? new Date(dto.ngay_sinh) : null;

    const hsMoi = await this.prisma.hoc_sinh.create({
      data: {
        ma_hoc_sinh: dto.ma_hoc_sinh.trim(),
        ho_ten: dto.ho_ten.trim(),
        ngay_sinh: ngaySinhParsed,
        gioi_tinh: dto.gioi_tinh ? dto.gioi_tinh.trim() : null,
        dia_chi: dto.dia_chi ? dto.dia_chi.trim() : null,
        lop_hoc_id: dto.lop_hoc_id,
        trang_thai: dto.trang_thai !== undefined ? dto.trang_thai : true,
      },
    });

    await this.ghiNhatKy(
      user.id,
      'TAO_HOC_SINH',
      hsMoi.id,
      null,
      JSON.stringify({ ma_hoc_sinh: hsMoi.ma_hoc_sinh, ho_ten: hsMoi.ho_ten, lop_hoc_id: hsMoi.lop_hoc_id }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo hồ sơ học sinh mới thành công.',
      du_lieu: hsMoi,
    };
  }

  async suaHocSinh(id: string, dto: SuaHocSinhDto, user: any, ip?: string, userAgent?: string) {
    const hs = await this.prisma.hoc_sinh.findFirst({ where: { id, da_xoa: false } });
    if (!hs) {
      throw new NotFoundException('Không tìm thấy hồ sơ học sinh.');
    }

    const dataUpdate: any = {};

    if (dto.ma_hoc_sinh && dto.ma_hoc_sinh.trim()) {
      const existingMa = await this.prisma.hoc_sinh.findFirst({
        where: {
          ma_hoc_sinh: { equals: dto.ma_hoc_sinh.trim(), mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (existingMa) {
        throw new BadRequestException(`Mã học sinh ${dto.ma_hoc_sinh} đã bị trùng với học sinh khác.`);
      }
      dataUpdate.ma_hoc_sinh = dto.ma_hoc_sinh.trim();
    }

    if (dto.ho_ten && dto.ho_ten.trim()) {
      dataUpdate.ho_ten = dto.ho_ten.trim();
    }

    if (dto.ngay_sinh !== undefined) {
      dataUpdate.ngay_sinh = dto.ngay_sinh ? new Date(dto.ngay_sinh) : null;
    }

    if (dto.gioi_tinh !== undefined) {
      dataUpdate.gioi_tinh = dto.gioi_tinh ? dto.gioi_tinh.trim() : null;
    }

    if (dto.dia_chi !== undefined) {
      dataUpdate.dia_chi = dto.dia_chi ? dto.dia_chi.trim() : null;
    }

    if (dto.lop_hoc_id && dto.lop_hoc_id !== hs.lop_hoc_id) {
      const lopMoi = await this.prisma.lop_hoc.findUnique({
        where: { id: dto.lop_hoc_id },
      });
      if (!lopMoi) {
        throw new BadRequestException('Lớp học mới không tồn tại.');
      }
      dataUpdate.lop_hoc_id = dto.lop_hoc_id;
    }

    if (dto.trang_thai !== undefined) {
      dataUpdate.trang_thai = dto.trang_thai;
    }

    const updated = await this.prisma.hoc_sinh.update({
      where: { id },
      data: dataUpdate,
    });

    await this.ghiNhatKy(
      user.id,
      'SUA_HOC_SINH',
      id,
      JSON.stringify({ ho_ten: hs.ho_ten, lop_hoc_id: hs.lop_hoc_id }),
      JSON.stringify({ ho_ten: updated.ho_ten, lop_hoc_id: updated.lop_hoc_id }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật hồ sơ học sinh thành công.',
      du_lieu: updated,
    };
  }

  // CHUYỂN HÀNG LOẠT HỌC SINH SANG LỚP MỚI (Prisma Transaction)
  async chuyenLop(dto: ChuyenLopDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.danh_sach_hoc_sinh_id || dto.danh_sach_hoc_sinh_id.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một học sinh để chuyển lớp.');
    }
    if (!dto.lop_hoc_moi_id) {
      throw new BadRequestException('Vui lòng chọn lớp học mới.');
    }

    const lopMoi = await this.prisma.lop_hoc.findUnique({
      where: { id: dto.lop_hoc_moi_id },
    });
    if (!lopMoi) {
      throw new BadRequestException('Lớp học mới không tồn tại.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updateRes = await tx.hoc_sinh.updateMany({
        where: {
          id: { in: dto.danh_sach_hoc_sinh_id },
          da_xoa: false,
        },
        data: {
          lop_hoc_id: dto.lop_hoc_moi_id,
        },
      });

      return updateRes;
    });

    await this.ghiNhatKy(
      user.id,
      'CHUYEN_LOP',
      dto.lop_hoc_moi_id,
      null,
      JSON.stringify({ so_luong_hoc_sinh: result.count, lop_hoc_moi: lopMoi.ten_lop }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: `Chuyển thành công ${result.count} học sinh sang lớp ${lopMoi.ten_lop}.`,
      so_luong: result.count,
    };
  }

  async xoaMem(id: string, user: any, ip?: string, userAgent?: string) {
    const hs = await this.prisma.hoc_sinh.findFirst({ where: { id, da_xoa: false } });
    if (!hs) {
      throw new NotFoundException('Không tìm thấy hồ sơ học sinh.');
    }

    const updated = await this.prisma.hoc_sinh.update({
      where: { id },
      data: {
        da_xoa: true,
        ngay_xoa: new Date(),
      },
    });

    await this.ghiNhatKy(
      user.id,
      'XOA_HOC_SINH',
      id,
      JSON.stringify({ da_xoa: false }),
      JSON.stringify({ da_xoa: true, ngay_xoa: updated.ngay_xoa }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa mềm hồ sơ học sinh thành công.',
    };
  }

  async nhapDanhSachExcel(
    dto: any,
    user: any,
    ip?: string,
    userAgent?: string,
  ) {
    if (!dto.danh_sach || !Array.isArray(dto.danh_sach) || dto.danh_sach.length === 0) {
      throw new BadRequestException('Danh sách học sinh nhập từ Excel không được để trống.');
    }

    const danhSachLop = await this.prisma.lop_hoc.findMany({
      select: { id: true, ten_lop: true, khoi: true },
    });

    const lopMapByName = new Map<string, string>();
    const lopMapById = new Set<string>();
    danhSachLop.forEach((l) => {
      lopMapByName.set(l.ten_lop.trim().toLowerCase(), l.id);
      lopMapById.add(l.id);
    });

    let thanhCongCount = 0;
    let capNhatCount = 0;
    const loiChiTiet: string[] = [];

    for (let index = 0; index < dto.danh_sach.length; index++) {
      const item = dto.danh_sach[index];
      const rowNum = index + 1;

      if (!item.ma_hoc_sinh || !item.ma_hoc_sinh.toString().trim()) {
        loiChiTiet.push(`Dòng ${rowNum}: Mã học sinh không được để trống.`);
        continue;
      }

      if (!item.ho_ten || !item.ho_ten.trim()) {
        loiChiTiet.push(`Dòng ${rowNum}: Họ tên học sinh không được để trống.`);
        continue;
      }

      const maHocSinh = item.ma_hoc_sinh.toString().trim();
      const hoTen = item.ho_ten.trim();
      const gioiTinh = item.gioi_tinh?.trim() || 'Nam';
      const diaChi = item.dia_chi?.trim() || null;
      let ngaySinh: Date | null = null;
      if (item.ngay_sinh) {
        const d = new Date(item.ngay_sinh);
        if (!isNaN(d.getTime())) ngaySinh = d;
      }

      let targetLopId: string | null = null;
      if (item.lop_hoc_id && lopMapById.has(item.lop_hoc_id.trim())) {
        targetLopId = item.lop_hoc_id.trim();
      } else if (item.ten_lop && item.ten_lop.trim()) {
        const key = item.ten_lop.trim().toLowerCase();
        if (lopMapByName.has(key)) {
          targetLopId = lopMapByName.get(key)!;
        }
      }

      if (!targetLopId && dto.mac_dinh_lop_hoc_id && lopMapById.has(dto.mac_dinh_lop_hoc_id)) {
        targetLopId = dto.mac_dinh_lop_hoc_id;
      }

      if (!targetLopId) {
        loiChiTiet.push(`Dòng ${rowNum} (${hoTen}): Không tìm thấy lớp học phù hợp.`);
        continue;
      }

      const existing = await this.prisma.hoc_sinh.findFirst({
        where: { ma_hoc_sinh: maHocSinh, da_xoa: false },
      });

      if (existing) {
        await this.prisma.hoc_sinh.update({
          where: { id: existing.id },
          data: {
            ho_ten: hoTen,
            ngay_sinh: ngaySinh || existing.ngay_sinh,
            gioi_tinh: gioiTinh,
            dia_chi: diaChi || existing.dia_chi,
            lop_hoc_id: targetLopId,
          },
        });
        capNhatCount++;
      } else {
        await this.prisma.hoc_sinh.create({
          data: {
            ma_hoc_sinh: maHocSinh,
            ho_ten: hoTen,
            ngay_sinh: ngaySinh,
            gioi_tinh: gioiTinh,
            dia_chi: diaChi,
            lop_hoc_id: targetLopId,
            trang_thai: true,
            da_xoa: false,
          },
        });
        thanhCongCount++;
      }
    }

    await this.ghiNhatKy(
      user.id,
      'NHAP_EXCEL_HOC_SINH',
      'EXCEL',
      null,
      JSON.stringify({ tao_moi: thanhCongCount, cap_nhat: capNhatCount, loi: loiChiTiet.length }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: `Nhập thành công ${thanhCongCount} học sinh mới, cập nhật ${capNhatCount} học sinh.`,
      tao_moi: thanhCongCount,
      cap_nhat: capNhatCount,
      loi_chi_tiet: loiChiTiet,
    };
  }

  async xuatDanhSachExcel(dto: LayDanhSachHocSinhDto) {
    const where: any = { da_xoa: false };

    if (dto.tu_khoa && dto.tu_khoa.trim()) {
      const keyword = dto.tu_khoa.trim();
      where.OR = [
        { ho_ten: { contains: keyword, mode: 'insensitive' } },
        { ma_hoc_sinh: { contains: keyword, mode: 'insensitive' } },
        { dia_chi: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (dto.lop_hoc_id && dto.lop_hoc_id.trim()) {
      where.lop_hoc_id = dto.lop_hoc_id.trim();
    }

    if (dto.khoi) {
      const khoiNum = parseInt(dto.khoi, 10);
      where.lop_hoc = { khoi: khoiNum };
    }

    const danhSach = await this.prisma.hoc_sinh.findMany({
      where,
      orderBy: [{ lop_hoc: { ten_lop: 'asc' } }, { ho_ten: 'asc' }],
      include: {
        lop_hoc: { select: { ten_lop: true, khoi: true, nam_hoc: true } },
      },
    });

    return {
      thanh_cong: true,
      du_lieu: danhSach.map((hs) => ({
        id: hs.id,
        ma_hoc_sinh: hs.ma_hoc_sinh,
        ho_ten: hs.ho_ten,
        ngay_sinh: hs.ngay_sinh ? new Date(hs.ngay_sinh).toLocaleDateString('vi-VN') : '',
        gioi_tinh: hs.gioi_tinh,
        dia_chi: hs.dia_chi || '',
        ten_lop: hs.lop_hoc?.ten_lop || '',
        khoi: hs.lop_hoc?.khoi || '',
        nam_hoc: hs.lop_hoc?.nam_hoc || '',
      })),
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
          doi_tuong: 'hoc_sinh',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống học sinh:', e);
    }
  }
}
