'use client';

import { getApiUrl, getMediaUrl } from '@/lib/api';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface ToChuyenMonItem {
  id: string;
  ten: string;
  truong_to_id?: string;
}

interface GiaoVienItem {
  id: string;
  ho_ten: string;
  anh_dai_dien?: string;
  chuc_vu?: string;
  to_chuyen_mon_id: string;
  trinh_do?: string;
  email?: string;
  so_dien_thoai?: string;
  gioi_thieu?: string;
  trang_thai: boolean;
  to_chuyen_mon: ToChuyenMonItem;
}

export default function TrangQuanTriGiaoVien() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [dangTaiPage, setDangTaiPage] = useState(true);

  const [danhSach, setDanhSach] = useState<GiaoVienItem[]>([]);
  const [toChuyenMonList, setToChuyenMonList] = useState<ToChuyenMonItem[]>([]);
  const [tongSo, setTongSo] = useState(0);
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);

  const [tuKhoa, setTuKhoa] = useState('');
  const [toChuyenMonLoc, setToChuyenMonLoc] = useState('');
  const [trangThaiLoc, setTrangThaiLoc] = useState('');
  const [dangTaiData, setDangTaiData] = useState(false);

  // Modals
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalXem, setShowModalXem] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  const [selectedItem, setSelectedItem] = useState<GiaoVienItem | null>(null);

  const [formTao, setFormTao] = useState({
    ho_ten: '',
    to_chuyen_mon_id: '',
    anh_dai_dien: '',
    chuc_vu: '',
    trinh_do: '',
    email: '',
    so_dien_thoai: '',
    gioi_thieu: '',
    trang_thai: true,
  });

  const [formSua, setFormSua] = useState({
    ho_ten: '',
    to_chuyen_mon_id: '',
    anh_dai_dien: '',
    chuc_vu: '',
    trinh_do: '',
    email: '',
    so_dien_thoai: '',
    gioi_thieu: '',
    trang_thai: true,
  });

  const [thongBaoLoiModal, setThongBaoLoiModal] = useState('');
  const [dangXuLyModal, setDangXuLyModal] = useState(false);
  const [dangUploadAnh, setDangUploadAnh] = useState(false);

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

    fetch(getApiUrl('/api/v1/to-chuyen-mon'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setToChuyenMonList(data.du_lieu);
        }
      })
      .catch(() => {});
  }, [router]);

  const taiDanhSach = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setDangTaiData(true);
    const query = new URLSearchParams();
    query.set('page', trang.toString());
    query.set('limit', '10');
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    if (toChuyenMonLoc) query.set('to_chuyen_mon_id', toChuyenMonLoc);
    if (trangThaiLoc) query.set('trang_thai', trangThaiLoc);

    try {
      const res = await fetch(getApiUrl(`/api/v1/giao-vien?${query.toString()}`), {
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
      console.error('Lỗi tải danh sách giáo viên:', err);
    } finally {
      setDangTaiData(false);
    }
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSach();
    }
  }, [dangTaiPage, trang, toChuyenMonLoc, trangThaiLoc]);

  // Upload ảnh đại diện giáo viên
  const handleUploadAnh = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
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
        showSuccess('Tải lên thành công', 'Ảnh đại diện đã được cập nhật.');
      } else {
        showError('Tải lên thất bại', data.message || 'Lỗi tải ảnh lên hệ thống.');
      }
    } catch (err) {
      showError('Tải lên thất bại', 'Không thể kết nối máy chủ upload ảnh.');
    } finally {
      setDangUploadAnh(false);
    }
  };

  // Tạo giáo viên
  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/giao-vien'), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể tạo hồ sơ giáo viên.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể tạo hồ sơ giáo viên.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Thêm mới thành công', 'Hồ sơ giáo viên mới đã được tạo.');
      setShowModalTao(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Sửa giáo viên
  const openModalSua = (item: GiaoVienItem) => {
    setSelectedItem(item);
    setFormSua({
      ho_ten: item.ho_ten,
      to_chuyen_mon_id: item.to_chuyen_mon_id,
      anh_dai_dien: item.anh_dai_dien || '',
      chuc_vu: item.chuc_vu || '',
      trinh_do: item.trinh_do || '',
      email: item.email || '',
      so_dien_thoai: item.so_dien_thoai || '',
      gioi_thieu: item.gioi_thieu || '',
      trang_thai: item.trang_thai,
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

    try {
      const res = await fetch(getApiUrl(`/api/v1/giao-vien/${selectedItem.id}`), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể cập nhật giáo viên.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể cập nhật giáo viên.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật thành công', 'Hồ sơ giáo viên đã được lưu.');
      setShowModalSua(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Xóa mềm giáo viên
  const submitXoa = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/giao-vien/${selectedItem.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xóa thất bại', data.message || 'Không thể xóa hồ sơ giáo viên.');
      } else {
        showSuccess('Xóa thành công', 'Hồ sơ giáo viên đã được xóa.');
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
        Đang tải hệ thống quản trị giáo viên...
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Giáo viên</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG</p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => router.push('/quan-tri/to-chuyen-mon')}
              className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
            >
              Quản lý Tổ chuyên môn →
            </button>
            {hasPerm('giao_vien_tao') && (
              <button
                onClick={() => {
                  setFormTao({
                    ho_ten: '',
                    to_chuyen_mon_id: toChuyenMonList[0]?.id || '',
                    anh_dai_dien: '',
                    chuc_vu: '',
                    trinh_do: '',
                    email: '',
                    so_dien_thoai: '',
                    gioi_thieu: '',
                    trang_thai: true,
                  });
                  setThongBaoLoiModal('');
                  setShowModalTao(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#E97036] hover:bg-[#D85F25] active:bg-[#C94F1D] text-white font-semibold text-xs transition-colors duration-200 shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Thêm giáo viên</span>
              </button>
            )}
          </div>
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
            <div className="sm:col-span-5">
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm kiếm họ tên, chức vụ, môn dạy, email..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={toChuyenMonLoc}
                onChange={(e) => {
                  setToChuyenMonLoc(e.target.value);
                  setTrang(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#E97036] focus:ring-2 focus:ring-[#E97036]/20 font-medium text-xs transition-colors"
              >
                <option value="">Tất cả tổ chuyên môn</option>
                {toChuyenMonList.map((tcm) => (
                  <option key={tcm.id} value={tcm.id}>
                    {tcm.ten}
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
                <option value="true">Đang công tác</option>
                <option value="false">Tạm ẩn / Đã chuyển</option>
              </select>
            </div>
            <div className="sm:col-span-2">
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
            <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách giáo viên...</div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {tuKhoa || toChuyenMonLoc || trangThaiLoc
                ? 'Không tìm thấy giáo viên phù hợp.'
                : 'Chưa có thông tin giáo viên nào trong hệ thống.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">Giáo viên</th>
                    <th className="p-4">Tổ chuyên môn</th>
                    <th className="p-4">Chức vụ</th>
                    <th className="p-4">Trình độ</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Số điện thoại</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {danhSach.map((item) => {
                    const isLeader = item.to_chuyen_mon?.truong_to_id === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.anh_dai_dien ? (
                              <img
                                src={getMediaUrl(item.anh_dai_dien)}
                                alt={item.ho_ten}
                                className="w-9 h-9 rounded-full object-cover border border-slate-700"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-300 dark:border-slate-700">
                                {item.ho_ten.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <span>{item.ho_ten}</span>
                                {isLeader && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[10px] font-semibold">
                                    Tổ trưởng
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-900 dark:text-slate-200">
                          {item.to_chuyen_mon?.ten}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{item.chuc_vu || '-'}</td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{item.trinh_do || '-'}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{item.email || '-'}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{item.so_dien_thoai || '-'}</td>
                        <td className="p-4">
                          {item.trang_thai ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 text-[11px] font-semibold">
                              Đang công tác
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-500/20 text-[11px] font-semibold">
                              Tạm ẩn
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                          {/* Xem */}
                          <button
                            title="Xem chi tiết"
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
                          {hasPerm('giao_vien_sua') && (
                            <button
                              title="Sửa thông tin"
                              onClick={() => openModalSua(item)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}

                          {/* Xóa */}
                          {hasPerm('giao_vien_xoa') && (
                            <button
                              title="Xóa giáo viên"
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
            <div>Hiển thị {danhSach.length} / Tổng số {tongSo} giáo viên</div>
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

      {/* MODAL TẠO GIÁO VIÊN */}
      {showModalTao && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-xl w-full p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thêm hồ sơ giáo viên mới</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitTao} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Họ và tên giáo viên *</label>
                  <input
                    type="text"
                    required
                    value={formTao.ho_ten}
                    onChange={(e) => setFormTao({ ...formTao, ho_ten: e.target.value })}
                    placeholder="Vd: Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tổ chuyên môn *</label>
                  <select
                    required
                    value={formTao.to_chuyen_mon_id}
                    onChange={(e) => setFormTao({ ...formTao, to_chuyen_mon_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Chọn tổ chuyên môn --</option>
                    {toChuyenMonList.map((tcm) => (
                      <option key={tcm.id} value={tcm.id}>
                        {tcm.ten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Chức vụ / Bộ môn</label>
                  <input
                    type="text"
                    value={formTao.chuc_vu}
                    onChange={(e) => setFormTao({ ...formTao, chuc_vu: e.target.value })}
                    placeholder="Vd: Giáo viên Toán - Tin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Trình độ chuyên môn</label>
                  <input
                    type="text"
                    value={formTao.trinh_do}
                    onChange={(e) => setFormTao({ ...formTao, trinh_do: e.target.value })}
                    placeholder="Vd: Cử nhân Sư phạm Toán"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={formTao.email}
                    onChange={(e) => setFormTao({ ...formTao, email: e.target.value })}
                    placeholder="giaovien@dongquang.edu.vn"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Số điện thoại</label>
                  <input
                    type="text"
                    value={formTao.so_dien_thoai}
                    onChange={(e) => setFormTao({ ...formTao, so_dien_thoai: e.target.value })}
                    placeholder="0988xxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ảnh đại diện (Upload tệp hoặc Nhập URL)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadAnh(e, false)}
                      className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl flex-1"
                    />
                    {dangUploadAnh && <span className="text-slate-600 dark:text-slate-400 font-medium">Đang tải tệp...</span>}
                  </div>
                  <input
                    type="text"
                    value={formTao.anh_dai_dien}
                    onChange={(e) => setFormTao({ ...formTao, anh_dai_dien: e.target.value })}
                    placeholder="Hoặc dán đường dẫn URL ảnh (vd: /uploads/abc.png hoặc http://...)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500 text-xs font-mono"
                  />
                </div>
                {formTao.anh_dai_dien && (
                  <div className="mt-2.5 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={getMediaUrl(formTao.anh_dai_dien)}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                    />
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">✓ Ảnh đã chọn/tải lên thành công</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Giới thiệu ngắn / Quá trình công tác</label>
                <textarea
                  rows={3}
                  value={formTao.gioi_thieu}
                  onChange={(e) => setFormTao({ ...formTao, gioi_thieu: e.target.value })}
                  placeholder="Quá trình công tác, thành tích giảng dạy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA GIÁO VIÊN */}
      {showModalSua && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-xl w-full p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa hồ sơ giáo viên</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitSua} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formSua.ho_ten}
                    onChange={(e) => setFormSua({ ...formSua, ho_ten: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tổ chuyên môn *</label>
                  <select
                    required
                    value={formSua.to_chuyen_mon_id}
                    onChange={(e) => setFormSua({ ...formSua, to_chuyen_mon_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    {toChuyenMonList.map((tcm) => (
                      <option key={tcm.id} value={tcm.id}>
                        {tcm.ten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Chức vụ</label>
                  <input
                    type="text"
                    value={formSua.chuc_vu}
                    onChange={(e) => setFormSua({ ...formSua, chuc_vu: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Trình độ chuyên môn</label>
                  <input
                    type="text"
                    value={formSua.trinh_do}
                    onChange={(e) => setFormSua({ ...formSua, trinh_do: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={formSua.email}
                    onChange={(e) => setFormSua({ ...formSua, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Số điện thoại</label>
                  <input
                    type="text"
                    value={formSua.so_dien_thoai}
                    onChange={(e) => setFormSua({ ...formSua, so_dien_thoai: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Thay đổi ảnh đại diện (Upload tệp hoặc Nhập URL)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadAnh(e, true)}
                      className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl flex-1"
                    />
                    {dangUploadAnh && <span className="text-slate-600 dark:text-slate-400 font-medium">Đang tải tệp...</span>}
                  </div>
                  <input
                    type="text"
                    value={formSua.anh_dai_dien}
                    onChange={(e) => setFormSua({ ...formSua, anh_dai_dien: e.target.value })}
                    placeholder="Hoặc dán đường dẫn URL ảnh (vd: /uploads/abc.png hoặc http://...)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500 text-xs font-mono"
                  />
                </div>
                {formSua.anh_dai_dien && (
                  <div className="mt-2.5 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={getMediaUrl(formSua.anh_dai_dien)}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                    />
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">✓ Ảnh đã chọn/tải lên thành công</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Giới thiệu ngắn</label>
                <textarea
                  rows={3}
                  value={formSua.gioi_thieu}
                  onChange={(e) => setFormSua({ ...formSua, gioi_thieu: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
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

      {/* MODAL XEM CHI TIẾT */}
      {showModalXem && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              {selectedItem.anh_dai_dien ? (
                <img src={getMediaUrl(selectedItem.anh_dai_dien)} alt={selectedItem.ho_ten} className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-lg border border-slate-300 dark:border-slate-700">
                  {selectedItem.ho_ten.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedItem.ho_ten}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{selectedItem.to_chuyen_mon?.ten}</p>
              </div>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <div>Chức vụ: <strong className="text-slate-900 dark:text-white">{selectedItem.chuc_vu || 'Chưa cập nhật'}</strong></div>
              <div>Trình độ: <strong className="text-slate-900 dark:text-white">{selectedItem.trinh_do || 'Chưa cập nhật'}</strong></div>
              <div>Email: <strong className="text-slate-900 dark:text-white">{selectedItem.email || 'Chưa cập nhật'}</strong></div>
              <div>Số điện thoại: <strong className="text-slate-900 dark:text-white">{selectedItem.so_dien_thoai || 'Chưa cập nhật'}</strong></div>
              {selectedItem.gioi_thieu && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-2 text-slate-700 dark:text-slate-300">
                  {selectedItem.gioi_thieu}
                </div>
              )}
            </div>
            <div className="pt-3 flex justify-end">
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

      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedItem?.ho_ten || 'giáo viên này'}
        isDeleting={dangXuLyModal}
        onClose={() => { setShowModalXoa(false); setSelectedItem(null); }}
        onConfirm={submitXoa}
      />
        </main>
      </div>
    </div>
  );
}