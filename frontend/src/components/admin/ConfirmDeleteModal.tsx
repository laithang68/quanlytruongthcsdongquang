'use client';

import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  description?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title = 'Xác nhận xóa dữ liệu',
  itemName = 'mục đã chọn',
  description = 'Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa khỏi hệ thống.',
  isDeleting = false,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-xs">
        {/* Warning Icon Badge */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
            ⚠️
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
              {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium mt-0.5">
              Cảnh báo thao tác xóa nguy hiểm
            </p>
          </div>
        </div>

        {/* Message Content */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1 text-slate-700 dark:text-slate-300">
          <p className="font-medium text-xs leading-relaxed">
            Bạn có chắc chắn muốn xóa <span className="font-extrabold text-slate-900 dark:text-white">&quot;{itemName}&quot;</span> không?
          </p>
          {description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        {/* Action Buttons: [ Hủy ]  [ Xác nhận xóa ] */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <span>🗑️</span>
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
