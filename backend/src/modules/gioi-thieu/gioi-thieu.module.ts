import { Module } from '@nestjs/common';
import { GioiThieuController } from './gioi-thieu.controller';
import { GioiThieuService } from './gioi-thieu.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GioiThieuController],
  providers: [GioiThieuService],
  exports: [GioiThieuService],
})
export class GioiThieuModule {}
