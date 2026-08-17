import { Module } from '@nestjs/common';
import { LopHocService } from './lop-hoc.service';
import { LopHocController } from './lop-hoc.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LopHocController],
  providers: [LopHocService],
  exports: [LopHocService],
})
export class LopHocModule {}
