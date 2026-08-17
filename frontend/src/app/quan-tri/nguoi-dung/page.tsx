'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { getApiUrl } from '@/lib/api';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface VaiTroItem {
  id: string;
  ma: string;
  ten: string;
}

interface NguoiDungItem {
  id: string;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string;
  trang_thai: boolean;
  lan_dang_nhap_cuoi?: string;
  da_xoa: boolean;
  ngay_tao: string;
  vai_tro: VaiTroItem[];
}

export default function TrangQuanTriNguoiDung() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // State thông tin người dùng đăng nhập & danh sách quyền
  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [dangTaiPage, setDangTaiPage] = useState(true);

  // State danh sách & bộ lọc
  const [danhSach, setDanhSach] = useState<NguoiDungItem[]>([]);
  const [tongSo, setTongSo] = useState(0);
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThaiLoc, setTrangThaiLoc] = useState('');
  const [vaiTroLoc, setVaiTroLoc] = useState('');
  const [dangTaiData, setDangTaiData] = useState(false);

  // State Hộp thoại / Modals
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalKhoa, setShowModalKhoa] = useState(false);
  const [showModalDatLaiMatKhau, setShowModalDatLaiMatKhau] = useState(false);
  const [showModalGanVaiTro, setShowModalGanVaiTro] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  const [selectedUser, setSelectedUser] = useState<NguoiDungItem | null>(null);

  // Form State
  const [formTao, setFormTao] = useState({
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    mat_khau: '',
    vai_tro: ['NGUOI_XEM'],
  });

  const [formSua, setFormSua] = useState({
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
  });

  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const [thongBaoLoiModal, setThongBaoLoiModal] = useState('');
  const [dangXuLyModal, setDangXuLyModal] = useState(false);

  const ALL_ROLES = [
    { ma: 'SUPER_ADMIN', ten: 'Quản trị tối cao' },
    { ma: 'QUAN_TRI_VIEN', ten: 'Quản trị viên' },
    { ma: 'BAN_GIAM_HIEU', ten: 'Ban giám hiệu' },
    { ma: 'GIAO_VIEN', ten: 'Giáo viên' },
    { ma: 'BIEN_TAP_VIEN', ten: 'Biên tập viên' },
    { ma: 'NGUOI_XEM', ten: 'Người xem' },
  ];

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
      .catch(() => {
        router.push('/dang-nhap');
      });
  }, [router]);

  // Tải danh sách người dùng
  const taiDanhSach = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setDangTaiData(true);
    const query = new URLSearchParams();
    query.set('page', trang.toString());
    query.set('limit', '10');
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    if (trangThaiLoc) query.set('trang_thai', trangThaiLoc);
    if (vaiTroLoc) query.set('vai_tro', vaiTroLoc);

    try {
      const res = await fetch(getApiUrl(`/api/v1/nguoi-dung?${query.toString()}`), {
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
      console.error('Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setDangTaiData(false);
    }
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSach();
    }
  }, [dangTaiPage, trang, trangThaiLoc, vaiTroLoc]);

  const xuLyTimKiem = (e: FormEvent) => {
    e.preventDefault();
    setTrang(1);
    taiDanhSach();
  };

  // Handlers cho Tạo người dùng
  const submitTaoNguoiDung = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl('/api/v1/nguoi-dung'), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể tạo người dùng.');
        setDangXuLyModal(false);
        return;
      }

      setShowModalTao(false);
      setFormTao({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: ['NGUOI_XEM'] });
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Handlers cho Sửa người dùng
  const openModalSua = (u: NguoiDungItem) => {
    setSelectedUser(u);
    setFormSua({ ho_ten: u.ho_ten, email: u.email, so_dien_thoai: u.so_dien_thoai || '' });
    setThongBaoLoiModal('');
    setShowModalSua(true);
  };

  const submitSuaNguoiDung = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/nguoi-dung/${selectedUser.id}`), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể cập nhật người dùng.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể cập nhật người dùng.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật thành công', 'Thông tin người dùng đã được lưu.');
      setShowModalSua(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Handlers cho Khóa / Mở khóa
  const openModalKhoa = (u: NguoiDungItem) => {
    setSelectedUser(u);
    setThongBaoLoiModal('');
    setShowModalKhoa(true);
  };

  const submitKhoaOrMoKhoa = async () => {
    if (!selectedUser) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');
    const endpoint = selectedUser.trang_thai ? 'khoa' : 'mo-khoa';

    try {
      const res = await fetch(getApiUrl(`/api/v1/nguoi-dung/${selectedUser.id}/${endpoint}`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể thay đổi trạng thái.');
        showError('Thao tác thất bại', data.message || data.thong_bao);
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật trạng thái thành công', data.thong_bao || data.message);
      setShowModalKhoa(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Handlers cho Đặt lại mật khẩu
  const openModalDatLaiMatKhau = (u: NguoiDungItem) => {
    setSelectedUser(u);
    setMatKhauMoi('');
    setThongBaoLoiModal('');
    setShowModalDatLaiMatKhau(true);
  };

  const submitDatLaiMatKhau = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/nguoi-dung/${selectedUser.id}/dat-lai-mat-khau`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ mat_khau_moi: matKhauMoi }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể đặt lại mật khẩu.');
        showError('Thao tác thất bại', data.message || data.thong_bao);
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật mật khẩu thành công', 'Mật khẩu mới đã được khởi tạo.');
      setShowModalDatLaiMatKhau(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Handlers cho Gán vai trò
  const openModalGanVaiTro = (u: NguoiDungItem) => {
    setSelectedUser(u);
    setSelectedRoles(u.vai_tro.map((r) => r.ma));
    setThongBaoLoiModal('');
    setShowModalGanVaiTro(true);
  };

  const submitGanVaiTro = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/nguoi-dung/${selectedUser.id}/vai-tro`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ vai_tro: selectedRoles }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể gán vai trò.');
        showError('Thao tác thất bại', data.message || data.thong_bao);
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Phân quyền thành công', 'Vai trò người dùng đã được cập nhật.');
      setShowModalGanVaiTro(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Handlers cho Xóa mềm
  const openModalXoa = (u: NguoiDungItem) => {
    setSelectedUser(u);
    setThongBaoLoiModal('');
    setShowModalXoa(true);
  };

  const submitXoaMem = async () => {
    if (!selectedUser) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl(`/api/v1/nguoi-dung/${selectedUser.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể xóa người dùng.');
        showError('Xóa thất bại', data.message || data.thong_bao || 'Không thể xóa người dùng.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Xóa thành công', 'Tài khoản người dùng đã được xóa.');
      setShowModalXoa(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  const hasPerm = (perm: string) => currentUserPerms.includes(perm);

  if (dangTaiPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Đang tải thông tin hệ thống...
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
                Quản lý Người dùng & Tài khoản
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">
              TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG
            </p>
          </div>

          {hasPerm('nguoi_dung_tao') && (
            <button
              onClick={() => {
                setFormTao({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: ['NGUOI_XEM'] });
                setThongBaoLoiModal('');
                setShowModalTao(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start md:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Tạo người dùng mới</span>
            </button>
          )}
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-4 shadow-xl">
          <form onSubmit={xuLyTimKiem} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm kiếm họ tên, email, số điện thoại..."
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
                <option value="true">Đang hoạt động</option>
                <option value="false">Đang bị khóa</option>
                <option value="da_xoa">Đã xóa mềm</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                value={vaiTroLoc}
                onChange={(e) => {
                  setVaiTroLoc(e.target.value);
                  setTrang(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              >
                <option value="">Tất cả vai trò</option>
                {ALL_ROLES.map((r) => (
                  <option key={r.ma} value={r.ma}>
                    {r.ten}
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

        {/* User Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl overflow-hidden shadow-xl">
          {dangTaiData ? (
            <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách người dùng...</div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {tuKhoa || trangThaiLoc || vaiTroLoc ? 'Không tìm thấy người dùng phù hợp.' : 'Chưa có người dùng nào.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Email / SĐT</th>
                    <th className="p-4">Vai trò</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Đăng nhập cuối</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {danhSach.map((u) => (
                    <tr key={u.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">
                        {u.ho_ten}
                        {u.id === currentUserId && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 text-[10px] font-semibold">
                            Bạn
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{u.email}</div>
                        <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">{u.so_dien_thoai || 'Chưa cập nhật'}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {u.vai_tro.map((r) => (
                            <span
                              key={r.ma}
                              className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-[11px] font-semibold"
                            >
                              {r.ten}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        {u.da_xoa ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20 font-semibold">
                            Đã xóa mềm
                          </span>
                        ) : u.trang_thai ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-semibold">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 font-semibold">
                            Bị khóa
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                        {u.lan_dang_nhap_cuoi
                          ? new Date(u.lan_dang_nhap_cuoi).toLocaleString('vi-VN')
                          : 'Chưa từng'}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                          {/* Sửa */}
                          {hasPerm('nguoi_dung_sua') && !u.da_xoa && (
                            <button
                              title="Sửa thông tin người dùng"
                              onClick={() => openModalSua(u)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}

                          {/* Khóa / Mở khóa */}
                          {hasPerm('nguoi_dung_khoa') && !u.da_xoa && (
                            <button
                              title={u.trang_thai ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                              onClick={() => openModalKhoa(u)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors shadow-sm focus-visible:ring-2 ${u.trang_thai ? "text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 hover:border-amber-200 focus-visible:ring-amber-500" : "text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 hover:border-emerald-200 focus-visible:ring-emerald-500"}`}
                            >
                              {u.trang_thai ? (
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

                          {/* Vai trò */}
                          {hasPerm('nguoi_dung_gan_vai_tro') && !u.da_xoa && (
                            <button
                              title="Phân quyền vai trò"
                              onClick={() => openModalGanVaiTro(u)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-600 hover:border-purple-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-purple-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </button>
                          )}

                          {/* Mật khẩu */}
                          {hasPerm('nguoi_dung_dat_lai_mat_khau') && !u.da_xoa && (
                            <button
                              title="Đặt lại mật khẩu"
                              onClick={() => openModalDatLaiMatKhau(u)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:text-cyan-600 hover:border-cyan-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
                              </svg>
                            </button>
                          )}

                          {/* Xóa */}
                          {hasPerm('nguoi_dung_xoa') && !u.da_xoa && (
                            <button
                              title="Xóa tài khoản người dùng"
                              onClick={() => openModalXoa(u)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
            <div>
              Hiển thị {danhSach.length} / Tổng số {tongSo} người dùng
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={trang <= 1}
                onClick={() => setTrang((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trang trước
              </button>
              <span>
                {trang} / {tongSoTrang}
              </span>
              <button
                disabled={trang >= tongSoTrang}
                onClick={() => setTrang((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>

      {/* MODAL TẠO NGUỜI DÙNG */}
      {showModalTao && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tạo tài khoản người dùng mới</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitTaoNguoiDung} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formTao.ho_ten}
                  onChange={(e) => setFormTao({ ...formTao, ho_ten: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Địa chỉ Email *</label>
                <input
                  type="email"
                  required
                  value={formTao.email}
                  onChange={(e) => setFormTao({ ...formTao, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Số điện thoại</label>
                <input
                  type="text"
                  value={formTao.so_dien_thoai}
                  onChange={(e) => setFormTao({ ...formTao, so_dien_thoai: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  value={formTao.mat_khau}
                  onChange={(e) => setFormTao({ ...formTao, mat_khau: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Vai trò ban đầu</label>
                <select
                  value={formTao.vai_tro[0]}
                  onChange={(e) => setFormTao({ ...formTao, vai_tro: [e.target.value] })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r.ma} value={r.ma}>
                      {r.ten}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalTao(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang tạo...' : 'Tạo người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA NGUỜI DÙNG */}
      {showModalSua && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa thông tin người dùng</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitSuaNguoiDung} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formSua.ho_ten}
                  onChange={(e) => setFormSua({ ...formSua, ho_ten: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Địa chỉ Email *</label>
                <input
                  type="email"
                  required
                  value={formSua.email}
                  onChange={(e) => setFormSua({ ...formSua, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Số điện thoại</label>
                <input
                  type="text"
                  value={formSua.so_dien_thoai}
                  onChange={(e) => setFormSua({ ...formSua, so_dien_thoai: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalSua(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
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

      {/* MODAL KHÓA / MỞ KHÓA */}
      {showModalKhoa && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Xác nhận {selectedUser.trang_thai ? 'Khóa' : 'Mở khóa'} tài khoản
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn {selectedUser.trang_thai ? 'khóa' : 'mở khóa'} tài khoản{' '}
              <strong className="text-slate-900 dark:text-white">{selectedUser.ho_ten}</strong> ({selectedUser.email})?
            </p>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <div className="pt-3 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowModalKhoa(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
              >
                Hủy
              </button>
              <button
                onClick={submitKhoaOrMoKhoa}
                disabled={dangXuLyModal}
                className={`px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50 ${
                  selectedUser.trang_thai ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {dangXuLyModal ? 'Đang xử lý...' : selectedUser.trang_thai ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐẶT LẠI MẬT KHẨU */}
      {showModalDatLaiMatKhau && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Đặt lại mật khẩu</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Đặt lại mật khẩu cho tài khoản <strong className="text-slate-900 dark:text-white">{selectedUser.ho_ten}</strong> (
              {selectedUser.email}).
            </p>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitDatLaiMatKhau} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  value={matKhauMoi}
                  onChange={(e) => setMatKhauMoi(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalDatLaiMatKhau(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GÁN VAI TRÒ */}
      {showModalGanVaiTro && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gán vai trò người dùng</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Chọn danh sách vai trò gán cho <strong className="text-slate-900 dark:text-white">{selectedUser.ho_ten}</strong>:
            </p>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitGanVaiTro} className="space-y-3 text-xs">
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950">
                {ALL_ROLES.map((r) => (
                  <label key={r.ma} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(r.ma)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles([...selectedRoles, r.ma]);
                        } else {
                          setSelectedRoles(selectedRoles.filter((code) => code !== r.ma));
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{r.ten}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">({r.ma})</span>
                  </label>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalGanVaiTro(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu vai trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedUser?.ho_ten || 'tài khoản người dùng'}
        isDeleting={dangXuLyModal}
        onClose={() => {
          setShowModalXoa(false);
          setSelectedUser(null);
        }}
        onConfirm={submitXoaMem}
      />
        </main>
      </div>
    </div>
  );
}