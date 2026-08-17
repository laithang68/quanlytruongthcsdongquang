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
import { LopHocService } from './lop-hoc.service';
import { TaoLopHocDto } from './dto/tao-lop-hoc.dto';
import { SuaLopHocDto } from './dto/sua-lop-hoc.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';

@Controller('lop-hoc')
export class LopHocController {
  constructor(private readonly lopHocService: LopHocService) {}

  @Get('cong-khai')
  async layDanhSachCongKhai(
    @Query('khoi') khoi?: string,
    @Query('nam_hoc') namHoc?: string,
  ) {
    const khoiNum = khoi ? parseInt(khoi, 10) : undefined;
    return this.lopHocService.layDanhSach(khoiNum, namHoc);
  }

  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('lop_hoc_xem')
  async layDanhSach(
    @Query('khoi') khoi?: string,
    @Query('nam_hoc') namHoc?: string,
  ) {
    const khoiNum = khoi ? parseInt(khoi, 10) : undefined;
    return this.lopHocService.layDanhSach(khoiNum, namHoc);
  }

  @Get(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('lop_hoc_xem')
  async layChiTiet(@Param('id') id: string) {
    return this.lopHocService.layChiTiet(id);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('lop_hoc_tao')
  async taoLopHoc(@Body() dto: TaoLopHocDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.lopHocService.taoLopHoc(dto, req.user, ip, userAgent);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('lop_hoc_sua')
  async suaLopHoc(
    @Param('id') id: string,
    @Body() dto: SuaLopHocDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.lopHocService.suaLopHoc(id, dto, req.user, ip, userAgent);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('lop_hoc_xoa')
  async xoaLopHoc(@Param('id') id: string, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.lopHocService.xoaLopHoc(id, req.user, ip, userAgent);
  }
}
