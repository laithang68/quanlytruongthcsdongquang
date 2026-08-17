import { Controller, Get } from '@nestjs/common';
import { TheService } from './the.service';

@Controller('the')
export class TheController {
  constructor(private readonly theService: TheService) {}

  @Get()
  layDanhSach() {
    return this.theService.layDanhSach();
  }
}
