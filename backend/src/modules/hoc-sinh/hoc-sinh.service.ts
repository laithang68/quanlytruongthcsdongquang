import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LayDanhSachHocSinhDto } from './dto/lay-danh-sach-hoc-sinh.dto';
import { TaoHocSinhDto } from './dto/tao-hoc-sinh.dto';
import { SuaHocSinhDto } from './dto/sua-hoc-sinh.dto';
import { ChuyenLopDto } from './dto/chuyen-lop.dto';
import { LenLopDto } from './dto/len-lop.dto';
import { LuuBanDto } from './dto/luu-ban.dto';
import { TotNghiepDto } from './dto/tot-nghiep.dto';
import { NhapHocSinhExcelDto } from './dto/nhap-hoc-sinh-excel.dto';

@Injectable()
export class HocSinhService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // HELPER: SINH MÃ HỌC SINH TỰ ĐỘNG AN TOÀN (POSTGRESQL ADVISORY LOCK)
  // Format: HS + YY + K + NNNN (Ví dụ: HS2660001, HS2660002, HS2670001)
  // -------------------------------------------------------------
  async sinhMaHocSinhTuDong(
    tx: Prisma.TransactionClient,
    namNhapHoc: number = 2026,
    khoiNhapHoc: number = 6,
  ): Promise<string> {
    const yy = String(namNhapHoc).slice(-2);
    const prefix = `HS${yy}${khoiNhapHoc}`;

    // Khóa Advisory Transaction trong PostgreSQL để tuần tự hóa việc sinh mã giữa nhiều Admin/Thread
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260821)`;

    // Tìm mã học sinh cao nhất theo tiền tố (bao gồm cả bản ghi xóa mềm để không tái sử dụng mã)
    const highest = await tx.hoc_sinh.findFirst({
      where: {
        ma_hoc_sinh: { startsWith: prefix },
      },
      orderBy: {
        ma_hoc_sinh: 'desc',
      },
      select: {
        ma_hoc_sinh: true,
      },
    });

    let nextNum = 1;
    if (highest && highest.ma_hoc_sinh.startsWith(prefix)) {
      const numPart = parseInt(highest.ma_hoc_sinh.substring(prefix.length), 10);
      if (!isNaN(numPart)) {
        nextNum = numPart + 1;
      }
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

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

    // SECURITY: Chỉ trả thông tin cơ bản, KHÔNG trả về địa chỉ hay thông tin tài khoản
    const list = await this.prisma.hoc_sinh.findMany({
      where,
      orderBy: [{ so_thu_tu: 'asc' }, { ho_ten: 'asc' }],
      select: {
        id: true,
        ma_hoc_sinh: true,
        ho_ten: true,
        gioi_tinh: true,
        so_thu_tu: true,
        trang_thai_hoc_sinh: true,
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

    if (dto.trang_thai_hoc_sinh && dto.trang_thai_hoc_sinh.trim()) {
      where.trang_thai_hoc_sinh = dto.trang_thai_hoc_sinh.trim() as any;
    }

    if (dto.trang_thai !== undefined && dto.trang_thai !== '') {
      where.trang_thai = dto.trang_thai === 'true';
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.hoc_sinh.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lop_hoc: { ten_lop: 'asc' } }, { so_thu_tu: 'asc' }, { ho_ten: 'asc' }],
        include: {
          lop_hoc: { select: { id: true, ten_lop: true, khoi: true, nam_hoc: true } },
          nguoi_dung: { select: { id: true, ten_dang_nhap: true, trang_thai: true, mat_khau_mac_dinh: true, yeu_cau_doi_mat_khau: true } },
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
        nguoi_dung: {
          select: {
            id: true,
            ten_dang_nhap: true,
            email: true,
            trang_thai: true,
            mat_khau_mac_dinh: true,
            yeu_cau_doi_mat_khau: true,
            lan_dang_nhap_cuoi: true,
          },
        },
        lich_su_lop_hoc: {
          include: {
            lop_hoc: { select: { id: true, ten_lop: true, khoi: true, nam_hoc: true } },
          },
          orderBy: { nam_hoc: 'desc' },
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

  // TẠO HỌC SINH MỚI (Tự động sinh mã HS2660001 + Tạo tài khoản + Tạo lịch sử lớp)
  async taoHocSinh(dto: TaoHocSinhDto, user: any, ip?: string, userAgent?: string) {
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

    let namNhapHoc = dto.nam_nhap_hoc;
    if (!namNhapHoc) {
      const match = lop.nam_hoc.match(/^(\d{4})/);
      namNhapHoc = match ? parseInt(match[1], 10) : new Date().getFullYear();
    }
    const khoiNhapHoc = dto.khoi_nhap_hoc || lop.khoi || 6;

    const ngaySinhParsed = dto.ngay_sinh ? new Date(dto.ngay_sinh) : null;
    const soThuTu = dto.so_thu_tu !== undefined && dto.so_thu_tu !== null ? Number(dto.so_thu_tu) : null;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Sinh mã HS tự động qua PostgreSQL transaction advisory lock
      const maHocSinh = await this.sinhMaHocSinhTuDong(tx, namNhapHoc, khoiNhapHoc);

      // 2. Tạo tài khoản người dùng cho học sinh (password hash = mã HS)
      const defaultEmail = `${maHocSinh.toLowerCase()}@thcsdongquang.edu.vn`;
      const passwordHash = await bcrypt.hash(maHocSinh, 10);

      const userAccount = await tx.nguoi_dung.create({
        data: {
          ho_ten: dto.ho_ten.trim(),
          ten_dang_nhap: maHocSinh,
          email: defaultEmail,
          mat_khau: passwordHash,
          mat_khau_mac_dinh: true,
          yeu_cau_doi_mat_khau: true,
          trang_thai: true,
        },
      });

      // 3. Tạo hồ sơ học sinh
      const createdStudent = await tx.hoc_sinh.create({
        data: {
          ma_hoc_sinh: maHocSinh,
          ho_ten: dto.ho_ten.trim(),
          ngay_sinh: ngaySinhParsed,
          gioi_tinh: dto.gioi_tinh ? dto.gioi_tinh.trim() : null,
          so_thu_tu: soThuTu,
          dia_chi: dto.dia_chi ? dto.dia_chi.trim() : null,
          nam_nhap_hoc: namNhapHoc,
          khoi_nhap_hoc: khoiNhapHoc,
          lop_hoc_id: dto.lop_hoc_id,
          nguoi_dung_id: userAccount.id,
          trang_thai: dto.trang_thai !== undefined ? dto.trang_thai : true,
        },
        include: {
          lop_hoc: { select: { id: true, ten_lop: true, khoi: true, nam_hoc: true } },
          nguoi_dung: { select: { id: true, ten_dang_nhap: true } },
        },
      });

      // 4. Tạo bản ghi lịch sử lớp đầu tiên
      await tx.lich_su_lop_hoc.create({
        data: {
          hoc_sinh_id: createdStudent.id,
          lop_hoc_id: lop.id,
          nam_hoc: lop.nam_hoc,
          khoi: lop.khoi,
          so_thu_tu: soThuTu,
          trang_thai_hoc_tap: 'DANG_HOC',
        },
      });

      return {
        ...createdStudent,
        tai_khoan: maHocSinh,
        mat_khau_ban_dau: maHocSinh,
      };
    });

    await this.ghiNhatKy(
      user.id,
      'TAO_HOC_SINH',
      result.id,
      null,
      JSON.stringify({ ma_hoc_sinh: result.ma_hoc_sinh, ho_ten: result.ho_ten, lop_hoc_id: result.lop_hoc_id }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo hồ sơ học sinh mới và tài khoản thành công.',
      du_lieu: result,
    };
  }

  // CẬP NHẬT HỌC SINH (Mã học sinh & Tên đăng nhập là IMMUTABLE, không sửa)
  async suaHocSinh(id: string, dto: SuaHocSinhDto, user: any, ip?: string, userAgent?: string) {
    const hs = await this.prisma.hoc_sinh.findFirst({
      where: { id, da_xoa: false },
      include: { lop_hoc: true },
    });
    if (!hs) {
      throw new NotFoundException('Không tìm thấy hồ sơ học sinh.');
    }

    const dataUpdate: any = {};

    if (dto.ho_ten && dto.ho_ten.trim()) {
      dataUpdate.ho_ten = dto.ho_ten.trim();
    }

    if (dto.ngay_sinh !== undefined) {
      dataUpdate.ngay_sinh = dto.ngay_sinh ? new Date(dto.ngay_sinh) : null;
    }

    if (dto.gioi_tinh !== undefined) {
      dataUpdate.gioi_tinh = dto.gioi_tinh ? dto.gioi_tinh.trim() : null;
    }

    if (dto.so_thu_tu !== undefined) {
      dataUpdate.so_thu_tu = dto.so_thu_tu ? Number(dto.so_thu_tu) : null;
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

    if (dto.trang_thai_hoc_sinh) {
      dataUpdate.trang_thai_hoc_sinh = dto.trang_thai_hoc_sinh;
    }

    if (dto.nam_tot_nghiep !== undefined) {
      dataUpdate.nam_tot_nghiep = dto.nam_tot_nghiep;
    }

    if (dto.ngay_tot_nghiep !== undefined) {
      dataUpdate.ngay_tot_nghiep = dto.ngay_tot_nghiep ? new Date(dto.ngay_tot_nghiep) : null;
    }

    if (dto.trang_thai !== undefined) {
      dataUpdate.trang_thai = dto.trang_thai;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.hoc_sinh.update({
        where: { id },
        data: dataUpdate,
        include: {
          lop_hoc: { select: { id: true, ten_lop: true, khoi: true, nam_hoc: true } },
          nguoi_dung: { select: { id: true, ten_dang_nhap: true } },
        },
      });

      // Nếu có đổi họ tên, sync sang tên hiển thị trong nguoi_dung
      if (dto.ho_ten && hs.nguoi_dung_id) {
        await tx.nguoi_dung.update({
          where: { id: hs.nguoi_dung_id },
          data: { ho_ten: dto.ho_ten.trim() },
        });
      }

      // Nếu chuyển trạng thái sang TOT_NGHIEP, tự động khóa tài khoản người dùng
      if (dto.trang_thai_hoc_sinh === 'TOT_NGHIEP' && hs.nguoi_dung_id) {
        await tx.nguoi_dung.update({
          where: { id: hs.nguoi_dung_id },
          data: { trang_thai: false },
        });
      }

      return res;
    });

    await this.ghiNhatKy(
      user.id,
      'SUA_HOC_SINH',
      id,
      JSON.stringify({ ho_ten: hs.ho_ten, lop_hoc_id: hs.lop_hoc_id, so_thu_tu: hs.so_thu_tu }),
      JSON.stringify({ ho_ten: updated.ho_ten, lop_hoc_id: updated.lop_hoc_id, so_thu_tu: updated.so_thu_tu }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật hồ sơ học sinh thành công.',
      du_lieu: updated,
    };
  }

  // LÊN LỚP (PROMOTION): Chuyển danh sách học sinh sang khối/lớp mới, lưu lịch sử, giữ nguyên mã & tài khoản
  async lenLop(dto: LenLopDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.danh_sach_hoc_sinh_id || dto.danh_sach_hoc_sinh_id.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một học sinh để lên lớp.');
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

    const namHocMoi = dto.nam_hoc_moi || lopMoi.nam_hoc;
    const khoiMoi = dto.khoi_moi || lopMoi.khoi;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật lớp học hiện tại cho tất cả học sinh được chọn
      const updateCount = await tx.hoc_sinh.updateMany({
        where: {
          id: { in: dto.danh_sach_hoc_sinh_id },
          da_xoa: false,
        },
        data: {
          lop_hoc_id: lopMoi.id,
          trang_thai_hoc_sinh: 'DANG_HOC',
        },
      });

      // 2. Tạo bản ghi lịch sử lớp mới cho từng học sinh
      for (const hsId of dto.danh_sach_hoc_sinh_id) {
        // Đóng các bản ghi lịch sử trước đó nếu chưa có ngày kết thúc
        await tx.lich_su_lop_hoc.updateMany({
          where: {
            hoc_sinh_id: hsId,
            ngay_ket_thuc: null,
          },
          data: {
            ngay_ket_thuc: new Date(),
            trang_thai_hoc_tap: 'HOAN_THANH',
          },
        });

        // Tạo hoặc cập nhật lịch sử lớp mới
        await tx.lich_su_lop_hoc.upsert({
          where: {
            hoc_sinh_id_nam_hoc_lop_hoc_id: {
              hoc_sinh_id: hsId,
              nam_hoc: namHocMoi,
              lop_hoc_id: lopMoi.id,
            },
          },
          update: {
            khoi: khoiMoi,
            trang_thai_hoc_tap: 'DANG_HOC',
          },
          create: {
            hoc_sinh_id: hsId,
            lop_hoc_id: lopMoi.id,
            nam_hoc: namHocMoi,
            khoi: khoiMoi,
            trang_thai_hoc_tap: 'DANG_HOC',
          },
        });
      }

      return updateCount.count;
    });

    await this.ghiNhatKy(
      user.id,
      'LEN_LOP_HOC_SINH',
      lopMoi.id,
      null,
      JSON.stringify({ so_luong: result, lop_moi: lopMoi.ten_lop, nam_hoc_moi: namHocMoi }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: `Lên lớp thành công cho ${result} học sinh sang lớp ${lopMoi.ten_lop} (Năm học ${namHocMoi}).`,
      so_luong: result,
    };
  }

  // CHUYỂN LỚP (TRANSFER) TRONG CÙNG NĂM HỌC
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
      // 1. Cập nhật lớp học hiện tại
      const updateRes = await tx.hoc_sinh.updateMany({
        where: {
          id: { in: dto.danh_sach_hoc_sinh_id },
          da_xoa: false,
        },
        data: {
          lop_hoc_id: dto.lop_hoc_moi_id,
        },
      });

      // 2. Cập nhật lịch sử lớp
      for (const hsId of dto.danh_sach_hoc_sinh_id) {
        await tx.lich_su_lop_hoc.upsert({
          where: {
            hoc_sinh_id_nam_hoc_lop_hoc_id: {
              hoc_sinh_id: hsId,
              nam_hoc: lopMoi.nam_hoc,
              lop_hoc_id: lopMoi.id,
            },
          },
          update: {
            khoi: lopMoi.khoi,
            trang_thai_hoc_tap: 'CHUYEN_LOP',
          },
          create: {
            hoc_sinh_id: hsId,
            lop_hoc_id: lopMoi.id,
            nam_hoc: lopMoi.nam_hoc,
            khoi: lopMoi.khoi,
            trang_thai_hoc_tap: 'CHUYEN_LOP',
          },
        });
      }

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

  // LƯU BAN (RETENTION)
  async luuBan(dto: LuuBanDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.hoc_sinh_id || !dto.lop_hoc_moi_id || !dto.nam_hoc_moi) {
      throw new BadRequestException('Vui lòng cung cấp đầy đủ thông tin lưu ban.');
    }

    const lopMoi = await this.prisma.lop_hoc.findUnique({
      where: { id: dto.lop_hoc_moi_id },
    });
    if (!lopMoi) {
      throw new BadRequestException('Lớp học mới không tồn tại.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.hoc_sinh.update({
        where: { id: dto.hoc_sinh_id },
        data: {
          lop_hoc_id: dto.lop_hoc_moi_id,
          trang_thai_hoc_sinh: 'LUU_BAN',
        },
      });

      await tx.lich_su_lop_hoc.create({
        data: {
          hoc_sinh_id: dto.hoc_sinh_id,
          lop_hoc_id: dto.lop_hoc_moi_id,
          nam_hoc: dto.nam_hoc_moi,
          khoi: lopMoi.khoi,
          trang_thai_hoc_tap: 'LUU_BAN',
          ghi_chu: dto.ghi_chu || 'Lưu ban',
        },
      });
    });

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật trạng thái lưu ban cho học sinh thành công.',
    };
  }

  // TỐT NGHIỆP (GRADUATION): Đánh dấu tốt nghiệp, bảo tồn 100% hồ sơ, tài khoản và lịch sử, tự động khóa tài khoản đăng nhập
  async danhDauTotNghiep(dto: TotNghiepDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.danh_sach_hoc_sinh_id || dto.danh_sach_hoc_sinh_id.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một học sinh để đánh dấu tốt nghiệp.');
    }
    if (!dto.nam_tot_nghiep) {
      throw new BadRequestException('Vui lòng cung cấp năm tốt nghiệp.');
    }

    const ngayTotNghiepParsed = dto.ngay_tot_nghiep ? new Date(dto.ngay_tot_nghiep) : new Date();

    const count = await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật hồ sơ học sinh
      const res = await tx.hoc_sinh.updateMany({
        where: {
          id: { in: dto.danh_sach_hoc_sinh_id },
          da_xoa: false,
        },
        data: {
          trang_thai_hoc_sinh: 'TOT_NGHIEP',
          nam_tot_nghiep: dto.nam_tot_nghiep,
          ngay_tot_nghiep: ngayTotNghiepParsed,
        },
      });

      // 2. Tự động khóa tài khoản nguoi_dung (trang_thai = false) để học sinh đã tốt nghiệp không đăng nhập được
      const students = await tx.hoc_sinh.findMany({
        where: {
          id: { in: dto.danh_sach_hoc_sinh_id },
          nguoi_dung_id: { not: null },
        },
        select: { nguoi_dung_id: true },
      });

      const userIdsToLock = students
        .map((s) => s.nguoi_dung_id)
        .filter((id): id is string => Boolean(id));

      if (userIdsToLock.length > 0) {
        await tx.nguoi_dung.updateMany({
          where: { id: { in: userIdsToLock } },
          data: { trang_thai: false },
        });
      }

      // 3. Cập nhật lịch sử lớp cuối cùng
      for (const hsId of dto.danh_sach_hoc_sinh_id) {
        await tx.lich_su_lop_hoc.updateMany({
          where: {
            hoc_sinh_id: hsId,
            ngay_ket_thuc: null,
          },
          data: {
            ngay_ket_thuc: ngayTotNghiepParsed,
            trang_thai_hoc_tap: 'TOT_NGHIEP',
            ghi_chu: dto.ghi_chu || 'Tốt nghiệp',
          },
        });
      }

      return res.count;
    });

    await this.ghiNhatKy(
      user.id,
      'TOT_NGHIEP_HOC_SINH',
      'TOT_NGHIEP',
      null,
      JSON.stringify({ so_luong: count, nam_tot_nghiep: dto.nam_tot_nghiep }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: `Đã cập nhật tốt nghiệp thành công cho ${count} học sinh (Năm ${dto.nam_tot_nghiep}). Tài khoản của học sinh đã được khóa và không thể đăng nhập Cổng học sinh.`,
      so_luong: count,
    };
  }

  // ĐẶT LẠI MẬT KHẨU VỀ MẶC ĐỊNH (Mật khẩu mới = Mã học sinh, Bật cờ yeu_cau_doi_mat_khau)
  async datLaiMatKhau(id: string, user: any, ip?: string, userAgent?: string) {
    const hs = await this.prisma.hoc_sinh.findFirst({
      where: { id, da_xoa: false },
      include: { nguoi_dung: true },
    });

    if (!hs) {
      throw new NotFoundException('Không tìm thấy hồ sơ học sinh.');
    }

    const passwordHash = await bcrypt.hash(hs.ma_hoc_sinh, 10);
    const defaultEmail = `${hs.ma_hoc_sinh.toLowerCase()}@thcsdongquang.edu.vn`;

    if (hs.nguoi_dung_id) {
      const dataUpdateNguoiDung: any = {
        mat_khau: passwordHash,
        mat_khau_mac_dinh: true,
        yeu_cau_doi_mat_khau: true,
      };
      // Nếu học sinh đã tốt nghiệp thì KHÔNG tự ý mở khóa tài khoản
      if (hs.trang_thai_hoc_sinh === 'TOT_NGHIEP') {
        dataUpdateNguoiDung.trang_thai = false;
      }
      await this.prisma.nguoi_dung.update({
        where: { id: hs.nguoi_dung_id },
        data: dataUpdateNguoiDung,
      });
    } else {
      const isGraduated = hs.trang_thai_hoc_sinh === 'TOT_NGHIEP';
      const newUser = await this.prisma.nguoi_dung.create({
        data: {
          ho_ten: hs.ho_ten,
          ten_dang_nhap: hs.ma_hoc_sinh,
          email: defaultEmail,
          mat_khau: passwordHash,
          mat_khau_mac_dinh: true,
          yeu_cau_doi_mat_khau: true,
          trang_thai: !isGraduated,
        },
      });
      await this.prisma.hoc_sinh.update({
        where: { id: hs.id },
        data: { nguoi_dung_id: newUser.id },
      });
    }

    await this.ghiNhatKy(
      user.id,
      'DAT_LAI_MAT_KHAU_HOC_SINH',
      id,
      null,
      JSON.stringify({ ma_hoc_sinh: hs.ma_hoc_sinh }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: `Đã đặt lại mật khẩu cho học sinh ${hs.ho_ten} về mật khẩu mặc định: ${hs.ma_hoc_sinh}`,
      mat_khau_moi: hs.ma_hoc_sinh,
    };
  }

  // XÓA MỀM HỌC SINH (Mã học sinh vẫn được lưu giữ và không tái sử dụng)
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
      JSON.stringify({ da_xoa: false, ma_hoc_sinh: hs.ma_hoc_sinh }),
      JSON.stringify({ da_xoa: true, ngay_xoa: updated.ngay_xoa }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa mềm hồ sơ học sinh thành công.',
    };
  }

  // NHẬP DANH SÁCH TỪ FILE EXCEL (Validate trước -> Import sau, Tự sinh mã HS266xxxx + Tài khoản + Lịch sử lớp)
  async nhapDanhSachExcel(
    dto: NhapHocSinhExcelDto,
    user: any,
    ip?: string,
    userAgent?: string,
  ) {
    if (!dto.danh_sach || !Array.isArray(dto.danh_sach) || dto.danh_sach.length === 0) {
      throw new BadRequestException('Danh sách học sinh nhập từ Excel không được để trống.');
    }

    const danhSachLop = await this.prisma.lop_hoc.findMany({
      select: { id: true, ten_lop: true, khoi: true, nam_hoc: true },
    });

    const lopMapByName = new Map<string, { id: string; ten_lop: string; khoi: number; nam_hoc: string }>();
    const lopMapById = new Map<string, { id: string; ten_lop: string; khoi: number; nam_hoc: string }>();
    danhSachLop.forEach((l) => {
      lopMapByName.set(l.ten_lop.trim().toLowerCase(), l);
      lopMapById.set(l.id, l);
    });

    const loiChiTiet: string[] = [];
    const validatedRows: Array<{
      rowNum: number;
      hoTen: string;
      gioiTinh: string;
      ngaySinh: Date | null;
      soThuTu: number | null;
      diaChi: string | null;
      targetLop: { id: string; ten_lop: string; khoi: number; nam_hoc: string };
      namNhapHoc: number;
      khoiNhapHoc: number;
    }> = [];

    // PASS 1: VALIDATE TOÀN DIỆN TẤT CẢ CÁC DÒNG TRƯỚC KHI GHI VÀO CSDL
    for (let index = 0; index < dto.danh_sach.length; index++) {
      const item = dto.danh_sach[index];
      const rowNum = index + 1;

      if (!item.ho_ten || !item.ho_ten.trim()) {
        loiChiTiet.push(`Dòng ${rowNum}: Họ và tên không được để trống.`);
        continue;
      }

      const hoTen = item.ho_ten.trim();
      let gioiTinh = item.gioi_tinh?.trim() || 'Nam';
      if (gioiTinh.toLowerCase() === 'nam') gioiTinh = 'Nam';
      else if (gioiTinh.toLowerCase() === 'nữ' || gioiTinh.toLowerCase() === 'nu') gioiTinh = 'Nữ';

      const diaChi = item.dia_chi?.trim() || null;
      const soThuTu = item.so_thu_tu !== undefined && item.so_thu_tu !== null && !isNaN(Number(item.so_thu_tu))
        ? Number(item.so_thu_tu)
        : null;

      // Validate Ngày sinh
      let ngaySinh: Date | null = null;
      if (item.ngay_sinh) {
        const parsed = this.phanTichNgaySinh(item.ngay_sinh);
        if (!parsed.valid) {
          loiChiTiet.push(`Dòng ${rowNum} (${hoTen}): Ngày sinh "${item.ngay_sinh}" không hợp lệ (định dạng chuẩn: DD/MM/YYYY).`);
          continue;
        }
        ngaySinh = parsed.date;
      }

      // Validate Lớp học
      let targetLop: { id: string; ten_lop: string; khoi: number; nam_hoc: string } | null = null;
      if (item.lop_hoc_id && lopMapById.has(item.lop_hoc_id.trim())) {
        targetLop = lopMapById.get(item.lop_hoc_id.trim())!;
      } else if (item.ten_lop && item.ten_lop.trim()) {
        const key = item.ten_lop.trim().toLowerCase();
        if (lopMapByName.has(key)) {
          targetLop = lopMapByName.get(key)!;
        }
      }

      if (!targetLop && dto.mac_dinh_lop_hoc_id && lopMapById.has(dto.mac_dinh_lop_hoc_id)) {
        targetLop = lopMapById.get(dto.mac_dinh_lop_hoc_id)!;
      }

      if (!targetLop) {
        const tenLopHienThi = item.ten_lop || item.lop_hoc_id || 'chưa chọn';
        loiChiTiet.push(`Dòng ${rowNum} (${hoTen}): Lớp học "${tenLopHienThi}" không tồn tại trong hệ thống.`);
        continue;
      }

      const matchYear = targetLop.nam_hoc.match(/^(\d{4})/);
      const namNhapHoc = dto.nam_nhap_hoc || (matchYear ? parseInt(matchYear[1], 10) : new Date().getFullYear());
      const khoiNhapHoc = targetLop.khoi || 6;

      validatedRows.push({
        rowNum,
        hoTen,
        gioiTinh,
        ngaySinh,
        soThuTu,
        diaChi,
        targetLop,
        namNhapHoc,
        khoiNhapHoc,
      });
    }

    // NẾU CÓ BẤT KỲ LỖI NÀO -> TỪ CHỐI IMPORT 100%, KHÔNG TẠO DỮ LIỆU DỞ DANG
    if (loiChiTiet.length > 0) {
      return {
        thanh_cong: false,
        thong_bao: `File Excel có ${loiChiTiet.length} dòng dữ liệu không hợp lệ. Vui lòng sửa lại theo chi tiết bên dưới và thử lại.`,
        tong_so: dto.danh_sach.length,
        tao_moi: 0,
        danh_sach_tai_khoan: [],
        loi_chi_tiet: loiChiTiet,
      };
    }

    // PASS 2: THỰC HIỆN GHI CSDL NGUYÊN TỬ TRONG TRANSACTION
    const result = await this.prisma.$transaction(async (tx) => {
      // Khóa advisory lock trong PostgreSQL để bảo đảm sequence an toàn tuyệt đối
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260821)`;

      let thanhCongCount = 0;
      const danhSachTaiKhoan: Array<{
        stt: number;
        ho_ten: string;
        ten_lop: string;
        ma_hoc_sinh: string;
        ten_dang_nhap: string;
        mat_khau_ban_dau: string;
      }> = [];

      for (const row of validatedRows) {
        // Tự sinh mã định danh duy nhất theo chuẩn HS266xxxx
        const maHocSinh = await this.sinhMaHocSinhTuDong(tx, row.namNhapHoc, row.khoiNhapHoc);

        // Tạo tài khoản người dùng
        const defaultEmail = `${maHocSinh.toLowerCase()}@thcsdongquang.edu.vn`;
        const passwordHash = await bcrypt.hash(maHocSinh, 10);

        const userAccount = await tx.nguoi_dung.create({
          data: {
            ho_ten: row.hoTen,
            ten_dang_nhap: maHocSinh,
            email: defaultEmail,
            mat_khau: passwordHash,
            mat_khau_mac_dinh: true,
            yeu_cau_doi_mat_khau: true,
            trang_thai: true,
          },
        });

        // Tạo hồ sơ học sinh
        const createdStudent = await tx.hoc_sinh.create({
          data: {
            ma_hoc_sinh: maHocSinh,
            ho_ten: row.hoTen,
            ngay_sinh: row.ngaySinh,
            gioi_tinh: row.gioiTinh,
            so_thu_tu: row.soThuTu,
            dia_chi: row.diaChi,
            nam_nhap_hoc: row.namNhapHoc,
            khoi_nhap_hoc: row.khoiNhapHoc,
            lop_hoc_id: row.targetLop.id,
            nguoi_dung_id: userAccount.id,
            trang_thai: true,
            da_xoa: false,
          },
        });

        // Tạo bản ghi lịch sử lớp học ban đầu
        await tx.lich_su_lop_hoc.create({
          data: {
            hoc_sinh_id: createdStudent.id,
            lop_hoc_id: row.targetLop.id,
            nam_hoc: row.targetLop.nam_hoc,
            khoi: row.targetLop.khoi,
            so_thu_tu: row.soThuTu,
            trang_thai_hoc_tap: 'DANG_HOC',
          },
        });

        thanhCongCount++;
        danhSachTaiKhoan.push({
          stt: row.rowNum,
          ho_ten: row.hoTen,
          ten_lop: row.targetLop.ten_lop,
          ma_hoc_sinh: maHocSinh,
          ten_dang_nhap: maHocSinh,
          mat_khau_ban_dau: maHocSinh,
        });
      }

      return {
        thanhCongCount,
        danhSachTaiKhoan,
      };
    });

    await this.ghiNhatKy(
      user.id,
      'NHAP_EXCEL_HOC_SINH',
      'EXCEL',
      null,
      JSON.stringify({
        tong_so_dong: dto.danh_sach.length,
        tao_moi: result.thanhCongCount,
      }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: `Import thành công ${result.thanhCongCount} học sinh.`,
      tong_so: dto.danh_sach.length,
      tao_moi: result.thanhCongCount,
      danh_sach_tai_khoan: result.danhSachTaiKhoan,
      loi_chi_tiet: [],
    };
  }

  // Helper phân tích ngày sinh từ Excel (DD/MM/YYYY, YYYY-MM-DD, Date object)
  private phanTichNgaySinh(val: any): { date: Date | null; valid: boolean } {
    if (!val) return { date: null, valid: true };
    if (val instanceof Date && !isNaN(val.getTime())) {
      return { date: val, valid: true };
    }
    const str = String(val).trim();
    if (!str) return { date: null, valid: true };

    // Format DD/MM/YYYY hoặc DD-MM-YYYY
    const vnMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (vnMatch) {
      const day = parseInt(vnMatch[1], 10);
      const month = parseInt(vnMatch[2], 10) - 1;
      const year = parseInt(vnMatch[3], 10);
      const d = new Date(year, month, day);
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return { date: d, valid: true };
      }
      return { date: null, valid: false };
    }

    // Format YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const d = new Date(year, month, day);
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return { date: d, valid: true };
      }
      return { date: null, valid: false };
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return { date: d, valid: true };
    }

    return { date: null, valid: false };
  }

  // XUẤT DANH SÁCH RA FILE EXCEL
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

    if (dto.trang_thai_hoc_sinh && dto.trang_thai_hoc_sinh.trim()) {
      where.trang_thai_hoc_sinh = dto.trang_thai_hoc_sinh.trim() as any;
    }

    const danhSach = await this.prisma.hoc_sinh.findMany({
      where,
      orderBy: [{ lop_hoc: { ten_lop: 'asc' } }, { so_thu_tu: 'asc' }, { ho_ten: 'asc' }],
      include: {
        lop_hoc: { select: { ten_lop: true, khoi: true, nam_hoc: true } },
      },
    });

    return {
      thanh_cong: true,
      du_lieu: danhSach.map((hs) => ({
        id: hs.id,
        so_thu_tu: hs.so_thu_tu || '',
        ma_hoc_sinh: hs.ma_hoc_sinh,
        ho_ten: hs.ho_ten,
        ngay_sinh: hs.ngay_sinh ? new Date(hs.ngay_sinh).toLocaleDateString('vi-VN') : '',
        gioi_tinh: hs.gioi_tinh || '',
        dia_chi: hs.dia_chi || '',
        ten_lop: hs.lop_hoc?.ten_lop || '',
        khoi: hs.lop_hoc?.khoi || '',
        nam_hoc: hs.lop_hoc?.nam_hoc || '',
        trang_thai_hoc_sinh: hs.trang_thai_hoc_sinh,
        nam_tot_nghiep: hs.nam_tot_nghiep || '',
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
