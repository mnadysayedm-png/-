import React from 'react';
import { LayoutDashboard, BookOpen, Sparkles, GraduationCap, Users, FileSpreadsheet, Target } from 'lucide-react';

export type TeacherTab =
  | 'overview'
  | 'curriculum'
  | 'nafes'
  | 'skills'
  | 'sections'
  | 'remedial'
  | 'reports'
  | 'settings';

interface TeacherNavBarProps {
  activeTab: TeacherTab;
  onTabChange: (tab: TeacherTab) => void;
  studentsCount: number;
}

export const TeacherNavBar: React.FC<TeacherNavBarProps> = ({
  activeTab,
  onTabChange,
  studentsCount,
}) => {
  return (
    <div className="bg-[#0B192C] border-b border-slate-800 text-white select-none">
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none py-2.5">
        <div className="flex items-center gap-2 min-w-max">
          {/* Tab 1: لوحة التحكم العامة */}
          <button
            onClick={() => onTabChange('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-2 border-amber-500 bg-amber-500/10 text-amber-400 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>لوحة التحكم العامة</span>
          </button>

          {/* Tab 2: إدارة المناهج والمحتوى */}
          <button
            onClick={() => onTabChange('curriculum')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'curriculum'
                ? 'border-2 border-amber-500 bg-amber-500/10 text-amber-400 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>إدارة المناهج والمحتوى</span>
          </button>

          {/* Tab 3: اختبارات نافس الوطنية (مستقل) */}
          <button
            onClick={() => onTabChange('nafes')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'nafes'
                ? 'border-2 border-amber-500 bg-amber-500/10 text-amber-400 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <span>اختبارات نافس الوطنية</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40">
              مستقل
            </span>
          </button>

          {/* Tab 4: إتقان مهارات المنهج (منهج الوزارة) */}
          <button
            onClick={() => onTabChange('skills')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'skills'
                ? 'border-2 border-amber-500 bg-amber-500/10 text-amber-400 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <span>إتقان مهارات المنهج</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              منهج الوزارة
            </span>
          </button>

          {/* Tab 5: الطلاب والفصول (الشعب) */}
          <button
            onClick={() => onTabChange('sections')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sections'
                ? 'border-2 border-amber-500 bg-amber-500/10 text-amber-400 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>الطلاب والفصول ({studentsCount})</span>
          </button>

          {/* Tab 6: التدخل والعلاج الموجه */}
          <button
            onClick={() => onTabChange('remedial')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'remedial'
                ? 'border-2 border-rose-500 bg-rose-500/15 text-rose-300 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Target className="w-4 h-4 text-rose-400" />
            <span>التدخل والعلاج</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40">
              موجه
            </span>
          </button>

          {/* Tab 7: تقارير Excel الاحترافية */}
          <button
            onClick={() => onTabChange('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'border-2 border-amber-500 bg-amber-500/10 text-amber-400 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>تقارير Excel الاحترافية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
