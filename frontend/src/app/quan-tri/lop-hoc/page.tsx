'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface GiaoVienOption {
  id: string;
  ho_ten: string;
  so_dien_thoai?: string;
}

interface LopHocItem {
  id: string;
  ten_lop: string;
  khoi: number;
  nam_hoc: string;
  gvcn_id?: string;
  mo_ta?: string;
  trang_thai: boolean;
  so_luong_hoc_sinh: number;
  gvcn?: GiaoVienOption;
}

export default function TrangQuanTriLopHoc() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [dangTaiPage, setDangTaiPage] = useState(true);

  const [danhSachLop, setDanhSachLop] = useState<LopHocItem[]>([]);
  const [danhSachGV, setDanhSachGV] = useState<GiaoVienOption[]>([]);
  const [dangTaiData, setDangTaiData] = useState(false);

  const [filterKhoi, setFilterKhoi] = useState<string>('');
  const [filterNamHoc, setFilterNamHoc] = useState<string>('');

  // Modal State
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);
  const [selectedLop, setSelectedLop] = useState<LopHocItem | null>(null);

  const [formTao, setFormTao] = useState({
    ten_lop: '',
    khoi: 6,
    nam_hoc: '2025-2026',
    gvcn_id: '',
    mo_ta: '',
  });

  const [formSua, setFormSua] = useState({
    ten_lop: '',
    khoi: 6,
    nam_hoc: '2025-2026',
    gvcn_id: '',
    mo_ta: '',
  });

  const [thongBaoLoiModal, setThongBaoLoiModal] = useState('');
  const [dangXuLyModal, setDangXuLyModal] = useState(false);

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

  const taiDanhSachLop = async () => {
    setDangTaiData(true);
    const token = localStorage.getItem('access_token');
    try {
      const query = new URLSearchParams();
      if (filterKhoi) query.set('khoi', filterKhoi);
      if (filterNamHoc) query.set('nam_hoc', filterNamHoc);

      const res = await fetch(getApiUrl(`/api/v1/lop-hoc?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSachLop(data.du_lieu);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách lớp học:', err);
    } finally {
      setDangTaiData(false);
    }
  };

  const taiDanhSachGV = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl('/api/v1/giao-vien?limit=100'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSachGV(data.du_lieu);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSachLop();
      taiDanhSachGV();
    }
  }, [dangTaiPage, filterKhoi, filterNamHoc]);

  // Submit Tạo lớp học
  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/lop-hoc'), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể tạo lớp học.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể tạo lớp học.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Thêm mới thành công', 'Lớp học mới đã được tạo.');
      setShowModalTao(false);
      taiDanhSachLop();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Open Modal Sửa
  const openModalSua = (lop: LopHocItem) => {
    setSelectedLop(lop);
    setFormSua({
      ten_lop: lop.ten_lop,
      khoi: lop.khoi,
      nam_hoc: lop.nam_hoc,
      gvcn_id: lop.gvcn_id || '',
      mo_ta: lop.mo_ta || '',
    });
    setThongBaoLoiModal('');
    setShowModalSua(true);
  };

  const submitSua = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLop) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/lop-hoc/${selectedLop.id}`), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể cập nhật lớp học.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể cập nhật lớp học.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật thành công', 'Lớp học đã được lưu.');
      setShowModalSua(false);
      taiDanhSachLop();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Submit Xóa lớp
  const submitXoa = async () => {
    if (!selectedLop) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/lop-hoc/${selectedLop.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xóa thất bại', data.message || 'Không thể xóa lớp học.');
      } else {
        showSuccess('Xóa thành công', 'Lớp học đã được xóa.');
        setShowModalXoa(false);
        taiDanhSachLop();
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
        Đang tải hệ thống quản lý Lớp học...
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
                ← Quản trị Hệ thống
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Lớp học</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push('/quan-tri/hoc-sinh')}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs font-semibold border border-emerald-300 dark:border-emerald-500/30 transition"
            >
              Quản lý Học sinh →
            </button>
            {hasPerm('lop_hoc_tao') && (
              <button
                onClick={() => {
                  setFormTao({ ten_lop: '', khoi: 6, nam_hoc: '2025-2026', gvcn_id: '', mo_ta: '' });
                  setThongBaoLoiModal('');
                  setShowModalTao(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-lg flex items-center gap-2"
              >
                + Thêm lớp mới
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-slate-600 dark:text-slate-400 font-semibold">Khối học:</label>
            <select
              value={filterKhoi}
              onChange={(e) => setFilterKhoi(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-200 dark:border-slate-800 text-white focus:outline-none"
            >
              <option value="">Tất cả các Khối (6-9)</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-600 dark:text-slate-400 font-semibold">Năm học:</label>
            <input
              type="text"
              value={filterNamHoc}
              onChange={(e) => setFilterNamHoc(e.target.value)}
              placeholder="Vd: 2025-2026"
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-200 dark:border-slate-800 text-white focus:outline-none w-32"
            />
          </div>
        </div>

        {/* Grid Lớp học */}
        {dangTaiData ? (
          <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách lớp học...</div>
        ) : danhSachLop.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có lớp học nào trong hệ thống.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {danhSachLop.map((lop) => (
              <div
                key={lop.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white text-lg">{lop.ten_lop}</h3>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                      Khối {lop.khoi} ({lop.nam_hoc})
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      <span className="text-slate-500 dark:text-slate-400">GVCN: </span>
                      {lop.gvcn ? (
                        <strong className="text-amber-700 dark:text-amber-400 font-semibold">{lop.gvcn.ho_ten}</strong>
                      ) : (
                        <span className="text-slate-400 italic">Chưa phân công GVCN</span>
                      )}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 font-medium">Sĩ số: <strong className="text-slate-900 dark:text-white font-bold">{lop.so_luong_hoc_sinh}</strong> học sinh</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => router.push(`/quan-tri/hoc-sinh?lop_hoc_id=${lop.id}`)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Xem học sinh →
                  </button>

                  <div className="space-x-1">
                    {hasPerm('lop_hoc_sua') && (
                      <button
                        onClick={() => openModalSua(lop)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold text-xs transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 inline-flex items-center gap-1 min-h-[32px]"
                      >
                        Sửa & GVCN
                      </button>
                    )}
                    {hasPerm('lop_hoc_xoa') && (
                      <button
                        onClick={() => {
                          setSelectedLop(lop);
                          setShowModalXoa(true);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-700/80 hover:bg-rose-700 text-white"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* MODAL TẠO LỚP */}
      {showModalTao && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thêm lớp học mới</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitTao} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tên lớp học *</label>
                <input
                  type="text"
                  required
                  value={formTao.ten_lop}
                  onChange={(e) => setFormTao({ ...formTao, ten_lop: e.target.value })}
                  placeholder="Vd: 6A1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Khối *</label>
                  <select
                    value={formTao.khoi}
                    onChange={(e) => setFormTao({ ...formTao, khoi: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value={6}>Khối 6</option>
                    <option value={7}>Khối 7</option>
                    <option value={8}>Khối 8</option>
                    <option value={9}>Khối 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Năm học *</label>
                  <input
                    type="text"
                    required
                    value={formTao.nam_hoc}
                    onChange={(e) => setFormTao({ ...formTao, nam_hoc: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Giáo viên chủ nhiệm (GVCN)</label>
                <select
                  value={formTao.gvcn_id}
                  onChange={(e) => setFormTao({ ...formTao, gvcn_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Chưa phân công GVCN --</option>
                  {danhSachGV.map((gv) => (
                    <option key={gv.id} value={gv.id}>
                      {gv.ho_ten}
                    </option>
                  ))}
                </select>
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
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA LỚP */}
      {showModalSua && selectedLop && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa thông tin lớp học</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitSua} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tên lớp học *</label>
                <input
                  type="text"
                  required
                  value={formSua.ten_lop}
                  onChange={(e) => setFormSua({ ...formSua, ten_lop: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Khối *</label>
                  <select
                    value={formSua.khoi}
                    onChange={(e) => setFormSua({ ...formSua, khoi: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value={6}>Khối 6</option>
                    <option value={7}>Khối 7</option>
                    <option value={8}>Khối 8</option>
                    <option value={9}>Khối 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Năm học *</label>
                  <input
                    type="text"
                    required
                    value={formSua.nam_hoc}
                    onChange={(e) => setFormSua({ ...formSua, nam_hoc: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Giáo viên chủ nhiệm (GVCN)</label>
                <select
                  value={formSua.gvcn_id}
                  onChange={(e) => setFormSua({ ...formSua, gvcn_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Chưa phân công GVCN --</option>
                  {danhSachGV.map((gv) => (
                    <option key={gv.id} value={gv.id}>
                      {gv.ho_ten}
                    </option>
                  ))}
                </select>
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

      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedLop?.ten_lop || 'lớp học này'}
        isDeleting={dangXuLyModal}
        onClose={() => { setShowModalXoa(false); setSelectedLop(null); }}
        onConfirm={submitXoa}
      />
        </main>
      </div>
    </div>
  );
}