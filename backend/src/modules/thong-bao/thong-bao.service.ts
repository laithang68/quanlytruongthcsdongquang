import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';
import { DoiTuongThongBao } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LayDanhSachThongBaoDto } from './dto/lay-danh-sach-thong-bao.dto';
import { TaoThongBaoDto } from './dto/tao-thong-bao.dto';
import { SuaThongBaoDto } from './dto/sua-thong-bao.dto';
import { DoiTrangThaiThongBaoDto } from './dto/doi-trang-thai-thong-bao.dto';

@Injectable()
export class ThongBaoService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Công khai trên Website)
  // -------------------------------------------------------------

  async layDanhSachPublic(
    pageInput?: string,
    limitInput?: string,
    tuKhoa?: string,
    phieuLoc?: string,
    thangNam?: string,
  ) {
    const page = Math.max(1, parseInt(pageInput || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(limitInput || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      trang_thai: true,
      doi_tuong: DoiTuongThongBao.CONG_KHAI,
    };

    // Lọc theo từ khóa tìm kiếm
    if (tuKhoa && tuKhoa.trim()) {
      const kw = tuKhoa.trim();
      where.OR = [
        { tieu_de: { contains: kw, mode: 'insensitive' } },
        { noi_dung: { contains: kw, mode: 'insensitive' } },
      ];
    }

    // Lọc theo loại thông báo hoặc lịch hoạt động
    if (phieuLoc === 'nha-truong') {
      where.tieu_de = { contains: 'Thông báo', mode: 'insensitive' };
    } else if (phieuLoc === 'lich-hoat-dong') {
      where.OR = [
        { tieu_de: { contains: 'Lịch', mode: 'insensitive' } },
        { tieu_de: { contains: 'Hoạt động', mode: 'insensitive' } },
        { tieu_de: { contains: 'Hội nghị', mode: 'insensitive' } },
        { tieu_de: { contains: 'Lễ', mode: 'insensitive' } },
        { tieu_de: { contains: 'Kế hoạch', mode: 'insensitive' } },
        { ngay_bat_dau: { not: null } },
      ];
    }

    // Lọc theo tháng năm (Vd: "2026-08")
    if (thangNam && thangNam.match(/^\d{4}-\d{2}$/)) {
      const [yearStr, monthStr] = thangNam.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      where.AND = [
        {
          OR: [
            { ngay_tao: { gte: startDate, lte: endDate } },
            { ngay_bat_dau: { gte: startDate, lte: endDate } },
            { ngay_ket_thuc: { gte: startDate, lte: endDate } },
          ],
        },
      ];
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.thong_bao.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_tao: 'desc' },
        include: {
          nguoi_tao: {
            select: { id: true, ho_ten: true },
          },
        },
      }),
      this.prisma.thong_bao.count({ where }),
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

  async layChiTietPublic(id: string) {
    const now = new Date();

    const thongBao = await this.prisma.thong_bao.findFirst({
      where: {
        id,
        trang_thai: true,
        doi_tuong: DoiTuongThongBao.CONG_KHAI,
      },
      include: {
        nguoi_tao: { select: { id: true, ho_ten: true } },
      },
    });

    if (!thongBao) {
      throw new NotFoundException('Không tìm thấy thông báo công khai hoặc thông báo đã hết hạn.');
    }

    return {
      thanh_cong: true,
      du_lieu: thongBao,
    };
  }

  // -------------------------------------------------------------
  // NỘI BỘ APIs (Dành cho người dùng hệ thống xem theo đối tượng)
  // -------------------------------------------------------------

  async layDanhSachNoiBo(user: any, pageInput?: string, limitInput?: string) {
    const page = Math.max(1, parseInt(pageInput || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(limitInput || '10', 10)));
    const skip = (page - 1) * limit;

    const now = new Date();
    const allowedDoiTuong: DoiTuongThongBao[] = [DoiTuongThongBao.CONG_KHAI];

    if (
      user.vai_tro.includes('GIAO_VIEN') ||
      user.vai_tro.includes('BAN_GIAM_HIEU') ||
      user.vai_tro.includes('SUPER_ADMIN') ||
      user.vai_tro.includes('QUAN_TRI_VIEN')
    ) {
      allowedDoiTuong.push(DoiTuongThongBao.GIAO_VIEN);
    }

    const where: any = {
      trang_thai: true,
      doi_tuong: { in: allowedDoiTuong },
      AND: [
        { OR: [{ ngay_bat_dau: null }, { ngay_bat_dau: { lte: now } }] },
        { OR: [{ ngay_ket_thuc: null }, { ngay_ket_thuc: { gte: now } }] },
      ],
    };

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.thong_bao.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_tao: 'desc' },
        include: {
          nguoi_tao: { select: { id: true, ho_ten: true } },
        },
      }),
      this.prisma.thong_bao.count({ where }),
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

  // -------------------------------------------------------------
  // ADMIN APIs (Quản trị Thông báo)
  // -------------------------------------------------------------

  async layDanhSachAdmin(dto: LayDanhSachThongBaoDto, user: any) {
    // Client yêu cầu limit tối đa 100
    const page = Math.max(1, parseInt(dto.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(dto.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Kiểm tra phạm vi xem thông báo
    const isAdminOrBGH =
      user.vai_tro.includes('SUPER_ADMIN') ||
      user.vai_tro.includes('QUAN_TRI_VIEN') ||
      user.vai_tro.includes('BAN_GIAM_HIEU');

    if (!isAdminOrBGH && user.vai_tro.includes('GIAO_VIEN')) {
      // Giáo viên xem danh sách thông báo quản trị do mình tạo hoặc xem thông báo chung
    }

    if (dto.tu_khoa && dto.tu_khoa.trim()) {
      const keyword = dto.tu_khoa.trim();
      where.OR = [
        { tieu_de: { contains: keyword, mode: 'insensitive' } },
        { noi_dung: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (dto.doi_tuong && dto.doi_tuong.trim()) {
      where.doi_tuong = dto.doi_tuong.trim() as DoiTuongThongBao;
    }

    if (dto.trang_thai !== undefined && dto.trang_thai !== '') {
      where.trang_thai = dto.trang_thai === 'true';
    }

    if (dto.nguoi_tao_id && dto.nguoi_tao_id.trim()) {
      where.nguoi_tao_id = dto.nguoi_tao_id.trim();
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.thong_bao.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_tao: 'desc' },
        include: {
          nguoi_tao: { select: { id: true, ho_ten: true, email: true } },
        },
      }),
      this.prisma.thong_bao.count({ where }),
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
    const thongBao = await this.prisma.thong_bao.findUnique({
      where: { id },
      include: {
        nguoi_tao: { select: { id: true, ho_ten: true, email: true } },
      },
    });

    if (!thongBao) {
      throw new NotFoundException('Không tìm thấy thông báo phù hợp.');
    }

    return {
      thanh_cong: true,
      du_lieu: thongBao,
    };
  }

  async taoThongBao(dto: TaoThongBaoDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.tieu_de || !dto.tieu_de.trim()) {
      throw new BadRequestException('Tiêu đề thông báo không được để trống.');
    }
    if (!dto.noi_dung || !dto.noi_dung.trim()) {
      throw new BadRequestException('Nội dung thông báo không được để trống.');
    }

    const targetDoiTuong = dto.doi_tuong || DoiTuongThongBao.CONG_KHAI;

    // QUY TẮC ĐỐI VỚI GIAO_VIEN: Không được tạo thông báo CONG_KHAI
    const isOnlyGiaoVien =
      user.vai_tro.includes('GIAO_VIEN') &&
      !user.vai_tro.includes('SUPER_ADMIN') &&
      !user.vai_tro.includes('QUAN_TRI_VIEN') &&
      !user.vai_tro.includes('BAN_GIAM_HIEU');

    if (isOnlyGiaoVien && targetDoiTuong === DoiTuongThongBao.CONG_KHAI) {
      throw new ForbiddenException(
        'Giáo viên không có quyền tạo thông báo CÔNG KHAI. Vui lòng chọn đối tượng Giáo viên, Học sinh hoặc Phụ huynh.',
      );
    }

    // Kiểm tra Ngày bắt đầu & Ngày kết thúc
    let ngayBatDau: Date | null = null;
    let ngayKetThuc: Date | null = null;

    if (dto.ngay_bat_dau) {
      ngayBatDau = new Date(dto.ngay_bat_dau);
      if (isNaN(ngayBatDau.getTime())) {
        throw new BadRequestException('Ngày bắt đầu không hợp lệ.');
      }
    }

    if (dto.ngay_ket_thuc) {
      ngayKetThuc = new Date(dto.ngay_ket_thuc);
      if (isNaN(ngayKetThuc.getTime())) {
        throw new BadRequestException('Ngày kết thúc không hợp lệ.');
      }
    }

    if (ngayBatDau && ngayKetThuc && ngayKetThuc < ngayBatDau) {
      throw new BadRequestException('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
    }

    const cleanNoiDung = this.sanitizeContent(dto.noi_dung);

    const thongBaoMoi = await this.prisma.thong_bao.create({
      data: {
        tieu_de: dto.tieu_de.trim(),
        noi_dung: cleanNoiDung,
        doi_tuong: targetDoiTuong,
        trang_thai: dto.trang_thai !== undefined ? dto.trang_thai : true,
        nguoi_tao_id: user.id, // Tác giả lấy duy nhất từ JWT
        ngay_bat_dau: ngayBatDau,
        ngay_ket_thuc: ngayKetThuc,
      },
    });

    await this.ghiNhatKy(
      user.id,
      'TAO_THONG_BAO',
      thongBaoMoi.id,
      null,
      JSON.stringify({ tieu_de: thongBaoMoi.tieu_de, doi_tuong: thongBaoMoi.doi_tuong }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo thông báo mới thành công.',
      du_lieu: thongBaoMoi,
    };
  }

  async suaThongBao(id: string, dto: SuaThongBaoDto, user: any, ip?: string, userAgent?: string) {
    const thongBao = await this.prisma.thong_bao.findUnique({ where: { id } });
    if (!thongBao) {
      throw new NotFoundException('Không tìm thấy thông báo phù hợp.');
    }

    const isOnlyGiaoVien =
      user.vai_tro.includes('GIAO_VIEN') &&
      !user.vai_tro.includes('SUPER_ADMIN') &&
      !user.vai_tro.includes('QUAN_TRI_VIEN') &&
      !user.vai_tro.includes('BAN_GIAM_HIEU');

    // Kiểm tra ownership của GIAO_VIEN
    if (isOnlyGiaoVien && thongBao.nguoi_tao_id !== user.id) {
      throw new ForbiddenException('Bạn chỉ có quyền chỉnh sửa thông báo do chính mình tạo.');
    }

    if (isOnlyGiaoVien && dto.doi_tuong === DoiTuongThongBao.CONG_KHAI) {
      throw new ForbiddenException(
        'Giáo viên không có quyền chuyển đối tượng thông báo thành CÔNG KHAI.',
      );
    }

    const dataUpdate: any = {};

    if (dto.tieu_de && dto.tieu_de.trim()) {
      dataUpdate.tieu_de = dto.tieu_de.trim();
    }

    if (dto.noi_dung && dto.noi_dung.trim()) {
      dataUpdate.noi_dung = this.sanitizeContent(dto.noi_dung);
    }

    if (dto.doi_tuong) {
      dataUpdate.doi_tuong = dto.doi_tuong;
    }

    if (dto.trang_thai !== undefined) {
      dataUpdate.trang_thai = dto.trang_thai;
    }

    if (dto.ngay_bat_dau !== undefined) {
      dataUpdate.ngay_bat_dau = dto.ngay_bat_dau ? new Date(dto.ngay_bat_dau) : null;
    }

    if (dto.ngay_ket_thuc !== undefined) {
      dataUpdate.ngay_ket_thuc = dto.ngay_ket_thuc ? new Date(dto.ngay_ket_thuc) : null;
    }

    const finalBatDau = dataUpdate.ngay_bat_dau !== undefined ? dataUpdate.ngay_bat_dau : thongBao.ngay_bat_dau;
    const finalKetThuc = dataUpdate.ngay_ket_thuc !== undefined ? dataUpdate.ngay_ket_thuc : thongBao.ngay_ket_thuc;

    if (finalBatDau && finalKetThuc && finalKetThuc < finalBatDau) {
      throw new BadRequestException('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
    }

    const updated = await this.prisma.thong_bao.update({
      where: { id },
      data: dataUpdate,
    });

    await this.ghiNhatKy(
      user.id,
      'SUA_THONG_BAO',
      id,
      JSON.stringify({ tieu_de: thongBao.tieu_de, doi_tuong: thongBao.doi_tuong }),
      JSON.stringify({ tieu_de: updated.tieu_de, doi_tuong: updated.doi_tuong }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật thông báo thành công.',
      du_lieu: updated,
    };
  }

  async doiTrangThai(id: string, dto: DoiTrangThaiThongBaoDto, user: any, ip?: string, userAgent?: string) {
    const thongBao = await this.prisma.thong_bao.findUnique({ where: { id } });
    if (!thongBao) {
      throw new NotFoundException('Không tìm thấy thông báo phù hợp.');
    }

    const isOnlyGiaoVien =
      user.vai_tro.includes('GIAO_VIEN') &&
      !user.vai_tro.includes('SUPER_ADMIN') &&
      !user.vai_tro.includes('QUAN_TRI_VIEN') &&
      !user.vai_tro.includes('BAN_GIAM_HIEU');

    if (isOnlyGiaoVien && thongBao.nguoi_tao_id !== user.id) {
      throw new ForbiddenException('Bạn chỉ có quyền thay đổi trạng thái thông báo do chính mình tạo.');
    }

    if (isOnlyGiaoVien && thongBao.doi_tuong === DoiTuongThongBao.CONG_KHAI) {
      throw new ForbiddenException('Giáo viên không có quyền thay đổi trạng thái thông báo CÔNG KHAI.');
    }

    const updated = await this.prisma.thong_bao.update({
      where: { id },
      data: { trang_thai: dto.trang_thai },
    });

    const action = dto.trang_thai ? 'BAT_THONG_BAO' : 'TAT_THONG_BAO';
    await this.ghiNhatKy(
      user.id,
      action,
      id,
      JSON.stringify({ trang_thai: thongBao.trang_thai }),
      JSON.stringify({ trang_thai: updated.trang_thai }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: dto.trang_thai ? 'Đã bật hiển thị thông báo.' : 'Đã tắt hiển thị thông báo.',
      du_lieu: updated,
    };
  }

  async xoaThongBao(id: string, user: any, ip?: string, userAgent?: string) {
    const thongBao = await this.prisma.thong_bao.findUnique({ where: { id } });
    if (!thongBao) {
      throw new NotFoundException('Không tìm thấy thông báo phù hợp.');
    }

    const isOnlyGiaoVien =
      user.vai_tro.includes('GIAO_VIEN') &&
      !user.vai_tro.includes('SUPER_ADMIN') &&
      !user.vai_tro.includes('QUAN_TRI_VIEN') &&
      !user.vai_tro.includes('BAN_GIAM_HIEU');

    if (isOnlyGiaoVien && thongBao.nguoi_tao_id !== user.id) {
      throw new ForbiddenException('Bạn chỉ có quyền xóa thông báo do chính mình tạo.');
    }

    // Xóa trực tiếp bản ghi theo đúng thiết kế V1 (ZERO migration)
    await this.prisma.thong_bao.delete({
      where: { id },
    });

    await this.ghiNhatKy(
      user.id,
      'XOA_THONG_BAO',
      id,
      JSON.stringify({ tieu_de: thongBao.tieu_de, doi_tuong: thongBao.doi_tuong }),
      null,
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa thông báo thành công.',
    };
  }

  // -------------------------------------------------------------
  // HELPER UTILITIES
  // -------------------------------------------------------------

  private sanitizeContent(htmlInput: string): string {
    if (!htmlInput) return '';
    return sanitizeHtml(htmlInput, {
      allowedTags: [
        'p', 'b', 'i', 'u', 'strong', 'em', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'br', 'hr', 'div', 'span',
      ],
      allowedAttributes: {
        a: ['href', 'name', 'target', 'title', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'style', 'class'],
        figure: ['class', 'style'],
        figcaption: ['class', 'style'],
        table: ['class', 'style', 'border', 'cellpadding', 'cellspacing'],
        td: ['colspan', 'rowspan', 'class', 'style'],
        th: ['colspan', 'rowspan', 'class', 'style'],
        '*': ['class', 'style'],
      },
      allowedSchemes: ['http', 'https', 'mailto', 'data'],
      allowedStyles: {
        '*': {
          'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
          'float': [/^left$/, /^right$/, /^none$/],
          'width': [/^\d+(?:px|%|em|rem)?$/],
          'height': [/^\d+(?:px|%|em|rem|auto)?$/],
          'max-width': [/^\d+(?:px|%|em|rem)?$/],
          'margin': [/.*/],
          'margin-left': [/.*/],
          'margin-right': [/.*/],
          'margin-top': [/.*/],
          'margin-bottom': [/.*/],
          'display': [/.*/],
        },
      },
      disallowedTagsMode: 'discard',
    });
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
          doi_tuong: 'thong_bao',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống thông báo:', e);
    }
  }
}
