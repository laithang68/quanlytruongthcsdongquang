import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LoaiVanBanService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach() {
    const danhSach = await this.prisma.loai_van_ban.findMany({
      orderBy: { ten: 'asc' },
    });
    return {
      thanh_cong: true,
      du_lieu: danhSach,
    };
  }
}
