import { Module } from '@nestjs/common';
import { ToChuyenMonController } from './to-chuyen-mon.controller';
import { ToChuyenMonService } from './to-chuyen-mon.service';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

@Module({
  imports: [XacThucModule],
  controllers: [ToChuyenMonController],
  providers: [ToChuyenMonService],
  exports: [ToChuyenMonService],
})
export class ToChuyenMonModule {}
