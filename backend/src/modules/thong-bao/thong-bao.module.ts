import { Module } from '@nestjs/common';
import { ThongBaoController } from './thong-bao.controller';
import { ThongBaoService } from './thong-bao.service';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

@Module({
  imports: [XacThucModule],
  controllers: [ThongBaoController],
  providers: [ThongBaoService],
  exports: [ThongBaoService],
})
export class ThongBaoModule {}
