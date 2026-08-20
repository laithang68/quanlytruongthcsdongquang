import { Module } from '@nestjs/common';
import { TruyCapNhanhController } from './truy-cap-nhanh.controller';
import { TruyCapNhanhService } from './truy-cap-nhanh.service';

@Module({
  controllers: [TruyCapNhanhController],
  providers: [TruyCapNhanhService],
  exports: [TruyCapNhanhService],
})
export class TruyCapNhanhModule {}
