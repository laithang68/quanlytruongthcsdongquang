'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface TepTinImage {
  id: string;
  ten_goc: string;
  url: string;
}

interface AlbumDetail {
  id: string;
  ten: string;
  slug: string;
  mo_ta?: string;
  so_luong_anh: number;
  danh_sach_anh: TepTinImage[];
  ngay_tao: string;
}

export default function TrangChiTietAlbumPublic() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    if (!id) return;
    setDangTai(true);
    setLoi(false);

    fetch(getApiUrl(`/api/v1/album/cong-khai/${encodeURIComponent(id)}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu) {
          setAlbum(data.du_lieu);
        } else {
          setLoi(true);
        }
      })
      .catch(() => setLoi(true))
      .finally(() => setDangTai(false));
  }, [id]);

  useEffect(() => {
    if (lightboxIndex === null || !album) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex((prev) => (prev !== null ? prev - 1 : null));
      if (e.key === 'ArrowRight' && lightboxIndex < album.danh_sach_anh.length - 1) setLightboxIndex((prev) => (prev !== null ? prev + 1 : null));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, album]);

  const [dangTaiAnh, setDangTaiAnh] = useState(false);

  const taiAnhTrucTiep = (url: string, filename?: string) => {
    if (!url) return;
    setDangTaiAnh(true);

    const downloadApiUrl = getApiUrl(
      `/api/v1/tep-tin/tai-ve?path=${encodeURIComponent(url)}${filename ? `&ten_goc=${encodeURIComponent(filename)}` : ''}`
    );

    // Sử dụng iframe ẩn để tải file trực tiếp về máy mà không đổi URL trang hay mở tab mới
    let iframe = document.getElementById('hidden-downloader-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'hidden-downloader-frame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    iframe.src = downloadApiUrl;

    setTimeout(() => {
      setDangTaiAnh(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb
            items={[
              { label: 'Thư viện Ảnh', href: '/thu-vien-anh' },
              { label: album ? album.ten : 'Chi tiết Album' },
            ]}
          />

          {dangTai ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Đang tải album ảnh...
            </div>
          ) : loi || !album ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">Không tìm thấy Album ảnh</div>
              <button
                onClick={() => router.push('/thu-vien-anh')}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                ← Trở về danh sách album
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-2 transition-colors">
                <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-emerald-500/10 text-orange-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-emerald-500/20">
                  📷 Album Ảnh ({album.so_luong_anh} bức hình)
                </span>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{album.ten}</h1>
                {album.mo_ta && <p className="text-xs text-slate-600 dark:text-slate-300">{album.mo_ta}</p>}
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                  📅 Ngày đăng: {new Date(album.ngay_tao).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* PHOTO GALLERY GRID */}
              {album.danh_sach_anh.length === 0 ? (
                <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
                  Album này hiện chưa có hình ảnh nào.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {album.danh_sach_anh.map((img, idx) => (
                    <div
                      key={img.id}
                      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-emerald-500/60 rounded-2xl overflow-hidden cursor-pointer aspect-square relative shadow-lg flex flex-col justify-between"
                    >
                      <img
                        src={getMediaUrl(img.url)}
                        alt={img.ten_goc}
                        onClick={() => setLightboxIndex(idx)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div
                        onClick={() => setLightboxIndex(idx)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-bold text-xs p-2"
                      >
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="px-2.5 py-1 bg-black/70 rounded-xl hover:bg-black/90 text-white font-semibold text-[11px]"
                        >
                          🔍 Phóng to
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            taiAnhTrucTiep(img.url, img.ten_goc);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-semibold text-[11px] shadow-md"
                        >
                          📥 Tải về
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxIndex !== null && album && (
        <div className="fixed inset-0 bg-black/95 z-[90] flex items-center justify-center p-3 sm:p-6 select-none">
          {/* NÚT THOÁT X - NỔI BẬT GÓC TRÊN PHẢI */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] bg-rose-600 hover:bg-rose-500 text-white font-black text-sm px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-2 cursor-pointer transition active:scale-95"
            title="Thoát (Phím Esc)"
          >
            <span className="text-lg leading-none font-black">✕</span>
            <span>Thoát</span>
          </button>

          {/* NÚT SANG TRÁI ‹ - NỔI BẬT BÊN TRÁI MÀN HÌNH */}
          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(lightboxIndex - 1)}
              className="fixed left-3 sm:left-8 top-1/2 -translate-y-1/2 z-[100] w-12 h-12 sm:w-14 sm:h-14 bg-orange-600 hover:bg-orange-500 text-white font-black text-2xl sm:text-3xl rounded-full shadow-2xl border-2 border-white flex items-center justify-center cursor-pointer transition active:scale-95"
              title="Ảnh trước (Mũi tên Trái ←)"
            >
              ‹
            </button>
          )}

          <div className="max-w-4xl max-h-[85vh] space-y-4 text-center flex flex-col items-center justify-center z-[92]">
            <div className="max-h-[68vh] max-w-[80vw] overflow-hidden flex items-center justify-center p-2 bg-slate-900/80 rounded-2xl border border-slate-700 shadow-2xl">
              <img
                src={getMediaUrl(album.danh_sach_anh[lightboxIndex].url)}
                alt={album.danh_sach_anh[lightboxIndex].ten_goc || 'Anh Goc'}
                className="max-h-[64vh] max-w-[76vw] w-auto h-auto object-contain rounded-xl shadow-2xl transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 text-xs text-white font-semibold bg-slate-900/95 border border-slate-700 px-6 py-3 rounded-2xl shadow-2xl">
              <span>
                📷 Ảnh <strong className="text-orange-400 text-sm">{lightboxIndex + 1}</strong> / <strong className="text-slate-300">{album.danh_sach_anh.length}</strong>: <span className="text-slate-300 font-normal">{album.danh_sach_anh[lightboxIndex].ten_goc}</span>
              </span>
              <button
                type="button"
                disabled={dangTaiAnh}
                onClick={() => taiAnhTrucTiep(album.danh_sach_anh[lightboxIndex].url, album.danh_sach_anh[lightboxIndex].ten_goc)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95 disabled:opacity-50 border border-emerald-400/30"
              >
                <span>📥 {dangTaiAnh ? 'Đang lưu vào máy...' : 'Tải về máy tính (Nét gốc 100%)'}</span>
              </button>
            </div>
          </div>

          {/* NÚT SANG PHẢI › - NỔI BẬT BÊN PHẢI MÀN HÌNH */}
          {lightboxIndex < album.danh_sach_anh.length - 1 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(lightboxIndex + 1)}
              className="fixed right-3 sm:right-8 top-1/2 -translate-y-1/2 z-[100] w-12 h-12 sm:w-14 sm:h-14 bg-orange-600 hover:bg-orange-500 text-white font-black text-2xl sm:text-3xl rounded-full shadow-2xl border-2 border-white flex items-center justify-center cursor-pointer transition active:scale-95"
              title="Ảnh tiếp theo (Mũi tên Phải →)"
            >
              ›
            </button>
          )}
        </div>
      )}

      <PublicFooter />
    </div>
  );
}