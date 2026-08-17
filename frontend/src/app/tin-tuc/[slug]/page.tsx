'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface BaiVietDetail {
  id: string;
  tieu_de: string;
  slug: string;
  mo_ta?: string;
  noi_dung: string;
  anh_dai_dien?: string;
  luot_xem: number;
  ngay_xuat_ban?: string;
  danh_muc?: { id: string; ten: string };
  tac_gia?: { ho_ten: string };
}

interface BaiVietSimple {
  id: string;
  tieu_de: string;
  slug: string;
  anh_dai_dien?: string;
  ngay_xuat_ban?: string;
  danh_muc?: { ten: string };
}

export default function TrangChiTietBaiViet() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [baiViet, setBaiViet] = useState<BaiVietDetail | null>(null);
  const [baiVietLienQuan, setBaiVietLienQuan] = useState<BaiVietSimple[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setDangTai(true);
    setLoi(false);

    // Fetch Article Detail
    fetch(getApiUrl(`/api/v1/bai-viet/cong-khai/${encodeURIComponent(slug)}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu) {
          setBaiViet(data.du_lieu);
        } else {
          setLoi(true);
        }
      })
      .catch(() => setLoi(true))
      .finally(() => setDangTai(false));

    // Fetch Related Articles
    fetch(getApiUrl('/api/v1/bai-viet/cong-khai?limit=5'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setBaiVietLienQuan(data.du_lieu.filter((item: BaiVietSimple) => item.slug !== slug));
        }
      })
      .catch(() => {});
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb
            items={[
              { label: 'Tin tức & Sự kiện', href: '/tin-tuc' },
              { label: baiViet ? baiViet.tieu_de : 'Chi tiết bài viết' },
            ]}
          />

          {dangTai ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Đang tải nội dung bài viết...
            </div>
          ) : loi || !baiViet ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">Không tìm thấy bài viết</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bài viết không tồn tại hoặc đã gỡ xuống khỏi Cổng thông tin.</p>
              <button
                onClick={() => router.push('/tin-tuc')}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                ← Trở về danh sách tin tức
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Article Content (8 cols) */}
              <article className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl transition-colors">
                {/* Featured Image if present */}
                {baiViet.anh_dai_dien && (
                  <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <img
                      src={getMediaUrl(baiViet.anh_dai_dien)}
                      alt={baiViet.tieu_de}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Category & Meta Header */}
                <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
                  {baiViet.danh_muc && (
                    <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-blue-500/10 text-orange-700 dark:text-blue-400 text-xs font-extrabold uppercase tracking-wider border border-orange-200 dark:border-blue-500/20">
                      {baiViet.danh_muc.ten}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                    {baiViet.tieu_de}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-2 font-semibold">
                    <span>✍️ Tác giả: <strong className="text-slate-900 dark:text-slate-200 font-bold">{baiViet.tac_gia?.ho_ten || 'Ban Biên tập'}</strong></span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>📅 Ngày xuất bản: <strong className="text-slate-900 dark:text-slate-200 font-bold">{baiViet.ngay_xuat_ban ? new Date(baiViet.ngay_xuat_ban).toLocaleDateString('vi-VN') : 'Mới'}</strong></span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>👁️ Lượt xem: <strong className="text-orange-600 dark:text-emerald-400 font-bold">{baiViet.luot_xem}</strong></span>
                  </div>
                </div>

                {/* Article Summary Quote */}
                {baiViet.mo_ta && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-l-4 border-orange-500 dark:border-blue-500 text-xs sm:text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    {baiViet.mo_ta}
                  </div>
                )}

                {/* Main Article Body HTML */}
                <div
                  className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: baiViet.noi_dung }}
                />

                {/* Back Button */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                  <button
                    onClick={() => router.push('/tin-tuc')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold transition"
                  >
                    ← Trở về danh sách Tin tức
                  </button>
                </div>
              </article>

              {/* Sidebar Related Articles (4 cols) */}
              <aside className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600 dark:bg-blue-500"></span>
                    TIN TỨC CÙNG CHỦ ĐỀ
                  </h3>

                  {baiVietLienQuan.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4">Không có tin tức liên quan.</div>
                  ) : (
                    <div className="space-y-3">
                      {baiVietLienQuan.map((bv) => (
                        <div
                          key={bv.id}
                          onClick={() => router.push(`/tin-tuc/${bv.slug}`)}
                          className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-orange-50 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800/80 transition cursor-pointer space-y-1"
                        >
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-2 hover:text-orange-600 dark:hover:text-blue-400 transition">
                            {bv.tieu_de}
                          </h4>
                          <div className="text-[10px] text-slate-500">
                            📅 {bv.ngay_xuat_ban ? new Date(bv.ngay_xuat_ban).toLocaleDateString('vi-VN') : 'Mới'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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