'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';

interface UserInfo {
  ho_ten: string;
  email: string;
  vai_tro?: string[];
}

interface AdminHeaderProps {
  user?: UserInfo | null;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const handleLogout = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch(getApiUrl('/api/v1/xac-thuc/dang-xuat'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
    } catch (e) { }

    localStorage.removeItem('access_token');
    router.push('/dang-nhap');
  };

  const toggleSidebar = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('toggle-admin-sidebar'));
    }
  };

  // Helper ánh xạ mã vai trò sang tiếng Việt động
  const formatRoles = (roles?: string[]) => {
    if (!roles || roles.length === 0) return 'Người dùng';
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      QUAN_TRI_VIEN: 'Quản trị viên',
      BAN_GIAM_HIEU: 'Ban Giám hiệu',
      GIAO_VIEN: 'Giáo viên',
      BIEN_TAP_VIEN: 'Biên tập viên',
      NGUOI_XEM: 'Người xem',
    };

    return roles.map((r) => roleMap[r] || r).join(', ');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs transition-colors shadow-sm shrink-0">
      {/* Left Side: Logo / Header Title & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          title="Thu gọn / Mở rộng Sidebar"
          aria-label="Thu gọn hoặc mở rộng Sidebar"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition shrink-0"
        >
          <span className="text-base font-bold">☰</span>
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Cổng Quản trị Trường THCS Đông Quang
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium hidden sm:block">
            Hệ thống quản lý thông tin nhà trường & hạ tầng dữ liệu
          </p>
        </div>
      </div>

      {/* Right Side Utility Area: Notification & User Profile Dropdown */}
      <div className="flex items-center gap-2.5">
        {/* 🔔 Notification Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowUserDropdown(false);
            }}
            title="Thông báo hệ thống"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition relative"
          >
            <span className="text-base">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E97036] ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">Thông báo Hệ thống</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#E97036] text-[10px] font-semibold">Mới</span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">Chào mừng bạn trở lại!</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Hệ thống phân quyền & hạ tầng quản trị hoạt động bình thường.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 👤 User Account Profile Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifDropdown(false);
              }}
              className="flex items-center gap-2.5 p-1.5 sm:pr-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition"
            >
              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E97036] to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0 uppercase">
                {user.ho_ten ? user.ho_ten.charAt(0) : 'U'}
              </div>

              {/* User Info (Name & Dynamic Role) */}
              <div className="text-left hidden sm:block min-w-0">
                <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[120px] sm:max-w-[160px]">
                  {user.ho_ten}
                </div>
                <div className="text-[10px] font-semibold text-[#E97036] truncate">
                  {formatRoles(user.vai_tro)}
                </div>
              </div>

              <span className="text-[10px] text-slate-400 font-bold ml-0.5">▼</span>
            </button>

            {/* Account Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">{user.ho_ten}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{user.email}</div>
                  <div className="inline-block px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-[#E97036] text-[10px] font-bold mt-1">
                    {formatRoles(user.vai_tro)}
                  </div>
                </div>

                <div className="pt-1 space-y-1">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-semibold transition text-left flex items-center justify-between"
                  >
                    <span>Đăng xuất</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
