import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { KiemTraService } from './kiem-tra.service';
import { PrismaService } from '../../database/prisma.service';

@Controller('kiem-tra')
export class KiemTraController {
  constructor(
    private readonly kiemTraService: KiemTraService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  kiemTra() {
    return this.kiemTraService.kiemTraHeThong();
  }

  @Get('thong-ke')
  async layThongKe(@Req() req: Request) {
    let currentUser: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify(token);
        if (payload && payload.sub) {
          const user = await this.prisma.nguoi_dung.findUnique({
            where: { id: payload.sub },
            include: {
              nguoi_dung_vai_tro: {
                include: {
                  vai_tro: {
                    include: {
                      vai_tro_quyen_han: {
                        include: { quyen_han: true },
                      },
                    },
                  },
                },
              },
            },
          });
          if (user && user.trang_thai && !user.da_xoa) {
            const roles = user.nguoi_dung_vai_tro.map((r) => r.vai_tro.ma);
            const permissions = Array.from(
              new Set(
                user.nguoi_dung_vai_tro.flatMap((r) =>
                  r.vai_tro.vai_tro_quyen_han.map((p) => p.quyen_han.ma)
                )
              )
            );
            currentUser = {
              id: user.id,
              ho_ten: user.ho_ten,
              email: user.email,
              vai_tro: roles,
              quyen_han: permissions,
            };
          }
        }
      } catch (e) {}
    }

    return this.kiemTraService.layThongKeTongQuan(currentUser);
  }
}
