import { Controller, Get } from '@nestjs/common';
import { DanhMucBoMonService } from './danh-muc-bo-mon.service';

@Controller('danh-muc-bo-mon')
export class DanhMucBoMonController {
  constructor(private readonly danhMucBoMonService: DanhMucBoMonService) {}

  @Get()
  layDanhSach() {
    return this.danhMucBoMonService.layDanhSach();
  }
}
