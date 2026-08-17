import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { VanBanService } from './van-ban.service';
import { LayDanhSachVanBanDto } from './dto/lay-danh-sach-van-ban.dto';
import { TaoVanBanDto } from './dto/tao-van-ban.dto';
import { SuaVanBanDto } from './dto/sua-van-ban.dto';
import { DoiTrangThaiVanBanDto } from './dto/doi-trang-thai-van-ban.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('van-ban')
export class VanBanController {
  constructor(private readonly vanBanService: VanBanService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Công khai)
  // -------------------------------------------------------------

  @Get('cong-khai')
  layDanhSachPublic(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tu_khoa') tuKhoa?: string,
    @Query('loai_van_ban_id') loaiVanBanId?: string,
    @Query('loai_van_ban_ma') loaiVanBanMa?: string,
    @Query('co_quan_ban_hanh') coQuanBanHanh?: string,
    @Query('thoi_gian') thoiGian?: string,
  ) {
    return this.vanBanService.layDanhSachPublic(
      page,
      limit,
      tuKhoa,
      loaiVanBanMa || loaiVanBanId,
      coQuanBanHanh,
      thoiGian,
    );
  }

  @Get('cong-khai/:id')
  layChiTietPublic(@Param('id') id: string) {
    return this.vanBanService.layChiTietPublic(id);
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Bảo vệ bởi XacThucGuard & QuyenHanGuard)
  // -------------------------------------------------------------

  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('van_ban_xem')
  layDanhSachAdmin(
    @Query() dto: LayDanhSachVanBanDto,
    @NguoiDungHienTai() user: any,
  ) {
    return this.vanBanService.layDanhSachAdmin(dto, user);
  }

  @Get(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('van_ban_xem')
  layChiTietAdmin(@Param('id') id: string) {
    return this.vanBanService.layChiTietAdmin(id);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('van_ban_tao')
  taoVanBan(
    @Body() dto: TaoVanBanDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.vanBanService.taoVanBan(dto, user, ip, userAgent);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('van_ban_sua')
  suaVanBan(
    @Param('id') id: string,
    @Body() dto: SuaVanBanDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.vanBanService.suaVanBan(id, dto, user, ip, userAgent);
  }

  @Patch(':id/trang-thai')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('van_ban_sua')
  doiTrangThai(
    @Param('id') id: string,
    @Body() dto: DoiTrangThaiVanBanDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.vanBanService.doiTrangThai(id, dto, user, ip, userAgent);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('van_ban_xoa')
  xoaMem(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.vanBanService.xoaMem(id, user, ip, userAgent);
  }
}
