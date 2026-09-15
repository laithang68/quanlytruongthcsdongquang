import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class KiemTraService {
  constructor(private readonly prisma: PrismaService) {}

  async kiemTraHeThong() {
    let ket_noi_db = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      ket_noi_db = true;
    } catch (error) {
      ket_noi_db = false;
    }

    if (!ket_noi_db) {
      return {
        thanh_cong: false,
        thong_bao: 'Cơ sở dữ liệu không khả dụng',
        trang_thai_backend: 'HOAT_DONG',
        co_so_du_lieu: 'MAT_KET_NOI',
        thoi_gian: new Date().toISOString(),
      };
    }

    return {
      thanh_cong: true,
      thong_bao: 'Hệ thống đang hoạt động bình thường',
      trang_thai_backend: 'HOAT_DONG',
      co_so_du_lieu: 'DA_KET_NOI',
      thoi_gian: new Date().toISOString(),
    };
  }

  async layThongKeTongQuan(user?: any) {
    const hasAuditLogPerm =
      user &&
      (user.vai_tro?.includes('SUPER_ADMIN') ||
        user.vai_tro?.includes('QUAN_TRI_VIEN') ||
        user.quyen_han?.includes('nhat_ky_xem'));

    const [
      tongGiaoVien,
      tongHocSinh,
      tongLopHoc,
      tongBaiViet,
      baiVietXuatBan,
      baiVietNhap,
      baiVietChoDuyet,
      tongThongBao,
      thongBaoHienThi,
      thongBaoAn,
      tongVanBan,
      tongVideo,
      tongAlbum,
      tongThuVienSo,
      nhatKyGanDay,
      baiVietMoiNhat,
      thongBaoMoiNhat,
      vanBanMoiNhat,
    ] = await Promise.all([
      this.prisma.giao_vien.count({ where: { da_xoa: false } }),
      this.prisma.hoc_sinh.count({ where: { da_xoa: false } }),
      this.prisma.lop_hoc.count({ where: { trang_thai: true } }),
      this.prisma.bai_viet.count({ where: { da_xoa: false } }),
      this.prisma.bai_viet.count({ where: { trang_thai: 'DA_XUAT_BAN', da_xoa: false } }),
      this.prisma.bai_viet.count({ where: { trang_thai: 'NHAP', da_xoa: false } }),
      this.prisma.bai_viet.count({ where: { trang_thai: 'CHO_DUYET', da_xoa: false } }),
      this.prisma.thong_bao.count(),
      this.prisma.thong_bao.count({ where: { trang_thai: true } }),
      this.prisma.thong_bao.count({ where: { trang_thai: false } }),
      this.prisma.van_ban.count({ where: { da_xoa: false } }),
      this.prisma.video.count(),
      this.prisma.album.count(),
      this.prisma.tai_lieu.count({ where: { da_xoa: false } }),
      hasAuditLogPerm
        ? this.prisma.nhat_ky_he_thong.findMany({
            take: 50,
            orderBy: { ngay_tao: 'desc' },
            include: {
              nguoi_dung: { select: { ho_ten: true, email: true } },
            },
          })
        : Promise.resolve([]),
      this.prisma.bai_viet.findMany({
        take: 5,
        orderBy: { ngay_tao: 'desc' },
        where: { da_xoa: false },
        select: {
          id: true,
          tieu_de: true,
          trang_thai: true,
          ngay_tao: true,
          danh_muc: { select: { ten: true } },
        },
      }),
      this.prisma.thong_bao.findMany({
        take: 5,
        orderBy: { ngay_tao: 'desc' },
        select: {
          id: true,
          tieu_de: true,
          trang_thai: true,
          ngay_tao: true,
        },
      }),
      this.prisma.van_ban.findMany({
        take: 5,
        orderBy: { ngay_tao: 'desc' },
        where: { da_xoa: false },
        select: {
          id: true,
          ten_van_ban: true,
          so_hieu: true,
          ngay_ban_hanh: true,
          loai_van_ban: { select: { ten: true } },
        },
      }),
    ]);

    return {
      thanh_cong: true,
      du_lieu: {
        tong_so_giao_vien: tongGiaoVien,
        tong_so_hoc_sinh: tongHocSinh,
        tong_so_lop: tongLopHoc,
        tong_so_bai_viet: tongBaiViet,
        bai_viet_xuat_ban: baiVietXuatBan,
        bai_viet_nhap: baiVietNhap,
        bai_viet_cho_duyet: baiVietChoDuyet,
        tong_so_thong_bao: tongThongBao,
        thong_bao_hien_thi: thongBaoHienThi,
        thong_bao_an: thongBaoAn,
        tong_so_van_ban: tongVanBan,
        tong_so_video: tongVideo,
        tong_so_album: tongAlbum,
        tong_so_thu_vien_so: tongThuVienSo,
        nhat_ky_gan_day: nhatKyGanDay,
        bai_viet_moi_nhat: baiVietMoiNhat,
        thong_bao_moi_nhat: thongBaoMoiNhat,
        van_ban_moi_nhat: vanBanMoiNhat,
      },
    };
  }
}
