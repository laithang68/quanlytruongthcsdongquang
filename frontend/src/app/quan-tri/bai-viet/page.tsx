'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { getApiUrl, getMediaUrl } from '@/lib/api';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface DanhMucItem {
  id: string;
  ten: string;
  slug: string;
}

interface TacGiaItem {
  id: string;
  ho_ten: string;
}

interface BaiVietItem {
  id: string;
  tieu_de: string;
  slug: string;
  mo_ta?: string;
  noi_dung: string;
  anh_dai_dien?: string;
  trang_thai: 'NHAP' | 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI' | 'DA_XUAT_BAN' | 'DA_LUU_TRU';
  luot_xem: number;
  ngay_tao: string;
  ngay_gui_duyet?: string;
  ngay_duyet?: string;
  ngay_xuat_ban?: string;
  danh_muc: DanhMucItem;
  tac_gia: TacGiaItem;
  the?: { id: string; ten: string; slug: string }[];
}

export default function TrangQuanTriBaiViet() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // State Auth
  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [dangTaiPage, setDangTaiPage] = useState(true);

  // Data List State
  const [danhSach, setDanhSach] = useState<BaiVietItem[]>([]);
  const [danhMucList, setDanhMucList] = useState<DanhMucItem[]>([]);
  const [tongSo, setTongSo] = useState(0);
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThaiLoc, setTrangThaiLoc] = useState('');
  const [danhMucLoc, setDanhMucLoc] = useState('');
  const [dangTaiData, setDangTaiData] = useState(false);

  // Modals State
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalGuiDuyet, setShowModalGuiDuyet] = useState(false);
  const [showModalDuyet, setShowModalDuyet] = useState(false);
  const [showModalTuChoi, setShowModalTuChoi] = useState(false);
  const [showModalXuatBan, setShowModalXuatBan] = useState(false);
  const [showModalAn, setShowModalAn] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  const [selectedItem, setSelectedItem] = useState<BaiVietItem | null>(null);

  // Form State
  const [formTao, setFormTao] = useState({
    tieu_de: '',
    mo_ta: '',
    noi_dung: '',
    anh_dai_dien: '',
    danh_muc_id: '',
    the: '',
  });

  const [formSua, setFormSua] = useState({
    tieu_de: '',
    mo_ta: '',
    noi_dung: '',
    anh_dai_dien: '',
    danh_muc_id: '',
    the: '',
  });

  const [lyDoTuChoi, setLyDoTuChoi] = useState('');
  const [thongBaoLoiModal, setThongBaoLoiModal] = useState('');
  const [dangXuLyModal, setDangXuLyModal] = useState(false);
  const [dangUploadAnh, setDangUploadAnh] = useState(false);

  // Mapping hiển thị Trạng thái
  const TRANG_THAI_MAP: Record<string, { label: string; class: string }> = {
    NHAP: { label: 'Nháp', class: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold' },
    CHO_DUYET: { label: 'Chờ duyệt', class: 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 font-semibold' },
    DA_DUYET: { label: 'Đã duyệt', class: 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-500/20 font-semibold' },
    TU_CHOI: { label: 'Từ chối', class: 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20 font-semibold' },
    DA_XUAT_BAN: { label: 'Đã xuất bản', class: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-semibold' },
    DA_LUU_TRU: { label: 'Đã ẩn', class: 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-500/20 font-semibold' },
  };

  // Kiểm tra quyền khi mount
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
          setDangTaiPage(false);
        } else {
          router.push('/dang-nhap');
        }
      })
      .catch(() => router.push('/dang-nhap'));

    // Tải danh mục bài viết
    fetch(getApiUrl('/api/v1/danh-muc'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhMucList(data.du_lieu);
        }
      })
      .catch(() => {});
  }, [router]);

  // Tải danh sách bài viết quản trị
  const taiDanhSach = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setDangTaiData(true);
    const query = new URLSearchParams();
    query.set('page', trang.toString());
    query.set('limit', '10');
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    if (trangThaiLoc) query.set('trang_thai', trangThaiLoc);
    if (danhMucLoc) query.set('danh_muc_id', danhMucLoc);

    try {
      const res = await fetch(getApiUrl(`/api/v1/bai-viet?${query.toString()}`), {
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
      console.error('Lỗi tải bài viết:', err);
    } finally {
      setDangTaiData(false);
    }
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSach();
    }
  }, [dangTaiPage, trang, trangThaiLoc, danhMucLoc]);

  // Upload Ảnh đại diện
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setDangUploadAnh(true);
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
        if (isEdit) {
          setFormSua((prev) => ({ ...prev, anh_dai_dien: data.du_lieu.url }));
        } else {
          setFormTao((prev) => ({ ...prev, anh_dai_dien: data.du_lieu.url }));
        }
      } else {
        alert(data.message || 'Lỗi tải ảnh lên.');
      }
    } catch (err) {
      alert('Không thể kết nối đến máy chủ upload.');
    } finally {
      setDangUploadAnh(false);
    }
  };

  // Tạo bài viết
  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');
    const tagsArray = formTao.the.split(',').map((t) => t.trim()).filter((t) => t.length > 0);

    try {
      const res = await fetch(getApiUrl('/api/v1/bai-viet'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formTao,
          the: tagsArray,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể tạo bài viết.');
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

  // Sửa bài viết
  const openModalSua = (item: BaiVietItem) => {
    setSelectedItem(item);
    setFormSua({
      tieu_de: item.tieu_de,
      mo_ta: item.mo_ta || '',
      noi_dung: item.noi_dung,
      anh_dai_dien: item.anh_dai_dien || '',
      danh_muc_id: item.danh_muc.id,
      the: item.the ? item.the.map((t) => t.ten).join(', ') : '',
    });
    setThongBaoLoiModal('');
    setShowModalSua(true);
  };

  const submitSua = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');
    const tagsArray = formSua.the.split(',').map((t) => t.trim()).filter((t) => t.length > 0);

    try {
      const res = await fetch(getApiUrl(`/api/v1/bai-viet/${selectedItem.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formSua,
          the: tagsArray,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể sửa bài viết.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể sửa bài viết.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật thành công', 'Bài viết đã được lưu.');
      setShowModalSua(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Gửi duyệt
  const submitGuiDuyet = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/bai-viet/${selectedItem.id}/gui-duyet`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Gửi duyệt thất bại', data.message || 'Không thể gửi duyệt.');
      } else {
        showSuccess('Gửi duyệt thành công', 'Bài viết đang chờ phê duyệt.');
        setShowModalGuiDuyet(false);
        taiDanhSach();
      }
    } catch (e) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Duyệt bài
  const submitDuyet = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/bai-viet/${selectedItem.id}/duyet`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Phê duyệt thất bại', data.message || 'Không thể phê duyệt.');
      } else {
        showSuccess('Phê duyệt thành công', 'Bài viết đã được phê duyệt.');
        setShowModalDuyet(false);
        taiDanhSach();
      }
    } catch (e) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Từ chối bài
  const submitTuChoi = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!lyDoTuChoi.trim()) {
      setThongBaoLoiModal('Vui lòng nhập lý do từ chối.');
      return;
    }
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/bai-viet/${selectedItem.id}/tu-choi`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ ly_do: lyDoTuChoi.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || 'Không thể từ chối.');
        showError('Từ chối thất bại', data.message || 'Không thể từ chối.');
      } else {
        showSuccess('Từ chối thành công', 'Bài viết đã bị từ chối.');
        setShowModalTuChoi(false);
        taiDanhSach();
      }
    } catch (e) {
      setThongBaoLoiModal('Lỗi kết nối.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Xuất bản bài
  const submitXuatBan = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/bai-viet/${selectedItem.id}/xuat-ban`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xuất bản thất bại', data.message || 'Không thể xuất bản bài viết.');
      } else {
        showSuccess('Xuất bản thành công', 'Bài viết đã được xuất bản.');
        setShowModalXuatBan(false);
        taiDanhSach();
      }
    } catch (e) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Ẩn bài
  const submitAn = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/bai-viet/${selectedItem.id}/an`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Thao tác thất bại', data.message || 'Không thể ẩn bài viết.');
      } else {
        showSuccess('Ẩn bài viết thành công', 'Bài viết đã được ẩn.');
        setShowModalAn(false);
        taiDanhSach();
      }
    } catch (e) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Xóa mềm bài
  const submitXoa = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/bai-viet/${selectedItem.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xóa thất bại', data.message || 'Không thể xóa bài viết.');
      } else {
        showSuccess('Xóa thành công', 'Bài viết đã được xóa.');
        setShowModalXoa(false);
        taiDanhSach();
      }
    } catch (e) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  const hasPerm = (p: string) => currentUserPerms.includes(p);

  if (dangTaiPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Đang tải hệ thống quản trị bài viết...
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Quản lý Bài viết & Sự kiện
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">
              TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG
            </p>
          </div>

          {hasPerm('bai_viet_tao') && (
            <button
              onClick={() => {
                setFormTao({
                  tieu_de: '',
                  mo_ta: '',
                  noi_dung: '',
                  anh_dai_dien: '',
                  danh_muc_id: danhMucList[0]?.id || '',
                  the: '',
                });
                setThongBaoLoiModal('');
                setShowModalTao(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start md:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Soạn bài viết mới</span>
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
                placeholder="Tìm kiếm tiêu đề, mô tả..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              />
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
                <option value="NHAP">Nháp</option>
                <option value="CHO_DUYET">Chờ duyệt</option>
                <option value="DA_DUYET">Đã duyệt</option>
                <option value="TU_CHOI">Từ chối</option>
                <option value="DA_XUAT_BAN">Đã xuất bản</option>
                <option value="DA_LUU_TRU">Đã ẩn</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                value={danhMucLoc}
                onChange={(e) => {
                  setDanhMucLoc(e.target.value);
                  setTrang(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              >
                <option value="">Tất cả danh mục</option>
                {danhMucList.map((dm) => (
                  <option key={dm.id} value={dm.id}>
                    {dm.ten}
                  </option>
                ))}
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
            <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách bài viết...</div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {tuKhoa || trangThaiLoc || danhMucLoc ? 'Không tìm thấy bài viết phù hợp.' : 'Chưa có bài viết nào.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">Bài viết</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4">Tác giả</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Lượt xem</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {danhSach.map((item) => {
                    const sttInfo = TRANG_THAI_MAP[item.trang_thai] || {
                      label: item.trang_thai,
                      class: 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-semibold font-semibold',
                    };
                    const isAuthor = item.tac_gia.id === currentUserId;

                    return (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.anh_dai_dien && (
                              <img
                                src={getMediaUrl(item.anh_dai_dien)}
                                alt={item.tieu_de}
                                className="w-12 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800 flex-shrink-0"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">{item.tieu_de}</div>
                              <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                                {new Date(item.ngay_tao).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                            {item.danh_muc.ten}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                          {item.tac_gia.ho_ten}
                          {isAuthor && <span className="ml-1 text-[10px] text-blue-400">(Tôi)</span>}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${sttInfo.class}`}
                          >
                            {sttInfo.label}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-mono">{item.luot_xem}</td>
                        <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                          {/* Sửa: Tác giả hoặc Admin */}
                          {hasPerm('bai_viet_sua') && (isAuthor || hasPerm('bai_viet_duyet')) && (
                            <button
                              title="Sửa bài viết"
                              onClick={() => openModalSua(item)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}

                          {/* Gửi duyệt: Chỉ bài NHÁP của Tác giả */}
                          {item.trang_thai === 'NHAP' && isAuthor && (
                            <button
                              title="Gửi phê duyệt bài viết"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowModalGuiDuyet(true);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 hover:border-amber-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </button>
                          )}

                          {/* Duyệt & Từ chối: Chỉ bài CHỜ DUYỆT & Có quyền bai_viet_duyet */}
                          {item.trang_thai === 'CHO_DUYET' && hasPerm('bai_viet_duyet') && (
                            <>
                              <button
                                title="Phê duyệt bài viết"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowModalDuyet(true);
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                title="Từ chối bài viết"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setLyDoTuChoi('');
                                  setThongBaoLoiModal('');
                                  setShowModalTuChoi(true);
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            </>
                          )}

                          {/* Xuất bản: Bài ĐÃ DUYỆT hoặc ĐÃ ẨN & Quyền bai_viet_xuat_ban */}
                          {(item.trang_thai === 'DA_DUYET' || item.trang_thai === 'DA_LUU_TRU') &&
                            hasPerm('bai_viet_xuat_ban') && (
                              <button
                                title="Xuất bản bài viết công khai"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowModalXuatBan(true);
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7a2 2 0 00-2-2h-1.5a2 2 0 01-2-2v-.935" />
                                </svg>
                              </button>
                            )}

                          {/* Ẩn bài: Bài ĐÃ XUẤT BẢN & Quyền bai_viet_xuat_ban */}
                          {item.trang_thai === 'DA_XUAT_BAN' && hasPerm('bai_viet_xuat_ban') && (
                            <button
                              title="Ẩn bài viết"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowModalAn(true);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.03 10.03 0 013.987-.843c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-3.324-3.324a3 3 0 11-4.243-4.243m4.243 4.243L3 3l18 18" />
                              </svg>
                            </button>
                          )}

                          {/* Xóa mềm */}
                          {hasPerm('bai_viet_xoa') && (
                            <button
                              title="Xóa bài viết"
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
            <div>
              Hiển thị {danhSach.length} / Tổng số {tongSo} bài viết
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={trang <= 1}
                onClick={() => setTrang((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium disabled:opacity-40"
              >
                Trang trước
              </button>
              <span>
                {trang} / {tongSoTrang}
              </span>
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

      {/* MODAL TẠO BÀI VIẾT */}
      {showModalTao && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-4xl w-full p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Soạn thảo bài viết mới</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitTao} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tiêu đề bài viết *</label>
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
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Danh mục *</label>
                  <select
                    required
                    value={formTao.danh_muc_id}
                    onChange={(e) => setFormTao({ ...formTao, danh_muc_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {danhMucList.map((dm) => (
                      <option key={dm.id} value={dm.id}>
                        {dm.ten}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Thẻ (phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={formTao.the}
                    onChange={(e) => setFormTao({ ...formTao, the: e.target.value })}
                    placeholder="Tin tức, Hoạt động..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ảnh đại diện bài viết</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, false)}
                    className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl w-full"
                  />
                  {dangUploadAnh && <span className="text-slate-600 dark:text-slate-400">Đang tải ảnh...</span>}
                </div>
                {formTao.anh_dai_dien && (
                  <img
                    src={getMediaUrl(formTao.anh_dai_dien)}
                    alt="Preview"
                    className="mt-2 h-20 rounded-lg border border-slate-200 dark:border-slate-800 object-cover"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={formTao.mo_ta}
                  onChange={(e) => setFormTao({ ...formTao, mo_ta: e.target.value })}
                  placeholder="Tóm tắt ngắn nội dung..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">Nội dung bài viết *</label>
                <RichTextEditor
                  value={formTao.noi_dung}
                  onChange={(val) => setFormTao({ ...formTao, noi_dung: val })}
                  placeholder="Nhập nội dung bài viết..."
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
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu nháp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA BÀI VIẾT */}
      {showModalSua && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-4xl w-full p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa bài viết</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitSua} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tiêu đề bài viết *</label>
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
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Danh mục *</label>
                  <select
                    required
                    value={formSua.danh_muc_id}
                    onChange={(e) => setFormSua({ ...formSua, danh_muc_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    {danhMucList.map((dm) => (
                      <option key={dm.id} value={dm.id}>
                        {dm.ten}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Thẻ</label>
                  <input
                    type="text"
                    value={formSua.the}
                    onChange={(e) => setFormSua({ ...formSua, the: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ảnh đại diện</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, true)}
                    className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl w-full"
                  />
                </div>
                {formSua.anh_dai_dien && (
                  <img
                    src={getMediaUrl(formSua.anh_dai_dien)}
                    alt="Preview"
                    className="mt-2 h-20 rounded-lg border border-slate-200 dark:border-slate-800 object-cover"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={formSua.mo_ta}
                  onChange={(e) => setFormSua({ ...formSua, mo_ta: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">Nội dung bài viết *</label>
                <RichTextEditor
                  value={formSua.noi_dung}
                  onChange={(val) => setFormSua({ ...formSua, noi_dung: val })}
                  placeholder="Nhập nội dung bài viết..."
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

      {/* MODAL GỬI DUYỆT */}
      {showModalGuiDuyet && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Xác nhận Gửi duyệt</h2>
            <p className="text-xs text-slate-300">
              Bạn có chắc chắn muốn gửi duyệt bài viết <strong className="text-white">{selectedItem.tieu_de}</strong>?
            </p>
            <div className="pt-3 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowModalGuiDuyet(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={submitGuiDuyet}
                disabled={dangXuLyModal}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Gửi duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DUYỆT */}
      {showModalDuyet && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Phê duyệt bài viết</h2>
            <p className="text-xs text-slate-300">
              Bạn có chắc chắn muốn phê duyệt bài viết <strong className="text-white">{selectedItem.tieu_de}</strong>?
            </p>
            <div className="pt-3 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowModalDuyet(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={submitDuyet}
                disabled={dangXuLyModal}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI */}
      {showModalTuChoi && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Từ chối bài viết</h2>
            <p className="text-xs text-slate-300">
              Từ chối bài viết <strong className="text-white">{selectedItem.tieu_de}</strong>. Vui lòng nhập lý do từ
              chối để tác giả chỉnh sửa:
            </p>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitTuChoi} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                value={lyDoTuChoi}
                onChange={(e) => setLyDoTuChoi(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-rose-500 text-xs"
              />
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalTuChoi(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
                >
                  Từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XUẤT BẢN */}
      {showModalXuatBan && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Xuất bản bài viết</h2>
            <p className="text-xs text-slate-300">
              Xuất bản bài viết <strong className="text-white">{selectedItem.tieu_de}</strong> lên Cổng thông tin trường?
            </p>
            <div className="pt-3 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowModalXuatBan(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={submitXuatBan}
                disabled={dangXuLyModal}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                Xuất bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ẨN */}
      {showModalAn && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ẩn bài viết khỏi Cổng thông tin</h2>
            <p className="text-xs text-slate-300">
              Bạn có chắc chắn muốn ẩn bài viết <strong className="text-white">{selectedItem.tieu_de}</strong>?
            </p>
            <div className="pt-3 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowModalAn(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={submitAn}
                disabled={dangXuLyModal}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium"
              >
                Ẩn bài viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedItem?.tieu_de || 'bài viết'}
        isDeleting={dangXuLyModal}
        onClose={() => { setShowModalXoa(false); setSelectedItem(null); }}
        onConfirm={submitXoa}
      />
        </main>
      </div>
    </div>
  );
}