import { Module } from '@nestjs/common';
import { NguoiDungController } from './nguoi-dung.controller';
import { NguoiDungService } from './nguoi-dung.service';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

@Module({
  imports: [XacThucModule],
  controllers: [NguoiDungController],
  providers: [NguoiDungService],
  exports: [NguoiDungService],
})
export class NguoiDungModule {}
