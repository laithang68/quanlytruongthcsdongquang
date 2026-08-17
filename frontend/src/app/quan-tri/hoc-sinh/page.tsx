'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

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
  dia_chi?: string;
  lop_hoc_id: string;
  trang_thai: boolean;
  lop_hoc: LopHocOption;
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
  const [page, setPage] = useState(1);
  const [dangTaiData, setDangTaiData] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalChuyenLop, setShowModalChuyenLop] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  // Excel Modals & State
  const [showModalNhapExcel, setShowModalNhapExcel] = useState(false);
  const [fileExcelTen, setFileExcelTen] = useState('');
  const [previewDataExcel, setPreviewDataExcel] = useState<any[]>([]);
  const [macDinhLopIdExcel, setMacDinhLopIdExcel] = useState('');

  const [selectedHocSinh, setSelectedHocSinh] = useState<HocSinhItem | null>(null);

  const [formTao, setFormTao] = useState({
    ma_hoc_sinh: '',
    ho_ten: '',
    ngay_sinh: '',
    gioi_tinh: 'Nam',
    dia_chi: '',
    lop_hoc_id: '',
  });

  const [formSua, setFormSua] = useState({
    ma_hoc_sinh: '',
    ho_ten: '',
    ngay_sinh: '',
    gioi_tinh: 'Nam',
    dia_chi: '',
    lop_hoc_id: '',
  });

  const [targetLopMoiId, setTargetLopMoiId] = useState('');

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
      query.set('page', page.toString());
      query.set('limit', '10');

      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSach(data.du_lieu);
        setTongSo(data.tong_so);
        setTongSoTrang(data.tong_so_trang);
      }
    } catch (err) {
      console.error('Lỗi tải học sinh:', err);
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
  }, [dangTaiPage, page, filterLopId, filterKhoi]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    taiDanhSachHocSinh();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === danhSach.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(danhSach.map((item) => item.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Submit Tạo học sinh
  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/hoc-sinh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formTao),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể tạo học sinh.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể tạo học sinh.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Thêm mới thành công', 'Học sinh mới đã được tạo.');
      setShowModalTao(false);
      taiDanhSachHocSinh();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Open Modal Sửa
  const openModalSua = (hs: HocSinhItem) => {
    setSelectedHocSinh(hs);
    setFormSua({
      ma_hoc_sinh: hs.ma_hoc_sinh,
      ho_ten: hs.ho_ten,
      ngay_sinh: hs.ngay_sinh ? hs.ngay_sinh.split('T')[0] : '',
      gioi_tinh: hs.gioi_tinh || 'Nam',
      dia_chi: hs.dia_chi || '',
      lop_hoc_id: hs.lop_hoc_id,
    });
    setThongBaoLoiModal('');
    setShowModalSua(true);
  };

  const submitSua = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedHocSinh) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh/${selectedHocSinh.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formSua),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể cập nhật học sinh.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể cập nhật học sinh.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật thành công', 'Thông tin học sinh đã được lưu.');
      setShowModalSua(false);
      taiDanhSachHocSinh();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Submit Chuyển Lớp Hàng Loạt
  const submitChuyenLop = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetLopMoiId || selectedIds.length === 0) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/hoc-sinh/chuyen-lop'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          danh_sach_hoc_sinh_id: selectedIds,
          lop_hoc_moi_id: targetLopMoiId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể chuyển lớp.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể chuyển lớp.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Chuyển lớp thành công', `Đã chuyển ${selectedIds.length} học sinh sang lớp mới.`);
      setShowModalChuyenLop(false);
      setSelectedIds([]);
      taiDanhSachHocSinh();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  const submitXoa = async () => {
    if (!selectedHocSinh) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh/${selectedHocSinh.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xóa thất bại', data.message || 'Không thể xóa học sinh.');
      } else {
        showSuccess('Xóa thành công', 'Học sinh đã được xóa.');
        setShowModalXoa(false);
        taiDanhSachHocSinh();
      }
    } catch (err) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // --------------------------------------------------------------------------
  // XỬ LÝ NHẬP VÀ XUẤT EXCEL
  // --------------------------------------------------------------------------

  // 1. Tải file mẫu Excel (.xlsx)
  const taiFileMau = async () => {
    const XLSX = await import('xlsx');
    const sampleData = [
      {
        'Mã Học Sinh': 'HS6001',
        'Họ và Tên': 'Nguyễn Văn An',
        'Ngày Sinh (YYYY-MM-DD)': '2013-05-15',
        'Giới Tính': 'Nam',
        'Lớp Học': '6A',
        'Địa Chỉ': 'Phường Đông Quang',
      },
      {
        'Mã Học Sinh': 'HS6002',
        'Họ và Tên': 'Trần Thị Bình',
        'Ngày Sinh (YYYY-MM-DD)': '2013-08-20',
        'Giới Tính': 'Nữ',
        'Lớp Học': '6A',
        'Địa Chỉ': 'Phường Đông Quang',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Nhap_Hoc_Sinh');
    XLSX.writeFile(workbook, 'Mau_Nhap_Hoc_Sinh_THCS_Dong_Quang.xlsx');
  };

  // 2. Đọc file Excel từ máy tính
  const handleDocFileExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileExcelTen(file.name);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        // Normalize keys
        const mappedData = rawData.map((row) => {
          const ma_hoc_sinh = row['Mã Học Sinh'] || row['ma_hoc_sinh'] || row['Mã HS'] || row['MA_HOC_SINH'] || '';
          const ho_ten = row['Họ và Tên'] || row['ho_ten'] || row['Họ tên'] || row['HO_TEN'] || '';
          const ngay_sinh = row['Ngày Sinh (YYYY-MM-DD)'] || row['Ngày Sinh'] || row['ngay_sinh'] || row['NGAY_SINH'] || '';
          const gioi_tinh = row['Giới Tính'] || row['gioi_tinh'] || row['GIOI_TINH'] || 'Nam';
          const ten_lop = row['Lớp Học'] || row['ten_lop'] || row['Lớp'] || row['LOP_HOC'] || '';
          const dia_chi = row['Địa Chỉ'] || row['dia_chi'] || row['DIA_CHI'] || '';

          return {
            ma_hoc_sinh: ma_hoc_sinh.toString().trim(),
            ho_ten: ho_ten.toString().trim(),
            ngay_sinh: ngay_sinh.toString().trim(),
            gioi_tinh: gioi_tinh.toString().trim(),
            ten_lop: ten_lop.toString().trim(),
            dia_chi: dia_chi.toString().trim(),
          };
        });

        setPreviewDataExcel(mappedData);
      } catch (err) {
        showError('Lỗi đọc file', 'Không thể đọc dữ liệu file Excel. Vui lòng kiểm tra định dạng file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // 3. Submit batch nhập Excel
  const submitNhapExcel = async (e: FormEvent) => {
    e.preventDefault();
    if (previewDataExcel.length === 0) {
      showError('Không có dữ liệu', 'Vui lòng chọn file Excel hợp lệ chứa dữ liệu học sinh.');
      return;
    }
    setThongBaoLoiModal('');
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/hoc-sinh/nhap-excel'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          danh_sach: previewDataExcel,
          mac_dinh_lop_hoc_id: macDinhLopIdExcel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể nhập dữ liệu từ Excel.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Nhập dữ liệu thành công', data.thong_bao || 'Nhập danh sách học sinh từ Excel thành công!');
      setShowModalNhapExcel(false);
      setPreviewDataExcel([]);
      setFileExcelTen('');
      taiDanhSachHocSinh();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ khi nhập Excel.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ khi nhập Excel.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // 4. Xuất danh sách Excel
  const handleXuatExcel = async () => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token') || '') : '';
      const query = new URLSearchParams();
      if (tuKhoa) query.set('tu_khoa', tuKhoa);
      if (filterLopId) query.set('lop_hoc_id', filterLopId);
      if (filterKhoi) query.set('khoi', filterKhoi);

      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh/xuat-excel?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong || !data.du_lieu) {
        showError('Xuất thất bại', data?.message || data?.thong_bao || 'Không thể xuất dữ liệu Excel.');
        return;
      }

      if (data.du_lieu.length === 0) {
        showError('Không có dữ liệu', 'Không có dữ liệu học sinh nào phù hợp để xuất.');
        return;
      }

      const rows = data.du_lieu.map((hs: any, index: number) => ({
        'STT': index + 1,
        'Mã Học Sinh': hs.ma_hoc_sinh || '',
        'Họ và Tên': hs.ho_ten || '',
        'Ngày Sinh': hs.ngay_sinh || '',
        'Giới Tính': hs.gioi_tinh || '',
        'Lớp Học': hs.ten_lop || '',
        'Khối': hs.khoi ? `Khối ${hs.khoi}` : '',
        'Năm Học': hs.nam_hoc || '',
        'Địa Chỉ': hs.dia_chi || '',
      }));

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Sach_Hoc_Sinh');
      XLSX.writeFile(workbook, `Danh_Sach_Hoc_Sinh_THCS_Dong_Quang_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showSuccess('Xuất thành công', 'File Excel đã được tải xuống.');
    } catch (err) {
      console.error(err);
      showError('Xuất thất bại', 'Lỗi kết nối máy chủ khi xuất dữ liệu Excel.');
    }
  };

  const hasPerm = (p: string) => currentUserPerms.includes(p);

  if (dangTaiPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Đang tải hệ thống quản lý Học sinh...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader />

        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto max-w-6xl w-full mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/quan-tri/lop-hoc')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs border border-slate-300 dark:border-slate-700 font-medium transition"
              >
                ← Quản lý Lớp học
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Học sinh</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {selectedIds.length > 0 && hasPerm('hoc_sinh_sua') && (
              <button
                onClick={() => {
                  setTargetLopMoiId('');
                  setThongBaoLoiModal('');
                  setShowModalChuyenLop(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition shadow-lg"
              >
                Chuyển lớp ({selectedIds.length} học sinh)
              </button>
            )}

            {hasPerm('hoc_sinh_tao') && (
              <button
                onClick={() => {
                  setFileExcelTen('');
                  setPreviewDataExcel([]);
                  setMacDinhLopIdExcel(danhSachLop[0]?.id || '');
                  setThongBaoLoiModal('');
                  setShowModalNhapExcel(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-lg flex items-center gap-1.5"
              >
                📥 Nhập từ Excel
              </button>
            )}

            {hasPerm('hoc_sinh_xem') && (
              <button
                onClick={handleXuatExcel}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition shadow-lg flex items-center gap-1.5"
              >
                📤 Xuất Excel
              </button>
            )}

            {hasPerm('hoc_sinh_tao') && (
              <button
                onClick={() => {
                  setFormTao({
                    ma_hoc_sinh: '',
                    ho_ten: '',
                    ngay_sinh: '',
                    gioi_tinh: 'Nam',
                    dia_chi: '',
                    lop_hoc_id: danhSachLop[0]?.id || '',
                  });
                  setThongBaoLoiModal('');
                  setShowModalTao(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-lg flex items-center gap-2"
              >
                + Thêm học sinh
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
          <input
            type="text"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Nhập tên học sinh, mã số hoặc địa chỉ..."
            className="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
          />

          <select
            value={filterKhoi}
            onChange={(e) => {
              setFilterKhoi(e.target.value);
              setFilterLopId('');
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">Tất cả các Khối</option>
            <option value="6">Khối 6</option>
            <option value="7">Khối 7</option>
            <option value="8">Khối 8</option>
            <option value="9">Khối 9</option>
          </select>

          <select
            value={filterLopId}
            onChange={(e) => {
              setFilterLopId(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">Tất cả các Lớp học</option>
            {danhSachLop
              .filter((l) => !filterKhoi || l.khoi === parseInt(filterKhoi, 10))
              .map((l) => (
                <option key={l.id} value={l.id}>
                  Lớp {l.ten_lop} (Khối {l.khoi})
                </option>
              ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Table Học sinh */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl overflow-hidden shadow-xl">
          {dangTaiData ? (
            <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách học sinh...</div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">Không tìm thấy học sinh nào phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="p-3.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === danhSach.length && danhSach.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                      />
                    </th>
                    <th className="p-3.5">Mã HS</th>
                    <th className="p-3.5">Họ và Tên</th>
                    <th className="p-3.5">Lớp học</th>
                    <th className="p-3.5">Giới tính</th>
                    <th className="p-3.5">Ngày sinh</th>
                    <th className="p-3.5">Địa chỉ</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {danhSach.map((hs) => (
                    <tr key={hs.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(hs.id)}
                          onChange={() => toggleSelectOne(hs.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                        />
                      </td>
                      <td className="p-3.5 font-mono text-blue-600 dark:text-blue-400 font-bold">{hs.ma_hoc_sinh}</td>
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{hs.ho_ten}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-slate-800 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-slate-700 font-bold text-[11px]">
                          Lớp {hs.lop_hoc?.ten_lop}
                        </span>
                      </td>
                      <td className="p-3.5">{hs.gioi_tinh || 'Nam'}</td>
                      <td className="p-3.5">
                        {hs.ngay_sinh ? new Date(hs.ngay_sinh).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="p-3.5 max-w-[200px] truncate text-slate-600 dark:text-slate-400 font-medium">{hs.dia_chi || '-'}</td>
                      <td className="p-3.5 text-right space-x-2">
                        {hasPerm('hoc_sinh_sua') && (
                          <button
                            onClick={() => openModalSua(hs)}
                            className="text-blue-400 hover:underline font-medium"
                          >
                            Sửa
                          </button>
                        )}
                        {hasPerm('hoc_sinh_xoa') && (
                          <button
                            onClick={() => {
                              setSelectedHocSinh(hs);
                              setShowModalXoa(true);
                            }}
                            className="text-rose-400 hover:underline font-medium"
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {tongSoTrang > 1 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <div>Tổng số <strong className="text-slate-900 dark:text-white font-bold">{tongSo}</strong> học sinh</div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-medium"
                >
                  ← Trước
                </button>
                <span>Trang {page} / {tongSoTrang}</span>
                <button
                  disabled={page >= tongSoTrang}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-medium"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>

      {/* MODAL THÊM HỌC SINH */}
      {showModalTao && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Thêm hồ sơ Học sinh mới</h2>

            {thongBaoLoiModal && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl font-medium">
                {thongBaoLoiModal}
              </div>
            )}

            <form onSubmit={submitTao} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mã học sinh *</label>
                  <input
                    type="text"
                    required
                    value={formTao.ma_hoc_sinh}
                    onChange={(e) => setFormTao({ ...formTao, ma_hoc_sinh: e.target.value })}
                    placeholder="Vd: HS6001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Lớp học *</label>
                  <select
                    required
                    value={formTao.lop_hoc_id}
                    onChange={(e) => setFormTao({ ...formTao, lop_hoc_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Chọn Lớp --</option>
                    {danhSachLop.map((l) => (
                      <option key={l.id} value={l.id}>
                        Lớp {l.ten_lop} (Khối {l.khoi})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formTao.ho_ten}
                  onChange={(e) => setFormTao({ ...formTao, ho_ten: e.target.value })}
                  placeholder="Nhập đầy đủ họ và tên..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ngày sinh</label>
                  <input
                    type="date"
                    value={formTao.ngay_sinh}
                    onChange={(e) => setFormTao({ ...formTao, ngay_sinh: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Giới tính</label>
                  <select
                    value={formTao.gioi_tinh}
                    onChange={(e) => setFormTao({ ...formTao, gioi_tinh: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Địa chỉ</label>
                <input
                  type="text"
                  value={formTao.dia_chi}
                  onChange={(e) => setFormTao({ ...formTao, dia_chi: e.target.value })}
                  placeholder="Vd: Phường Đông Quang, TP. Thanh Hóa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalTao(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA HỌC SINH */}
      {showModalSua && selectedHocSinh && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Cập nhật hồ sơ Học sinh</h2>

            {thongBaoLoiModal && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl font-medium">
                {thongBaoLoiModal}
              </div>
            )}

            <form onSubmit={submitSua} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mã học sinh *</label>
                  <input
                    type="text"
                    required
                    value={formSua.ma_hoc_sinh}
                    onChange={(e) => setFormSua({ ...formSua, ma_hoc_sinh: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Lớp học *</label>
                  <select
                    required
                    value={formSua.lop_hoc_id}
                    onChange={(e) => setFormSua({ ...formSua, lop_hoc_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Chọn Lớp --</option>
                    {danhSachLop.map((l) => (
                      <option key={l.id} value={l.id}>
                        Lớp {l.ten_lop} (Khối {l.khoi})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formSua.ho_ten}
                  onChange={(e) => setFormSua({ ...formSua, ho_ten: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ngày sinh</label>
                  <input
                    type="date"
                    value={formSua.ngay_sinh}
                    onChange={(e) => setFormSua({ ...formSua, ngay_sinh: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Giới tính</label>
                  <select
                    value={formSua.gioi_tinh}
                    onChange={(e) => setFormSua({ ...formSua, gioi_tinh: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Địa chỉ</label>
                <input
                  type="text"
                  value={formSua.dia_chi}
                  onChange={(e) => setFormSua({ ...formSua, dia_chi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalSua(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHUYỂN LỚP HÀNG LOẠT */}
      {showModalChuyenLop && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Chuyển lớp cho {selectedIds.length} học sinh</h2>

            {thongBaoLoiModal && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl font-medium">
                {thongBaoLoiModal}
              </div>
            )}

            <form onSubmit={submitChuyenLop} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Chọn lớp học mới *</label>
                <select
                  required
                  value={targetLopMoiId}
                  onChange={(e) => setTargetLopMoiId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Chọn Lớp mới --</option>
                  {danhSachLop.map((l) => (
                    <option key={l.id} value={l.id}>
                      Lớp {l.ten_lop} (Khối {l.khoi})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalChuyenLop(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang chuyển...' : 'Xác nhận chuyển lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NHẬP TỪ EXCEL */}
      {showModalNhapExcel && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📥</span> Nhập danh sách Học sinh từ file Excel
              </h2>
              <button
                onClick={() => setShowModalNhapExcel(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {thongBaoLoiModal && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl font-medium">
                {thongBaoLoiModal}
              </div>
            )}

            <form onSubmit={submitNhapExcel} className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Tải tệp mẫu Excel chuẩn</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sử dụng tệp mẫu để có đúng định dạng cấu trúc cột dữ liệu.</p>
                </div>
                <button
                  type="button"
                  onClick={taiFileMau}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition shrink-0 flex items-center justify-center gap-1.5"
                >
                  📄 Tải tệp mẫu (.xlsx)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Chọn file Excel (.xlsx, .csv) *</label>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleDocFileExcel}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                  />
                  {fileExcelTen && (
                    <p className="text-[11px] text-emerald-500 font-medium mt-1">Đã chọn: {fileExcelTen}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Lớp học mặc định (Nếu file không ghi tên lớp)</label>
                  <select
                    value={macDinhLopIdExcel}
                    onChange={(e) => setMacDinhLopIdExcel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Chọn Lớp mặc định --</option>
                    {danhSachLop.map((l) => (
                      <option key={l.id} value={l.id}>
                        Lớp {l.ten_lop} (Khối {l.khoi})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Table */}
              {previewDataExcel.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                      Xem trước dữ liệu ({previewDataExcel.length} học sinh đọc được)
                    </h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2 border-b">STT</th>
                          <th className="p-2 border-b">Mã HS</th>
                          <th className="p-2 border-b">Họ và Tên</th>
                          <th className="p-2 border-b">Ngày Sinh</th>
                          <th className="p-2 border-b">Giới Tính</th>
                          <th className="p-2 border-b">Lớp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {previewDataExcel.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2 font-semibold">{idx + 1}</td>
                            <td className="p-2 font-mono text-blue-500 font-bold">{row.ma_hoc_sinh || '-'}</td>
                            <td className="p-2 font-semibold text-slate-900 dark:text-white">{row.ho_ten || '-'}</td>
                            <td className="p-2">{row.ngay_sinh || '-'}</td>
                            <td className="p-2">{row.gioi_tinh || 'Nam'}</td>
                            <td className="p-2 font-bold text-amber-500">{row.ten_lop || 'Theo lớp mặc định'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModalNhapExcel(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal || previewDataExcel.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 transition shadow-md flex items-center gap-1.5"
                >
                  {dangXuLyModal ? 'Đang lưu CSDL...' : 'Xác nhận Nhập dữ liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedHocSinh?.ho_ten || 'học sinh này'}
        isDeleting={dangXuLyModal}
        onClose={() => { setShowModalXoa(false); setSelectedHocSinh(null); }}
        onConfirm={submitXoa}
      />
        </main>
      </div>
    </div>
  );
}

export default function TrangQuanTriHocSinh() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-sm">Đang tải...</div>}>
      <QuanTriHocSinhContent />
    </Suspense>
  );
}