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
} from '@nestjs/common';
import { HocSinhService } from './hoc-sinh.service';
import { LayDanhSachHocSinhDto } from './dto/lay-danh-sach-hoc-sinh.dto';
import { TaoHocSinhDto } from './dto/tao-hoc-sinh.dto';
import { SuaHocSinhDto } from './dto/sua-hoc-sinh.dto';
import { ChuyenLopDto } from './dto/chuyen-lop.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';

@Controller('hoc-sinh')
export class HocSinhController {
  constructor(private readonly hocSinhService: HocSinhService) {}

  @Get('cong-khai')
  async layDanhSachPublic(@Query('lop_hoc_id') lopHocId?: string) {
    return this.hocSinhService.layDanhSachPublic(lopHocId);
  }

  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_xem')
  async layDanhSachAdmin(@Query() dto: LayDanhSachHocSinhDto) {
    return this.hocSinhService.layDanhSachAdmin(dto);
  }

  @Get('xuat-excel')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_xem')
  async xuatExcel(@Query() dto: LayDanhSachHocSinhDto) {
    return this.hocSinhService.xuatDanhSachExcel(dto);
  }

  @Get(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_xem')
  async layChiTietAdmin(@Param('id') id: string) {
    return this.hocSinhService.layChiTietAdmin(id);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_sua')
  async suaHocSinh(
    @Param('id') id: string,
    @Body() dto: SuaHocSinhDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.hocSinhService.suaHocSinh(id, dto, req.user, ip, userAgent);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_xoa')
  async xoaMem(@Param('id') id: string, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.hocSinhService.xoaMem(id, req.user, ip, userAgent);
  }
}
