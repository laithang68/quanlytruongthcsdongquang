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
import { AlbumService } from './album.service';
import { TaoAlbumDto } from './dto/tao-album.dto';
import { SuaAlbumDto } from './dto/sua-album.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs
  // -------------------------------------------------------------

  @Get('cong-khai')
  layDanhSachPublic(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tu_khoa') tuKhoa?: string,
  ) {
    return this.albumService.layDanhSachPublic(page, limit, tuKhoa);
  }

  @Get('cong-khai/:id')
  layChiTietPublic(@Param('id') id: string) {
    return this.albumService.layChiTietPublic(id);
  }

  // -------------------------------------------------------------
  // ADMIN APIs
  // -------------------------------------------------------------

  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_anh_xem')
  layDanhSachAdmin(
    @Query('tu_khoa') tuKhoa?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.albumService.layDanhSachAdmin(tuKhoa, page, limit);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_anh_tao')
  taoAlbum(@Body() dto: TaoAlbumDto, @NguoiDungHienTai() user: any) {
    return this.albumService.taoAlbum(dto, user);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_anh_sua')
  suaAlbum(@Param('id') id: string, @Body() dto: SuaAlbumDto, @NguoiDungHienTai() user: any) {
    return this.albumService.suaAlbum(id, dto, user);
  }

  @Patch(':id/trang-thai')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_anh_sua')
  doiTrangThai(
    @Param('id') id: string,
    @Body('trang_thai') trang_thai: boolean,
    @NguoiDungHienTai() user: any,
  ) {
    return this.albumService.doiTrangThai(id, trang_thai, user);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('thu_vien_anh_xoa')
  xoaAlbum(@Param('id') id: string, @NguoiDungHienTai() user: any) {
    return this.albumService.xoaAlbum(id, user);
  }
}
