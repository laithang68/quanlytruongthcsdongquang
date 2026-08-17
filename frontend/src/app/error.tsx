'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Xin lỗi!- Đã xảy ra lỗi hệ thống <br /> Rất xin lỗi vì sự bất tiện này!</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {error?.message || 'Không thể tải trang này. Vui lòng thử lại sau.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-md"
          >
            🔄 Tải lại trang
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition border border-slate-300 dark:border-slate-700"
          >
            🏠 Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
