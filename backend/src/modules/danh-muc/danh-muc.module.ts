import { Module } from '@nestjs/common';
import { DanhMucController } from './danh-muc.controller';
import { DanhMucService } from './danh-muc.service';

@Module({
  controllers: [DanhMucController],
  providers: [DanhMucService],
  exports: [DanhMucService],
})
export class DanhMucModule {}
