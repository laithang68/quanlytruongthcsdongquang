import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
        <div className="text-5xl font-black text-orange-600">404</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Không tìm thấy trang</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Trang bạn tìm kiếm không tồn tại hoặc đã bị thay đổi đường dẫn.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-md inline-block"
          >
            ← Trở về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
