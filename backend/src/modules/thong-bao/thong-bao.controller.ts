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
import { ThongBaoService } from './thong-bao.service';
import { LayDanhSachThongBaoDto } from './dto/lay-danh-sach-thong-bao.dto';
import { TaoThongBaoDto } from './dto/tao-thong-bao.dto';
import { SuaThongBaoDto } from './dto/sua-thong-bao.dto';
import { DoiTrangThaiThongBaoDto } from './dto/doi-trang-thai-thong-bao.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('thong-bao')
export class ThongBaoController {
  constructor(private readonly thongBaoService: ThongBaoService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Công khai trên Website)
  // -------------------------------------------------------------

  @Get('cong-khai')
  layDanhSachPublic(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tu_khoa') tuKhoa?: string,
    @Query('phieu_loc') phieuLoc?: string,
    @Query('thang_nam') thangNam?: string,
  ) {
    return this.thongBaoService.layDanhSachPublic(page, limit, tuKhoa, phieuLoc, thangNam);
  }

  @Get('cong-khai/:id')
  layChiTietPublic(@Param('id') id: string) {
    return this.thongBaoService.layChiTietPublic(id);
  }

  // -------------------------------------------------------------
  // NỘI BỘ APIs (Đã xác thực JWT)
  // -------------------------------------------------------------

  @Get('noi-bo')
  @UseGuards(XacThucGuard)
  layDanhSachNoiBo(
    @NguoiDungHienTai() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.thongBaoService.layDanhSachNoiBo(user, page, limit);
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Bảo vệ bởi XacThucGuard & QuyenHanGuard)
  // -------------------------------------------------------------

  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thong_bao_xem')
  layDanhSachAdmin(
    @Query() dto: LayDanhSachThongBaoDto,
    @NguoiDungHienTai() user: any,
  ) {
    return this.thongBaoService.layDanhSachAdmin(dto, user);
  }

  @Get(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thong_bao_xem')
  layChiTietAdmin(@Param('id') id: string) {
    return this.thongBaoService.layChiTietAdmin(id);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thong_bao_tao')
  taoThongBao(
    @Body() dto: TaoThongBaoDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.thongBaoService.taoThongBao(dto, user, ip, userAgent);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thong_bao_sua')
  suaThongBao(
    @Param('id') id: string,
    @Body() dto: SuaThongBaoDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.thongBaoService.suaThongBao(id, dto, user, ip, userAgent);
  }

  @Patch(':id/trang-thai')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thong_bao_sua')
  doiTrangThai(
    @Param('id') id: string,
    @Body() dto: DoiTrangThaiThongBaoDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.thongBaoService.doiTrangThai(id, dto, user, ip, userAgent);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thong_bao_xoa')
  xoaThongBao(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.thongBaoService.xoaThongBao(id, user, ip, userAgent);
  }
}
