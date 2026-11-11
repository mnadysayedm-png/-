import React, { useState, useMemo } from 'react';
import { GradeLevel, Test, Submission, PlatformSettings, StudentGamification, RemedialPlan } from '../../types';
import { storageService } from '../../services/storageService';
import {
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText,
  User,
  Atom,
  Trophy,
  Flame,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  ExternalLink,
} from 'lucide-react';

interface StudentDashboardProps {
  student: {
    studentId: string;
    studentName: string;
    grade: GradeLevel;
    sectionName: string;
    sectionId: string;
  };
  tests: Test[];
  submissions: Submission[];
  gamification: StudentGamification;
  settings: PlatformSettings;
  onStartTest: (test: Test) => void;
  onViewSubmission: (submission: Submission) => void;
  onOpenLeaderboard: () => void;
  onLogout: () => void;
  onThemeChange?: (theme: 'default' | 'life' | 'physical' | 'space' | 'lab' | 'celebration') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  tests,
  submissions,
  gamification,
  settings,
  onStartTest,
  onViewSubmission,
  onOpenLeaderboard,
  onLogout,
  onThemeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  // Modals for the 3 boards
  const [isMasteredModalOpen, setIsMasteredModalOpen] = useState(false);
  const [isUnmasteredModalOpen, setIsUnmasteredModalOpen] = useState(false);
  const [isTargetedTestsModalOpen, setIsTargetedTestsModalOpen] = useState(false);

  const gradeNameMap: Record<GradeLevel, string> = {
    '4': 'الصف الرابع الابتدائي',
    '5': 'الصف الخامس الابتدائي',
    '6': 'الصف السادس الابتدائي',
  };

  // Student's submissions
  const studentSubmissions = useMemo(() => {
    return submissions.filter(
      (s) => s.studentId === student.studentId || s.studentName === student.studentName
    );
  }, [submissions, student]);

  // Remedial plans from storage for this student
  const studentRemedialPlans = useMemo(() => {
    return storageService
      .getRemedialPlans()
      .filter((p) => p.studentId === student.studentId || p.studentName === student.studentName);
  }, [student]);

  // Filter tests matching student's grade & active
  // NOTE: If test has targetStudentIds, it MUST include this student!
  const studentTests = useMemo(() => {
    return tests.filter((t) => {
      if (t.grade !== student.grade || !t.isActive) return false;
      if (t.targetStudentIds && t.targetStudentIds.length > 0) {
        return t.targetStudentIds.includes(student.studentId);
      }
      if (t.targetSections && t.targetSections.length > 0) {
        return t.targetSections.includes(student.sectionId);
      }
      return true;
    });
  }, [tests, student]);

  // Specifically Targeted Tests for this student (remedial or directly assigned)
  const targetedTests = useMemo(() => {
    return studentTests.filter(
      (t) =>
        t.isRemedial ||
        (t.targetStudentIds && t.targetStudentIds.includes(student.studentId)) ||
        studentRemedialPlans.some((p) => p.assignedTestId === t.id || p.skillName === t.targetSkillName)
    );
  }, [studentTests, student, studentRemedialPlans]);

  // Analyze Student Skills (Mastered >= 80%, Needs Intervention 60%-79%, Unmastered < 60%)
  const studentSkillsAnalysis = useMemo(() => {
    const skillsMap: Record<
      string,
      {
        skillName: string;
        domain: string;
        total: number;
        correct: number;
        percentage: number;
        testTitle: string;
        testId: string;
      }
    > = {};

    studentSubmissions.forEach((sub) => {
      const targetTest = tests.find((t) => t.id === sub.testId);
      if (!targetTest) return;

      sub.answers.forEach((ans) => {
        const q = targetTest.questions.find((quest) => quest.id === ans.questionId);
        const skill = q?.skillName || targetTest.title;
        if (!skillsMap[skill]) {
          skillsMap[skill] = {
            skillName: skill,
            domain: q?.domain || targetTest.domain || 'العلوم',
            total: 0,
            correct: 0,
            percentage: 0,
            testTitle: targetTest.title,
            testId: targetTest.id,
          };
        }
        skillsMap[skill].total += 1;
        if (ans.isCorrect) {
          skillsMap[skill].correct += 1;
        }
      });
    });

    // Also include any skills identified in teacher's remedial plans if not in submissions yet
    studentRemedialPlans.forEach((plan) => {
      if (!skillsMap[plan.skillName]) {
        skillsMap[plan.skillName] = {
          skillName: plan.skillName,
          domain: (plan.domain as any) || 'علوم الحياة',
          total: 1,
          correct: 0,
          percentage: 40,
          testTitle: plan.assignedTestTitle || 'خطة تدخل المعلم',
          testId: plan.assignedTestId || '',
        };
      }
    });

    const allSkills = Object.values(skillsMap).map((item) => {
      const percentage = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
      return { ...item, percentage };
    });

    const mastered = allSkills.filter((s) => s.percentage >= 80);
    const needingIntervention = allSkills.filter((s) => s.percentage >= 60 && s.percentage < 80);
    const unmastered = allSkills.filter((s) => s.percentage < 60);

    return { allSkills, mastered, needingIntervention, unmastered };
  }, [studentSubmissions, tests, studentRemedialPlans]);

  const getTestSubmission = (testId: string) => {
    return studentSubmissions.find((s) => s.testId === testId);
  };

  const completedCount = studentSubmissions.length;
  const avgScore =
    completedCount > 0
      ? Math.round(
          studentSubmissions.reduce((acc, curr) => acc + curr.percentage, 0) / completedCount
        )
      : 0;

  // XP Progress within current level (every 100 points is 1 level)
  const currentLevelMinPoints = (gamification.level - 1) * 100;
  const nextLevelPoints = gamification.level * 100;
  const levelProgress = Math.min(
    100,
    Math.round(((gamification.points - currentLevelMinPoints) / 100) * 100)
  );

  const handleTabChange = (tab: 'available' | 'history') => {
    setActiveTab(tab);
    if (onThemeChange) {
      if (tab === 'history') onThemeChange('celebration');
      else onThemeChange('default');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Student Welcome Banner with Gamification */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-200 border border-white/10">
                {settings.schoolName}
              </span>
              <span className="px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold border border-amber-400/30">
                {gradeNameMap[student.grade]}
              </span>
              <span className="px-3 py-1 bg-emerald-500/30 text-emerald-100 rounded-full text-xs font-bold border border-emerald-400/30">
                {student.sectionName}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              أهلاً بك يا بطل العلوم: <span className="text-amber-300">{student.studentName}</span> 🌟
            </h2>

            {/* Gamification Level & XP Progress Bar */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 max-w-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  رتبتك: {gamification.levelTitle}
                </span>
                <span className="font-mono font-black text-emerald-200">
                  {gamification.points} XP (مستوى {gamification.level})
                </span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-200/80">
                <span>المستوى {gamification.level}</span>
                <span>{nextLevelPoints - gamification.points} نقطة للترقية التالية</span>
                <span>المستوى {gamification.level + 1}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Leaderboard CTA Button */}
            <button
              onClick={onOpenLeaderboard}
              className="py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>لوحة الشرف وتنافس الأبطال</span>
            </button>

            <button
              onClick={onLogout}
              className="p-3 bg-white/15 hover:bg-white/25 rounded-2xl transition border border-white/20 text-xs font-semibold shrink-0"
              title="تغيير الطالب أو الخروج"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE THREE REQUESTED STUDENT BOARDS:                                        */}
      {/* 1. لوحة الاختبارات المستهدفة (Targeted Tests Board)                          */}
      {/* 2. لوحة المهارات المتقنة (Mastered Skills Board)                            */}
      {/* 3. لوحة المهارات غير المتقنة (Unmastered Skills Board)                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Board 1: لوحة الاختبارات المستهدفة */}
        <div
          onClick={() => setIsTargetedTestsModalOpen(true)}
          className="bg-gradient-to-br from-[#10243d] to-[#0c1829] text-white rounded-3xl p-5 border-2 border-blue-500/50 shadow-lg cursor-pointer hover:border-blue-400 hover:scale-[1.01] transition duration-200 space-y-3 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30 group-hover:bg-blue-500 group-hover:text-white transition">
              <Target className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
              موجهة لك خصيصاً 🎯
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">لوحة الاختبارات المستهدفة</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {targetedTests.length} <span className="text-xs font-bold text-blue-300">اختبار مخصص</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              اختبارات علاجية وتدريبية نشرها المعلم لك مباشرة لمعالجة مهاراتك المحددة.
            </p>
          </div>
          <div className="pt-2 border-t border-blue-900/60 flex items-center justify-between text-xs text-blue-300 font-bold group-hover:text-white">
            <span>اضغط لاستعراض الاختبارات المستهدفة</span>
            <span>←</span>
          </div>
        </div>

        {/* Board 2: لوحة المهارات المتقنة */}
        <div
          onClick={() => setIsMasteredModalOpen(true)}
          className="bg-gradient-to-br from-[#063327] to-[#08221b] text-white rounded-3xl p-5 border-2 border-emerald-500/50 shadow-lg cursor-pointer hover:border-emerald-400 hover:scale-[1.01] transition duration-200 space-y-3 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 group-hover:bg-emerald-500 group-hover:text-white transition">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              إتقان فائق ✓
            </span>
          </div>
          <div>
            <span className="text-xs text-emerald-300 font-bold block">لوحة المهارات المتقنة</span>
            <div className="text-2xl font-black text-emerald-300 font-mono mt-0.5">
              {studentSkillsAnalysis.mastered.length} <span className="text-xs font-bold text-emerald-200">مهارة متقنة</span>
            </div>
            <p className="text-[11px] text-emerald-100/80 mt-1 leading-relaxed">
              المهارات التي حققت فيها نسبة إتقان 80% فأعلى بنجاح وتميز علمي.
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-xs text-emerald-300 font-bold group-hover:text-white">
            <span>اضغط لاستعراض المهارات التي أتقنتها</span>
            <span>←</span>
          </div>
        </div>

        {/* Board 3: لوحة المهارات غير المتقنة (مع ظهور الاختبار المخصص عند الضغط عليها) */}
        <div
          onClick={() => setIsUnmasteredModalOpen(true)}
          className="bg-gradient-to-br from-[#3b0b14] to-[#25070e] text-white rounded-3xl p-5 border-2 border-rose-500/70 shadow-lg cursor-pointer hover:border-rose-400 hover:scale-[1.01] transition duration-200 space-y-3 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-400/30 group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white animate-pulse">
              فاقد يتطلب علاج ⚠️
            </span>
          </div>
          <div>
            <span className="text-xs text-rose-300 font-bold block">لوحة المهارات غير المتقنة</span>
            <div className="text-2xl font-black text-rose-300 font-mono mt-0.5">
              {studentSkillsAnalysis.unmastered.length}{' '}
              <span className="text-xs font-bold text-rose-200">مهارة تحتاج علاج</span>
            </div>
            <p className="text-[11px] text-rose-100/80 mt-1 leading-relaxed">
              اضغط هنا لرؤية المهارات المفقودة والاختبار المخصص لك من المعلم لعلاجها فوراً!
            </p>
          </div>
          <div className="pt-2 border-t border-rose-900/60 flex items-center justify-between text-xs text-rose-300 font-bold group-hover:text-white">
            <span>اضغط لبدء الاختبارات العلاجية المخصصة</span>
            <span>←</span>
          </div>
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleTabChange('available')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'available'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الاختبارات والمهارات المتاحة</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
              {studentTests.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>سجل نتائجي وشهاداتي</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
              {studentSubmissions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Available Tests */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {studentTests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">لا توجد اختبارات متاحة حالياً</h3>
              <p className="text-xs text-slate-500">
                سيقوم المعلم المشرف بتفعيل الاختبارات المخصصة لصفك قريباً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentTests.map((test) => {
                const sub = getTestSubmission(test.id);
                const isTargetedForMe =
                  test.isRemedial || (test.targetStudentIds && test.targetStudentIds.includes(student.studentId));

                return (
                  <div
                    key={test.id}
                    className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
                      isTargetedForMe
                        ? 'border-2 border-rose-400 bg-rose-50/20 ring-2 ring-rose-200'
                        : test.isNafesBenchmark
                        ? 'border-emerald-300 ring-1 ring-emerald-200/60'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Badge Row */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isTargetedForMe && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs animate-pulse">
                              <Target className="w-3.5 h-3.5" />
                              اختبار علاجي موجه لك خصيصاً 🎯
                            </span>
                          )}

                          {test.isNafesBenchmark ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              معياري نافس
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              <Atom className="w-3.5 h-3.5 text-teal-600" />
                              مهارة وحدة
                            </span>
                          )}

                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {test.domain}
                          </span>
                        </div>

                        {sub && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                              sub.passed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تم إنجازه بنسبة {sub.percentage}%
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1 leading-snug">
                          {test.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {test.description}
                        </p>
                      </div>

                      {/* Metadata pills */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <HelpCircle className="w-4 h-4 text-emerald-600" />
                          <span>{test.questions.length} أسئلة علمية</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{test.durationMinutes} دقيقة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>نسبة الاجتياز {test.passingScorePercentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
                      {sub ? (
                        <>
                          <button
                            onClick={() => onViewSubmission(sub)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <span>عرض النتيجة والشهادة</span>
                          </button>
                          {settings.allowStudentRetry && (
                            <button
                              onClick={() => onStartTest(test)}
                              className="py-2.5 px-3 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-xs sm:text-sm transition flex items-center gap-1"
                              title="إعادة المحاولة للتحسين"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>إعادة</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => onStartTest(test)}
                          className={`w-full py-3 px-4 rounded-xl font-black text-sm shadow-md transition flex items-center justify-center gap-2 ${
                            isTargetedForMe
                              ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white shadow-rose-600/30'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-700/20'
                          }`}
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>{isTargetedForMe ? 'ابدأ الاختبار العلاجي الموجه الآن' : 'ابدأ الاختبار الآن'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Test Submissions & History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {studentSubmissions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">لم تُنجز أي اختبارات بعد</h3>
              <p className="text-xs text-slate-500">
                اختر اختباراً من تبويب الاختبارات المتاحة وابدأ بحل الأسئلة للحصول على شهادة إتقان!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        {sub.completedAt}
                      </span>
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full ${
                          sub.percentage >= 85
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.percentage >= 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        الدرجة: {sub.score} من {sub.totalQuestions} ({sub.percentage}%)
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-800 leading-snug">
                      {sub.testTitle}
                    </h4>

                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs text-slate-600">
                      <span>مستوى الإتقان:</span>
                      <span className="font-bold text-emerald-700">
                        {sub.percentage >= 90
                          ? 'إتقان فائق ⭐⭐⭐'
                          : sub.percentage >= 75
                          ? 'إتقان متقدم ⭐⭐'
                          : sub.percentage >= 60
                          ? 'إتقان متمكن ⭐'
                          : 'بحاجة إلى تعزيز المهارة 💡'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => onViewSubmission(sub)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-sm shadow-sm hover:shadow transition flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>عرض الشهادة المعتمدة والتقرير التفصيلي</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: استعراض المهارات المتقنة (Mastered Skills Modal)                    */}
      {/* ========================================================================= */}
      {isMasteredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-[#063327] text-white p-5 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-black">لوحة المهارات المتقنة بنجاح ✓</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    إنجازات الطالب: {student.studentName} (نسبة الإتقان 80% فما فوق)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMasteredModalOpen(false)}
                className="text-slate-300 hover:text-white transition p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {studentSkillsAnalysis.mastered.length === 0 ? (
                <div className="p-10 text-center text-slate-500 bg-slate-50 rounded-2xl space-y-2">
                  <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">لم يتم تسجيل مهارات متقنة بعد</p>
                  <p className="text-xs text-slate-500">
                    أكمل الاختبارات المتاحة وحقق نسبة 80% فأعلى لتظهر مهاراتك المتقنة هنا!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1">
                    <span>المهارات العلمية المتقنة ({studentSkillsAnalysis.mastered.length} مهارة):</span>
                    <span className="text-emerald-700">معيار الإتقان المعتمد: 80%</span>
                  </div>

                  {studentSkillsAnalysis.mastered.map((sk, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200 text-emerald-900">
                            {sk.domain}
                          </span>
                          <span className="text-xs text-slate-500">{sk.testTitle}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 leading-snug">{sk.skillName}</h4>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{sk.percentage}% أتقن</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsMasteredModalOpen(false)}
                className="py-2 px-5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: لوحة المهارات غير المتقنة وظهور الاختبار المخصص لكل مهارة           */}
      {/* "وعند الضغط على الغير متقنة يتم ظهور الاختبار المخصص له حسب مهاراته الغير متقنة */}
      {/*  و المرفقة من لوحة المعلم في الخطط العلاجية والتدخل"                      */}
      {/* ========================================================================= */}
      {isUnmasteredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-[#29070d] text-white p-5 flex items-center justify-between border-b border-rose-900">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-rose-600/30 text-rose-300 rounded-xl border border-rose-500/40">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </span>
                <div>
                  <h3 className="text-lg font-black">
                    لوحة المهارات غير المتقنة والاختبارات العلاجية المخصصة
                  </h3>
                  <p className="text-xs text-rose-200 mt-0.5">
                    المهارات التي تحتاج تدخلاً عاجلاً وخطة المعلم العلاجية والاختبارات المخصصة لك
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUnmasteredModalOpen(false)}
                className="text-slate-300 hover:text-white transition p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
              {studentSkillsAnalysis.unmastered.length === 0 ? (
                <div className="p-10 text-center text-emerald-700 bg-emerald-50 rounded-2xl space-y-2 border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="font-black text-base text-emerald-900">
                    رائع جداً يا بطل! لا توجد مهارات غير متقنة لديك!
                  </p>
                  <p className="text-xs text-emerald-700">
                    جميع مهاراتك العلمية في مستوى الإتقان والتميز الأكاديمي.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-xs text-rose-900 leading-relaxed font-bold">
                    ⚠️ هذه المهارات سجلت نسبة إتقان أقل من 60%؛ وقد قام المعلم المشرف بإرفاق خطة تدخل واختبارات علاجية مخصصة لك لمعالجتها وإتقانها:
                  </div>

                  {studentSkillsAnalysis.unmastered.map((sk, idx) => {
                    // Match remedial test for this skill or assigned to this student
                    const matchedTest = tests.find(
                      (t) =>
                        t.isActive &&
                        (t.targetSkillName === sk.skillName ||
                          (t.isRemedial && t.targetStudentIds?.includes(student.studentId)) ||
                          studentRemedialPlans.some((p) => p.assignedTestId === t.id && p.skillName === sk.skillName))
                    );

                    const matchedPlan = studentRemedialPlans.find((p) => p.skillName === sk.skillName);

                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-white border-2 border-rose-300 shadow-sm space-y-4 hover:border-rose-400 transition"
                      >
                        {/* Skill info header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">
                                غير متقنة ({sk.percentage}%)
                              </span>
                              <span className="text-xs text-slate-500 font-bold">{sk.domain}</span>
                            </div>
                            <h4 className="text-sm sm:text-base font-black text-slate-900">{sk.skillName}</h4>
                            <p className="text-[11px] text-slate-500">
                              تم رصدها في: {sk.testTitle}
                            </p>
                          </div>

                          <span className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                            <Target className="w-5 h-5" />
                          </span>
                        </div>

                        {/* Teacher's Remedial Plan Strategy (if attached) */}
                        {matchedPlan && (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                            <div className="font-bold text-amber-900">
                              📋 خطة التدخل المرفقة من المعلم:
                            </div>
                            <div className="text-slate-700 text-[11px]">{matchedPlan.strategy}</div>
                          </div>
                        )}

                        {/* The Attached Remedial Test Box */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                              <Zap className="w-4 h-4 text-rose-600 fill-current" />
                              <span>الاختبار العلاجي المخصص لك لهذه المهارة:</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900">
                              مخصص لك فقط
                            </span>
                          </div>

                          {matchedTest ? (
                            <div className="space-y-3">
                              <div>
                                <h5 className="text-xs sm:text-sm font-black text-slate-900">
                                  {matchedTest.title}
                                </h5>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  {matchedTest.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-rose-200/60">
                                <span className="text-[11px] text-slate-500 font-bold">
                                  {matchedTest.questions.length} أسئلة • {matchedTest.durationMinutes} دقيقة
                                </span>

                                <button
                                  onClick={() => {
                                    setIsUnmasteredModalOpen(false);
                                    onStartTest(matchedTest);
                                  }}
                                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/30"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>ابدأ الاختبار العلاجي الآن 🚀</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 py-1 flex items-center justify-between">
                              <span>قيد الإعداد من قبل المعلم المشرف...</span>
                              <span className="text-[11px] font-bold text-amber-700">سيتم نشره قريباً</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsUnmasteredModalOpen(false)}
                className="py-2 px-5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: لوحة الاختبارات المستهدفة (Targeted Tests Modal)                    */}
      {/* ========================================================================= */}
      {isTargetedTestsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-[#10243d] text-white p-5 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
                  <Target className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-black">الاختبارات المستهدفة والموجهة لك 🎯</h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    اختبارات موجهة ومخصصة خصيصاً للطالب: {student.studentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTargetedTestsModalOpen(false)}
                className="text-slate-300 hover:text-white transition p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {targetedTests.length === 0 ? (
                <div className="p-10 text-center text-slate-500 bg-slate-50 rounded-2xl space-y-2">
                  <Target className="w-8 h-8 text-blue-500 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">لا توجد اختبارات مستهدفة حالياً</p>
                  <p className="text-xs text-slate-500">
                    عندما يقوم المعلم بتخصيص اختبار علاجي أو تشخيصي لك، سيظهر مباشرة هنا.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {targetedTests.map((test) => {
                    const sub = getTestSubmission(test.id);
                    return (
                      <div
                        key={test.id}
                        className="p-4 rounded-2xl border-2 border-blue-300 bg-blue-50/30 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                              {test.isRemedial ? 'اختبار علاجي موجه' : 'اختبار مخصص'}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-1">{test.title}</h4>
                            <p className="text-xs text-slate-600 mt-0.5">{test.description}</p>
                          </div>

                          {sub && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
                              أنجز بنسبة {sub.percentage}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                          <span className="text-xs text-slate-500">
                            {test.questions.length} أسئلة • {test.durationMinutes} دقيقة
                          </span>

                          <button
                            onClick={() => {
                              setIsTargetedTestsModalOpen(false);
                              onStartTest(test);
                            }}
                            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{sub ? 'إعادة الاختبار' : 'ابدأ الاختبار الموجه الآن'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsTargetedTestsModalOpen(false)}
                className="py-2 px-5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
