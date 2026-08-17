import { Module } from '@nestjs/common';
import { LoaiVanBanController } from './loai-van-ban.controller';
import { LoaiVanBanService } from './loai-van-ban.service';

@Module({
  controllers: [LoaiVanBanController],
  providers: [LoaiVanBanService],
  exports: [LoaiVanBanService],
})
export class LoaiVanBanModule {}
