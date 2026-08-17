'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl } from '@/lib/api';

interface HoatDongDetail {
  id: string;
  tieu_de: string;
  noi_dung: string;
  ngay_tao: string;
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  nguoi_tao?: { ho_ten: string };
}

export default function TrangChiTietLichHoatDong() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [hoatDong, setHoatDong] = useState<HoatDongDetail | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    if (!id) return;
    setDangTai(true);
    setLoi(false);

    fetch(getApiUrl(`/api/v1/thong-bao/cong-khai/${encodeURIComponent(id)}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu) {
          setHoatDong(data.du_lieu);
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

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb
            items={[
              { label: 'Thông báo', href: '/thong-bao' },
              { label: 'Lịch hoạt động', href: '/lich-hoat-dong' },
              { label: hoatDong ? hoatDong.tieu_de : 'Chi tiết lịch hoạt động' },
            ]}
          />

          {dangTai ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Đang tải chi tiết hoạt động...
            </div>
          ) : loi || !hoatDong ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">Không tìm thấy hoạt động</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lịch hoạt động không tồn tại hoặc đã bị gỡ bỏ.</p>
              <button
                onClick={() => router.push('/lich-hoat-dong')}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                ← Trở về Lịch hoạt động
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl transition-colors">
              <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
                <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-extrabold uppercase tracking-wider border border-orange-200 dark:border-orange-500/20">
                  📅 Lịch Hoạt động Chính thức
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {hoatDong.tieu_de}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 font-medium">
                  <span>📅 Ngày tạo: <strong className="text-slate-900 dark:text-slate-200">{new Date(hoatDong.ngay_tao).toLocaleDateString('vi-VN')}</strong></span>
                  {hoatDong.ngay_bat_dau && (
                    <span>• Thời gian bắt đầu: <strong className="text-amber-600 dark:text-amber-400">{new Date(hoatDong.ngay_bat_dau).toLocaleString('vi-VN')}</strong></span>
                  )}
                  {hoatDong.ngay_ket_thuc && (
                    <span>• Kết thúc: <strong className="text-emerald-600 dark:text-emerald-400">{new Date(hoatDong.ngay_ket_thuc).toLocaleString('vi-VN')}</strong></span>
                  )}
                </div>
              </div>

              <div
                className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 prose dark:prose-invert max-w-none space-y-3"
                dangerouslySetInnerHTML={{ __html: hoatDong.noi_dung }}
              />

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <button
                  onClick={() => router.push('/lich-hoat-dong')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold transition"
                >
                  ← Trở về Lịch hoạt động
                </button>
                {hoatDong.nguoi_tao?.ho_ten && (
                  <span className="text-slate-500 text-[11px]">
                    Người phụ trách: {hoatDong.nguoi_tao.ho_ten}
                  </span>
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