'use client';

import { getApiUrl, getMediaUrl } from '@/lib/api';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface LoaiVanBanItem {
  id: string;
  ten: string;
  ma: string;
}

interface TepTinItem {
  id: string;
  ten_goc: string;
  url: string;
  loai_tap_tin: string;
  kich_thuoc: number;
}

interface NguoiTaoItem {
  id: string;
  ho_ten: string;
  email?: string;
}

interface VanBanItem {
  id: string;
  ten_van_ban: string;
  so_hieu: string;
  loai_van_ban_id: string;
  ngay_ban_hanh: string;
  nguoi_ky?: string;
  mo_ta?: string;
  tep_tin_id?: string;
  trang_thai: boolean;
  nguoi_tao_id: string;
  ngay_tao: string;
  ngay_cap_nhat: string;
  loai_van_ban: LoaiVanBanItem;
  tep_tin?: TepTinItem;
  nguoi_tao: NguoiTaoItem;
}

export default function TrangQuanTriVanBan() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // State Auth
  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [dangTaiPage, setDangTaiPage] = useState(true);

  // Data List State
  const [danhSach, setDanhSach] = useState<VanBanItem[]>([]);
  const [loaiVanBanList, setLoaiVanBanList] = useState<LoaiVanBanItem[]>([]);
  const [tongSo, setTongSo] = useState(0);
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);

  // Filters State
  const [tuKhoa, setTuKhoa] = useState('');
  const [soHieuLoc, setSoHieuLoc] = useState('');
  const [loaiVanBanLoc, setLoaiVanBanLoc] = useState('');
  const [trangThaiLoc, setTrangThaiLoc] = useState('');
  const [ngayTu, setNgayTu] = useState('');
  const [ngayDen, setNgayDen] = useState('');
  const [dangTaiData, setDangTaiData] = useState(false);

  // Modals State
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalXem, setShowModalXem] = useState(false);
  const [showModalTrangThai, setShowModalTrangThai] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  const [selectedItem, setSelectedItem] = useState<VanBanItem | null>(null);

  // Blob URL để chống IDM bắt link trong Quản trị
  const [adminPdfBlobUrl, setAdminPdfBlobUrl] = useState<string>('');
  const [dangTaiAdminPdfBlob, setDangTaiAdminPdfBlob] = useState<boolean>(false);

  useEffect(() => {
    if (showModalXem && selectedItem?.tep_tin?.url) {
      const isPdfFile = Boolean(
        selectedItem.tep_tin.url.toLowerCase().endsWith('.pdf') ||
        selectedItem.tep_tin.ten_goc.toLowerCase().endsWith('.pdf') ||
        selectedItem.tep_tin.loai_tap_tin?.toLowerCase().includes('pdf')
      );

      if (isPdfFile) {
        setDangTaiAdminPdfBlob(true);
        const streamUrl = getApiUrl(`/api/v1/tep-tin/xem-pdf?path=${encodeURIComponent(selectedItem.tep_tin.url)}`);
        let isMounted = true;
        let createdUrl = '';

        fetch(streamUrl)
          .then((res) => res.blob())
          .then((blob) => {
            if (!isMounted) return;
            createdUrl = URL.createObjectURL(blob);
            setAdminPdfBlobUrl(createdUrl);
          })
          .catch((err) => console.error('Lỗi nạp PDF Blob admin:', err))
          .finally(() => {
            if (isMounted) setDangTaiAdminPdfBlob(false);
          });

        return () => {
          isMounted = false;
          if (createdUrl) URL.revokeObjectURL(createdUrl);
        };
      }
    }
  }, [showModalXem, selectedItem]);

  const handleDownloadAdminFile = async (tepTin: TepTinItem) => {
    try {
      const downloadUrl = getApiUrl(`/api/v1/tep-tin/tai-ve?path=${encodeURIComponent(tepTin.url)}&ten_goc=${encodeURIComponent(tepTin.ten_goc)}`);
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = tepTin.ten_goc;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi tải tệp:', err);
    }
  };

  // Form State (Không nhận nguoi_tao_id vì Backend lấy từ JWT)
  const [formTao, setFormTao] = useState({
    so_hieu: '',
    ten_van_ban: '',
    loai_van_ban_id: '',
    ngay_ban_hanh: new Date().toISOString().slice(0, 10),
    nguoi_ky: '',
    mo_ta: '',
    tep_tin_id: '',
    trang_thai: true,
  });

  const [formSua, setFormSua] = useState({
    so_hieu: '',
    ten_van_ban: '',
    loai_van_ban_id: '',
    ngay_ban_hanh: '',
    nguoi_ky: '',
    mo_ta: '',
    tep_tin_id: '',
    trang_thai: true,
  });

  const [uploadedFileItem, setUploadedFileItem] = useState<TepTinItem | null>(null);
  const [thongBaoLoiModal, setThongBaoLoiModal] = useState('');
  const [dangXuLyModal, setDangXuLyModal] = useState(false);
  const [dangUploadFile, setDangUploadFile] = useState(false);

  const isRestrictedRole =
    (currentUserRoles.includes('GIAO_VIEN') || currentUserRoles.includes('BIEN_TAP_VIEN')) &&
    !currentUserRoles.includes('SUPER_ADMIN') &&
    !currentUserRoles.includes('QUAN_TRI_VIEN') &&
    !currentUserRoles.includes('BAN_GIAM_HIEU');

  // Kiểm tra Auth khi mount
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
          setCurrentUserId(data.du_lieu.id);
          setCurrentUserRoles(data.du_lieu.vai_tro || []);
          setDangTaiPage(false);
        } else {
          router.push('/dang-nhap');
        }
      })
      .catch(() => router.push('/dang-nhap'));

    // Tải danh mục Loại văn bản
    fetch(getApiUrl('/api/v1/loai-van-ban'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setLoaiVanBanList(data.du_lieu);
        }
      })
      .catch(() => {});
  }, [router]);

  // Tải danh sách văn bản quản trị
  const taiDanhSach = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setDangTaiData(true);
    const query = new URLSearchParams();
    query.set('page', trang.toString());
    query.set('limit', '10');
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    if (soHieuLoc.trim()) query.set('so_hieu', soHieuLoc.trim());
    if (loaiVanBanLoc) query.set('loai_van_ban_id', loaiVanBanLoc);
    if (trangThaiLoc) query.set('trang_thai', trangThaiLoc);
    if (ngayTu) query.set('ngay_tu', ngayTu);
    if (ngayDen) query.set('ngay_den', ngayDen);

    try {
      const res = await fetch(getApiUrl(`/api/v1/van-ban?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSach(data.du_lieu);
        setTongSo(data.tong_so);
        setTongSoTrang(data.tong_so_trang || 1);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách văn bản:', err);
    } finally {
      setDangTaiData(false);
    }
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSach();
    }
  }, [dangTaiPage, trang, loaiVanBanLoc, trangThaiLoc]);

  // Upload tệp tin văn bản (PDF, DOCX, XLSX up to 100MB)
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      showError('Tệp tin quá lớn', 'Tệp tin vượt quá dung lượng tối đa cho phép (100 MB).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setDangUploadFile(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/tep-tin/upload'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setUploadedFileItem(data.du_lieu);
        if (isEdit) {
          setFormSua((prev) => ({ ...prev, tep_tin_id: data.du_lieu.id }));
        } else {
          setFormTao((prev) => ({ ...prev, tep_tin_id: data.du_lieu.id }));
        }
        showSuccess('Tải lên thành công', `Tệp tin "${file.name}" đã được tải lên.`);
      } else {
        showError('Tải lên thất bại', data.message || 'Lỗi tải tệp tin lên hệ thống.');
      }
    } catch (err) {
      showError('Tải lên thất bại', 'Không thể kết nối máy chủ upload tệp tin.');
    } finally {
      setDangUploadFile(false);
    }
  };

  // Tạo văn bản
  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/van-ban'), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể tạo văn bản mới.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể tạo văn bản mới.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Thêm mới thành công', 'Văn bản mới đã được tạo.');
      setShowModalTao(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Sửa văn bản
  const openModalSua = (item: VanBanItem) => {
    setSelectedItem(item);
    setFormSua({
      so_hieu: item.so_hieu,
      ten_van_ban: item.ten_van_ban,
      loai_van_ban_id: item.loai_van_ban_id,
      ngay_ban_hanh: item.ngay_ban_hanh ? new Date(item.ngay_ban_hanh).toISOString().slice(0, 10) : '',
      nguoi_ky: item.nguoi_ky || '',
      mo_ta: item.mo_ta || '',
      tep_tin_id: item.tep_tin_id || '',
      trang_thai: item.trang_thai,
    });
    setUploadedFileItem(item.tep_tin || null);
    setThongBaoLoiModal('');
    setShowModalSua(true);
  };

  const submitSua = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/van-ban/${selectedItem.id}`), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể cập nhật văn bản.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể cập nhật văn bản.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật thành công', 'Văn bản đã được lưu.');
      setShowModalSua(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Bật/Tắt công khai
  const submitTrangThai = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/van-ban/${selectedItem.id}/trang-thai`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ trang_thai: !selectedItem.trang_thai }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Thao tác thất bại', data.message || 'Không thể thay đổi trạng thái công khai.');
      } else {
        showSuccess('Cập nhật trạng thái thành công', 'Trạng thái công khai đã được thay đổi.');
        setShowModalTrangThai(false);
        taiDanhSach();
      }
    } catch (err) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Xóa mềm văn bản
  const submitXoa = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/van-ban/${selectedItem.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xóa thất bại', data.message || 'Không thể xóa mềm văn bản.');
      } else {
        showSuccess('Xóa thành công', 'Văn bản đã được xóa.');
        setShowModalXoa(false);
        taiDanhSach();
      }
    } catch (err) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  const hasPerm = (p: string) => currentUserPerms.includes(p);

  if (dangTaiPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Đang tải hệ thống quản trị văn bản...
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
                onClick={() => router.push('/quan-tri')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs border border-slate-300 dark:border-slate-700 font-medium transition"
              >
                ← Tổng quan
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Văn bản</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG</p>
          </div>

          {hasPerm('van_ban_tao') && (
            <button
              onClick={() => {
                setFormTao({
                  so_hieu: '',
                  ten_van_ban: '',
                  loai_van_ban_id: loaiVanBanList[0]?.id || '',
                  ngay_ban_hanh: new Date().toISOString().slice(0, 10),
                  nguoi_ky: '',
                  mo_ta: '',
                  tep_tin_id: '',
                  trang_thai: true,
                });
                setUploadedFileItem(null);
                setThongBaoLoiModal('');
                setShowModalTao(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start md:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Thêm văn bản mới</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-4 shadow-xl space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTrang(1);
              taiDanhSach();
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-4">
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm kiếm số hiệu, tên văn bản, trích yếu..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={loaiVanBanLoc}
                onChange={(e) => {
                  setLoaiVanBanLoc(e.target.value);
                  setTrang(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              >
                <option value="">Tất cả loại văn bản</option>
                {loaiVanBanList.map((lvb) => (
                  <option key={lvb.id} value={lvb.id}>
                    {lvb.ten}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <select
                value={trangThaiLoc}
                onChange={(e) => {
                  setTrangThaiLoc(e.target.value);
                  setTrang(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Công khai</option>
                <option value="false">Đang ẩn</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#E97036] hover:bg-[#D85F25] active:bg-[#C94F1D] text-white text-xs font-semibold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97036]/50"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl overflow-hidden shadow-xl">
          {dangTaiData ? (
            <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách văn bản...</div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {tuKhoa || loaiVanBanLoc || trangThaiLoc
                ? 'Không tìm thấy văn bản phù hợp.'
                : 'Chưa có văn bản nào trong hệ thống.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">Số / Ký hiệu</th>
                    <th className="p-4">Tên văn bản & Trích yếu</th>
                    <th className="p-4">Loại văn bản</th>
                    <th className="p-4">Ngày ban hành</th>
                    <th className="p-4">Người ký</th>
                    <th className="p-4">Người tạo</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Tệp đính kèm</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {danhSach.map((item) => {
                    const isAuthor = item.nguoi_tao_id === currentUserId;
                    const canEditThis = hasPerm('van_ban_sua') && (!isRestrictedRole || isAuthor);
                    const canDeleteThis = hasPerm('van_ban_xoa') && (!isRestrictedRole || isAuthor);

                    return (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 font-mono text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                          {item.so_hieu}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">{item.ten_van_ban}</div>
                          {item.mo_ta && <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium line-clamp-1">{item.mo_ta}</div>}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                            {item.loai_van_ban?.ten}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                          {new Date(item.ngay_ban_hanh).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{item.nguoi_ky || '-'}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                          {item.nguoi_tao?.ho_ten}
                          {isAuthor && <span className="ml-1 text-[10px] text-blue-400">(Tôi)</span>}
                        </td>
                        <td className="p-4">
                          {item.trang_thai ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 text-[11px] font-semibold">
                              Công khai
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-500/20 text-[11px] font-semibold">
                              Đang ẩn
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {item.tep_tin ? (
                            <a
                              href={item.tep_tin.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:underline text-[11px] flex items-center gap-1"
                            >
                              📎 {item.tep_tin.ten_goc}
                            </a>
                          ) : (
                            <span className="text-slate-600 text-[11px]">Không có</span>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                          {/* Xem */}
                          <button
                            title="Xem chi tiết văn bản"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowModalXem(true);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-slate-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Sửa */}
                          {canEditThis && (
                            <button
                              title="Sửa văn bản"
                              onClick={() => openModalSua(item)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}

                          {/* Bật/Tắt */}
                          {canEditThis && (
                            <button
                              title={item.trang_thai ? "Ẩn văn bản" : "Hiển thị văn bản công khai"}
                              onClick={() => {
                                setSelectedItem(item);
                                setShowModalTrangThai(true);
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors shadow-sm focus-visible:ring-2 ${item.trang_thai ? "text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 hover:border-amber-200 focus-visible:ring-amber-500" : "text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 hover:border-emerald-200 focus-visible:ring-emerald-500"}`}
                            >
                              {item.trang_thai ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.03 10.03 0 013.987-.843c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-3.324-3.324a3 3 0 11-4.243-4.243m4.243 4.243L3 3l18 18" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Xóa */}
                          {canDeleteThis && (
                            <button
                              title="Xóa văn bản"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowModalXoa(true);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Pagination */}
          <div className="p-4 bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>Hiển thị {danhSach.length} / Tổng số {tongSo} văn bản</div>
            <div className="flex items-center gap-2">
              <button
                disabled={trang <= 1}
                onClick={() => setTrang((p) => p - 1)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
              >
                Trang trước
              </button>
              <span>{trang} / {tongSoTrang}</span>
              <button
                disabled={trang >= tongSoTrang}
                onClick={() => setTrang((p) => p + 1)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>

      {/* MODAL TẠO VĂN BẢN */}
      {showModalTao && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl transition-colors rounded-2xl max-w-xl w-full p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-900">Thêm văn bản mới</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitTao} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 mb-1 font-semibold">Số / Ký hiệu văn bản *</label>
                  <input
                    type="text"
                    required
                    value={formTao.so_hieu}
                    onChange={(e) => setFormTao({ ...formTao, so_hieu: e.target.value })}
                    placeholder="Vd: 15/QĐ-THCSĐQ"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#E97036]"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 mb-1 font-semibold">Loại văn bản *</label>
                  <select
                    required
                    value={formTao.loai_van_ban_id}
                    onChange={(e) => setFormTao({ ...formTao, loai_van_ban_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#E97036]"
                  >
                    <option value="">-- Chọn loại văn bản --</option>
                    {loaiVanBanList.map((lvb) => (
                      <option key={lvb.id} value={lvb.id}>
                        {lvb.ten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-800 mb-1 font-semibold">Tên văn bản / Trích yếu *</label>
                <input
                  type="text"
                  required
                  value={formTao.ten_van_ban}
                  onChange={(e) => setFormTao({ ...formTao, ten_van_ban: e.target.value })}
                  placeholder="Nhập tên văn bản..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#E97036]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 mb-1 font-semibold">Ngày ban hành *</label>
                  <input
                    type="date"
                    required
                    value={formTao.ngay_ban_hanh}
                    onChange={(e) => setFormTao({ ...formTao, ngay_ban_hanh: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#E97036]"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 mb-1 font-semibold">Người ký ban hành</label>
                  <input
                    type="text"
                    value={formTao.nguoi_ky}
                    onChange={(e) => setFormTao({ ...formTao, nguoi_ky: e.target.value })}
                    placeholder="Vd: Nguyễn Văn A (Hiệu trưởng)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#E97036]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 mb-1 font-semibold">Tệp đính kèm (PDF, DOCX, XLSX ≤ 100MB)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => handleUploadFile(e, false)}
                    className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 p-1.5 rounded-xl w-full"
                  />
                  {dangUploadFile && <span className="text-slate-600 text-xs font-medium">Đang tải file...</span>}
                </div>
                {uploadedFileItem && (
                  <div className="mt-2 text-xs text-emerald-700 font-mono font-semibold">
                    ✓ Đã đính kèm: {uploadedFileItem.ten_goc} ({(uploadedFileItem.kich_thuoc / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-800 mb-1 font-semibold">Trích yếu nội dung ngắn</label>
                <textarea
                  rows={3}
                  value={formTao.mo_ta}
                  onChange={(e) => setFormTao({ ...formTao, mo_ta: e.target.value })}
                  placeholder="Tóm tắt nội dung văn bản..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#E97036]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalTao(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#D85F25] text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu văn bản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA VĂN BẢN */}
      {showModalSua && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl transition-colors rounded-2xl max-w-xl w-full p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa văn bản</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitSua} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 mb-1 font-semibold">Số / Ký hiệu *</label>
                  <input
                    type="text"
                    required
                    value={formSua.so_hieu}
                    onChange={(e) => setFormSua({ ...formSua, so_hieu: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#E97036]"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 mb-1 font-semibold">Loại văn bản *</label>
                  <select
                    required
                    value={formSua.loai_van_ban_id}
                    onChange={(e) => setFormSua({ ...formSua, loai_van_ban_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#E97036]"
                  >
                    {loaiVanBanList.map((lvb) => (
                      <option key={lvb.id} value={lvb.id}>
                        {lvb.ten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-800 mb-1 font-semibold">Tên văn bản *</label>
                <input
                  type="text"
                  required
                  value={formSua.ten_van_ban}
                  onChange={(e) => setFormSua({ ...formSua, ten_van_ban: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#E97036]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 mb-1 font-semibold">Ngày ban hành *</label>
                  <input
                    type="date"
                    required
                    value={formSua.ngay_ban_hanh}
                    onChange={(e) => setFormSua({ ...formSua, ngay_ban_hanh: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#E97036]"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 mb-1 font-semibold">Người ký</label>
                  <input
                    type="text"
                    value={formSua.nguoi_ky}
                    onChange={(e) => setFormSua({ ...formSua, nguoi_ky: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#E97036]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 mb-1 font-semibold">Thay đổi tệp đính kèm (nếu có)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => handleUploadFile(e, true)}
                    className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 p-1.5 rounded-xl w-full"
                  />
                  {dangUploadFile && <span className="text-slate-600 text-xs font-medium">Đang tải file...</span>}
                </div>
                {uploadedFileItem && (
                  <div className="mt-2 text-xs text-emerald-700 font-mono font-semibold">
                    ✓ Đã chọn file mới: {uploadedFileItem.ten_goc}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-800 mb-1 font-semibold">Trích yếu nội dung</label>
                <textarea
                  rows={3}
                  value={formSua.mo_ta}
                  onChange={(e) => setFormSua({ ...formSua, mo_ta: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#E97036]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalSua(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#D85F25] text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT VĂN BẢN */}
      {showModalXem && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors rounded-2xl max-w-4xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{selectedItem.ten_van_ban}</h2>
              <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                {selectedItem.so_hieu}
              </span>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>Loại văn bản: <strong className="text-slate-900 dark:text-white">{selectedItem.loai_van_ban?.ten}</strong></div>
                <div>Ngày ban hành: <strong className="text-slate-900 dark:text-white">{new Date(selectedItem.ngay_ban_hanh).toLocaleDateString('vi-VN')}</strong></div>
                <div>Người ký: <strong className="text-slate-900 dark:text-white">{selectedItem.nguoi_ky || 'Chưa cập nhật'}</strong></div>
                <div>Người tạo: <strong className="text-slate-900 dark:text-white">{selectedItem.nguoi_tao?.ho_ten}</strong></div>
              </div>

              {selectedItem.mo_ta && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-2 text-slate-800 dark:text-slate-300 leading-relaxed">
                  <strong>Trích yếu nội dung:</strong>
                  <div className="mt-1">{selectedItem.mo_ta}</div>
                </div>
              )}

              {/* XEM TRỰC TIẾP PDF NGAY TRONG MODAL VÀ NÚT TẢI VỀ (BLOB URL CHỐNG IDM) */}
              {selectedItem.tep_tin && (
                <div className="pt-3 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Tệp tin đính kèm: <span className="font-mono text-blue-500">{selectedItem.tep_tin.ten_goc}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {adminPdfBlobUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(adminPdfBlobUrl, '_blank')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md"
                        >
                          <span>👁️ Mở tab mới</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownloadAdminFile(selectedItem.tep_tin!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E97036] hover:bg-[#d85f25] text-white font-bold text-xs transition shadow-md"
                      >
                        <span>📥 Tải tệp về máy</span>
                      </button>
                    </div>
                  </div>

                  {Boolean(
                    selectedItem.tep_tin.url.toLowerCase().endsWith('.pdf') ||
                    selectedItem.tep_tin.ten_goc.toLowerCase().endsWith('.pdf') ||
                    selectedItem.tep_tin.loai_tap_tin?.toLowerCase().includes('pdf')
                  ) && (
                    <div className="w-full h-[550px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                      {dangTaiAdminPdfBlob ? (
                        <span className="text-xs text-slate-500 font-medium">Đang nạp dữ liệu PDF...</span>
                      ) : adminPdfBlobUrl ? (
                        <iframe
                          src={adminPdfBlobUrl}
                          className="w-full h-full border-0"
                          title={selectedItem.ten_van_ban}
                        />
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Không thể nạp tệp PDF.</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModalXem(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BẬT / TẮT TRẠNG THÁI */}
      {showModalTrangThai && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Đổi trạng thái Công khai</h2>
            <p className="text-xs text-slate-300">
              Bạn có chắc chắn muốn {selectedItem.trang_thai ? 'tắt công khai (ẩn)' : 'bật công khai'} văn bản{' '}
              <strong className="text-white">{selectedItem.so_hieu}</strong>?
            </p>
            <div className="pt-3 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowModalTrangThai(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={submitTrangThai}
                disabled={dangXuLyModal}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedItem?.so_hieu || selectedItem?.ten_van_ban || 'văn bản này'}
        isDeleting={dangXuLyModal}
        onClose={() => { setShowModalXoa(false); setSelectedItem(null); }}
        onConfirm={submitXoa}
      />
        </main>
      </div>
    </div>
  );
}