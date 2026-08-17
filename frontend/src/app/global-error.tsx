'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="text-4xl">💥</div>
          <h2 className="text-xl font-bold">Lỗi toàn cục hệ thống</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error?.message || 'Đã xảy ra sự cố không mong muốn.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => reset()}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-md"
            >
              Thử lại
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
