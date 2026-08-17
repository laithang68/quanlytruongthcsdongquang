'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface GiaoVienDetail {
  id: string;
  ho_ten: string;
  anh_dai_dien?: string;
  chuc_vu?: string;
  trinh_do?: string;
  gioi_thieu?: string;
  email?: string;
  so_dien_thoai?: string;
  to_chuyen_mon: { id: string; ten: string };
}

export default function TrangChiTietGiaoVienPublic() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [giaoVien, setGiaoVien] = useState<GiaoVienDetail | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    if (!id) return;
    setDangTai(true);

    fetch(getApiUrl(`/api/v1/giao-vien/cong-khai/${encodeURIComponent(id)}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu) {
          setGiaoVien(data.du_lieu);
        } else {
          setLoi(true);
        }
      })
      .catch(() => setLoi(true))
      .finally(() => setDangTai(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
          <PublicBreadcrumb
            items={[
              { label: 'Đội ngũ Giáo viên', href: '/giao-vien' },
              { label: giaoVien ? giaoVien.ho_ten : 'Chi tiết Giáo viên' },
            ]}
          />

          {dangTai ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Đang tải thông tin hồ sơ giáo viên...
            </div>
          ) : loi || !giaoVien ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">Không tìm thấy thông tin Giáo viên</div>
              <button
                onClick={() => router.push('/giao-vien')}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                ← Trở về danh sách giáo viên
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 transition-colors">
              {/* PROFILE HEADER BLOCK */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-200 dark:border-slate-800 pb-8 text-center sm:text-left">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-100 dark:bg-slate-950 border-4 border-orange-300 dark:border-emerald-500/30 overflow-hidden shrink-0 flex items-center justify-center font-bold text-orange-600 dark:text-emerald-400 text-4xl shadow-xl">
                  {giaoVien.anh_dai_dien ? (
                    <img
                      src={getMediaUrl(giaoVien.anh_dai_dien)}
                      alt={giaoVien.ho_ten}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{giaoVien.ho_ten.charAt(0)}</span>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-blue-500/10 text-orange-700 dark:text-blue-400 border border-orange-200 dark:border-blue-500/20 text-xs font-bold uppercase tracking-wider">
                      👨‍🏫 CÁN BỘ GIÁO VIÊN
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{giaoVien.ho_ten}</h1>
                    <div className="text-base font-extrabold text-orange-600 dark:text-emerald-400">{giaoVien.chuc_vu || 'Giáo viên'}</div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span>🏛️ Tổ chuyên môn:</span>
                      <Link href={`/to-chuc/${giaoVien.to_chuyen_mon?.id}`} className="text-orange-600 dark:text-amber-400 font-extrabold hover:underline">
                        {giaoVien.to_chuyen_mon?.ten}
                      </Link>
                    </div>

                    {giaoVien.trinh_do && (
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span>🎓 Trình độ:</span>
                        <strong className="text-slate-900 dark:text-white">{giaoVien.trinh_do}</strong>
                      </div>
                    )}

                    {giaoVien.so_dien_thoai && (
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
                        <span>📞 Điện thoại:</span>
                        <strong className="text-slate-900 dark:text-amber-300">{giaoVien.so_dien_thoai}</strong>
                      </div>
                    )}

                    {giaoVien.email && (
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
                        <span>✉️ Email:</span>
                        <strong className="text-blue-600 dark:text-blue-400">{giaoVien.email}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BIOGRAPHY & INTRODUCTION SECTION */}
              <div className="space-y-4">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-600 dark:bg-emerald-500"></span>
                  GIỚI THIỆU & QUÁ TRÌNH CÔNG TÁC
                </h2>

                {giaoVien.gioi_thieu ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                    {giaoVien.gioi_thieu}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-500 text-center">
                    Thông tin giới thiệu chi tiết đang được giáo viên cập nhật.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}