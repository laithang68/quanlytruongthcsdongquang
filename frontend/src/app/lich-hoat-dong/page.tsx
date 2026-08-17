'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl } from '@/lib/api';

interface HoatDongItem {
  id: string;
  tieu_de: string;
  noi_dung: string;
  doi_tuong: string;
  ngay_tao: string;
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  nguoi_tao?: { ho_ten: string };
}

function LichHoatDongContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1; // 1-12

  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(defaultMonth);
  const [viewMode, setViewMode] = useState<'lich-thang' | 'danh-sach'>('lich-thang');
  const [tuKhoa, setTuKhoa] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [danhSach, setDanhSach] = useState<HoatDongItem[]>([]);
  const [dangTai, setDangTai] = useState(true);

  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const thangNamFormatted = `${year}-${monthStr}`;

  const loadLichHoatDong = (yn: number, mn: number, kw: string) => {
    setDangTai(true);
    const mStr = mn < 10 ? `0${mn}` : `${mn}`;
    let url = `/api/v1/thong-bao/cong-khai?phieu_loc=lich-hoat-dong&thang_nam=${yn}-${mStr}&limit=50`;
    if (kw) url += `&tu_khoa=${encodeURIComponent(kw)}`;

    fetch(getApiUrl(url))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhSach(data.du_lieu || []);
        }
      })
      .catch(() => {})
      .finally(() => setDangTai(false));
  };

  useEffect(() => {
    loadLichHoatDong(year, month, tuKhoa);
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  };

  const xuLyTimKiem = (e: React.FormEvent) => {
    e.preventDefault();
    loadLichHoatDong(year, month, tuKhoa);
  };

  // Helper tính toán số ngày trong tháng và thứ bắt đầu
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sunday, 1 = Monday
  // Convert 0=Sunday to 6, 1=Monday to 0 for Monday-start grid
  const startCol = (firstDayOfWeek + 6) % 7;

  // Lọc hoạt động theo từng ngày trong tháng
  const getEventsForDay = (dayNum: number) => {
    return danhSach.filter((item) => {
      const d = item.ngay_bat_dau ? new Date(item.ngay_bat_dau) : new Date(item.ngay_tao);
      return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === dayNum;
    });
  };

  const filteredBySelectedDay = selectedDay
    ? danhSach.filter((item) => {
        const d = item.ngay_bat_dau ? new Date(item.ngay_bat_dau) : new Date(item.ngay_tao);
        return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === selectedDay;
      })
    : danhSach;

  const strToPlainText = (html: string) => {
    return html.replace(/<[^>]*>?/gm, '').substring(0, 160);
  };

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <PublicBreadcrumb
        items={[
          { label: 'Thông báo', href: '/thong-bao' },
          { label: 'Lịch hoạt động Nhà trường' },
        ]}
      />

      {/* HEADER PAGE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
            📅 KẾ HOẠCH & SỰ KIỆN NỔI BẬT
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            LỊCH HOẠT ĐỘNG NHÀ TRƯỜNG
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            Theo dõi kế hoạch chuyên môn, hoạt động Đoàn - Đội, ngoại khóa và sự kiện chung của Trường THCS Đông Quang
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setViewMode('lich-thang')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'lich-thang'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🗓️ Lịch tháng
          </button>
          <button
            onClick={() => setViewMode('danh-sach')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'danh-sach'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📋 Danh sách hoạt động
          </button>
        </div>
      </div>

      {/* THANH THÁNG & TÌM KIẾM */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md transition-colors">
        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            ◄ Tháng trước
          </button>
          <span className="text-sm font-black text-orange-600 dark:text-amber-300 uppercase font-mono px-3">
            THÁNG {monthStr}/{year}
          </span>
          <button
            onClick={nextMonth}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            Tháng sau ►
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={xuLyTimKiem} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm tên hoạt động, địa điểm..."
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-orange-500 w-full md:w-64"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow shrink-0"
          >
            🔍 Tìm
          </button>
        </form>
      </div>

      {/* A. VIEW MODE: LỊCH THÁNG (MONTHLY CALENDAR GRID) */}
      {viewMode === 'lich-thang' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-x-auto transition-colors">
            {/* Header thứ trong tuần */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3 min-w-[650px]">
              <div className="text-orange-600 dark:text-orange-400">Thứ 2</div>
              <div className="text-orange-600 dark:text-orange-400">Thứ 3</div>
              <div className="text-orange-600 dark:text-orange-400">Thứ 4</div>
              <div className="text-orange-600 dark:text-orange-400">Thứ 5</div>
              <div className="text-orange-600 dark:text-orange-400">Thứ 6</div>
              <div className="text-amber-600 dark:text-amber-400">Thứ 7</div>
              <div className="text-rose-600 dark:text-rose-400">Chủ Nhật</div>
            </div>

            {/* Grid các ngày */}
            <div className="grid grid-cols-7 gap-2 pt-3 min-w-[650px]">
              {/* Empty cells before start day */}
              {Array.from({ length: startCol }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-24 sm:h-28 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 opacity-40"></div>
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const events = getEventsForDay(dayNum);
                const hasEvents = events.length > 0;
                const isSelected = selectedDay === dayNum;

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDay(isSelected ? null : dayNum)}
                    className={`h-24 sm:h-28 rounded-2xl p-2.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-orange-100 dark:bg-orange-950/80 border-orange-500 ring-2 ring-orange-500/50 shadow-lg'
                        : hasEvents
                        ? 'bg-orange-50/80 dark:bg-slate-800/90 border-orange-400 dark:border-orange-500/50 hover:bg-orange-100/80'
                        : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${hasEvents ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-400'}`}>
                        {dayNum}
                      </span>
                      {hasEvents && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                      )}
                    </div>

                    {hasEvents ? (
                      <div className="space-y-1">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] font-bold truncate max-w-full">
                          📌 {events.length} Sự kiện
                        </span>
                        <div className="text-[10px] text-slate-800 dark:text-slate-300 font-medium line-clamp-2 leading-tight">
                          {events[0].tieu_de}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-600">--</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHI TIẾT SỰ KIỆN TRONG NGÀY ĐƯỢC CHỌN TRÊN LỊCH */}
          {selectedDay && (
            <div className="bg-white dark:bg-slate-900 border border-orange-500/40 rounded-3xl p-6 space-y-4 shadow-xl transition-colors">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  📅 HOẠT ĐỘNG NGÀY {selectedDay}/{monthStr}/{year}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold"
                >
                  ✕ Đóng bộ lọc ngày
                </button>
              </div>

              {filteredBySelectedDay.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Không có hoạt động nào được ghi nhận trong ngày này.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBySelectedDay.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/lich-hoat-dong/${item.id}`)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-orange-500 rounded-2xl p-4 space-y-2 cursor-pointer transition shadow"
                    >
                      <h4 className="font-bold text-orange-700 dark:text-amber-300 text-sm hover:underline">{item.tieu_de}</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{strToPlainText(item.noi_dung)}</p>
                      <div className="text-[11px] text-orange-600 dark:text-orange-400 font-bold pt-1">Xem chi tiết lịch →</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* B. VIEW MODE: DANH SÁCH HOẠT ĐỘNG (LIST VIEW) */}
      {(viewMode === 'danh-sach' || selectedDay === null) && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-2">
            📋 DANH SÁCH LỊCH HOẠT ĐỘNG THÁNG {monthStr}/{year}
          </h2>

          {dangTai ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse">
              Đang tải danh sách hoạt động...
            </div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Chưa có lịch hoạt động nào được ghi nhận trong tháng này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {danhSach.map((hd) => {
                const dateObj = hd.ngay_bat_dau ? new Date(hd.ngay_bat_dau) : new Date(hd.ngay_tao);
                const dateFormatted = dateObj.toLocaleDateString('vi-VN');
                const timeFormatted = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={hd.id}
                    onClick={() => router.push(`/lich-hoat-dong/${hd.id}`)}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 rounded-2xl p-5 space-y-3 shadow-lg cursor-pointer transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 font-bold text-[10px] uppercase">
                          📅 {dateFormatted}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono font-semibold">
                          ⏰ {timeFormatted}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-orange-600 dark:group-hover:text-amber-300 transition-colors leading-snug">
                        {hd.tieu_de}
                      </h3>

                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {strToPlainText(hd.noi_dung)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-orange-600 dark:text-orange-400 font-bold group-hover:translate-x-1 transition-transform">
                      <span>Xem nội dung chi tiết →</span>
                      <span className="text-slate-500 text-[10px] font-normal">Sự kiện chính thức</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function TrangLichHoatDongPublic() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Đang tải lịch hoạt động...</div>}>
          <LichHoatDongContent />
        </Suspense>
      </div>
      <PublicFooter />
    </div>
  );
}