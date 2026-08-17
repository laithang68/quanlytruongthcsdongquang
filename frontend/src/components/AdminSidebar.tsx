'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getApiUrl } from '@/lib/api';

interface AdminSidebarProps {
  user?: {
    vai_tro?: string[];
    quyen_han?: string[];
  } | null;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [roles, setRoles] = useState<string[]>(user?.vai_tro || []);
  const [permissions, setPermissions] = useState<string[]>(user?.quyen_han || []);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    // Sync initial collapsed state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-collapsed') === 'true';
      setIsCollapsed(saved);
    }

    const handleToggle = () => {
      setIsCollapsed((prev) => {
        const next = !prev;
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin-sidebar-collapsed', String(next));
        }
        return next;
      });
    };

    window.addEventListener('toggle-admin-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-admin-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    if (user) {
      setRoles(user.vai_tro || []);
      setPermissions(user.quyen_han || []);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(getApiUrl('/api/v1/xac-thuc/toi'), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu) {
          setRoles(data.du_lieu.vai_tro || []);
          setPermissions(data.du_lieu.quyen_han || []);
        }
      })
      .catch(() => { });
  }, [user]);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('toggle-admin-sidebar'));
    }
  };

  const navItems = [
    { label: 'Tổng quan Hệ thống', href: '/quan-tri', icon: '📊', perm: 'tong_quan_xem' },
    { label: 'Giới thiệu chung', href: '/quan-tri/gioi-thieu', icon: '🏛️', perm: 'gioi_thieu_xem' },
    { label: 'Quản lý Người dùng', href: '/quan-tri/nguoi-dung', icon: '👥', perm: 'nguoi_dung_xem' },
    { label: 'Phân quyền Hệ thống', href: '/quan-tri/phan-quyen', icon: '🔑', perm: 'phan_quyen_xem' },
    { label: 'Quản lý Bài viết', href: '/quan-tri/bai-viet', icon: '📝', perm: 'bai_viet_xem' },
    { label: 'Quản lý Thông báo', href: '/quan-tri/thong-bao', icon: '📢', perm: 'thong_bao_xem' },
    { label: 'Quản lý Văn bản', href: '/quan-tri/van-ban', icon: '📄', perm: 'van_ban_xem' },
    { label: 'Quản lý Giáo viên', href: '/quan-tri/giao-vien', icon: '👨‍🏫', perm: 'giao_vien_xem' },
    { label: 'Quản lý Tổ chuyên môn', href: '/quan-tri/to-chuyen-mon', icon: '🏛️', perm: 'to_chuyen_mon_xem' },
    { label: 'Quản lý Lớp học', href: '/quan-tri/lop-hoc', icon: '🏫', perm: 'lop_hoc_xem' },
    { label: 'Quản lý Học sinh', href: '/quan-tri/hoc-sinh', icon: '🎓', perm: 'hoc_sinh_xem' },
    { label: 'Quản lý Phụ huynh', href: '/quan-tri/phu-huynh', icon: '👨‍👩‍👧', perm: 'phu_huynh_xem' },
    { label: 'Quản lý Video', href: '/quan-tri/video', icon: '📹', perm: 'video_xem' },
    { label: 'Quản lý Thư viện ảnh', href: '/quan-tri/thu-vien-anh', icon: '🖼️', perm: 'thu_vien_anh_xem' },
    { label: 'Quản lý Thư viện số', href: '/quan-tri/thu-vien-so', icon: '📚', perm: 'thu_vien_so_xem' },
    { label: 'QL Hoạt động & Sự kiện', href: '/quan-tri/hoat-dong', icon: '🎪', perm: 'hoat_dong_xem' },
    { label: 'Thông tin Phản ánh', href: '/quan-tri/phan-anh', icon: '✉️', perm: 'phan_anh_xem' },
    { label: 'Nhật ký Hoạt động', href: '/quan-tri?view=nhat-ky', icon: '📜', perm: 'nhat_ky_xem' },
  ];

  const isSuperOrAdmin = roles.includes('SUPER_ADMIN') || roles.includes('QUAN_TRI_VIEN');

  const visibleNavItems = navItems.filter((item) => {
    if (item.href === '/quan-tri') return true;
    if (isSuperOrAdmin) return true;
    if (!item.perm) return true;
    return permissions.includes(item.perm);
  });

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 h-screen sticky top-0 overflow-y-auto p-3 sm:p-4 flex flex-col justify-between text-xs transition-all duration-300 ease-in-out shrink-0 z-20 ${isCollapsed ? 'w-20 sm:w-20' : 'w-70'
        }`}
    >
      <div className="space-y-5">
        {/* Brand Logo & Toggle Button */}
        <div className="flex items-center justify-between">
          <div
            onClick={() => router.push('/')}
            className={`flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-slate-800 transition ${isCollapsed ? 'justify-center w-full' : ''
              }`}
            title="Trường THCS Đông Quang"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#E97036] to-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-base shadow-md shrink-0">
              ĐQ
            </div>
            {!isCollapsed && (
              <div className="min-w-9">
                <h2 className="font-bold text-white text-sm leading-tight truncate">TRƯỜNG THCS ĐÔNG QUANG</h2>
                <p className="text-[10px] text-slate-400 font-medium truncate">Trang Quản trị Hệ thống</p>
              </div>
            )}
          </div>

          {/* {!isCollapsed && (
            // <button
            //   onClick={toggleSidebar}
            //   title="Thu gọn Sidebar"
            //   className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs"
            // >
            // </button>
          //)
          */}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {!isCollapsed && (
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-3 mb-2 transition-opacity duration-200">
              Danh mục Quản trị
            </p>
          )}

          {visibleNavItems.map((item) => {
            const isNhatKyItem = item.href.includes('view=nhat-ky');
            const isDashboardItem = item.href === '/quan-tri';

            let isActive = false;
            if (typeof window !== 'undefined') {
              const currentSearch = window.location.search;
              if (isNhatKyItem) {
                isActive = pathname === '/quan-tri' && currentSearch.includes('view=nhat-ky');
              } else if (isDashboardItem) {
                isActive = pathname === '/quan-tri' && !currentSearch.includes('view=nhat-ky');
              } else {
                isActive = pathname === item.href;
              }
            } else {
              isActive = pathname === item.href;
            }

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 py-2.5 rounded-xl transition-colors duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-3'
                  } ${isActive
                    ? 'bg-[#E97036] text-white font-semibold shadow-sm'
                    : 'text-slate-300 font-medium hover:bg-[#E97036]/80 hover:text-white'
                  }`}
              >
                <span className={`text-white transition-transform ${isCollapsed ? 'text-base' : 'text-sm'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="text-white font-medium truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Back Link */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={() => router.push('/')}
          title="Trở về Trang chủ Public"
          className={`w-full py-2 rounded-xl bg-slate-800 hover:bg-[#E97036] text-white border border-slate-700 transition-colors duration-200 text-center font-medium text-xs flex items-center justify-center gap-2 ${isCollapsed ? 'px-0' : 'px-3'
            }`}
        >
          <span>←</span>
          {!isCollapsed && <span>Trở về Trang chủ </span>}
        </button>
      </div>
    </aside>
  );
}
