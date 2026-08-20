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
import { PhuHuynhService } from './phu-huynh.service';
import { TaoPhuHuynhDto } from './dto/tao-phu-huynh.dto';
import { SuaPhuHuynhDto } from './dto/sua-phu-huynh.dto';
import { LienKetPhuHuynhDto } from './dto/lien-ket-phu-huynh.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';

@Controller('phu-huynh')
@UseGuards(XacThucGuard, QuyenHanGuard)
export class PhuHuynhController {
  constructor(private readonly phuHuynhService: PhuHuynhService) {}

  @Get()
  @QuyenHan('phu_huynh_xem')
  async layDanhSach(
    @Query('tu_khoa') tuKhoa?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.phuHuynhService.layDanhSach(tuKhoa, page, limit);
  }

  @Get(':id')
  @QuyenHan('phu_huynh_xem')
  async layChiTiet(@Param('id') id: string) {
    return this.phuHuynhService.layChiTiet(id);
  }

  @Post()
  @QuyenHan('phu_huynh_tao')
  async taoPhuHuynh(@Body() dto: TaoPhuHuynhDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.phuHuynhService.taoPhuHuynh(dto, req.user, ip, userAgent);
  }

  @Post('lien-ket')
  @QuyenHan('phu_huynh_sua')
  async lienKetPhuHuynhHocSinh(
    @Body() dto: LienKetPhuHuynhDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.phuHuynhService.lienKetPhuHuynhHocSinh(dto, req.user, ip, userAgent);
  }

  @Delete(':phu_huynh_id/hoc-sinh/:hoc_sinh_id')
  @QuyenHan('phu_huynh_sua')
  async huyLienKetPhuHuynhHocSinh(
    @Param('phu_huynh_id') phuHuynhId: string,
    @Param('hoc_sinh_id') hocSinhId: string,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.phuHuynhService.huyLienKetPhuHuynhHocSinh(
      phuHuynhId,
      hocSinhId,
      req.user,
      ip,
      userAgent,
    );
  }

  @Patch(':id')
  @QuyenHan('phu_huynh_sua')
  async suaPhuHuynh(
    @Param('id') id: string,
    @Body() dto: SuaPhuHuynhDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.phuHuynhService.suaPhuHuynh(id, dto, req.user, ip, userAgent);
  }

  @Delete(':id')
  @QuyenHan('phu_huynh_xoa')
  async xoaMem(@Param('id') id: string, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.phuHuynhService.xoaMem(id, req.user, ip, userAgent);
  }
}
