export class SuaHocSinhDto {
  ho_ten?: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  so_thu_tu?: number;
  dia_chi?: string;
  lop_hoc_id?: string;
  trang_thai_hoc_sinh?: 'DANG_HOC' | 'LUU_BAN' | 'THOI_HOC' | 'CHUYEN_TRUONG' | 'TOT_NGHIEP';
  nam_tot_nghiep?: string;
  ngay_tot_nghiep?: string;
  trang_thai?: boolean;
}
