import { Module } from '@nestjs/common';
import { PhuHuynhService } from './phu-huynh.service';
import { PhuHuynhController } from './phu-huynh.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PhuHuynhController],
  providers: [PhuHuynhService],
  exports: [PhuHuynhService],
})
export class PhuHuynhModule {}
