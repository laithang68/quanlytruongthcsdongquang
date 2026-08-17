import { DoiTuongThongBao } from '@prisma/client';

export class TaoTaiLieuDto {
  ten_tai_lieu: string;
  mo_ta?: string;
  danh_muc_tai_lieu_id: string;
  tac_gia?: string;
  doi_tuong?: DoiTuongThongBao;
  tep_tin_id?: string;
  duong_dan_lien_ket?: string;
  anh_thumb?: string;
  trang_thai?: boolean;
}
