import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';
import { TrangThaiBaiViet } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LayDanhSachBaiVietDto } from './dto/lay-danh-sach-bai-viet.dto';
import { TaoBaiVietDto } from './dto/tao-bai-viet.dto';
import { SuaBaiVietDto } from './dto/sua-bai-viet.dto';
import { TuChoiBaiVietDto } from './dto/tu-choi-bai-viet.dto';

@Injectable()
export class BaiVietService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Công khai cho Khách viếng thăm)
  // -------------------------------------------------------------

  async layDanhSachPublic(pageInput?: string, limitInput?: string, tuKhoa?: string, danhMucId?: string) {
    const page = Math.max(1, parseInt(pageInput || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(limitInput || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      da_xoa: false,
      trang_thai: TrangThaiBaiViet.DA_XUAT_BAN,
    };

    if (tuKhoa && tuKhoa.trim()) {
      const keyword = tuKhoa.trim();
      where.OR = [
        { tieu_de: { contains: keyword, mode: 'insensitive' } },
        { mo_ta: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (danhMucId && danhMucId.trim()) {
      where.OR = [
        { danh_muc_id: danhMucId.trim() },
        { danh_muc: { slug: danhMucId.trim() } },
      ];
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.bai_viet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_xuat_ban: 'desc' },
        select: {
          id: true,
          tieu_de: true,
          slug: true,
          mo_ta: true,
          anh_dai_dien: true,
          luot_xem: true,
          ngay_xuat_ban: true,
          danh_muc: {
            select: { id: true, ten: true, slug: true },
          },
          tac_gia: {
            select: { id: true, ho_ten: true },
          },
          bai_viet_the: {
            select: {
              the: { select: { id: true, ten: true, slug: true } },
            },
          },
        },
      }),
      this.prisma.bai_viet.count({ where }),
    ]);

    const duLieuFormat = danhSach.map((item) => ({
      ...item,
      the: item.bai_viet_the.map((t) => t.the),
    }));

    return {
      thanh_cong: true,
      du_lieu: duLieuFormat,
      tong_so: tongSo,
      trang: page,
      limit,
      tong_so_trang: Math.ceil(tongSo / limit),
    };
  }

  async layChiTietPublic(slug: string) {
    const baiViet = await this.prisma.bai_viet.findFirst({
      where: {
        slug,
        da_xoa: false,
        trang_thai: TrangThaiBaiViet.DA_XUAT_BAN,
      },
      include: {
        danh_muc: { select: { id: true, ten: true, slug: true } },
        tac_gia: { select: { id: true, ho_ten: true } },
        bai_viet_the: {
          select: { the: { select: { id: true, ten: true, slug: true } } },
        },
      },
    });

    if (!baiViet) {
      throw new NotFoundException('Không tìm thấy bài viết hoặc bài viết chưa được xuất bản.');
    }

    // Tự động tăng lượt xem
    await this.prisma.bai_viet.update({
      where: { id: baiViet.id },
      data: { luot_xem: { increment: 1 } },
    });

    return {
      thanh_cong: true,
      du_lieu: {
        ...baiViet,
        luot_xem: baiViet.luot_xem + 1,
        the: baiViet.bai_viet_the.map((t) => t.the),
      },
    };
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Dành cho Quản trị viên & Tác giả)
  // -------------------------------------------------------------

  async layDanhSachAdmin(dto: LayDanhSachBaiVietDto, user: any) {
    const page = Math.max(1, parseInt(dto.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(dto.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      da_xoa: false,
    };

    // Kiểm tra phạm vi xem bài viết theo phân quyền
    const canViewAll =
      user.quyen_han.includes('bai_viet_duyet') ||
      user.quyen_han.includes('bai_viet_xuat_ban') ||
      user.vai_tro.includes('SUPER_ADMIN') ||
      user.vai_tro.includes('QUAN_TRI_VIEN');

    if (!canViewAll) {
      // Biên tập viên / Giáo viên thông thường chỉ nhìn thấy bài viết do mình tạo
      where.tac_gia_id = user.id;
    } else if (dto.tac_gia_id && dto.tac_gia_id.trim()) {
      where.tac_gia_id = dto.tac_gia_id.trim();
    }

    if (dto.tu_khoa && dto.tu_khoa.trim()) {
      const keyword = dto.tu_khoa.trim();
      where.OR = [
        { tieu_de: { contains: keyword, mode: 'insensitive' } },
        { mo_ta: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (dto.trang_thai && dto.trang_thai.trim()) {
      where.trang_thai = dto.trang_thai.trim() as TrangThaiBaiViet;
    }

    if (dto.danh_muc_id && dto.danh_muc_id.trim()) {
      where.danh_muc_id = dto.danh_muc_id.trim();
    }

    const [danhSach, tongSo] = await Promise.all([
      this.prisma.bai_viet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngay_tao: 'desc' },
        include: {
          danh_muc: { select: { id: true, ten: true, slug: true } },
          tac_gia: { select: { id: true, ho_ten: true, email: true } },
          bai_viet_the: {
            select: { the: { select: { id: true, ten: true, slug: true } } },
          },
        },
      }),
      this.prisma.bai_viet.count({ where }),
    ]);

    const duLieuFormat = danhSach.map((item) => ({
      ...item,
      the: item.bai_viet_the.map((t) => t.the),
    }));

    return {
      thanh_cong: true,
      du_lieu: duLieuFormat,
      tong_so: tongSo,
      trang: page,
      limit,
      tong_so_trang: Math.ceil(tongSo / limit),
    };
  }

  async layChiTietAdmin(id: string, user: any) {
    const baiViet = await this.prisma.bai_viet.findUnique({
      where: { id },
      include: {
        danh_muc: { select: { id: true, ten: true, slug: true } },
        tac_gia: { select: { id: true, ho_ten: true, email: true } },
        bai_viet_the: {
          select: { the: { select: { id: true, ten: true, slug: true } } },
        },
      },
    });

    if (!baiViet || baiViet.da_xoa) {
      throw new NotFoundException('Không tìm thấy bài viết phù hợp.');
    }

    const canViewAll =
      user.quyen_han.includes('bai_viet_duyet') ||
      user.quyen_han.includes('bai_viet_xuat_ban') ||
      user.vai_tro.includes('SUPER_ADMIN') ||
      user.vai_tro.includes('QUAN_TRI_VIEN');

    if (!canViewAll && baiViet.tac_gia_id !== user.id) {
      throw new ForbiddenException('Bạn không có quyền truy cập bài viết này.');
    }

    return {
      thanh_cong: true,
      du_lieu: {
        ...baiViet,
        the: baiViet.bai_viet_the.map((t) => t.the),
      },
    };
  }

  // -------------------------------------------------------------
  // WORKFLOW BIÊN TẬP BÀI VIẾT
  // -------------------------------------------------------------

  async taoBaiViet(dto: TaoBaiVietDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.tieu_de || !dto.tieu_de.trim()) {
      throw new BadRequestException('Tiêu đề bài viết không được để trống.');
    }
    if (!dto.noi_dung || !dto.noi_dung.trim()) {
      throw new BadRequestException('Nội dung bài viết không được để trống.');
    }
    if (!dto.danh_muc_id || !dto.danh_muc_id.trim()) {
      throw new BadRequestException('Vui lòng chọn danh mục cho bài viết.');
    }

    const danhMuc = await this.prisma.danh_muc.findUnique({
      where: { id: dto.danh_muc_id },
    });
    if (!danhMuc) {
      throw new BadRequestException('Danh mục được chọn không tồn tại.');
    }

    const cleanNoiDung = this.sanitizeContent(dto.noi_dung);
    const slugBase = this.taoSlug(dto.tieu_de);
    const uniqueSlug = await this.taoUniqueSlug(slugBase);

    // Xử lý Thẻ bài viết trong Transaction
    const baiVietMoi = await this.prisma.$transaction(async (tx) => {
      const created = await tx.bai_viet.create({
        data: {
          tieu_de: dto.tieu_de.trim(),
          slug: uniqueSlug,
          mo_ta: dto.mo_ta ? dto.mo_ta.trim() : null,
          noi_dung: cleanNoiDung,
          anh_dai_dien: dto.anh_dai_dien || null,
          danh_muc_id: dto.danh_muc_id,
          tac_gia_id: user.id,
          trang_thai: TrangThaiBaiViet.NHAP,
        },
      });

      if (dto.the && Array.isArray(dto.the) && dto.the.length > 0) {
        for (const theName of dto.the) {
          if (!theName || !theName.trim()) continue;
          const tagSlug = this.taoSlug(theName);

          const tag = await tx.the.upsert({
            where: { slug: tagSlug },
            update: {},
            create: {
              ten: theName.trim(),
              slug: tagSlug,
            },
          });

          await tx.bai_viet_the.create({
            data: {
              bai_viet_id: created.id,
              the_id: tag.id,
            },
          });
        }
      }

      return created;
    });

    await this.ghiNhatKy(
      user.id,
      'TAO_BAI_VIET',
      baiVietMoi.id,
      null,
      JSON.stringify({ tieu_de: baiVietMoi.tieu_de, trang_thai: baiVietMoi.trang_thai }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Tạo bài viết nháp thành công.',
      du_lieu: baiVietMoi,
    };
  }

  async suaBaiViet(id: string, dto: SuaBaiVietDto, user: any, ip?: string, userAgent?: string) {
    const baiViet = await this.prisma.bai_viet.findUnique({
      where: { id },
      include: { bai_viet_the: true },
    });

    if (!baiViet || baiViet.da_xoa) {
      throw new NotFoundException('Không tìm thấy bài viết phù hợp.');
    }

    // GIAI ĐOẠN 5.1: KHÓA CHỈNH SỬA TRỰC TIẾP
    // Chỉ cho phép sửa bài ở trạng thái NHAP hoặc TU_CHOI
    if (
      baiViet.trang_thai !== TrangThaiBaiViet.NHAP &&
      baiViet.trang_thai !== TrangThaiBaiViet.TU_CHOI
    ) {
      throw new BadRequestException(
        'Chỉ bài viết ở trạng thái NHÁP hoặc TỪ CHỐI mới có thể chỉnh sửa.',
      );
    }

    const canEditAll =
      user.quyen_han.includes('bai_viet_duyet') ||
      user.vai_tro.includes('SUPER_ADMIN') ||
      user.vai_tro.includes('QUAN_TRI_VIEN');

    if (!canEditAll && baiViet.tac_gia_id !== user.id) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài viết của tác giả khác.');
    }

    const dataUpdate: any = {};

    if (dto.tieu_de && dto.tieu_de.trim() && dto.tieu_de.trim() !== baiViet.tieu_de) {
      dataUpdate.tieu_de = dto.tieu_de.trim();
      dataUpdate.slug = await this.taoUniqueSlug(this.taoSlug(dto.tieu_de), id);
    }

    if (dto.mo_ta !== undefined) {
      dataUpdate.mo_ta = dto.mo_ta ? dto.mo_ta.trim() : null;
    }

    if (dto.noi_dung && dto.noi_dung.trim()) {
      dataUpdate.noi_dung = this.sanitizeContent(dto.noi_dung);
    }

    if (dto.anh_dai_dien !== undefined) {
      dataUpdate.anh_dai_dien = dto.anh_dai_dien || null;
    }

    if (dto.danh_muc_id && dto.danh_muc_id.trim()) {
      const danhMuc = await this.prisma.danh_muc.findUnique({ where: { id: dto.danh_muc_id } });
      if (!danhMuc) {
        throw new BadRequestException('Danh mục được chọn không tồn tại.');
      }
      dataUpdate.danh_muc_id = dto.danh_muc_id;
    }

    // Nếu bài đang bị TỪ CHỐI, khi sửa thành công sẽ tự động chuyển về NHÁP
    if (baiViet.trang_thai === TrangThaiBaiViet.TU_CHOI) {
      dataUpdate.trang_thai = TrangThaiBaiViet.NHAP;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.bai_viet.update({
        where: { id },
        data: dataUpdate,
      });

      if (dto.the && Array.isArray(dto.the)) {
        await tx.bai_viet_the.deleteMany({ where: { bai_viet_id: id } });
        for (const theName of dto.the) {
          if (!theName || !theName.trim()) continue;
          const tagSlug = this.taoSlug(theName);
          const tag = await tx.the.upsert({
            where: { slug: tagSlug },
            update: {},
            create: { ten: theName.trim(), slug: tagSlug },
          });
          await tx.bai_viet_the.create({
            data: { bai_viet_id: id, the_id: tag.id },
          });
        }
      }

      return res;
    });

    await this.ghiNhatKy(
      user.id,
      'SUA_BAI_VIET',
      id,
      JSON.stringify({ tieu_de: baiViet.tieu_de, trang_thai: baiViet.trang_thai }),
      JSON.stringify({ tieu_de: updated.tieu_de, trang_thai: updated.trang_thai }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Cập nhật bài viết thành công.',
      du_lieu: updated,
    };
  }

  async guiDuyet(id: string, user: any, ip?: string, userAgent?: string) {
    const baiViet = await this.prisma.bai_viet.findUnique({ where: { id } });
    if (!baiViet || baiViet.da_xoa) {
      throw new NotFoundException('Không tìm thấy bài viết phù hợp.');
    }

    if (baiViet.tac_gia_id !== user.id && !user.vai_tro.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Bạn chỉ có thể gửi duyệt bài viết do mình tạo.');
    }

    if (baiViet.trang_thai !== TrangThaiBaiViet.NHAP) {
      throw new BadRequestException('Chỉ bài viết ở trạng thái NHÁP mới có thể gửi duyệt.');
    }

    const updated = await this.prisma.bai_viet.update({
      where: { id },
      data: {
        trang_thai: TrangThaiBaiViet.CHO_DUYET,
        ngay_gui_duyet: new Date(),
      },
    });

    await this.ghiNhatKy(
      user.id,
      'GUI_DUYET_BAI_VIET',
      id,
      JSON.stringify({ trang_thai: TrangThaiBaiViet.NHAP }),
      JSON.stringify({ trang_thai: TrangThaiBaiViet.CHO_DUYET, ngay_gui_duyet: updated.ngay_gui_duyet }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Gửi duyệt bài viết thành công. Bài viết đang chờ Ban biên tập phê duyệt.',
      du_lieu: updated,
    };
  }

  async pheDuyet(id: string, user: any, ip?: string, userAgent?: string) {
    const baiViet = await this.prisma.bai_viet.findUnique({ where: { id } });
    if (!baiViet || baiViet.da_xoa) {
      throw new NotFoundException('Không tìm thấy bài viết phù hợp.');
    }

    if (baiViet.trang_thai !== TrangThaiBaiViet.CHO_DUYET) {
      throw new BadRequestException('Chỉ bài viết ở trạng thái CHỜ DUYỆT mới có thể phê duyệt.');
    }

    const now = new Date();
    const updated = await this.prisma.bai_viet.update({
      where: { id },
      data: {
        trang_thai: TrangThaiBaiViet.DA_DUYET,
        ngay_duyet: now,
      },
    });

    await this.ghiNhatKy(
      user.id,
      'DUYET_BAI_VIET',
      id,
      JSON.stringify({ trang_thai: TrangThaiBaiViet.CHO_DUYET }),
      JSON.stringify({
        trang_thai: TrangThaiBaiViet.DA_DUYET,
        ngay_duyet: now,
        nguoi_duyet_email: user.email,
      }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Phê duyệt bài viết thành công.',
      du_lieu: updated,
    };
  }

  async tuChoi(id: string, dto: TuChoiBaiVietDto, user: any, ip?: string, userAgent?: string) {
    if (!dto.ly_do || !dto.ly_do.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối bài viết.');
    }

    const baiViet = await this.prisma.bai_viet.findUnique({ where: { id } });
    if (!baiViet || baiViet.da_xoa) {
      throw new NotFoundException('Không tìm thấy bài viết phù hợp.');
    }

    if (baiViet.trang_thai !== TrangThaiBaiViet.CHO_DUYET) {
      throw new BadRequestException('Chỉ bài viết ở trạng thái CHỜ DUYỆT mới có thể từ chối.');
    }

    const updated = await this.prisma.bai_viet.update({
      where: { id },
      data: {
        trang_thai: TrangThaiBaiViet.TU_CHOI,
      },
    });

    await this.ghiNhatKy(
      user.id,
      'TU_CHOI_BAI_VIET',
      id,
      JSON.stringify({ trang_thai: TrangThaiBaiViet.CHO_DUYET }),
      JSON.stringify({
        trang_thai: TrangThaiBaiViet.TU_CHOI,
        ly_do_tu_choi: dto.ly_do.trim(),
        nguoi_tu_choi_email: user.email,
      }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Từ chối bài viết thành công. Lý do từ chối đã được phản hồi cho tác giả.',
      du_lieu: updated,
    };
  }

  async xuatBan(id: string, user: any, ip?: string, userAgent?: string) {
    const baiViet = await this.prisma.bai_viet.findUnique({ where: { id } });
    if (!baiViet || baiViet.da_xoa) {
      throw new NotFoundException('Không tìm thấy bài viết phù hợp.');
    }

    const canDirectPublish =
      user.vai_tro?.includes('SUPER_ADMIN') ||
      user.vai_tro?.includes('QUAN_TRI_VIEN') ||
      user.quyen_han?.includes('bai_viet_xuat_ban');

    if (!canDirectPublish && baiViet.trang_thai !== TrangThaiBaiViet.DA_DUYET) {
      throw new BadRequestException(
        'Chỉ bài viết ở trạng thái ĐÃ DUYỆT mới có thể xuất bản.',
      );
    }

    const now = new Date();
    const updated = await this.prisma.bai_viet.update({
      where: { id },
      data: {
        trang_thai: TrangThaiBaiViet.DA_XUAT_BAN,
        ngay_xuat_ban: baiViet.ngay_xuat_ban || now,
      },
    });

    await this.ghiNhatKy(
      user.id,
      'XUAT_BAN_BAI_VIET',
      id,
      JSON.stringify({ trang_thai: baiViet.trang_thai }),
      JSON.stringify({ trang_thai: TrangThaiBaiViet.DA_XUAT_BAN, ngay_xuat_ban: updated.ngay_xuat_ban }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xuất bản bài viết lên Cổng thông tin thành công.',
      du_lieu: updated,
    };
  }

  async anBaiViet(id: string, user: any, ip?: string, userAgent?: string) {
    const baiViet = await this.prisma.bai_viet.findUnique({ where: { id } });
    if (!baiViet || baiViet.da_xoa) {
      throw new NotFoundException('Không tìm thấy bài viết phù hợp.');
    }

    if (baiViet.trang_thai !== TrangThaiBaiViet.DA_XUAT_BAN) {
      throw new BadRequestException('Chỉ bài viết ĐÃ XUẤT BẢN mới có thể ẩn khỏi Cổng thông tin.');
    }

    const updated = await this.prisma.bai_viet.update({
      where: { id },
      data: {
        trang_thai: TrangThaiBaiViet.DA_LUU_TRU, // Ánh xạ ĐÃ ẨN
      },
    });

    await this.ghiNhatKy(
      user.id,
      'AN_BAI_VIET',
      id,
      JSON.stringify({ trang_thai: TrangThaiBaiViet.DA_XUAT_BAN }),
      JSON.stringify({ trang_thai: TrangThaiBaiViet.DA_LUU_TRU }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Ẩn bài viết khỏi Cổng thông tin thành công.',
      du_lieu: updated,
    };
  }

  async xoaMem(id: string, user: any, ip?: string, userAgent?: string) {
    const baiViet = await this.prisma.bai_viet.findUnique({ where: { id } });
    if (!baiViet || baiViet.da_xoa) {
      throw new NotFoundException('Không tìm thấy bài viết phù hợp.');
    }

    const canDeleteAll =
      user.quyen_han.includes('bai_viet_xoa') ||
      user.vai_tro.includes('SUPER_ADMIN') ||
      user.vai_tro.includes('QUAN_TRI_VIEN');

    if (!canDeleteAll && baiViet.tac_gia_id !== user.id) {
      throw new ForbiddenException('Bạn không có quyền xóa bài viết của tác giả khác.');
    }

    const updated = await this.prisma.bai_viet.update({
      where: { id },
      data: {
        da_xoa: true,
        ngay_xoa: new Date(),
      },
    });

    await this.ghiNhatKy(
      user.id,
      'XOA_MEM_BAI_VIET',
      id,
      JSON.stringify({ da_xoa: false }),
      JSON.stringify({ da_xoa: true, ngay_xoa: updated.ngay_xoa }),
      ip,
      userAgent,
    );

    return {
      thanh_cong: true,
      thong_bao: 'Xóa mềm bài viết thành công.',
    };
  }

  // -------------------------------------------------------------
  // HELPER UTILITIES
  // -------------------------------------------------------------

  // GIAI ĐOẠN 5.1: SIẾT CHẶT SANITIZE HTML (HỖ TRỢ BÀI VIẾT BÁO CHÍ CHUYÊN NGHIỆP)
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

  private taoSlug(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async taoUniqueSlug(baseSlug: string, currentId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.bai_viet.findFirst({
        where: {
          slug,
          ...(currentId ? { NOT: { id: currentId } } : {}),
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
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
          doi_tuong: 'bai_viet',
          doi_tuong_id: doiTuongId,
          noi_dung_cu: noiDungCu,
          noi_dung_moi: noiDungMoi,
          dia_chi_ip: ip || null,
          thong_tin_thiet_bi: userAgent || null,
        },
      });
    } catch (e) {
      console.error('Lỗi khi ghi nhật ký hệ thống bài viết:', e);
    }
  }
}
