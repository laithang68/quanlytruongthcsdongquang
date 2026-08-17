'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface AlbumItem {
  id: string;
  ten: string;
  slug: string;
  mo_ta?: string;
  anh_dai_dien?: string;
  so_luong_anh: number;
  ngay_tao: string;
}

export default function TrangThuVienAnhPublic() {
  const router = useRouter();
  const [danhSach, setDanhSach] = useState<AlbumItem[]>([]);
  const [page, setPage] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [tuKhoa, setTuKhoa] = useState('');
  const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState('');
  const [dangTai, setDangTai] = useState(true);

  const taiDanhSachAlbum = () => {
    setDangTai(true);
    let url = `/api/v1/album/cong-khai?page=${page}&limit=12`;
    if (tuKhoaTimKiem.trim()) {
      url += `&tu_khoa=${encodeURIComponent(tuKhoaTimKiem.trim())}`;
    }

    fetch(getApiUrl(url))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhSach(data.du_lieu);
          setTongSoTrang(data.tong_so_trang);
        }
      })
      .catch(() => { })
      .finally(() => setDangTai(false));
  };

  useEffect(() => {
    taiDanhSachAlbum();
  }, [page, tuKhoaTimKiem]);

  const submitTimKiem = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setTuKhoaTimKiem(tuKhoa);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb items={[{ label: 'Thư viện Ảnh' }]} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Thư viện Ảnh Nhà trường</h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs">Các album hình ảnh hoạt động giáo dục, thi đua và phong trào trường THCS Đông Quang</p>
            </div>

            {/* SEARCH BOX */}
            <form onSubmit={submitTimKiem} className="flex items-center gap-2">
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm kiếm album..."
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 dark:focus:border-emerald-500 w-64"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-orange-600 dark:bg-emerald-600 hover:bg-orange-700 dark:hover:bg-emerald-700 text-white font-bold text-xs transition shrink-0"
              >
                🔍 Tìm
              </button>
            </form>
          </div>

          {dangTai ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Đang tải album ảnh...
            </div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Hiện chưa có album ảnh công khai.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {danhSach.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => router.push(`/thu-vien-anh/${album.id}`)}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-emerald-500/50 rounded-2xl overflow-hidden transition cursor-pointer shadow-xl flex flex-col justify-between"
                  >
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-950 relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
                      {album.anh_dai_dien ? (
                        <img
                          src={getMediaUrl(album.anh_dai_dien)}
                          alt={album.ten}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-700 font-bold text-xs">
                          ALBUM ẢNH
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                        {album.so_luong_anh} ảnh
                      </span>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 leading-snug group-hover:text-orange-600 dark:group-hover:text-emerald-400 transition">
                          {album.ten}
                        </h3>
                        {album.mo_ta && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {album.mo_ta}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-medium">
                        <span>📅 {new Date(album.ngay_tao).toLocaleDateString('vi-VN')}</span>
                        <span className="text-orange-600 dark:text-emerald-400 font-bold group-hover:underline">Xem album →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {tongSoTrang > 1 && (
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-bold"
                  >
                    ← Trước
                  </button>
                  <span>Trang {page} / {tongSoTrang}</span>
                  <button
                    disabled={page >= tongSoTrang}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-bold"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}