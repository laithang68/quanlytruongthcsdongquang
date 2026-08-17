'use client';

import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/api';

export interface VanBanHomeItem {
  id: string;
  ten_van_ban: string;
  so_hieu: string;
  ngay_ban_hanh: string;
  mo_ta?: string;
  nguoi_ky?: string;
  loai_van_ban?: { id?: string; ten: string; ma?: string };
  tep_tin?: { id?: string; url: string; ten_goc?: string };
}

interface HomeVanBanSectionProps {
  danhSachVanBan: VanBanHomeItem[];
}

export default function HomeVanBanSection({ danhSachVanBan }: HomeVanBanSectionProps) {
  const router = useRouter();

  return (
    <section className="bg-white dark:bg-slate-900 border border-rlate-200 dark:border-rlate-800 rounded-md p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden transition-colors">
      {/* LOGO TRƯỜNG WATERMARK NỀN NHẸ PHÍA SAU KHỐI TRANG CHỦ */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] dark:opacity-[0.025] select-none">
        <img src="/images/logo-truong.png" alt="Watermark Logo" className="w-80 h-80 object-contain" />
      </div>

      {/* HEADER KHỐI VĂN BẢN CHỈ ĐẠO ĐIỀU HÀNH */}
      <div className="flex items-center justify-between border-b border-rlate-200 dark:border-rlate-800 pb-3 relative z-10">
        <h3 className="text-base sm:text-lg font-semibold text-amber-600 dark:text-amber-400 tracking-tight uppercase flex items-center gap-2.5">
          <span className="text-xl">🇻🇳</span>
          <span>VĂN BẢN CHỈ ĐẠO ĐIỀU HÀNH</span>
        </h3>
        <button
          onClick={() => router.push('/van-ban')}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline flex items-center gap-1 transition"
        >
          <span>Xem tất cả</span>
          <span>→</span>
        </button>
      </div>

      {/* BẢNG TRÍCH XUẤT 5 VĂN BẢN MỚI NHẤT TRÊN TRANG CHỦ */}
      {danhSachVanBan.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-950/70 border border-rlate-200 dark:border-rlate-800/80 rounded-2xl">
          Đang cập nhật danh sách văn bản chỉ đạo điều hành mới nhất.
        </div>
      ) : (
        <div className="relative z-10">
          <div className="overflow-x-auto rounded-2xl border  dark:border-rlate-800/80 shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[550px]">
              {/* HEADER BẢNG MÀU VÀNG #FDC65E THEO CHỈ THỊ MỚI */}
              <thead className="bg-[#FDC65E] dark:bg-slate-950 text-slate-900 dark:text-amber-400 font-black uppercase text-[11px] border-b border-[#e5b250] dark:border-rlate-800 tracking-wider">
                <tr>
                  <th className="p-3 text-center w-[22%] border-r border-[#e5b250] dark:border-rlate-800">
                    Số ký hiệu
                  </th>
                  <th className="p-3 text-center w-[20%] border-r border-[#e5b250] dark:border-rlate-800">
                    Ngày ban hành
                  </th>
                  <th className="p-3 text-left w-[44%] border-r border-[#e5b250] dark:border-rlate-800">
                    Trích yếu nội dung
                  </th>
                  <th className="p-3 text-center w-[14%]">
                    Tệp tin
                  </th>
                </tr>
              </thead>

              {/* HÀNG DỮ LIỆU VĂN BẢN TRANG CHỦ HOẠT ĐỘNG CHUẨN CẢ LIGHT & DARK MODE */}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/90">
                {danhSachVanBan.slice(0, 5).map((vb) => (
                  <tr
                    key={vb.id}
                    onClick={() => router.push(`/van-ban/${vb.id}`)}
                    className="hover:bg-amber-50/70 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                  >
                    {/* SỐ KÝ HIỆU */}
                    <td className="p-3 text-center font-mono font-bold text-blue-700 dark:text-amber-400 border-r border-rlate-200 dark:border-rlate-800/60 whitespace-nowrap">
                      <span className="group-hover:underline group-hover:text-amber-600 dark:group-hover:text-amber-300 transition">
                        {vb.so_hieu}
                      </span>
                    </td>

                    {/* NGÀY BAN HÀNH */}
                    <td className="p-3 text-center text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap border-r border-rlate-200 dark:border-rlate-800/60">
                      {vb.ngay_ban_hanh ? new Date(vb.ngay_ban_hanh).toLocaleDateString('vi-VN') : '---'}
                    </td>

                    {/* TRÍCH YẾU */}
                    <td className="p-3 text-left space-y-1 border-r border-rlate-200 dark:border-rlate-800/60">
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-amber-600 dark:group-hover:text-amber-300 transition line-clamp-1 leading-snug">
                        {vb.ten_van_ban}
                      </div>
                      {vb.mo_ta && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                          {vb.mo_ta}
                        </p>
                      )}
                    </td>

                    {/* TỆP TIN ĐÍNH KÈM / ICON PDF NỔI BẬT */}
                    <td className="p-3 text-center whitespace-nowrap">
                      {vb.tep_tin ? (
                        <a
                          href={getMediaUrl(vb.tep_tin.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-500/10 dark:hover:bg-rose-600 dark:text-rose-400 dark:hover:text-white border border-rose-200 dark:border-rose-500/20 font-bold text-[11px] transition shadow-xs"
                          title="Tải tệp văn bản"
                        >
                          📄 PDF
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                          ---
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
