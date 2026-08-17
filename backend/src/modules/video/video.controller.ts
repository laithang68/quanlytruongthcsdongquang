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
import { VideoService } from './video.service';
import { TaoVideoDto } from './dto/tao-video.dto';
import { SuaVideoDto } from './dto/sua-video.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs
  // -------------------------------------------------------------

  @Get('cong-khai')
  layDanhSachPublic(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tu_khoa') tuKhoa?: string,
  ) {
    return this.videoService.layDanhSachPublic(page, limit, tuKhoa);
  }

  @Get('cong-khai/:id')
  layChiTietPublic(@Param('id') id: string) {
    return this.videoService.layChiTietPublic(id);
  }

  // -------------------------------------------------------------
  // ADMIN APIs
  // -------------------------------------------------------------

  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('video_xem')
  layDanhSachAdmin(
    @Query('tu_khoa') tuKhoa?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.videoService.layDanhSachAdmin(tuKhoa, page, limit);
  }

  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('video_tao')
  taoVideo(@Body() dto: TaoVideoDto, @NguoiDungHienTai() user: any) {
    return this.videoService.taoVideo(dto, user);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('video_sua')
  suaVideo(@Param('id') id: string, @Body() dto: SuaVideoDto, @NguoiDungHienTai() user: any) {
    return this.videoService.suaVideo(id, dto, user);
  }

  @Patch(':id/trang-thai')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('video_sua')
  doiTrangThai(
    @Param('id') id: string,
    @Body('trang_thai') trang_thai: boolean,
    @NguoiDungHienTai() user: any,
  ) {
    return this.videoService.doiTrangThai(id, trang_thai, user);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('video_xoa')
  xoaVideo(@Param('id') id: string, @NguoiDungHienTai() user: any) {
    return this.videoService.xoaVideo(id, user);
  }
}
