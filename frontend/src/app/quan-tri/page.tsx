'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { getApiUrl } from '@/lib/api';
import { hasPermission } from '@/lib/permission';

interface UserProfile {
  id: string;
  ho_ten: string;
  email: string;
  vai_tro: string[];
  quyen_han: string[];
}

export interface NhatKyLogItem {
  id: string;
  hanh_dong: string;
  doi_tuong?: string;
  doi_tuong_id?: string;
  noi_dung_cu?: string;
  noi_dung_moi?: string;
  dia_chi_ip?: string;
  thong_tin_thiet_bi?: string;
  mo_ta?: string;
  ngay_tao: string;
  nguoi_dung?: { ho_ten: string; email: string };
}

interface ThongKeData {
  tong_so_giao_vien: number;
  tong_so_hoc_sinh: number;
  tong_so_lop: number;
  tong_so_bai_viet: number;
  bai_viet_xuat_ban: number;
  bai_viet_nhap: number;
  bai_viet_cho_duyet: number;
  tong_so_thong_bao: number;
  thong_bao_hien_thi: number;
  thong_bao_an: number;
  tong_so_van_ban: number;
  tong_so_video: number;
  tong_so_album: number;
  tong_so_thu_vien_so: number;
  nhat_ky_gan_day: NhatKyLogItem[];
  bai_viet_moi_nhat: {
    id: string;
    tieu_de: string;
    trang_thai: string;
    ngay_tao: string;
    danh_muc?: { ten: string };
  }[];
  thong_bao_moi_nhat: {
    id: string;
    tieu_de: string;
    trang_thai: boolean;
    ngay_tao: string;
  }[];
  van_ban_moi_nhat: {
    id: string;
    ten_van_ban: string;
    so_hieu: string;
    ngay_ban_hanh: string;
    loai_van_ban?: { ten: string };
  }[];
}

export default function TrangQuanTriDashboard() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [thongKe, setThongKe] = useState<ThongKeData | null>(null);
  const [dangTai, setDangTai] = useState(true);

  // State cho Giai đoạn 19.4 - Chế độ xem & Chi tiết Nhật ký Hoạt động
  const [isNhatKyView, setIsNhatKyView] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NhatKyLogItem | null>(null);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('ALL');
  const [logCurrentPage, setLogCurrentPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/dang-nhap');
      return;
    }

    // Fetch Auth User
    fetch(getApiUrl('/api/v1/xac-thuc/toi'), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setCurrentUser(data.du_lieu);
        } else {
          router.push('/dang-nhap');
        }
      })
      .catch(() => router.push('/dang-nhap'));

    // Fetch Live Statistics from API
    fetch(getApiUrl('/api/v1/kiem-tra/thong-ke'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setThongKe(data.du_lieu);
        }
      })
      .catch(() => {})
      .finally(() => setDangTai(false));
  }, [router]);

  // Đóng mở view Nhật ký hoạt động theo query URL
  useEffect(() => {
    const checkViewMode = () => {
      if (typeof window !== 'undefined') {
        const isNhatKy = window.location.search.includes('view=nhat-ky');
        setIsNhatKyView(isNhatKy);
        if (!isNhatKy) {
          setSelectedLog(null);
        }
      }
    };

    checkViewMode();
    const interval = setInterval(checkViewMode, 300);
    return () => clearInterval(interval);
  }, []);

  // Helper Icon cho hành động
  const getActionIcon = (action: string, target?: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('SUA') || act.includes('UPDATE')) {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    if (act.includes('XOA') || act.includes('DELETE')) {
      return (
        <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    }
    if (act.includes('TAO') || act.includes('CREATE') || act.includes('ADD')) {
      return (
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      );
    }
    if (act.includes('DANG_NHAP') || act.includes('LOGIN')) {
      return (
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      );
    }
    if (act.includes('DUYET') || act.includes('APPROVE')) {
      return (
        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (act.includes('KHOA') || act.includes('LOCK')) {
      return (
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-[#E97036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  };

  // Filter logs bên phải theo từ khóa và hành động
  const filteredLogs = (thongKe?.nhat_ky_gan_day || []).filter((log) => {
    if (logActionFilter !== 'ALL') {
      const act = (log.hanh_dong || '').toUpperCase();
      if (logActionFilter === 'TAO' && !act.includes('TAO') && !act.includes('ADD') && !act.includes('CREATE')) return false;
      if (logActionFilter === 'SUA' && !act.includes('SUA') && !act.includes('UPDATE')) return false;
      if (logActionFilter === 'XOA' && !act.includes('XOA') && !act.includes('DELETE')) return false;
      if (logActionFilter === 'DANG_NHAP' && !act.includes('DANG_NHAP') && !act.includes('LOGIN')) return false;
    }

    if (!logSearchTerm.trim()) return true;
    const term = logSearchTerm.toLowerCase();
    const userName = (log.nguoi_dung?.ho_ten || '').toLowerCase();
    const actionName = (log.hanh_dong || '').toLowerCase();
    const desc = (log.mo_ta || '').toLowerCase();
    return userName.includes(term) || actionName.includes(term) || desc.includes(term);
  });

  const logItemsPerPage = 10;
  const logTotalPages = Math.ceil(filteredLogs.length / logItemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (logCurrentPage - 1) * logItemsPerPage,
    logCurrentPage * logItemsPerPage
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar Navigation */}
      <AdminSidebar user={currentUser} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader user={currentUser} />

        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* KHÔNG CÓ QUYỀN XEM NHẬT KÝ HOẠT ĐỘNG */}
          {isNhatKyView && !hasPermission(currentUser, 'nhat_ky_xem') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-4 my-8">
              <div className="text-4xl">🔒</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Không có quyền truy cập</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Tài khoản của bạn không có quyền xem Nhật ký Hoạt động hệ thống. Vui lòng liên hệ Quản trị viên nếu cần cấp quyền này.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => router.push('/quan-tri')}
                  className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#d85f25] text-white font-bold text-xs transition shadow-md"
                >
                  ← Quay lại Dashboard Overview
                </button>
              </div>
            </div>
          )}

          {/* CÓ QUYỀN XEM NHẬT KÝ HOẠT ĐỘNG */}
          {isNhatKyView && hasPermission(currentUser, 'nhat_ky_xem') && (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push('/quan-tri')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700 transition"
                    >
                      ← Trở về Dashboard
                    </button>
                    <span className="text-xs text-slate-400">/ Nhật ký hoạt động</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-2 flex items-center gap-2">
                    <span>📜</span> Nhật Ký Hoạt Động Hệ Thống
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Theo dõi các hoạt động, thao tác thay đổi dữ liệu và lịch sử truy cập của người dùng trên toàn hệ thống.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-[#E97036] border border-orange-200 dark:border-orange-900/50 text-xs font-semibold">
                    Tổng số: {thongKe?.nhat_ky_gan_day?.length || 0} hoạt động
                  </span>
                </div>
              </div>

              {/* TRẠNG THÁI 3: KHI CLICK 1 LOG -> HIỂN THỊ CHI TIẾT LOG ĐÓ */}
              {selectedLog ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                  {/* Top Action Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-2"
                    >
                      ← Quay lại danh sách nhật ký
                    </button>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold">
                      Chi tiết nhật ký ID: {selectedLog.id.substring(0, 8)}...
                    </span>
                  </div>

                  {/* Summary Banner */}
                  <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#E97036] flex items-center justify-center text-xl shrink-0 mt-0.5">
                      {getActionIcon(selectedLog.hanh_dong, selectedLog.doi_tuong)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {selectedLog.hanh_dong}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Người thực hiện: <strong className="text-slate-900 dark:text-white">{selectedLog.nguoi_dung?.ho_ten || 'Hệ thống'}</strong> {selectedLog.nguoi_dung?.email ? `(${selectedLog.nguoi_dung.email})` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Real Data Field Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase">Người thực hiện</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedLog.nguoi_dung?.ho_ten || 'Hệ thống'}</div>
                      <div className="text-xs text-slate-500 font-medium">{selectedLog.nguoi_dung?.email || 'N/A'}</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase">Hành động & Đối tượng</div>
                      <div className="font-bold text-[#E97036] text-sm">{selectedLog.hanh_dong}</div>
                      <div className="text-xs text-slate-500 font-medium">Đối tượng: {selectedLog.doi_tuong || 'Hệ thống'} {selectedLog.doi_tuong_id ? `(ID: ${selectedLog.doi_tuong_id})` : ''}</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase">Thời gian thực hiện</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{new Date(selectedLog.ngay_tao).toLocaleString('vi-VN')}</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase">Mã định danh nhật ký</div>
                      <div className="font-mono text-slate-700 dark:text-slate-300 font-semibold text-xs">{selectedLog.id}</div>
                    </div>

                    {selectedLog.dia_chi_ip && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase">Địa chỉ IP</div>
                        <div className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{selectedLog.dia_chi_ip}</div>
                      </div>
                    )}

                    {selectedLog.thong_tin_thiet_bi && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase">Thiết bị & Trình duyệt (User Agent)</div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">{selectedLog.thong_tin_thiet_bi}</div>
                      </div>
                    )}
                  </div>

                  {/* Description / Content Metadata */}
                  {selectedLog.mo_ta && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Mô tả thông tin chi tiết:</div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {selectedLog.mo_ta}
                      </div>
                    </div>
                  )}

                  {selectedLog.noi_dung_cu && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Dữ liệu trước thay đổi (JSON):</div>
                      <pre className="p-4 bg-slate-950 text-slate-300 rounded-xl text-[11px] font-mono overflow-x-auto border border-slate-800">
                        {selectedLog.noi_dung_cu}
                      </pre>
                    </div>
                  )}

                  {selectedLog.noi_dung_moi && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Dữ liệu sau thay đổi (JSON):</div>
                      <pre className="p-4 bg-slate-950 text-slate-300 rounded-xl text-[11px] font-mono overflow-x-auto border border-slate-800">
                        {selectedLog.noi_dung_moi}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                /* TRẠNG THÁI 2: KHI CLICK "NHẬT KÝ HOẠT ĐỘNG" -> HIỂN THỊ DANH SÁCH LOGS */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex-1 min-w-[240px]">
                      <input
                        type="text"
                        placeholder="Tìm kiếm người dùng, hành động, mô tả..."
                        value={logSearchTerm}
                        onChange={(e) => setLogSearchTerm(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:border-[#E97036]"
                      />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {['ALL', 'TAO', 'SUA', 'XOA', 'DANG_NHAP'].map((filterKey) => (
                        <button
                          key={filterKey}
                          onClick={() => setLogActionFilter(filterKey)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                            logActionFilter === filterKey
                              ? 'bg-[#E97036] text-white shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {filterKey === 'ALL' && 'Tất cả'}
                          {filterKey === 'TAO' && 'Tạo mới'}
                          {filterKey === 'SUA' && 'Chỉnh sửa'}
                          {filterKey === 'XOA' && 'Xóa'}
                          {filterKey === 'DANG_NHAP' && 'Đăng nhập'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Log Items */}
                  {filteredLogs.length > 0 ? (
                    <div className="space-y-4">
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        {paginatedLogs.map((log) => (
                          <div
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className="p-4 bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between gap-4 text-xs group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-500/10 shrink-0">
                                {getActionIcon(log.hanh_dong, log.doi_tuong)}
                              </div>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 flex-wrap">
                                  <span>{log.nguoi_dung?.ho_ten || 'Hệ thống'}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#E97036] text-[11px] font-semibold">
                                    {log.hanh_dong}
                                  </span>
                                </div>
                                {log.mo_ta && (
                                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1">
                                    {log.mo_ta}
                                  </div>
                                )}
                                {log.doi_tuong && (
                                  <div className="text-[11px] text-slate-400 font-medium">
                                    Đối tượng: {log.doi_tuong}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 text-right">
                              <span className="text-slate-400 font-medium text-[11px]">
                                {new Date(log.ngay_tao).toLocaleString('vi-VN')}
                              </span>
                              <span className="text-[#E97036] font-semibold text-xs group-hover:translate-x-1 transition-transform">
                                Chi tiết →
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Control phân trang khi danh sách nhật ký quá 10 bản ghi */}
                      {logTotalPages > 1 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            Hiển thị 10 / tổng số <strong>{filteredLogs.length}</strong> nhật ký hoạt động
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={logCurrentPage <= 1}
                              onClick={() => setLogCurrentPage((prev) => Math.max(1, prev - 1))}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 font-bold text-slate-700 dark:text-slate-200 transition"
                            >
                              ← Trước
                            </button>
                            <span className="px-3 py-1.5 font-bold text-[#E97036]">
                              Trang {logCurrentPage} / {logTotalPages}
                            </span>
                            <button
                              disabled={logCurrentPage >= logTotalPages}
                              onClick={() => setLogCurrentPage((prev) => Math.min(logTotalPages, prev + 1))}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 font-bold text-slate-700 dark:text-slate-200 transition"
                            >
                              Sau →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-xs text-slate-400 font-medium italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Không có dữ liệu nhật ký hoạt động phù hợp.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TRẠNG THÁI 1: TRANG DASHBOARD TỔNG QUAN (DEFAULT OVERVIEW) */}
          {!isNhatKyView && (
            <div className="space-y-6">
              {/* Top Banner / Welcome Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Tổng Quan Cổng Thông Tin Trường THCS Đông Quang
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Quản lý tập trung hồ sơ nhà trường, giáo viên, học sinh, tin tức bài viết và hạ tầng dữ liệu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 text-xs font-semibold">
                    ● Hệ thống Sẵn sàng
                  </span>
                </div>
              </div>

              {/* Statistics Metric Cards */}
              {thongKe && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Thống kê Tổng quan Hệ thống
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div onClick={() => router.push('/quan-tri/giao-vien')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] dark:hover:border-[#E97036] rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Giáo viên</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{thongKe.tong_so_giao_vien}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Hồ sơ công tác</div>
                    </div>

                    <div onClick={() => router.push('/quan-tri/hoc-sinh')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] dark:hover:border-[#E97036] rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Học sinh</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-cyan-400">{thongKe.tong_so_hoc_sinh}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Đang theo học</div>
                    </div>

                    <div onClick={() => router.push('/quan-tri/lop-hoc')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] dark:hover:border-[#E97036] rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Lớp học</div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{thongKe.tong_so_lop}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Khối 6 – 9</div>
                    </div>

                    <div onClick={() => router.push('/quan-tri/bai-viet')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] dark:hover:border-[#E97036] rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Bài viết</div>
                      <div className="text-2xl font-bold text-[#E97036]">{thongKe.tong_so_bai_viet}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Tin tức bài viết</div>
                    </div>

                    <div onClick={() => router.push('/quan-tri/thong-bao')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] dark:hover:border-[#E97036] rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Thông báo</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{thongKe.tong_so_thong_bao}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Thông báo trường</div>
                    </div>

                    <div onClick={() => router.push('/quan-tri/van-ban')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] dark:hover:border-[#E97036] rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Văn bản</div>
                      <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{thongKe.tong_so_van_ban}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Văn bản chỉ đạo</div>
                    </div>

                    <div onClick={() => router.push('/quan-tri/video')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] dark:hover:border-[#E97036] rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Video</div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{thongKe.tong_so_video ?? 0}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Thư viện Video</div>
                    </div>

                    <div onClick={() => router.push('/quan-tri/thu-vien-anh')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] dark:hover:border-[#E97036] rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Album ảnh</div>
                      <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{thongKe.tong_so_album ?? 0}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Thư viện ảnh</div>
                    </div>

                    <div onClick={() => router.push('/quan-tri/thu-vien-so')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] dark:hover:border-[#E97036] rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-1 col-span-2 sm:col-span-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Thư viện số</div>
                      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{thongKe.tong_so_thu_vien_so ?? 0}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Tài liệu học tập</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Website Content Overview & Status Breakdown */}
              {thongKe && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Card 1: Phân loại Bài viết */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>📰</span> Quản Lý Tin Tức & Bài Viết
                      </h4>
                      <button onClick={() => router.push('/quan-tri/bai-viet')} className="text-[11px] font-semibold text-[#E97036] hover:underline">
                        Xem chi tiết →
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Đã xuất bản</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold">{thongKe.bai_viet_xuat_ban ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Bản nháp</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold">{thongKe.bai_viet_nhap ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Chờ duyệt</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold">{thongKe.bai_viet_cho_duyet ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Phân loại Thông báo */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>📢</span> Quản Lý Thông Báo
                      </h4>
                      <button onClick={() => router.push('/quan-tri/thong-bao')} className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                        Xem chi tiết →
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Đang hiển thị</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold">{thongKe.thong_bao_hien_thi ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Đã ẩn / Tạm ngưng</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 font-semibold">{thongKe.thong_bao_an ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Tổng thông báo</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 font-semibold">{thongKe.tong_so_thong_bao ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Thư viện & Đa phương tiện */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>🎬</span> Thư Viện Đa Phương Tiện
                      </h4>
                      <button onClick={() => router.push('/quan-tri/thu-vien-so')} className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                        Xem chi tiết →
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Video giới thiệu</span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 font-semibold">{thongKe.tong_so_video ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Album hình ảnh</span>
                        <span className="px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-500/10 text-pink-800 dark:text-pink-400 font-semibold">{thongKe.tong_so_album ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Tài liệu Thư viện số</span>
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-500/10 text-teal-800 dark:text-teal-400 font-semibold">{thongKe.tong_so_thu_vien_so ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}