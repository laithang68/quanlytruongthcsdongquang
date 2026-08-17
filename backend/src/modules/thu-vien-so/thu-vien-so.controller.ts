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
} from '@nestjs/common';
import { ThuVienSoService } from './thu-vien-so.service';
import { TaoTaiLieuDto } from './dto/tao-tai-lieu.dto';
import { SuaTaiLieuDto } from './dto/sua-tai-lieu.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('thu-vien-so')
export class ThuVienSoController {
  constructor(private readonly thuVienSoService: ThuVienSoService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs
  // -------------------------------------------------------------

  @Get('danh-muc')
  layDanhSachDanhMucPublic() {
    return this.thuVienSoService.layDanhSachDanhMucPublic();
  }

  @Get('cong-khai')
  layDanhSachPublic(
    @Query('tu_khoa') tuKhoa?: string,
    @Query('danh_muc_id') danhMucId?: string,
    @Query('danh_muc_slug') danhMucSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.thuVienSoService.layDanhSachPublic(tuKhoa, danhMucId, danhMucSlug, page, limit);
  }

  @Get('cong-khai/:id')
  layChiTietPublic(@Param('id') id: string) {
    return this.thuVienSoService.layChiTietPublic(id);
  }

  // -------------------------------------------------------------
  // ADMIN APIs
  // -------------------------------------------------------------

  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_so_xem')
  layDanhSachAdmin(
    @Query('tu_khoa') tuKhoa?: string,
    @Query('danh_muc_id') danhMucId?: string,
    @Query('danh_muc_slug') danhMucSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.thuVienSoService.layDanhSachAdmin(tuKhoa, danhMucId, danhMucSlug, page, limit);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_so_tao')
  taoTaiLieu(@Body() dto: TaoTaiLieuDto, @NguoiDungHienTai() user: any) {
    return this.thuVienSoService.taoTaiLieu(dto, user);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_so_sua')
  suaTaiLieu(@Param('id') id: string, @Body() dto: SuaTaiLieuDto, @NguoiDungHienTai() user: any) {
    return this.thuVienSoService.suaTaiLieu(id, dto, user);
  }

  @Patch(':id/trang-thai')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_so_sua')
  doiTrangThai(
    @Param('id') id: string,
    @Body('trang_thai') trang_thai: boolean,
    @NguoiDungHienTai() user: any,
  ) {
    return this.thuVienSoService.doiTrangThai(id, trang_thai, user);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_so_xoa')
  xoaTaiLieu(@Param('id') id: string, @NguoiDungHienTai() user: any) {
    return this.thuVienSoService.xoaTaiLieu(id, user);
  }
}
