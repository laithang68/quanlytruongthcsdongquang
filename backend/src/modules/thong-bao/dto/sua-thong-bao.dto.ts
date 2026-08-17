import { DoiTuongThongBao } from '@prisma/client';

export class SuaThongBaoDto {
  tieu_de?: string;
  noi_dung?: string;
  doi_tuong?: DoiTuongThongBao;
  trang_thai?: boolean;
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
}
