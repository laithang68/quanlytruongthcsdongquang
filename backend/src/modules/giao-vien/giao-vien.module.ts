import { Module } from '@nestjs/common';
import { GiaoVienController } from './giao-vien.controller';
import { GiaoVienService } from './giao-vien.service';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

@Module({
  imports: [XacThucModule],
  controllers: [GiaoVienController],
  providers: [GiaoVienService],
  exports: [GiaoVienService],
})
export class GiaoVienModule {}
