import React from 'react';
import { Trash2, AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: 'rose' | 'amber' | 'emerald';
  icon?: 'trash' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'نعم، حذف نهائي',
  cancelText = 'إلغاء',
  confirmButtonColor = 'rose',
  icon = 'trash',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const colorStyles = {
    rose: {
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30',
      iconBg: 'bg-rose-100 text-rose-600 border-rose-200',
    },
    amber: {
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30',
      iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    emerald: {
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30',
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
  }[confirmButtonColor];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4 animate-in zoom-in-95">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorStyles.iconBg} shrink-0`}>
              {icon === 'trash' ? (
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">يرجى التأكيد للمتابعة</p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
          {message}
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95 ${colorStyles.btn}`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-5 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl hover:bg-slate-100 transition"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
