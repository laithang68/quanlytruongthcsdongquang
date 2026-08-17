'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

interface HocSinhSimple {
  id: string;
  ma_hoc_sinh: string;
  ho_ten: string;
  lop_hoc?: { id: string; ten_lop: string };
}

interface PhuHuynhItem {
  id: string;
  ho_ten: string;
  so_dien_thoai?: string;
  email?: string;
  dia_chi?: string;
  trang_thai: boolean;
  phu_huynh_hoc_sinh: {
    quan_he: string;
    la_nguoi_giam_ho_chinh: boolean;
    hoc_sinh: HocSinhSimple;
  }[];
}

export default function TrangQuanTriPhuHuynh() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
  const [dangTaiPage, setDangTaiPage] = useState(true);

  const [danhSach, setDanhSach] = useState<PhuHuynhItem[]>([]);
  const [danhSachHocSinhOption, setDanhSachHocSinhOption] = useState<HocSinhSimple[]>([]);
  const [tongSo, setTongSo] = useState(0);
  const [tongSoTrang, setTongSoTrang] = useState(1);

  const [tuKhoa, setTuKhoa] = useState('');
  const [page, setPage] = useState(1);
  const [dangTaiData, setDangTaiData] = useState(false);

  // Modals
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalLienKet, setShowModalLienKet] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  const [selectedPhuHuynh, setSelectedPhuHuynh] = useState<PhuHuynhItem | null>(null);

  const [formTao, setFormTao] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    email: '',
    dia_chi: '',
  });

  const [formSua, setFormSua] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    email: '',
    dia_chi: '',
  });

  const [formLienKet, setFormLienKet] = useState({
    hoc_sinh_id: '',
    quan_he: 'Bố/Mẹ',
    la_nguoi_giam_ho_chinh: true,
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

  const taiDanhSachHocSinhOption = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(getApiUrl('/api/v1/hoc-sinh?limit=100'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSachHocSinhOption(data.du_lieu);
      }
    } catch (err) {}
  };

  const taiDanhSachPhuHuynh = async () => {
    setDangTaiData(true);
    const token = localStorage.getItem('access_token');

    try {
      const query = new URLSearchParams();
      if (tuKhoa) query.set('tu_khoa', tuKhoa);
      query.set('page', page.toString());
      query.set('limit', '10');

      const res = await fetch(getApiUrl(`/api/v1/phu-huynh?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSach(data.du_lieu);
        setTongSo(data.tong_so);
        setTongSoTrang(data.tong_so_trang);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách phụ huynh:', err);
    } finally {
      setDangTaiData(false);
    }
  };

  useEffect(() => {
    if (!dangTaiPage) {
      taiDanhSachPhuHuynh();
      taiDanhSachHocSinhOption();
    }
  }, [dangTaiPage, page]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    taiDanhSachPhuHuynh();
  };

  // Submit Tạo Phụ huynh
  const submitTao = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/phu-huynh'), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể tạo hồ sơ phụ huynh.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể tạo hồ sơ phụ huynh.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Thêm mới thành công', 'Hồ sơ phụ huynh mới đã được tạo.');
      setShowModalTao(false);
      taiDanhSachPhuHuynh();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Open Modal Sửa
  const openModalSua = (ph: PhuHuynhItem) => {
    setSelectedPhuHuynh(ph);
    setFormSua({
      ho_ten: ph.ho_ten,
      so_dien_thoai: ph.so_dien_thoai || '',
      email: ph.email || '',
      dia_chi: ph.dia_chi || '',
    });
    setThongBaoLoiModal('');
    setShowModalSua(true);
  };

  const submitSua = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPhuHuynh) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/phu-huynh/${selectedPhuHuynh.id}`), {
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
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể cập nhật hồ sơ phụ huynh.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể cập nhật hồ sơ phụ huynh.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Cập nhật thành công', 'Hồ sơ phụ huynh đã được lưu.');
      setShowModalSua(false);
      taiDanhSachPhuHuynh();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Open Modal Liên kết Phụ huynh - Học sinh
  const openModalLienKet = (ph: PhuHuynhItem) => {
    setSelectedPhuHuynh(ph);
    setFormLienKet({
      hoc_sinh_id: '',
      quan_he: 'Bố/Mẹ',
      la_nguoi_giam_ho_chinh: true,
    });
    setThongBaoLoiModal('');
    setShowModalLienKet(true);
  };

  const submitLienKet = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPhuHuynh || !formLienKet.hoc_sinh_id) return;
    setThongBaoLoiModal('');
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl('/api/v1/phu-huynh/lien-ket'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          phu_huynh_id: selectedPhuHuynh.id,
          hoc_sinh_id: formLienKet.hoc_sinh_id,
          quan_he: formLienKet.quan_he,
          la_nguoi_giam_ho_chinh: formLienKet.la_nguoi_giam_ho_chinh,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoiModal(data.message || data.thong_bao || 'Không thể liên kết.');
        showError('Thao tác thất bại', data.message || data.thong_bao || 'Không thể liên kết.');
        setDangXuLyModal(false);
        return;
      }

      showSuccess('Liên kết thành công', 'Phụ huynh đã được liên kết với học sinh.');
      setShowModalLienKet(false);
      taiDanhSachPhuHuynh();
    } catch (err) {
      setThongBaoLoiModal('Lỗi kết nối máy chủ.');
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  // Submit Xóa mềm
  const submitXoa = async () => {
    if (!selectedPhuHuynh) return;
    setDangXuLyModal(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(getApiUrl(`/api/v1/phu-huynh/${selectedPhuHuynh.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.thanh_cong) {
        showError('Xóa thất bại', data.message || 'Không thể xóa phụ huynh.');
      } else {
        showSuccess('Xóa thành công', 'Hồ sơ phụ huynh đã được xóa.');
        setShowModalXoa(false);
        taiDanhSachPhuHuynh();
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
        Đang tải hệ thống quản lý Phụ huynh...
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Phụ huynh</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">TRƯỜNG THCS ĐÔNG QUANG – PHƯỜNG ĐÔNG QUANG</p>
          </div>

          {hasPerm('phu_huynh_tao') && (
            <button
              onClick={() => {
                setFormTao({ ho_ten: '', so_dien_thoai: '', email: '', dia_chi: '' });
                setThongBaoLoiModal('');
                setShowModalTao(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-lg flex items-center gap-2"
            >
              + Thêm phụ huynh mới
            </button>
          )}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-4 flex items-center gap-3 text-xs">
          <input
            type="text"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm kiếm theo Họ tên, Số điện thoại, Email..."
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500 flex-1"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Table Phụ huynh */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl overflow-hidden shadow-xl">
          {dangTaiData ? (
            <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách phụ huynh...</div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">Chưa có phụ huynh nào trong hệ thống.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Số điện thoại</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Học sinh con (Giám hộ)</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {danhSach.map((ph) => (
                    <tr key={ph.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{ph.ho_ten}</td>
                      <td className="p-4 text-emerald-700 dark:text-emerald-400 font-medium">{ph.so_dien_thoai || '—'}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{ph.email || '—'}</td>
                      <td className="p-4">
                        {ph.phu_huynh_hoc_sinh.length === 0 ? (
                          <span className="text-slate-400 italic">Chưa liên kết</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {ph.phu_huynh_hoc_sinh.map((link, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-[11px] font-semibold"
                              >
                                {link.hoc_sinh?.ho_ten} ({link.quan_he})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                        {hasPerm('phu_huynh_sua') && (
                          <>
                            <button
                              onClick={() => openModalLienKet(ph)}
                              className="px-2 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white"
                            >
                              + Liên kết con
                            </button>
                            <button
                              onClick={() => openModalSua(ph)}
                              className="px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white"
                            >
                              Sửa
                            </button>
                          </>
                        )}
                        {hasPerm('phu_huynh_xoa') && (
                          <button
                            onClick={() => {
                              setSelectedPhuHuynh(ph);
                              setShowModalXoa(true);
                            }}
                            className="px-2 py-1 rounded bg-rose-700/80 hover:bg-rose-700 text-white"
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {tongSoTrang > 1 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <div>Tổng số: <strong className="text-slate-900 dark:text-white font-bold">{tongSo}</strong> phụ huynh</div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium disabled:opacity-50"
                >
                  ← Trước
                </button>
                <span>Trang {page} / {tongSoTrang}</span>
                <button
                  disabled={page >= tongSoTrang}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium disabled:opacity-50"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>

      {/* MODAL TẠO PHỤ HUYNH */}
      {showModalTao && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thêm phụ huynh mới</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitTao} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formTao.ho_ten}
                  onChange={(e) => setFormTao({ ...formTao, ho_ten: e.target.value })}
                  placeholder="Vd: Nguyễn Văn Hùng"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Số điện thoại</label>
                  <input
                    type="text"
                    value={formTao.so_dien_thoai}
                    onChange={(e) => setFormTao({ ...formTao, so_dien_thoai: e.target.value })}
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={formTao.email}
                    onChange={(e) => setFormTao({ ...formTao, email: e.target.value })}
                    placeholder="phuhunghn@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Địa chỉ liên hệ</label>
                <input
                  type="text"
                  value={formTao.dia_chi}
                  onChange={(e) => setFormTao({ ...formTao, dia_chi: e.target.value })}
                  placeholder="Phường Đông Quang, TP Thanh Hóa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
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
                  {dangXuLyModal ? 'Đang lưu...' : 'Lưu phụ huynh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA PHỤ HUYNH */}
      {showModalSua && selectedPhuHuynh && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa hồ sơ phụ huynh</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitSua} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formSua.ho_ten}
                  onChange={(e) => setFormSua({ ...formSua, ho_ten: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Số điện thoại</label>
                  <input
                    type="text"
                    value={formSua.so_dien_thoai}
                    onChange={(e) => setFormSua({ ...formSua, so_dien_thoai: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={formSua.email}
                    onChange={(e) => setFormSua({ ...formSua, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Địa chỉ liên hệ</label>
                <input
                  type="text"
                  value={formSua.dia_chi}
                  onChange={(e) => setFormSua({ ...formSua, dia_chi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
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

      {/* MODAL LIÊN KẾT CON */}
      {showModalLienKet && selectedPhuHuynh && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Liên kết học sinh con cho {selectedPhuHuynh.ho_ten}</h2>
            {thongBaoLoiModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {thongBaoLoiModal}
              </div>
            )}
            <form onSubmit={submitLienKet} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Chọn học sinh con *</label>
                <select
                  required
                  value={formLienKet.hoc_sinh_id}
                  onChange={(e) => setFormLienKet({ ...formLienKet, hoc_sinh_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Chọn học sinh --</option>
                  {danhSachHocSinhOption.map((hs) => (
                    <option key={hs.id} value={hs.id}>
                      {hs.ho_ten} (Mã: {hs.ma_hoc_sinh} - Lớp {hs.lop_hoc?.ten_lop})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mối quan hệ</label>
                <select
                  value={formLienKet.quan_he}
                  onChange={(e) => setFormLienKet({ ...formLienKet, quan_he: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Bố">Bố</option>
                  <option value="Mẹ">Mẹ</option>
                  <option value="Người giám hộ">Người giám hộ</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalLienKet(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyModal}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50"
                >
                  {dangXuLyModal ? 'Đang liên kết...' : 'Xác nhận liên kết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedPhuHuynh?.ho_ten || 'phụ huynh này'}
        isDeleting={dangXuLyModal}
        onClose={() => { setShowModalXoa(false); setSelectedPhuHuynh(null); }}
        onConfirm={submitXoa}
      />
        </main>
      </div>
    </div>
  );
}