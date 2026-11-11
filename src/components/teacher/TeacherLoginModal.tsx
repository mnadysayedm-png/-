import React, { useState } from 'react';
import { Lock, UserCheck, AlertCircle, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { PlatformSettings } from '../../types';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  settings: PlatformSettings;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  settings,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // Secure check without printing or exposing password anywhere in UI
      if (password === settings.teacherPassword) {
        setIsLoading(false);
        setPassword('');
        setError('');
        onSuccess();
      } else {
        setIsLoading(false);
        setError('كلمة المرور غير صحيحة، يرجى التحقق وإعادة المحاولة.');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f2137] text-white rounded-3xl shadow-2xl border border-slate-700/80 w-full max-w-md overflow-hidden transition-all transform scale-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-b from-[#162a45] to-[#0f2137] p-6 text-center relative border-b border-slate-700/60">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            تسجيل دخول المعلم المشرف
          </h3>
          <p className="text-slate-300 text-xs mt-1">
            {settings.schoolName} • منصة إتقان في العلوم
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-amber-200">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>المعلم المشرف: <strong>{settings.teacherName}</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              كلمة مرور لوحة المعلم
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="w-full pl-16 pr-10 py-3 rounded-xl bg-slate-900/90 border border-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono text-white placeholder:text-slate-600 transition"
                autoFocus
                required
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center gap-1.5">
                {password && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setPassword('');
                      setError('');
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition"
                    title="مسح كلمة المرور"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-200 focus:outline-none"
                  title={showPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl font-black text-sm shadow-lg shadow-amber-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>دخول لوحة التحكم</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-sm transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
