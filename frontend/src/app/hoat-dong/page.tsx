'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface DanhMucPublic {
  id: string;
  ten: string;
  slug: string;
}

interface HoatDongPublic {
  id: string;
  tieu_de: string;
  slug: string;
  mo_ta?: string;
  anh_dai_dien?: string;
  ngay_xuat_ban?: string;
  luot_xem: number;
  danh_muc?: DanhMucPublic;
}

function NoiDungTrangHoatDong() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [danhSach, setDanhSach] = useState<HoatDongPublic[]>([]);
  const [danhMucList, setDanhMucList] = useState<DanhMucPublic[]>([]);
  const [tuKhoa, setTuKhoa] = useState(searchParams?.get('tu_khoa') || '');
  const [danhMucId, setDanhMucId] = useState(searchParams?.get('danh_muc_id') || '');
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/danh-muc'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhMucList(data.du_lieu);
        }
      })
      .catch(() => {});
  }, []);

  const taiDanhSach = () => {
    setDangTai(true);
    const query = new URLSearchParams();
    if (tuKhoa) query.set('tu_khoa', tuKhoa);
    if (danhMucId) query.set('danh_muc_id', danhMucId);
    query.set('page', trang.toString());
    query.set('limit', '9');

    fetch(getApiUrl(`/api/v1/bai-viet/cong-khai?${query.toString()}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhSach(data.du_lieu);
          setTongSoTrang(data.tong_so_trang);
        }
      })
      .catch(() => {})
      .finally(() => setDangTai(false));
  };

  useEffect(() => {
    taiDanhSach();
  }, [trang, danhMucId]);

  const xuLyTimKiem = (e: React.FormEvent) => {
    e.preventDefault();
    setTrang(1);
    taiDanhSach();
  };

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <PublicBreadcrumb items={[{ label: 'Hoạt động Giáo dục & Sự kiện' }]} />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 transition-colors">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
          HOẠT ĐỘNG GIÁO DỤC & SỰ KIỆN NHÀ TRƯỜNG
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Tin tức các phong trào thi đua, sự kiện trọng đại, hoạt động ngoại khóa, trải nghiệm và công tác Đoàn - Đội trường THCS Đông Quang.
        </p>

        {/* SEARCH & FILTER BAR */}
        <form onSubmit={xuLyTimKiem} className="flex flex-wrap items-center gap-3 text-xs pt-2">
          <input
            type="text"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm kiếm tên hoạt động, sự kiện..."
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none flex-1 min-w-[200px]"
          />

          <select
            value={danhMucId}
            onChange={(e) => {
              setDanhMucId(e.target.value);
              setTrang(1);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none font-semibold"
          >
            <option value="">Tất cả Danh mục Hoạt động</option>
            {danhMucList.map((dm) => (
              <option key={dm.id} value={dm.id}>
                {dm.ten}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold text-white transition shadow-md"
          >
            🔍 Tìm kiếm
          </button>
        </form>
      </div>

      {/* ACTIVITY GRID LIST */}
      {dangTai ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          Đang tải danh sách hoạt động & sự kiện...
        </div>
      ) : danhSach.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
          Không tìm thấy hoạt động sự kiện nào phù hợp.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {danhSach.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/hoat-dong/${item.slug}`)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-blue-500/50 rounded-2xl overflow-hidden transition duration-300 cursor-pointer shadow-xl flex flex-col justify-between"
              >
                <div className="w-full h-48 bg-slate-100 dark:bg-slate-950 relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
                  {item.anh_dai_dien ? (
                    <img
                      src={getMediaUrl(item.anh_dai_dien)}
                      alt={item.tieu_de}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-700 font-bold text-xs p-4 text-center">
                      🎪 THCS ĐÔNG QUANG
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {item.danh_muc && (
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-orange-100 dark:bg-blue-500/10 text-orange-700 dark:text-blue-400 border border-orange-200 dark:border-blue-500/20 text-[10px] font-extrabold uppercase">
                        {item.danh_muc.ten}
                      </span>
                    )}
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-blue-400 transition leading-snug line-clamp-2">
                      {item.tieu_de}
                    </h3>
                    {item.mo_ta && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-normal">
                        {item.mo_ta}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
                    <span>📅 {item.ngay_xuat_ban ? new Date(item.ngay_xuat_ban).toLocaleDateString('vi-VN') : 'Mới'}</span>
                    <span className="text-orange-600 dark:text-blue-400 font-bold group-hover:translate-x-1 transition">Xem chi tiết →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tongSoTrang > 1 && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <button
                disabled={trang <= 1}
                onClick={() => setTrang(trang - 1)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-bold"
              >
                ← Trang trước
              </button>
              <span className="font-bold px-2">Trang {trang} / {tongSoTrang}</span>
              <button
                disabled={trang >= tongSoTrang}
                onClick={() => setTrang(trang + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-bold"
              >
                Trang sau ►
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function TrangHoatDongPublic() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />
        <Suspense fallback={<div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">Đang tải trang hoạt động...</div>}>
          <NoiDungTrangHoatDong />
        </Suspense>
      </div>
      <PublicFooter />
    </div>
  );
}