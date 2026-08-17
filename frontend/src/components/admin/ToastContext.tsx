'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, type, title, message };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Tối đa 5 toast trên màn hình

    // Tự động đóng sau 3.5 giây
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast('error', title, message);
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message);
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast('info', title, message);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}

      {/* TOAST CONTAINER (FIXED AT TOP-RIGHT CORNER) */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform animate-in slide-in-from-top-3 fade-in flex items-start gap-3 text-xs ${
                isSuccess
                  ? 'bg-slate-900/95 dark:bg-slate-900/95 border-emerald-500/60 text-white shadow-emerald-950/20'
                  : isError
                  ? 'bg-slate-900/95 dark:bg-slate-900/95 border-rose-500/60 text-white shadow-rose-950/20'
                  : isWarning
                  ? 'bg-slate-900/95 dark:bg-slate-900/95 border-amber-500/60 text-white shadow-amber-950/20'
                  : 'bg-slate-900/95 dark:bg-slate-900/95 border-slate-700 text-white shadow-slate-950/20'
              }`}
            >
              {/* Icon Badge */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                  isSuccess
                    ? 'bg-emerald-500 text-white'
                    : isError
                    ? 'bg-rose-500 text-white'
                    : isWarning
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {isSuccess ? '✓' : isError ? '✕' : isWarning ? '!' : 'ℹ'}
              </div>

              {/* Toast Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="font-bold text-white text-xs leading-snug">{toast.title}</div>
                {toast.message && (
                  <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed break-words font-medium">
                    {toast.message}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition hover:bg-slate-800 shrink-0"
                title="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback safe dummy functions if ToastProvider is missing
    return {
      showToast: () => {},
      showSuccess: (title: string, message?: string) => alert(`[✓ Success] ${title}${message ? `: ${message}` : ''}`),
      showError: (title: string, message?: string) => alert(`[✕ Error] ${title}${message ? `: ${message}` : ''}`),
      showWarning: (title: string, message?: string) => alert(`[! Warning] ${title}${message ? `: ${message}` : ''}`),
      showInfo: (title: string, message?: string) => alert(`[ℹ Info] ${title}${message ? `: ${message}` : ''}`),
    };
  }
  return context;
}
