'use client';

import { useEffect, useState, FormEvent } from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl } from '@/lib/api';

interface LopHocOption {
  id: string;
  ten_lop: string;
  khoi: number;
}

interface HocSinhPublic {
  id: string;
  ma_hoc_sinh: string;
  ho_ten: string;
  gioi_tinh?: string;
  ngay_sinh?: string;
  lop_hoc?: { ten_lop: string; khoi: number };
}

export default function TrangTraCuuHocSinhPublic() {
  const [danhSachLop, setDanhSachLop] = useState<LopHocOption[]>([]);
  const [danhSachHS, setDanhSachHS] = useState<HocSinhPublic[]>([]);

  const [selectedLopId, setSelectedLopId] = useState('');
  const [tuKhoa, setTuKhoa] = useState('');
  const [dangTai, setDangTai] = useState(false);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/lop-hoc/cong-khai'))
      .then((res) => res.json())
      .then((data) => {
        if (data.thanh_cong) setDanhSachLop(data.du_lieu);
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setDangTai(true);
    try {
      const query = new URLSearchParams();
      if (selectedLopId) query.set('lop_hoc_id', selectedLopId);
      if (tuKhoa) query.set('tu_khoa', tuKhoa);

      const res = await fetch(getApiUrl(`/api/v1/hoc-sinh/cong-khai?${query.toString()}`));
      const data = await res.json();
      if (data.thanh_cong) {
        setDanhSachHS(data.du_lieu);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb items={[{ label: 'Tra cứu Học sinh & Lớp học' }]} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 transition-colors">
            <div>
              <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-emerald-500/10 text-orange-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-emerald-500/20">
                🛡️ Bảo mật Dữ liệu Cá nhân
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">Tra cứu Học sinh & Danh sách Lớp học</h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                Kênh tra cứu công khai danh sách học sinh theo lớp. Các dữ liệu cá nhân nhạy cảm (Địa chỉ, Số điện thoại phụ huynh) được bảo vệ an toàn.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 text-xs pt-2">
              <select
                value={selectedLopId}
                onChange={(e) => setSelectedLopId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none font-semibold"
              >
                <option value="">-- Chọn Lớp học --</option>
                {danhSachLop.map((l) => (
                  <option key={l.id} value={l.id}>
                    Lớp {l.ten_lop} (Khối {l.khoi})
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Nhập tên học sinh hoặc mã số..."
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none flex-1 min-w-[200px]"
              />

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold text-white transition shadow-md"
              >
                Tra cứu ngay
              </button>
            </form>
          </div>

          {dangTai ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">Đang tra cứu dữ liệu...</div>
          ) : danhSachHS.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
              Vui lòng chọn lớp học hoặc nhập từ khóa để tra cứu.
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
                  <thead className="bg-[#FDC65E] dark:bg-slate-950 border-b border-[#e5b250] dark:border-slate-800 text-slate-900 dark:text-amber-400 uppercase text-[11px] font-black">
                    <tr>
                      <th className="p-4">STT</th>
                      <th className="p-4">Mã Học sinh</th>
                      <th className="p-4">Họ và tên</th>
                      <th className="p-4">Lớp</th>
                      <th className="p-4">Giới tính</th>
                      <th className="p-4">Ngày sinh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {danhSachHS.map((hs, idx) => (
                      <tr key={hs.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-4 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-4 font-mono text-orange-700 dark:text-emerald-400 font-bold">{hs.ma_hoc_sinh}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{hs.ho_ten}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-blue-500/10 text-orange-700 dark:text-blue-400 border border-orange-200 dark:border-blue-500/20 font-semibold">
                            Lớp {hs.lop_hoc?.ten_lop}
                          </span>
                        </td>
                        <td className="p-4">{hs.gioi_tinh || '—'}</td>
                        <td className="p-4">
                          {hs.ngay_sinh ? new Date(hs.ngay_sinh).toLocaleDateString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}