'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface ToChuyenMonPublic {
  id: string;
  ten: string;
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
  to_chuyen_mon: ToChuyenMonPublic;
}

export default function TrangGiaoVienPublic() {
  const router = useRouter();
  const [danhSach, setDanhSach] = useState<GiaoVienPublic[]>([]);
  const [toChuyenMonList, setToChuyenMonList] = useState<ToChuyenMonPublic[]>([]);

  const [toChuyenMonId, setToChuyenMonId] = useState('');
  const [tuKhoa, setTuKhoa] = useState('');
  const [chucVuLoc, setChucVuLoc] = useState('');
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/to-chuyen-mon'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setToChuyenMonList(data.du_lieu);
        }
      })
      .catch(() => {});
  }, []);

  const taiDanhSach = () => {
    setDangTai(true);
    const query = new URLSearchParams();
    if (toChuyenMonId) query.set('to_chuyen_mon_id', toChuyenMonId);
    if (tuKhoa.trim()) query.set('tu_khoa', tuKhoa.trim());
    if (chucVuLoc.trim()) query.set('chuc_vu', chucVuLoc.trim());

    fetch(getApiUrl(`/api/v1/giao-vien/cong-khai?${query.toString()}`))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) {
          setDanhSach(data.du_lieu);
        }
      })
      .catch(() => {})
      .finally(() => setDangTai(false));
  };

  useEffect(() => {
    taiDanhSach();
  }, [toChuyenMonId, chucVuLoc]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    taiDanhSach();
  };

  const isBGH = (cv?: string) => {
    if (!cv) return false;
    const lcv = cv.toLowerCase();
    return (
      lcv.includes('hiệu trưởng') ||
      lcv.includes('phó hiệu trưởng') ||
      lcv.includes('bgh') ||
      lcv.includes('ban giám hiệu')
    );
  };

  const banGiamHieuList = danhSach.filter((gv) => isBGH(gv.chuc_vu));
  const giaoVienThuongList = danhSach.filter((gv) => !isBGH(gv.chuc_vu));

  const renderProfileItem = (gv: GiaoVienPublic) => (
    <div
      key={gv.id}
      onClick={() => router.push(`/giao-vien/${gv.id}`)}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start gap-4 sm:gap-6 transition duration-300 cursor-pointer"
    >
      {/* ẢNH BÊN TRÁI (90-110px, OBJECT-FIT COVER) */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-orange-300 dark:border-emerald-500/40 overflow-hidden shrink-0 flex items-center justify-center font-black text-orange-600 dark:text-emerald-400 text-3xl shadow-sm group-hover:scale-102 transition duration-300">
        {gv.anh_dai_dien ? (
          <img src={getMediaUrl(gv.anh_dai_dien)} alt={gv.ho_ten} className="w-full h-full object-cover" />
        ) : (
          <span>{gv.ho_ten.charAt(0)}</span>
        )}
      </div>

      {/* THÔNG TIN BÊN PHẢI (CHIA DÒNG VỚI ĐƯỜNG PHÂN CÁCH NHẸ) */}
      <div className="flex-1 min-w-0 space-y-2 text-xs w-full">
        <div className="pb-1.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg group-hover:text-orange-600 dark:group-hover:text-emerald-400 transition tracking-tight">
            {gv.ho_ten}
          </h3>
          {gv.to_chuyen_mon?.ten && (
            <span className="px-3 py-1 rounded-full bg-orange-50 dark:bg-slate-950 text-orange-700 dark:text-blue-400 border border-orange-200 dark:border-slate-800 text-[11px] font-semibold">
              🏛️ {gv.to_chuyen_mon.ten}
            </span>
          )}
        </div>

        <div className="pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400">Chức vụ:</span>
          <strong className="text-orange-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
            {gv.chuc_vu || 'Giáo viên'}
          </strong>
        </div>

        <div className="pb-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
          <span>Học hàm, học vị / Trình độ: </span>
          <strong className="text-slate-900 dark:text-white font-semibold">
            {gv.trinh_do || 'Cử nhân Sư phạm'}
          </strong>
        </div>

        {gv.so_dien_thoai && (
          <div className="pb-1.5 border-b border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300">
            <span>Điện thoại: </span>
            <strong className="text-slate-900 dark:text-amber-300 font-bold">{gv.so_dien_thoai}</strong>
          </div>
        )}

        {gv.email && (
          <div className="font-mono text-slate-700 dark:text-slate-300 truncate">
            <span>Email: </span>
            <strong className="text-blue-600 dark:text-blue-400 font-bold">{gv.email}</strong>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb items={[{ label: 'Đội ngũ Giáo viên' }]} />

          {/* HEADER & FILTER BLOCK */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 transition-colors">
            <div>
              <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-emerald-500/10 text-orange-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-emerald-500/20">
                🏫 Sư Phạm & Chuyên Môn
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mt-2">
                DANH SÁCH HỒ SƠ GIÁO VIÊN
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                Thông tin hồ sơ năng lực sư phạm, trình độ chuyên môn cán bộ giáo viên trường THCS Đông Quang.
              </p>
            </div>

            {/* SEARCH & FILTER BAR */}
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 text-xs pt-2">
              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Nhập tên giáo viên hoặc trình độ..."
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none flex-1 min-w-[200px]"
              />

              <select
                value={toChuyenMonId}
                onChange={(e) => setToChuyenMonId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none font-semibold"
              >
                <option value="">-- Tất cả các Tổ chuyên môn --</option>
                {toChuyenMonList.map((to) => (
                  <option key={to.id} value={to.id}>
                    {to.ten}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold text-white transition shadow-md"
              >
                🔍 Tìm kiếm
              </button>
            </form>
          </div>

          {/* LIST HỒ SƠ GIÁO VIÊN (CẢI TỔ THÀNH LIST ITEM NẰM NGANG ZIGZAG CHUẨN MẪU) */}
          {dangTai ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Đang tải danh sách giáo viên...
            </div>
          ) : danhSach.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Hiện chưa có danh sách giáo viên phù hợp.
            </div>
          ) : (
            <div className="space-y-8">
              {/* NHÓM 1: BAN GIÁM HIỆU */}
              {banGiamHieuList.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-orange-300 dark:border-emerald-500/30 pb-2">
                    <span className="w-3 h-3 rounded-full bg-orange-600 dark:bg-emerald-500"></span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      BAN GIÁM HIỆU NHÀ TRƯỜNG
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {banGiamHieuList.map(renderProfileItem)}
                  </div>
                </section>
              )}

              {/* NHÓM 2: ĐỘI NGŨ GIÁO VIÊN */}
              {giaoVienThuongList.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500"></span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      ĐỘI NGŨ GIÁO VIÊN & TỔ CHUYÊN MÔN
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {giaoVienThuongList.map(renderProfileItem)}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}