import { Module } from '@nestjs/common';
import { BaiVietController } from './bai-viet.controller';
import { BaiVietService } from './bai-viet.service';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

@Module({
  imports: [XacThucModule],
  controllers: [BaiVietController],
  providers: [BaiVietService],
  exports: [BaiVietService],
})
export class BaiVietModule {}
