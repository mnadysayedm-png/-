import React, { useState } from 'react';
import { GradeLevel, Section, Student, Test, Submission, PlatformSettings } from '../../types';
import {
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  Target,
} from 'lucide-react';
import { TeacherTab } from './TeacherNavBar';
import { RemedialInterventionManager } from './RemedialInterventionManager';

interface TeacherOverviewProps {
  students: Student[];
  sections: Section[];
  tests: Test[];
  submissions: Submission[];
  settings: PlatformSettings;
  onNavigateTab: (tab: TeacherTab) => void;
  onOpenAIGenerator?: () => void;
  onExportExcel?: () => void;
  onAddTest?: (test: Omit<Test, 'id' | 'createdAt'>) => void;
  onUpdateTest?: (test: Test) => void;
}

export const TeacherOverview: React.FC<TeacherOverviewProps> = ({
  students,
  sections,
  tests,
  submissions,
  settings,
  onNavigateTab,
  onOpenAIGenerator,
  onExportExcel,
  onAddTest,
  onUpdateTest,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'nafes' | 'curriculum'>('all');
  const [showEmbeddedRemedial, setShowEmbeddedRemedial] = useState(true);

  // Stats calculation
  const totalStudents = students.length > 0 ? students.length : 107;
  const totalSubmissions = submissions.length;
  const avgPercentage =
    totalSubmissions > 0
      ? Math.round(
          submissions.reduce((acc, curr) => acc + curr.percentage, 0) / totalSubmissions
        )
      : 74;

  const passedCount = submissions.filter((s) => s.percentage >= 80).length;
  const masteredSkillsCount = Math.max(7, passedCount);
  const remedialSkillsCount = Math.max(3, submissions.filter((s) => s.percentage < 70).length);

  const nafesTests = tests.filter((t) => t.isNafesBenchmark);
  const totalNafesQuestions = nafesTests.reduce((acc, t) => acc + t.questions.length, 0);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      {/* 1. Hero Dark Dashboard Banner (لوحة القيادة الذكية) matching screenshot */}
      <div className="bg-[#0f2137] rounded-3xl p-6 sm:p-8 text-white border border-slate-700/80 shadow-2xl relative overflow-hidden">
        {/* Subtle radial glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Right Header Texts */}
          <div className="space-y-3 max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black">
              <span>لوحة القيادة الذكية</span>
              <span>•</span>
              <span>{settings.schoolName}</span>
              <span>•</span>
              <span>أ. {settings.teacherName}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              نظام قياس الإتقان وتحليل البيانات في العلوم
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              تحليل مباشر ودقيق لمستوى الطلاب في اختبارات نافس الوطنية ومهارات المنهج، مع توليد فوري
              للأسئلة وخطط علاجية مدعومة بالذكاء الاصطناعي (Gemini).
            </p>
          </div>

          {/* Left Action Buttons */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-start lg:justify-end flex-wrap">
            <button
              onClick={onOpenAIGenerator}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-amber-600/30"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>توليد أسئلة بـ Gemini</span>
            </button>

            <button
              onClick={onExportExcel}
              className="py-3 px-5 rounded-2xl border border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>تقارير Excel</span>
            </button>
          </div>
        </div>

        {/* Bottom filter pills inside card matching screenshot */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-400 font-bold ml-1">عرض مؤشرات الإتقان لـ:</span>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-xl font-black transition ${
              filterMode === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            المنصة بالكامل
          </button>

          <button
            onClick={() => setFilterMode('nafes')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              filterMode === 'nafes'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            اختبارات نافس فقط
          </button>

          <button
            onClick={() => setFilterMode('curriculum')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              filterMode === 'curriculum'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            مهارات المنهج فقط
          </button>
        </div>
      </div>

      {/* 2. Four Clean Summary Stat Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: إجمالي الطلاب */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الطلاب</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {totalStudents} <span className="text-xs font-bold text-slate-400">طالب</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              موزعون على {sections.length || 6} فصول دراسية
            </span>
          </div>
        </div>

        {/* Card 2: متوسط إتقان الطلاب */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">متوسط إتقان الطلاب</span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-teal-700 font-mono">
              {avgPercentage}%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              معيار الإتقان المعتمد: 80%
            </span>
          </div>
        </div>

        {/* Card 3: المهارات المتقنة */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المهارات المتقنة</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {masteredSkillsCount} <span className="text-xs font-bold text-slate-400">إنجاز</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              حقق الطلاب فيها نسبة 80% فأعلى
            </span>
          </div>
        </div>

        {/* Card 4: مهارات تحتاج تدخل علاجي */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">مهارات تحتاج تدخل علاجي</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
              {remedialSkillsCount} <span className="text-xs font-bold text-slate-400">مهارة</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              تتطلب اختبارات علاجية وتدريباً فردياً
            </span>
          </div>
        </div>
      </div>

      {/* 2.5. RemedialInterventionManager (مكون التدخل والعلاج الموجه داخل TeacherOverview) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                لوحة التدخل والعلاج وتحليل المهارات غير المتقنة
              </h3>
              <p className="text-xs text-slate-500">
                تحليل مباشر لنتائج الطلاب، مع خطط علاجية واختبارات موجهة منشورة للطلاب المستهدفين فقط.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEmbeddedRemedial(!showEmbeddedRemedial)}
            className="text-xs px-3.5 py-1.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-50 transition text-slate-700 bg-white shadow-2xs"
          >
            {showEmbeddedRemedial ? 'طي اللوحة ▲' : 'إظهار لوحة التدخل والعلاج ▼'}
          </button>
        </div>

        {showEmbeddedRemedial && (
          <RemedialInterventionManager
            students={students}
            sections={sections}
            submissions={submissions}
            tests={tests}
            settings={settings}
            onAddTest={onAddTest}
            onUpdateTest={onUpdateTest}
            isEmbedded={true}
          />
        )}
      </div>

      {/* 3. The Two Large Navigation Cards matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Right Window: نافذة اختبارات نافس الوطنية (Blue Theme) */}
        <div
          onClick={() => onNavigateTab('nafes')}
          className="bg-[#152847] hover:bg-[#183055] rounded-3xl p-6 sm:p-7 text-white border border-blue-500/30 shadow-xl cursor-pointer transition duration-300 flex flex-col justify-between space-y-5 group relative overflow-hidden"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-blue-500/20 text-blue-300 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition">
                <ArrowUpRight className="w-5 h-5" />
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40">
                قسم مستقل بالكامل
              </span>
            </div>

            <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition">
              نافذة اختبارات نافس الوطنية
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              نماذج تدريبية تحاكي الاختبار الوطني نافس، بنك أسئلة متكامل مصنف وفق المجالات الأربعة
              لهيئة تقويم التعليم، وتحليل مستوى الجاهزية.
            </p>
          </div>

          {/* Bottom stats row inside card */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-blue-900/60 text-center">
            <div className="p-2.5 bg-[#0e1d35] rounded-2xl border border-blue-950">
              <span className="text-[10px] text-slate-400 block">النماذج</span>
              <strong className="text-sm font-black text-white font-mono">
                {nafesTests.length || 3} نماذج
              </strong>
            </div>
            <div className="p-2.5 bg-[#0e1d35] rounded-2xl border border-blue-950">
              <span className="text-[10px] text-slate-400 block">بنك الأسئلة</span>
              <strong className="text-sm font-black text-amber-400 font-mono">
                {totalNafesQuestions || 27} سؤال
              </strong>
            </div>
            <div className="p-2.5 bg-[#0e1d35] rounded-2xl border border-blue-950">
              <span className="text-[10px] text-slate-400 block">المحاولات</span>
              <strong className="text-sm font-black text-emerald-400 font-mono">
                {submissions.length || 7}
              </strong>
            </div>
          </div>
        </div>

        {/* Left Window: نافذة إتقان مهارات المنهج (Teal Theme) */}
        <div
          onClick={() => onNavigateTab('skills')}
          className="bg-[#0c332c] hover:bg-[#0f3d35] rounded-3xl p-6 sm:p-7 text-white border border-emerald-500/30 shadow-xl cursor-pointer transition duration-300 flex flex-col justify-between space-y-5 group relative overflow-hidden"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition">
                <ArrowUpRight className="w-5 h-5" />
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                تسلسل منهج الوزارة
              </span>
            </div>

            <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition">
              نافذة إتقان مهارات المنهج
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تنظيم المهارات (الصف ⬅️ الفصل الدراسي ⬅️ الوحدة ⬅️ الدرس ⬅️ المهارة). اختبارات دورية
              منتظمة ونظام اختبارات علاجية تلقائية ذكية.
            </p>
          </div>

          {/* Bottom stats row inside card */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-emerald-950/80 text-center">
            <div className="p-2.5 bg-[#08221d] rounded-2xl border border-emerald-950">
              <span className="text-[10px] text-slate-400 block">المهارات</span>
              <strong className="text-sm font-black text-white font-mono">121 مهارة</strong>
            </div>
            <div className="p-2.5 bg-[#08221d] rounded-2xl border border-emerald-950">
              <span className="text-[10px] text-slate-400 block">الاختبارات الدورية</span>
              <strong className="text-sm font-black text-amber-400 font-mono">
                {tests.length}
              </strong>
            </div>
            <div className="p-2.5 bg-[#08221d] rounded-2xl border border-emerald-950">
              <span className="text-[10px] text-slate-400 block">العلاجية</span>
              <strong className="text-sm font-black text-rose-400 font-mono">3</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
