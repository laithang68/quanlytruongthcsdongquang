'use client';

import { useEffect, useState } from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface VideoItem {
  id: string;
  tieu_de: string;
  slug: string;
  mo_ta?: string;
  url_video: string;
  anh_thumbnail?: string;
  luot_xem: number;
  ngay_tao: string;
}

export default function TrangVideoPublic() {
  const [danhSach, setDanhSach] = useState<VideoItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [page, setPage] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [tuKhoa, setTuKhoa] = useState('');
  const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState('');
  const [dangTai, setDangTai] = useState(true);

  const taiDanhSachVideo = () => {
    setDangTai(true);
    let url = `/api/v1/video/cong-khai?page=${page}&limit=9`;
    if (tuKhoaTimKiem.trim()) {
      url += `&tu_khoa=${encodeURIComponent(tuKhoaTimKiem.trim())}`;
    }

    fetch(getApiUrl(url))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhSach(data.du_lieu);
          setTongSoTrang(data.tong_so_trang);
          if (data.du_lieu.length > 0 && !activeVideo) {
            setActiveVideo(data.du_lieu[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setDangTai(false));
  };

  useEffect(() => {
    taiDanhSachVideo();
  }, [page, tuKhoaTimKiem]);

  const chonVideo = (v: VideoItem, autoPlayVideo = false) => {
    setActiveVideo(v);
    setIsPlaying(autoPlayVideo);
    // Gọi API chi tiết để tăng luot_xem
    fetch(getApiUrl(`/api/v1/video/cong-khai/${v.id}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu) {
          setActiveVideo(data.du_lieu);
          setDanhSach((prev) =>
            prev.map((item) => (item.id === v.id ? { ...item, luot_xem: data.du_lieu.luot_xem } : item))
          );
        }
      })
      .catch(() => {});
  };

  const submitTimKiem = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setTuKhoaTimKiem(tuKhoa);
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb items={[{ label: 'Thư viện Video' }]} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Thư viện Video Nhà trường</h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs">Tổng hợp các video sự kiện, hoạt động ngoại khóa, bài giảng số trường THCS Đông Quang</p>
            </div>

            {/* SEARCH BOX */}
            <form onSubmit={submitTimKiem} className="flex items-center gap-2">
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm kiếm video..."
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 dark:focus:border-rose-500 w-64"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-orange-600 dark:bg-rose-600 hover:bg-orange-700 dark:hover:bg-rose-700 text-white font-bold text-xs transition shrink-0"
              >
                🔍 Tìm
              </button>
            </form>
          </div>

          {/* ACTIVE VIDEO PLAYER BLOCK */}
          {activeVideo && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 transition-colors">
              <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                {!isPlaying ? (
                  <div
                    onClick={() => chonVideo(activeVideo, true)}
                    className="w-full h-full relative cursor-pointer group flex items-center justify-center"
                  >
                    {activeVideo.anh_thumbnail ? (
                      <img
                        src={getMediaUrl(activeVideo.anh_thumbnail)}
                        alt={activeVideo.tieu_de}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 font-extrabold text-lg tracking-wider">
                        📹 THCS ĐÔNG QUANG
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          chonVideo(activeVideo, true);
                        }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 text-white flex items-center justify-center text-2xl sm:text-3xl shadow-2xl group-hover:scale-110 transition duration-300 ring-4 ring-white/30"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                ) : activeVideo.url_video.includes('youtube.com') || activeVideo.url_video.includes('youtu.be') ? (
                  <iframe
                    src={getYoutubeEmbedUrl(activeVideo.url_video)}
                    title={activeVideo.tieu_de}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  ></iframe>
                ) : (
                  <video
                    controls
                    autoPlay
                    src={getMediaUrl(activeVideo.url_video)}
                    className="w-full h-full object-contain bg-black"
                  />
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{activeVideo.tieu_de}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span>📅 Ngày đăng: {new Date(activeVideo.ngay_tao).toLocaleDateString('vi-VN')}</span>
                  <span>• 👁️ Lượt xem: <strong className="text-orange-600 dark:text-rose-400">{activeVideo.luot_xem}</strong></span>
                </div>
                {activeVideo.mo_ta && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200 dark:border-slate-800">
                    {activeVideo.mo_ta}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* VIDEO GRID LIST */}
          {dangTai ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Đang tải danh sách video...
            </div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Hiện chưa có video công khai.
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 dark:bg-rose-500"></span>
                TẤT CẢ VIDEO
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {danhSach.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      chonVideo(v, true);
                      window.scrollTo({ top: 150, behavior: 'smooth' });
                    }}
                    className={`group bg-white dark:bg-slate-900 border ${
                      activeVideo?.id === v.id ? 'border-orange-600 dark:border-rose-500 ring-2 ring-orange-500/30' : 'border-slate-200 dark:border-slate-800 hover:border-orange-500'
                    } rounded-2xl overflow-hidden transition cursor-pointer shadow-md flex flex-col justify-between`}
                  >
                    <div className="w-full aspect-video bg-slate-200 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                      {v.anh_thumbnail ? (
                        <img
                          src={getMediaUrl(v.anh_thumbnail)}
                          alt={v.tieu_de}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-300 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs">
                          📹 THCS ĐÔNG QUANG
                        </div>
                      )}
                      {/* OVERLAY PLAY BUTTON EXACT MATCH WITH PHOTO */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 text-white flex items-center justify-center text-lg shadow-xl group-hover:scale-110 transition ring-2 ring-white/40">
                          ▶
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <h4 className="font-bold text-rose-600 dark:text-rose-400 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:underline transition">
                        {v.tieu_de}
                      </h4>
                      <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-medium">
                        <span>🗓️ {new Date(v.ngay_tao).toLocaleDateString('vi-VN')}</span>
                        <span>👁️ {v.luot_xem}</span>
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