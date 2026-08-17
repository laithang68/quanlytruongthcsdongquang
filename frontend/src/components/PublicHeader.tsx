'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavLinkChild {
  name: string;
  href: string;
  isExternal?: boolean;
}

interface NavLink {
  name: string;
  href: string;
  hasDropdown?: boolean;
  children?: NavLinkChild[];
}

export default function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [tuKhoa, setTuKhoa] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  // States cho Animation Header & Nút cuộn trang
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(true);

  // High-performance scroll listener với requestAnimationFrame
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const fullHeight = document.documentElement.scrollHeight;

          // Hysteresis Buffer triệt tiêu hoàn toàn giật/lặp khi cuộn lên:
          // Cuộn xuống quá 120px -> Thu gọn Header
          // Cuộn ngược lên gần sát đầu trang (< 30px) -> Hiện lại Header đầy đủ mượt mà
          if (scrollY > 10) {
            setIsScrolled(true);
          } else if (scrollY < 10) {
            setIsScrolled(false);
          }

          // Chỉ hiển thị Nút Về Đầu Trang khi đã cuộn xuống (> 150px)
          setShowScrollTop(scrollY > 150);

          // Chỉ hiển thị Nút Về Cuối Trang khi ĐÃ CUỘN (> 150px) VÀ CHƯA ĐẾN CHÂN TRANG (< 250px)
          setShowScrollBottom(scrollY > 150 && scrollY + windowHeight < fullHeight - 250);

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Kiếm tra trạng thái ban đầu

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('school-theme') as 'dark' | 'light') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }

    const updateDateTime = () => {
      const now = new Date();
      const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayName = days[now.getDay()];
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentDateTime(`${dayName}, ${day}/${month}/${year} - ${hours}:${minutes}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('school-theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };

  const xuLyTimKiem = (e: React.FormEvent) => {
    e.preventDefault();
    if (tuKhoa.trim()) {
      router.push(`/tin-tuc?tu_khoa=${encodeURIComponent(tuKhoa.trim())}`);
    }
  };

  // Hàm cuộn mượt về đầu trang
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Hàm cuộn mượt về cuối trang
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  const navLinks: NavLink[] = [
    { name: 'TRANG CHỦ', href: '/' },
    {
      name: 'GIỚI THIỆU',
      href: '/gioi-thieu',
      hasDropdown: true,
      children: [
        { name: 'Giới thiệu chung', href: '/gioi-thieu' },
        { name: 'Cơ cấu tổ chức', href: '/to-chuc' },
        { name: 'Đội ngũ giáo viên', href: '/giao-vien' },
        { name: 'Tra cứu học sinh', href: '/tra-cuu-hoc-sinh' },
      ],
    },
    {
      name: 'TIN TỨC',
      href: '/tin-tuc',
      hasDropdown: true,
      children: [
        { name: 'Bảng tin Nhà trường', href: '/tin-tuc?danh_muc_slug=bang-tin' },
        { name: 'Hoạt động Đoàn - Đội', href: '/tin-tuc?danh_muc_slug=hoat-dong-doi-doan' },
        { name: 'Hoạt động Chuyên môn', href: '/tin-tuc?danh_muc_slug=hoat-dong-chuyen-mon' },
        { name: 'Hoạt động Câu lạc bộ', href: '/tin-tuc?danh_muc_slug=hoat-dong-cau-lac-bo' },
        { name: 'Hoạt động Thư viện', href: '/tin-tuc?danh_muc_slug=hoat-dong-thu-vien' },
      ],
    },
    {
      name: 'THÔNG BÁO',
      href: '/thong-bao',
      hasDropdown: true,
      children: [
        { name: 'Tất cả thông báo', href: '/thong-bao' },
        { name: 'Thông báo Nhà trường', href: '/thong-bao?phieu_loc=nha-truong' },
        { name: 'Lịch hoạt động', href: '/lich-hoat-dong' },
      ],
    },
    {
      name: 'VĂN BẢN',
      href: '/van-ban',
      hasDropdown: true,
      children: [
        { name: 'Tất cả văn bản', href: '/van-ban' },
        { name: 'Thông báo Nhà trường', href: '/van-ban?loai_van_ban_ma=thong-bao-nha-truong' },
        { name: 'Văn bản Phường / Xã', href: '/van-ban?loai_van_ban_ma=van-ban-phuong-xa' },
        { name: 'Văn bản Sở GD&ĐT', href: '/van-ban?loai_van_ban_ma=van-ban-so-gddt' },
        { name: 'Văn bản Bộ GD&ĐT', href: '/van-ban?loai_van_ban_ma=van-ban-bo-gddt' },
      ],
    },
    {
      name: 'ỨNG DỤNG',
      href: '#',
      hasDropdown: true,
      children: [
        { name: 'Ứng dụng vnEdu', href: 'https://vnedu.vn', isExternal: true },
        { name: 'Ứng dụng Tin học', href: 'https://csdl.moet.gov.vn', isExternal: true },
        { name: 'Ứng dụng Dịch vụ công', href: 'https://dichvucong.gov.vn', isExternal: true },
        { name: 'Cổng thông tin Phường', href: 'https://dongquang.thanhhoa.gov.vn', isExternal: true },
        { name: 'Cổng thông tin Thanh Hóa', href: 'https://thanhhoa.gov.vn', isExternal: true },
      ],
    },
    { name: 'VIDEO', href: '/video' },
    { name: 'THƯ VIỆN ẢNH', href: '/thu-vien-anh' },
    {
      name: 'THƯ VIỆN SỐ',
      href: '/thu-vien-so',
      hasDropdown: true,
      children: [
        { name: 'Tài liệu tham khảo', href: '/thu-vien-so?danh_muc_slug=tai-lieu-tham-khao' },
        { name: 'Sách giáo khoa điện tử', href: '/thu-vien-so?danh_muc_slug=sach-giao-khoa-dien-tu' },
        { name: 'Sách tham khảo', href: '/thu-vien-so?danh_muc_slug=sach-tham-khao' },
        { name: 'Tài liệu ôn HSG', href: '/thu-vien-so?danh_muc_slug=tai-lieu-on-hsg' },
        { name: 'Thư viện bài giảng', href: '/thu-vien-so?danh_muc_slug=thu-vien-bai-giang' },
        { name: 'Thư viện giáo án', href: '/thu-vien-so?danh_muc_slug=thu-vien-giao-an' },
      ],
    },
    { name: 'LIÊN HỆ', href: '/lien-he' },
  ];

  return (
    <>
      <header className="w-full border-b border-orange-700 bg-slate-950 sticky top-0 z-50 shadow-2xl transition-all duration-300">
        {/* 1 & 2. HEADER TOP AREA (COLLAPSED WHEN SCROLLED DOWN WITH TRANSFORM & OPACITY) */}
        <div
          className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[transform,opacity,max-height] overflow-hidden ${isScrolled
            ? '-translate-y-full opacity-0 max-h-0 pointer-events-none'
            : 'translate-y-0 opacity-100 max-h-[350px]'
            }`}
        >
          {/* 1. TOP UTILITY BAR */}
          <div className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-8 py-1.5 text-slate-300 text-[11px] flex flex-wrap items-center justify-between min-h-[38px] gap-2 font-medium">

            {/* Left Side: Address & Hotline */}
            <div className="flex items-center gap-4">

              {/* Địa chỉ - Click mở Google Maps */}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Trường+THCS+Đông+Quang+Thanh+Hóa"
                target="_blank"
                rel="noopener noreferrer"
                title="Xem vị trí Trường THCS Đông Quang trên Google Maps"
                className="
              group
              inline-flex
              items-center
              gap-1.5
              rounded-md
              px-2
              py-1
              -ml-2
              transition-all
              duration-200
              hover:bg-orange-500/15
              hover:text-orange-400
              hover:shadow-sm
            "
              >
                <span className="transition-transform duration-200 group-hover:scale-110">
                  📍
                </span>

                <span className="group-hover:underline">
                  Trường THCS Đông Quang-P.Đông Quang-Thanh Hóa
                </span>
              </a>

              <span className="hidden md:inline text-slate-600">
              </span>

              {/* Hotline */}
              <a
                href="tel:0237385XXXX"
                className="
              hidden
              md:inline-flex
              items-center
              gap-1.5
              rounded-md
              px-2
              py-1
              transition-all
              duration-200
              hover:bg-orange-500/15
              hover:text-orange-400
            "
              >
                <span>☎</span>
                <span>Hotline: Đang cập nhật...</span>
              </a>

            </div>

            {/* Right Side: Quick Search & Theme Switcher */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Ô TÌM KIẾM NỀN TRẮNG CHỮ ĐEN VIỀN ĐEN */}
              <form onSubmit={xuLyTimKiem} className="flex items-center gap-1">
                <input
                  type="text"
                  value={tuKhoa}
                  onChange={(e) => setTuKhoa(e.target.value)}
                  placeholder="Tìm tin tức, thông báo..."
                  className="px-3 py-1 rounded-lg bg-white border border-black text-black placeholder:text-slate-500 text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-black w-32 sm:w-44 shadow-sm"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-black font-bold border border-black text-[11px] transition shadow-sm"
                >
                  Tìm kiếm
                </button>
              </form>

              {/* Theme Switcher Button */}
              <button
                onClick={toggleTheme}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold border border-slate-700 transition text-[11px] shrink-0"
                title="Chuyển đổi Chế độ Sáng / Tối"
                aria-label="Chuyển đổi chế độ giao diện sáng tối"
              >
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>

          {/* 2. HEADER BRANDING VỚI ẢNH NỀN TRƯỜNG banner-dq.png & LOGO TRÒN */}
          <div
            className="relative border-b border-orange-600/40 px-4 sm:px-8 min-h-[140px] md:min-h-[160px] flex items-center overflow-hidden bg-cover bg-center transition-all duration-300"
            style={{ backgroundImage: `url('/images/banner-dq.png')` }}
          >
            {/* Subtle Semi-transparent Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/65 to-orange-950/50 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-4 relative z-10">
              {/* School Brand Logo & Title */}
              <Link href="/" className="flex items-center gap-4 sm:gap-5 group">
                {/* Round Official Logo Container */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-white/95 p-1 shadow-2xl shrink-0 group-hover:scale-105 transition-transform duration-300 ring-4 ring-orange-500/40 flex items-center justify-center">
                  <img
                    src="/images/logo-truong.png"
                    alt="Logo Trường THCS Đông Quang"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>

                {/* School Title & Governance Details */}
                <div className="space-y-0.5 text-white">
                  <div className="text-[10px] sm:text-xs font-bold text-amber-300 header-text-sub uppercase tracking-widest drop-shadow">
                    ỦY BAN NHÂN DÂN PHƯỜNG ĐÔNG QUANG
                  </div>
                  <h1 className="text-xxl sm:text-4xl md:text-3xl lg:text-3xl font-black text-white header-text-white tracking-tight uppercase group-hover:text-amber-400 transition-colors drop-shadow-md">
                    TRƯỜNG THCS ĐÔNG QUANG
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-200">
                    <span className="text-amber-300  uppercase tracking-wider">Cổng thông tin điện tử trường THCS Đông Quang</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 3. MAIN NAVIGATION BAR (MENU CHÍNH MÀU CAM #E97036 & HOVER #D95F2A) */}
        <nav className="bg-[#E97036] border-t border-[#d65f27] px-4 sm:px-8 shadow-xl transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1 text-xs font-bold uppercase tracking-wider w-full">
              {navLinks.map((link) => {
                // Logic kiem tra active route chinh xac
                const isActive = (() => {
                  if (!pathname) return false;
                  if (link.href === '/') return pathname === '/';
                  if (link.href !== '#' && pathname.startsWith(link.href)) return true;
                  if (link.children) {
                    return link.children.some(
                      (child) => !child.isExternal && pathname.startsWith(child.href.split('?')[0])
                    );
                  }
                  return false;
                })();

                const linkClasses = `px-3.5 py-2.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1 shrink-0 ${isActive
                  ? 'bg-[#D95F2A] text-white font-black shadow-md border-b-2 border-white'
                  : 'text-white font-bold hover:bg-[#D95F2A] hover:text-white'
                  }`;

                if (link.hasDropdown) {
                  const isOpen = openDropdown === link.name;
                  return (
                    <div
                      key={link.name}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(link.name)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      {link.href === '#' ? (
                        <button type="button" className={linkClasses}>
                          <span>{link.name}</span>
                          <span className="text-[10px] opacity-80">▼</span>
                        </button>
                      ) : (
                        <Link href={link.href} className={linkClasses}>
                          <span>{link.name}</span>
                          <span className="text-[10px] opacity-80">▼</span>
                        </Link>
                      )}

                      {/* Independent Dropdown Menu */}
                      {isOpen && (
                        <div className="absolute left-0 top-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 w-60 space-y-0.5 z-50 normal-case mt-0.5">
                          {link.children?.map((child) => {
                            const isChildActive = !child.isExternal && pathname === child.href.split('?')[0];
                            const itemClasses = `px-4 py-2.5 text-xs font-semibold transition-colors duration-150 flex items-center justify-between ${isChildActive
                              ? 'text-[#E97036] dark:text-[#E97036] bg-orange-50 dark:bg-slate-800 font-extrabold'
                              : 'text-slate-800 dark:text-slate-200 hover:text-[#E97036] dark:hover:text-[#E97036] hover:bg-orange-50/80 dark:hover:bg-slate-800'
                              }`;

                            return child.isExternal ? (
                              <a
                                key={child.name}
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={itemClasses}
                              >
                                <span>{child.name}</span>
                                <span className="text-[11px] text-slate-400 font-mono">↗</span>
                              </a>
                            ) : (
                              <Link key={child.href} href={child.href} className={itemClasses}>
                                <span>{child.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link key={link.name} href={link.href} className={linkClasses}>
                    {link.name}
                  </Link>
                );
              })}

              {/* NÚT ĐĂNG NHẬP Ở BÊN PHẢI NỀN CAM ĐẬM #D95F2A */}
              <Link
                href="/dang-nhap"
                className="ml-auto px-4 py-1.5 rounded-lg bg-[#D95F2A] hover:bg-[#c8501e] text-white font-extrabold text-xs transition-colors duration-200 border border-white/40 shrink-0 flex items-center gap-1.5 shadow-md"
              >
                ĐĂNG NHẬP
              </Link>
            </div>

            {/* Mobile Drawer Toggle */}
            <div className="lg:hidden w-full py-2.5 flex justify-between items-center text-xs font-bold text-white">
              <span>DANH MỤC </span>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-[#D95F2A] text-white font-bold border border-white/30"
              >
                {mobileMenuOpen ? '✕ Đóng' : '☰ Menu'}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-white/20 space-y-2 text-xs font-bold bg-[#E97036] text-white">
              {navLinks.map((link) => {
                const isActive = (() => {
                  if (!pathname) return false;
                  if (link.href === '/') return pathname === '/';
                  if (link.href !== '#' && pathname.startsWith(link.href)) return true;
                  if (link.children) {
                    return link.children.some(
                      (child) => !child.isExternal && pathname.startsWith(child.href.split('?')[0])
                    );
                  }
                  return false;
                })();

                return (
                  <div key={link.name}>
                    {link.href === '#' ? (
                      <div className="px-4 py-2 uppercase font-black tracking-wider text-[11px] text-amber-100">
                        {link.name} ▼
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-4 py-2.5 rounded-lg transition-colors duration-150 ${isActive
                          ? 'bg-[#D95F2A] text-white font-black shadow-inner border-l-4 border-white'
                          : 'hover:bg-[#D95F2A]'
                          }`}
                      >
                        {link.name}
                      </Link>
                    )}
                    {link.children && (
                      <div className="pl-6 space-y-1 pt-1 font-normal text-slate-100">
                        {link.children.map((child) => {
                          const isChildActive = !child.isExternal && pathname === child.href.split('?')[0];
                          return child.isExternal ? (
                            <a
                              key={child.name}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setMobileMenuOpen(false)}
                              className="py-1.5 hover:text-amber-100 transition flex items-center justify-between pr-4"
                            >
                              <span>• {child.name}</span>
                              <span className="text-[10px]">↗</span>
                            </a>
                          ) : (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`block py-1.5 transition ${isChildActive ? 'text-amber-200 font-extrabold' : 'hover:text-amber-100'
                                }`}
                            >
                              • {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile Drawer Login Button */}
              <div className="pt-3 px-4">
                <Link
                  href="/dang-nhap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 rounded-xl bg-[#D95F2A] text-white font-extrabold border border-white/40 shadow"
                >
                  ĐĂNG NHẬP HỆ THỐNG
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* FLOATING SCROLL NAVIGATION BUTTONS (MÀU CAM NỔI BẬT - HÌNH TRÒN CHỈ CÓ MŨI TÊN ↑ / ↓) */}
      <div className="fixed right-4 sm:right-6 bottom-6 z-40 flex flex-col gap-3 items-center pointer-events-none">
        {/* Nút Về Đầu Trang (Ẩn hoàn toàn khi chưa cuộn trang) */}
        <button
          onClick={scrollToTop}
          title="Về đầu trang"
          aria-label="Về đầu trang"
          className={`pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E97036] hover:bg-[#d85f25] active:bg-[#c4531b] text-white font-black text-lg border border-white/40 shadow-xl shadow-orange-950/30 backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center group ${showScrollTop
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
            }`}
        >
          <span className="group-hover:-translate-y-0.5 transition-transform">↑</span>
        </button>

        {/* Nút Về Cuối Trang (Chỉ hiện khi ĐÃ CUỘN và CHƯA đến chân trang) */}
        <button
          onClick={scrollToBottom}
          title="Về cuối trang"
          aria-label="Về cuối trang"
          className={`pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E97036] hover:bg-[#d85f25] active:bg-[#c4531b] text-white font-black text-lg border border-white/40 shadow-xl shadow-orange-950/30 backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center group ${showScrollBottom
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
            }`}
        >
          <span className="group-hover:translate-y-0.5 transition-transform">↓</span>
        </button>
      </div>
    </>
  );
}
