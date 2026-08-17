'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { getApiUrl, getMediaUrl } from '@/lib/api';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface AlbumItem {
  id: string;
  ten: string;
  slug: string;
  mo_ta?: string;
  anh_dai_dien?: string;
  so_luong_anh: number;
  danh_sach_anh?: { id: string; url: string; ten_goc?: string }[];
  trang_thai: boolean;
  ngay_tao: string;
}

export default function QuanTriThuVienAnh() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [danhSach, setDanhSach] = useState<AlbumItem[]>([]);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [dangTai, setDangTai] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AlbumItem | null>(null);
  const [ten, setTen] = useState('');
  const [moTa, setMoTa] = useState('');
  const [anhDaiDien, setAnhDaiDien] = useState('');
  const [trangThai, setTrangThai] = useState(true);
  const [tepTinIds, setTepTinIds] = useState<string[]>([]);
  const [danhSachAnhUpload, setDanhSachAnhUpload] = useState<{ id: string; url: string; ten_goc?: string }[]>([]);
  const [dangUploadMultiple, setDangUploadMultiple] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [dangUploadCover, setDangUploadCover] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const { showSuccess, showError } = useToast();

  // Delete Modal
  const [albumCanXoa, setAlbumCanXoa] = useState<AlbumItem | null>(null);
  const [dangXoaAlbum, setDangXoaAlbum] = useState(false);

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setDangUploadCover(true);
    const token = getToken();

    try {
      const res = await fetch(getApiUrl('/api/v1/tep-tin/upload'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setAnhDaiDien(data.du_lieu.url);
        showSuccess('Tải lên thành công', 'Ảnh bìa album đã được cập nhật.');
      } else {
        showError('Tải lên thất bại', data.message || 'Lỗi tải ảnh bìa album.');
      }
    } catch (err) {
      showError('Tải lên thất bại', 'Không thể kết nối máy chủ upload.');
    } finally {
      setDangUploadCover(false);
    }
  };

  const handleUploadMultiplePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setDangUploadMultiple(true);
    const token = getToken();
    const uploaded: { id: string; url: string; ten_goc?: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(getApiUrl('/api/v1/tep-tin/upload'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: formData,
        });
        const data = await res.json();
        if (data.thanh_cong) {
          uploaded.push(data.du_lieu);
        }
      } catch (err) {}
    }

    if (uploaded.length > 0) {
      setDanhSachAnhUpload((prev) => [...prev, ...uploaded]);
      setTepTinIds((prev) => [...prev, ...uploaded.map((u) => u.id)]);
      if (!anhDaiDien) {
        setAnhDaiDien(uploaded[0].url);
      }
    }
    setDangUploadMultiple(false);
  };

  useEffect(() => {
    const token = getToken();
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
        if (data.thanh_cong) setCurrentUser(data.du_lieu);
        else router.push('/dang-nhap');
      })
      .catch(() => router.push('/dang-nhap'));

    taiDanhSach();
  }, [trang]);

  const taiDanhSach = async () => {
    setDangTai(true);
    const token = getToken();
    const query = new URLSearchParams();
    if (tuKhoa) query.set('tu_khoa', tuKhoa);
    query.set('page', trang.toString());
    query.set('limit', '10');

    try {
      const res = await fetch(getApiUrl(`/api/v1/album?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSach(data.du_lieu);
        setTongSoTrang(data.tong_so_trang);
      }
    } catch (e) {
    } finally {
      setDangTai(false);
    }
  };

  const openModal = (item?: AlbumItem) => {
    setErrorMsg('');
    if (item) {
      setEditingItem(item);
      setTen(item.ten);
      setMoTa(item.mo_ta || '');
      setAnhDaiDien(item.anh_dai_dien || '');
      setTrangThai(item.trang_thai);
      const existingPhotos = item.danh_sach_anh || [];
      setDanhSachAnhUpload(existingPhotos);
      setTepTinIds(existingPhotos.map((p) => p.id));
    } else {
      setEditingItem(null);
      setTen('');
      setMoTa('');
      setAnhDaiDien('');
      setTrangThai(true);
      setDanhSachAnhUpload([]);
      setTepTinIds([]);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!ten.trim()) {
      setErrorMsg('Vui lòng nhập tên Album ảnh.');
      return;
    }

    setSubmitting(true);
    const token = getToken();
    const payload = {
      ten: ten.trim(),
      mo_ta: moTa.trim() || undefined,
      anh_dai_dien: anhDaiDien.trim() || (danhSachAnhUpload.length > 0 ? danhSachAnhUpload[0].url : undefined),
      trang_thai: trangThai,
      tep_tin_ids: tepTinIds,
    };

    try {
      const url = editingItem
        ? getApiUrl(`/api/v1/album/${editingItem.id}`)
        : getApiUrl('/api/v1/album');
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.thanh_cong) {
        showSuccess(editingItem ? 'Cập nhật thành công' : 'Thêm mới thành công', editingItem ? 'Album ảnh đã được lưu.' : 'Album ảnh mới đã được tạo.');
        setShowModal(false);
        taiDanhSach();
      } else {
        setErrorMsg(data.message || 'Thao tác thất bại');
        showError('Thao tác thất bại', data.message || 'Thao tác thất bại');
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối máy chủ');
      showError('Thao tác thất bại', 'Không thể kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTrangThai = async (id: string, currentStatus: boolean) => {
    const token = getToken();
    try {
      await fetch(getApiUrl(`/api/v1/album/${id}/trang-thai`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trang_thai: !currentStatus }),
      });
      taiDanhSach();
    } catch (e) {}
  };

  const xoaAlbum = (item: AlbumItem) => {
    setAlbumCanXoa(item);
  };

  const submitXoaAlbum = async () => {
    if (!albumCanXoa) return;
    setDangXoaAlbum(true);
    const token = getToken();
    try {
      await fetch(getApiUrl(`/api/v1/album/${albumCanXoa.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccess('Xóa thành công', 'Album ảnh đã được xóa.');
      setAlbumCanXoa(null);
      taiDanhSach();
    } catch (e) {
      showError('Xóa thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXoaAlbum(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader />

        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors p-6 rounded-2xl shadow-xl">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý Thư viện Ảnh</h1>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">Quản lý album hình ảnh hoạt động, sự kiện và thi đua nhà trường</p>
            </div>

            <button
              onClick={() => openModal()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shrink-0"
            >
              + Tạo Album Ảnh Mới
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">STT</th>
                    <th className="p-4">Tên Album Ảnh</th>
                    <th className="p-4">Số lượng ảnh</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {dangTai ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Đang tải danh sách...</td>
                    </tr>
                  ) : danhSach.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có album nào.</td>
                    </tr>
                  ) : (
                    danhSach.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 font-mono text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">{item.ten}</td>
                        <td className="p-4 font-bold text-emerald-700 dark:text-emerald-400">{item.so_luong_anh} ảnh</td>
                        <td className="p-4">
                          <button
                            onClick={() => toggleTrangThai(item.id, item.trang_thai)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                              item.trang_thai
                                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20'
                                : 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20'
                            }`}
                          >
                            {item.trang_thai ? 'HIỂN THỊ' : 'ẨN'}
                          </button>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openModal(item)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-slate-700 font-semibold"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => xoaAlbum(item)}
                            className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 font-medium"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingItem ? 'Chỉnh sửa Album Ảnh' : 'Tạo Album Ảnh Mới'}
            </h3>

            {errorMsg && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tên Album *</label>
                <input
                  type="text"
                  value={ten}
                  onChange={(e) => setTen(e.target.value)}
                  placeholder="Nhập tên album ảnh..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Mô tả album</label>
                <textarea
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  placeholder="Nhập mô tả album..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tải lên Thư mục / Tập hợp Ảnh trong Album</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadMultiplePhotos}
                    className="text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl cursor-pointer w-full"
                  />
                  {dangUploadMultiple && <div className="text-amber-400 text-xs font-semibold animate-pulse">⏳ Đang tải nhiều ảnh lên Server...</div>}
                </div>

                {danhSachAnhUpload.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                      <span>🖼️ Đã chọn {danhSachAnhUpload.length} bức ảnh trong Album:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDanhSachAnhUpload([]);
                          setTepTinIds([]);
                        }}
                        className="text-rose-600 dark:text-rose-400 hover:underline text-[10px] font-bold"
                      >
                        Xóa tất cả ảnh
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      {danhSachAnhUpload.map((img, idx) => (
                        <div key={img.id + idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                          <img src={getMediaUrl(img.url)} alt="Uploaded" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setDanhSachAnhUpload((prev) => prev.filter((_, i) => i !== idx));
                              setTepTinIds((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center opacity-80 hover:opacity-100 shadow-md"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="trangThaiAlbum"
                  checked={trangThai}
                  onChange={(e) => setTrangThai(e.target.checked)}
                  className="w-4 h-4 rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-blue-600"
                />
                <label htmlFor="trangThaiAlbum" className="text-slate-700 dark:text-slate-300 font-medium">Hiển thị công khai</label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={!!albumCanXoa}
        itemName={albumCanXoa?.ten || 'album ảnh này'}
        isDeleting={dangXoaAlbum}
        onClose={() => setAlbumCanXoa(null)}
        onConfirm={submitXoaAlbum}
      />
    </div>
  );
}