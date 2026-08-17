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
import { BaiVietService } from './bai-viet.service';
import { LayDanhSachBaiVietDto } from './dto/lay-danh-sach-bai-viet.dto';
import { TaoBaiVietDto } from './dto/tao-bai-viet.dto';
import { SuaBaiVietDto } from './dto/sua-bai-viet.dto';
import { TuChoiBaiVietDto } from './dto/tu-choi-bai-viet.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('bai-viet')
export class BaiVietController {
  constructor(private readonly baiVietService: BaiVietService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Công khai)
  // -------------------------------------------------------------

  @Get('cong-khai')
  layDanhSachPublic(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tu_khoa') tuKhoa?: string,
    @Query('danh_muc_id') danhMucId?: string,
  ) {
    return this.baiVietService.layDanhSachPublic(page, limit, tuKhoa, danhMucId);
  }

  @Get('cong-khai/:slug')
  layChiTietPublic(@Param('slug') slug: string) {
    return this.baiVietService.layChiTietPublic(slug);
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Bảo vệ bởi XacThucGuard & QuyenHanGuard)
  // -------------------------------------------------------------

  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_xem')
  layDanhSachAdmin(
    @Query() dto: LayDanhSachBaiVietDto,
    @NguoiDungHienTai() user: any,
  ) {
    return this.baiVietService.layDanhSachAdmin(dto, user);
  }

  @Get(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_xem')
  layChiTietAdmin(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
  ) {
    return this.baiVietService.layChiTietAdmin(id, user);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_tao')
  taoBaiViet(
    @Body() dto: TaoBaiVietDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.baiVietService.taoBaiViet(dto, user, ip, userAgent);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_sua')
  suaBaiViet(
    @Param('id') id: string,
    @Body() dto: SuaBaiVietDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.baiVietService.suaBaiViet(id, dto, user, ip, userAgent);
  }

  @Post(':id/gui-duyet')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_tao')
  guiDuyet(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.baiVietService.guiDuyet(id, user, ip, userAgent);
  }

  @Post(':id/duyet')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_duyet')
  pheDuyet(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.baiVietService.pheDuyet(id, user, ip, userAgent);
  }

  @Post(':id/tu-choi')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_duyet')
  tuChoi(
    @Param('id') id: string,
    @Body() dto: TuChoiBaiVietDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.baiVietService.tuChoi(id, dto, user, ip, userAgent);
  }

  @Post(':id/xuat-ban')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_xuat_ban')
  xuatBan(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.baiVietService.xuatBan(id, user, ip, userAgent);
  }

  @Post(':id/an')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_xuat_ban')
  anBaiViet(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.baiVietService.anBaiViet(id, user, ip, userAgent);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('bai_viet_xoa')
  xoaMem(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.baiVietService.xoaMem(id, user, ip, userAgent);
  }
}
