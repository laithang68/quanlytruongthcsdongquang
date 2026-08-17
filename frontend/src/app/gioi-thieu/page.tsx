'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface ToChuyenMonPublic {
  id: string;
  ten: string;
  mo_ta?: string;
  so_luong_giao_vien: number;
  truong_to?: {
    id: string;
    ho_ten: string;
    chuc_vu?: string;
  };
}

interface GiaoVienPublic {
  id: string;
  ho_ten: string;
  anh_dai_dien?: string;
  chuc_vu?: string;
  trinh_do?: string;
  gioi_thieu?: string;
  email?: string;
  so_dien_thoai?: string;
  to_chuyen_mon: { id: string; ten: string };
}

interface GioiThieuCMS {
  id: string;
  tieu_de_chinh: string;
  tieu_de_phu?: string;
  anh_nen?: string;
  noi_dung_chinh: string;
  ngay_cap_nhat: string;
}

export default function TrangGioiThieu() {
  const [danhSachTo, setDanhSachTo] = useState<ToChuyenMonPublic[]>([]);
  const [banGiamHieu, setBanGiamHieu] = useState<GiaoVienPublic[]>([]);
  const [gioiThieuCMS, setGioiThieuCMS] = useState<GioiThieuCMS | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [daMoRongNoiDung, setDaMoRongNoiDung] = useState(false);
  const contentSectionRef = useRef<HTMLElement>(null);

  const handleToggleNoiDung = () => {
    if (!daMoRongNoiDung) {
      // 1. MỞ RỘNG: Chỉ mở rộng, TUYỆT ĐỐI KHÔNG tự động cuộn trang
      setDaMoRongNoiDung(true);
    } else {
      // 2. THU GỌN: Thu gọn và cuộn nhẹ về đầu section QUÁ TRÌNH HÌNH THÀNH VÀ PHÁT TRIỂN
      setDaMoRongNoiDung(false);
      setTimeout(() => {
        contentSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 50);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch(getApiUrl('/api/v1/to-chuyen-mon')).then((res) => res.json()),
      fetch(getApiUrl('/api/v1/giao-vien/cong-khai')).then((res) => res.json()),
      fetch(getApiUrl('/api/v1/gioi-thieu/cong-khai')).then((res) => res.json()),
    ])
      .then(([toRes, gvRes, gtRes]) => {
        if (toRes.thanh_cong) setDanhSachTo(toRes.du_lieu);
        if (gvRes.thanh_cong) {
          const bgh = gvRes.du_lieu.filter(
            (gv: GiaoVienPublic) =>
              gv.chuc_vu?.toLowerCase().includes('hiệu trưởng') ||
              gv.chuc_vu?.toLowerCase().includes('phó hiệu trưởng') ||
              gv.chuc_vu?.toLowerCase().includes('giám hiệu'),
          );
          setBanGiamHieu(bgh);
        }
        if (gtRes.thanh_cong && gtRes.du_lieu) {
          setGioiThieuCMS(gtRes.du_lieu);
        }
      })
      .catch(() => { })
      .finally(() => setDangTai(false));
  }, []);

  const heroBgUrl = gioiThieuCMS?.anh_nen
    ? `url('${getMediaUrl(gioiThieuCMS.anh_nen)}')`
    : "url('/images/slide-2.jpg')";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
          <PublicBreadcrumb items={[{ label: 'Giới thiệu Nhà trường' }]} />

          {/* HERO BANNER - LUÔN GIỮ GIAO DIỆN RIÊNG CỐ ĐỊNH */}
          <section
            className="relative overflow-hidden rounded-3xl border border-blue-900/60 shadow-2xl text-center"
            style={{
              backgroundImage: heroBgUrl,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay cố định, không phụ thuộc Dark/Light Mode */}
            <div className="absolute inset-0 bg-black/45" />

            <div className="relative z-10 p-6 sm:p-10 space-y-4">
              <div
                className="inline-flex px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider"
                style={{
                  background: 'rgba(0,0,0,0.45)',
                  border: '1px solid rgba(253,198,94,0.7)',
                  color: '#FDC65E',
                }}
              >
                GIỚI THIỆU TỔNG QUAN
              </div>

              <h1
                className="text-2xl sm:text-4xl font-black uppercase leading-tight"
                style={{
                  color: '#FFFFFF',
                  WebkitTextFillColor: '#FFFFFF',
                  textShadow: '0 3px 8px rgba(0,0,0,0.95)',
                }}
              >
                {gioiThieuCMS?.tieu_de_chinh || 'TRƯỜNG THCS ĐÔNG QUANG'}
              </h1>

              <p
                className="mx-auto max-w-4xl text-xs sm:text-sm font-semibold leading-relaxed"
                style={{
                  color: '#FFFFFF',
                  WebkitTextFillColor: '#FFFFFF',
                  textShadow: '0 2px 6px rgba(0,0,0,0.95)',
                }}
              >
                {gioiThieuCMS?.tieu_de_phu ||
                  'Cơ sở giáo dục phổ thông bậc Trung học cơ sở chất lượng cao thuộc Phường Đông Quang, thành phố Thanh Hóa. Trường luôn tiên phong trong đổi mới phương pháp giảng dạy, ứng dụng chuyển đổi số và xây dựng môi trường học đường văn minh, thân thiện, hiện đại.'}
              </p>
            </div>
          </section>

          {/* GRID THÔNG TIN CHÍNH */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* CỘT TRÁI (8 COLS) */}
            <div className="lg:col-span-8 space-y-8">
              {/* 1. NỘI DUNG GIỚI THIỆU CHUNG & LỊCH SỬ */}
              <section ref={contentSectionRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl transition-colors scroll-mt-6">
                {/* TIÊU ĐỀ SECTION GIỮ NGUYÊN CỐ ĐỊNH 100% THEO YÊU CẦU */}
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                  QUÁ TRÌNH HÌNH THÀNH VÀ PHÁT TRIỂN
                </h2>

                {/* VÙNG CHỨA NỘI DUNG THU GỌN 50% AN TOÀN VỚI RICH TEXT / HTML */}
                <div className="relative">
                  <div
                    className={`transition-all duration-300 ${daMoRongNoiDung ? 'max-h-none' : 'max-h-[260px] overflow-hidden'
                      }`}
                  >
                    {gioiThieuCMS?.noi_dung_chinh ? (
                      <div
                        className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: gioiThieuCMS.noi_dung_chinh }}
                      />
                    ) : (
                      <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                        <p>
                          Trường THCS Đông Quang được thành lập nhằm đáp ứng nhu cầu học tập của con em nhân dân Phường Đông Quang và các địa bàn lân cận thuộc Thành phố Thanh Hóa. Trải qua quá trình phấn đấu bền bỉ của các thế hệ cán bộ, giáo viên và học sinh, nhà trường đã không ngừng lớn mạnh về cả quy mô lẫn chất lượng giáo dục.
                        </p>
                        <p>
                          Với đội ngũ giáo viên tâm huyết, giàu kinh nghiệm và đạt chuẩn đào tạo, nhà trường liên tục đạt nhiều thành tích xuất sắc trong các kỳ thi học sinh giỏi các cấp, tỷ lệ học sinh tốt nghiệp THCS và trúng tuyển vào các trường THPT công lập luôn duy trì ở mức cao.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* GRADIENT MỜ KHI ĐANG THU GỌN */}
                  {!daMoRongNoiDung && (
                    <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white dark:from-slate-900 via-white/80 dark:via-slate-900/80 to-transparent pointer-events-none" />
                  )}
                </div>

                {/* NÚT "Xem Thêm ↓" / "Ẩn bớt ↑" CĂN BÊN PHẢI */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleToggleNoiDung}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-[#E97036] dark:text-amber-400 font-extrabold text-xs border border-orange-200 dark:border-orange-500/30 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    {daMoRongNoiDung ? (
                      <>
                        <span>Ẩn bớt</span>
                        <span className="text-sm">↑</span>
                      </>
                    ) : (
                      <>
                        <span>Xem Thêm</span>
                        <span className="text-sm">↓</span>
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* 2. BAN GIÁM HIỆU LÃNH ĐẠO */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    BAN GIÁM HIỆU NHÀ TRƯỜNG
                  </h2>
                  <Link href="/giao-vien" className="text-xs text-orange-600 dark:text-amber-400 font-extrabold hover:underline">
                    Xem tất cả giáo viên →
                  </Link>
                </div>

                {dangTai ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Đang tải thông tin Ban Giám hiệu...</div>
                ) : banGiamHieu.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
                    Ban Giám hiệu đang cập nhật danh sách trực tuyến.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {banGiamHieu.map((gv) => (
                      <div
                        key={gv.id}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md flex items-start gap-4 transition hover:border-orange-400 dark:hover:border-emerald-500/50"
                      >
                        {/* ẢNH BÊN TRÁI */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-orange-300 dark:border-emerald-500/40 overflow-hidden shrink-0 flex items-center justify-center font-black text-orange-600 dark:text-emerald-400 text-2xl shadow-sm">
                          {gv.anh_dai_dien ? (
                            <img src={getMediaUrl(gv.anh_dai_dien)} alt={gv.ho_ten} className="w-full h-full object-cover" />
                          ) : (
                            <span>{gv.ho_ten.charAt(0)}</span>
                          )}
                        </div>

                        {/* THÔNG TIN BÊN PHẢI */}
                        <div className="space-y-2 flex-1 min-w-0 text-xs">
                          <div className="pb-1 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight leading-snug">
                              {gv.ho_ten}
                            </h3>
                          </div>

                          <div className="pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 font-bold text-orange-600 dark:text-emerald-400">
                            <span>🎗️ Chức vụ:</span>
                            <span>{gv.chuc_vu || 'Hiệu trưởng'}</span>
                          </div>

                          <div className="pb-1 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            🎓 Học hàm, học vị: <strong className="text-slate-900 dark:text-white font-semibold">{gv.trinh_do || 'Cử nhân Sư phạm'}</strong>
                          </div>

                          {gv.so_dien_thoai && (
                            <div className="pb-1 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
                              📞 Điện thoại: <span className="text-slate-900 dark:text-amber-300 font-bold">{gv.so_dien_thoai}</span>
                            </div>
                          )}

                          {gv.email && (
                            <div className="text-slate-700 dark:text-slate-300 font-mono font-medium truncate">
                              ✉️ Email: <span className="text-blue-600 dark:text-blue-400 font-bold">{gv.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 3. SỨ MỆNH & MỤC TIÊU GIÁO DỤC */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl transition-colors">
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                  SỨ MỆNH VÀ MỤC TIÊU CHIẾN LƯỢC
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">🎯 Trí tuệ & Kỹ năng</div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">Đào tạo học sinh vững vàng kiến thức phổ thông, am hiểu công nghệ và trang bị đầy đủ kỹ năng sống kỷ nguyên số.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">🌱 Nhân cách & Đạo đức</div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">Rèn luyện đạo đức, lòng nhân ái, lòng yêu nước và ý thức trách nhiệm cộng đồng cho thế hệ tương lai.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">💻 Chuyển đổi Số</div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">Tiên phong số hóa học liệu, minh bạch thông tin quản lý và ứng dụng triệt để CNTT vào dạy và học.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* CỘT PHẢI (4 COLS SIDEBAR) */}
            <div className="lg:col-span-4 space-y-8">
              {/* CƠ CẤU TỔ CHUYÊN MÔN WIDGET */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">TỔ CHUYÊN MÔN</h3>
                  <Link href="/to-chuc" className="text-[11px] text-orange-600 dark:text-amber-400 font-extrabold hover:underline">
                    Xem tất cả →
                  </Link>
                </div>

                <div className="space-y-3 text-xs">
                  {danhSachTo.map((to) => (
                    <Link
                      key={to.id}
                      href={`/to-chuc/${to.id}`}
                      className="block p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl transition space-y-1 group"
                    >
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-amber-400 transition flex items-center justify-between">
                        <span>{to.ten}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{to.so_luong_giao_vien} GV</span>
                      </div>
                      {to.truong_to && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">Tổ trưởng: <strong className="text-slate-900 dark:text-slate-200">{to.truong_to.ho_ten}</strong></div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>

              {/* THÔNG TIN LIÊN HỆ ĐƠN VỊ */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs transition-colors">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                  📍 THÔNG TIN LIÊN HỆ
                </h3>
                <div className="space-y-2.5 text-slate-700 dark:text-slate-300">
                  <div><strong className="text-slate-900 dark:text-white">Đơn vị:</strong> TRƯỜNG THCS ĐÔNG QUANG</div>
                  <div><strong className="text-slate-900 dark:text-white">Địa chỉ:</strong> Phường Đông Quang, TP Thanh Hóa</div>
                  <div><strong className="text-slate-900 dark:text-white">Hotline:</strong> 0237.385.XXXX</div>
                  <div><strong className="text-slate-900 dark:text-white">Email:</strong> thcsdongquang@thanhhoa.edu.vn</div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}