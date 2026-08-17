'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface LoaiVanBanItem {
  id: string;
  ten: string;
  ma: string;
}

interface TepTinItem {
  id: string;
  ten_goc: string;
  url: string;
  loai_tap_tin: string;
  kich_thuoc: number;
}

interface VanBanPublicItem {
  id: string;
  ten_van_ban: string;
  so_hieu: string;
  ngay_ban_hanh: string;
  nguoi_ky?: string;
  mo_ta?: string;
  loai_van_ban: LoaiVanBanItem;
  tep_tin?: TepTinItem;
}

function NoiDungTrangVanBan() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMa = searchParams?.get('loai_van_ban_ma') || searchParams?.get('loai_van_ban_id') || '';
  const initialTuKhoa = searchParams?.get('tu_khoa') || '';

  const [danhSach, setDanhSach] = useState<VanBanPublicItem[]>([]);
  const [loaiVanBanList, setLoaiVanBanList] = useState<LoaiVanBanItem[]>([]);
  
  // Filter States
  const [tuKhoa, setTuKhoa] = useState(initialTuKhoa);
  const [loaiVanBanMa, setLoaiVanBanMa] = useState(initialMa);
  const [coQuanBanHanh, setCoQuanBanHanh] = useState('');
  const [thoiGian, setThoiGian] = useState('');
  
  const [trang, setTrang] = useState(1);
  const [tongSo, setTongSo] = useState(0);
  const [tongSoTrang, setTongSoTrang] = useState(1);
  const [dangTai, setDangTai] = useState(true);

  // Blob PDF Modal State (Chống 100% IDM bắt link HTTP)
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
    setLoaiVanBanMa(initialMa);
    setTuKhoa(initialTuKhoa);
  }, [initialMa, initialTuKhoa]);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/loai-van-ban'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setLoaiVanBanList(data.du_lieu || []);
        }
      })
      .catch(() => {});
  }, []);

  const taiDanhSach = (p: number, code: string, kw: string, cq: string, tg: string) => {
    setDangTai(true);
    let url = `/api/v1/van-ban/cong-khai?page=${p}&limit=10`;
    if (kw) url += `&tu_khoa=${encodeURIComponent(kw)}`;
    if (code) url += `&loai_van_ban_ma=${encodeURIComponent(code)}`;
    if (cq) url += `&co_quan_ban_hanh=${encodeURIComponent(cq)}`;
    if (tg) url += `&thoi_gian=${encodeURIComponent(tg)}`;

    fetch(getApiUrl(url))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhSach(data.du_lieu || []);
          setTongSo(data.tong_so || 0);
          setTongSoTrang(data.tong_so_trang || 1);
        }
      })
      .catch(() => {})
      .finally(() => setDangTai(false));
  };

  useEffect(() => {
    taiDanhSach(trang, loaiVanBanMa, tuKhoa, coQuanBanHanh, thoiGian);
  }, [trang, loaiVanBanMa, coQuanBanHanh, thoiGian]);

  const xuLyTimKiem = (e: React.FormEvent) => {
    e.preventDefault();
    setTrang(1);
    taiDanhSach(1, loaiVanBanMa, tuKhoa, coQuanBanHanh, thoiGian);
  };

  const xoaBoLoc = () => {
    setTuKhoa('');
    setLoaiVanBanMa('');
    setCoQuanBanHanh('');
    setThoiGian('');
    setTrang(1);
    router.push('/van-ban');
    taiDanhSach(1, '', '', '', '');
  };

  // Tiêu đề động theo từng loại văn bản được chọn
  const getDynamicTitle = () => {
    switch (loaiVanBanMa) {
      case 'thong-bao-nha-truong':
        return { icon: '🏫', text: 'THÔNG BÁO NHÀ TRƯỜNG' };
      case 'van-ban-phuong-xa':
        return { icon: '🏛️', text: 'VĂN BẢN PHƯỜNG / XÃ' };
      case 'van-ban-so-gddt':
        return { icon: '🏢', text: 'VĂN BẢN SỞ GIÁO DỤC VÀ ĐÀO TẠO' };
      case 'van-ban-bo-gddt':
        return { icon: '🇻🇳', text: 'VĂN BẢN BỘ GIÁO DỤC VÀ ĐÀO TẠO' };
      default:
        return { icon: '🇻🇳', text: 'VĂN BẢN CHỈ ĐẠO ĐIỀU HÀNH' };
    }
  };

  const dynamicHeader = getDynamicTitle();

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <PublicBreadcrumb items={[{ label: 'Văn bản Chỉ đạo & Điều hành' }]} />

      {/* SEARCH & NAVIGATION TABS AREA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl transition-colors">
        {/* BỘ LỌC DANH MỤC TAB */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setLoaiVanBanMa('');
              setTrang(1);
              router.push('/van-ban');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              !loaiVanBanMa
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            📄 Tất cả văn bản
          </button>
          <button
            onClick={() => {
              setLoaiVanBanMa('thong-bao-nha-truong');
              setTrang(1);
              router.push('/van-ban?loai_van_ban_ma=thong-bao-nha-truong');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              loaiVanBanMa === 'thong-bao-nha-truong'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            🏫 Thông báo Nhà trường
          </button>
          <button
            onClick={() => {
              setLoaiVanBanMa('van-ban-phuong-xa');
              setTrang(1);
              router.push('/van-ban?loai_van_ban_ma=van-ban-phuong-xa');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              loaiVanBanMa === 'van-ban-phuong-xa'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            🏛️ Văn bản Phường / Xã
          </button>
          <button
            onClick={() => {
              setLoaiVanBanMa('van-ban-so-gddt');
              setTrang(1);
              router.push('/van-ban?loai_van_ban_ma=van-ban-so-gddt');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              loaiVanBanMa === 'van-ban-so-gddt'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            🏢 Văn bản Sở GD&ĐT
          </button>
          <button
            onClick={() => {
              setLoaiVanBanMa('van-ban-bo-gddt');
              setTrang(1);
              router.push('/van-ban?loai_van_ban_ma=van-ban-bo-gddt');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              loaiVanBanMa === 'van-ban-bo-gddt'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            🇻🇳 Văn bản Bộ GD&ĐT
          </button>
        </div>

        {/* Ô TÌM KIẾM VĂN BẢN VÀ CÁC BỘ LỌC THAM SỐ */}
        <form onSubmit={xuLyTimKiem} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <input
            type="text"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm kiếm văn bản theo số hiệu, tên văn bản, trích yếu..."
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 flex-1 min-w-[220px]"
          />

          <select
            value={coQuanBanHanh}
            onChange={(e) => {
              setCoQuanBanHanh(e.target.value);
              setTrang(1);
            }}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">Cơ quan ban hành</option>
            <option value="Trường THCS Đông Quang">Nhà trường</option>
            <option value="Phường">Phường / Xã</option>
            <option value="Sở GD&ĐT">Sở GD&ĐT</option>
            <option value="Bộ GD&ĐT">Bộ GD&ĐT</option>
          </select>

          <select
            value={thoiGian}
            onChange={(e) => {
              setThoiGian(e.target.value);
              setTrang(1);
            }}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">Thời gian ban hành</option>
            <option value="hom-nay">Hôm nay</option>
            <option value="7-ngay">7 ngày gần đây</option>
            <option value="30-ngay">30 ngày gần đây</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white transition shadow-md shrink-0"
          >
            🔍 Tìm văn bản
          </button>

          {(tuKhoa || loaiVanBanMa || coQuanBanHanh || thoiGian) && (
            <button
              type="button"
              onClick={xoaBoLoc}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 transition shrink-0"
            >
              ✕ Xóa bộ lọc
            </button>
          )}
        </form>
      </div>

      {/* KHỐI BẢNG VĂN BẢN CHÍNH THỨC CỔNG THÔNG TIN ĐIỆN TỬ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl relative overflow-hidden transition-colors">
        {/* WATERMARK LOGO NỀN NHẸ PHÍA SAU BẢNG */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] dark:opacity-[0.025] select-none">
          <img src="/images/logo-truong.png" alt="Watermark Logo Trường" className="w-96 h-96 object-contain" />
        </div>

        {/* TIÊU ĐỀ KHỐI ĐỘNG THEO TỪNG DANH MỤC VĂN BẢN */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 relative z-10">
          <h2 className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 tracking-tight uppercase flex items-center gap-2.5">
            <span className="text-xl">{dynamicHeader.icon}</span>
            <span>{dynamicHeader.text}</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tổng số: <strong className="text-amber-600 dark:text-amber-400 font-mono">{tongSo}</strong> văn bản
          </span>
        </div>

        {/* BẢNG CHÍNH THỨC (4 CỘT CHUẨN KÍCH THƯỚC & TỶ LỆ) */}
        {dangTai ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl animate-pulse">
            Đang tải dữ liệu văn bản chỉ đạo điều hành...
          </div>
        ) : danhSach.length === 0 ? (
          <div className="p-12 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
            Không tìm thấy văn bản nào phù hợp trong danh mục này.
          </div>
        ) : (
          <div className="relative z-10 space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                {/* HEADER BẢNG MÀU VÀNG #FDC65E THEO CHỈ THỊ MỚI */}
                <thead className="bg-[#FDC65E] dark:bg-slate-950 text-slate-900 dark:text-amber-400 font-black uppercase text-[11px] border-b border-[#e5b250] dark:border-slate-800 tracking-wider">
                  <tr>
                    <th className="p-3.5 text-center w-[20%] border-r border-[#e5b250] dark:border-slate-800">
                      Số ký hiệu
                    </th>
                    <th className="p-3.5 text-center w-[18%] border-r border-[#e5b250] dark:border-slate-800">
                      Ngày ban hành
                    </th>
                    <th className="p-3.5 text-left w-[42%] border-r border-[#e5b250] dark:border-slate-800">
                      Trích yếu
                    </th>
                    <th className="p-3.5 text-center w-[20%]">
                      Tài liệu đính kèm
                    </th>
                  </tr>
                </thead>

                {/* DỮ LIỆU CÁC DÒNG VĂN BẢN - HIỂN THỊ RÕ RÀNG VỚI NỀN TRẮNG/TOI */}
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/90">
                  {danhSach.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/van-ban/${item.id}`)}
                      className="hover:bg-amber-50/70 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                    >
                      {/* 1. SỐ KÝ HIỆU (20% - căn giữa, font mono) */}
                      <td className="p-3.5 text-center font-mono font-bold text-blue-700 dark:text-amber-400 border-r border-slate-200 dark:border-slate-800/60 whitespace-nowrap">
                        <span className="group-hover:underline group-hover:text-amber-600 dark:group-hover:text-amber-300 transition">
                          {item.so_hieu}
                        </span>
                      </td>

                      {/* 2. NGÀY BAN HÀNH (18% - căn giữa, DD/MM/YYYY) */}
                      <td className="p-3.5 text-center text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap border-r border-slate-200 dark:border-slate-800/60">
                        {item.ngay_ban_hanh ? new Date(item.ngay_ban_hanh).toLocaleDateString('vi-VN') : '---'}
                      </td>

                      {/* 3. TRÍCH YẾU (42% - căn trái, tiêu đề + mô tả ngắn) */}
                      <td className="p-3.5 text-left space-y-1 border-r border-slate-200 dark:border-slate-800/60">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-amber-600 dark:group-hover:text-amber-300 transition leading-snug">
                          {item.ten_van_ban}
                        </div>
                        {item.mo_ta && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.mo_ta}
                          </p>
                        )}
                        {item.nguoi_ky && (
                          <div className="text-[10px] text-slate-500 font-medium pt-0.5">
                            Cơ quan/Người ký: {item.nguoi_ky}
                          </div>
                        )}
                      </td>

                      {/* 4. TÀI LIỆU ĐÍNH KÈM (20% - căn giữa, Nút Xem trực tuyến PDF Blob & Nút Tải về) */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {item.tep_tin ? (
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {Boolean(
                              item.tep_tin.url.toLowerCase().endsWith('.pdf') ||
                              item.tep_tin.ten_goc.toLowerCase().endsWith('.pdf') ||
                              item.tep_tin.loai_tap_tin?.toLowerCase().includes('pdf')
                            ) && (
                              <button
                                type="button"
                                onClick={(e) => handleViewPdf(item.tep_tin!.url, item.ten_van_ban, e)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-500/10 dark:hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white border border-blue-200 dark:border-blue-500/20 font-bold text-xs transition shadow-xs"
                                title="Xem trực tiếp văn bản PDF bằng Blob URL"
                              >
                                👁️ Xem
                              </button>
                            )}
                            <a
                              href={getApiUrl(`/api/v1/tep-tin/tai-ve?path=${encodeURIComponent(item.tep_tin.url)}&ten_goc=${encodeURIComponent(item.tep_tin.ten_goc)}`)}
                              download={item.tep_tin.ten_goc}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-500/10 dark:hover:bg-rose-600 dark:text-rose-400 dark:hover:text-white border border-rose-200 dark:border-rose-500/20 font-bold text-xs transition shadow-xs"
                              title="Tải tệp văn bản về máy"
                            >
                              📥 Tải về
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            Không có tệp
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PHÂN TRANG « TRƯỚC  1  2  3  SAU » */}
            {tongSoTrang > 1 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-center gap-2 text-xs">
                <button
                  disabled={trang <= 1}
                  onClick={() => setTrang(trang - 1)}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 font-bold text-slate-700 dark:text-slate-200 transition inline-flex items-center justify-center"
                >
                  « Trước
                </button>
                <div className="flex flex-wrap items-center gap-1.5 px-2">
                  {Array.from({ length: tongSoTrang }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setTrang(pageNum)}
                        className={`w-9 h-9 min-h-[36px] rounded-xl font-bold text-xs transition ${
                          trang === pageNum
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={trang >= tongSoTrang}
                  onClick={() => setTrang(trang + 1)}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 font-bold text-slate-700 dark:text-slate-200 transition inline-flex items-center justify-center"
                >
                  Sau »
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL XEM TRỰC TIẾP PDF BẰNG BLOB URL (100% CHỐNG IDM) */}
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
    </main>
  );
}

export default function TrangVanBanPublic() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />
        <Suspense fallback={<div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">Đang tải danh sách văn bản chỉ đạo...</div>}>
          <NoiDungTrangVanBan />
        </Suspense>
      </div>
      <PublicFooter />
    </div>
  );
}