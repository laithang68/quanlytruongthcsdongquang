'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { getApiUrl, getMediaUrl } from '@/lib/api';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface VideoItem {
  id: string;
  tieu_de: string;
  url_video: string;
  mo_ta?: string;
  anh_thumbnail?: string;
  luot_xem: number;
  trang_thai: boolean;
  ngay_tao: string;
}

export default function QuanTriVideo() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [danhSach, setDanhSach] = useState<VideoItem[]>([]);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [dangTai, setDangTai] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoItem | null>(null);
  const [tieuDe, setTieuDe] = useState('');
  const [moTa, setMoTa] = useState('');
  const [urlVideo, setUrlVideo] = useState('');
  const [anhThumbnail, setAnhThumbnail] = useState('');
  const [trangThai, setTrangThai] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [dangUploadThumb, setDangUploadThumb] = useState(false);
  const [dangUploadVideo, setDangUploadVideo] = useState(false);

  // Delete Modal
  const [videoCanXoa, setVideoCanXoa] = useState<VideoItem | null>(null);
  const [dangXoaVideo, setDangXoaVideo] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const handleUploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setDangUploadVideo(true);
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
        setUrlVideo(data.du_lieu.url);
        showSuccess('Tải lên thành công', 'Video đã được tải lên.');
      } else {
        showError('Tải lên thất bại', data.message || 'Lỗi tải tệp video mp4.');
      }
    } catch (err) {
      showError('Tải lên thất bại', 'Không thể kết nối máy chủ upload tệp video.');
    } finally {
      setDangUploadVideo(false);
    }
  };

  const handleUploadThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setDangUploadThumb(true);
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
        setAnhThumbnail(data.du_lieu.url);
        showSuccess('Tải lên thành công', 'Ảnh thumbnail đã được cập nhật.');
      } else {
        showError('Tải lên thất bại', data.message || 'Lỗi tải ảnh thumbnail.');
      }
    } catch (err) {
      showError('Tải lên thất bại', 'Không thể kết nối máy chủ upload.');
    } finally {
      setDangUploadThumb(false);
    }
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
      const res = await fetch(getApiUrl(`/api/v1/video?${query.toString()}`), {
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

  const openModal = (item?: VideoItem) => {
    setErrorMsg('');
    if (item) {
      setEditingItem(item);
      setTieuDe(item.tieu_de);
      setMoTa(item.mo_ta || '');
      setUrlVideo(item.url_video);
      setAnhThumbnail(item.anh_thumbnail || '');
      setTrangThai(item.trang_thai);
    } else {
      setEditingItem(null);
      setTieuDe('');
      setMoTa('');
      setUrlVideo('');
      setAnhThumbnail('');
      setTrangThai(true);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tieuDe.trim() || !urlVideo.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tiêu đề và URL video.');
      return;
    }

    setSubmitting(true);
    const token = getToken();
    const payload = {
      tieu_de: tieuDe.trim(),
      mo_ta: moTa.trim() || undefined,
      url_video: urlVideo.trim(),
      anh_thumbnail: anhThumbnail.trim() || undefined,
      trang_thai: trangThai,
    };

    try {
      const url = editingItem
        ? getApiUrl(`/api/v1/video/${editingItem.id}`)
        : getApiUrl('/api/v1/video');
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
        showSuccess(editingItem ? 'Cập nhật thành công' : 'Thêm mới thành công', editingItem ? 'Video đã được lưu.' : 'Video mới đã được thêm.');
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
      await fetch(getApiUrl(`/api/v1/video/${id}/trang-thai`), {
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

  const xoaVideo = (item: VideoItem) => {
    setVideoCanXoa(item);
  };

  const submitXoaVideo = async () => {
    if (!videoCanXoa) return;
    setDangXoaVideo(true);
    const token = getToken();
    try {
      await fetch(getApiUrl(`/api/v1/video/${videoCanXoa.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccess('Xóa thành công', 'Video đã được xóa.');
      setVideoCanXoa(null);
      taiDanhSach();
    } catch (e) {
      showError('Xóa thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXoaVideo(false);
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
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý Video Nhà trường</h1>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">Danh sách video hoạt động, bài giảng số và clip sự kiện</p>
            </div>

            <button
              onClick={() => openModal()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shrink-0"
            >
              + Thêm Video Mới
            </button>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">STT</th>
                    <th className="p-4">Tiêu đề Video</th>
                    <th className="p-4">URL Video</th>
                    <th className="p-4">Lượt xem</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {dangTai ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">Đang tải danh sách...</td>
                    </tr>
                  ) : danhSach.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">Chưa có video nào.</td>
                    </tr>
                  ) : (
                    danhSach.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 font-mono text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">{item.tieu_de}</td>
                        <td className="p-4 font-mono text-blue-600 dark:text-blue-400 text-[11px] max-w-xs truncate font-medium">{item.url_video}</td>
                        <td className="p-4 font-bold text-emerald-700 dark:text-emerald-400">{item.luot_xem}</td>
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
                            onClick={() => xoaVideo(item)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-semibold"
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

      {/* MODAL EDIT / CREATE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingItem ? 'Chỉnh sửa Video' : 'Thêm Video Mới'}
            </h3>

            {errorMsg && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Tiêu đề Video *</label>
                <input
                  type="text"
                  value={tieuDe}
                  onChange={(e) => setTieuDe(e.target.value)}
                  placeholder="Nhập tiêu đề video..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Nguồn Video (Upload tệp .mp4/.webm hoặc Nhập URL YouTube) *</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                      onChange={handleUploadVideoFile}
                      className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white flex-1"
                    />
                    {dangUploadVideo && <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">Đang tải video...</span>}
                  </div>
                  <input
                    type="text"
                    value={urlVideo}
                    onChange={(e) => setUrlVideo(e.target.value)}
                    placeholder="Hoặc dán URL YouTube (vd: https://www.youtube.com/watch?v=...) hoặc tệp /uploads/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none font-mono text-[11px]"
                  />
                </div>
                {urlVideo && (
                  <div className="mt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span>✓ Nguồn video đã chọn:</span>
                    <span className="text-slate-300 font-normal truncate max-w-xs">{urlVideo}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Mô tả ngắn</label>
                <textarea
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  placeholder="Nhập mô tả video..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Ảnh Thumbnail Video (Upload hoặc Nhập URL)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadThumb}
                      className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white flex-1"
                    />
                    {dangUploadThumb && <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">Đang tải...</span>}
                  </div>
                  <input
                    type="text"
                    value={anhThumbnail}
                    onChange={(e) => setAnhThumbnail(e.target.value)}
                    placeholder="Hoặc dán URL ảnh thumbnail (vd: /uploads/abc.png hoặc http://...)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none font-mono text-[11px]"
                  />
                </div>
                {anhThumbnail && (
                  <div className="mt-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={getMediaUrl(anhThumbnail)}
                      alt="Thumbnail Preview"
                      className="w-16 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                    />
                    <span className="text-[11px] text-emerald-400 font-semibold">✓ Đã chọn thumbnail</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="trangThaiVideo"
                  checked={trangThai}
                  onChange={(e) => setTrangThai(e.target.checked)}
                  className="w-4 h-4 rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-blue-600"
                />
                <label htmlFor="trangThaiVideo" className="text-slate-700 dark:text-slate-300 font-medium">Hiển thị công khai</label>
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
        isOpen={!!videoCanXoa}
        itemName={videoCanXoa?.tieu_de || 'video này'}
        isDeleting={dangXoaVideo}
        onClose={() => setVideoCanXoa(null)}
        onConfirm={submitXoaVideo}
      />
    </div>
  );
}