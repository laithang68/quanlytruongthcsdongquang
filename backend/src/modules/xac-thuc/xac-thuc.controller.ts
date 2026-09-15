import { Controller, Post, Get, Body, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { XacThucService } from './xac-thuc.service';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { XacThucGuard } from './guards/xac-thuc.guard';
import { QuyenHanGuard } from './guards/quyen-han.guard';
import { QuyenHan } from './decorators/quyen-han.decorator';
import { NguoiDungHienTai } from './decorators/nguoi-dung-hien-tai.decorator';

@Controller('xac-thuc')
export class XacThucController {
  constructor(private readonly xacThucService: XacThucService) {}

  private isCookieSecure(): boolean {
    if (process.env.COOKIE_SECURE !== undefined) {
      return process.env.COOKIE_SECURE === 'true';
    }
    const frontendUrl = process.env.FRONTEND_URL || '';
    return process.env.NODE_ENV === 'production' && frontendUrl.startsWith('https://');
  }

  @Post('dang-nhap')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Giới hạn 5 lần thử/phút chống brute-force
  async dangNhap(
    @Body() dto: DangNhapDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.xacThucService.dangNhap(dto);

    // 1. Thiết lập HttpOnly Cookie cho Refresh Token (Secure khi chạy HTTPS hoặc COOKIE_SECURE=true)
    res.cookie('thcs_dong_quang_refresh', result.refresh_token, {
      httpOnly: true,
      secure: this.isCookieSecure(),
      sameSite: 'lax',
      path: '/api/v1/xac-thuc',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    // 2. Loại bỏ refresh_token khỏi JSON trả về client
    const { refresh_token, ...responseJson } = result;
    return responseJson;
  }

  @Post('dang-xuat')
  @UseGuards(XacThucGuard)
  async dangXuat(
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshTokenCookie = req.cookies?.['thcs_dong_quang_refresh'];
    const result = await this.xacThucService.dangXuat(user, refreshTokenCookie);

    // Xóa HttpOnly Cookie phía client
    res.clearCookie('thcs_dong_quang_refresh', { path: '/api/v1/xac-thuc' });

    return result;
  }

  @Post('lam-moi')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async lamMoiToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // CHỈ nhận Refresh Token từ HttpOnly Cookie thcs_dong_quang_refresh
    const refreshTokenCookie = req.cookies?.['thcs_dong_quang_refresh'];

    if (!refreshTokenCookie) {
      throw new UnauthorizedException('Refresh token cookie không tồn tại');
    }

    const result = await this.xacThucService.lamMoiToken(refreshTokenCookie);

    // Gửi HttpOnly Cookie mới cho Refresh Token đã được Rotate
    res.cookie('thcs_dong_quang_refresh', result.refresh_token, {
      httpOnly: true,
      secure: this.isCookieSecure(),
      sameSite: 'lax',
      path: '/api/v1/xac-thuc',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Loại bỏ refresh_token khỏi JSON trả về client
    const { refresh_token, ...responseJson } = result;
    return responseJson;
  }

  @Get('toi')
  @UseGuards(XacThucGuard)
  layNguoiDungHienTai(@NguoiDungHienTai() user: any) {
    return this.xacThucService.layNguoiDungHienTai(user);
  }

  @Get('kiem-tra-quyen')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_tao')
  kiemTraQuyen(@NguoiDungHienTai() user: any) {
    return {
      thanh_cong: true,
      thong_bao: 'Bạn có quyền bai_viet_tao để thực hiện thao tác này',
      nguoi_dung: user.email,
    };
  }
}
