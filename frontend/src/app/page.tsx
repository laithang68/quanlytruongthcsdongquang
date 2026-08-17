'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import HeroSlideshow from '@/components/HeroSlideshow';
import NewsTicker from '@/components/NewsTicker';
import HomeVanBanSection from '@/components/HomeVanBanSection';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface ThongKeData {
  tong_so_giao_vien: number;
  tong_so_hoc_sinh: number;
  tong_so_lop: number;
  tong_so_bai_viet: number;
  tong_so_thong_bao: number;
  tong_so_van_ban: number;
}

interface ThongKeTruyCapData {
  dang_online: number;
  hom_nay: number;
  trong_tuan: number;
  tat_ca: number;
}

interface ThongBaoItem {
  id: string;
  tieu_de: string;
  noi_dung: string;
  ngay_tao: string;
}

interface BaiVietItem {
  id: string;
  tieu_de: string;
  slug: string;
  mo_ta?: string;
  anh_dai_dien?: string;
  ngay_xuat_ban?: string;
  danh_muc?: { ten: string };
}

interface GiaoVienItem {
  id: string;
  ho_ten: string;
  chuc_vu?: string;
  trinh_do?: string;
  anh_dai_dien?: string;
  to_chuyen_mon?: { ten: string };
}

interface VanBanItem {
  id: string;
  ten_van_ban: string;
  so_hieu: string;
  ngay_ban_hanh: string;
  mo_ta?: string;
  nguoi_ky?: string;
  loai_van_ban?: { id?: string; ten: string; ma?: string };
  tep_tin?: { id?: string; url: string; ten_goc?: string };
}

interface VideoItem {
  id: string;
  tieu_de: string;
  url_video: string;
  anh_thumbnail?: string;
  ngay_tao: string;
}

interface AlbumItem {
  id: string;
  ten: string;
  anh_dai_dien?: string;
  so_luong_anh: number;
}

interface TaiLieuItem {
  id: string;
  ten_tai_lieu: string;
  mo_ta?: string;
  danh_muc_tai_lieu?: { ten: string };
}

interface ToChuyenMonItem {
  id: string;
  ten: string;
  mo_ta?: string;
  so_luong_giao_vien: number;
  truong_to?: {
    id: string;
    ho_ten: string;
    chuc_vu?: string;
  };
}

export default function TrangChu() {
  const router = useRouter();

  const [thongKe, setThongKe] = useState<ThongKeData | null>(null);
  const [thongKeTruyCap, setThongKeTruyCap] = useState<ThongKeTruyCapData | null>(null);
  const [danhSachThongBao, setDanhSachThongBao] = useState<ThongBaoItem[]>([]);
  const [danhSachBaiViet, setDanhSachBaiViet] = useState<BaiVietItem[]>([]);
  const [danhSachVanBan, setDanhSachVanBan] = useState<VanBanItem[]>([]);
  const [danhSachGiaoVien, setDanhSachGiaoVien] = useState<GiaoVienItem[]>([]);
  const [danhSachVideo, setDanhSachVideo] = useState<VideoItem[]>([]);
  const [danhSachAlbum, setDanhSachAlbum] = useState<AlbumItem[]>([]);
  const [danhSachTaiLieu, setDanhSachTaiLieu] = useState<TaiLieuItem[]>([]);
  const [danhSachToChuyenMon, setDanhSachToChuyenMon] = useState<ToChuyenMonItem[]>([]);
  const [dangTai, setDangTai] = useState(true);

  // Tạo hoặc lấy Session ID cho khách truy cập
  const getOrCreateSessionId = (): string => {
    if (typeof window === 'undefined') return '';
    let sid = localStorage.getItem('site_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem('site_session_id', sid);
    }
    return sid;
  };

  useEffect(() => {
    // 0. Gửi Ping ghi nhận phiên truy cập & Tải Thống kê Truy cập thực tế
    const sid = getOrCreateSessionId();
    if (sid) {
      fetch(getApiUrl('/api/v1/truy-cap/ping'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid }),
      })
        .then(() => fetch(getApiUrl('/api/v1/truy-cap/thong-ke')))
        .then((res) => res.json())
        .then((data) => {
          if (data.thanh_cong) setThongKeTruyCap(data.du_lieu);
        })
        .catch(() => { });
    }

    // 1. Tải thống kê
    fetch(getApiUrl('/api/v1/kiem-tra/thong-ke'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setThongKe(data.du_lieu);
      })
      .catch(() => { });

    // 2. Tải thông báo
    fetch(getApiUrl('/api/v1/thong-bao/cong-khai?limit=5'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachThongBao(data.du_lieu);
      })
      .catch(() => { });

    // 3. Tải bài viết
    fetch(getApiUrl('/api/v1/bai-viet/cong-khai?limit=7'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachBaiViet(data.du_lieu);
      })
      .catch(() => { });

    // 4. Tải văn bản
    fetch(getApiUrl('/api/v1/van-ban/cong-khai?limit=5'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachVanBan(data.du_lieu);
      })
      .catch(() => { });

    // 5. Tải đội ngũ giáo viên
    fetch(getApiUrl('/api/v1/giao-vien/cong-khai'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachGiaoVien(data.du_lieu.slice(0, 6));
      })
      .catch(() => { });

    // 6. Tải Video mới nhất
    fetch(getApiUrl('/api/v1/video/cong-khai?limit=3'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachVideo(data.du_lieu);
      })
      .catch(() => { });

    // 7. Tải Album ảnh
    fetch(getApiUrl('/api/v1/album/cong-khai?limit=4'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachAlbum(data.du_lieu);
      })
      .catch(() => { });

    // 8. Tải Thư viện số
    fetch(getApiUrl('/api/v1/thu-vien-so/cong-khai?limit=4'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachTaiLieu(data.du_lieu);
      })
      .catch(() => { });

    // 9. Tải Tổ chuyên môn
    fetch(getApiUrl('/api/v1/to-chuyen-mon'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachToChuyenMon(data.du_lieu);
      })
      .catch(() => { })
      .finally(() => setDangTai(false));
  }, []);

  const baiNoiBat = danhSachBaiViet[0];
  const danhSachTinConLai = danhSachBaiViet.slice(1, 6);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />
        <NewsTicker />
        <HeroSlideshow />

        <div className="max-w-7xl  mx-auto p-4 sm:p-6 space-y-8">

          {/* MAIN 70/30 LAYOUT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* 70% LEFT MAIN CONTENT AREA (8 COLS) */}
            <main className="lg:col-span-8 space-y-8">

              {/* KHỐI TIN TỨC SỰ KIỆN */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 sm:p-7 space-y-5 shadow-xl transition-colors">

                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">

                  <h3 className="text-base sm:text-lg font-bold text-[#E97036] uppercase tracking-wider flex items-center gap-2.5">
                    <span className="text-xs  font-bold">TT</span>
                    <span>TIN TỨC - SỰ KIỆN</span>
                  </h3>
                  <button
                    onClick={() => router.push('/tin-tuc')}
                    className="text-xs sm:text-sm text-[#E97036] hover:text-[#d45e25] font-bold hover:underline transition-colors"
                  >
                    Xem tất cả tin tức →
                  </button>
                </div>

                {dangTai ? (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Đang tải danh sách tin tức...</div>
                ) : danhSachBaiViet.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Chưa có tin tức và sự kiện.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* CỘT TRÁI – TIN NỔI BẬT (60–65% width: lg:col-span-7) */}
                    {baiNoiBat && (
                      <div className="lg:col-span-7 flex flex-col">
                        <div
                          onClick={() => router.push(`/tin-tuc/${baiNoiBat.slug}`)}
                          className="group bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-[#E97036] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-full p-3 sm:p-4"
                        >
                          <div className="space-y-6">
                            {/* [ ẢNH LỚN ] */}
                            <div className="w-full h-60 sm:h-56 lg:h-64 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden relative">
                              {baiNoiBat.anh_dai_dien ? (
                                <img
                                  src={getMediaUrl(baiNoiBat.anh_dai_dien)}
                                  alt={baiNoiBat.tieu_de}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 dark:from-slate-800 to-slate-200 dark:to-slate-900 text-slate-500 dark:text-slate-400 font-bold text-sm">
                                  <span className="text-3xl mb-1">📰</span>
                                  <span>CỔNG THÔNG TIN TRƯỜNG THCS ĐÔNG QUANG</span>
                                </div>
                              )}
                            </div>

                            {/* BỐ CỤC CHỮ: CAT BADGE + TIÊU ĐỀ + NGÀY ĐĂNG */}
                            <div className="space-y-2">
                              {baiNoiBat.danh_muc && (
                                <span className="inline-block px-2.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-[#E97036] text-[11px] font-extrabold uppercase tracking-wider">
                                  {baiNoiBat.danh_muc.ten}
                                </span>
                              )}
                              <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg group-hover:text-[#E97036] transition leading-snug line-clamp-2">
                                {baiNoiBat.tieu_de}
                              </h4>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 pt-1">
                                <span>📅</span>
                                <span>{baiNoiBat.ngay_xuat_ban ? new Date(baiNoiBat.ngay_xuat_ban).toLocaleDateString('vi-VN') : 'Mới nhất'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CỘT PHẢI – DANH SÁCH TIN */}
                    <div className="lg:col-span-5 flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
                      {danhSachTinConLai.slice(0, 5).map((bv) => (
                        <div
                          key={bv.id}
                          onClick={() => router.push(`/tin-tuc/${bv.slug}`)}
                          className="group py-2 first:pt-0 last:pb-0 hover:bg-orange-50/60 dark:hover:bg-slate-800/50 p-2 rounded-md transition duration-150 cursor-pointer flex items-center gap-3"
                        >
                          {/* ẢNH NHỎ BÊN TRÁI */}
                          <div className="w-[90px] sm:w-[100px] lg:w-[105px] h-[65px] sm:h-[72px] lg:h-[75px] rounded-md bg-slate-200 dark:bg-slate-800 shrink-0 overflow-hidden relative border border-slate-200 dark:border-slate-800">
                            {bv.anh_dai_dien ? (
                              <img
                                src={getMediaUrl(bv.anh_dai_dien)}
                                alt={bv.tieu_de}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold">
                                TIN TỨC
                              </div>
                            )}
                          </div>

                          {/* TIÊU ĐỀ + NGÀY ĐĂNG */}
                          <div className="space-y-1 min-w-0 flex-1">
                            <h5 className="font-semibold sm:font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-[#E97036] transition line-clamp-2 leading-snug">
                              {bv.tieu_de}
                            </h5>

                            <div className="text-xs text-slate-500 dark:text-slate-400 font-normal flex items-center gap-1">
                              <span>📅</span>
                              <span>
                                {bv.ngay_xuat_ban
                                  ? new Date(bv.ngay_xuat_ban).toLocaleDateString('vi-VN')
                                  : 'Mới'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* KHỐI HOẠT ĐỘNG GIÁO DỤC & SỰ KIỆN NHÀ TRƯỜNG */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 sm:p-8 space-y-6 shadow-2xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h3 className="text-lg font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-xs font-bold">HĐ</span>
                    HOẠT ĐỘNG GIÁO DỤC
                  </h3>
                  <button
                    onClick={() => router.push('/hoat-dong')}
                    className="text-xs text-orange-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Xem tất cả hoạt động →
                  </button>
                </div>

                {danhSachBaiViet.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">Đang cập nhật hoạt động giáo dục nhà trường.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {danhSachBaiViet.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => router.push(`/hoat-dong/${item.slug}`)}
                        className="group bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden cursor-pointer transition shadow-lg flex flex-col justify-between"
                      >
                        <div className="w-full h-40 bg-slate-100 dark:bg-slate-900 relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
                          {item.anh_dai_dien ? (
                            <img
                              src={getMediaUrl(item.anh_dai_dien)}
                              alt={item.tieu_de}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-700 font-bold text-xs">
                              🎪 TRƯỜNG THCS ĐÔNG QUANG
                            </div>
                          )}
                        </div>

                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            {item.danh_muc && (
                              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide block">
                                {item.danh_muc.ten}
                              </span>
                            )}
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition line-clamp-2 leading-snug">
                              {item.tieu_de}
                            </h4>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
                            <span>📅 {item.ngay_xuat_ban ? new Date(item.ngay_xuat_ban).toLocaleDateString('vi-VN') : 'Mới'}</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Xem chi tiết →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* KHỐI VIDEO NỔI BẬT */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 space-y-4 shadow-xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-[#EA580C] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-xs font-bold">VD</span>
                    VIDEO HOẠT ĐỘNG - BÀI GIẢNG SỐ
                  </h3>
                  <button
                    onClick={() => router.push('/video')}
                    className="text-xs text-orange-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Xem tất cả video →
                  </button>
                </div>

                {danhSachVideo.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">Đang cập nhật video nhà trường.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {danhSachVideo.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => router.push('/video')}
                        className="group bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-rose-500/40 rounded-xl overflow-hidden cursor-pointer transition shadow-md flex flex-col justify-between"
                      >
                        <div className="w-full aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                          {v.anh_thumbnail ? (
                            <img src={getMediaUrl(v.anh_thumbnail)} alt={v.tieu_de} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-700 font-bold text-xs">🎬 THCS ĐÔNG QUANG</div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-orange-600 dark:bg-rose-600/90 text-white flex items-center justify-center text-sm shadow-md">▶</div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 leading-tight group-hover:text-orange-600 dark:group-hover:text-rose-400 transition">{v.tieu_de}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* KHỐI THƯ VIỆN ẢNH NỔI BẬT */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-8 space-y-4 shadow-2xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-[#059669] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-xs font-bold">TV</span>
                    THƯ VIỆN ẢNH SỰ KIỆN
                  </h3>
                  <button
                    onClick={() => router.push('/thu-vien-anh')}
                    className="text-xs text-orange-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Xem tất cả album →
                  </button>
                </div>

                {danhSachAlbum.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">Đang cập nhật thư viện ảnh.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-5">
                    {danhSachAlbum.map((al) => (
                      <div
                        key={al.id}
                        onClick={() => router.push(`/thu-vien-anh/${al.id}`)}
                        className="group bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl overflow-hidden cursor-pointer transition shadow-md"
                      >
                        <div className="w-full h-50 bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                          {al.anh_dai_dien ? (
                            <img src={getMediaUrl(al.anh_dai_dien)} alt={al.ten} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-800 dark:text-slate-900 font-bold text-[20px]">🖼️ ALBUM</div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h4 className="font-bold text-slate-900 dark:text-white text-[11px] truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{al.ten}</h4>
                          <span className="text-[10px] text-slate-500 font-medium">📷 {al.so_luong_anh} ảnh</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* KHỐI VĂN BẢN CHỈ ĐẠO ĐIỀU HÀNH CHUẨN E-PORTAL MỚI */}
              <HomeVanBanSection danhSachVanBan={danhSachVanBan} />
            </main>

            {/* 30% RIGHT SIDEBAR AREA (4 COLS) */}
            <aside className="lg:col-span-4 space-y-8">
              {/* SIDEBAR WIDGET 1: THÔNG BÁO NHANH */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 dark:bg-cyan-400 animate-ping"></span>
                    THÔNG BÁO MỚI
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push('/lich-hoat-dong')}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold"
                    >
                      📅 Lịch HĐ
                    </button>
                    <span className="text-slate-400">•</span>
                    <button
                      onClick={() => router.push('/thong-bao')}
                      className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-bold"
                    >
                      Tất cả →
                    </button>
                  </div>
                </div>

                {danhSachThongBao.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">Không có thông báo mới.</div>
                ) : (
                  <div className="space-y-3">
                    {danhSachThongBao.map((tb) => (
                      <div
                        key={tb.id}
                        onClick={() => router.push(`/thong-bao/${tb.id}`)}
                        className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-orange-50 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800/80 transition cursor-pointer space-y-1"
                      >
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-2 hover:text-orange-600 dark:hover:text-blue-400 transition">
                          {tb.tieu_de}
                        </h4>
                        <div className="text-[10px] text-slate-500">
                          📅 {new Date(tb.ngay_tao).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SIDEBAR WIDGET 2: TỔ CHUYÊN MÔN (PORTAL LIST CHUẨN MẪU GIAI ĐOẠN 15.2) */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                    TỔ CHUYÊN MÔN
                  </h3>
                  <button
                    onClick={() => router.push('/to-chuc')}
                    className="text-[11px] text-orange-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    Xem tất cả →
                  </button>
                </div>

                {danhSachToChuyenMon.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">Đang cập nhật các tổ chuyên môn.</div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {danhSachToChuyenMon.map((to) => (
                      <div
                        key={to.id}
                        onClick={() => router.push(`/to-chuc/${to.id}`)}
                        className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-orange-50 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800/80 transition cursor-pointer space-y-1 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-emerald-400 transition truncate flex items-center gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">🔹</span>
                            <span>{to.ten}</span>
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-emerald-500/10 text-orange-700 dark:text-emerald-400 border border-orange-200 dark:border-emerald-500/20 text-[10px] font-bold shrink-0">
                            {to.so_luong_giao_vien < 10 ? `0${to.so_luong_giao_vien}` : to.so_luong_giao_vien} giáo viên
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium pl-4">
                          Tổ trưởng: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{to.truong_to ? to.truong_to.ho_ten : 'Chưa phân công'}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SIDEBAR WIDGET 3: THƯ VIỆN SỐ */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600 dark:bg-blue-500"></span>
                    THƯ VIỆN SỐ - HỌC LIỆU
                  </h3>
                  <button
                    onClick={() => router.push('/thu-vien-so')}
                    className="text-[11px] text-orange-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Xem tất cả →
                  </button>
                </div>

                {danhSachTaiLieu.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">Đang cập nhật kho học liệu số.</div>
                ) : (
                  <div className="space-y-2">
                    {danhSachTaiLieu.map((tl) => (
                      <div
                        key={tl.id}
                        onClick={() => router.push('/thu-vien-so')}
                        className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-orange-50 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800/80 transition cursor-pointer space-y-1"
                      >
                        <span className="text-[10px] font-bold text-orange-600 dark:text-blue-400 uppercase">{tl.danh_muc_tai_lieu?.ten}</span>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate hover:text-orange-600 dark:hover:text-blue-400 transition">{tl.ten_tai_lieu}</h4>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SIDEBAR WIDGET 4: SỐ LIỆU THỐNG KÊ NHÀ TRƯỜNG */}
              {thongKe && (
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl transition-colors">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                    📊 THỐNG KÊ QUY MÔ TRƯỜNG
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{thongKe.tong_so_giao_vien}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Giáo viên</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="text-xl font-black text-blue-600 dark:text-cyan-400">{thongKe.tong_so_hoc_sinh}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Học sinh</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="text-xl font-black text-amber-600 dark:text-amber-400">{thongKe.tong_so_lop}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Lớp học</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="text-xl font-black text-orange-600 dark:text-rose-400">{thongKe.tong_so_van_ban}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Văn bản</div>
                    </div>
                  </div>
                </section>
              )}

              {/* SIDEBAR WIDGET 5 (CUỐI CÙNG): THỐNG KÊ TRUY CẬP (GIAI ĐOẠN 19.5 - REAL DATA) */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-[#E97036] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E97036] animate-pulse"></span>
                    THỐNG KÊ TRUY CẬP
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Trực tuyến</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Đang online:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {thongKeTruyCap ? thongKeTruyCap.dang_online.toLocaleString('vi-VN') : '0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Hôm nay:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {thongKeTruyCap ? thongKeTruyCap.hom_nay.toLocaleString('vi-VN') : '0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Trong tuần:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {thongKeTruyCap ? thongKeTruyCap.trong_tuan.toLocaleString('vi-VN') : '0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#E97036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Tất cả:
                    </span>
                    <span className="font-bold text-[#E97036] text-sm">
                      {thongKeTruyCap ? thongKeTruyCap.tat_ca.toLocaleString('vi-VN') : '0'}
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div >
      </div >

      <PublicFooter />
    </div >
  );
}