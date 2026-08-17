import { Module } from '@nestjs/common';
import { HocSinhService } from './hoc-sinh.service';
import { HocSinhController } from './hoc-sinh.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [HocSinhController],
  providers: [HocSinhService],
  exports: [HocSinhService],
})
export class HocSinhModule {}
