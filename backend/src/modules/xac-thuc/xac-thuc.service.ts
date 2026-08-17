import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { XacThucPhienService } from './xac-thuc-phien.service';

@Injectable()
export class XacThucService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly phienService: XacThucPhienService,
  ) {}

  async dangNhap(dto: DangNhapDto) {
    if (!dto.email || !dto.mat_khau) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác.');
    }

    const user = await this.prisma.nguoi_dung.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
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
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác.');
    }

    const isPasswordValid = await bcrypt.compare(dto.mat_khau, user.mat_khau);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác.');
    }

    // Cập nhật lần đăng nhập cuối
    await this.prisma.nguoi_dung.update({
      where: { id: user.id },
      data: { lan_dang_nhap_cuoi: new Date() },
    });

    // Tổng hợp vai trò và quyền hạn
    const vaiTroList = user.nguoi_dung_vai_tro.map((item) => item.vai_tro.ma);
    const quyenHanSet = new Set<string>();

    for (const item of user.nguoi_dung_vai_tro) {
      for (const vkqh of item.vai_tro.vai_tro_quyen_han) {
        quyenHanSet.add(vkqh.quyen_han.ma);
      }
    }

    // Tạo Access Token và Refresh Token với JTI
    const tokens = await this.taoTokens(user.id, user.email);

    return {
      thanh_cong: true,
      thong_bao: 'Đăng nhập thành công',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: 'Bearer',
      expires_in: this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
      nguoi_dung: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        anh_dai_dien: user.anh_dai_dien,
        vai_tro: vaiTroList,
        quyen_han: Array.from(quyenHanSet),
      },
    };
  }

  async dangXuat(user: any, refreshTokenCookie?: string) {
    if (user?.id) {
      this.phienService.thuHoiToanBoPhienNguoiDung(user.id);
    }
    if (refreshTokenCookie) {
      try {
        const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
        const payload = this.jwtService.verify<JwtPayload>(refreshTokenCookie, {
          secret: refreshSecret,
        });
        if (payload.jti) {
          this.phienService.thuHoiRefreshToken(payload.jti);
        }
      } catch (e) {
        // Token hết hạn hoặc không hợp lệ -> bỏ qua
      }
    }

    return {
      thanh_cong: true,
      thong_bao: 'Đăng xuất thành công',
    };
  }

  async lamMoiToken(refreshTokenInput: string) {
    if (!refreshTokenInput) {
      throw new UnauthorizedException('Refresh token không được để trống');
    }

    try {
      const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
      const payload = this.jwtService.verify<JwtPayload>(refreshTokenInput, {
        secret: refreshSecret,
      });

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      // 1. Kiểm tra xem Refresh Token có bị tái sử dụng hay không (Reuse Detection)
      if (this.phienService.laTokenDaBiSuDungLai(payload.jti)) {
        // Thu hồi toàn bộ phiên đăng nhập của người dùng để bảo vệ tài khoản
        this.phienService.thuHoiToanBoPhienNguoiDung(payload.sub);
        throw new UnauthorizedException(
          'Phát hiện hành vi bất thường. Toàn bộ phiên đã bị thu hồi. Vui lòng đăng nhập lại.',
        );
      }

      // 2. Kiểm tra tính hợp lệ của Refresh Token phía Server
      const isHopLe = this.phienService.kiemTraHopLe(payload.jti, payload.sub);
      if (!isHopLe) {
        throw new UnauthorizedException('Refresh token đã bị thu hồi hoặc hết hạn');
      }

      // 3. Kiểm tra trạng thái tài khoản trong Database
      const user = await this.prisma.nguoi_dung.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.da_xoa || !user.trang_thai) {
        this.phienService.thuHoiToanBoPhienNguoiDung(payload.sub);
        throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
      }

      // 4. Thu hồi Refresh Token cũ (Rotation)
      this.phienService.thuHoiRefreshToken(payload.jti);

      // 5. Cấp Access Token và Refresh Token mới
      const tokens = await this.taoTokens(user.id, user.email, payload.jti);

      return {
        thanh_cong: true,
        thong_bao: 'Làm mới token thành công',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: 'Bearer',
        expires_in: this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async layNguoiDungHienTai(user: any) {
    return {
      thanh_cong: true,
      du_lieu: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        anh_dai_dien: user.anh_dai_dien,
        vai_tro: user.vai_tro,
        quyen_han: user.quyen_han,
      },
    };
  }

  private async taoTokens(userId: string, email: string, parentJti?: string) {
    const jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    const jwtExpiresIn = this.configService.getOrThrow<string>('JWT_EXPIRES_IN');

    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');

    const refreshJti = this.phienService.taoJti();
    this.phienService.dangKyRefreshToken(refreshJti, userId, parentJti);

    const accessPayload: JwtPayload = { sub: userId, email, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, email, type: 'refresh', jti: refreshJti };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { access_token, refresh_token };
  }
}
