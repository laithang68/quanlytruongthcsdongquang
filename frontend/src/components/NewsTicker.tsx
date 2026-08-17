'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';

interface BaiVietItem {
  id: string;
  tieu_de: string;
  slug: string;
}

export default function NewsTicker() {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [danhSachBaiViet, setDanhSachBaiViet] = useState<BaiVietItem[]>([]);

  // 1. Đồng hồ thời gian thực (Cập nhật mỗi 1 giây)
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayName = days[now.getDay()];
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentDateTime(`${dayName}, ${day}/${month}/${year} - ${hours}:${minutes}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Lấy dữ liệu bài viết mới nhất từ API công khai
  useEffect(() => {
    fetch(getApiUrl('/api/v1/bai-viet/cong-khai?limit=6'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong && Array.isArray(data.du_lieu)) {
          setDanhSachBaiViet(data.du_lieu);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 text-xs h-[34px] sm:h-[36px] flex items-center px-3 sm:px-6 overflow-hidden select-none transition-colors duration-300">
      <div className="max-w-7xl mx-auto w-full flex items-center gap-2.5 sm:gap-4 overflow-hidden h-full">
        
        {/* 1. BÊN TRÁI: NGÀY GIỜ CHẠY THỜI GIAN THỰC + DẤU GẠCH "|" */}
        <div className="flex items-center gap-2 font-mono font-bold text-blue-900 dark:text-amber-300 text-[11px] sm:text-xs shrink-0 whitespace-nowrap z-10 bg-slate-100 dark:bg-slate-900 pr-2">
          <span>📅 {currentDateTime || 'Thứ sáu, 14/08/2026 - 05:46'}</span>
          <span className="text-slate-400 dark:text-slate-600 font-normal">|</span>
        </div>

        {/* 2. BÊN PHẢI: DÒNG CHỮ CHẠY NGANG (PHẢI → TRÁI) LẤY TỪ API THẬT */}
        <div className="relative flex-1 overflow-hidden h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-6 font-medium text-slate-700 dark:text-slate-300">
            <span className="font-black text-blue-700 dark:text-amber-200 uppercase tracking-wide text-[11px] sm:text-xs">
              CHÀO MỪNG BẠN ĐẾN VỚI CỔNG THÔNG TIN ĐIỆN TỬ TRƯỜNG THCS ĐÔNG QUANG
            </span>

            {danhSachBaiViet.length > 0 ? (
              danhSachBaiViet.map((bv) => (
                <span key={bv.id} className="flex items-center gap-2 text-[11px] sm:text-xs">
                  <span className="text-orange-500 font-bold">•</span>
                  <span className="text-blue-600 dark:text-orange-400 font-bold uppercase text-[10px]">TIN MỚI:</span>
                  <Link
                    href={`/tin-tuc/${bv.slug}`}
                    className="hover:text-blue-600 dark:hover:text-amber-300 hover:underline font-semibold transition"
                  >
                    {bv.tieu_de}
                  </Link>
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-[11px]">
                • Cập nhật thông tin chỉ đạo, hoạt động chuyên môn và tin tức mới nhất từ Nhà trường
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
