import { Module } from '@nestjs/common';
import { TepTinController } from './tep-tin.controller';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

@Module({
  imports: [XacThucModule],
  controllers: [TepTinController],
})
export class TepTinModule {}
