'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl } from '@/lib/api';

interface ThongBaoItem {
  id: string;
  tieu_de: string;
  noi_dung: string;
  doi_tuong: string;
  ngay_tao: string;
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  nguoi_tao?: { ho_ten: string };
}

function ThongBaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phieuLocParam = searchParams?.get('phieu_loc') || 'tat-ca';
  const tuKhoaParam = searchParams?.get('tu_khoa') || '';

  const [danhSach, setDanhSach] = useState<ThongBaoItem[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [tuKhoa, setTuKhoa] = useState(tuKhoaParam);
  const [phieuLoc, setPhieuLoc] = useState(phieuLocParam);
  const [trang, setTrang] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);

  const loadThongBao = (p: number, filter: string, kw: string) => {
    setDangTai(true);
    let url = `/api/v1/thong-bao/cong-khai?page=${p}&limit=10`;
    if (filter && filter !== 'tat-ca') url += `&phieu_loc=${filter}`;
    if (kw) url += `&tu_khoa=${encodeURIComponent(kw)}`;

    fetch(getApiUrl(url))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhSach(data.du_lieu || []);
          setTongSoTrang(data.tong_so_trang || 1);
        }
      })
      .catch(() => {})
      .finally(() => setDangTai(false));
  };

  useEffect(() => {
    setPhieuLoc(phieuLocParam);
    setTuKhoa(tuKhoaParam);
    loadThongBao(1, phieuLocParam, tuKhoaParam);
  }, [phieuLocParam, tuKhoaParam]);

  const xuLyTimKiem = (e: React.FormEvent) => {
    e.preventDefault();
    setTrang(1);
    loadThongBao(1, phieuLoc, tuKhoa);
  };

  const strToPlainText = (html: string) => {
    return html.replace(/<[^>]*>?/gm, '').substring(0, 180);
  };

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <PublicBreadcrumb items={[{ label: 'Danh mục Thông báo' }]} />

      {/* HEADER SECTION & TÌM KIẾM */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            THÔNG BÁO CÔNG KHAI
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            Cập nhật thông tin chỉ đạo, lịch công tác và thông báo chính thức từ Trường THCS Đông Quang
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/lich-hoat-dong')}
            className="px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-600 dark:bg-orange-600/20 text-orange-700 hover:text-white dark:text-orange-300 border border-orange-200 dark:border-orange-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            📅 Xem Lịch hoạt động
          </button>
        </div>
      </div>

      {/* thanh lọc tab & tìm kiếm */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md transition-colors">
        {/* Tabs Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setPhieuLoc('tat-ca');
              setTrang(1);
              loadThongBao(1, 'tat-ca', tuKhoa);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              phieuLoc === 'tat-ca'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            📢 Tất cả thông báo
          </button>
          <button
            onClick={() => {
              setPhieuLoc('nha-truong');
              setTrang(1);
              loadThongBao(1, 'nha-truong', tuKhoa);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              phieuLoc === 'nha-truong'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            🏫 Thông báo Nhà trường
          </button>
        </div>

        {/* Input Tìm kiếm */}
        <form onSubmit={xuLyTimKiem} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm kiếm tiêu đề, nội dung..."
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-orange-500 w-full sm:w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow shrink-0"
          >
            🔍 Tìm
          </button>
        </form>
      </div>

      {/* DANH SÁCH THÔNG BÁO */}
      {dangTai ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse">
          Đang tải danh sách thông báo công khai...
        </div>
      ) : danhSach.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
          Hiện chưa có thông báo nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="space-y-4">
          {danhSach.map((tb) => (
            <div
              key={tb.id}
              onClick={() => router.push(`/thong-bao/${tb.id}`)}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 rounded-2xl p-5 sm:p-6 space-y-3 shadow-md cursor-pointer transition-all duration-300 hover:scale-[1.005]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 font-bold text-[10px] uppercase">
                    Thông báo
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-orange-600 dark:group-hover:text-amber-300 transition-colors">
                    {tb.tieu_de}
                  </h3>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-mono shrink-0">
                  📅 {new Date(tb.ngay_tao).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {strToPlainText(tb.noi_dung)}...
              </p>

              <div className="pt-2 flex items-center justify-between text-xs text-orange-600 dark:text-orange-400 font-bold group-hover:translate-x-1 transition-transform">
                <span>Xem chi tiết thông báo →</span>
                {tb.nguoi_tao?.ho_ten && (
                  <span className="text-slate-500 dark:text-slate-500 font-normal text-[11px]">
                    Đăng bởi: {tb.nguoi_tao.ho_ten}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PHÂN TRANG */}
      {tongSoTrang > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={trang <= 1}
            onClick={() => {
              const p = trang - 1;
              setTrang(p);
              loadThongBao(p, phieuLoc, tuKhoa);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
          >
            ◄ Trang trước
          </button>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium px-2">
            Trang {trang} / {tongSoTrang}
          </span>
          <button
            disabled={trang >= tongSoTrang}
            onClick={() => {
              const p = trang + 1;
              setTrang(p);
              loadThongBao(p, phieuLoc, tuKhoa);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
          >
            Trang sau ►
          </button>
        </div>
      )}
    </main>
  );
}

export default function TrangThongBaoPublic() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Đang tải...</div>}>
          <ThongBaoContent />
        </Suspense>
      </div>
      <PublicFooter />
    </div>
  );
}