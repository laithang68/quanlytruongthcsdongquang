'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface DanhMucTL {
  id: string;
  ten: string;
  ma: string;
}

interface TepTinTL {
  id: string;
  ten_goc: string;
  url: string;
  loai_tap_tin: string;
  kich_thuoc: number;
}

interface TaiLieuDetail {
  id: string;
  ten_tai_lieu: string;
  mo_ta?: string;
  tac_gia?: string;
  duong_dan_lien_ket?: string;
  anh_thumb?: string;
  luot_tai: number;
  ngay_tao: string;
  danh_muc_tai_lieu?: DanhMucTL;
  tep_tin?: TepTinTL;
  nguoi_tao?: { ho_ten: string };
}

export default function TrangChiTietTaiLieuSo() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [taiLieu, setTaiLieu] = useState<TaiLieuDetail | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(false);
  const [xemTrucTuyen, setXemTrucTuyen] = useState(false);

  // PDF Blob URL State
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
  const [dangTaiPdfBlob, setDangTaiPdfBlob] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    setDangTai(true);
    setLoi(false);

    fetch(getApiUrl(`/api/v1/thu-vien-so/cong-khai/${encodeURIComponent(id)}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && data.du_lieu) {
          setTaiLieu(data.du_lieu);
        } else {
          setLoi(true);
        }
      })
      .catch(() => setLoi(true))
      .finally(() => setDangTai(false));
  }, [id]);

  const isPdf = Boolean(
    taiLieu?.tep_tin?.url?.toLowerCase().endsWith('.pdf') ||
    taiLieu?.tep_tin?.ten_goc?.toLowerCase().endsWith('.pdf')
  );

  useEffect(() => {
    if (isPdf && taiLieu?.tep_tin?.url) {
      setDangTaiPdfBlob(true);
      const streamUrl = getApiUrl(`/api/v1/tep-tin/xem-pdf?path=${encodeURIComponent(taiLieu.tep_tin.url)}`);
      let isMounted = true;
      let createdUrl = '';

      fetch(streamUrl, { credentials: 'include' })
        .then((res) => res.blob())
        .then((blob) => {
          if (!isMounted) return;
          createdUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
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
  }, [taiLieu?.tep_tin?.url, isPdf]);

  const taiTepTinVeMay = () => {
    if (!taiLieu?.tep_tin) return;
    const downloadUrl = getApiUrl(
      `/api/v1/tep-tin/tai-ve?path=${encodeURIComponent(taiLieu.tep_tin.url)}&ten_goc=${encodeURIComponent(taiLieu.tep_tin.ten_goc)}`
    );
    let iframe = document.getElementById('hidden-downloader-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'hidden-downloader-frame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    iframe.src = downloadUrl;
  };

  const getThumbUrl = (anhThumb?: string) => {
    if (!anhThumb) return '';
    if (anhThumb.startsWith('http://') || anhThumb.startsWith('https://')) return anhThumb;
    return getMediaUrl(anhThumb);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb
            items={[
              { label: 'Thư viện Số', href: '/thu-vien-so' },
              { label: taiLieu ? taiLieu.ten_tai_lieu : 'Chi tiết tài liệu' },
            ]}
          />

          {dangTai ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs shadow-xl">
              ⏳ Đang tải thông tin tài liệu số...
            </div>
          ) : loi || !taiLieu ? (
            <div className="p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
              <div className="text-3xl">📭</div>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">Không tìm thấy tài liệu số</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tài liệu số không tồn tại, đã bị ẩn hoặc bị gỡ bỏ khỏi hệ thống.</p>
              <button
                onClick={() => router.push('/thu-vien-so')}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-md"
              >
                ← Trở về Thư viện Số
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl transition-colors">
              {/* Header Info */}
              <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="px-3.5 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-extrabold border border-orange-200 dark:border-orange-500/20">
                    📚 {taiLieu.danh_muc_tai_lieu?.ten || 'Tài liệu số'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    📥 {taiLieu.luot_tai} lượt tải/xem
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                  {taiLieu.ten_tai_lieu}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 font-medium">
                  <span>✍️ Tác giả / Biên soạn: <strong className="text-slate-900 dark:text-slate-200">{taiLieu.tac_gia || taiLieu.nguoi_tao?.ho_ten || 'Ban Chuyên môn'}</strong></span>
                  <span>• 📅 Ngày đăng: <strong className="text-slate-900 dark:text-slate-200">{new Date(taiLieu.ngay_tao).toLocaleDateString('vi-VN')}</strong></span>
                </div>
              </div>

              {/* THUMBNAIL DISPLAY IF EXISTS */}
              {taiLieu.anh_thumb && (
                <div className="w-full max-h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-center bg-slate-950">
                  <img
                    src={getThumbUrl(taiLieu.anh_thumb)}
                    alt={taiLieu.ten_tai_lieu}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description Box */}
              {taiLieu.mo_ta && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mô tả / Tóm tắt tài liệu:</h3>
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {taiLieu.mo_ta}
                  </div>
                </div>
              )}

              {/* EXTERNAL LINK URL CARD IF EXISTS */}
              {taiLieu.duong_dan_lien_ket && (
                <div className="p-6 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-extrabold text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2">
                      <span>🔗 Liên kết tài liệu trực tuyến (URL)</span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-mono truncate max-w-lg">
                      {taiLieu.duong_dan_lien_ket}
                    </p>
                  </div>
                  <a
                    href={taiLieu.duong_dan_lien_ket}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-lg shrink-0 inline-flex items-center gap-1.5"
                  >
                    <span>Mở tài liệu trực tuyến ↗</span>
                  </a>
                </div>
              )}

              {/* Attached File Download & Preview Card */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <span>📄 Tệp tin đính kèm</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {taiLieu.tep_tin ? (
                        <>Tên tệp: <strong>{taiLieu.tep_tin.ten_goc}</strong> • Dung lượng: <strong>{(taiLieu.tep_tin.kich_thuoc / 1024).toFixed(1)} KB</strong></>
                      ) : (
                        'Tài liệu này chưa có tệp đính kèm.'
                      )}
                    </div>
                  </div>

                  {taiLieu.tep_tin && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isPdf && (
                        <>
                          <button
                            onClick={() => setXemTrucTuyen(!xemTrucTuyen)}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5"
                          >
                            <span>{xemTrucTuyen ? '🙈 Đóng xem online' : '👁️ Xem trực tuyến'}</span>
                          </button>
                          {pdfBlobUrl && (
                            <button
                              type="button"
                              onClick={() => window.open(pdfBlobUrl, '_blank')}
                              className="px-4 py-2.5 rounded-xl bg-[#E97036] hover:bg-[#d85f25] text-white font-bold text-xs transition shadow-md flex items-center gap-1.5"
                            >
                              <span>🔗 Mở tab mới (Xem PDF)</span>
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={taiTepTinVeMay}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-lg flex items-center gap-2"
                      >
                        <span>📥 Tải tài liệu về máy</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* PDF Online Preview Box */}
                {xemTrucTuyen && isPdf && taiLieu.tep_tin && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">Xem trực tiếp tài liệu PDF:</div>
                      {pdfBlobUrl && (
                        <button
                          onClick={() => window.open(pdfBlobUrl, '_blank')}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Mở dạng tab mới ↗
                        </button>
                      )}
                    </div>
                    <div className="w-full h-[650px] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-800 flex items-center justify-center">
                      {dangTaiPdfBlob ? (
                        <div className="text-xs text-slate-400 font-medium">Đang nạp dữ liệu PDF...</div>
                      ) : pdfBlobUrl ? (
                        <iframe
                          src={pdfBlobUrl}
                          className="w-full h-full border-0"
                          title={taiLieu.ten_tai_lieu}
                        />
                      ) : (
                        <div className="text-xs text-slate-400 font-medium">Không thể nạp tệp PDF.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <button
                  onClick={() => router.push('/thu-vien-so')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold transition shadow-sm"
                >
                  ← Trở về Thư viện Số
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