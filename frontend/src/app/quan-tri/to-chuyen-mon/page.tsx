'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface GiaoVienMember {
  id: string;
  ho_ten: string;
  chuc_vu?: string;
  anh_dai_dien?: string;
}

interface ToChuyenMonFull {
  id: string;
  ten: string;
  mo_ta?: string;
  truong_to_id?: string;
  so_luong_giao_vien: number;
  truong_to?: GiaoVienMember;
}

export default function TrangQuanTriToChuyenMon() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [dangTaiPage, setDangTaiPage] = useState(true);

  const [danhSachTo, setDanhSachTo] = useState<ToChuyenMonFull[]>([]);
  const [dangTaiData, setDangTaiData] = useState(false);

  // Modal State
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalThanhVien, setShowModalThanhVien] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  const [selectedTo, setSelectedTo] = useState<ToChuyenMonFull | null>(null);
  const [danhSachThanhVien, setDanhSachThanhVien] = useState<GiaoVienMember[]>([]);

  const [formTao, setFormTao] = useState({ ten: '', mo_ta: '' });
  const [formSua, setFormSua] = useState({ ten: '', mo_ta: '', truong_to_id: '' });

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

  const taiDanhSachTo = async () => {
    setDangTaiData(true);
    try {
      const res = await fetch(getApiUrl('/api/v1/to-chuyen-mon'));
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSachTo(data.du_lieu);
      }
    } catch (err) {
      console.error('Lỗi tải tổ chuyên môn:', err);
    } finally {
      setDangTaiData(false);
    }
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSachTo();
    }
  }, [dangTaiPage]);

  // Tạo tổ chuyên môn
  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/to-chuyen-mon'), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể tạo tổ chuyên môn.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể tạo tổ chuyên môn.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Thêm mới thành công', 'Tổ chuyên môn mới đã được tạo.');
      setShowModalTao(false);
      taiDanhSachTo();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Mở modal sửa & gán Tổ trưởng
  const openModalSua = async (to: ToChuyenMonFull) => {
    setSelectedTo(to);
    setFormSua({
      ten: to.ten,
      mo_ta: to.mo_ta || '',
      truong_to_id: to.truong_to_id || '',
    });
    setThongBaoLoiModal('');

    // Tải danh sách giáo viên thuộc tổ để làm dropdown chọn Tổ trưởng
    try {
      const res = await fetch(getApiUrl(`/api/v1/to-chuyen-mon/${to.id}/giao-vien`));
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSachThanhVien(data.du_lieu);
      }
    } catch (err) {}

    setShowModalSua(true);
  };

  const submitSua = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTo) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);

    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/to-chuyen-mon/${selectedTo.id}`), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể cập nhật tổ chuyên môn.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể cập nhật tổ chuyên môn.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật thành công', 'Tổ chuyên môn đã được lưu.');
      setShowModalSua(false);
      taiDanhSachTo();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Xem danh sách thành viên tổ
  const openModalThanhVien = async (to: ToChuyenMonFull) => {
    setSelectedTo(to);
    try {
      const res = await fetch(getApiUrl(`/api/v1/to-chuyen-mon/${to.id}/giao-vien`));
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSachThanhVien(data.du_lieu);
        setShowModalThanhVien(true);
      }
    } catch (err) {
      showError('Thao tác thất bại', 'Không thể tải danh sách thành viên tổ.');
    }
  };

  // Xóa tổ chuyên môn
  const submitXoa = async () => {
    if (!selectedTo) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/to-chuyen-mon/${selectedTo.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xóa thất bại', data.message || 'Không thể xóa tổ chuyên môn.');
      } else {
        showSuccess('Xóa thành công', 'Tổ chuyên môn đã được xóa.');
        setShowModalXoa(false);
        taiDanhSachTo();
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
        Đang tải hệ thống quản trị tổ chuyên môn...
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
                onClick={() => router.push('/quan-tri/giao-vien')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs border border-slate-300 dark:border-slate-700 font-medium transition"
              >
                ← Quản lý Giáo viên
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Tổ chuyên môn</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG</p>
          </div>

          {hasPerm('giao_vien_tao') && (
            <button
              onClick={() => {
                setFormTao({ ten: '', mo_ta: '' });
                setThongBaoLoiModal('');
                setShowModalTao(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start md:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Thêm tổ chuyên môn mới</span>
            </button>
          )}
        </div>

        {/* Grid Danh sách Tổ */}
        {dangTaiData ? (
          <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách tổ chuyên môn...</div>
        ) : danhSachTo.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có tổ chuyên môn nào.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {danhSachTo.map((to) => (
              <div
                key={to.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{to.ten}</h3>
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-semibold">
                      {to.so_luong_giao_vien} giáo viên
                    </span>
                  </div>

                  {to.mo_ta && <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-4">{to.mo_ta}</p>}

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Tổ trưởng chuyên môn: </span>
                    {to.truong_to ? (
                      <strong className="text-amber-700 dark:text-amber-400 font-semibold">{to.truong_to.ho_ten}</strong>
                    ) : (
                      <span className="text-slate-400 italic">Chưa gán Tổ trưởng</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => openModalThanhVien(to)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Xem {to.so_luong_giao_vien} thành viên →
                  </button>

                  <div className="space-x-1">
                    {hasPerm('giao_vien_sua') && (
                      <button
                        onClick={() => openModalSua(to)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold text-xs transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 inline-flex items-center gap-1 min-h-[32px]"
                      >
                        Sửa & Gán Tổ trưởng
                      </button>
                    )}
                    {hasPerm('giao_vien_xoa') && (
                      <button
                        onClick={() => {
                          setSelectedTo(to);
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

      {/* MODAL TẠO TỔ CHUYÊN MÔN */}
      {showModalTao && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thêm tổ chuyên môn mới</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitTao} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tên tổ chuyên môn *</label>
                <input
                  type="text"
                  required
                  value={formTao.ten}
                  onChange={(e) => setFormTao({ ...formTao, ten: e.target.value })}
                  placeholder="Vd: Tổ Toán - Tin học"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mô tả chức năng nhiệm vụ</label>
                <textarea
                  rows={3}
                  value={formTao.mo_ta}
                  onChange={(e) => setFormTao({ ...formTao, mo_ta: e.target.value })}
                  placeholder="Mô tả phạm vi giảng dạy của tổ..."
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu tổ chuyên môn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA & GÁN TỔ TRƯỞNG */}
      {showModalSua && selectedTo && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sửa tổ chuyên môn & Gán Tổ trưởng</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitSua} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tên tổ chuyên môn *</label>
                <input
                  type="text"
                  required
                  value={formSua.ten}
                  onChange={(e) => setFormSua({ ...formSua, ten: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tổ trưởng chuyên môn (Quy tắc Section IX)</label>
                <select
                  value={formSua.truong_to_id}
                  onChange={(e) => setFormSua({ ...formSua, truong_to_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Chưa gán Tổ trưởng --</option>
                  {danhSachThanhVien.map((gv) => (
                    <option key={gv.id} value={gv.id}>
                      {gv.ho_ten} {gv.chuc_vu ? `(${gv.chuc_vu})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  * Tổ trưởng bắt buộc phải là giáo viên thuộc chính tổ này.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mô tả</label>
                <textarea
                  rows={3}
                  value={formSua.mo_ta}
                  onChange={(e) => setFormSua({ ...formSua, mo_ta: e.target.value })}
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

      {/* MODAL XEM DANH SÁCH THÀNH VIÊN TỔ */}
      {showModalThanhVien && selectedTo && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thành viên {selectedTo.ten}</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{danhSachThanhVien.length} giáo viên</span>
            </div>
            {danhSachThanhVien.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">Chưa có giáo viên nào thuộc tổ này.</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {danhSachThanhVien.map((gv) => (
                  <div
                    key={gv.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {gv.anh_dai_dien ? (
                        <img src={gv.anh_dai_dien} alt={gv.ho_ten} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                          {gv.ho_ten.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{gv.ho_ten}</div>
                        {gv.chuc_vu && <div className="text-slate-500 dark:text-slate-400 text-[11px]">{gv.chuc_vu}</div>}
                      </div>
                    </div>
                    {selectedTo.truong_to_id === gv.id && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[10px] font-semibold">
                        Tổ trưởng
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModalThanhVien(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition text-xs"
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
        itemName={selectedTo?.ten || 'tổ chuyên môn này'}
        isDeleting={dangXuLyModal}
        onClose={() => { setShowModalXoa(false); setSelectedTo(null); }}
        onConfirm={submitXoa}
      />
        </main>
      </div>
    </div>
  );
}