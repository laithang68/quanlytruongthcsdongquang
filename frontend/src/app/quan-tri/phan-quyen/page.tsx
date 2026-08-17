'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { isSystemAdmin } from '@/lib/permission';
import { getApiUrl } from '@/lib/api';
import { useToast } from '@/components/admin/ToastContext';

interface VaiTro {
  id: string;
  ma: string;
  ten: string;
  mo_ta: string | null;
}

interface ModuleDefinition {
  ma: string;
  ten: string;
  href: string;
}

interface QuyenHan {
  id: string;
  ma: string;
  ten: string;
  mo_ta: string | null;
}

interface ActionColumn {
  key: string;
  suffix: string;
  label: string;
}

const ACTION_COLUMNS: ActionColumn[] = [
  { key: 'VIEW', suffix: 'xem', label: 'XEM' },
  { key: 'CREATE', suffix: 'tao', label: 'THÊM' },
  { key: 'UPDATE', suffix: 'sua', label: 'SỬA' },
  { key: 'DELETE', suffix: 'xoa', label: 'XÓA' },
  { key: 'APPROVE', suffix: 'duyet', label: 'DUYỆT' },
  { key: 'PUBLISH', suffix: 'xuat_ban', label: 'XB' },
  { key: 'UPLOAD', suffix: 'upload', label: 'UPLOAD' },
  { key: 'EXPORT', suffix: 'xuat_excel', label: 'EXPORT' },
];

export default function QuanLyPhanQuyenPage() {
  const { showSuccess, showError } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [daKiemTraUser, setDaKiemTraUser] = useState(false);

  const [danhSachVaiTro, setDanhSachVaiTro] = useState<VaiTro[]>([]);
  const [danhSachModule, setDanhSachModule] = useState<ModuleDefinition[]>([]);
  const [danhSachQuyenHan, setDanhSachQuyenHan] = useState<QuyenHan[]>([]);
  const [maTranQuyen, setMaTranQuyen] = useState<Record<string, string[]>>({});

  const [selectedRoleMa, setSelectedRoleMa] = useState<string>('QUAN_TRI_VIEN');
  const [currentSelectedPerms, setCurrentSelectedPerms] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBao, setThongBao] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Kiểm tra Người dùng đăng nhập từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nguoi_dung');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Lỗi khi đọc người dùng từ localStorage:', e);
    } finally {
      setDaKiemTraUser(true);
    }
  }, []);

  // 2. Tải Ma trận Quyền từ Backend API
  const fetchMaTran = async () => {
    setLoading(true);
    setThongBao(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(getApiUrl('/api/v1/phan-quyen/ma-tran'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.thanh_cong) {
        const { vai_tro, modules, quyen_han, ma_tran } = json.du_lieu;
        setDanhSachVaiTro(vai_tro || []);
        setDanhSachModule(modules || []);
        setDanhSachQuyenHan(quyen_han || []);
        setMaTranQuyen(ma_tran || {});

        // Set initial perms for selected role
        const initialRole = selectedRoleMa || (vai_tro[0] ? vai_tro[0].ma : 'QUAN_TRI_VIEN');
        setSelectedRoleMa(initialRole);
        setCurrentSelectedPerms(new Set(ma_tran[initialRole] || []));
      }
    } catch (error: any) {
      console.error('Lỗi khi tải ma trận quyền:', error);
      setThongBao({
        type: 'error',
        message: 'Không thể tải dữ liệu phân quyền. Vui lòng kiểm tra kết nối API.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (daKiemTraUser) {
      fetchMaTran();
    }
  }, [daKiemTraUser]);

  // Cập nhật state perms khi đổi Vai trò trong Tab
  const handleSelectRole = (roleMa: string) => {
    setSelectedRoleMa(roleMa);
    setCurrentSelectedPerms(new Set(maTranQuyen[roleMa] || []));
    setThongBao(null);
  };

  // Kiểm tra 1 mã quyền có tồn tại trong CSDL không
  const isPermExistInDb = (permCode: string) => {
    return danhSachQuyenHan.some((q) => q.ma === permCode);
  };

  // Toggle single permission checkbox
  const handleTogglePerm = (permCode: string) => {
    if (selectedRoleMa === 'SUPER_ADMIN') return; // Phế duyệt chỉnh sửa SUPER_ADMIN

    setCurrentSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permCode)) {
        next.delete(permCode);
      } else {
        next.add(permCode);
      }
      return next;
    });
  };

  // Chọn tất cả quyền khả dụng cho vai trò hiện tại
  const handleSelectAll = () => {
    if (selectedRoleMa === 'SUPER_ADMIN') return;
    const allAvailable = new Set<string>();
    danhSachModule.forEach((mod) => {
      ACTION_COLUMNS.forEach((col) => {
        const permCode = `${mod.ma}_${col.suffix}`;
        if (isPermExistInDb(permCode)) {
          allAvailable.add(permCode);
        }
      });
    });
    setCurrentSelectedPerms(allAvailable);
  };

  // Bỏ chọn tất cả
  const handleDeselectAll = () => {
    if (selectedRoleMa === 'SUPER_ADMIN') return;
    setCurrentSelectedPerms(new Set());
  };

  // Khôi phục lại trạng thái ban đầu
  const handleReset = () => {
    setCurrentSelectedPerms(new Set(maTranQuyen[selectedRoleMa] || []));
    setThongBao(null);
  };

  // Lưu ma trận quyền về Backend API
  const handleSavePermissions = async () => {
    if (selectedRoleMa === 'SUPER_ADMIN') return;

    setDangLuu(true);
    setThongBao(null);
    try {
      const roleObj = danhSachVaiTro.find((r) => r.ma === selectedRoleMa);
      if (!roleObj) throw new Error('Không tìm thấy thông tin vai trò');

      const token = localStorage.getItem('access_token');
      const res = await fetch(getApiUrl(`/api/v1/phan-quyen/vai-tro/${roleObj.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quyen_han_mas: Array.from(currentSelectedPerms),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.thanh_cong) {
        throw new Error(json.message || json.thong_bao || 'Cập nhật thất bại');
      }

      showSuccess('Lưu thành công', `Đã lưu ma trận quyền thành công cho vai trò "${roleObj.ten}".`);
      setThongBao({
        type: 'success',
        message: `Đã lưu ma trận quyền thành công cho vai trò "${roleObj.ten}".`,
      });

      // Cập nhật lại state ma trận toàn cục
      setMaTranQuyen((prev) => ({
        ...prev,
        [selectedRoleMa]: Array.from(currentSelectedPerms),
      }));
    } catch (error: any) {
      showError('Lưu thất bại', error.message || 'Lỗi khi lưu quyền hạn.');
      setThongBao({
        type: 'error',
        message: error.message || 'Lỗi khi lưu quyền hạn.',
      });
    } finally {
      setDangLuu(false);
    }
  };

  // 3. Kiểm tra Route Guard
  const hasAccess = isSystemAdmin(currentUser) || currentUser?.quyen_han?.includes('phan_quyen_xem');

  if (daKiemTraUser && !hasAccess) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md text-center shadow-2xl space-y-4">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                🔒
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Không có quyền truy cập</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tài khoản của bạn không có quyền truy cập chức năng <span className="font-semibold text-rose-500">Phân quyền Hệ thống</span>. Vui lòng liên hệ Quản trị tối cao nếu bạn cần quyền hạn này.
              </p>
              <a
                href="/quan-tri"
                className="inline-block px-5 py-2.5 bg-[#E97036] hover:bg-[#d65f27] text-white text-xs font-semibold rounded-xl transition shadow"
              >
                ← Quay lại Trang Tổng quan
              </a>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const selectedRole = danhSachVaiTro.find((r) => r.ma === selectedRoleMa);
  const isSuperAdminRole = selectedRoleMa === 'SUPER_ADMIN';

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TIÊU ĐỀ HỆ THỐNG */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔑</span> PHÂN QUYỀN HỆ THỐNG (RBAC)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Quản lý vai trò và phân quyền hành động chi tiết theo từng Menu / Module quản trị
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Tổng số Module: <strong className="text-[#E97036]">{danhSachModule.length}</strong>
              </span>
              <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Tổng số Quyền hạn: <strong className="text-[#E97036]">{danhSachQuyenHan.length}</strong>
              </span>
            </div>
          </div>

          {/* THÔNG BÁO RESULT */}
          {thongBao && (
            <div
              className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all shadow-sm ${
                thongBao.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              <span>{thongBao.message}</span>
              <button
                onClick={() => setThongBao(null)}
                className="text-xs opacity-70 hover:opacity-100 ml-4 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB CHỌN VAI TRÒ */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>👥</span> Chọn vai trò cần phân quyền:
              </label>
              {isSuperAdminRole && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  🔒 TOÀN QUYỀN TỐI CAO (CỐ ĐỊNH)
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {danhSachVaiTro.map((role) => {
                const isActive = selectedRoleMa === role.ma;
                const isSuper = role.ma === 'SUPER_ADMIN';

                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role.ma)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#E97036] text-white border-[#E97036] shadow-md shadow-[#E97036]/20'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{isSuper ? '👑' : '👤'}</span>
                    <span>{role.ten}</span>
                    <span className="opacity-60 text-[10px] font-mono">({role.ma})</span>
                  </button>
                );
              })}
            </div>

            {selectedRole && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800/60">
                Mô tả vai trò: {selectedRole.mo_ta || 'Không có mô tả'}
              </p>
            )}
          </div>

          {/* BẢNG MA TRẬN PHÂN QUYỀN */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            {/* TOOLBAR THAO TÁC NHANH */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSuperAdminRole || loading}
                  onClick={handleSelectAll}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition shadow-sm"
                >
                  ☑ Chọn tất cả
                </button>
                <button
                  type="button"
                  disabled={isSuperAdminRole || loading}
                  onClick={handleDeselectAll}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition shadow-sm"
                >
                  ☐ Bỏ chọn tất cả
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleReset}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                >
                  ↺ Hủy thay đổi
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Đã chọn: <strong className="text-[#E97036] font-bold">{isSuperAdminRole ? 'TẤT CẢ' : currentSelectedPerms.size}</strong> quyền
                </span>
                <button
                  type="button"
                  disabled={isSuperAdminRole || dangLuu || loading}
                  onClick={handleSavePermissions}
                  className="px-5 py-2 rounded-xl bg-[#E97036] hover:bg-[#d65f27] text-white font-bold transition shadow-md shadow-[#E97036]/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {dangLuu ? 'Đang lưu...' : '💾 Lưu ma trận quyền'}
                </button>
              </div>
            </div>

            {/* BẢNG CHÍNH */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4 w-64 min-w-[220px]">MENU / MODULE QUẢN TRỊ</th>
                    {ACTION_COLUMNS.map((col) => (
                      <th key={col.key} className="py-3.5 px-3 text-center min-w-[70px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{col.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">_{col.suffix}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        Đang tải dữ liệu ma trận phân quyền...
                      </td>
                    </tr>
                  ) : (
                    danhSachModule.map((mod, index) => (
                      <tr
                        key={mod.ma}
                        className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60 ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {mod.ten}
                        </td>

                        {ACTION_COLUMNS.map((col) => {
                          const permCode = `${mod.ma}_${col.suffix}`;
                          const isExist = isPermExistInDb(permCode);
                          const isChecked = isSuperAdminRole || currentSelectedPerms.has(permCode);

                          return (
                            <td key={col.key} className="py-3 px-3 text-center">
                              {isExist ? (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isSuperAdminRole}
                                  onChange={() => handleTogglePerm(permCode)}
                                  className="w-4 h-4 rounded text-[#E97036] focus:ring-[#E97036] dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer disabled:cursor-not-allowed"
                                />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700 text-xs font-mono">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER ACTION */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Ghi chú: Thay đổi ma trận quyền có hiệu lực ngay lập tức với các tài khoản người dùng tương ứng.
              </span>
              <button
                type="button"
                disabled={isSuperAdminRole || dangLuu || loading}
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-xl bg-[#E97036] hover:bg-[#d65f27] text-white font-bold transition shadow-md shadow-[#E97036]/20 disabled:opacity-50"
              >
                {dangLuu ? 'Đang lưu...' : '💾 Lưu ma trận quyền'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
