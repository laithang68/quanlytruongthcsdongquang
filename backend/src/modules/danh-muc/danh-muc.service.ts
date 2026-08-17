import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DanhMucService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach() {
    const danhMucList = await this.prisma.danh_muc.findMany({
      where: { trang_thai: true, danh_muc_cha_id: null },
      orderBy: { thu_tu: 'asc' },
      include: {
        danh_muc_con: {
          where: { trang_thai: true },
          orderBy: { thu_tu: 'asc' },
        },
      },
    });

    return {
      thanh_cong: true,
      du_lieu: danhMucList,
    };
  }
}
