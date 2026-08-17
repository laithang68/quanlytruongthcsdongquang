'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface NguoiTaoItem {
  id: string;
  ho_ten: string;
  email?: string;
}

interface ThongBaoItem {
  id: string;
  tieu_de: string;
  noi_dung: string;
  doi_tuong: 'CONG_KHAI' | 'GIAO_VIEN' | 'HOC_SINH' | 'PHU_HUYNH';
  trang_thai: boolean;
  nguoi_tao_id: string;
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  ngay_tao: string;
  ngay_cap_nhat: string;
  nguoi_tao: NguoiTaoItem;
}

export default function TrangQuanTriThongBao() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // State Auth
  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [dangTaiPage, setDangTaiPage] = useState(true);

  // Data List State
  const [danhSach, setDanhSach] = useState<ThongBaoItem[]>([]);
  const [tongSo, setTongSo] = useState(0);
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [tuKhoa, setTuKhoa] = useState('');
  const [doiTuongLoc, setDoiTuongLoc] = useState('');
  const [trangThaiLoc, setTrangThaiLoc] = useState('');
  const [dangTaiData, setDangTaiData] = useState(false);

  // Modals State
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalXem, setShowModalXem] = useState(false);
  const [showModalTrangThai, setShowModalTrangThai] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  const [selectedItem, setSelectedItem] = useState<ThongBaoItem | null>(null);

  // Form State
  const [formTao, setFormTao] = useState({
    tieu_de: '',
    noi_dung: '',
    doi_tuong: 'CONG_KHAI',
    trang_thai: true,
    ngay_bat_dau: '',
    ngay_ket_thuc: '',
  });

  const [formSua, setFormSua] = useState({
    tieu_de: '',
    noi_dung: '',
    doi_tuong: 'CONG_KHAI',
    trang_thai: true,
    ngay_bat_dau: '',
    ngay_ket_thuc: '',
  });

  const [thongBaoLoiModal, setThongBaoLoiModal] = useState('');
  const [dangXuLyModal, setDangXuLyModal] = useState(false);

  // Mapping đối tượng
  const DOI_TUONG_MAP: Record<string, { label: string; class: string }> = {
    CONG_KHAI: { label: 'Công khai', class: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20' },
    GIAO_VIEN: { label: 'Giáo viên', class: 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-500/20' },
    HOC_SINH: { label: 'Học sinh', class: 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20' },
    PHU_HUYNH: { label: 'Phụ huynh', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  };

  const isOnlyGiaoVien =
    currentUserRoles.includes('GIAO_VIEN') &&
    !currentUserRoles.includes('SUPER_ADMIN') &&
    !currentUserRoles.includes('QUAN_TRI_VIEN') &&
    !currentUserRoles.includes('BAN_GIAM_HIEU');

  // Kiểm tra auth khi mount
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
  }, [router]);

  // Tải danh sách thông báo quản trị
  const taiDanhSach = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setDangTaiData(true);
    const query = new URLSearchParams();
    query.set('page', trang.toString());
    query.set('limit', '10');
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    if (doiTuongLoc) query.set('doi_tuong', doiTuongLoc);
    if (trangThaiLoc) query.set('trang_thai', trangThaiLoc);

    try {
      const res = await fetch(getApiUrl(`/api/v1/thong-bao?${query.toString()}`), {
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
      console.error('Lỗi tải danh sách thông báo:', err);
    } finally {
      setDangTaiData(false);
    }
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSach();
    }
  }, [dangTaiPage, trang, doiTuongLoc, trangThaiLoc]);

  // Tạo thông báo
  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');

    if (isOnlyGiaoVien && formTao.doi_tuong === 'CONG_KHAI') {
      setThongBaoLoiModal(
        'Giáo viên không có quyền tạo thông báo CÔNG KHAI. Vui lòng chọn Giáo viên, Học sinh hoặc Phụ huynh.',
      );
      return;
    }

    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/thong-bao'), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể tạo thông báo.');
        setDangXuLyModal(false);
        return;
      }

      setShowModalTao(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Sửa thông báo
  const openModalSua = (item: ThongBaoItem) => {
    setSelectedItem(item);
    setFormSua({
      tieu_de: item.tieu_de,
      noi_dung: item.noi_dung,
      doi_tuong: item.doi_tuong,
      trang_thai: item.trang_thai,
      ngay_bat_dau: item.ngay_bat_dau ? new Date(item.ngay_bat_dau).toISOString().slice(0, 16) : '',
      ngay_ket_thuc: item.ngay_ket_thuc ? new Date(item.ngay_ket_thuc).toISOString().slice(0, 16) : '',
    });
    setThongBaoLoiModal('');
    setShowModalSua(true);
  };

  const submitSua = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setThongBaoLoiModal('');

    if (isOnlyGiaoVien && formSua.doi_tuong === 'CONG_KHAI') {
      setThongBaoLoiModal('Giáo viên không có quyền chuyển đối tượng thành CÔNG KHAI.');
      return;
    }

    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/thong-bao/${selectedItem.id}`), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể cập nhật thông báo.');
        setDangXuLyModal(false);
        return;
      }

      setShowModalSua(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Đổi trạng thái
  const submitTrangThai = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/thong-bao/${selectedItem.id}/trang-thai`), {
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
        showError('Thao tác thất bại', data.message || 'Không thể thay đổi trạng thái.');
      } else {
        showSuccess('Cập nhật trạng thái thành công', 'Trạng thái thông báo đã được thay đổi.');
        setShowModalTrangThai(false);
        taiDanhSach();
      }
    } catch (err) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Xóa thông báo
  const submitXoa = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/thong-bao/${selectedItem.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xóa thất bại', data.message || 'Không thể xóa thông báo.');
      } else {
        showSuccess('Xóa thành công', 'Thông báo đã được xóa.');
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
        Đang tải hệ thống quản trị thông báo...
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Thông báo</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG</p>
          </div>

          {hasPerm('thong_bao_tao') && (
            <button
              onClick={() => {
                setFormTao({
                  tieu_de: '',
                  noi_dung: '',
                  doi_tuong: isOnlyGiaoVien ? 'GIAO_VIEN' : 'CONG_KHAI',
                  trang_thai: true,
                  ngay_bat_dau: '',
                  ngay_ket_thuc: '',
                });
                setThongBaoLoiModal('');
                setShowModalTao(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start md:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Soạn thông báo mới</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-4 shadow-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTrang(1);
              taiDanhSach();
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-5">
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm kiếm tiêu đề, nội dung thông báo..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={doiTuongLoc}
                onChange={(e) => {
                  setDoiTuongLoc(e.target.value);
                  setTrang(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              >
                <option value="">Tất cả đối tượng</option>
                <option value="CONG_KHAI">Công khai</option>
                <option value="GIAO_VIEN">Giáo viên</option>
                <option value="HOC_SINH">Học sinh</option>
                <option value="PHU_HUYNH">Phụ huynh</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                value={trangThaiLoc}
                onChange={(e) => {
                  setTrangThaiLoc(e.target.value);
                  setTrang(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang bật</option>
                <option value="false">Đã tắt</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#E97036] hover:bg-[#D85F25] active:bg-[#C94F1D] text-white text-xs font-semibold transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97036]/50"
              >
                Tìm
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl overflow-hidden shadow-xl">
          {dangTaiData ? (
            <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách thông báo...</div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {tuKhoa || doiTuongLoc || trangThaiLoc
                ? 'Không tìm thấy thông báo phù hợp.'
                : 'Chưa có thông báo nào.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">Tiêu đề thông báo</th>
                    <th className="p-4">Đối tượng</th>
                    <th className="p-4">Người tạo</th>
                    <th className="p-4">Thời gian hiệu lực</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {danhSach.map((item) => {
                    const dtInfo = DOI_TUONG_MAP[item.doi_tuong] || {
                      label: item.doi_tuong,
                      class: 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-semibold font-semibold',
                    };
                    const isAuthor = item.nguoi_tao_id === currentUserId;
                    const canEditThis =
                      hasPerm('thong_bao_sua') && (!isOnlyGiaoVien || isAuthor);
                    const canDeleteThis =
                      hasPerm('thong_bao_xoa') && (!isOnlyGiaoVien || isAuthor);

                    return (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">{item.tieu_de}</div>
                          <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                            Ngày tạo: {new Date(item.ngay_tao).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${dtInfo.class}`}
                          >
                            {dtInfo.label}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                          {item.nguoi_tao?.ho_ten || 'Hệ thống'}
                          {isAuthor && <span className="ml-1 text-[10px] text-blue-400">(Tôi)</span>}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                          {item.ngay_bat_dau ? new Date(item.ngay_bat_dau).toLocaleDateString('vi-VN') : 'Từ trước'}
                          {' → '}
                          {item.ngay_ket_thuc ? new Date(item.ngay_ket_thuc).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                        </td>
                        <td className="p-4">
                          {item.trang_thai ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 text-[11px] font-semibold">
                              Đang bật
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-500/20 text-[11px] font-semibold">
                              Đã ẩn
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                          {/* Xem chi tiết */}
                          <button
                            title="Xem chi tiết thông báo"
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
                              title="Sửa thông báo"
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
                              title={item.trang_thai ? "Tắt thông báo" : "Bật phát hành thông báo"}
                              onClick={() => {
                                setSelectedItem(item);
                                setShowModalTrangThai(true);
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors shadow-sm focus-visible:ring-2 ${item.trang_thai ? "text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 hover:border-amber-200 focus-visible:ring-amber-500" : "text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 hover:border-emerald-200 focus-visible:ring-emerald-500"}`}
                            >
                              {item.trang_thai ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Xóa */}
                          {canDeleteThis && (
                            <button
                              title="Xóa thông báo"
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
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
            <div>Hiển thị {danhSach.length} / Tổng số {tongSo} thông báo</div>
            <div className="flex items-center gap-2">
              <button
                disabled={trang <= 1}
                onClick={() => setTrang((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium disabled:opacity-40"
              >
                Trang trước
              </button>
              <span>{trang} / {tongSoTrang}</span>
              <button
                disabled={trang >= tongSoTrang}
                onClick={() => setTrang((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>

      {/* MODAL TẠO THÔNG BÁO */}
      {showModalTao && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-4xl w-full p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Soạn thông báo mới</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitTao} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tiêu đề thông báo *</label>
                <input
                  type="text"
                  required
                  value={formTao.tieu_de}
                  onChange={(e) => setFormTao({ ...formTao, tieu_de: e.target.value })}
                  placeholder="Nhập tiêu đề..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Đối tượng nhận *</label>
                  <select
                    value={formTao.doi_tuong}
                    onChange={(e) => setFormTao({ ...formTao, doi_tuong: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    {!isOnlyGiaoVien && <option value="CONG_KHAI">Công khai</option>}
                    <option value="GIAO_VIEN">Giáo viên</option>
                    <option value="HOC_SINH">Học sinh</option>
                    <option value="PHU_HUYNH">Phụ huynh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Trạng thái ban đầu</label>
                  <select
                    value={formTao.trang_thai ? 'true' : 'false'}
                    onChange={(e) => setFormTao({ ...formTao, trang_thai: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="true">Bật (Phát hành ngay)</option>
                    <option value="false">Tắt (Lưu ẩn)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ngày bắt đầu hiệu lực</label>
                  <input
                    type="datetime-local"
                    value={formTao.ngay_bat_dau}
                    onChange={(e) => setFormTao({ ...formTao, ngay_bat_dau: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ngày kết thúc hiệu lực</label>
                  <input
                    type="datetime-local"
                    value={formTao.ngay_ket_thuc}
                    onChange={(e) => setFormTao({ ...formTao, ngay_ket_thuc: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">Nội dung thông báo *</label>
                <RichTextEditor
                  value={formTao.noi_dung}
                  onChange={(val) => setFormTao({ ...formTao, noi_dung: val })}
                  placeholder="Nhập nội dung thông báo..."
                  minHeight="160px"
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
                  {dangXuLyModal ? 'Đang lưu...' : 'Tạo thông báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA THÔNG BÁO */}
      {showModalSua && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-4xl w-full p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa thông báo</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitSua} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tiêu đề thông báo *</label>
                <input
                  type="text"
                  required
                  value={formSua.tieu_de}
                  onChange={(e) => setFormSua({ ...formSua, tieu_de: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Đối tượng nhận *</label>
                  <select
                    value={formSua.doi_tuong}
                    onChange={(e) => setFormSua({ ...formSua, doi_tuong: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    {!isOnlyGiaoVien && <option value="CONG_KHAI">Công khai</option>}
                    <option value="GIAO_VIEN">Giáo viên</option>
                    <option value="HOC_SINH">Học sinh</option>
                    <option value="PHU_HUYNH">Phụ huynh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Trạng thái</label>
                  <select
                    value={formSua.trang_thai ? 'true' : 'false'}
                    onChange={(e) => setFormSua({ ...formSua, trang_thai: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="true">Đang bật</option>
                    <option value="false">Đã tắt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ngày bắt đầu hiệu lực</label>
                  <input
                    type="datetime-local"
                    value={formSua.ngay_bat_dau}
                    onChange={(e) => setFormSua({ ...formSua, ngay_bat_dau: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ngày kết thúc hiệu lực</label>
                  <input
                    type="datetime-local"
                    value={formSua.ngay_ket_thuc}
                    onChange={(e) => setFormSua({ ...formSua, ngay_ket_thuc: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">Nội dung thông báo *</label>
                <RichTextEditor
                  value={formSua.noi_dung}
                  onChange={(val) => setFormSua({ ...formSua, noi_dung: val })}
                  placeholder="Nhập nội dung thông báo..."
                  minHeight="160px"
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
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT / XEM TRƯỚC */}
      {showModalXem && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white line-clamp-1">{selectedItem.tieu_de}</h2>
              <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                {selectedItem.doi_tuong}
              </span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Người tạo: <strong className="text-slate-200">{selectedItem.nguoi_tao?.ho_ten}</strong></div>
              <div>Ngày tạo: {new Date(selectedItem.ngay_tao).toLocaleString('vi-VN')}</div>
            </div>
            <div
              className="prose prose-invert max-w-none text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800"
              dangerouslySetInnerHTML={{ __html: selectedItem.noi_dung }}
            />
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModalXem(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BẬT / TẮT */}
      {showModalTrangThai && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Xác nhận Đổi trạng thái</h2>
            <p className="text-xs text-slate-300">
              Bạn có chắc chắn muốn {selectedItem.trang_thai ? 'tắt' : 'bật'} hiển thị thông báo{' '}
              <strong className="text-white">{selectedItem.tieu_de}</strong>?
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
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  selectedItem.trang_thai ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {selectedItem.trang_thai ? 'Tắt ngay' : 'Bật ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedItem?.tieu_de || 'thông báo này'}
        isDeleting={dangXuLyModal}
        onClose={() => { setShowModalXoa(false); setSelectedItem(null); }}
        onConfirm={submitXoa}
      />
        </main>
      </div>
    </div>
  );
}