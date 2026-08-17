'use client';

import { useState, FormEvent } from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PublicBreadcrumb from '@/components/PublicBreadcrumb';
import { getApiUrl } from '@/lib/api';

export default function TrangLienHe() {
  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [email, setEmail] = useState('');
  const [noiDung, setNoiDung] = useState('');

  const [dangGui, setDangGui] = useState(false);
  const [thongBaoThanhCong, setThongBaoThanhCong] = useState('');
  const [thongBaoLoi, setThongBaoLoi] = useState('');

  const handleGuiPhanAnh = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoThanhCong('');
    setThongBaoLoi('');

    // Validation phía Client
    if (!hoTen || !hoTen.trim()) {
      setThongBaoLoi('Vui lòng nhập Họ và tên.');
      return;
    }

    if (!soDienThoai || !soDienThoai.trim()) {
      setThongBaoLoi('Vui lòng nhập Số điện thoại.');
      return;
    }

    const cleanPhone = soDienThoai.trim().replace(/\s+/g, '');
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(cleanPhone)) {
      setThongBaoLoi('Số điện thoại không đúng định dạng hợp lệ (VD: 0912345678).');
      return;
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setThongBaoLoi('Địa chỉ Email không đúng định dạng hợp lệ.');
        return;
      }
    }

    if (!noiDung || !noiDung.trim()) {
      setThongBaoLoi('Vui lòng nhập Nội dung phản ánh.');
      return;
    }

    try {
      setDangGui(true);
      const res = await fetch(getApiUrl('/api/v1/lien-he/cong-khai'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ho_ten: hoTen.trim(),
          so_dien_thoai: cleanPhone,
          email: email ? email.trim() : undefined,
          noi_dung: noiDung.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.thanh_cong) {
        setThongBaoThanhCong('Gửi thông tin phản ánh thành công. Nhà trường đã tiếp nhận thông tin của bạn.');
        setHoTen('');
        setSoDienThoai('');
        setEmail('');
        setNoiDung('');
      } else {
        setThongBaoLoi(data.message || data.thong_bao || 'Không thể gửi thông tin phản ánh. Vui lòng thử lại sau.');
      }
    } catch (err) {
      setThongBaoLoi('Đã xảy ra lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <PublicBreadcrumb items={[{ label: 'Thông tin Liên hệ & Phản ánh' }]} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl transition-colors">
            <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-blue-500/10 text-orange-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                Thông tin Liên hệ & Tiếp nhận Phản ánh
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">TRƯỜNG THCS ĐÔNG QUANG</h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">Liên hệ phản ánh, công tác chuyên môn và thông tin tuyển sinh</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs md:text-sm">
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">📍 Địa chỉ & Đường dây nóng</h2>
                <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                  <li>📍 <strong className="text-slate-900 dark:text-white">Trụ sở chính:</strong> Phường Đông Quang, TP Thanh Hóa, Tỉnh Thanh Hóa</li>
                  <li>📞 <strong className="text-slate-900 dark:text-white">Điện thoại Văn phòng:</strong> 0237.385.1234</li>
                  <li>✉️ <strong className="text-slate-900 dark:text-white">Email Công vụ:</strong> thcsdongquang@thanhhoa.edu.vn</li>
                  <li>🌐 <strong className="text-slate-900 dark:text-white">Cổng thông tin:</strong> dongquang.edu.vn</li>
                  <li>⏰ <strong className="text-slate-900 dark:text-white">Giờ làm việc:</strong> Thứ Hai – Thứ Bảy (7:30 – 17:00)</li>
                </ul>
              </div>

              <div className="space-y-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>✉️</span> GỬI THÔNG TIN PHẢN ÁNH
                </h2>

                {thongBaoThanhCong && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold leading-relaxed">
                    ✓ {thongBaoThanhCong}
                  </div>
                )}

                {thongBaoLoi && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold leading-relaxed">
                    ⚠️ {thongBaoLoi}
                  </div>
                )}

                <form onSubmit={handleGuiPhanAnh} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Họ và tên *</label>
                    <input
                      type="text"
                      value={hoTen}
                      onChange={(e) => setHoTen(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      disabled={dangGui}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036] transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Số điện thoại *</label>
                      <input
                        type="text"
                        value={soDienThoai}
                        onChange={(e) => setSoDienThoai(e.target.value)}
                        placeholder="0912345678"
                        disabled={dangGui}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Địa chỉ Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nguyenvana@gmail.com"
                        disabled={dangGui}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Nội dung phản ánh *</label>
                    <textarea
                      rows={4}
                      value={noiDung}
                      onChange={(e) => setNoiDung(e.target.value)}
                      placeholder="Nhập chi tiết nội dung phản ánh, góp ý hoặc yêu cầu hỗ trợ..."
                      disabled={dangGui}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#E97036] transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={dangGui}
                    className="w-full py-3 rounded-xl bg-[#E97036] hover:bg-[#d85f25] disabled:opacity-50 font-bold text-white transition shadow-lg flex items-center justify-center gap-2"
                  >
                    {dangGui ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Đang gửi thông tin...</span>
                      </>
                    ) : (
                      <span>Gửi thông tin phản ánh</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}