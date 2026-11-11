import React, { useRef } from 'react';
import { Submission, Test, PlatformSettings } from '../../types';
import { SchoolLogo } from '../SchoolLogo';
import {
  Award,
  CheckCircle2,
  XCircle,
  Printer,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  BookOpen,
  Calendar,
  Share2,
} from 'lucide-react';

interface TestResultViewProps {
  submission: Submission;
  test?: Test;
  settings: PlatformSettings;
  onBack: () => void;
}

export const TestResultView: React.FC<TestResultViewProps> = ({
  submission,
  test,
  settings,
  onBack,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const getMasteryRank = (percentage: number) => {
    if (percentage >= 90) return { label: 'إتقان فائق (ممتاز)', stars: '⭐⭐⭐', color: 'emerald' };
    if (percentage >= 75) return { label: 'إتقان متقدم (جيد جداً)', stars: '⭐⭐', color: 'teal' };
    if (percentage >= 60) return { label: 'إتقان متمكن (جيد)', stars: '⭐', color: 'amber' };
    return { label: 'بحاجة إلى تعزيز وتدريب', stars: '💡', color: 'rose' };
  };

  const rank = getMasteryRank(submission.percentage);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition shadow-xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للوحة الاختبارات</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة شهادة الإتقان المعتمدة</span>
        </button>
      </div>

      {/* Official Certificate Card (printable) */}
      <div
        ref={certificateRef}
        className="bg-white rounded-3xl border-4 border-double border-emerald-600/60 p-6 sm:p-10 shadow-2xl relative overflow-hidden print:m-0 print:border-emerald-800 print:shadow-none"
      >
        {/* Certificate Watermark and Ornaments */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-tr-full pointer-events-none"></div>
        <div className="absolute inset-0 border-[10px] border-emerald-50/50 pointer-events-none m-2 rounded-2xl"></div>

        {/* Certificate Header */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-emerald-100 pb-6 text-center sm:text-right">
          <SchoolLogo size="lg" showSubtitle={false} customLogoUrl={settings.schoolLogoUrl} />

          <div className="text-center sm:text-left space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              المملكة العربية السعودية • وزارة التعليم
            </span>
            <div className="text-xs text-slate-500 font-medium">
              التقييم المستمر واختبارات المهارات المعيارية
            </div>
            <div className="text-xs font-bold text-slate-700">
              {settings.schoolName}
            </div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="relative z-10 py-8 text-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>منصة إتقان في العلوم - قياس المهارات الوطنية نافس</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              شهادة إتقان في مهارات العلوم
            </h1>
          </div>

          <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
            تشهد إدارة مدرسة <strong className="text-emerald-800 font-extrabold">{settings.schoolName}</strong> بأن
            بطل العلوم الطالب:
          </p>

          <div className="py-2">
            <div className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border-2 border-emerald-300">
              <span className="text-2xl sm:text-3xl font-black text-emerald-900">
                {submission.studentName}
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
            المقيد في <strong>{submission.sectionName}</strong> قد أتم بنجاح واقتدار:{' '}
            <strong className="text-slate-900 font-bold block sm:inline mt-1 sm:mt-0">
              {submission.testTitle}
            </strong>
          </p>

          {/* Achievement Score Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="text-xs text-slate-500">الدرجة المكتسبة</div>
              <div className="text-xl font-black text-emerald-800">
                {submission.score} / {submission.totalQuestions}
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="text-xs text-slate-500">نسبة الإتقان</div>
              <div className="text-xl font-black text-emerald-800">
                {submission.percentage}%
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 col-span-2">
              <div className="text-xs text-slate-500">تصنيف المهارة</div>
              <div className="text-sm font-black text-amber-900 flex items-center justify-center gap-1 mt-0.5">
                <span>{rank.label}</span>
                <span>{rank.stars}</span>
              </div>
            </div>
          </div>

          {/* Signature & Seal Footer with Principal Name and Separate Teacher Line */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
            {/* Teacher In Dedicated Separate Line */}
            <div className="text-center sm:text-right space-y-1">
              <div className="text-xs text-slate-500">المعلم المشرف:</div>
              <div className="text-base font-black text-emerald-900">
                إعداد المعلم - {settings.teacherName}
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                معلم مادة العلوم
              </div>
            </div>

            {/* School Seal Graphic */}
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-emerald-600/40 flex flex-col items-center justify-center p-1 text-center bg-emerald-50/50">
              <div className="text-[9px] font-black text-emerald-900">ختم الاعتماد</div>
              <div className="text-[8px] font-bold text-slate-600">{settings.schoolName}</div>
              <div className="text-[8px] text-emerald-700">القسم الابتدائي</div>
            </div>

            {/* School Principal Name as Requested */}
            <div className="text-center sm:text-left space-y-1">
              <div className="text-xs text-slate-500">مدير المدرسة:</div>
              <div className="text-base font-black text-slate-900">
                {settings.principalName || 'أ. فهد بن ناصر القحطاني'}
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                إدارة {settings.schoolName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question by Question Detailed Review (Screen Only) */}
      {settings.showExplanationsToStudents && test && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-black text-slate-800">
                المراجعة العلمية وتوضيح المهارات
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              إجمالي الأسئلة: {test.questions.length}
            </span>
          </div>

          <div className="space-y-4">
            {test.questions.map((q, idx) => {
              const studentAnswer = submission.answers.find((a) => a.questionId === q.id);
              const isCorrect = studentAnswer?.isCorrect ?? false;
              const selectedIdx = studentAnswer?.selectedOptionIndex ?? -1;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border-2 transition ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-800">
                        {q.questionText}
                      </h4>
                    </div>

                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        إجابة صحيحة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full shrink-0">
                        <XCircle className="w-3.5 h-3.5" />
                        تحتاج مراجعة
                      </span>
                    )}
                  </div>

                  {/* Options review */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                    {q.options.map((opt, optIdx) => {
                      const isOptionCorrect = optIdx === q.correctAnswerIndex;
                      const isStudentPick = optIdx === selectedIdx;

                      let style = 'bg-white border-slate-200 text-slate-700';
                      if (isOptionCorrect) {
                        style = 'bg-emerald-100/80 border-emerald-400 text-emerald-950 font-bold';
                      } else if (isStudentPick && !isCorrect) {
                        style = 'bg-rose-100/80 border-rose-400 text-rose-950 font-bold';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${style}`}
                        >
                          <span>{opt}</span>
                          {isOptionCorrect && (
                            <span className="text-[10px] text-emerald-700 font-bold">
                              ✓ الإجابة الصحيحة
                            </span>
                          )}
                          {isStudentPick && !isOptionCorrect && (
                            <span className="text-[10px] text-rose-700 font-bold">
                              ✗ إجابتك
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Scientific explanation */}
                  <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="font-bold text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>الشرح العلمي والمهارة ({q.skillName}):</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
