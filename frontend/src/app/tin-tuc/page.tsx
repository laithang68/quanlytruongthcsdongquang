'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface BaiVietItem {
  id: string;
  tieu_de: string;
  slug: string;
  mo_ta?: string;
  anh_dai_dien?: string;
  ngay_xuat_ban?: string;
  luot_xem?: number;
  danh_muc?: { id: string; ten: string };
  tac_gia?: { ho_ten: string };
}

interface ThongBaoSideItem {
  id: string;
  tieu_de: string;
  ngay_tao: string;
}

function TinTucContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tuKhoaParam = searchParams?.get('tu_khoa') || '';
  const danhMucParam = searchParams?.get('danh_muc_slug') || searchParams?.get('danh_muc_id') || '';
  const pageParam = parseInt(searchParams?.get('page') || '1', 10);

  const [danhSach, setDanhSach] = useState<BaiVietItem[]>([]);
  const [danhSachThongBaoSide, setDanhSachThongBaoSide] = useState<ThongBaoSideItem[]>([]);
  const [tuKhoa, setTuKhoa] = useState(tuKhoaParam);
  const [page, setPage] = useState(pageParam > 0 ? pageParam : 1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [dangTai, setDangTai] = useState(true);

  // Cập nhật local state tuKhoa khi tuKhoaParam trên URL thay đổi (F5, copy link,...)
  useEffect(() => {
    setTuKhoa(tuKhoaParam);
    if (pageParam > 0) setPage(pageParam);
  }, [tuKhoaParam, pageParam]);

  const taiTinTuc = async () => {
    setDangTai(true);
    try {
      const query = new URLSearchParams();
      if (tuKhoaParam) query.set('tu_khoa', tuKhoaParam);
      if (danhMucParam) query.set('danh_muc_id', danhMucParam);
      query.set('page', page.toString());
      query.set('limit', '7');

      const res = await fetch(getApiUrl(`/api/v1/bai-viet/cong-khai?${query.toString()}`));
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSach(data.du_lieu);
        setTongSoTrang(data.tong_so_trang);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiTinTuc();

    // Fetch announcements for sidebar
    fetch(getApiUrl('/api/v1/thong-bao/cong-khai?limit=5'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachThongBaoSide(data.du_lieu);
      })
      .catch(() => { });
  }, [page, tuKhoaParam, danhMucParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const query = new URLSearchParams();
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    if (danhMucParam) query.set('danh_muc_slug', danhMucParam);
    router.push(`/tin-tuc?${query.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const query = new URLSearchParams();
    if (tuKhoaParam) query.set('tu_khoa', tuKhoaParam);
    if (danhMucParam) query.set('danh_muc_slug', danhMucParam);
    if (newPage > 1) query.set('page', newPage.toString());
    router.push(`/tin-tuc?${query.toString()}`, { scroll: false });
  };

  const baiNoiBat = danhSach[0];
  const danhSachKhac = danhSach.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb items={[{ label: 'Tin tức & Sự kiện' }]} />

          {/* Page Header Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Tin tức & Sự kiện Nhà trường</h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Cập nhật tin tức giáo dục, hoạt động chuyên môn và các phong trào trường THCS Đông Quang</p>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 text-xs"
            >
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Nhập từ khóa tin tức..."
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-blue-500 min-w-[220px]"
              />
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold text-white transition shadow-md">
                Tìm kiếm
              </button>
            </form>
          </div>

          {dangTai ? (
            <div className="p-16 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              Đang tải danh sách tin tức...
            </div>
          ) : danhSach.length === 0 ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Không tìm thấy tin tức nào phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Content Area 70% (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. TIN NỔI BẬT LỚN (FEATURED MAIN CARD) */}
                {baiNoiBat && (
                  <div
                    onClick={() => router.push(`/tin-tuc/${baiNoiBat.slug}`)}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-blue-500/50 rounded-3xl overflow-hidden shadow-2xl transition cursor-pointer flex flex-col"
                  >
                    {/* Thumbnail Image Container */}
                    <div className="w-full h-56 sm:h-72 bg-slate-100 dark:bg-slate-950 overflow-hidden relative border-b border-slate-200 dark:border-slate-800">
                      {baiNoiBat.anh_dai_dien ? (
                        <img
                          src={getMediaUrl(baiNoiBat.anh_dai_dien)}
                          alt={baiNoiBat.tieu_de}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 dark:from-blue-900/40 to-slate-100 dark:to-slate-900 text-slate-500 dark:text-slate-400 font-bold text-sm">
                          <span className="text-4xl mb-2">📰</span>
                          <span>CỔNG THÔNG TIN TRƯỜNG THCS ĐÔNG QUANG</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2">
                        {baiNoiBat.danh_muc && (
                          <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-blue-500/10 text-orange-700 dark:text-blue-400 text-xs font-extrabold uppercase tracking-wider border border-orange-200 dark:border-blue-500/20">
                            {baiNoiBat.danh_muc.ten}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          📅 Ngày đăng: {baiNoiBat.ngay_xuat_ban ? new Date(baiNoiBat.ngay_xuat_ban).toLocaleDateString('vi-VN') : 'Mới'}
                        </span>
                      </div>

                      <h2 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-blue-400 transition leading-snug">
                        {baiNoiBat.tieu_de}
                      </h2>

                      {baiNoiBat.mo_ta && (
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {baiNoiBat.mo_ta}
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-between text-xs text-orange-600 dark:text-blue-400 font-bold group-hover:underline">
                        <span>Xem chi tiết bài viết →</span>
                        {baiNoiBat.tac_gia?.ho_ten && (
                          <span className="text-slate-500 dark:text-slate-500 font-normal">Tác giả: {baiNoiBat.tac_gia.ho_ten}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DANH SÁCH BÀI VIẾT KHÁC (SUB CARDS LIST) */}
                {danhSachKhac.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {danhSachKhac.map((bv) => (
                      <div
                        key={bv.id}
                        onClick={() => router.push(`/tin-tuc/${bv.slug}`)}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-slate-700 rounded-2xl overflow-hidden transition cursor-pointer shadow-lg flex flex-col justify-between"
                      >
                        {/* Thumbnail */}
                        <div className="w-full h-40 bg-slate-100 dark:bg-slate-950 overflow-hidden relative border-b border-slate-200 dark:border-slate-800">
                          {bv.anh_dai_dien ? (
                            <img
                              src={getMediaUrl(bv.anh_dai_dien)}
                              alt={bv.tieu_de}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-600 font-bold text-xs">
                              📰 TRƯỜNG THCS ĐÔNG QUANG
                            </div>
                          )}
                        </div>

                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {bv.danh_muc && <span className="font-bold text-orange-600 dark:text-blue-400">{bv.danh_muc.ten}</span>}
                              <span>📅 {bv.ngay_xuat_ban ? new Date(bv.ngay_xuat_ban).toLocaleDateString('vi-VN') : 'Mới'}</span>
                            </div>

                            <h3 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 leading-snug group-hover:text-orange-600 dark:group-hover:text-blue-400 transition">
                              {bv.tieu_de}
                            </h3>

                            {bv.mo_ta && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {bv.mo_ta}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-orange-600 dark:text-blue-400 font-bold flex items-center justify-between">
                            <span>Xem chi tiết →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {tongSoTrang > 1 && (
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <button
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-bold hover:bg-orange-100 dark:hover:bg-slate-700 transition inline-flex items-center justify-center"
                    >
                      ← Trước
                    </button>
                    <span className="font-semibold">Trang {page} / {tongSoTrang}</span>
                    <button
                      disabled={page >= tongSoTrang}
                      onClick={() => handlePageChange(page + 1)}
                      className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-bold hover:bg-orange-100 dark:hover:bg-slate-700 transition inline-flex items-center justify-center"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar Area 30% (4 cols) */}
              <aside className="lg:col-span-4 space-y-6">
                {/* Sidebar Notification Widget */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 dark:bg-cyan-400 animate-ping"></span>
                    THÔNG BÁO MỚI
                  </h3>

                  {danhSachThongBaoSide.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4">Chưa có thông báo mới.</div>
                  ) : (
                    <div className="space-y-3">
                      {danhSachThongBaoSide.map((tb) => (
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
                </div>

                {/* Quick Link Widget */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                    ⚡ TRA CỨU NHANH
                  </h3>
                  <div className="space-y-2 text-xs">
                    <button
                      onClick={() => router.push('/van-ban')}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-orange-500/10 dark:hover:bg-blue-600/20 text-slate-800 dark:text-slate-200 hover:text-orange-600 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition flex items-center justify-between font-semibold"
                    >
                      <span>📄 Tra cứu Văn bản chỉ đạo</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={() => router.push('/giao-vien')}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/10 dark:hover:bg-emerald-600/20 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition flex items-center justify-between font-semibold"
                    >
                      <span>👨‍🏫 Đội ngũ Giáo viên</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={() => router.push('/tra-cuu-hoc-sinh')}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-cyan-500/10 dark:hover:bg-cyan-600/20 text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition flex items-center justify-between font-semibold"
                    >
                      <span>🎓 Tra cứu Học sinh theo Lớp</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}

export default function TrangTinTuc() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">Đang tải...</div>}>
      <TinTucContent />
    </Suspense>
  );
}