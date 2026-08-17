'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface TepTinItem {
  id: string;
  ten_goc: string;
  url: string;
  loai_tap_tin: string;
  kich_thuoc: number;
}

interface VanBanDetail {
  id: string;
  ten_van_ban: string;
  so_hieu: string;
  ngay_ban_hanh: string;
  nguoi_ky?: string;
  mo_ta?: string;
  loai_van_ban: { id: string; ten: string; ma: string };
  tep_tin?: TepTinItem;
}

export default function TrangChiTietVanBan() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [vanBan, setVanBan] = useState<VanBanDetail | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(false);

  // Blob URL để chống IDM bắt link
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
  const [dangTaiPdfBlob, setDangTaiPdfBlob] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    setDangTai(true);
    setLoi(false);

    fetch(getApiUrl(`/api/v1/van-ban/cong-khai/${encodeURIComponent(id)}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu) {
          setVanBan(data.du_lieu);
        } else {
          setLoi(true);
        }
      })
      .catch(() => setLoi(true))
      .finally(() => setDangTai(false));
  }, [id]);

  const isPdf = Boolean(
    vanBan?.tep_tin &&
      (vanBan.tep_tin.url.toLowerCase().endsWith('.pdf') ||
        vanBan.tep_tin.ten_goc.toLowerCase().endsWith('.pdf') ||
        vanBan.tep_tin.loai_tap_tin?.toLowerCase().includes('pdf'))
  );

  // Nạp tệp PDF vào bộ nhớ Blob URL (chống tuyệt đối IDM bắt liên kết)
  useEffect(() => {
    if (isPdf && vanBan?.tep_tin?.url) {
      setDangTaiPdfBlob(true);
      const streamUrl = getApiUrl(`/api/v1/tep-tin/xem-pdf?path=${encodeURIComponent(vanBan.tep_tin.url)}`);
      
      let isMounted = true;
      let createdUrl = '';

      fetch(streamUrl)
        .then((res) => res.blob())
        .then((blob) => {
          if (!isMounted) return;
          createdUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(createdUrl);
        })
        .catch((err) => console.error('Lỗi nạp PDF Blob:', err))
        .finally(() => {
          if (isMounted) setDangTaiPdfBlob(false);
        });

      return () => {
        isMounted = false;
        if (createdUrl) {
          URL.revokeObjectURL(createdUrl);
        }
      };
    }
  }, [vanBan?.tep_tin?.url, isPdf]);

  // Tải tệp trực tiếp bằng JS Blob (Chống IDM bắt link)
  const handleDownloadFile = async () => {
    if (!vanBan?.tep_tin) return;
    try {
      const downloadUrl = getApiUrl(`/api/v1/tep-tin/tai-ve?path=${encodeURIComponent(vanBan.tep_tin.url)}&ten_goc=${encodeURIComponent(vanBan.tep_tin.ten_goc)}`);
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = vanBan.tep_tin.ten_goc;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi tải tệp:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb
            items={[
              { label: 'Văn bản chỉ đạo', href: '/van-ban' },
              { label: vanBan ? vanBan.ten_van_ban : 'Chi tiết văn bản' },
            ]}
          />

          {dangTai ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Đang tải thông tin văn bản...
            </div>
          ) : loi || !vanBan ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">Không tìm thấy văn bản</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Văn bản không tồn tại hoặc đã bị gỡ bỏ.</p>
              <button
                onClick={() => router.push('/van-ban')}
                className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#d85f25] text-white font-bold text-xs"
              >
                ← Trở về danh mục văn bản
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl transition-colors">
              {/* Header chi tiết văn bản */}
              <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-emerald-500/10 text-orange-700 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wider border border-orange-200 dark:border-emerald-500/20">
                    {vanBan.loai_van_ban?.ten || 'Văn bản'}
                  </span>
                  <span className="font-mono text-blue-700 dark:text-amber-400 text-xs font-bold bg-blue-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-slate-800">
                    Số hiệu: {vanBan.so_hieu}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {vanBan.ten_van_ban}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 font-medium">
                  <span>📅 Ngày ban hành: <strong className="text-slate-900 dark:text-slate-200">{new Date(vanBan.ngay_ban_hanh).toLocaleDateString('vi-VN')}</strong></span>
                  {vanBan.nguoi_ky && (
                    <span>• Người ký ban hành: <strong className="text-slate-900 dark:text-slate-200">{vanBan.nguoi_ky}</strong></span>
                  )}
                </div>
              </div>

              {/* Mô tả ngắn / Trích yếu */}
              {vanBan.mo_ta && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trích yếu nội dung:</h3>
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {vanBan.mo_ta}
                  </div>
                </div>
              )}

              {/* XEM TRỰC TIẾP FILE PDF NGAY TRÊN TRANG VÀ NÚT TẢI VỀ (BLOB URL CHỐNG IDM BẮT VẮT) */}
              {isPdf && vanBan.tep_tin && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                      Xem trực tiếp văn bản PDF:
                    </h3>
                    <div className="flex items-center gap-2">
                      {pdfBlobUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(pdfBlobUrl, '_blank')}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5"
                        >
                          <span>👁️ Mở tab mới (Xem PDF)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleDownloadFile}
                        className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#d85f25] text-white font-bold text-xs transition shadow-md flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Tải về máy</span>
                      </button>
                    </div>
                  </div>

                  {/* KHỐI XEM VĂN BẢN PDF BẰNG BLOB URL NỘI BỘ (100% CHỐNG IDM BẮT CẮT LINK) */}
                  <div className="w-full h-[650px] sm:h-[800px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-slate-950 relative">
                    {dangTaiPdfBlob ? (
                      <div className="flex items-center justify-center h-full text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Đang nạp dữ liệu văn bản PDF...
                      </div>
                    ) : pdfBlobUrl ? (
                      <iframe
                        src={pdfBlobUrl}
                        className="w-full h-full border-0"
                        title={vanBan.ten_van_ban}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-slate-500">
                        Không thể nạp tệp PDF.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CARD TẢI FILE ĐÍNH KÈM CHUNG */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Tệp tin văn bản đính kèm</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    {vanBan.tep_tin ? vanBan.tep_tin.ten_goc : 'Chưa đính kèm tệp văn bản.'}
                  </div>
                </div>

                {vanBan.tep_tin && (
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="px-5 py-2.5 rounded-xl bg-[#E97036] hover:bg-[#d85f25] text-white font-bold text-xs transition shadow-lg shrink-0 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Tải tệp về máy ({(vanBan.tep_tin.kich_thuoc / 1024).toFixed(1)} KB)</span>
                  </button>
                )}
              </div>

              {/* NÚT QUAY LẠI */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <button
                  onClick={() => router.push('/van-ban')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold transition"
                >
                  ← Trở về danh mục Văn bản
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}