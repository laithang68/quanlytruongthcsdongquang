'use client';

import { getApiUrl, getMediaUrl } from '@/lib/api';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface TruyCapNhanhItem {
  id: string;
  ten: string;
  anh: string;
  url: string;
  thu_tu: number;
  trang_thai: boolean;
  ngay_tao?: string;
}

export default function TrangQuanTriTruyCapNhanh() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [dangTaiPage, setDangTaiPage] = useState(true);

  const [danhSach, setDanhSach] = useState<TruyCapNhanhItem[]>([]);
  const [dangTaiData, setDangTaiData] = useState(false);

  // Modals
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  const [selectedItem, setSelectedItem] = useState<TruyCapNhanhItem | null>(null);

  const [formTao, setFormTao] = useState({
    ten: '',
    anh: '',
    url: '',
    thu_tu: 0,
    trang_thai: true,
  });

  const [formSua, setFormSua] = useState({
    ten: '',
    anh: '',
    url: '',
    thu_tu: 0,
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
  }, [router]);

  const taiDanhSach = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setDangTaiData(true);
    try {
      const res = await fetch(getApiUrl('/api/v1/truy-cap-nhanh'), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSach(data.du_lieu);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách truy cập nhanh:', err);
    } finally {
      setDangTaiData(false);
    }
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSach();
    }
  }, [dangTaiPage]);

  // Upload hình ảnh banner
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
          setFormSua((prev) => ({ ...prev, anh: data.du_lieu.url }));
        } else {
          setFormTao((prev) => ({ ...prev, anh: data.du_lieu.url }));
        }
        showSuccess('Tải lên thành công', 'Ảnh banner đã được tải lên máy chủ.');
      } else {
        showError('Tải lên thất bại', data.message || 'Lỗi khi tải tệp ảnh lên.');
      }
    } catch (err) {
      showError('Tải lên thất bại', 'Không thể kết nối máy chủ tải ảnh.');
    } finally {
      setDangUploadAnh(false);
    }
  };

  // Tạo liên kết mới
  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/truy-cap-nhanh'), {
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
        setThongBaoLoiModal(data.message || 'Không thể tạo liên kết truy cập nhanh.');
        showError('Thao tác thất bại', data.message || 'Không thể tạo liên kết truy cập nhanh.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Thêm mới thành công', 'Liên kết banner truy cập nhanh đã được tạo.');
      setShowModalTao(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Mở modal sửa
  const openModalSua = (item: TruyCapNhanhItem) => {
    setSelectedItem(item);
    setFormSua({
      ten: item.ten,
      anh: item.anh,
      url: item.url,
      thu_tu: item.thu_tu,
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
      const res = await fetch(getApiUrl(`/api/v1/truy-cap-nhanh/${selectedItem.id}`), {
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
        setThongBaoLoiModal(data.message || 'Không thể cập nhật liên kết.');
        showError('Thao tác thất bại', data.message || 'Không thể cập nhật liên kết.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật thành công', 'Liên kết banner đã được lưu.');
      setShowModalSua(false);
      taiDanhSach();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Xóa liên kết
  const submitXoa = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/truy-cap-nhanh/${selectedItem.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xóa thất bại', data.message || 'Không thể xóa liên kết.');
      } else {
        showSuccess('Xóa thành công', 'Liên kết banner đã được xóa.');
        setShowModalXoa(false);
        taiDanhSach();
      }
    } catch (err) {
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  if (dangTaiPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Đang tải hệ thống quản trị...
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/quan-tri')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  ← Tổng quan
                </button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Truy cập nhanh</h1>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">
                Banner liên kết nhanh hiển thị tại Sidebar bên phải Trang chủ (ngay dưới Tổ chuyên môn)
              </p>
            </div>

            <div>
              <button
                onClick={() => {
                  setFormTao({
                    ten: '',
                    anh: '',
                    url: '',
                    thu_tu: (danhSach.length + 1),
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
                <span>Thêm banner mới</span>
              </button>
            </div>
          </div>

          {/* Bảng danh sách Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors rounded-2xl overflow-hidden shadow-xl">
            {dangTaiData ? (
              <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách banner...</div>
            ) : danhSach.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Chưa có liên kết banner nào trong hệ thống.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                    <tr>
                      <th className="p-4">Thứ tự</th>
                      <th className="p-4">Hình ảnh banner</th>
                      <th className="p-4">Tên liên kết</th>
                      <th className="p-4">Đường dẫn URL</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {danhSach.map((item) => (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          #{item.thu_tu}
                        </td>
                        <td className="p-4">
                          <div className="w-36 h-9 rounded-lg overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <img
                              src={getMediaUrl(item.anh)}
                              alt={item.ten}
                              className="w-full h-full object-cover object-left block"
                              style={{ objectPosition: 'left center' }}
                            />
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {item.ten}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{item.url}</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        </td>
                        <td className="p-4">
                          {item.trang_thai ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 text-[11px] font-semibold">
                              Hiển thị
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-500/20 text-[11px] font-semibold">
                              Tạm ẩn
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                          {/* Sửa */}
                          <button
                            title="Sửa banner"
                            onClick={() => openModalSua(item)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Xóa */}
                          <button
                            title="Xóa banner"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowModalXoa(true);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* MODAL TẠO BANNER */}
          {showModalTao && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-xl w-full p-6 space-y-4 my-8">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thêm Banner Truy cập nhanh</h2>
                {thongBaoLoiModal && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                    {thongBaoLoiModal}
                  </div>
                )}
                <form onSubmit={submitTao} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tên liên kết / Banner *</label>
                    <input
                      type="text"
                      required
                      value={formTao.ten}
                      onChange={(e) => setFormTao({ ...formTao, ten: e.target.value })}
                      placeholder="Vd: Cổng Dịch vụ công Quốc gia"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E97036]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Đường dẫn URL liên kết *</label>
                    <input
                      type="url"
                      required
                      value={formTao.url}
                      onChange={(e) => setFormTao({ ...formTao, url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E97036] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Hình ảnh Banner (Tỷ lệ 4:1) *</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadAnh(e, false)}
                          className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl flex-1"
                        />
                        {dangUploadAnh && <span className="text-slate-600 dark:text-slate-400 font-medium">Đang tải ảnh...</span>}
                      </div>
                      <input
                        type="text"
                        required
                        value={formTao.anh}
                        onChange={(e) => setFormTao({ ...formTao, anh: e.target.value })}
                        placeholder="Hoặc dán URL ảnh banner (/uploads/... hoặc https://...)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E97036] font-mono"
                      />
                    </div>
                    {formTao.anh && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium">Xem trước khung banner (tỷ lệ chuẩn 4:1):</span>
                        <div className="w-full max-w-sm aspect-[4/1] bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                          <img
                            src={getMediaUrl(formTao.anh)}
                            alt="Xem trước"
                            className="w-full h-full object-fill block"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Thứ tự hiển thị</label>
                      <input
                        type="number"
                        min="0"
                        value={formTao.thu_tu}
                        onChange={(e) => setFormTao({ ...formTao, thu_tu: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036]"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="tao_trang_thai"
                        checked={formTao.trang_thai}
                        onChange={(e) => setFormTao({ ...formTao, trang_thai: e.target.checked })}
                        className="w-4 h-4 text-[#E97036] rounded border-slate-300 dark:border-slate-700 focus:ring-[#E97036]"
                      />
                      <label htmlFor="tao_trang_thai" className="text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                        Hiển thị trên website
                      </label>
                    </div>
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
                      className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#D85F25] text-white font-semibold disabled:opacity-50 transition"
                    >
                      {dangXuLyModal ? 'Đang lưu...' : 'Lưu banner'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL SỬA BANNER */}
          {showModalSua && selectedItem && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-xl w-full p-6 space-y-4 my-8">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa Banner Truy cập nhanh</h2>
                {thongBaoLoiModal && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                    {thongBaoLoiModal}
                  </div>
                )}
                <form onSubmit={submitSua} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tên liên kết / Banner *</label>
                    <input
                      type="text"
                      required
                      value={formSua.ten}
                      onChange={(e) => setFormSua({ ...formSua, ten: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Đường dẫn URL liên kết *</label>
                    <input
                      type="url"
                      required
                      value={formSua.url}
                      onChange={(e) => setFormSua({ ...formSua, url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Hình ảnh Banner (Tỷ lệ 4:1) *</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadAnh(e, true)}
                          className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl flex-1"
                        />
                        {dangUploadAnh && <span className="text-slate-600 dark:text-slate-400 font-medium">Đang tải ảnh...</span>}
                      </div>
                      <input
                        type="text"
                        required
                        value={formSua.anh}
                        onChange={(e) => setFormSua({ ...formSua, anh: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036] font-mono"
                      />
                    </div>
                    {formSua.anh && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium">Xem trước khung banner (tỷ lệ chuẩn 4:1):</span>
                        <div className="w-full max-w-sm aspect-[4/1] bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                          <img
                            src={getMediaUrl(formSua.anh)}
                            alt="Xem trước"
                            className="w-full h-full object-fill block"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Thứ tự hiển thị</label>
                      <input
                        type="number"
                        min="0"
                        value={formSua.thu_tu}
                        onChange={(e) => setFormSua({ ...formSua, thu_tu: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036]"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="sua_trang_thai"
                        checked={formSua.trang_thai}
                        onChange={(e) => setFormSua({ ...formSua, trang_thai: e.target.checked })}
                        className="w-4 h-4 text-[#E97036] rounded border-slate-300 dark:border-slate-700 focus:ring-[#E97036]"
                      />
                      <label htmlFor="sua_trang_thai" className="text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                        Hiển thị trên website
                      </label>
                    </div>
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
                      className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#D85F25] text-white font-semibold disabled:opacity-50 transition"
                    >
                      {dangXuLyModal ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL XÓA */}
          <ConfirmDeleteModal
            isOpen={showModalXoa}
            itemName={selectedItem?.ten || 'banner này'}
            isDeleting={dangXuLyModal}
            onClose={() => { setShowModalXoa(false); setSelectedItem(null); }}
            onConfirm={submitXoa}
          />
        </main>
      </div>
    </div>
  );
}
