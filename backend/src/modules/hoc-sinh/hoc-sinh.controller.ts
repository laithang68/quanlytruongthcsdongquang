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
import { LenLopDto } from './dto/len-lop.dto';
import { LuuBanDto } from './dto/luu-ban.dto';
import { TotNghiepDto } from './dto/tot-nghiep.dto';
import { NhapHocSinhExcelDto } from './dto/nhap-hoc-sinh-excel.dto';
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
  @QuyenHan('hoc_sinh_xuat_excel')
  async xuatExcel(@Query() dto: LayDanhSachHocSinhDto) {
    return this.hocSinhService.xuatDanhSachExcel(dto);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_tao')
  async taoHocSinh(
    @Body() dto: TaoHocSinhDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.hocSinhService.taoHocSinh(dto, req.user, ip, userAgent);
  }

  @Post('nhap-excel')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_tao')
  async nhapExcel(
    @Body() dto: NhapHocSinhExcelDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.hocSinhService.nhapDanhSachExcel(dto, req.user, ip, userAgent);
  }

  @Patch('chuyen-lop')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_sua')
  async chuyenLop(
    @Body() dto: ChuyenLopDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.hocSinhService.chuyenLop(dto, req.user, ip, userAgent);
  }

  @Post('len-lop')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_sua')
  async lenLop(
    @Body() dto: LenLopDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.hocSinhService.lenLop(dto, req.user, ip, userAgent);
  }

  @Post('luu-ban')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_sua')
  async luuBan(
    @Body() dto: LuuBanDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.hocSinhService.luuBan(dto, req.user, ip, userAgent);
  }

  @Post('tot-nghiep')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_sua')
  async danhDauTotNghiep(
    @Body() dto: TotNghiepDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.hocSinhService.danhDauTotNghiep(dto, req.user, ip, userAgent);
  }

  @Post(':id/dat-lai-mat-khau')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('hoc_sinh_sua')
  async datLaiMatKhau(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.hocSinhService.datLaiMatKhau(id, req.user, ip, userAgent);
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
