'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { getApiUrl } from '@/lib/api';

export default function TrangDangNhap() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [thongBaoLoi, setThongBaoLoi] = useState('');

  const xuLyDangNhap = async (e: FormEvent) => {
    e.preventDefault();
    setThongBaoLoi('');

    if (!email.trim() || !matKhau.trim()) {
      setThongBaoLoi('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setDangXuLy(true);

    try {
      const res = await fetch(getApiUrl('/api/v1/xac-thuc/dang-nhap'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cho phép gửi & nhận HttpOnly Cookie
        body: JSON.stringify({
          email: email.trim(),
          mat_khau: matKhau,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.thanh_cong) {
        setThongBaoLoi(data.message || data.thong_bao || 'Thông tin đăng nhập không chính xác.');
        setDangXuLy(false);
        return;
      }

      // Lưu Access Token và Thông tin người dùng vào memory/localStorage (Refresh Token đã được tự động lưu vào HttpOnly Cookie)
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('nguoi_dung', JSON.stringify(data.nguoi_dung));

      // Chuyển hướng tới trang quản trị
      router.push('/quan-tri');
    } catch (err) {
      setThongBaoLoi('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
      setDangXuLy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Đăng nhập Hệ thống
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            CỔNG THÔNG TIN TRƯỜNG THCS ĐÔNG QUANG
          </p>
        </div>

        {thongBaoLoi && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{thongBaoLoi}</span>
          </div>
        )}

        <form onSubmit={xuLyDangNhap} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="quantri@dongquang.edu.vn"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={dangXuLy}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {dangXuLy ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Đang xử lý đăng nhập...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500">
            Trường THCS Đông Quang – Phường Đông Quang
          </p>
        </div>
      </div>
    </div>
  );
}