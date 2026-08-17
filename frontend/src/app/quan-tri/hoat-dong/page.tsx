'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { getApiUrl, getMediaUrl } from '@/lib/api';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface DanhMucAdmin {
  id: string;
  ten: string;
}

interface HoatDongAdmin {
  id: string;
  tieu_de: string;
  slug: string;
  mo_ta?: string;
  noi_dung: string;
  anh_dai_dien?: string;
  trang_thai: string;
  ngay_tao: string;
  danh_muc?: DanhMucAdmin;
  tac_gia?: { ho_ten: string };
}

export default function QuanTriHoatDongPage() {
  const { showSuccess, showError } = useToast();
  const [danhSach, setDanhSach] = useState<HoatDongAdmin[]>([]);
  const [danhMucList, setDanhMucList] = useState<DanhMucAdmin[]>([]);
  const [tuKhoa, setTuKhoa] = useState('');
  const [danhMucId, setDanhMucId] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [dangTai, setDangTai] = useState(true);

  // Modal State
  const [modalMo, setModalMo] = useState(false);
  const [dangSua, setDangSua] = useState<HoatDongAdmin | null>(null);
  const [formTieuDe, setFormTieuDe] = useState('');
  const [formDanhMucId, setFormDanhMucId] = useState('');
  const [formMoTa, setFormMoTa] = useState('');
  const [formNoiDung, setFormNoiDung] = useState('');
  const [formAnhDaiDien, setFormAnhDaiDien] = useState('');
  const [dangTaiAnh, setDangTaiAnh] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBaoLoi, setThongBaoLoi] = useState('');

  // Delete Modal
  const [hoatDongCanXoa, setHoatDongCanXoa] = useState<HoatDongAdmin | null>(null);
  const [dangXoaHoatDong, setDangXoaHoatDong] = useState(false);

  const layToken = () => localStorage.getItem('token') || '';

  const taiDanhMuc = () => {
    fetch(getApiUrl('/api/v1/danh-muc'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhMucList(data.du_lieu);
          if (data.du_lieu.length > 0 && !formDanhMucId) {
            setFormDanhMucId(data.du_lieu[0].id);
          }
        }
      })
      .catch(() => {});
  };

  const taiDanhSach = () => {
    setDangTai(true);
    const query = new URLSearchParams();
    if (tuKhoa) query.set('tu_khoa', tuKhoa);
    if (danhMucId) query.set('danh_muc_id', danhMucId);
    if (trangThai) query.set('trang_thai', trangThai);
    query.set('limit', '50');

    fetch(getApiUrl(`/api/v1/bai-viet?${query.toString()}`), {
      headers: { Authorization: `Bearer ${layToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhSach(data.du_lieu);
        }
      })
      .catch(() => {})
      .finally(() => setDangTai(false));
  };

  useEffect(() => {
    taiDanhMuc();
    taiDanhSach();
  }, []);

  const xuLyMoModalTaoMoi = () => {
    setDangSua(null);
    setFormTieuDe('');
    setFormMoTa('');
    setFormNoiDung('');
    setFormAnhDaiDien('');
    if (danhMucList.length > 0) setFormDanhMucId(danhMucList[0].id);
    setThongBaoLoi('');
    setModalMo(true);
  };

  const xuLyMoModalSua = (item: HoatDongAdmin) => {
    setDangSua(item);
    setFormTieuDe(item.tieu_de);
    setFormDanhMucId(item.danh_muc?.id || (danhMucList[0]?.id || ''));
    setFormMoTa(item.mo_ta || '');
    setFormNoiDung(item.noi_dung);
    setFormAnhDaiDien(item.anh_dai_dien || '');
    setThongBaoLoi('');
    setModalMo(true);
  };

  const xuLyUploadAnh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDangTaiAnh(true);
    const formData = new FormData();
    formData.append('file', file);

    fetch(getApiUrl('/api/v1/tep-tin/upload'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${layToken()}` },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu?.duong_dan) {
          setFormAnhDaiDien(data.du_lieu.duong_dan);
          showSuccess('Tải lên thành công', 'Ảnh đã được cập nhật.');
        } else {
          showError('Tải lên thất bại', data.thong_bao || 'Tải ảnh lên thất bại');
        }
      })
      .catch(() => showError('Tải lên thất bại', 'Lỗi kết nối khi tải ảnh lên'))
      .finally(() => setDangTaiAnh(false));
  };

  const xuLyLuu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTieuDe.trim()) {
      setThongBaoLoi('Vui lòng nhập tiêu đề hoạt động');
      return;
    }
    if (!formDanhMucId) {
      setThongBaoLoi('Vui lòng chọn danh mục hoạt động');
      return;
    }
    if (!formNoiDung.trim()) {
      setThongBaoLoi('Vui lòng nhập nội dung hoạt động');
      return;
    }

    setDangLuu(true);
    setThongBaoLoi('');

    const bodyData = {
      tieu_de: formTieuDe.trim(),
      danh_muc_id: formDanhMucId,
      mo_ta: formMoTa.trim(),
      noi_dung: formNoiDung.trim(),
      anh_dai_dien: formAnhDaiDien,
    };

    const url = dangSua
      ? getApiUrl(`/api/v1/bai-viet/${dangSua.id}`)
      : getApiUrl('/api/v1/bai-viet');

    const method = dangSua ? 'PATCH' : 'POST';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${layToken()}`,
      },
      body: JSON.stringify(bodyData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          showSuccess(dangSua ? 'Cập nhật thành công' : 'Thêm mới thành công', dangSua ? 'Hoạt động đã được lưu.' : 'Hoạt động mới đã được thêm.');
          setModalMo(false);
          taiDanhSach();
        } else {
          setThongBaoLoi(data.thong_bao || 'Thao tác thất bại');
          showError('Thao tác thất bại', data.thong_bao || 'Thao tác thất bại');
        }
      })
      .catch(() => {
        setThongBaoLoi('Lỗi hệ thống khi lưu hoạt động');
        showError('Thao tác thất bại', 'Lỗi hệ thống khi lưu hoạt động');
      })
      .finally(() => setDangLuu(false));
  };

  const xuLyDoiTrangThai = (id: string, hienTai: string) => {
    const isXuatBan = hienTai === 'DA_XUAT_BAN';
    const actionEndpoint = isXuatBan ? 'an' : 'xuat-ban';

    fetch(getApiUrl(`/api/v1/bai-viet/${id}/${actionEndpoint}`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${layToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          showSuccess('Cập nhật trạng thái', 'Trạng thái hoạt động đã được thay đổi.');
          taiDanhSach();
        } else {
          showError('Thao tác thất bại', data.thong_bao || 'Không thể đổi trạng thái');
        }
      })
      .catch(() => showError('Thao tác thất bại', 'Lỗi hệ thống'));
  };

  const xuLyXoa = (item: HoatDongAdmin) => {
    setHoatDongCanXoa(item);
  };

  const submitXoaHoatDong = () => {
    if (!hoatDongCanXoa) return;
    setDangXoaHoatDong(true);

    fetch(getApiUrl(`/api/v1/bai-viet/${hoatDongCanXoa.id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${layToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          showSuccess('Xóa thành công', 'Hoạt động đã được xóa.');
          setHoatDongCanXoa(null);
          taiDanhSach();
        } else {
          showError('Xóa thất bại', data.thong_bao || 'Xóa hoạt động thất bại');
        }
      })
      .catch(() => showError('Xóa thất bại', 'Lỗi hệ thống khi xóa'))
      .finally(() => setDangXoaHoatDong(false));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader />

        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* HEADER TOOLBAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý Hoạt động & Sự kiện</h1>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">Đăng tải phong trào thi đua, sự kiện, ngoại khóa nhà trường</p>
            </div>

            <button
              onClick={xuLyMoModalTaoMoi}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-2"
            >
              ➕ Thêm Hoạt động / Sự kiện mới
            </button>
          </div>

          {/* FILTER BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
            <input
              type="text"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm theo tiêu đề hoạt động..."
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none flex-1 min-w-[200px]"
            />

            <select
              value={danhMucId}
              onChange={(e) => setDanhMucId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">Tất cả Danh mục</option>
              {danhMucList.map((dm) => (
                <option key={dm.id} value={dm.id}>{dm.ten}</option>
              ))}
            </select>

            <select
              value={trangThai}
              onChange={(e) => setTrangThai(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="DA_XUAT_BAN">Đã xuất bản (Public)</option>
              <option value="NHAP">Bản nháp</option>
              <option value="CHO_DUYET">Chờ duyệt</option>
            </select>

            <button
              onClick={taiDanhSach}
              className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#D85F25] font-bold text-white transition"
            >
              🔍 Lọc dữ liệu
            </button>
          </div>

          {/* TABLE LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-3xl overflow-hidden shadow-xl">
            {dangTai ? (
              <div className="p-12 text-center text-slate-600 dark:text-slate-300 text-xs font-medium">Đang tải danh sách hoạt động...</div>
            ) : danhSach.length === 0 ? (
              <div className="p-12 text-center text-slate-600 dark:text-slate-300 text-xs font-medium">Chưa có dữ liệu hoạt động / sự kiện.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="p-4">Ảnh</th>
                      <th className="p-4">Tiêu đề</th>
                      <th className="p-4">Danh mục</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Ngày tạo</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {danhSach.map((item) => (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4">
                          <div className="w-12 h-10 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden">
                            {item.anh_dai_dien ? (
                              <img src={getMediaUrl(item.anh_dai_dien)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-600">🎪</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">{item.tieu_de}</td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{item.danh_muc?.ten || '---'}</td>
                        <td className="p-4">
                          {item.trang_thai === 'DA_XUAT_BAN' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-semibold text-[10px]">
                              🟢 Đã xuất bản
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 font-semibold text-[10px]">
                              🟡 Bản nháp
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400">{new Date(item.ngay_tao).toLocaleDateString('vi-VN')}</td>
                        <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => xuLyDoiTrangThai(item.id, item.trang_thai)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px]"
                          >
                            {item.trang_thai === 'DA_XUAT_BAN' ? '👁️ Ẩn' : '🚀 Xuất bản'}
                          </button>
                          <button
                            onClick={() => xuLyMoModalSua(item)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 font-bold text-[11px]"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => xuLyXoa(item)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 font-bold text-[11px]"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL FORM THÊM / SỬA */}
      {modalMo && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-3xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {dangSua ? 'Cập nhật Hoạt động / Sự kiện' : 'Thêm Hoạt động / Sự kiện mới'}
              </h3>
              <button onClick={() => setModalMo(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            {thongBaoLoi && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold">
                ⚠️ {thongBaoLoi}
              </div>
            )}

            <form onSubmit={xuLyLuu} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tiêu đề Hoạt động / Sự kiện (*)</label>
                <input
                  type="text"
                  value={formTieuDe}
                  onChange={(e) => setFormTieuDe(e.target.value)}
                  placeholder="Nhập tên sự kiện, hoạt động..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Danh mục Hoạt động (*)</label>
                <select
                  value={formDanhMucId}
                  onChange={(e) => setFormDanhMucId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  {danhMucList.map((dm) => (
                    <option key={dm.id} value={dm.id}>{dm.ten}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Ảnh đại diện Banner</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={xuLyUploadAnh}
                    className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl w-full cursor-pointer"
                  />
                  {dangTaiAnh && <span className="text-amber-400 animate-pulse font-bold">Đang tải ảnh...</span>}
                </div>
                {formAnhDaiDien && (
                  <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 mt-2">
                    <img src={getMediaUrl(formAnhDaiDien)} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={formMoTa}
                  onChange={(e) => setFormMoTa(e.target.value)}
                  placeholder="Tóm tắt ngắn gọn nội dung hoạt động..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Nội dung đầy đủ (*)</label>
                <textarea
                  rows={8}
                  value={formNoiDung}
                  onChange={(e) => setFormNoiDung(e.target.value)}
                  placeholder="Nhập hoặc dán nội dung chi tiết bài viết hoạt động..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none font-mono text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalMo(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={dangLuu}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg disabled:opacity-50"
                >
                  {dangLuu ? 'Đang lưu...' : '💾 Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={!!hoatDongCanXoa}
        itemName={hoatDongCanXoa?.tieu_de || 'hoạt động này'}
        isDeleting={dangXoaHoatDong}
        onClose={() => setHoatDongCanXoa(null)}
        onConfirm={submitXoaHoatDong}
      />
    </div>
  );
}