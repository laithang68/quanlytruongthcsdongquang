import { Controller, Get } from '@nestjs/common';
import { DanhMucChucVuService } from './danh-muc-chuc-vu.service';

@Controller('danh-muc-chuc-vu')
export class DanhMucChucVuController {
  constructor(private readonly danhMucChucVuService: DanhMucChucVuService) {}

  @Get()
  layDanhSach() {
    return this.danhMucChucVuService.layDanhSach();
  }
}
