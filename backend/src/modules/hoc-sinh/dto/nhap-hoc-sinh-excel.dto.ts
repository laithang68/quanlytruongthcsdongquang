export class ItemHocSinhExcelDto {
  ma_hoc_sinh: string;
  ho_ten: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  dia_chi?: string;
  lop_hoc_id?: string;
  ten_lop?: string;
}

export class NhapHocSinhExcelDto {
  danh_sach: ItemHocSinhExcelDto[];
  mac_dinh_lop_hoc_id?: string;
}
