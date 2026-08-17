import { Controller, Get, Post, Body } from '@nestjs/common';
import { TruyCapService } from './truy-cap.service';

class PingDto {
  session_id: string;
}

@Controller('truy-cap')
export class TruyCapController {
  constructor(private readonly truyCapService: TruyCapService) {}

  @Post('ping')
  async ping(@Body() body: PingDto) {
    return this.truyCapService.pingSession(body?.session_id || '');
  }

  @Get('thong-ke')
  async layThongKe() {
    return this.truyCapService.layThongKeTruyCap();
  }
}
