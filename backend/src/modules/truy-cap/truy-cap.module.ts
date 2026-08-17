import { Module } from '@nestjs/common';
import { TruyCapController } from './truy-cap.controller';
import { TruyCapService } from './truy-cap.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TruyCapController],
  providers: [TruyCapService],
  exports: [TruyCapService],
})
export class TruyCapModule {}
