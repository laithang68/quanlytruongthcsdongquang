'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface GiaoVienMember {
  id: string;
  ho_ten: string;
  anh_dai_dien?: string;
  chuc_vu?: string;
  trinh_do?: string;
  gioi_thieu?: string;
}

interface ToChuyenMonDetail {
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

export default function TrangChiTietToChuyenMonPublic() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [toChuyenMon, setToChuyenMon] = useState<ToChuyenMonDetail | null>(null);
  const [danhSachGiaoVien, setDanhSachGiaoVien] = useState<GiaoVienMember[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    if (!id) return;
    setDangTai(true);

    Promise.all([
      fetch(getApiUrl(`/api/v1/to-chuyen-mon/${encodeURIComponent(id)}`)).then((res) => res.json()),
      fetch(getApiUrl(`/api/v1/to-chuyen-mon/${encodeURIComponent(id)}/giao-vien`)).then((res) => res.json()),
    ])
      .then(([toRes, gvRes]) => {
        if (toRes.thanh_cong && toRes.du_lieu) {
          setToChuyenMon(toRes.du_lieu);
        } else {
          setLoi(true);
        }
        if (gvRes.thanh_cong) {
          setDanhSachGiaoVien(gvRes.du_lieu);
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
              { label: 'Cơ cấu Tổ chức', href: '/to-chuc' },
              { label: toChuyenMon ? toChuyenMon.ten : 'Chi tiết Tổ chuyên môn' },
            ]}
          />

          {dangTai ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Đang tải danh sách thành viên tổ...
            </div>
          ) : loi || !toChuyenMon ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">Không tìm thấy thông tin Tổ chuyên môn</div>
              <button
                onClick={() => router.push('/to-chuc')}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                ← Trở về Cơ cấu tổ chức
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* TOP BANNER */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl transition-colors">
                <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-emerald-500/10 text-orange-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-emerald-500/20">
                  TỔ CHUYÊN MÔN
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{toChuyenMon.ten}</h1>
                {toChuyenMon.mo_ta && <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">{toChuyenMon.mo_ta}</p>}
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
                  <div>👥 Tổng số thành viên: <strong className="text-orange-600 dark:text-emerald-400">{danhSachGiaoVien.length} Giáo viên</strong></div>
                  <div>⭐ Tổ trưởng: <strong className="text-slate-900 dark:text-white">{toChuyenMon.truong_to ? toChuyenMon.truong_to.ho_ten : 'Chưa phân công'}</strong></div>
                </div>
              </div>

              {/* LIST OF TEACHERS IN THIS DEPARTMENT */}
              <div className="space-y-4">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-600 dark:bg-blue-500"></span>
                  DANH SÁCH GIÁO VIÊN TRONG TỔ
                </h2>

                {danhSachGiaoVien.length === 0 ? (
                  <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
                    Tổ chuyên môn này hiện chưa có danh sách giáo viên.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {danhSachGiaoVien.map((gv) => (
                      <Link
                        key={gv.id}
                        href={`/giao-vien/${gv.id}`}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-emerald-500/50 rounded-2xl p-6 transition shadow-xl text-center space-y-3 flex flex-col items-center justify-between cursor-pointer"
                      >
                        <div className="space-y-3 w-full">
                          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950 border-2 border-orange-300 dark:border-emerald-500/30 overflow-hidden mx-auto flex items-center justify-center font-bold text-orange-600 dark:text-emerald-400 text-xl shadow-md">
                            {gv.anh_dai_dien ? (
                              <img src={getMediaUrl(gv.anh_dai_dien)} alt={gv.ho_ten} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            ) : (
                              <span>{gv.ho_ten.charAt(0)}</span>
                            )}
                          </div>

                          <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-emerald-400 transition">{gv.ho_ten}</h3>
                            <p className="text-xs font-semibold text-orange-600 dark:text-emerald-400 mt-0.5">{gv.chuc_vu || 'Giáo viên'}</p>
                          </div>
                        </div>

                        {gv.trinh_do && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80 w-full">
                            Trình độ: <strong className="text-slate-800 dark:text-slate-200">{gv.trinh_do}</strong>
                          </div>
                        )}
                      </Link>
                    ))}
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