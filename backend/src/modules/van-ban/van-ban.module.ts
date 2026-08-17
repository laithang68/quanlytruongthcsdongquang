import { Module } from '@nestjs/common';
import { VanBanController } from './van-ban.controller';
import { VanBanService } from './van-ban.service';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

@Module({
  imports: [XacThucModule],
  controllers: [VanBanController],
  providers: [VanBanService],
  exports: [VanBanService],
})
export class VanBanModule {}
