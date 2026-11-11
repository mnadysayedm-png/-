import React from 'react';
import { SchoolLogo } from '../SchoolLogo';
import { Sparkles, LogOut, Download, Settings, BrainCircuit, ExternalLink } from 'lucide-react';
import { PlatformSettings } from '../../types';

interface TeacherHeaderProps {
  settings: PlatformSettings;
  onLogout: () => void;
  onOpenAIGenerator: () => void;
  onOpenSettings: () => void;
  onExportExcel: () => void;
  onReturnToPortal: () => void;
}

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  settings,
  onLogout,
  onOpenAIGenerator,
  onOpenSettings,
  onExportExcel,
  onReturnToPortal,
}) => {
  return (
    <header className="bg-[#0B192C] text-white border-b border-slate-800 shadow-xl select-none">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Right side in RTL: Brand, Logo, and Teacher Meta */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          {/* Transparent School Logo without box/border */}
          <div className="shrink-0">
            <SchoolLogo size="sm" showSubtitle={false} customLogoUrl={settings.schoolLogoUrl} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                <span>منصة إتقان في العلوم</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                مدعومة بـ Gemini AI
              </span>
            </div>

            {/* Teacher Attribution on its own standalone line */}
            <div className="text-amber-300 font-extrabold text-xs tracking-wide mt-0.5">
              إعداد المعلم - {settings.teacherName || 'محمد نادي سيد محمد'}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium pt-0.5 flex-wrap">
              <span className="text-slate-300">{settings.schoolName}</span>
              {settings.principalName && (
                <>
                  <span>•</span>
                  <span className="text-slate-400">مدير المدرسة: {settings.principalName}</span>
                </>
              )}
              <span>•</span>
              <span className="text-slate-400">العام الدراسي 1447 - 1448 هـ</span>
            </div>
          </div>
        </div>

        {/* Left side in RTL: Actions (Gemini Question Generator, Logout, Export, Settings) */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <button
            onClick={onReturnToPortal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="العودة للبوابة الرئيسية"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onExportExcel}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="تصدير كشوف النتائج والبيانات"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="py-2 px-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>

          {/* Gemini AI Question Generator Button */}
          <button
            onClick={onOpenAIGenerator}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-600/30"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>توليد أسئلة بـ Gemini</span>
          </button>
        </div>
      </div>
    </header>
  );
};
