export class ItemHocSinhExcelDto {
  ho_ten: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  dia_chi?: string;
  lop_hoc_id?: string;
  ten_lop?: string;
  so_thu_tu?: number;
  nam_nhap_hoc?: number;
}

export class NhapHocSinhExcelDto {
  danh_sach: ItemHocSinhExcelDto[];
  mac_dinh_lop_hoc_id?: string;
  nam_nhap_hoc?: number;
}
