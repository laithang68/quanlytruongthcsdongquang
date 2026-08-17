'use client';

import React from 'react';
import { ToastProvider } from '@/components/admin/ToastContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
