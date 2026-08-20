'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import * as XLSX from 'xlsx';

interface LopHocOption {
  id: string;
  ten_lop: string;
  khoi: number;
  nam_hoc: string;
}

interface HocSinhItem {
  id: string;
  ma_hoc_sinh: string;
  ho_ten: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  so_thu_tu?: number;
  nam_nhap_hoc?: number;
  khoi_nhap_hoc?: number;
  trang_thai_hoc_sinh: 'DANG_HOC' | 'LUU_BAN' | 'THOI_HOC' | 'CHUYEN_TRUONG' | 'TOT_NGHIEP';
  nam_tot_nghiep?: string;
  ngay_tot_nghiep?: string;
  dia_chi?: string;
  lop_hoc_id: string;
  trang_thai: boolean;
  lop_hoc: LopHocOption;
  nguoi_dung?: {
    id: string;
    ten_dang_nhap: string;
    trang_thai: boolean;
    mat_khau_mac_dinh: boolean;
    yeu_cau_doi_mat_khau: boolean;
  };
}

function QuanTriHocSinhContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();

  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [dangTaiPage, setDangTaiPage] = useState(true);

  const [danhSach, setDanhSach] = useState<HocSinhItem[]>([]);
  const [danhSachLop, setDanhSachLop] = useState<LopHocOption[]>([]);
  const [tongSo, setTongSo] = useState(0);
  const [tongSoTrang, setTongSoTrang] = useState(1);

  const [tuKhoa, setTuKhoa] = useState('');
  const [filterLopId, setFilterLopId] = useState(searchParams?.get('lop_hoc_id') || '');
  const [filterKhoi, setFilterKhoi] = useState('');
  const [filterTrangThaiHS, setFilterTrangThaiHS] = useState('');
  const [page, setPage] = useState(1);
  const [dangTaiData, setDangTaiData] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalChuyenLop, setShowModalChuyenLop] = useState(false);
  const [showModalLenLop, setShowModalLenLop] = useState(false);
  const [showModalTotNghiep, setShowModalTotNghiep] = useState(false);
  const [showModalResetPass, setShowModalResetPass] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  // Success Modal for Single Student Creation
  const [modalSuccessTao, setModalSuccessTao] = useState<{
    isOpen: boolean;
    ma_hoc_sinh: string;
    ho_ten: string;
    ten_dang_nhap: string;
    mat_khau_ban_dau: string;
    ten_lop: string;
    nam_hoc: string;
  }>({
    isOpen: false,
    ma_hoc_sinh: '',
    ho_ten: '',
    ten_dang_nhap: '',
    mat_khau_ban_dau: '',
    ten_lop: '',
    nam_hoc: '',
  });
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Excel Modals & State
  const [showModalNhapExcel, setShowModalNhapExcel] = useState(false);
  const [fileExcelTen, setFileExcelTen] = useState('');
  const [previewDataExcel, setPreviewDataExcel] = useState<any[]>([]);
  const [macDinhLopIdExcel, setMacDinhLopIdExcel] = useState('');
  const [ketQuaImport, setKetQuaImport] = useState<{
    tongSo: number;
    thanhCong: number;
    danhSachTaiKhoan: Array<{
      stt: number;
      ho_ten: string;
      ten_lop: string;
      ma_hoc_sinh: string;
      ten_dang_nhap: string;
      mat_khau_ban_dau: string;
    }>;
    loiChiTiet: string[];
  } | null>(null);
  const [loiValidateLocal, setLoiValidateLocal] = useState<string[]>([]);
  const [exportClassFilter, setExportClassFilter] = useState<string>('');

  const [selectedHocSinh, setSelectedHocSinh] = useState<HocSinhItem | null>(null);

  // Form states
  const [formTao, setFormTao] = useState({
    ho_ten: '',
    ngay_sinh: '',
    gioi_tinh: 'Nam',
    so_thu_tu: '',
    dia_chi: '',
    lop_hoc_id: '',
    nam_nhap_hoc: '2026',
    khoi_nhap_hoc: '6',
  });

  const [formSua, setFormSua] = useState({
    ma_hoc_sinh: '',
    ten_dang_nhap: '',
    ho_ten: '',
    ngay_sinh: '',
    gioi_tinh: 'Nam',
    so_thu_tu: '',
    dia_chi: '',
    lop_hoc_id: '',
    trang_thai_hoc_sinh: 'DANG_HOC',
    nam_tot_nghiep: '',
  });

  // Action states
  const [targetLopMoiId, setTargetLopMoiId] = useState('');
  const [lenLopNamHocMoi, setLenLopNamHocMoi] = useState('2027-2028');
  const [lenLopKhoiMoi, setLenLopKhoiMoi] = useState('7');
  const [lenLopTargetLopId, setLenLopTargetLopId] = useState('');
  const [totNghiepNam, setTotNghiepNam] = useState('2029-2030');

  const [thongBaoLoiModal, setThongBaoLoiModal] = useState('');
  const [dangXuLyModal, setDangXuLyModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/dang-nhap');
      return;
    }

    fetch(getApiUrl('/api/v1/xac-thuc/toi'), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setCurrentUserPerms(data.du_lieu.quyen_han || []);
          setDangTaiPage(false);
        } else {
          router.push('/dang-nhap');
        }
      })
      .catch(() => router.push('/dang-nhap'));
  }, [router]);

  const taiDanhSachLop = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl('/api/v1/lop-hoc'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSachLop(data.du_lieu);
      }
    } catch (err) {}
  };

  const taiDanhSachHocSinh = async () => {
    setDangTaiData(true);
    const token = localStorage.getItem('access_token');

    try {
      const query = new URLSearchParams();
      if (tuKhoa) query.set('tu_khoa', tuKhoa);
      if (filterLopId) query.set('lop_hoc_id', filterLopId);
      if (filterKhoi) query.set('khoi', filterKhoi);
      if (filterTrangThaiHS) query.set('trang_thai_hoc_sinh', filterTrangThaiHS);
      query.set('page', page.toString());
      query.set('limit', '10');

      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.thanh_cong) {
        setDanhSach(data.du_lieu);
        setTongSo(data.tong_so);
        setTongSoTrang(data.tong_so_trang);
      } else {
        showError(data.thong_bao || 'Không thể tải danh sách học sinh.');
      }
    } catch (err) {
      showError('Lỗi kết nối máy chủ khi tải danh sách.');
    } finally {
      setDangTaiData(false);
    }
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSachLop();
    }
  }, [dangTaiPage]);

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSachHocSinh();
    }
  }, [dangTaiPage, page, tuKhoa, filterLopId, filterKhoi, filterTrangThaiHS]);

  // Handle Create
  const handleOpenTao = () => {
    const defaultLop = danhSachLop.find((l) => l.id === filterLopId) || danhSachLop[0];
    const match = defaultLop?.nam_hoc?.match(/^(\d{4})/);
    const defaultYear = match ? match[1] : '2026';

    setFormTao({
      ho_ten: '',
      ngay_sinh: '',
      gioi_tinh: 'Nam',
      so_thu_tu: '',
      dia_chi: '',
      lop_hoc_id: defaultLop?.id || '',
      nam_nhap_hoc: defaultYear,
      khoi_nhap_hoc: defaultLop?.khoi ? String(defaultLop.khoi) : '6',
    });
    setThongBaoLoiModal('');
    setShowModalTao(true);
  };

  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setDangXuLyModal(true);
    setThongBaoLoiModal('');
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/hoc-sinh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ho_ten: formTao.ho_ten.trim(),
          ngay_sinh: formTao.ngay_sinh || undefined,
          gioi_tinh: formTao.gioi_tinh,
          so_thu_tu: formTao.so_thu_tu ? parseInt(formTao.so_thu_tu, 10) : undefined,
          dia_chi: formTao.dia_chi || undefined,
          lop_hoc_id: formTao.lop_hoc_id,
          nam_nhap_hoc: formTao.nam_nhap_hoc ? parseInt(formTao.nam_nhap_hoc, 10) : 2026,
          khoi_nhap_hoc: formTao.khoi_nhap_hoc ? parseInt(formTao.khoi_nhap_hoc, 10) : 6,
        }),
      });

      const data = await res.json();
      if (data.thanh_cong) {
        showSuccess(data.thong_bao || 'Tạo học sinh mới thành công.');
        setShowModalTao(false);
        taiDanhSachHocSinh();

        // Mở modal hiển thị mã học sinh và thông tin tài khoản tự sinh
        const lop = danhSachLop.find((l) => l.id === formTao.lop_hoc_id);
        setModalSuccessTao({
          isOpen: true,
          ma_hoc_sinh: data.du_lieu.ma_hoc_sinh,
          ho_ten: data.du_lieu.ho_ten,
          ten_dang_nhap: data.du_lieu.ma_hoc_sinh,
          mat_khau_ban_dau: data.du_lieu.ma_hoc_sinh,
          ten_lop: lop?.ten_lop || '',
          nam_hoc: lop?.nam_hoc || '',
        });
      } else {
        setThongBaoLoiModal(data.thong_bao || 'Lỗi khi tạo học sinh.');
      }
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Handle Edit
  const handleOpenSua = (hs: HocSinhItem) => {
    setSelectedHocSinh(hs);
    setFormSua({
      ma_hoc_sinh: hs.ma_hoc_sinh,
      ten_dang_nhap: hs.nguoi_dung?.ten_dang_nhap || hs.ma_hoc_sinh,
      ho_ten: hs.ho_ten,
      ngay_sinh: hs.ngay_sinh ? hs.ngay_sinh.substring(0, 10) : '',
      gioi_tinh: hs.gioi_tinh || 'Nam',
      so_thu_tu: hs.so_thu_tu ? String(hs.so_thu_tu) : '',
      dia_chi: hs.dia_chi || '',
      lop_hoc_id: hs.lop_hoc_id,
      trang_thai_hoc_sinh: hs.trang_thai_hoc_sinh || 'DANG_HOC',
      nam_tot_nghiep: hs.nam_tot_nghiep || '',
    });
    setThongBaoLoiModal('');
    setShowModalSua(true);
  };

  const submitSua = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedHocSinh) return;
    setDangXuLyModal(true);
    setThongBaoLoiModal('');
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh/${selectedHocSinh.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ho_ten: formSua.ho_ten.trim(),
          ngay_sinh: formSua.ngay_sinh || undefined,
          gioi_tinh: formSua.gioi_tinh,
          so_thu_tu: formSua.so_thu_tu ? parseInt(formSua.so_thu_tu, 10) : null,
          dia_chi: formSua.dia_chi || undefined,
          lop_hoc_id: formSua.lop_hoc_id,
          trang_thai_hoc_sinh: formSua.trang_thai_hoc_sinh,
          nam_tot_nghiep: formSua.nam_tot_nghiep || undefined,
        }),
      });

      const data = await res.json();
      if (data.thanh_cong) {
        showSuccess(data.thong_bao || 'Cập nhật học sinh thành công.');
        setShowModalSua(false);
        taiDanhSachHocSinh();
      } else {
        setThongBaoLoiModal(data.thong_bao || 'Lỗi khi cập nhật học sinh.');
      }
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Reset Password Action
  const handleResetPassword = async () => {
    if (!selectedHocSinh) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh/${selectedHocSinh.id}/dat-lai-mat-khau`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.thanh_cong) {
        showSuccess(`Đặt lại mật khẩu thành công! Mật khẩu mới: ${data.mat_khau_moi}`);
        setShowModalResetPass(false);
        setShowModalSua(false);
      } else {
        showError(data.thong_bao || 'Không thể đặt lại mật khẩu.');
      }
    } catch (err) {
      showError('Lỗi kết nối khi đặt lại mật khẩu.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Promotion (Lên Lớp)
  const handleOpenLenLop = () => {
    if (selectedIds.length === 0) {
      showError('Vui lòng tích chọn các học sinh cần lên lớp.');
      return;
    }
    setLenLopNamHocMoi('2027-2028');
    setLenLopKhoiMoi('7');
    setLenLopTargetLopId('');
    setThongBaoLoiModal('');
    setShowModalLenLop(true);
  };

  const submitLenLop = async (e: FormEvent) => {
    e.preventDefault();
    if (!lenLopTargetLopId) {
      setThongBaoLoiModal('Vui lòng chọn lớp đích.');
      return;
    }
    setDangXuLyModal(true);
    setThongBaoLoiModal('');
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/hoc-sinh/len-lop'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          danh_sach_hoc_sinh_id: selectedIds,
          lop_hoc_moi_id: lenLopTargetLopId,
          nam_hoc_moi: lenLopNamHocMoi,
          khoi_moi: parseInt(lenLopKhoiMoi, 10),
        }),
      });

      const data = await res.json();
      if (data.thanh_cong) {
        showSuccess(data.thong_bao || 'Lên lớp thành công!');
        setShowModalLenLop(false);
        setSelectedIds([]);
        taiDanhSachHocSinh();
      } else {
        setThongBaoLoiModal(data.thong_bao || 'Lỗi khi thực hiện lên lớp.');
      }
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Transfer (Chuyển Lớp)
  const handleOpenChuyenLop = () => {
    if (selectedIds.length === 0) {
      showError('Vui lòng tích chọn học sinh cần chuyển lớp.');
      return;
    }
    setTargetLopMoiId('');
    setThongBaoLoiModal('');
    setShowModalChuyenLop(true);
  };

  const submitChuyenLop = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetLopMoiId) {
      setThongBaoLoiModal('Vui lòng chọn lớp mới.');
      return;
    }
    setDangXuLyModal(true);
    setThongBaoLoiModal('');
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/hoc-sinh/chuyen-lop'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          danh_sach_hoc_sinh_id: selectedIds,
          lop_hoc_moi_id: targetLopMoiId,
        }),
      });

      const data = await res.json();
      if (data.thanh_cong) {
        showSuccess(data.thong_bao || 'Chuyển lớp thành công.');
        setShowModalChuyenLop(false);
        setSelectedIds([]);
        taiDanhSachHocSinh();
      } else {
        setThongBaoLoiModal(data.thong_bao || 'Lỗi khi chuyển lớp.');
      }
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Graduation (Tốt Nghiệp)
  const handleOpenTotNghiep = () => {
    if (selectedIds.length === 0) {
      showError('Vui lòng chọn các học sinh cần đánh dấu tốt nghiệp.');
      return;
    }
    setTotNghiepNam('2029-2030');
    setThongBaoLoiModal('');
    setShowModalTotNghiep(true);
  };

  const submitTotNghiep = async (e: FormEvent) => {
    e.preventDefault();
    setDangXuLyModal(true);
    setThongBaoLoiModal('');
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/hoc-sinh/tot-nghiep'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          danh_sach_hoc_sinh_id: selectedIds,
          nam_tot_nghiep: totNghiepNam,
        }),
      });

      const data = await res.json();
      if (data.thanh_cong) {
        showSuccess(data.thong_bao || 'Đã cập nhật tốt nghiệp thành công. Tài khoản của học sinh đã được khóa và không thể đăng nhập Cổng học sinh.');
        setShowModalTotNghiep(false);
        setSelectedIds([]);
        taiDanhSachHocSinh();
      } else {
        setThongBaoLoiModal(data.thong_bao || 'Lỗi khi đánh dấu tốt nghiệp.');
      }
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Delete
  const handleOpenXoa = (hs: HocSinhItem) => {
    setSelectedHocSinh(hs);
    setShowModalXoa(true);
  };

  const submitXoa = async () => {
    if (!selectedHocSinh) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh/${selectedHocSinh.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.thanh_cong) {
        showSuccess(data.thong_bao || 'Xóa học sinh thành công.');
        setShowModalXoa(false);
        setSelectedHocSinh(null);
        taiDanhSachHocSinh();
      } else {
        showError(data.thong_bao || 'Lỗi khi xóa học sinh.');
      }
    } catch (err) {
      showError('Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Helper tải file Workbook dạng .xlsx chuẩn nhị phân (Chống bị biến thành CSV)
  const downloadWorkbookAsXlsx = (wb: XLSX.WorkBook, fileName: string) => {
    const excelBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Xuất Danh Sách Học Sinh ra file Excel (.xlsx) chuẩn OpenXML
  const handleExportExcel = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const query = new URLSearchParams();
      if (tuKhoa) query.set('tu_khoa', tuKhoa);
      if (filterLopId) query.set('lop_hoc_id', filterLopId);
      if (filterKhoi) query.set('khoi', filterKhoi);
      if (filterTrangThaiHS) query.set('trang_thai_hoc_sinh', filterTrangThaiHS);

      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh/xuat-excel?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.thanh_cong && data.du_lieu) {
        const namHocHienTai = danhSachLop[0]?.nam_hoc || '2026-2027';
        const wb = XLSX.utils.book_new();

        // Sheet 1: DanhSachHocSinh
        const wsData: any[][] = [
          ['DANH SÁCH HỌC SINH'],
          ['TRƯỜNG THCS ĐÔNG QUANG'],
          [`Năm học: ${namHocHienTai}`],
          [], // Dòng trống
          ['STT', 'MÃ HỌC SINH', 'HỌ VÀ TÊN', 'NGÀY SINH', 'GIỚI TÍNH', 'LỚP', 'KHỐI', 'NĂM HỌC', 'TRẠNG THÁI', 'ĐỊA CHỈ'],
        ];

        data.du_lieu.forEach((item: any, idx: number) => {
          wsData.push([
            item.so_thu_tu || idx + 1,
            item.ma_hoc_sinh,
            item.ho_ten,
            item.ngay_sinh || '',
            item.gioi_tinh || '',
            item.ten_lop || '',
            item.khoi || '',
            item.nam_hoc || '',
            item.trang_thai_hoc_sinh || 'DANG_HOC',
            item.dia_chi || '',
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
          { wch: 8 },  // STT
          { wch: 18 }, // Mã HS
          { wch: 28 }, // Họ và tên
          { wch: 14 }, // Ngày sinh
          { wch: 12 }, // Giới tính
          { wch: 12 }, // Lớp
          { wch: 10 }, // Khối
          { wch: 14 }, // Năm học
          { wch: 16 }, // Trạng thái
          { wch: 35 }, // Địa chỉ
        ];

        ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
        (ws as any)['!pageSetup'] = {
          paperSize: 9,
          orientation: 'landscape',
          scale: 100,
          fitToWidth: 1,
          fitToHeight: 0,
        };
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');

        const fileName = `danh_sach_hoc_sinh_${new Date().toISOString().slice(0, 10)}.xlsx`;
        downloadWorkbookAsXlsx(wb, fileName);
        showSuccess(`Đã xuất danh sách ${data.du_lieu.length} học sinh ra file "${fileName}".`);
      } else {
        showError('Không thể xuất dữ liệu.');
      }
    } catch (err) {
      showError('Lỗi kết nối khi xuất Excel.');
    }
  };

  // Import Excel Handling (Hỗ trợ file .xlsx, .xls, .csv)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileExcelTen(file.name);
    setKetQuaImport(null);
    setLoiValidateLocal([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        // Ưu tiên sheet DanhSachHocSinh hoặc sheet đầu tiên
        const sheetName =
          wb.SheetNames.find(
            (s) =>
              s.toLowerCase().includes('danhsach') ||
              s.toLowerCase().includes('hocsinh') ||
              s.toLowerCase().includes('danh sách'),
          ) || wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawRows || rawRows.length <= 1) {
          showError('File không có dữ liệu học sinh.');
          return;
        }

        // Tìm dòng header (chứa các từ khóa như Họ tên, Họ và tên...)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(6, rawRows.length); i++) {
          const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('name')) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = (rawRows[headerRowIndex] || []).map((h: any) => String(h || '').trim().toLowerCase());
        const colHoTen = headers.findIndex((h: string) => h.includes('họ') || h.includes('tên') || h.includes('name'));
        const colNgaySinh = headers.findIndex((h: string) => h.includes('sinh') || h.includes('birth') || h.includes('date'));
        const colGioiTinh = headers.findIndex((h: string) => h.includes('tính') || h.includes('gender') || h.includes('sex'));
        const colLop = headers.findIndex((h: string) => h.includes('lớp') || h.includes('class'));
        const colStt = headers.findIndex((h: string) => h.includes('stt trong') || h.includes('số thứ tự'));
        const colDiaChi = headers.findIndex((h: string) => h.includes('địa chỉ') || h.includes('address'));

        const parsedRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const r = rawRows[i];
          if (!r || r.length === 0) continue;

          const hoTen = colHoTen !== -1 ? String(r[colHoTen] || '').trim() : String(r[1] || '').trim();
          if (!hoTen) continue;

          let ngaySinhStr = '';
          if (colNgaySinh !== -1 && r[colNgaySinh] !== undefined && r[colNgaySinh] !== null) {
            const rawVal = r[colNgaySinh];
            if (typeof rawVal === 'number') {
              const dateObj = XLSX.SSF.parse_date_code(rawVal);
              if (dateObj) {
                const day = String(dateObj.d).padStart(2, '0');
                const mon = String(dateObj.m).padStart(2, '0');
                ngaySinhStr = `${day}/${mon}/${dateObj.y}`;
              }
            } else {
              ngaySinhStr = String(rawVal).trim();
            }
          }

          const gioiTinhStr = colGioiTinh !== -1 && r[colGioiTinh] ? String(r[colGioiTinh]).trim() : 'Nam';
          const lopStr = colLop !== -1 && r[colLop] ? String(r[colLop]).trim() : '';
          const sttVal = colStt !== -1 && r[colStt] !== undefined ? parseInt(r[colStt], 10) : undefined;
          const diaChiStr = colDiaChi !== -1 && r[colDiaChi] ? String(r[colDiaChi]).trim() : '';

          parsedRows.push({
            ho_ten: hoTen,
            ngay_sinh: ngaySinhStr,
            gioi_tinh: gioiTinhStr,
            ten_lop: lopStr,
            so_thu_tu: isNaN(sttVal as any) ? undefined : sttVal,
            dia_chi: diaChiStr,
          });
        }

        if (parsedRows.length === 0) {
          showError('Không tìm thấy dòng dữ liệu học sinh nào hợp lệ từ file.');
          return;
        }

        setPreviewDataExcel(parsedRows);
        showSuccess(`Đã đọc ${parsedRows.length} dòng dữ liệu từ file. Vui lòng bấm "Kiểm tra dữ liệu" hoặc "Import".`);
      } catch (err) {
        showError('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // TẢI FILE EXCEL MẪU CHUẨN (.XLSX) 3 SHEETS (DanhSachHocSinh, HuongDan, DanhMucLop)
  const taiFileMau = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: DanhSachHocSinh
    const wsData = [
      ['STT', 'Họ và tên', 'Ngày sinh (DD/MM/YYYY)', 'Giới tính', 'Lớp học', 'STT trong lớp', 'Địa chỉ'],
      [1, 'Nguyễn Văn An', '15/05/2014', 'Nam', '6A', 1, 'Thôn 1, Xã Đông Quang'],
      [2, 'Trần Thị Bình', '20/08/2014', 'Nữ', '6A', 2, 'Thôn 2, Xã Đông Quang'],
      [3, 'Lê Hoàng Cường', '10/11/2014', 'Nam', '6B', 1, 'Thôn 3, Xã Đông Quang'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 24 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');

    // Sheet 2: HuongDan
    const huongDanData = [
      ['MỤC', 'NỘI DUNG HƯỚNG DẪN NHẬP DỮ LIỆU'],
      [1, 'Không nhập Mã học sinh. Hệ thống sẽ tự động sinh mã định danh chuẩn HS266xxxx.'],
      [2, 'Không nhập Username. Hệ thống tự động lấy tên đăng nhập bằng chính Mã học sinh.'],
      [3, 'Không nhập Mật khẩu. Mật khẩu mặc định ban đầu được hệ thống tự động gán bằng Mã học sinh và mã hóa bcrypt.'],
      [4, 'Họ và tên, Lớp học là các trường thông tin BẮT BUỘC.'],
      [5, 'Ngày sinh nhập theo định dạng chuẩn DD/MM/YYYY (ví dụ: 15/05/2014).'],
      [6, 'Giới tính: Nhập "Nam" hoặc "Nữ".'],
      [7, 'Lớp học: Phải là tên lớp đang tồn tại trong hệ thống (Tra cứu tên lớp tại Sheet "DanhMucLop").'],
      [8, 'STT trong lớp: Có thể nhập số thứ tự hoặc để trống để hệ thống tự động gán.'],
    ];
    const wsHuongDan = XLSX.utils.aoa_to_sheet(huongDanData);
    wsHuongDan['!cols'] = [{ wch: 6 }, { wch: 95 }];
    XLSX.utils.book_append_sheet(wb, wsHuongDan, 'HuongDan');

    // Sheet 3: DanhMucLop
    const danhMucLopData = [
      ['STT', 'Tên Lớp', 'Khối', 'Năm Học'],
      ...danhSachLop.map((l, i) => [i + 1, l.ten_lop, l.khoi, l.nam_hoc]),
    ];
    const wsDanhMuc = XLSX.utils.aoa_to_sheet(danhMucLopData);
    wsDanhMuc['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 10 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsDanhMuc, 'DanhMucLop');

    downloadWorkbookAsXlsx(wb, 'mau_nhap_danh_sach_hoc_sinh_thcs_dong_quang.xlsx');
    showSuccess('Đã tải xuống file Excel mẫu chuẩn (.xlsx).');
  };

  // KIỂM TRA DỮ LIỆU TRƯỚC KHI IMPORT (PRE-VALIDATION TRÊN CLIENT)
  const handleKiemTraDuLieu = () => {
    if (previewDataExcel.length === 0) {
      showError('Chưa có dữ liệu để kiểm tra.');
      return;
    }

    const errors: string[] = [];
    const validClassNames = new Set(danhSachLop.map((l) => l.ten_lop.trim().toLowerCase()));

    previewDataExcel.forEach((row, idx) => {
      const rowNum = idx + 1;
      if (!row.ho_ten || !row.ho_ten.trim()) {
        errors.push(`Dòng ${rowNum}: Họ và tên không được để trống.`);
      }

      const lopName = (row.ten_lop || '').trim().toLowerCase();
      if (!lopName && !macDinhLopIdExcel) {
        errors.push(`Dòng ${rowNum} (${row.ho_ten}): Chưa có lớp học và chưa chọn lớp mặc định.`);
      } else if (lopName && !validClassNames.has(lopName)) {
        errors.push(`Dòng ${rowNum} (${row.ho_ten}): Lớp học "${row.ten_lop}" không tồn tại trong hệ thống.`);
      }
    });

    setLoiValidateLocal(errors);
    if (errors.length === 0) {
      showSuccess(`✓ Dữ liệu hợp lệ! Toàn bộ ${previewDataExcel.length} dòng đã sẵn sàng để Import.`);
    } else {
      showError(`Phát hiện ${errors.length} lỗi trong dữ liệu. Vui lòng xem danh sách bên dưới.`);
    }
  };

  // GỬI IMPORT LÊN BACKEND (Thực thi nguyên tử trong Transaction)
  const submitNhapExcel = async () => {
    if (previewDataExcel.length === 0) {
      showError('Chưa có dữ liệu học sinh để nhập.');
      return;
    }

    setDangXuLyModal(true);
    setLoiValidateLocal([]);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/hoc-sinh/nhap-excel'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          danh_sach: previewDataExcel,
          mac_dinh_lop_hoc_id: macDinhLopIdExcel || undefined,
        }),
      });

      const data = await res.json();
      if (data.thanh_cong) {
        showSuccess(data.thong_bao || `Import thành công ${data.tao_moi} học sinh.`);
        setKetQuaImport({
          tongSo: data.tong_so,
          thanhCong: data.tao_moi,
          danhSachTaiKhoan: data.danh_sach_tai_khoan || [],
          loiChiTiet: data.loi_chi_tiet || [],
        });
        setPreviewDataExcel([]);
        setFileExcelTen('');
        taiDanhSachHocSinh();
      } else {
        showError(data.thong_bao || 'Lỗi khi nhập danh sách học sinh.');
        if (data.loi_chi_tiet && Array.isArray(data.loi_chi_tiet)) {
          setLoiValidateLocal(data.loi_chi_tiet);
        }
      }
    } catch (err) {
      showError('Lỗi kết nối máy chủ khi nhập file.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // XUẤT DANH SÁCH TÀI KHOẢN HỌC SINH CHUẨN IN ẤN VÀ PHÁT (.XLSX)
  const handleExportAccountList = (selectedClass?: string) => {
    if (!ketQuaImport || ketQuaImport.danhSachTaiKhoan.length === 0) {
      showError('Không có dữ liệu tài khoản để xuất.');
      return;
    }

    const filterClass = selectedClass !== undefined ? selectedClass : exportClassFilter;
    const accounts = filterClass
      ? ketQuaImport.danhSachTaiKhoan.filter(
          (a) => a.ten_lop.trim().toLowerCase() === filterClass.trim().toLowerCase(),
        )
      : ketQuaImport.danhSachTaiKhoan;

    if (accounts.length === 0) {
      showError(`Không tìm thấy tài khoản nào thuộc lớp "${filterClass}".`);
      return;
    }

    const namHocHienTai = danhSachLop[0]?.nam_hoc || '2026-2027';
    const wb = XLSX.utils.book_new();

    // Sheet 1: TaiKhoanHocSinh
    const wsData: any[][] = [
      ['DANH SÁCH TÀI KHOẢN HỌC SINH'],
      ['TRƯỜNG THCS ĐÔNG QUANG'],
      [`Năm học: ${namHocHienTai}${filterClass ? ` — Lớp: ${filterClass}` : ''}`],
      [], // Dòng trống
      ['STT', 'HỌ VÀ TÊN', 'LỚP', 'MÃ HỌC SINH', 'TÀI KHOẢN', 'MẬT KHẨU BAN ĐẦU'],
    ];

    accounts.forEach((acc, idx) => {
      wsData.push([
        idx + 1,
        acc.ho_ten,
        acc.ten_lop,
        acc.ma_hoc_sinh,
        acc.ten_dang_nhap,
        acc.mat_khau_ban_dau,
      ]);
    });

    // Thêm phần ghi chú Hướng dẫn đăng nhập ở cuối bảng
    wsData.push([]);
    wsData.push(['Hướng dẫn đăng nhập:']);
    wsData.push(['Tài khoản: Mã học sinh (Ví dụ: HS2660001)']);
    wsData.push(['Mật khẩu ban đầu: Mật khẩu được cấp trong bảng trên.']);
    wsData.push([
      'Học sinh sử dụng tài khoản và mật khẩu được cấp để đăng nhập Cổng thông tin học sinh của nhà trường.',
    ]);
    wsData.push([
      'Sau khi đăng nhập lần đầu, học sinh nên đổi mật khẩu để đảm bảo an toàn và bảo mật thông tin.',
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Thiết lập độ rộng cột chuẩn xác (không bị đè/tràn chữ)
    ws['!cols'] = [
      { wch: 8 },  // STT
      { wch: 30 }, // HỌ VÀ TÊN
      { wch: 12 }, // LỚP
      { wch: 20 }, // MÃ HỌC SINH
      { wch: 20 }, // TÀI KHOẢN
      { wch: 22 }, // MẬT KHẨU BAN ĐẦU
    ];

    // Cấu hình in ấn A4 (Landscape, Fit to Width)
    ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
    (ws as any)['!pageSetup'] = {
      paperSize: 9, // A4
      orientation: 'landscape',
      scale: 100,
      fitToWidth: 1,
      fitToHeight: 0,
    };

    // Merges cho các dòng tiêu đề đầu file
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'TaiKhoanHocSinh');

    // Sheet 2: HuongDan
    const wsHuongDanData = [
      ['MỤC', 'NỘI DUNG HƯỚNG DẪN ĐĂNG NHẬP VÀ BẢO MẬT'],
      [1, 'Tài khoản đăng nhập: Là Mã học sinh được cấp trong danh sách (Ví dụ: HS2660001).'],
      [2, 'Mật khẩu ban đầu: Trùng với Mã học sinh được cấp tại thời điểm tạo tài khoản/import.'],
      [3, 'Đăng nhập: Học sinh truy cập Cổng thông tin điện tử của nhà trường và chọn "Đăng nhập Cổng học sinh".'],
      [4, 'Bảo mật: Sau khi đăng nhập thành công lần đầu, học sinh bắt buộc đổi mật khẩu mới để bảo mật dữ liệu.'],
      [5, 'Quên mật khẩu: Học sinh liên hệ Giáo viên chủ nhiệm hoặc Quản trị viên để được cấp lại mật khẩu mặc định.'],
    ];
    const wsHuongDan = XLSX.utils.aoa_to_sheet(wsHuongDanData);
    wsHuongDan['!cols'] = [{ wch: 8 }, { wch: 95 }];
    XLSX.utils.book_append_sheet(wb, wsHuongDan, 'HuongDan');

    const fileName = `danh_sach_tai_khoan_hoc_sinh_${filterClass ? filterClass + '_' : ''}${new Date().toISOString().slice(0, 10)}.xlsx`;
    downloadWorkbookAsXlsx(wb, fileName);
    showSuccess(`Đã xuất ${accounts.length} tài khoản ra file "${fileName}". Vui lòng bảo quản an toàn!`);
  };

  // XUẤT TÀI KHOẢN CỦA CÁC HỌC SINH ĐƯỢC CHỌN TRÊN BẢNG CHÍNH
  const handleExportSelectedAccounts = () => {
    if (selectedIds.length === 0) {
      showError('Vui lòng chọn ít nhất một học sinh để xuất tài khoản.');
      return;
    }

    const selectedStudents = danhSach.filter((hs) => selectedIds.includes(hs.id));
    if (selectedStudents.length === 0) return;

    const namHocHienTai = selectedStudents[0]?.lop_hoc?.nam_hoc || danhSachLop[0]?.nam_hoc || '2026-2027';
    const wb = XLSX.utils.book_new();

    // Sheet 1: TaiKhoanHocSinh
    const wsData: any[][] = [
      ['DANH SÁCH TÀI KHOẢN HỌC SINH'],
      ['TRƯỜNG THCS ĐÔNG QUANG'],
      [`Năm học: ${namHocHienTai}`],
      [], // Dòng trống
      ['STT', 'HỌ VÀ TÊN', 'LỚP', 'MÃ HỌC SINH', 'TÀI KHOẢN', 'MẬT KHẨU BAN ĐẦU'],
    ];

    selectedStudents.forEach((hs, idx) => {
      wsData.push([
        idx + 1,
        hs.ho_ten,
        hs.lop_hoc?.ten_lop || '',
        hs.ma_hoc_sinh,
        hs.ma_hoc_sinh,
        hs.ma_hoc_sinh,
      ]);
    });

    // Thêm phần ghi chú Hướng dẫn đăng nhập ở cuối bảng
    wsData.push([]);
    wsData.push(['Hướng dẫn đăng nhập:']);
    wsData.push(['Tài khoản: Mã học sinh (Ví dụ: HS2660001)']);
    wsData.push(['Mật khẩu ban đầu: Mật khẩu được cấp trong bảng trên.']);
    wsData.push([
      'Học sinh sử dụng tài khoản và mật khẩu được cấp để đăng nhập Cổng thông tin học sinh của nhà trường.',
    ]);
    wsData.push([
      'Sau khi đăng nhập lần đầu, học sinh nên đổi mật khẩu để đảm bảo an toàn và bảo mật thông tin.',
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 8 },  // STT
      { wch: 30 }, // HỌ VÀ TÊN
      { wch: 12 }, // LỚP
      { wch: 20 }, // MÃ HỌC SINH
      { wch: 20 }, // TÀI KHOẢN
      { wch: 22 }, // MẬT KHẨU BAN ĐẦU
    ];

    ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
    (ws as any)['!pageSetup'] = {
      paperSize: 9,
      orientation: 'landscape',
      scale: 100,
      fitToWidth: 1,
      fitToHeight: 0,
    };
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'TaiKhoanHocSinh');

    // Sheet 2: HuongDan
    const wsHuongDanData = [
      ['MỤC', 'NỘI DUNG HƯỚNG DẪN ĐĂNG NHẬP VÀ BẢO MẬT'],
      [1, 'Tài khoản đăng nhập: Là Mã học sinh được cấp trong danh sách (Ví dụ: HS2660001).'],
      [2, 'Mật khẩu ban đầu: Trùng với Mã học sinh được cấp tại thời điểm tạo tài khoản/import.'],
      [3, 'Đăng nhập: Học sinh truy cập Cổng thông tin điện tử của nhà trường và chọn "Đăng nhập Cổng học sinh".'],
      [4, 'Bảo mật: Sau khi đăng nhập thành công lần đầu, học sinh bắt buộc đổi mật khẩu mới để bảo mật dữ liệu.'],
      [5, 'Quên mật khẩu: Học sinh liên hệ Giáo viên chủ nhiệm hoặc Quản trị viên để được cấp lại mật khẩu mặc định.'],
    ];
    const wsHuongDan = XLSX.utils.aoa_to_sheet(wsHuongDanData);
    wsHuongDan['!cols'] = [{ wch: 8 }, { wch: 95 }];
    XLSX.utils.book_append_sheet(wb, wsHuongDan, 'HuongDan');

    const fileName = `danh_sach_tai_khoan_da_chon_${new Date().toISOString().slice(0, 10)}.xlsx`;
    downloadWorkbookAsXlsx(wb, fileName);
    showSuccess(`Đã xuất tài khoản của ${selectedStudents.length} học sinh ra file "${fileName}". Vui lòng bảo quản an toàn!`);
  };

  // Select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(danhSach.map((hs) => hs.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const copyToClipboard = (text: string, message: string = 'Đã sao chép vào bộ nhớ tạm!') => {
    navigator.clipboard.writeText(text);
    showSuccess(message);
  };

  const getTrangThaiBadge = (status: string) => {
    switch (status) {
      case 'TOT_NGHIEP':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">🎓 Đã Tốt Nghiệp</span>;
      case 'LUU_BAN':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Lưu Ban</span>;
      case 'THOI_HOC':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Thôi Học</span>;
      case 'CHUYEN_TRUONG':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">Chuyển Trường</span>;
      case 'DANG_HOC':
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Đang Học</span>;
    }
  };

  if (dangTaiPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500 font-medium">Đang tải dữ liệu Quản lý Học sinh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                🎓 Quản lý Học sinh
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Hệ thống tự động sinh Mã học sinh vĩnh viễn (<code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-700 font-mono font-semibold">HS2660001</code>), tài khoản đăng nhập và theo dõi lịch sử lên lớp.
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
              {currentUserPerms.includes('hoc_sinh_tao') && (
                <>
                  <button
                    onClick={handleOpenTao}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    + Thêm Học Sinh
                  </button>
                  <button
                    onClick={() => {
                      setShowModalNhapExcel(true);
                      setKetQuaImport(null);
                      setPreviewDataExcel([]);
                    }}
                    className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    📥 Nhập từ Excel
                  </button>
                </>
              )}

              {currentUserPerms.includes('hoc_sinh_xuat_excel') && (
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center px-3.5 py-2 border border-emerald-600 rounded-lg shadow-sm text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  📊 Xuất Excel
                </button>
              )}
            </div>
          </div>

          {/* Action bar for multi-select */}
          {selectedIds.length > 0 && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-900">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {selectedIds.length}
                </span>
                học sinh đang được chọn
              </div>
              <div className="flex items-center gap-2">
                {currentUserPerms.includes('hoc_sinh_sua') && (
                  <>
                    <button
                      onClick={handleOpenLenLop}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1"
                    >
                      🎓 Lên lớp ({selectedIds.length})
                    </button>
                    <button
                      onClick={handleOpenChuyenLop}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
                    >
                      🔄 Chuyển lớp ({selectedIds.length})
                    </button>
                    <button
                      onClick={handleOpenTotNghiep}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1"
                    >
                      🏅 Đánh dấu tốt nghiệp
                    </button>
                    <button
                      onClick={handleExportSelectedAccounts}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
                    >
                      📊 Xuất tài khoản ({selectedIds.length} HS)
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tìm kiếm</label>
                <input
                  type="text"
                  value={tuKhoa}
                  onChange={(e) => {
                    setTuKhoa(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Nhập họ tên, mã HS (HS266...), địa chỉ..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lọc theo Khối</label>
                <select
                  value={filterKhoi}
                  onChange={(e) => {
                    setFilterKhoi(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Tất cả khối</option>
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lọc theo Lớp</label>
                <select
                  value={filterLopId}
                  onChange={(e) => {
                    setFilterLopId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Tất cả các lớp</option>
                  {danhSachLop.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.ten_lop} ({l.nam_hoc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái học sinh</label>
                <select
                  value={filterTrangThaiHS}
                  onChange={(e) => {
                    setFilterTrangThaiHS(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="DANG_HOC">Đang học</option>
                  <option value="LUU_BAN">Lưu ban</option>
                  <option value="TOT_NGHIEP">Đã tốt nghiệp</option>
                  <option value="CHUYEN_TRUONG">Chuyển trường</option>
                  <option value="THOI_HOC">Thôi học</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 font-medium text-gray-600">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === danhSach.length}
                        onChange={handleSelectAll}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-3.5 px-3 w-16 text-center">STT Lớp</th>
                    <th className="py-3.5 px-3">Mã Học Sinh</th>
                    <th className="py-3.5 px-3">Họ và Tên</th>
                    <th className="py-3.5 px-3">Giới Tính</th>
                    <th className="py-3.5 px-3">Ngày Sinh</th>
                    <th className="py-3.5 px-3">Lớp Học</th>
                    <th className="py-3.5 px-3">Trạng Thái</th>
                    <th className="py-3.5 px-3">Tài Khoản</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dangTaiData ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Đang tải danh sách học sinh...
                      </td>
                    </tr>
                  ) : danhSach.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500">
                        Không tìm thấy học sinh nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    danhSach.map((hs) => (
                      <tr key={hs.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(hs.id)}
                            onChange={() => handleSelectOne(hs.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-gray-700">
                          {hs.so_thu_tu || '-'}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200">
                              {hs.ma_hoc_sinh}
                            </span>
                            <button
                              onClick={() => copyToClipboard(hs.ma_hoc_sinh, `Đã sao chép mã ${hs.ma_hoc_sinh}`)}
                              title="Sao chép mã"
                              className="text-gray-400 hover:text-indigo-600 p-1"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-gray-900">
                          {hs.ho_ten}
                        </td>
                        <td className="py-3.5 px-3 text-gray-600">
                          {hs.gioi_tinh || '-'}
                        </td>
                        <td className="py-3.5 px-3 text-gray-600">
                          {hs.ngay_sinh ? new Date(hs.ngay_sinh).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{hs.lop_hoc?.ten_lop}</span>
                          <span className="text-xs text-gray-500 block">{hs.lop_hoc?.nam_hoc}</span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {getTrangThaiBadge(hs.trang_thai_hoc_sinh)}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {hs.nguoi_dung?.ten_dang_nhap || hs.ma_hoc_sinh}
                            </span>
                            {hs.trang_thai_hoc_sinh === 'TOT_NGHIEP' || hs.nguoi_dung?.trang_thai === false ? (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700 border border-red-200" title="Tài khoản đã bị khóa">
                                🔒 Đã khóa
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Hoạt động
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                          {currentUserPerms.includes('hoc_sinh_sua') && (
                            <button
                              onClick={() => handleOpenSua(hs)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded transition-colors"
                            >
                              Sửa
                            </button>
                          )}
                          {currentUserPerms.includes('hoc_sinh_xoa') && (
                            <button
                              onClick={() => handleOpenXoa(hs)}
                              className="text-red-600 hover:text-red-900 font-medium text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded transition-colors"
                            >
                              Xóa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {tongSoTrang > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Hiển thị {(page - 1) * 10 + 1} - {Math.min(page * 10, tongSo)} trên tổng số {tongSo} học sinh
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 text-xs font-medium text-gray-700">
                    Trang {page} / {tongSoTrang}
                  </span>
                  <button
                    disabled={page === tongSoTrang}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: THÊM HỌC SINH MỚI (Tự động sinh mã HS2660001)   */}
      {/* ======================================================== */}
      {showModalTao && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Thêm Học Sinh Mới</h3>
            <p className="text-xs text-gray-500 mb-4">
              Mã học sinh (<code className="font-mono text-indigo-600">HS2660001</code>) và tài khoản sẽ được hệ thống <strong>tự động tạo</strong>. Bạn chỉ cần nhập thông tin học tập của học sinh.
            </p>

            {thongBaoLoiModal && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {thongBaoLoiModal}
              </div>
            )}

            <form onSubmit={submitTao} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Họ và tên học sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTao.ho_ten}
                  onChange={(e) => setFormTao({ ...formTao, ho_ten: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formTao.ngay_sinh}
                    onChange={(e) => setFormTao({ ...formTao, ngay_sinh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={formTao.gioi_tinh}
                    onChange={(e) => setFormTao({ ...formTao, gioi_tinh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Lớp học ban đầu <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formTao.lop_hoc_id}
                    onChange={(e) => {
                      const lopId = e.target.value;
                      const selLop = danhSachLop.find((l) => l.id === lopId);
                      const match = selLop?.nam_hoc?.match(/^(\d{4})/);
                      setFormTao({
                        ...formTao,
                        lop_hoc_id: lopId,
                        nam_nhap_hoc: match ? match[1] : '2026',
                        khoi_nhap_hoc: selLop?.khoi ? String(selLop.khoi) : '6',
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {danhSachLop.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.ten_lop} ({l.nam_hoc})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">STT trong lớp (tùy chọn)</label>
                  <input
                    type="number"
                    min="1"
                    value={formTao.so_thu_tu}
                    onChange={(e) => setFormTao({ ...formTao, so_thu_tu: e.target.value })}
                    placeholder="Vd: 1, 2, 3..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Năm nhập học</label>
                  <input
                    type="number"
                    value={formTao.nam_nhap_hoc}
                    onChange={(e) => setFormTao({ ...formTao, nam_nhap_hoc: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Khối nhập học</label>
                  <select
                    value={formTao.khoi_nhap_hoc}
                    onChange={(e) => setFormTao({ ...formTao, khoi_nhap_hoc: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  value={formTao.dia_chi}
                  onChange={(e) => setFormTao({ ...formTao, dia_chi: e.target.value })}
                  placeholder="Thôn, Xã..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModalTao(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: THÔNG BÁO TẠO THÀNH CÔNG VỚI THÔNG TIN TÀI KHOẢN */}
      {/* ======================================================== */}
      {modalSuccessTao.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center animate-scaleUp border border-emerald-100">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Tạo Học Sinh Thành Công!</h3>
            <p className="text-xs text-gray-500 mb-4">
              Hệ thống đã cấp mã định danh vĩnh viễn và tạo tài khoản đăng nhập.
            </p>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-left mb-5 space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                <span className="text-xs text-gray-600">Họ và tên:</span>
                <span className="text-sm font-bold text-gray-900">{modalSuccessTao.ho_ten}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                <span className="text-xs text-gray-600">Mã học sinh:</span>
                <span className="font-mono text-base font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  {modalSuccessTao.ma_hoc_sinh}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                <span className="text-xs text-gray-600">Tên đăng nhập:</span>
                <span className="font-mono text-sm font-semibold text-gray-800">{modalSuccessTao.ten_dang_nhap}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                <span className="text-xs text-gray-600">Mật khẩu ban đầu:</span>
                <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                  {modalSuccessTao.mat_khau_ban_dau}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-gray-600">Lớp & Năm học:</span>
                <span className="text-xs font-medium text-gray-800">{modalSuccessTao.ten_lop} ({modalSuccessTao.nam_hoc})</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const text = `THÔNG TIN HỌC SINH THCS ĐÔNG QUANG:\nHọ tên: ${modalSuccessTao.ho_ten}\nMã học sinh: ${modalSuccessTao.ma_hoc_sinh}\nTài khoản: ${modalSuccessTao.ten_dang_nhap}\nMật khẩu ban đầu: ${modalSuccessTao.mat_khau_ban_dau}\nLớp: ${modalSuccessTao.ten_lop}`;
                  copyToClipboard(text, 'Đã sao chép thông tin đăng nhập vào bộ nhớ tạm!');
                  setCopiedSuccess(true);
                  setTimeout(() => setCopiedSuccess(false), 2500);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {copiedSuccess ? '✓ Đã sao chép vào bộ nhớ!' : '📋 Sao chép thông tin đăng nhập'}
              </button>
              <button
                onClick={() => setModalSuccessTao({ ...modalSuccessTao, isOpen: false })}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SỬA HỌC SINH (Mã HS & Username là READONLY)      */}
      {/* ======================================================== */}
      {showModalSua && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-scaleUp">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cập Nhật Hồ Sơ Học Sinh</h3>
                <p className="text-xs text-gray-500">Mã học sinh và tài khoản đăng nhập là định danh cố định không thể sửa.</p>
              </div>
              <button
                onClick={() => setShowModalSua(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {thongBaoLoiModal && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {thongBaoLoiModal}
              </div>
            )}

            <form onSubmit={submitSua} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mã học sinh (Cố định)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={formSua.ma_hoc_sinh}
                      className="w-full px-2.5 py-1.5 bg-gray-100 border border-gray-300 rounded font-mono text-xs font-bold text-indigo-800 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formSua.ma_hoc_sinh, `Đã sao chép mã ${formSua.ma_hoc_sinh}`)}
                      className="p-1 text-gray-500 hover:text-indigo-600"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tài khoản đăng nhập</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={formSua.ten_dang_nhap}
                    className="w-full px-2.5 py-1.5 bg-gray-100 border border-gray-300 rounded font-mono text-xs text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formSua.ho_ten}
                  onChange={(e) => setFormSua({ ...formSua, ho_ten: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formSua.ngay_sinh}
                    onChange={(e) => setFormSua({ ...formSua, ngay_sinh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={formSua.gioi_tinh}
                    onChange={(e) => setFormSua({ ...formSua, gioi_tinh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lớp học hiện tại</label>
                  <select
                    value={formSua.lop_hoc_id}
                    onChange={(e) => setFormSua({ ...formSua, lop_hoc_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {danhSachLop.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.ten_lop} ({l.nam_hoc})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">STT trong lớp</label>
                  <input
                    type="number"
                    min="1"
                    value={formSua.so_thu_tu}
                    onChange={(e) => setFormSua({ ...formSua, so_thu_tu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái học sinh</label>
                  <select
                    value={formSua.trang_thai_hoc_sinh}
                    onChange={(e) => setFormSua({ ...formSua, trang_thai_hoc_sinh: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DANG_HOC">Đang học</option>
                    <option value="LUU_BAN">Lưu ban</option>
                    <option value="TOT_NGHIEP">Đã tốt nghiệp</option>
                    <option value="CHUYEN_TRUONG">Chuyển trường</option>
                    <option value="THOI_HOC">Thôi học</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Năm tốt nghiệp (nếu có)</label>
                  <input
                    type="text"
                    value={formSua.nam_tot_nghiep}
                    onChange={(e) => setFormSua({ ...formSua, nam_tot_nghiep: e.target.value })}
                    placeholder="Vd: 2029-2030"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={formSua.dia_chi}
                  onChange={(e) => setFormSua({ ...formSua, dia_chi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalResetPass(true)}
                  className="w-full py-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-1"
                >
                  🔑 Đặt lại mật khẩu về mặc định ({formSua.ma_hoc_sinh})
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModalSua(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: LÊN LỚP (PROMOTION)                              */}
      {/* ======================================================== */}
      {showModalLenLop && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-900 mb-1">🎓 Lên Lớp Cho Học Sinh</h3>
            <p className="text-xs text-gray-500 mb-4">
              Chuyển {selectedIds.length} học sinh sang năm học mới. Mã học sinh và tài khoản giữ nguyên vĩnh viễn.
            </p>

            {thongBaoLoiModal && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {thongBaoLoiModal}
              </div>
            )}

            <form onSubmit={submitLenLop} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Năm học mới</label>
                <input
                  type="text"
                  required
                  value={lenLopNamHocMoi}
                  onChange={(e) => setLenLopNamHocMoi(e.target.value)}
                  placeholder="Ví dụ: 2027-2028"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Khối đích</label>
                <select
                  value={lenLopKhoiMoi}
                  onChange={(e) => setLenLopKhoiMoi(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chọn lớp đích <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={lenLopTargetLopId}
                  onChange={(e) => setLenLopTargetLopId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">-- Chọn lớp đích --</option>
                  {danhSachLop
                    .filter((l) => !lenLopKhoiMoi || String(l.khoi) === lenLopKhoiMoi)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.ten_lop} ({l.nam_hoc})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                ⚠️ Xác nhận chuyển {selectedIds.length} học sinh được chọn lên lớp mới. Bản ghi lịch sử lớp cũ sẽ được đóng và lịch sử mới được ghi nhận.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModalLenLop(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang xử lý...' : 'Xác nhận lên lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CHUYỂN LỚP (TRANSFER)                            */}
      {/* ======================================================== */}
      {showModalChuyenLop && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-900 mb-1">🔄 Chuyển Lớp Cho Học Sinh</h3>
            <p className="text-xs text-gray-500 mb-4">
              Chuyển {selectedIds.length} học sinh sang lớp mới trong cùng năm học.
            </p>

            {thongBaoLoiModal && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {thongBaoLoiModal}
              </div>
            )}

            <form onSubmit={submitChuyenLop} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chọn lớp học mới <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={targetLopMoiId}
                  onChange={(e) => setTargetLopMoiId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">-- Chọn lớp mới --</option>
                  {danhSachLop.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.ten_lop} ({l.nam_hoc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModalChuyenLop(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang chuyển...' : 'Xác nhận chuyển lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: ĐÁNH DẤU TỐT NGHIỆP                              */}
      {/* ======================================================== */}
      {showModalTotNghiep && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-900 mb-1">🏅 Đánh Dấu Tốt Nghiệp</h3>
            <p className="text-xs text-gray-500 mb-4">
              Xác nhận tốt nghiệp cho {selectedIds.length} học sinh. Toàn bộ hồ sơ, mã số và tài khoản được bảo tồn trọn vẹn.
            </p>

            {thongBaoLoiModal && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {thongBaoLoiModal}
              </div>
            )}

            <form onSubmit={submitTotNghiep} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Năm tốt nghiệp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={totNghiepNam}
                  onChange={(e) => setTotNghiepNam(e.target.value)}
                  placeholder="Ví dụ: 2029-2030"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModalTotNghiep(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Xác nhận tốt nghiệp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: CONFIRM RESET PASSWORD                          */}
      {/* ======================================================== */}
      {showModalResetPass && selectedHocSinh && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center animate-scaleUp">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              🔑
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Đặt Lại Mật Khẩu Về Mặc Định?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Mật khẩu mới của học sinh <strong>{selectedHocSinh.ho_ten}</strong> sẽ được đặt lại bằng mã học sinh:
              <br />
              <code className="font-mono font-bold text-indigo-700 text-sm bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                {selectedHocSinh.ma_hoc_sinh}
              </code>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModalResetPass(false)}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={dangXuLyModal}
                onClick={handleResetPassword}
                className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-xs font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {dangXuLyModal ? 'Đang xử lý...' : 'Xác nhận đặt lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 8: IMPORT HỌC SINH TỪ EXCEL                         */}
      {/* ======================================================== */}
      {showModalNhapExcel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl relative animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-lg font-bold">📥</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Nhập Danh Sách Học Sinh Từ File Excel</h3>
                  <p className="text-xs text-gray-500">Quy trình 3 bước: Tải mẫu → Nhập dữ liệu → Kiểm tra & Import</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModalNhapExcel(false);
                  setKetQuaImport(null);
                  setLoiValidateLocal([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {ketQuaImport ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <div className="text-2xl font-bold text-emerald-700 mb-1">
                    ✓ Import thành công {ketQuaImport.thanhCong} học sinh
                  </div>
                  <p className="text-xs text-emerald-600">
                    Hệ thống đã tự sinh mã định danh và khởi tạo tài khoản đăng nhập tương ứng.
                  </p>
                </div>

                {/* Warning callout */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-bold">Cảnh báo bảo mật: </span>
                    File chứa thông tin tài khoản và mật khẩu ban đầu của học sinh. Vui lòng bảo quản an toàn và chỉ cung cấp cho đúng học sinh.
                  </div>
                </div>

                {ketQuaImport.danhSachTaiKhoan.length > 0 && (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Danh sách tài khoản vừa tạo ({ketQuaImport.danhSachTaiKhoan.length}):
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {Array.from(new Set(ketQuaImport.danhSachTaiKhoan.map((a) => a.ten_lop))).length > 1 && (
                          <select
                            value={exportClassFilter}
                            onChange={(e) => setExportClassFilter(e.target.value)}
                            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Tất cả các lớp ({ketQuaImport.danhSachTaiKhoan.length} HS)</option>
                            {Array.from(new Set(ketQuaImport.danhSachTaiKhoan.map((a) => a.ten_lop))).map((lop) => (
                              <option key={lop} value={lop}>
                                Lớp {lop} ({ketQuaImport.danhSachTaiKhoan.filter((a) => a.ten_lop === lop).length} HS)
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => {
                            const accountsToCopy = exportClassFilter
                              ? ketQuaImport.danhSachTaiKhoan.filter(
                                  (a) => a.ten_lop.trim().toLowerCase() === exportClassFilter.trim().toLowerCase(),
                                )
                              : ketQuaImport.danhSachTaiKhoan;
                            const text = accountsToCopy
                              .map(
                                (a) =>
                                  `${a.stt}\t${a.ho_ten}\t${a.ten_lop}\t${a.ma_hoc_sinh}\t${a.ten_dang_nhap}\t${a.mat_khau_ban_dau}`,
                              )
                              .join('\n');
                            copyToClipboard(
                              `STT\tHọ và tên\tLớp\tMã HS\tUsername\tMật khẩu ban đầu\n` + text,
                              `Đã sao chép danh sách tài khoản${exportClassFilter ? ` lớp ${exportClassFilter}` : ''}!`,
                            );
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 transition-colors"
                        >
                          📋 Sao chép thông tin
                        </button>
                        <button
                          onClick={() => handleExportAccountList()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 transition-colors"
                        >
                          📊 Tải danh sách tài khoản (.xlsx)
                        </button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl text-xs">
                      <table className="min-w-full divide-y divide-gray-200 text-left">
                        <thead className="bg-gray-50 text-gray-600 sticky top-0">
                          <tr>
                            <th className="py-2 px-3 text-center w-12">STT</th>
                            <th className="py-2 px-3">Họ và Tên</th>
                            <th className="py-2 px-3">Lớp</th>
                            <th className="py-2 px-3">Mã Học Sinh</th>
                            <th className="py-2 px-3">Username</th>
                            <th className="py-2 px-3">Mật Khẩu Mặc Định</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {ketQuaImport.danhSachTaiKhoan.map((acc, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-2 px-3 text-center text-gray-500">{acc.stt}</td>
                              <td className="py-2 px-3 font-medium text-gray-900">{acc.ho_ten}</td>
                              <td className="py-2 px-3 text-gray-600">{acc.ten_lop}</td>
                              <td className="py-2 px-3 font-mono font-bold text-indigo-700 bg-indigo-50/50">{acc.ma_hoc_sinh}</td>
                              <td className="py-2 px-3 font-mono text-gray-800">{acc.ten_dang_nhap}</td>
                              <td className="py-2 px-3 font-mono text-emerald-700 bg-emerald-50/50 font-semibold">{acc.mat_khau_ban_dau}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowModalNhapExcel(false);
                      setKetQuaImport(null);
                      setLoiValidateLocal([]);
                    }}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-sm"
                  >
                    Hoàn tất & Đóng
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Step 1: Download Template */}
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Bước 1: Tải File Mẫu Chuẩn</h4>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      File mẫu gồm 3 sheet: <strong>DanhSachHocSinh</strong>, <strong>HuongDan</strong> và <strong>DanhMucLop</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={taiFileMau}
                    className="whitespace-nowrap px-3.5 py-2 bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    📥 Tải file Excel mẫu (.xlsx)
                  </button>
                </div>

                {/* Step 2: Upload and Class Selection */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Bước 2: Chọn File Đã Điền Dữ Liệu</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Chọn file Excel (.xlsx, .xls, .csv) từ máy tính
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-white file:text-indigo-700 hover:file:bg-indigo-50 cursor-pointer"
                    />
                    {fileExcelTen && (
                      <p className="mt-1.5 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        ✓ File: {fileExcelTen} ({previewDataExcel.length} dòng học sinh)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Lớp mặc định (dùng khi dòng trong file không ghi tên lớp):
                    </label>
                    <select
                      value={macDinhLopIdExcel}
                      onChange={(e) => setMacDinhLopIdExcel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Tự động nhận diện theo cột Lớp Học trong file Excel --</option>
                      {danhSachLop.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.ten_lop} ({l.nam_hoc})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Error Panel if any */}
                {loiValidateLocal.length > 0 && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl max-h-40 overflow-y-auto">
                    <p className="text-xs font-bold text-red-800 mb-1.5 flex items-center gap-1">
                      <span>⚠️</span> Phát hiện {loiValidateLocal.length} lỗi dữ liệu:
                    </p>
                    <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                      {loiValidateLocal.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step 3: Data Preview */}
                {previewDataExcel.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Xem trước dữ liệu ({previewDataExcel.length} học sinh):
                      </h4>
                      <span className="text-[11px] text-gray-500">Hiển thị tối đa 10 dòng đầu tiên</span>
                    </div>
                    <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl text-xs">
                      <table className="min-w-full divide-y divide-gray-200 text-left">
                        <thead className="bg-gray-50 text-gray-600 sticky top-0">
                          <tr>
                            <th className="py-2 px-3 text-center w-12">STT</th>
                            <th className="py-2 px-3">Họ và Tên</th>
                            <th className="py-2 px-3">Ngày Sinh</th>
                            <th className="py-2 px-3">Giới Tính</th>
                            <th className="py-2 px-3">Lớp Học</th>
                            <th className="py-2 px-3">Địa Chỉ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewDataExcel.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-1.5 px-3 text-center text-gray-500">{row.so_thu_tu || idx + 1}</td>
                              <td className="py-1.5 px-3 font-medium text-gray-900">{row.ho_ten}</td>
                              <td className="py-1.5 px-3 text-gray-600">{row.ngay_sinh || '-'}</td>
                              <td className="py-1.5 px-3 text-gray-600">{row.gioi_tinh || '-'}</td>
                              <td className="py-1.5 px-3 font-medium text-indigo-700">{row.ten_lop || '(Chưa điền)'}</td>
                              <td className="py-1.5 px-3 text-gray-500 truncate max-w-xs">{row.dia_chi || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Step 4: Action Footer */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    disabled={previewDataExcel.length === 0}
                    onClick={handleKiemTraDuLieu}
                    className="px-3.5 py-2 bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    🔍 Kiểm tra dữ liệu
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModalNhapExcel(false);
                        setLoiValidateLocal([]);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={previewDataExcel.length === 0 || dangXuLyModal}
                      onClick={submitNhapExcel}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      {dangXuLyModal ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Đang xử lý import...
                        </>
                      ) : (
                        `🚀 Import ${previewDataExcel.length > 0 ? previewDataExcel.length + ' ' : ''}học sinh`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 9: CONFIRM DELETE MODAL                             */}
      {/* ======================================================== */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedHocSinh?.ho_ten || 'học sinh này'}
        isDeleting={dangXuLyModal}
        onClose={() => {
          setShowModalXoa(false);
          setSelectedHocSinh(null);
        }}
        onConfirm={submitXoa}
      />
    </div>
  );
}

export default function QuanTriHocSinhPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <QuanTriHocSinhContent />
    </Suspense>
  );
}