'use client';

import { useRouter } from 'next/navigation';

export default function PublicFooter() {
  const router = useRouter();

  return (
    <footer className="border-t border-slate-800 bg-slate-900 dark:bg-slate-950 text-slate-300 text-xs font-sans mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Cột 1 — LOGO TRÒN TRƯỜNG & Thông tin giới thiệu (BÊN TRÁI FOOTER) */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white p-1 shadow-md border border-orange-500/40 shrink-0 flex items-center justify-center">
              <img
                src="/images/logo-truong.png"
                alt="Logo Trường THCS Đông Quang"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <h3 className="font-black text-white text-sm tracking-tight uppercase">
                TRƯỜNG THCS ĐÔNG QUANG
              </h3>
              <p className="text-[11px] text-[#FDC65E] font-bold">PHƯỜNG ĐÔNG QUANG</p>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Cổng thông tin điện tử chính thức của Trường THCS Đông Quang. Nơi cập nhật tin tức giáo dục, văn bản chỉ đạo, ứng dụng sư phạm và hoạt động nhà trường.
          </p>
        </div>

        {/* Cột 2 — Liên kết nhanh */}
        <div className="space-y-3">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider border-b border-orange-500/40 pb-1.5 inline-block">
            Liên kết nhanh
          </h4>
          <ul className="space-y-2 text-slate-300">
            <li>
              <button onClick={() => router.push('/')} className="hover:text-amber-300 transition">
                Trang chủ
              </button>
            </li>
            <li>
              <button onClick={() => router.push('/gioi-thieu')} className="hover:text-amber-300 transition">
                Giới thiệu nhà trường
              </button>
            </li>
            <li>
              <button onClick={() => router.push('/tin-tuc')} className="hover:text-amber-300 transition">
                Tin tức & Sự kiện
              </button>
            </li>
            <li>
              <button onClick={() => router.push('/thong-bao')} className="hover:text-amber-300 transition">
                Thông báo công khai
              </button>
            </li>
            <li>
              <button onClick={() => router.push('/van-ban')} className="hover:text-amber-300 transition">
                Danh mục Văn bản
              </button>
            </li>
            <li>
              <button onClick={() => router.push('/giao-vien')} className="hover:text-amber-300 transition">
                Đội ngũ Giáo viên
              </button>
            </li>
          </ul>
        </div>

        {/* Cột 3 — Thông tin liên hệ */}
        <div className="space-y-3">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider border-b border-orange-500/40 pb-1.5 inline-block">
            Thông tin Liên hệ
          </h4>
          <ul className="space-y-2 text-slate-300 leading-relaxed">
            <li>
              📍 <strong className="text-white">Địa chỉ:</strong>{" "}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Trường+THCS+Đông+Quang+Thanh+Hóa"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Trường THCS Đông Quang
                <br />P.Đông Quang - Tỉnh Thanh Hóa
              </a>
            </li>
            <li>📞 <strong className="text-white">Điện thoại:</strong> 0237.385.1234</li>
            <li>✉️ <strong className="text-white">Email:</strong>{" "}
              <a
                href="mailto:thcsdongquang@thanhhoa.edu.vn"
                className="hover:underline"
              >
                thcsdongquang@thanhhoa.edu.vn
              </a>
            </li>
            <li>
              📍 <strong className="text-white">Website:</strong>{" "}
              <a
                href="/"
                className="hover:underline"
              >
                dongquang.edu.vn
              </a>
            </li>
          </ul>
          <div className="pt-2">
            <button
              onClick={() => router.push('/quan-tri')}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white border border-white/30 transition text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm"
            >
              Đăng nhập Quản trị
            </button>
          </div>
        </div>

        {/* Cột 4 — Bản đồ & Vị trí trường */}
        <div className="space-y-3">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider border-b border-orange-500/40 pb-1.5 inline-block">
            Vị trí trường
          </h4>

          <a
            href="https://www.google.com/maps/search/?api=1&query=Trường+THCS+Đông+Quang+Thanh+Hóa"
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative overflow-hidden rounded-xl border border-white/20 shadow-sm"
            aria-label="Xem vị trí Trường THCS Đông Quang trên Google Maps"
          >
            {/* Bản đồ */}
            <iframe
              src="https://www.google.com/maps?q=Trường%20THCS%20Đông%20Quang%20Thanh%20Hóa&output=embed"
              width="100%"
              height="180"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bản đồ vị trí Trường THCS Đông Quang"
              className="pointer-events-none"
            />

            {/* Lớp phủ khi rê chuột */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition">
              <span className="opacity-0 group-hover:opacity-100 transition px-3 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold shadow-lg">
                📍 Xem vị trí trên Google Maps
              </span>
            </div>
          </a>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 text-center text-slate-400 text-[11px]">
        © 2026 TRƯỜNG THCS ĐÔNG QUANG. Tất cả quyền được bảo lưu.
        <br />Phát triển & vận hành bởi Ban Quản trị Cổng thông tin Trường THCS Đông Quang
      </div>
    </footer>
  );
}
