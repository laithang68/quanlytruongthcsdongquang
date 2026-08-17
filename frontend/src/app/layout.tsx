import './globals.css';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cổng thông tin Trường THCS Đông Quang',
  description: 'Trang thông tin chính thức của Trường THCS Đông Quang - Phường Đông Quang',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
