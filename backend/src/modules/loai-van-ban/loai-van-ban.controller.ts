import { Controller, Get } from '@nestjs/common';
import { LoaiVanBanService } from './loai-van-ban.service';

@Controller('loai-van-ban')
export class LoaiVanBanController {
  constructor(private readonly loaiVanBanService: LoaiVanBanService) {}

  @Get()
  layDanhSach() {
    return this.loaiVanBanService.layDanhSach();
  }
}
