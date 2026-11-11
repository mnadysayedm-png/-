import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import { Sparkles, ShieldCheck, LogOut, GraduationCap, Home } from 'lucide-react';
import { PlatformSettings } from '../types';

interface HeaderProps {
  currentView: 'portal' | 'student' | 'teacher';
  onViewChange: (view: 'portal' | 'student' | 'teacher') => void;
  isTeacherAuthenticated: boolean;
  onTeacherLogout: () => void;
  settings: PlatformSettings;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  isTeacherAuthenticated,
  onTeacherLogout,
  settings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0b1a2d]/95 backdrop-blur-md border-b border-slate-700/80 shadow-md transition-all text-white">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0d223a] to-emerald-950 text-white text-xs py-1.5 px-4 border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-200 text-[11px] sm:text-xs">
              {settings.subtitle}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-emerald-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>معايير الاختبارات الوطنية نافس</span>
            </span>
            <span className="hidden sm:inline-block border-r border-slate-700 h-3"></span>
            <span className="hidden sm:inline-block font-semibold text-slate-300">
              العام الدراسي 1448 هـ / 2026 م
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left/Right Logo & Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div
            onClick={() => onViewChange('portal')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <SchoolLogo size="sm" showSubtitle={false} customLogoUrl={settings.schoolLogoUrl} />
            <div className="hidden sm:block border-r border-slate-700 h-9 mx-1"></div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                  <span className="text-emerald-400">إتقان</span>
                  <span className="text-white">في العلوم</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    العلوم 4-5-6
                  </span>
                </h1>
              </div>
              <div className="text-[11px] text-amber-300/95 font-bold tracking-wide mt-0.5 block">
                إعداد المعلم - {settings.teacherName || 'محمد نادي سيد محمد'}
              </div>
            </div>
          </div>

          {/* Mobile view switch buttons */}
          <div className="flex md:hidden items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => onViewChange('portal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentView === 'portal'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-300'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => onViewChange('student')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentView === 'student'
                  ? 'bg-emerald-600 text-white font-black'
                  : 'text-slate-300'
              }`}
            >
              الطلاب
            </button>
            <button
              onClick={() => onViewChange('teacher')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentView === 'teacher'
                  ? 'bg-teal-600 text-white font-black'
                  : 'text-slate-300'
              }`}
            >
              المعلم
            </button>
          </div>
        </div>

        {/* Center Navigation Pills */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => onViewChange('portal')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                currentView === 'portal'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>بوابة الدخول الرئيسية</span>
            </button>

            <button
              onClick={() => onViewChange('student')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                currentView === 'student'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>بوابة الطلاب</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950/80 text-emerald-300 rounded font-semibold border border-emerald-700/40">
                PIN: {settings.studentPin}
              </span>
            </button>

            <button
              onClick={() => onViewChange('teacher')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                currentView === 'teacher'
                  ? 'bg-teal-600 text-white shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>لوحة تحكم المعلم</span>
              {isTeacherAuthenticated && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>

          {/* Teacher Logged In status */}
          {isTeacherAuthenticated && (
            <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-200">
                  {settings.teacherName}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                  معلم مشرف معتمد
                </span>
              </div>
              <button
                onClick={onTeacherLogout}
                title="تسجيل خروج المعلم"
                className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
