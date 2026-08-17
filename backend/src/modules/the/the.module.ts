import { Module } from '@nestjs/common';
import { TheController } from './the.controller';
import { TheService } from './the.service';

@Module({
  controllers: [TheController],
  providers: [TheService],
  exports: [TheService],
})
export class TheModule {}
