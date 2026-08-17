import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { LienHeService } from './lien-he.service';
import { TaoLienHeDto } from './dto/tao-lien-he.dto';
import { LayDanhSachLienHeDto } from './dto/lay-danh-sach-lien-he.dto';
import { CapNhatTrangThaiLienHeDto } from './dto/cap-nhat-trang-thai.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { Response } from 'express';

@Controller('lien-he')
export class LienHeController {
  constructor(private readonly lienHeService: LienHeService) {}

  // -------------------------------------------------------------
  // PUBLIC API: Công dân gửi thông tin phản ánh
  // -------------------------------------------------------------
  @Post('cong-khai')
  async taoPublic(@Body() dto: TaoLienHeDto) {
    return this.lienHeService.taoPublic(dto);
  }

  // -------------------------------------------------------------
  // ADMIN APIs: Quản trị Thông tin phản ánh (Bảo vệ bằng XacThucGuard)
  // -------------------------------------------------------------
  @Get()
  @UseGuards(XacThucGuard)
  async layDanhSachAdmin(@Query() dto: LayDanhSachLienHeDto) {
    return this.lienHeService.layDanhSachAdmin(dto);
  }

  @Get('xuat-excel')
  @UseGuards(XacThucGuard)
  async xuatExcel(
    @Query() dto: LayDanhSachLienHeDto,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.lienHeService.xuatExcel(dto, res, req.user, ip, userAgent);
  }

  @Get(':id')
  @UseGuards(XacThucGuard)
  async layChiTietAdmin(@Param('id') id: string) {
    return this.lienHeService.layChiTietAdmin(id);
  }

  @Patch(':id/trang-thai')
  @UseGuards(XacThucGuard)
  async capNhatTrangThai(
    @Param('id') id: string,
    @Body() dto: CapNhatTrangThaiLienHeDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.lienHeService.capNhatTrangThai(id, dto, req.user, ip, userAgent);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard)
  async xoaLienHe(@Param('id') id: string, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.lienHeService.xoaLienHe(id, req.user, ip, userAgent);
  }
}
