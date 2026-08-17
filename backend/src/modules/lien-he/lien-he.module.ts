import { Module } from '@nestjs/common';
import { LienHeService } from './lien-he.service';
import { LienHeController } from './lien-he.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LienHeController],
  providers: [LienHeService],
  exports: [LienHeService],
})
export class LienHeModule {}
