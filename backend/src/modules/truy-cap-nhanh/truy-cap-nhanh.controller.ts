import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { TruyCapNhanhService } from './truy-cap-nhanh.service';
import { TaoTruyCapNhanhDto } from './dto/tao-truy-cap-nhanh.dto';
import { SuaTruyCapNhanhDto } from './dto/sua-truy-cap-nhanh.dto';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';

@Controller('truy-cap-nhanh')
export class TruyCapNhanhController {
  constructor(private readonly truyCapNhanhService: TruyCapNhanhService) {}

  // -------------------------------------------------------------
  // PUBLIC APIs (Trang chủ)
  // -------------------------------------------------------------

  @Get('cong-khai')
  layDanhSachPublic() {
    return this.truyCapNhanhService.layDanhSachPublic();
  }

  // -------------------------------------------------------------
  // ADMIN APIs (CMS Quản trị)
  // -------------------------------------------------------------

  @Get()
  @UseGuards(XacThucGuard)
  layDanhSachAdmin() {
    return this.truyCapNhanhService.layDanhSachAdmin();
  }

  @Get(':id')
  @UseGuards(XacThucGuard)
  layChiTietAdmin(@Param('id') id: string) {
    return this.truyCapNhanhService.layChiTietAdmin(id);
  }

  @Post()
  @UseGuards(XacThucGuard)
  taoTruyCapNhanh(
    @Body() dto: TaoTruyCapNhanhDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.truyCapNhanhService.taoTruyCapNhanh(dto, req.user, ip, userAgent);
  }

  @Patch(':id')
  @UseGuards(XacThucGuard)
  suaTruyCapNhanh(
    @Param('id') id: string,
    @Body() dto: SuaTruyCapNhanhDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.truyCapNhanhService.suaTruyCapNhanh(id, dto, req.user, ip, userAgent);
  }

  @Delete(':id')
  @UseGuards(XacThucGuard)
  xoaTruyCapNhanh(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.truyCapNhanhService.xoaTruyCapNhanh(id, req.user, ip, userAgent);
  }
}
