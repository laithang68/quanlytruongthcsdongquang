'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

interface TaiLieuItem {
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
}

const CHUAN_DANH_MUC = [
  { ten: 'Tất cả danh mục', slug: '' },
  { ten: 'Tài liệu tham khảo', slug: 'tai-lieu-tham-khao' },
  { ten: 'Sách giáo khoa điện tử', slug: 'sach-giao-khoa-dien-tu' },
  { ten: 'Sách tham khảo', slug: 'sach-tham-khao' },
  { ten: 'Tài liệu ôn HSG', slug: 'tai-lieu-on-hsg' },
  { ten: 'Thư viện bài giảng', slug: 'thu-vien-bai-giang' },
  { ten: 'Thư viện giáo án', slug: 'thu-vien-giao-an' },
];

function ThuVienSoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSlug = searchParams?.get('danh_muc_slug') || '';
  const initialTuKhoa = searchParams?.get('tu_khoa') || '';

  const [danhSach, setDanhSach] = useState<TaiLieuItem[]>([]);
  const [danhMucList, setDanhMucList] = useState<DanhMucTL[]>([]);
  const [tuKhoa, setTuKhoa] = useState(initialTuKhoa);
  const [danhMucSlug, setDanhMucSlug] = useState(initialSlug);
  const [page, setPage] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [dangTai, setDangTai] = useState(true);

  // Blob PDF Modal State
  const [pdfModalBlobUrl, setPdfModalBlobUrl] = useState<string>('');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [dangTaiPdfModal, setDangTaiPdfModal] = useState<boolean>(false);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  const handleViewPdf = async (tepTinUrl: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPdfTitle(title);
    setShowPdfModal(true);
    setDangTaiPdfModal(true);

    if (pdfModalBlobUrl) {
      URL.revokeObjectURL(pdfModalBlobUrl);
      setPdfModalBlobUrl('');
    }

    try {
      const streamUrl = getApiUrl(`/api/v1/tep-tin/xem-pdf?path=${encodeURIComponent(tepTinUrl)}`);
      const res = await fetch(streamUrl, { credentials: 'include' });
      if (!res.ok) throw new Error('Không thể tải PDF');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      setPdfModalBlobUrl(blobUrl);
    } catch (err) {
      console.error('Lỗi nạp PDF Blob:', err);
    } finally {
      setDangTaiPdfModal(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pdfModalBlobUrl) {
        URL.revokeObjectURL(pdfModalBlobUrl);
      }
    };
  }, [pdfModalBlobUrl]);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/thu-vien-so/danh-muc'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhMucList(data.du_lieu || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const slugFromUrl = searchParams?.get('danh_muc_slug') || '';
    setDanhMucSlug(slugFromUrl);
    setPage(1);
  }, [searchParams]);

  const taiDanhSach = () => {
    setDangTai(true);
    const query = new URLSearchParams();
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    if (danhMucSlug) query.set('danh_muc_slug', danhMucSlug);
    query.set('page', page.toString());
    query.set('limit', '10');

    fetch(getApiUrl(`/api/v1/thu-vien-so/cong-khai?${query.toString()}`))
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
    taiDanhSach();
  }, [page, danhMucSlug]);

  const chonDanhMuc = (slug: string) => {
    setDanhMucSlug(slug);
    setPage(1);
    const query = new URLSearchParams();
    if (slug) query.set('danh_muc_slug', slug);
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    router.push(`/thu-vien-so?${query.toString()}`, { scroll: false });
  };

  const xuLyTimKiem = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const query = new URLSearchParams();
    if (danhMucSlug) query.set('danh_muc_slug', danhMucSlug);
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    router.push(`/thu-vien-so?${query.toString()}`, { scroll: false });
    taiDanhSach();
  };

  const taiTepTin = (tl: TaiLieuItem) => {
    if (!tl.tep_tin) return;
    fetch(getApiUrl(`/api/v1/thu-vien-so/cong-khai/${tl.id}`)).catch(() => {});
    const downloadUrl = getApiUrl(
      `/api/v1/tep-tin/tai-ve?path=${encodeURIComponent(tl.tep_tin.url)}&ten_goc=${encodeURIComponent(tl.tep_tin.ten_goc)}`
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
    <div className="space-y-6">
      <PublicBreadcrumb items={[{ label: 'Thư viện Số' }]} />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 transition-colors">
        <div>
          <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-orange-500/20">
            📚 Thư viện Số & Kho Học liệu Điện tử
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            THƯ VIỆN SỐ – TRƯỜNG THCS ĐÔNG QUANG
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            Kho bài giảng điện tử, đề thi ôn HSG, sách giáo khoa điện tử và tài liệu chuyên môn chính thức
          </p>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={xuLyTimKiem} className="flex flex-wrap items-center gap-3 text-xs pt-2">
          <input
            type="text"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Nhập từ khóa tìm tên tài liệu, tác giả, bài giảng..."
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none flex-1 min-w-[240px]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold text-white transition shadow-md shrink-0"
          >
            🔍 Tìm kiếm
          </button>
        </form>

        {/* CATEGORY PILLS */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lọc theo Danh mục:</div>
          <div className="flex flex-wrap gap-2">
            {CHUAN_DANH_MUC.map((dm) => {
              const active = danhMucSlug === dm.slug;
              return (
                <button
                  key={dm.slug}
                  onClick={() => chonDanhMuc(dm.slug)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm border ${
                    active
                      ? 'bg-orange-600 text-white border-orange-600 shadow-orange-600/30'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500'
                  }`}
                >
                  {dm.ten}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {dangTai ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg">
          ⏳ Đang tải kho tài liệu số...
        </div>
      ) : danhSach.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs shadow-lg space-y-3">
          <div className="text-3xl">📭</div>
          <div className="font-bold text-slate-700 dark:text-slate-300">Không tìm thấy tài liệu số nào phù hợp.</div>
          <button
            onClick={() => chonDanhMuc('')}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700"
          >
            ← Xem tất cả tài liệu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {danhSach.map((tl) => (
              <div
                key={tl.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500/50 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition group"
              >
                <div>
                  {/* THUMBNAIL DISPLAY */}
                  <div className="w-full h-44 bg-slate-100 dark:bg-slate-950 overflow-hidden relative border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    {tl.anh_thumb ? (
                      <img
                        src={getThumbUrl(tl.anh_thumb)}
                        alt={tl.ten_tai_lieu}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x225/f8fafc/64748b?text=TH%C6%AF+VI%E1%BB%86N+S%E1%BB%91';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1 text-slate-400">
                        <span className="text-4xl">📚</span>
                        <span className="text-[11px] font-semibold">Tài liệu số</span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold border border-white/20">
                      {tl.danh_muc_tai_lieu?.ten || 'Tài liệu'}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>✍️ {tl.tac_gia || 'Ban Chuyên môn'}</span>
                      <span>📥 {tl.luot_tai} lượt xem</span>
                    </div>

                    <Link href={`/thu-vien-so/${tl.id}`} className="block">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-orange-600 transition cursor-pointer line-clamp-2">
                        {tl.ten_tai_lieu}
                      </h3>
                    </Link>

                    {tl.mo_ta && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {tl.mo_ta}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-3 flex items-center justify-between text-xs gap-2">
                  <span className="text-[11px] text-slate-400">
                    {new Date(tl.ngay_tao).toLocaleDateString('vi-VN')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* ƯU TIÊN LINK NGOÀI */}
                    {tl.duong_dan_lien_ket ? (
                      <a
                        href={tl.duong_dan_lien_ket}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md text-[11px] shrink-0 inline-flex items-center gap-1"
                        title="Mở liên kết tài liệu trực tuyến"
                      >
                        🔗 Xem tài liệu ↗
                      </a>
                    ) : tl.tep_tin ? (
                      <>
                        {Boolean(
                          tl.tep_tin.url?.toLowerCase().endsWith('.pdf') ||
                          tl.tep_tin.ten_goc?.toLowerCase().endsWith('.pdf') ||
                          tl.tep_tin.loai_tap_tin?.toLowerCase().includes('pdf')
                        ) && (
                          <button
                            type="button"
                            onClick={(e) => handleViewPdf(tl.tep_tin!.url, tl.ten_tai_lieu, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md text-[11px] shrink-0 inline-flex items-center gap-1"
                            title="Xem trực tiếp PDF bằng Blob URL"
                          >
                            👁️ Xem PDF
                          </button>
                        )}
                        <button
                          onClick={() => taiTepTin(tl)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition text-[11px] shrink-0"
                          title="Tải tệp đính kèm về máy"
                        >
                          📥 Tải về
                        </button>
                      </>
                    ) : (
                      <Link
                        href={`/thu-vien-so/${tl.id}`}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition shadow-md text-[11px] shrink-0"
                      >
                        Chi tiết →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tongSoTrang > 1 && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-400 shadow-md">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-bold hover:bg-orange-600 hover:text-white transition inline-flex items-center justify-center"
              >
                ← Trang trước
              </button>
              <span className="font-semibold">Trang {page} / {tongSoTrang}</span>
              <button
                disabled={page >= tongSoTrang}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-bold hover:bg-orange-600 hover:text-white transition inline-flex items-center justify-center"
              >
                Trang sau →
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL XEM TRỰC TIẾP PDF BẰNG BLOB URL */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl max-w-5xl w-full p-6 space-y-4 my-8 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                👁️ Xem trực tiếp: {selectedPdfTitle}
              </h3>
              <div className="flex items-center gap-2">
                {pdfModalBlobUrl && (
                  <button
                    onClick={() => window.open(pdfModalBlobUrl, '_blank')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                  >
                    Mở tab mới ↗
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowPdfModal(false);
                    if (pdfModalBlobUrl) {
                      URL.revokeObjectURL(pdfModalBlobUrl);
                      setPdfModalBlobUrl('');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="w-full h-[75vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center relative">
              {dangTaiPdfModal ? (
                <div className="text-xs text-slate-400 font-medium">
                  Đang tải tài liệu PDF...
                </div>
              ) : pdfModalBlobUrl ? (
                <iframe
                  src={pdfModalBlobUrl}
                  className="w-full h-full border-0"
                  title={selectedPdfTitle}
                />
              ) : (
                <div className="text-xs text-slate-400 font-medium">
                  Không thể tải tài liệu PDF.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrangThuVienSoPublic() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />
        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Đang tải Thư viện Số...</div>}>
            <ThuVienSoContent />
          </Suspense>
        </main>
      </div>
      <PublicFooter />
    </div>
  );
}