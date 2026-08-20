import { Module } from '@nestjs/common';
import { DanhMucChucVuController } from './danh-muc-chuc-vu.controller';
import { DanhMucChucVuService } from './danh-muc-chuc-vu.service';

@Module({
  controllers: [DanhMucChucVuController],
  providers: [DanhMucChucVuService],
  exports: [DanhMucChucVuService],
})
export class DanhMucChucVuModule {}
