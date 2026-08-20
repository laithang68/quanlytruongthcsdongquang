import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DanhMucBoMonService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach() {
    const list = await this.prisma.danh_muc_bo_mon.findMany({
      where: { trang_thai: true },
      orderBy: [{ thu_tu: 'asc' }, { ten: 'asc' }],
    });

    return {
      thanh_cong: true,
      du_lieu: list,
    };
  }
}
