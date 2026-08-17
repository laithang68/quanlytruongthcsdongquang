import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ToChuyenMonService } from './to-chuyen-mon.service';
import { TaoToChuyenMonDto } from './dto/tao-to-chuyen-mon.dto';
import { SuaToChuyenMonDto } from './dto/sua-to-chuyen-mon.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('to-chuyen-mon')
export class ToChuyenMonController {
  constructor(private readonly toChuyenMonService: ToChuyenMonService) {}

  @Get()
  layDanhSach() {
    return this.toChuyenMonService.layDanhSach();
  }

  @Get(':id')
  layChiTiet(@Param('id') id: string) {
    return this.toChuyenMonService.layChiTiet(id);
  }

  @Get(':id/giao-vien')
  layDanhSachGiaoVien(@Param('id') id: string) {
    return this.toChuyenMonService.layDanhSachGiaoVien(id);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('giao_vien_tao')
  taoToChuyenMon(
    @Body() dto: TaoToChuyenMonDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.toChuyenMonService.taoToChuyenMon(dto, user, ip, userAgent);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('giao_vien_sua')
  suaToChuyenMon(
    @Param('id') id: string,
    @Body() dto: SuaToChuyenMonDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.toChuyenMonService.suaToChuyenMon(id, dto, user, ip, userAgent);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('giao_vien_xoa')
  xoaToChuyenMon(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.toChuyenMonService.xoaToChuyenMon(id, user, ip, userAgent);
  }
}
