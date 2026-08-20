'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { hasPermission } from '@/lib/permission';

const getToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('access_token') || localStorage.getItem('token') || '';
};

interface NguoiXuLy {
  id: string;
  ho_ten: string;
  email: string;
}

interface PhanAnhItem {
  id: string;
  ho_ten: string;
  so_dien_thoai: string;
  email?: string;
  noi_dung: string;
  trang_thai: 'MOI' | 'DANG_XU_LY' | 'DA_XU_LY';
  nguoi_xu_ly_id?: string;
  ngay_xu_ly?: string;
  ngay_tao: string;
  nguoi_xu_ly?: NguoiXuLy;
}

export default function QuanLyPhanAnhPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');

  const [danhSach, setDanhSach] = useState<PhanAnhItem[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');

  // Pagination & Filter State
  const [trangHienTai, setTrangHienTai] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [tongSo, setTongSo] = useState(0);

  const [trangThaiLoc, setTrangThaiLoc] = useState('');
  const [tuKhoa, setTuKhoa] = useState('');

  // Modal State
  const [showModalXem, setShowModalXem] = useState(false);
  const [showModalTrangThai, setShowModalTrangThai] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);

  const [selectedItem, setSelectedItem] = useState<PhanAnhItem | null>(null);
  const [trangThaiMoi, setTrangThaiMoi] = useState<'MOI' | 'DANG_XU_LY' | 'DA_XU_LY'>('DANG_XU_LY');
  const [dangCapNhat, setDangCapNhat] = useState(false);
  const [dangXuatExcel, setDangXuatExcel] = useState(false);

  useEffect(() => {
    const savedToken = getToken();
    if (!savedToken) {
      router.push('/dang-nhap');
      return;
    }
    setToken(savedToken);

    // Fetch thông tin người dùng quản trị
    fetch(getApiUrl('/api/v1/xac-thuc/toi'), {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setCurrentUser(data.du_lieu);
      })
      .catch(() => {});
  }, [router]);

  const loadData = async (page = 1, trangThai = trangThaiLoc, keyword = tuKhoa) => {
    const savedToken = getToken();
    if (!savedToken) return;

    setDangTai(true);
    setLoi('');

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (trangThai) params.append('trang_thai', trangThai);
      if (keyword && keyword.trim()) params.append('tu_khoa', keyword.trim());

      const res = await fetch(getApiUrl(`/api/v1/lien-he?${params.toString()}`), {
        headers: { Authorization: `Bearer ${savedToken}` },
      });

      const data = await res.json();
      if (res.ok && data.thanh_cong) {
        setDanhSach(data.du_lieu || []);
        setTongSo(data.tong_so || 0);
        setTrangHienTai(data.trang_hien_tai || 1);
        setTongSoTrang(data.tong_so_trang || 1);
      } else {
        setLoi(data.message || 'Không thể tải danh sách thông tin phản ánh.');
      }
    } catch (err) {
      setLoi('Lỗi kết nối máy chủ.');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData(trangHienTai, trangThaiLoc, tuKhoa);
    }
  }, [token, trangHienTai, trangThaiLoc]);

  const handleTimKiem = (e: FormEvent) => {
    e.preventDefault();
    setTrangHienTai(1);
    loadData(1, trangThaiLoc, tuKhoa);
  };

  const handleCapNhatTrangThai = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !token) return;

    try {
      setDangCapNhat(true);
      const res = await fetch(getApiUrl(`/api/v1/lien-he/${selectedItem.id}/trang-thai`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trang_thai: trangThaiMoi }),
      });

      const data = await res.json();
      if (res.ok && data.thanh_cong) {
        showSuccess('Cập nhật thành công', 'Trạng thái phản ánh đã được thay đổi.');
        setShowModalTrangThai(false);
        setSelectedItem(null);
        loadData(trangHienTai);
      } else {
        showError('Thao tác thất bại', data.message || 'Cập nhật trạng thái thất bại.');
      }
    } catch (err) {
      showError('Thao tác thất bại', 'Lỗi máy chủ.');
    } finally {
      setDangCapNhat(false);
    }
  };

  const handleXoa = async () => {
    if (!selectedItem || !token) return;

    try {
      setDangCapNhat(true);
      const res = await fetch(getApiUrl(`/api/v1/lien-he/${selectedItem.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.thanh_cong) {
        showSuccess('Xóa thành công', 'Phản ánh đã được xóa.');
        setShowModalXoa(false);
        setSelectedItem(null);
        loadData(trangHienTai);
      } else {
        showError('Xóa thất bại', data.message || 'Xóa phản ánh thất bại.');
      }
    } catch (err) {
      showError('Thao tác thất bại', 'Lỗi máy chủ.');
    } finally {
      setDangCapNhat(false);
    }
  };

  const handleXuatExcel = async () => {
    if (!token) return;
    try {
      setDangXuatExcel(true);
      const params = new URLSearchParams();
      if (trangThaiLoc) params.append('trang_thai', trangThaiLoc);
      if (tuKhoa && tuKhoa.trim()) params.append('tu_khoa', tuKhoa.trim());

      const res = await fetch(getApiUrl(`/api/v1/lien-he/xuat-excel?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Danh_sach_phan_anh_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showSuccess('Xuất thành công', 'File Excel đã được tải xuống.');
      } else {
        showError('Xuất thất bại', 'Không thể xuất file Excel.');
      }
    } catch (err) {
      showError('Xuất thất bại', 'Lỗi kết nối khi xuất Excel.');
    } finally {
      setDangXuatExcel(false);
    }
  };

  const renderBadgeTrangThai = (tt: 'MOI' | 'DANG_XU_LY' | 'DA_XU_LY') => {
    switch (tt) {
      case 'MOI':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Chưa xử lý
          </span>
        );
      case 'DANG_XU_LY':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-xs font-bold inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Đang xử lý
          </span>
        );
      case 'DA_XU_LY':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã xử lý
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader />

        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-[#E97036] text-xs font-extrabold uppercase">
                  Quản trị Hệ thống
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">• Tiếp nhận ý kiến</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                THÔNG TIN PHẢN ÁNH
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quản lý và tiếp nhận xử lý phản ánh, góp ý từ công dân & phụ huynh
              </p>
            </div>

            {hasPermission(currentUser, 'phan_anh_xuat_excel') && (
              <button
                type="button"
                onClick={handleXuatExcel}
                disabled={dangXuatExcel}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 self-start sm:self-auto"
              >
                {dangXuatExcel ? (
                  <span>Đang xuất Excel...</span>
                ) : (
                  <>
                    <span>📊 Xuất dữ liệu Excel</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Bộ lọc trạng thái */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Trạng thái:</span>
              <button
                onClick={() => { setTrangThaiLoc(''); setTrangHienTai(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  !trangThaiLoc
                    ? 'bg-orange-600 text-white shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tất cả ({tongSo})
              </button>
              <button
                onClick={() => { setTrangThaiLoc('MOI'); setTrangHienTai(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  trangThaiLoc === 'MOI'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                }`}
              >
                Chưa xử lý
              </button>
              <button
                onClick={() => { setTrangThaiLoc('DANG_XU_LY'); setTrangHienTai(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  trangThaiLoc === 'DANG_XU_LY'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                }`}
              >
                Đang xử lý
              </button>
              <button
                onClick={() => { setTrangThaiLoc('DA_XU_LY'); setTrangHienTai(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  trangThaiLoc === 'DA_XU_LY'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                }`}
              >
                Đã xử lý
              </button>
            </div>

            {/* Ô tìm kiếm */}
            <form onSubmit={handleTimKiem} className="w-full md:w-auto flex items-center gap-2">
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm họ tên, SĐT, email, nội dung..."
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 flex-1 md:w-64"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition shadow-sm shrink-0"
              >
                🔍 Tìm
              </button>
            </form>
          </div>

          {/* Table Data */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-colors">
            {dangTai ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                ⏳ Đang nạp danh sách thông tin phản ánh...
              </div>
            ) : loi ? (
              <div className="p-12 text-center text-rose-600 dark:text-rose-400 text-xs font-bold">
                ⚠️ {loi}
              </div>
            ) : danhSach.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <div className="text-3xl">📭</div>
                <div>Không tìm thấy thông tin phản ánh nào.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-extrabold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Họ và tên</th>
                      <th className="p-4">Số điện thoại</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 w-[30%]">Nội dung phản ánh</th>
                      <th className="p-4 text-center">Trạng thái</th>
                      <th className="p-4">Ngày gửi</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                    {danhSach.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {item.ho_ten}
                        </td>
                        <td className="p-4 font-mono text-slate-700 dark:text-slate-300">
                          {item.so_dien_thoai}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {item.email || '—'}
                        </td>
                        <td className="p-4 text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                          {item.noi_dung}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          {renderBadgeTrangThai(item.trang_thai)}
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                          {new Date(item.ngay_tao).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => { setSelectedItem(item); setShowModalXem(true); }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition text-[11px]"
                            title="Xem chi tiết"
                          >
                            👁️ Xem
                          </button>
                          {hasPermission(currentUser, 'phan_anh_sua') && (
                            <button
                              onClick={() => { setSelectedItem(item); setTrangThaiMoi(item.trang_thai); setShowModalTrangThai(true); }}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold transition text-[11px]"
                              title="Cập nhật trạng thái"
                            >
                              ✏️ Trạng thái
                            </button>
                          )}
                          {hasPermission(currentUser, 'phan_anh_xoa') && (
                            <button
                              onClick={() => { setSelectedItem(item); setShowModalXoa(true); }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold transition text-[11px]"
                              title="Xóa phản ánh"
                            >
                              🗑️ Xóa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {tongSoTrang > 1 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Hiển thị 10 / tổng số <strong>{tongSo}</strong> phản ánh
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={trangHienTai <= 1}
                    onClick={() => setTrangHienTai(trangHienTai - 1)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 font-bold text-slate-700 dark:text-slate-200 transition"
                  >
                    ← Trước
                  </button>
                  <span className="px-3 py-1.5 font-bold text-orange-600 dark:text-orange-400">
                    Trang {trangHienTai} / {tongSoTrang}
                  </span>
                  <button
                    disabled={trangHienTai >= tongSoTrang}
                    onClick={() => setTrangHienTai(trangHienTai + 1)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 font-bold text-slate-700 dark:text-slate-200 transition"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL XEM CHI TIẾT */}
      {showModalXem && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl max-w-lg w-full p-6 space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Chi tiết thông tin phản ánh</h2>
              <button
                onClick={() => { setShowModalXem(false); setSelectedItem(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Họ và tên người gửi:</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedItem.ho_ten}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Số điện thoại:</div>
                  <div className="font-bold font-mono text-blue-600 dark:text-blue-400">{selectedItem.so_dien_thoai}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Email liên hệ:</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedItem.email || 'Không cung cấp'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Trạng thái xử lý:</div>
                  <div className="mt-1">{renderBadgeTrangThai(selectedItem.trang_thai)}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-500 dark:text-slate-400 font-bold mb-1">Nội dung phản ánh / góp ý:</div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedItem.noi_dung}
                </div>
              </div>

              {selectedItem.nguoi_xu_ly && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 space-y-0.5">
                  <div>Người xử lý: <strong>{selectedItem.nguoi_xu_ly.ho_ten}</strong> ({selectedItem.nguoi_xu_ly.email})</div>
                  {selectedItem.ngay_xu_ly && <div>Thời gian cập nhật: {new Date(selectedItem.ngay_xu_ly).toLocaleString('vi-VN')}</div>}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => { setShowModalXem(false); setSelectedItem(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT TRẠNG THÁI */}
      {showModalTrangThai && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Cập nhật trạng thái xử lý</h2>

            <form onSubmit={handleCapNhatTrangThai} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Người gửi: {selectedItem.ho_ten}</label>
                <select
                  value={trangThaiMoi}
                  onChange={(e) => setTrangThaiMoi(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="MOI">🟠 Chưa xử lý (Mới)</option>
                  <option value="DANG_XU_LY">🔵 Đang xử lý</option>
                  <option value="DA_XU_LY">🟢 Đã xử lý (Hoàn thành)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowModalTrangThai(false); setSelectedItem(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangCapNhat}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md"
                >
                  {dangCapNhat ? 'Đang lưu...' : 'Lưu trạng thái'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÓA CHUẨN UX */}
      <ConfirmDeleteModal
        isOpen={showModalXoa}
        itemName={selectedItem?.ho_ten || 'phản ánh này'}
        isDeleting={dangCapNhat}
        onClose={() => { setShowModalXoa(false); setSelectedItem(null); }}
        onConfirm={handleXoa}
      />
    </div>
  );
}
