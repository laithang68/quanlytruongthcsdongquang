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
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { GioiThieuService } from './gioi-thieu.service';
import { TaoGioiThieuDto } from './dto/tao-gioi-thieu.dto';
import { CapNhatGioiThieuDto } from './dto/cap-nhat-gioi-thieu.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('gioi-thieu')
export class GioiThieuController {
  constructor(private readonly gioiThieuService: GioiThieuService) {}

  // 1. PUBLIC ENDPOINT: Lấy thông tin giới thiệu công khai
  @Get('cong-khai')
  layGioiThieuCongKhai() {
    return this.gioiThieuService.layGioiThieuCongKhai();
  }

  // 2. ADMIN ENDPOINT: Danh sách quản trị
  @Get()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('gioi_thieu_xem')
  layDanhSachQuanTri(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('tu_khoa') tuKhoa?: string,
    @Query('trang_thai') trangThai?: string,
  ) {
    return this.gioiThieuService.layDanhSachQuanTri(page, limit, tuKhoa, trangThai);
  }

  // 3. ADMIN ENDPOINT: Chi tiết bản ghi
  @Get(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('gioi_thieu_xem')
  layChiTiet(@Param('id') id: string) {
    return this.gioiThieuService.layChiTiet(id);
  }

  // 4. ADMIN ENDPOINT: Tạo mới bản ghi giới thiệu
  @Post()
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('gioi_thieu_tao')
  taoMoi(@NguoiDungHienTai() user: any, @Body() dto: TaoGioiThieuDto) {
    return this.gioiThieuService.taoMoi(user, dto);
  }

  // 5. ADMIN ENDPOINT: Cập nhật bản ghi giới thiệu
  @Patch(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('gioi_thieu_sua')
  capNhat(@Param('id') id: string, @Body() dto: CapNhatGioiThieuDto) {
    return this.gioiThieuService.capNhat(id, dto);
  }

  // 6. ADMIN ENDPOINT: Bật / Tắt hiển thị
  @Patch(':id/trang-thai')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('gioi_thieu_sua')
  doiTrangThai(
    @Param('id') id: string,
    @Body('trang_thai') trangThai?: boolean,
  ) {
    return this.gioiThieuService.doiTrangThai(id, trangThai);
  }

  // 7. ADMIN ENDPOINT: Xóa bản ghi giới thiệu
  @Delete(':id')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan('gioi_thieu_xoa')
  xoaMem(@Param('id') id: string) {
    return this.gioiThieuService.xoaMem(id);
  }
}
