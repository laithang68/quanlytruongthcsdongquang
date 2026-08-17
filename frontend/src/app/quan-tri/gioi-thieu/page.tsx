'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { getApiUrl, getMediaUrl } from '@/lib/api';
import { hasPermission } from '@/lib/permission';

import { useToast } from '@/components/admin/ToastContext';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="p-4 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-500">Đang tải trình soạn thảo...</div>,
});

interface GioiThieuItem {
  id: string;
  tieu_de_chinh: string;
  tieu_de_phu?: string;
  anh_nen?: string;
  noi_dung_chinh: string;
  trang_thai: boolean;
  ngay_tao: string;
  ngay_cap_nhat: string;
  nguoi_tao?: {
    id: string;
    ho_ten: string;
    email: string;
  };
}

function QuanTriGioiThieuContent() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nguoi_dung');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const [danhSach, setDanhSach] = useState<GioiThieuItem[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [tongSo, setTongSo] = useState(0);
  const [tuKhoa, setTuKhoa] = useState('');

  // Modals state
  const [showModalTao, setShowModalTao] = useState(false);
  const [showModalSua, setShowModalSua] = useState(false);
  const [showModalXem, setShowModalXem] = useState(false);
  const [showModalXoa, setShowModalXoa] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GioiThieuItem | null>(null);

  // Form states
  const [formTao, setFormTao] = useState({
    tieu_de_chinh: '',
    tieu_de_phu: '',
    anh_nen: '',
    noi_dung_chinh: '',
    trang_thai: true,
  });

  const [formSua, setFormSua] = useState({
    tieu_de_chinh: '',
    tieu_de_phu: '',
    anh_nen: '',
    noi_dung_chinh: '',
    trang_thai: true,
  });

  const [dangUploadAnh, setDangUploadAnh] = useState(false);
  const [dangXuLyModal, setDangXuLyModal] = useState(false);
  const [thongBaoLoiModal, setThongBaoLoiModal] = useState('');

  const fetchDanhSach = async (pageIndex = trang, keyword = tuKhoa) => {
    setDangTai(true);
    try {
      const token = localStorage.getItem('access_token');
      const queryParams = new URLSearchParams({
        page: pageIndex.toString(),
        limit: '10',
      });
      if (keyword.trim()) queryParams.append('tu_khoa', keyword.trim());

      const response = await fetch(getApiUrl(`/api/v1/gioi-thieu?${queryParams.toString()}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        showError('Hết phiên đăng nhập', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        router.push('/dang-nhap');
        return;
      }

      if (response.status === 403) {
        showError('Không có quyền', 'Bạn không có quyền thực hiện thao tác này.');
        return;
      }

      const result = await response.json();
      if (result.thanh_cong) {
        const items = Array.isArray(result.du_lieu)
          ? result.du_lieu
          : result.du_lieu?.danh_sach || [];
        setDanhSach(items);
        setTongSoTrang(result.tong_so_trang || result.du_lieu?.tong_so_trang || 1);
        setTongSo(result.tong_so || result.du_lieu?.tong_so || items.length);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách giới thiệu:', error);
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    fetchDanhSach(trang, tuKhoa);
  }, [trang]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrang(1);
    fetchDanhSach(1, tuKhoa);
  };

  const handleUploadAnhNen = async (e: React.ChangeEvent<HTMLInputElement>, isSua = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    setDangUploadAnh(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(getApiUrl('/api/v1/tep-tin/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      const imageUrl = result.du_lieu?.url || result.du_lieu?.duong_dan;
      if (result.thanh_cong && imageUrl) {
        if (isSua) {
          setFormSua((prev) => ({ ...prev, anh_nen: imageUrl }));
        } else {
          setFormTao((prev) => ({ ...prev, anh_nen: imageUrl }));
        }
        showSuccess('Tải ảnh thành công', 'Ảnh nền đã được tải lên máy chủ.');
      } else {
        showError('Tải ảnh thất bại', result.thong_bao || result.message || 'Không thể tải ảnh lên.');
      }
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      showError('Lỗi kết nối', 'Không thể tải tệp lên máy chủ.');
    } finally {
      setDangUploadAnh(false);
    }
  };

  const submitTao = async (e: React.FormEvent) => {
    e.preventDefault();
    setThongBaoLoiModal('');

    if (!formTao.tieu_de_chinh.trim()) {
      setThongBaoLoiModal('Vui lòng nhập Tiêu đề chính.');
      return;
    }

    if (!formTao.noi_dung_chinh.trim()) {
      setThongBaoLoiModal('Vui lòng nhập Nội dung chi tiết bài giới thiệu.');
      return;
    }

    setDangXuLyModal(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(getApiUrl('/api/v1/gioi-thieu'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formTao),
      });

      const result = await response.json();
      if (result.thanh_cong) {
        setShowModalTao(false);
        setFormTao({
          tieu_de_chinh: '',
          tieu_de_phu: '',
          anh_nen: '',
          noi_dung_chinh: '',
          trang_thai: true,
        });
        showSuccess('Thêm mới thành công', 'Nội dung giới thiệu mới đã được tạo.');
        fetchDanhSach(1);
      } else {
        setThongBaoLoiModal(result.thong_bao || 'Tạo bài giới thiệu thất bại.');
        showError('Thao tác thất bại', result.thong_bao || 'Không thể tạo bài giới thiệu.');
      }
    } catch (error) {
      console.error('Lỗi tạo bài giới thiệu:', error);
      setThongBaoLoiModal('Không thể kết nối máy chủ.');
      showError('Thao tác thất bại', 'Không thể kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  const openModalSua = (item: GioiThieuItem) => {
    setSelectedItem(item);
    setFormSua({
      tieu_de_chinh: item.tieu_de_chinh || '',
      tieu_de_phu: item.tieu_de_phu || '',
      anh_nen: item.anh_nen || '',
      noi_dung_chinh: item.noi_dung_chinh || '',
      trang_thai: item.trang_thai ?? true,
    });
    setThongBaoLoiModal('');
    setShowModalSua(true);
  };

  const submitSua = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setThongBaoLoiModal('');

    if (!formSua.tieu_de_chinh.trim()) {
      setThongBaoLoiModal('Vui lòng nhập Tiêu đề chính.');
      return;
    }

    if (!formSua.noi_dung_chinh.trim()) {
      setThongBaoLoiModal('Vui lòng nhập Nội dung chi tiết bài giới thiệu.');
      return;
    }

    setDangXuLyModal(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(getApiUrl(`/api/v1/gioi-thieu/${selectedItem.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formSua),
      });

      const result = await response.json();
      if (result.thanh_cong) {
        setShowModalSua(false);
        setSelectedItem(null);
        showSuccess('Cập nhật thành công', 'Thông tin giới thiệu đã được lưu.');
        fetchDanhSach(trang);
      } else {
        setThongBaoLoiModal(result.thong_bao || 'Cập nhật thất bại.');
        showError('Thao tác thất bại', result.thong_bao || 'Cập nhật thất bại.');
      }
    } catch (error) {
      console.error('Lỗi cập nhật bài giới thiệu:', error);
      setThongBaoLoiModal('Không thể kết nối máy chủ.');
      showError('Thao tác thất bại', 'Không thể kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  const submitDoiTrangThai = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(getApiUrl(`/api/v1/gioi-thieu/${id}/trang-thai`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trang_thai: !currentStatus }),
      });

      const result = await response.json();
      if (result.thanh_cong) {
        showSuccess('Cập nhật trạng thái thành công', result.thong_bao);
        fetchDanhSach(trang);
      } else {
        showError('Đổi trạng thái thất bại', result.thong_bao);
      }
    } catch (error) {
      console.error('Lỗi đổi trạng thái:', error);
      showError('Thao tác thất bại', 'Lỗi kết nối máy chủ.');
    }
  };

  const submitXoa = async () => {
    if (!selectedItem) return;
    setDangXuLyModal(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(getApiUrl(`/api/v1/gioi-thieu/${selectedItem.id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.thanh_cong) {
        setShowModalXoa(false);
        setSelectedItem(null);
        showSuccess('Xóa thành công', 'Dữ liệu đã được xóa.');
        fetchDanhSach(trang);
      } else {
        showError('Xóa thất bại', result.thong_bao || 'Không thể xóa dữ liệu.');
      }
    } catch (error) {
      console.error('Lỗi xóa bài giới thiệu:', error);
      showError('Thao tác thất bại', 'Không thể kết nối máy chủ.');
    } finally {
      setDangXuLyModal(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors p-5 rounded-2xl">
            <div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/quan-tri')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
                >
                  ← Tổng quan Quản trị
                </button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Giới thiệu chung</h1>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">
                TRƯỜNG THCS ĐÔNG QUANG – MODULE QUẢN TRỊ NỘI DUNG CMS (/gioi-thieu)
              </p>
            </div>

            {hasPermission(user, 'gioi_thieu_tao') && (
              <button
                onClick={() => {
                  setFormTao({
                    tieu_de_chinh: 'TRƯỜNG THCS ĐÔNG QUANG',
                    tieu_de_phu: 'PHƯỜNG ĐÔNG QUANG',
                    anh_nen: '',
                    noi_dung_chinh: '',
                    trang_thai: true,
                  });
                  setThongBaoLoiModal('');
                  setShowModalTao(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#E97036] hover:bg-[#D85F25] text-white font-bold text-xs transition shadow-lg flex items-center gap-2 self-start md:self-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Thêm giới thiệu</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
            <input
              type="text"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Nhập tiêu đề hoặc nội dung cần tìm..."
              className="flex-1 min-w-[240px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
            >
              Tìm kiếm
            </button>
          </form>

          {/* Table Danh sách */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-2xl overflow-hidden shadow-xl">
            {dangTai ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">Đang tải danh sách bản ghi giới thiệu...</div>
            ) : danhSach.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                Chưa có bản ghi giới thiệu nào. Nhấn &quot;+ Thêm giới thiệu&quot; để tạo nội dung CMS cho trang /gioi-thieu.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="p-3.5">Tiêu đề chính</th>
                      <th className="p-3.5">Tiêu đề phụ</th>
                      <th className="p-3.5">Ảnh nền</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5">Ngày cập nhật</th>
                      <th className="p-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {danhSach.map((item) => (
                      <tr key={item.id} className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                          {item.tieu_de_chinh}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400 font-medium max-w-[180px] truncate">
                          {item.tieu_de_phu || '-'}
                        </td>
                        <td className="p-3.5">
                          {item.anh_nen ? (
                            <img
                              src={getMediaUrl(item.anh_nen)}
                              alt="Banner"
                              className="w-16 h-9 object-cover rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm"
                            />
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Mặc định</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => submitDoiTrangThai(item.id, item.trang_thai)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                              item.trang_thai
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {item.trang_thai ? '✓ Hiển thị' : '✕ Ẩn'}
                          </button>
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                          {new Date(item.ngay_cap_nhat).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            title="Xem chi tiết"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowModalXem(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
                          >
                            Xem
                          </button>
                          {hasPermission(user, 'gioi_thieu_sua') && (
                            <button
                              title="Sửa"
                              onClick={() => openModalSua(item)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition shadow-sm"
                            >
                              Sửa
                            </button>
                          )}
                          {hasPermission(user, 'gioi_thieu_xoa') && (
                            <button
                              title="Xóa"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowModalXoa(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition shadow-sm"
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
                <div>Tổng số <strong className="text-slate-900 dark:text-white font-bold">{tongSo}</strong> bản ghi</div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={trang <= 1}
                    onClick={() => setTrang(trang - 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-medium"
                  >
                    ← Trước
                  </button>
                  <span>Trang {trang} / {tongSoTrang}</span>
                  <button
                    disabled={trang >= tongSoTrang}
                    onClick={() => setTrang(trang + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-medium"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MODAL TẠO MỚI */}
          {showModalTao && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors rounded-2xl max-w-3xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Thêm nội dung Giới thiệu chung mới</h2>

                {thongBaoLoiModal && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                    {thongBaoLoiModal}
                  </div>
                )}

                <form onSubmit={submitTao} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 dark:text-slate-300 mb-1 font-semibold">Tiêu đề chính *</label>
                      <input
                        type="text"
                        required
                        value={formTao.tieu_de_chinh}
                        onChange={(e) => setFormTao({ ...formTao, tieu_de_chinh: e.target.value })}
                        placeholder="Vd: TRƯỜNG THCS ĐÔNG QUANG"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#E97036]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 dark:text-slate-300 mb-1 font-semibold">Tiêu đề phụ / Mô tả ngắn Hero</label>
                      <input
                        type="text"
                        value={formTao.tieu_de_phu}
                        onChange={(e) => setFormTao({ ...formTao, tieu_de_phu: e.target.value })}
                        placeholder="Vd: PHƯỜNG ĐÔNG QUANG - THÀNH PHỐ THANH HÓA"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#E97036]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 dark:text-slate-300 mb-1 font-semibold">Ảnh nền Banner Hero (Tải tệp hoặc Nhập URL)</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadAnhNen(e, false)}
                          className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl flex-1"
                        />
                        {dangUploadAnh && <span className="text-slate-600 dark:text-slate-400 font-medium">Đang tải tệp...</span>}
                      </div>
                      <input
                        type="text"
                        value={formTao.anh_nen}
                        onChange={(e) => setFormTao({ ...formTao, anh_nen: e.target.value })}
                        placeholder="Vd: /uploads/banner-dq.png hoặc URL ảnh khác"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#E97036] font-mono text-xs"
                      />
                    </div>
                    {formTao.anh_nen && (
                      <div className="mt-2.5 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <img
                          src={getMediaUrl(formTao.anh_nen)}
                          alt="Preview Banner"
                          className="w-24 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                        />
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">✓ Đã gắn đường dẫn ảnh nền</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-800 dark:text-slate-300 mb-1 font-semibold">
                      Nội dung chi tiết phần &quot;QUÁ TRÌNH HÌNH THÀNH VÀ PHÁT TRIỂN&quot; *
                    </label>
                    <RichTextEditor
                      value={formTao.noi_dung_chinh}
                      onChange={(val) => setFormTao((prev) => ({ ...prev, noi_dung_chinh: val }))}
                      placeholder="Nhập nội dung chi tiết bài giới thiệu quá trình hình thành và phát triển nhà trường..."
                      minHeight="200px"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="trang_thai_tao"
                      checked={formTao.trang_thai}
                      onChange={(e) => setFormTao({ ...formTao, trang_thai: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#E97036] focus:ring-0"
                    />
                    <label htmlFor="trang_thai_tao" className="text-slate-800 dark:text-slate-300 font-semibold cursor-pointer">
                      Hiển thị ngay trên trang công khai (/gioi-thieu)
                    </label>
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
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
                      className="px-5 py-2 rounded-xl bg-[#E97036] hover:bg-[#D85F25] text-white font-bold transition shadow-md disabled:opacity-50"
                    >
                      {dangXuLyModal ? 'Đang lưu...' : 'Lưu bản ghi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL CHỈNH SỬA */}
          {showModalSua && selectedItem && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors rounded-2xl max-w-3xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Chỉnh sửa Giới thiệu chung</h2>

                {thongBaoLoiModal && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                    {thongBaoLoiModal}
                  </div>
                )}

                <form onSubmit={submitSua} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 dark:text-slate-300 mb-1 font-semibold">Tiêu đề chính *</label>
                      <input
                        type="text"
                        required
                        value={formSua.tieu_de_chinh}
                        onChange={(e) => setFormSua({ ...formSua, tieu_de_chinh: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 dark:text-slate-300 mb-1 font-semibold">Tiêu đề phụ / Mô tả ngắn Hero</label>
                      <input
                        type="text"
                        value={formSua.tieu_de_phu}
                        onChange={(e) => setFormSua({ ...formSua, tieu_de_phu: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 dark:text-slate-300 mb-1 font-semibold">Thay đổi ảnh nền Banner Hero</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadAnhNen(e, true)}
                          className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl flex-1"
                        />
                        {dangUploadAnh && <span className="text-slate-600 dark:text-slate-400 font-medium">Đang tải tệp...</span>}
                      </div>
                      <input
                        type="text"
                        value={formSua.anh_nen}
                        onChange={(e) => setFormSua({ ...formSua, anh_nen: e.target.value })}
                        placeholder="Vd: /uploads/banner-dq.png hoặc URL ảnh khác"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#E97036] font-mono text-xs"
                      />
                    </div>
                    {formSua.anh_nen && (
                      <div className="mt-2.5 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <img
                          src={getMediaUrl(formSua.anh_nen)}
                          alt="Preview Banner"
                          className="w-24 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                        />
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">✓ Đã gắn đường dẫn ảnh nền</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-800 dark:text-slate-300 mb-1 font-semibold">
                      Nội dung chi tiết phần &quot;QUÁ TRÌNH HÌNH THÀNH VÀ PHÁT TRIỂN&quot; *
                    </label>
                    <RichTextEditor
                      value={formSua.noi_dung_chinh}
                      onChange={(val) => setFormSua((prev) => ({ ...prev, noi_dung_chinh: val }))}
                      placeholder="Nhập nội dung chi tiết bài giới thiệu quá trình hình thành và phát triển nhà trường..."
                      minHeight="200px"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="trang_thai_sua"
                      checked={formSua.trang_thai}
                      onChange={(e) => setFormSua({ ...formSua, trang_thai: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#E97036] focus:ring-0"
                    />
                    <label htmlFor="trang_thai_sua" className="text-slate-800 dark:text-slate-300 font-semibold cursor-pointer">
                      Hiển thị trên trang công khai (/gioi-thieu)
                    </label>
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
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
                      className="px-5 py-2 rounded-xl bg-[#E97036] hover:bg-[#D85F25] text-white font-bold transition shadow-md disabled:opacity-50"
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
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết Giới thiệu chung</h3>
                  <button
                    onClick={() => setShowModalXem(false)}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-white font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-500 font-semibold">Tiêu đề chính: </span>
                    <strong className="text-slate-900 dark:text-white font-bold text-sm">{selectedItem.tieu_de_chinh}</strong>
                  </div>

                  {selectedItem.tieu_de_phu && (
                    <div>
                      <span className="text-slate-500 font-semibold">Tiêu đề phụ: </span>
                      <span className="text-slate-900 dark:text-white font-medium">{selectedItem.tieu_de_phu}</span>
                    </div>
                  )}

                  {selectedItem.anh_nen && (
                    <div>
                      <span className="block text-slate-500 font-semibold mb-1">Ảnh nền Hero:</span>
                      <img
                        src={getMediaUrl(selectedItem.anh_nen)}
                        alt="Banner"
                        className="max-h-48 w-full object-cover rounded-xl border border-slate-300 dark:border-slate-700 shadow-md"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <span className="block text-slate-500 font-semibold mb-1.5">Nội dung quá trình phát triển:</span>
                    <div
                      className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 max-h-60 overflow-y-auto leading-relaxed prose dark:prose-invert max-w-none text-xs"
                      dangerouslySetInnerHTML={{ __html: selectedItem.noi_dung_chinh }}
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModalXem(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition"
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
            itemName={selectedItem?.tieu_de_chinh || 'Bản ghi giới thiệu'}
            isDeleting={dangXuLyModal}
            onClose={() => {
              setShowModalXoa(false);
              setSelectedItem(null);
            }}
            onConfirm={submitXoa}
          />
        </main>
      </div>
    </div>
  );
}

export default function TrangQuanTriGioiThieu() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-sm">Đang tải...</div>}>
      <QuanTriGioiThieuContent />
    </Suspense>
  );
}
