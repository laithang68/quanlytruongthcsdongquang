import { Module } from '@nestjs/common';
import { DanhMucBoMonController } from './danh-muc-bo-mon.controller';
import { DanhMucBoMonService } from './danh-muc-bo-mon.service';

@Module({
  controllers: [DanhMucBoMonController],
  providers: [DanhMucBoMonService],
  exports: [DanhMucBoMonService],
})
export class DanhMucBoMonModule {}
