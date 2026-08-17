'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl } from '@/lib/api';

interface ToChuyenMonItem {
  id: string;
  ten: string;
  mo_ta?: string;
  so_luong_giao_vien: number;
  truong_to?: {
    id: string;
    ho_ten: string;
    chuc_vu?: string;
    anh_dai_dien?: string;
  };
}

export default function TrangToChucPublic() {
  const [danhSachTo, setDanhSachTo] = useState<ToChuyenMonItem[]>([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/to-chuyen-mon'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhSachTo(data.du_lieu);
        }
      })
      .catch(() => {})
      .finally(() => setDangTai(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
          <PublicBreadcrumb items={[{ label: 'Cơ cấu Tổ chức' }]} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl transition-colors">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              CƠ CẤU TỔ CHỨC VÀ CÁC TỔ CHUYÊN MÔN
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-3xl">
              Hệ thống cơ cấu bộ máy tổ chức chuyên môn nhà trường THCS Đông Quang, phân bổ theo các bộ môn giảng dạy chuyên sâu.
            </p>
          </div>

          {/* GRID TỔ CHUYÊN MÔN */}
          {dangTai ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Đang tải cơ cấu tổ chức...
            </div>
          ) : danhSachTo.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Hiện chưa có thông tin các tổ chuyên môn.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {danhSachTo.map((to) => (
                  <Link
                    key={to.id}
                    href={`/to-chuc/${to.id}`}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-emerald-500 rounded-3xl p-6 transition duration-300 shadow-xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-orange-600 dark:group-hover:text-emerald-400 transition">
                          {to.ten}
                        </h3>
                        <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-emerald-500/10 text-orange-700 dark:text-emerald-400 border border-orange-200 dark:border-emerald-500/20 text-xs font-bold shrink-0">
                          👥 {to.so_luong_giao_vien} Giáo viên
                        </span>
                      </div>

                      {to.mo_ta && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                          {to.mo_ta}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Tổ trưởng: <strong className="text-slate-800 dark:text-slate-200">{to.truong_to ? to.truong_to.ho_ten : 'Chưa phân công'}</strong>
                      </span>
                      <span className="text-orange-600 dark:text-emerald-400 font-bold group-hover:translate-x-1 transition">
                        Xem chi tiết danh sách tổ →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}