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
import { GiaoVienService } from './giao-vien.service';
import { LayDanhSachGiaoVienDto } from './dto/lay-danh-sach-giao-vien.dto';
import { TaoGiaoVienDto } from './dto/tao-giao-vien.dto';
import { SuaGiaoVienDto } from './dto/sua-giao-vien.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('giao-vien')
export class GiaoVienController {
  constructor(private readonly giaoVienService: GiaoVienService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Công khai)
  // -------------------------------------------------------------

  @Get('cong-khai')
  layDanhSachPublic(
    @Query('to_chuyen_mon_id') toChuyenMonId?: string,
    @Query('tu_khoa') tuKhoa?: string,
    @Query('chuc_vu') chucVu?: string,
    @Query('chuc_vu_id') chucVuId?: string,
    @Query('bo_mon_id') boMonId?: string,
  ) {
    return this.giaoVienService.layDanhSachPublic(toChuyenMonId, tuKhoa, chucVu, chucVuId, boMonId);
  }

  @Get('cong-khai/:id')
  layChiTietPublic(@Param('id') id: string) {
    return this.giaoVienService.layChiTietPublic(id);
  }

  // -------------------------------------------------------------
  // ADMIN APIs (Bảo vệ bởi RBAC)
  // -------------------------------------------------------------

  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('giao_vien_xem')
  layDanhSachAdmin(@Query() dto: LayDanhSachGiaoVienDto) {
    return this.giaoVienService.layDanhSachAdmin(dto);
  }

  @Get(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('giao_vien_xem')
  layChiTietAdmin(@Param('id') id: string) {
    return this.giaoVienService.layChiTietAdmin(id);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('giao_vien_tao')
  taoGiaoVien(
    @Body() dto: TaoGiaoVienDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.giaoVienService.taoGiaoVien(dto, user, ip, userAgent);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('giao_vien_sua')
  suaGiaoVien(
    @Param('id') id: string,
    @Body() dto: SuaGiaoVienDto,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.giaoVienService.suaGiaoVien(id, dto, user, ip, userAgent);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('giao_vien_xoa')
  xoaMem(
    @Param('id') id: string,
    @NguoiDungHienTai() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.giaoVienService.xoaMem(id, user, ip, userAgent);
  }
}
