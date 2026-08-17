import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id: payload.sub },
      include: {
        nguoi_dung_vai_tro: {
          include: {
            vai_tro: {
              include: {
                vai_tro_quyen_han: {
                  include: {
                    quyen_han: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.da_xoa || !user.trang_thai) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    const vaiTroList = user.nguoi_dung_vai_tro.map((item) => item.vai_tro.ma);
    const quyenHanSet = new Set<string>();

    for (const item of user.nguoi_dung_vai_tro) {
      for (const vkqh of item.vai_tro.vai_tro_quyen_han) {
        quyenHanSet.add(vkqh.quyen_han.ma);
      }
    }

    return {
      id: user.id,
      ho_ten: user.ho_ten,
      email: user.email,
      so_dien_thoai: user.so_dien_thoai,
      anh_dai_dien: user.anh_dai_dien,
      vai_tro: vaiTroList,
      quyen_han: Array.from(quyenHanSet),
    };
  }
}
