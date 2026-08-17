'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { getApiUrl, getMediaUrl } from '@/lib/api';
import { hasPermission } from '@/lib/permission';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface DanhMucTL {
  id: string;
  ten: string;
}

interface TaiLieuItem {
  id: string;
  ten_tai_lieu: string;
  mo_ta?: string;
  tac_gia?: string;
  duong_dan_lien_ket?: string;
  anh_thumb?: string;
  danh_muc_tai_lieu: DanhMucTL;
  tep_tin?: {
    id: string;
    ten_goc: string;
    url: string;
    loai_tap_tin: string;
    kich_thuoc: number;
  };
  luot_tai: number;
  trang_thai: boolean;
  ngay_tao: string;
}

export default function QuanTriThuVienSo() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [danhSach, setDanhSach] = useState<TaiLieuItem[]>([]);
  const [danhMucList, setDanhMucList] = useState<DanhMucTL[]>([]);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [dangTai, setDangTai] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TaiLieuItem | null>(null);
  const [tenTaiLieu, setTenTaiLieu] = useState('');
  const [moTa, setMoTa] = useState('');
  const [danhMucId, setDanhMucId] = useState('');
  const [tacGia, setTacGia] = useState('');
  const [duongDanLienKet, setDuongDanLienKet] = useState('');
  const [anhThumb, setAnhThumb] = useState('');
  const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'url'>('upload');
  const [trangThai, setTrangThai] = useState(true);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tepTinId, setTepTinId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Modal
  const [taiLieuCanXoa, setTaiLieuCanXoa] = useState<TaiLieuItem | null>(null);
  const [dangXoaTaiLieu, setDangXoaTaiLieu] = useState(false);

  const [locDanhMucId, setLocDanhMucId] = useState('');

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nguoi_dung');
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch (e) {}

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
      })
      .catch(() => {});

    fetch(getApiUrl('/api/v1/thu-vien-so/danh-muc'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhMucList(data.du_lieu || []);
      })
      .catch(() => {});
  }, []);

  const taiDanhSach = async () => {
    setDangTai(true);
    const token = getToken();
    const query = new URLSearchParams();
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    if (locDanhMucId) query.set('danh_muc_id', locDanhMucId);
    query.set('page', trang.toString());
    query.set('limit', '10');

    try {
      const res = await fetch(getApiUrl(`/api/v1/thu-vien-so?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSach(data.du_lieu || []);
        setTongSoTrang(data.tong_so_trang || 1);
      }
    } catch (e) {
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiDanhSach();
  }, [trang, locDanhMucId]);

  const openModal = (item?: TaiLieuItem) => {
    setErrorMsg('');
    setSelectedFile(null);
    if (item) {
      setEditingItem(item);
      setTenTaiLieu(item.ten_tai_lieu);
      setMoTa(item.mo_ta || '');
      setDanhMucId(item.danh_muc_tai_lieu?.id || (danhMucList[0]?.id || ''));
      setTacGia(item.tac_gia || currentUser?.ho_ten || '');
      setDuongDanLienKet(item.duong_dan_lien_ket || '');
      setAnhThumb(item.anh_thumb || '');
      setThumbnailMode(item.anh_thumb && item.anh_thumb.startsWith('http') ? 'url' : 'upload');
      setTepTinId(item.tep_tin?.id || null);
      setTrangThai(item.trang_thai);
    } else {
      setEditingItem(null);
      setTenTaiLieu('');
      setMoTa('');
      setDanhMucId(danhMucList[0]?.id || '');
      setTacGia(currentUser?.ho_ten || '');
      setDuongDanLienKet('');
      setAnhThumb('');
      setThumbnailMode('upload');
      setTepTinId(null);
      setTrangThai(true);
    }
    setShowModal(true);
  };

  const handleUploadThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('tep_tin', file);

    setUploadingThumb(true);
    const token = getToken();

    try {
      const res = await fetch(getApiUrl('/api/v1/tep-tin/upload'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.thanh_cong && data.du_lieu?.duong_dan) {
        setAnhThumb(data.du_lieu.duong_dan);
        showSuccess('Tải lên thành công', 'Ảnh thumbnail đã được cập nhật.');
      } else {
        showError('Tải lên thất bại', data.thong_bao || data.message || 'Tải ảnh thumbnail thất bại.');
      }
    } catch (e) {
      showError('Tải lên thất bại', 'Lỗi kết nối khi tải ảnh thumbnail.');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tenTaiLieu.trim() || !danhMucId) {
      setErrorMsg('Vui lòng nhập tên tài liệu và chọn danh mục.');
      return;
    }

    setSubmitting(true);
    const token = getToken();
    let uploadedTepTinId = tepTinId;

    // Upload tệp đính kèm nếu có
    if (selectedFile) {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('tep_tin', selectedFile);

      try {
        const uploadRes = await fetch(getApiUrl('/api/v1/tep-tin/upload'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.thanh_cong && uploadData.du_lieu) {
          uploadedTepTinId = uploadData.du_lieu.id;
        } else {
          setErrorMsg('Tải tệp đính kèm thất bại');
          setSubmitting(false);
          setUploadingFile(false);
          return;
        }
      } catch (e) {
        setErrorMsg('Lỗi khi tải tệp');
        setSubmitting(false);
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    const payload = {
      ten_tai_lieu: tenTaiLieu.trim(),
      mo_ta: moTa.trim() || undefined,
      danh_muc_tai_lieu_id: danhMucId,
      tac_gia: tacGia.trim() || currentUser?.ho_ten || undefined,
      duong_dan_lien_ket: duongDanLienKet.trim() || undefined,
      anh_thumb: anhThumb.trim() || undefined,
      tep_tin_id: uploadedTepTinId || undefined,
      trang_thai: trangThai,
    };

    try {
      const url = editingItem
        ? getApiUrl(`/api/v1/thu-vien-so/${editingItem.id}`)
        : getApiUrl('/api/v1/thu-vien-so');
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
        showSuccess(editingItem ? 'Cập nhật thành công' : 'Thêm mới thành công', editingItem ? 'Tài liệu đã được lưu.' : 'Tài liệu mới đã được thêm.');
        setShowModal(false);
        taiDanhSach();
      } else {
        setErrorMsg(data.thong_bao || data.message || 'Thao tác thất bại');
        showError('Thao tác thất bại', data.thong_bao || data.message || 'Thao tác thất bại');
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
      await fetch(getApiUrl(`/api/v1/thu-vien-so/${id}/trang-thai`), {
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

  const xoaTaiLieu = (item: TaiLieuItem) => {
    setTaiLieuCanXoa(item);
  };

  const submitXoaTaiLieu = async () => {
    if (!taiLieuCanXoa) return;
    setDangXoaTaiLieu(true);
    const token = getToken();
    try {
      await fetch(getApiUrl(`/api/v1/thu-vien-so/${taiLieuCanXoa.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccess('Xóa thành công', 'Tài liệu số đã được xóa.');
      setTaiLieuCanXoa(null);
      taiDanhSach();
    } catch (e) {
      showError('Xóa thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXoaTaiLieu(false);
    }
  };

  // Helper render thumbnail src
  const getThumbSrc = (pathOrUrl?: string) => {
    if (!pathOrUrl) return '';
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
    return getMediaUrl(pathOrUrl);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader user={currentUser} />

        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors p-6 rounded-2xl shadow-xl">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý Thư viện Số & Học liệu</h1>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">Quản lý bài giảng điện tử, đề thi, sách giáo khoa, link liên kết và tài liệu chuyên môn</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm tên tài liệu, tác giả..."
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />

              <select
                value={locDanhMucId}
                onChange={(e) => {
                  setLocDanhMucId(e.target.value);
                  setTrang(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none font-semibold"
              >
                <option value="">Tất cả 6 danh mục</option>
                {danhMucList.map((dm) => (
                  <option key={dm.id} value={dm.id}>
                    {dm.ten}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setTrang(1);
                  taiDanhSach();
                }}
                className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#D85F25] text-white font-bold text-xs transition"
              >
                Tìm
              </button>

              {hasPermission(currentUser, 'thu_vien_so_tao') && (
                <button
                  onClick={() => openModal()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shrink-0"
                >
                  + Thêm Tài liệu Số Mới
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">STT</th>
                    <th className="p-4">Thumbnail</th>
                    <th className="p-4">Tên Tài liệu</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4">Link URL</th>
                    <th className="p-4">Tác giả</th>
                    <th className="p-4">Lượt tải</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {dangTai ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">Đang tải danh sách...</td>
                    </tr>
                  ) : danhSach.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">Chưa có tài liệu số nào.</td>
                    </tr>
                  ) : (
                    danhSach.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 font-mono text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-4">
                          {item.anh_thumb ? (
                            <img
                              src={getThumbSrc(item.anh_thumb)}
                              alt="Thumbnail"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/e2e8f0/64748b?text=DOC';
                              }}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-base">
                              📚
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">{item.ten_tai_lieu}</td>
                        <td className="p-4 font-semibold text-blue-600 dark:text-blue-400">{item.danh_muc_tai_lieu?.ten}</td>
                        <td className="p-4">
                          {item.duong_dan_lien_ket ? (
                            <a
                              href={item.duong_dan_lien_ket}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline max-w-[130px] truncate block font-medium"
                              title={item.duong_dan_lien_ket}
                            >
                              🔗 Link ngoài
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{item.tac_gia || '—'}</td>
                        <td className="p-4 font-bold text-emerald-700 dark:text-emerald-400">{item.luot_tai}</td>
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
                        <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                          {hasPermission(currentUser, 'thu_vien_so_sua') && (
                            <button
                              onClick={() => openModal(item)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                            >
                              Sửa
                            </button>
                          )}
                          {hasPermission(currentUser, 'thu_vien_so_xoa') && (
                            <button
                              onClick={() => xoaTaiLieu(item)}
                              className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 font-semibold text-xs transition"
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
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl my-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingItem ? 'Chỉnh sửa Tài liệu Số' : 'Thêm Tài liệu Số Mới'}
            </h3>

            {errorMsg && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tên Tài liệu *</label>
                <input
                  type="text"
                  value={tenTaiLieu}
                  onChange={(e) => setTenTaiLieu(e.target.value)}
                  placeholder="Nhập tên tài liệu..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Danh mục *</label>
                <select
                  value={danhMucId}
                  onChange={(e) => setDanhMucId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-semibold"
                >
                  {danhMucList.map((dm) => (
                    <option key={dm.id} value={dm.id}>
                      {dm.ten}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Liên kết tài liệu (URL)</label>
                <input
                  type="url"
                  value={duongDanLienKet}
                  onChange={(e) => setDuongDanLienKet(e.target.value)}
                  placeholder="https://example.com/tai-lieu (Google Drive, YouTube, Website, PDF...)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* THUMBNAIL CHO PHÉP UPLOAD HOẶC NHẬP URL */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Ảnh Thumbnail Video (Upload hoặc Nhập URL)
                  </label>
                  <div className="flex gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setThumbnailMode('upload')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        thumbnailMode === 'upload'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      [Upload ảnh]
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailMode('url')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        thumbnailMode === 'url'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      [Nhập URL]
                    </button>
                  </div>
                </div>

                {thumbnailMode === 'upload' ? (
                  hasPermission(currentUser, 'thu_vien_so_upload') ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadThumb}
                      className="w-full text-slate-600 dark:text-slate-300 text-xs font-medium file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl"
                    />
                  ) : (
                    <div className="text-[11px] text-amber-500 italic">Tài khoản của bạn không có quyền upload ảnh.</div>
                  )
                ) : (
                  <input
                    type="url"
                    value={anhThumb}
                    onChange={(e) => setAnhThumb(e.target.value)}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none"
                  />
                )}

                {/* PREVIEW THUMBNAIL */}
                {anhThumb && (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={getThumbSrc(anhThumb)}
                      alt="Preview Thumbnail"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/e2e8f0/64748b?text=L%E1%BB%97i+Ảnh';
                      }}
                      className="w-24 h-16 object-cover rounded-xl border border-slate-300 dark:border-slate-700 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setAnhThumb('')}
                      className="px-2.5 py-1 rounded bg-rose-600/20 text-rose-400 font-semibold text-xs hover:bg-rose-600/40"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Tác giả / Người soạn bài <span className="text-[11px] text-blue-600 dark:text-blue-400 font-normal">(Mặc định tự động điền tên người đăng nhập)</span>
                </label>
                <input
                  type="text"
                  value={tacGia}
                  onChange={(e) => setTacGia(e.target.value)}
                  placeholder={currentUser?.ho_ten ? `Mặc định: ${currentUser.ho_ten}` : "Tên tác giả / Ban biên soạn..."}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none font-medium"
                />
              </div>

              {hasPermission(currentUser, 'thu_vien_so_upload') && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tệp đính kèm (PDF/DOCX/XLSX/PPTX)</label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-slate-600 dark:text-slate-300 text-xs font-medium file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Mô tả ngắn</label>
                <textarea
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  placeholder="Mô tả tóm tắt tài liệu..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="trangThaiTL"
                  checked={trangThai}
                  onChange={(e) => setTrangThai(e.target.checked)}
                  className="w-4 h-4 rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-blue-600"
                />
                <label htmlFor="trangThaiTL" className="text-slate-700 dark:text-slate-300 font-medium">Hiển thị công khai</label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFile || uploadingThumb}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  {submitting || uploadingFile || uploadingThumb ? 'Đang xử lý...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={!!taiLieuCanXoa}
        itemName={taiLieuCanXoa?.ten_tai_lieu || 'tài liệu này'}
        isDeleting={dangXoaTaiLieu}
        onClose={() => setTaiLieuCanXoa(null)}
        onConfirm={submitXoaTaiLieu}
      />
    </div>
  );
}