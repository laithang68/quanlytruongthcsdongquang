import { Module } from '@nestjs/common';
import { ThuVienSoController } from './thu-vien-so.controller';
import { ThuVienSoService } from './thu-vien-so.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ThuVienSoController],
  providers: [ThuVienSoService],
  exports: [ThuVienSoService],
})
export class ThuVienSoModule {}
