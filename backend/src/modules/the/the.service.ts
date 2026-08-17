import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TheService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach() {
    const theList = await this.prisma.the.findMany({
      orderBy: { ten: 'asc' },
    });
    return {
      thanh_cong: true,
      du_lieu: theList,
    };
  }
}
