import { Module } from '@nestjs/common';
import { PhanQuyenController } from './phan-quyen.controller';
import { PhanQuyenService } from './phan-quyen.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PhanQuyenController],
  providers: [PhanQuyenService],
  exports: [PhanQuyenService],
})
export class PhanQuyenModule {}
