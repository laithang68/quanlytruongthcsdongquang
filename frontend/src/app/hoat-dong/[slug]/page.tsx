'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface DanhMucPublic {
  id: string;
  ten: string;
}

interface HoatDongDetail {
  id: string;
  tieu_de: string;
  slug: string;
  mo_ta?: string;
  noi_dung: string;
  anh_dai_dien?: string;
  ngay_xuat_ban?: string;
  luot_xem: number;
  danh_muc?: DanhMucPublic;
  tac_gia?: { ho_ten: string };
}

export default function TrangChiTietHoatDongPublic() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [hoatDong, setHoatDong] = useState<HoatDongDetail | null>(null);
  const [danhSachLienQuan, setDanhSachLienQuan] = useState<HoatDongDetail[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setDangTai(true);

    fetch(getApiUrl(`/api/v1/bai-viet/cong-khai/${encodeURIComponent(slug)}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu) {
          setHoatDong(data.du_lieu);
          // Tải thêm hoạt động liên quan
          fetch(getApiUrl('/api/v1/bai-viet/cong-khai?limit=4'))
            .then((r) => r.json())
            .then((relData) => {
              if (relData.thanh_cong) {
                setDanhSachLienQuan(relData.du_lieu.filter((x: any) => x.id !== data.du_lieu.id).slice(0, 3));
              }
            })
            .catch(() => {});
        } else {
          setLoi(true);
        }
      })
      .catch(() => setLoi(true))
      .finally(() => setDangTai(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
          <PublicBreadcrumb
            items={[
              { label: 'Hoạt động & Sự kiện', href: '/hoat-dong' },
              { label: hoatDong ? hoatDong.tieu_de : 'Chi tiết Hoạt động' },
            ]}
          />

          {dangTai ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Đang tải nội dung chi tiết hoạt động...
            </div>
          ) : loi || !hoatDong ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">Không tìm thấy thông tin hoạt động sự kiện</div>
              <button
                onClick={() => router.push('/hoat-dong')}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                ← Trở về danh sách hoạt động
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* MAIN CONTENT (8 COLS) */}
              <div className="lg:col-span-8 space-y-6">
                <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-colors">
                  {/* CATEGORY & TITLE */}
                  <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-5">
                    {hoatDong.danh_muc && (
                      <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-blue-500/10 text-orange-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-blue-500/20">
                        {hoatDong.danh_muc.ten}
                      </span>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">{hoatDong.tieu_de}</h1>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 font-medium">
                      <div>📅 Ngày đăng: <strong className="text-slate-900 dark:text-slate-200">{hoatDong.ngay_xuat_ban ? new Date(hoatDong.ngay_xuat_ban).toLocaleDateString('vi-VN') : 'Mới'}</strong></div>
                      <div>👁️ Lượt xem: <strong className="text-slate-900 dark:text-slate-200">{hoatDong.luot_xem}</strong></div>
                      {hoatDong.tac_gia && <div>✍️ Đăng bởi: <strong className="text-slate-900 dark:text-slate-200">{hoatDong.tac_gia.ho_ten}</strong></div>}
                    </div>
                  </div>

                  {/* FEATURED IMAGE */}
                  {hoatDong.anh_dai_dien && (
                    <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
                      <img src={getMediaUrl(hoatDong.anh_dai_dien)} alt={hoatDong.tieu_de} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* EXCERPT */}
                  {hoatDong.mo_ta && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border-l-4 border-orange-500 dark:border-blue-500 rounded-r-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold italic leading-relaxed">
                      {hoatDong.mo_ta}
                    </div>
                  )}

                  {/* FULL HTML CONTENT */}
                  <div
                    className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-300 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: hoatDong.noi_dung }}
                  />
                </article>
              </div>

              {/* SIDEBAR RELATED ACTIVITIES (4 COLS) */}
              <div className="lg:col-span-4 space-y-6">
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl transition-colors">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-600 dark:bg-blue-500"></span>
                    HOẠT ĐỘNG KHÁC
                  </h3>

                  <div className="space-y-4 text-xs">
                    {danhSachLienQuan.map((item) => (
                      <Link
                        key={item.id}
                        href={`/hoat-dong/${item.slug}`}
                        className="flex items-center gap-3 group p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition"
                      >
                        <div className="w-16 h-14 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                          {item.anh_dai_dien ? (
                            <img src={getMediaUrl(item.anh_dai_dien)} alt={item.tieu_de} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-600 font-bold">🎪 THCS</div>
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-blue-400 transition line-clamp-2 leading-snug">
                            {item.tieu_de}
                          </h4>
                          <div className="text-[10px] text-slate-500">
                            {item.ngay_xuat_ban ? new Date(item.ngay_xuat_ban).toLocaleDateString('vi-VN') : ''}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}