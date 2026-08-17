import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { NguoiDungService } from './nguoi-dung.service';
import { LayDanhSachNguoiDungDto } from './dto/lay-danh-sach-nguoi-dung.dto';
import { TaoNguoiDungDto } from './dto/tao-nguoi-dung.dto';
import { SuaNguoiDungDto } from './dto/sua-nguoi-dung.dto';
import { DatLaiMatKhauDto } from './dto/dat-lai-mat-khau.dto';
import { GanVaiTroDto } from './dto/gan-vai-tro.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('nguoi-dung')
@UseGuards(XacThucGuard, QuyenHanGuard)
export class NguoiDungController {
  constructor(private readonly nguoiDungService: NguoiDungService) {}

  @Get()
  @QuyenHan('nguoi_dung_xem')
  layDanhSach(@Query() dto: LayDanhSachNguoiDungDto) {
    return this.nguoiDungService.layDanhSach(dto);
  }

  @Get(':id')
  @QuyenHan('nguoi_dung_xem')
  layChiTiet(@Param('id') id: string) {
    return this.nguoiDungService.layChiTiet(id);
  }

  @Post()
  @QuyenHan('nguoi_dung_tao')
  taoNguoiDung(
    @Body() dto: TaoNguoiDungDto,
    @NguoiDungHienTai() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.nguoiDungService.taoNguoiDung(dto, adminUser, ip, userAgent);
  }

  @Patch(':id')
  @QuyenHan('nguoi_dung_sua')
  suaNguoiDung(
    @Param('id') id: string,
    @Body() dto: SuaNguoiDungDto,
    @NguoiDungHienTai() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.nguoiDungService.suaNguoiDung(id, dto, adminUser, ip, userAgent);
  }

  @Patch(':id/khoa')
  @QuyenHan('nguoi_dung_khoa')
  khoaTaiKhoan(
    @Param('id') id: string,
    @NguoiDungHienTai() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.nguoiDungService.khoaTaiKhoan(id, adminUser, ip, userAgent);
  }

  @Patch(':id/mo-khoa')
  @QuyenHan('nguoi_dung_khoa')
  moKhoaTaiKhoan(
    @Param('id') id: string,
    @NguoiDungHienTai() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.nguoiDungService.moKhoaTaiKhoan(id, adminUser, ip, userAgent);
  }

  @Delete(':id')
  @QuyenHan('nguoi_dung_xoa')
  xoaMemTaiKhoan(
    @Param('id') id: string,
    @NguoiDungHienTai() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.nguoiDungService.xoaMemTaiKhoan(id, adminUser, ip, userAgent);
  }

  @Patch(':id/dat-lai-mat-khau')
  @QuyenHan('nguoi_dung_dat_lai_mat_khau')
  datLaiMatKhau(
    @Param('id') id: string,
    @Body() dto: DatLaiMatKhauDto,
    @NguoiDungHienTai() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.nguoiDungService.datLaiMatKhau(id, dto, adminUser, ip, userAgent);
  }

  @Put(':id/vai-tro')
  @QuyenHan('nguoi_dung_gan_vai_tro')
  ganVaiTro(
    @Param('id') id: string,
    @Body() dto: GanVaiTroDto,
    @NguoiDungHienTai() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.nguoiDungService.ganVaiTro(id, dto, adminUser, ip, userAgent);
  }
}
