import { Controller, Get, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { PhanQuyenService } from './phan-quyen.service';
import { CapNhatQuyenVaiTroDto } from './dto/cap-nhat-quyen-vai-tro.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';

@Controller('phan-quyen')
@UseGuards(XacThucGuard, QuyenHanGuard)
export class PhanQuyenController {
  constructor(private readonly phanQuyenService: PhanQuyenService) {}

  // 1. Lấy ma trận quyền đầy đủ
  @Get('ma-tran')
  @QuyenHan('phan_quyen_xem')
  layMaTranQuyen() {
    return this.phanQuyenService.layMaTranQuyen();
  }

  // 2. Lấy chi tiết quyền của một vai trò
  @Get('vai-tro/:id')
  @QuyenHan('phan_quyen_xem')
  layChiTietQuyenVaiTro(@Param('id') id: string) {
    return this.phanQuyenService.layChiTietQuyenVaiTro(id);
  }

  // 3. Cập nhật quyền hạn cho vai trò
  @Put('vai-tro/:id')
  @QuyenHan('phan_quyen_sua')
  capNhatQuyenVaiTro(
    @Param('id') id: string,
    @Body() dto: CapNhatQuyenVaiTroDto,
    @NguoiDungHienTai() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.phanQuyenService.capNhatQuyenVaiTro(adminUser, id, dto, ip, userAgent);
  }
}
