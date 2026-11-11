import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import { GraduationCap, ShieldCheck, Lock, BookOpen, Sparkles, ArrowLeft } from 'lucide-react';
import { PlatformSettings } from '../types';

interface LandingPortalProps {
  settings: PlatformSettings;
  onEnterStudent: () => void;
  onEnterTeacher: () => void;
}

export const LandingPortal: React.FC<LandingPortalProps> = ({
  settings,
  onEnterStudent,
  onEnterTeacher,
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-between items-center px-4 py-8 relative z-20">
      {/* Top spacing */}
      <div className="w-full"></div>

      {/* Central Content Container matching screenshot */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* Official School Crest Card */}
        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
          <SchoolLogo size="lg" showSubtitle={true} customLogoUrl={settings.schoolLogoUrl} />
        </div>

        {/* Platform Title */}
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">
            إتقان في العلوم
          </h1>

          {/* Teacher Attribution on its own standalone line */}
          <div className="text-amber-400 font-extrabold text-sm sm:text-base tracking-wide py-1">
            إعداد المعلم - {settings.teacherName || 'محمد نادي سيد محمد'}
          </div>

          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
            {settings.subtitle}
          </p>

          <p className="text-slate-400 text-[11px] sm:text-xs">
            رحلتك نحو إتقان مهارات العلوم ونافس تبدأ من هنا
          </p>
        </div>

        {/* Two Entrance Cards (Side by side on desktop, stacked on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl pt-4">
          {/* Card 1: Teacher Portal Entrance (Right side in Arabic RTL) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col items-center text-center justify-between space-y-4 hover:shadow-cyan-900/20 hover:-translate-y-1 transition duration-300">
            <div className="space-y-3 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#0f2137] text-amber-400 flex items-center justify-center shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-black text-slate-800">
                مرحباً بك في لوحة المعلم
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                إدارة الطلاب والفصول والتحكم في الشعب وتصميم الاختبارات والخطط العلاجية وتحليل النتائج.
              </p>
            </div>

            <button
              onClick={onEnterTeacher}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#142944] hover:bg-[#0c1c31] text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 group"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>دخول المعلم</span>
            </button>
          </div>

          {/* Card 2: Student Portal Entrance (Left side in Arabic RTL) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col items-center text-center justify-between space-y-4 hover:shadow-emerald-900/20 hover:-translate-y-1 transition duration-300">
            <div className="space-y-3 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#047857] text-white flex items-center justify-center shadow-md">
                <GraduationCap className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-black text-slate-800">
                مرحباً بك أيها البطل
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                أدّ اختباراتك، واكتشف مهاراتك المتقنة، وتابع خطط التدخل والعلاج المخصصة لك وطوّر مستواك في العلوم.
              </p>
            </div>

            <button
              onClick={onEnterStudent}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-black text-sm shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 group"
            >
              <BookOpen className="w-4 h-4" />
              <span>دخول الطالب</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Notice */}
      <footer className="text-center text-xs text-slate-400 py-4 pt-8 space-y-1">
        <div>منصة إتقان في العلوم • {settings.schoolName}</div>
        <div className="text-amber-400 font-bold">
          إعداد المعلم - {settings.teacherName || 'محمد نادي سيد محمد'}
        </div>
        {settings.principalName && (
          <div className="text-slate-400 text-[11px]">
            مدير المدرسة: {settings.principalName}
          </div>
        )}
      </footer>
    </div>
  );
};
