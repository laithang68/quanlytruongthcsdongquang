'use client';

import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PublicBreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function PublicBreadcrumb({ items }: PublicBreadcrumbProps) {
  const router = useRouter();

  return (
    <nav className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2 flex-wrap mb-6 shadow-xs transition-colors">
      <button
        onClick={() => router.push('/')}
        className="hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1 font-semibold"
      >
        <span>🏠 Trang chủ</span>
      </button>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-600">/</span>
          {item.href ? (
            <button
              onClick={() => router.push(item.href!)}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition font-semibold"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-900 dark:text-white font-bold">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
