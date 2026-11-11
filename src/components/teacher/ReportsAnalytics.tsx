import React, { useState, useMemo } from 'react';
import { GradeLevel, Section, Student, Submission, Test, Badge, StudentGamification, PlatformSettings } from '../../types';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Users,
  Printer,
  Download,
  Filter,
  BarChart3,
  Sparkles,
  Trophy,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Layers,
  User,
  GraduationCap,
  Calendar,
  Clock,
  Target,
} from 'lucide-react';
import {
  buildSkillOutcomeRecords,
  exportSkillMasteryTableToExcel,
  exportSkillMasteryTableToWord,
  exportGeneralResultsToExcel,
  exportGeneralResultsToWord,
  SkillOutcomeResultRow,
} from '../../utils/exportUtils';

interface ReportsAnalyticsProps {
  students: Student[];
  sections: Section[];
  submissions: Submission[];
  tests: Test[];
  badges: Badge[];
  allGamification: Record<string, StudentGamification>;
  settings?: PlatformSettings;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  students,
  sections,
  submissions,
  tests,
  badges,
  allGamification,
  settings = {
    platformTitle: 'منصة إتقان في العلوم',
    subtitle: 'إدارة وتصميم اختبارات وقياس مهارات العلوم (الرابع - الخامس - السادس الابتدائي) - إعداد المعلم: محمد نادي سيد محمد',
    schoolName: 'مدارس التربية النموذجية',
    teacherName: 'محمد نادي سيد محمد',
    teacherTitle: 'معلم مادة العلوم',
    studentPin: '1234',
    teacherPassword: '',
    allowStudentRetry: true,
    showExplanationsToStudents: true,
    gamificationEnabled: true,
    pointsPerCorrectAnswer: 10,
    pointsPerQuizCompletion: 50,
    pointsPerSimulationCompletion: 100,
  },
}) => {
  // Main view switcher: 'class' (واجهة عامة لكل الصف) vs 'student' (واجهة خاصة لكل طالب بمفرده)
  const [reportViewMode, setReportViewMode] = useState<'class' | 'student'>('class');

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedTestType, setSelectedTestType] = useState<'all' | 'منهج' | 'نافس'>('all');
  const [selectedMasteryStatus, setSelectedMasteryStatus] = useState<'all' | 'mastered' | 'intervention' | 'not_mastered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [classSubTab, setClassSubTab] = useState<'skills-overview' | 'detailed-table' | 'sections' | 'gamification'>('skills-overview');

  // Individual Student Selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Filter submissions by Grade & Section
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      const student = students.find((std) => std.id === s.studentId);
      if (selectedSectionId !== 'all' && student?.sectionId !== selectedSectionId) return false;
      return true;
    });
  }, [submissions, selectedGrade, selectedSectionId, students]);

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (selectedSectionId !== 'all' && s.sectionId !== selectedSectionId) return false;
      if (searchQuery.trim() && !s.name.includes(searchQuery.trim())) return false;
      return true;
    });
  }, [students, selectedGrade, selectedSectionId, searchQuery]);

  // Build the detailed Skill & Learning Outcomes rows
  const allSkillRecords = useMemo(() => {
    return buildSkillOutcomeRecords(filteredSubmissions, tests, students, sections);
  }, [filteredSubmissions, tests, students, sections]);

  // Filter the skill records based on user selections
  const filteredSkillRecords = useMemo(() => {
    return allSkillRecords.filter((rec) => {
      if (selectedTestType !== 'all' && rec.testType !== selectedTestType) return false;
      if (selectedMasteryStatus === 'mastered' && !rec.isMastered) return false;
      if (selectedMasteryStatus === 'not_mastered' && rec.isMastered) return false;
      if (selectedMasteryStatus === 'intervention' && (rec.masteryPercentage < 60 || rec.masteryPercentage >= 80)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inStudent = rec.studentName.toLowerCase().includes(q);
        const inSkill = rec.skillOrOutcomeName.toLowerCase().includes(q);
        const inDomain = rec.domain.toLowerCase().includes(q);
        const inTest = rec.testTitle.toLowerCase().includes(q);
        return inStudent || inSkill || inDomain || inTest;
      }
      return true;
    });
  }, [allSkillRecords, selectedTestType, selectedMasteryStatus, searchQuery]);

  // General Class Level Analysis: Group all unique skills into 3 distinct categories:
  // 1. المهارات المتقنة (>= 80%)
  // 2. المهارات التي تحتاج تدخل (60% - 79%)
  // 3. المهارات غير المتقنة (< 60% بالأحمر)
  const classSkillsCategorization = useMemo(() => {
    const skillsMap: Record<
      string,
      {
        skillName: string;
        domain: string;
        grade: string;
        testType: 'منهج' | 'نافس';
        totalAttempts: number;
        correctAnswers: number;
        totalQuestions: number;
        masteredStudents: Set<string>;
        interventionStudents: Set<string>;
        unmasteredStudents: Set<string>;
      }
    > = {};

    allSkillRecords.forEach((rec) => {
      if (selectedTestType !== 'all' && rec.testType !== selectedTestType) return;
      if (!skillsMap[rec.skillOrOutcomeName]) {
        skillsMap[rec.skillOrOutcomeName] = {
          skillName: rec.skillOrOutcomeName,
          domain: rec.domain,
          grade: rec.grade,
          testType: rec.testType,
          totalAttempts: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          masteredStudents: new Set(),
          interventionStudents: new Set(),
          unmasteredStudents: new Set(),
        };
      }

      const item = skillsMap[rec.skillOrOutcomeName];
      item.totalAttempts += 1;
      item.correctAnswers += rec.correctQuestions;
      item.totalQuestions += rec.totalQuestions;

      if (rec.masteryPercentage >= 80) {
        item.masteredStudents.add(rec.studentName);
      } else if (rec.masteryPercentage >= 60) {
        item.interventionStudents.add(rec.studentName);
      } else {
        item.unmasteredStudents.add(rec.studentName);
      }
    });

    const list = Object.values(skillsMap).map((item) => {
      const overallPercentage =
        item.totalQuestions > 0 ? Math.round((item.correctAnswers / item.totalQuestions) * 100) : 0;
      return {
        ...item,
        overallPercentage,
        masteredCount: item.masteredStudents.size,
        interventionCount: item.interventionStudents.size,
        unmasteredCount: item.unmasteredStudents.size,
        status:
          overallPercentage >= 80
            ? ('mastered' as const)
            : overallPercentage >= 60
            ? ('intervention' as const)
            : ('unmastered' as const),
      };
    });

    return {
      all: list,
      mastered: list.filter((s) => s.status === 'mastered'),
      needingIntervention: list.filter((s) => s.status === 'intervention'),
      unmastered: list.filter((s) => s.status === 'unmastered'),
    };
  }, [allSkillRecords, selectedTestType]);

  // Overall Stats
  const totalRecords = filteredSkillRecords.length;
  const masteredCount = filteredSkillRecords.filter((r) => r.isMastered).length;
  const notMasteredCount = totalRecords - masteredCount;
  const overallMasteryRate = totalRecords > 0 ? Math.round((masteredCount / totalRecords) * 100) : 0;

  // ---------------- INDIVIDUAL STUDENT REPORT DATA ----------------
  const targetStudentId = selectedStudentId || (filteredStudents[0]?.id ?? '');
  const targetStudent = students.find((s) => s.id === targetStudentId);

  const individualStudentReport = useMemo(() => {
    if (!targetStudent) return null;

    const studentRecords = allSkillRecords.filter((r) => r.studentId === targetStudent.id);
    const studentSubs = submissions.filter((s) => s.studentId === targetStudent.id);

    // Group student's skills into:
    // 1. المهارات المتقنة لديه
    // 2. المهارات التي تحتاج تدخل لديه
    // 3. المهارات غير المتقنة لديه (بالأحمر)
    const masteredSkills = studentRecords.filter((r) => r.isMastered || r.masteryPercentage >= 80);
    const needingInterventionSkills = studentRecords.filter(
      (r) => !r.isMastered && r.masteryPercentage >= 60 && r.masteryPercentage < 80
    );
    const unmasteredSkills = studentRecords.filter((r) => r.masteryPercentage < 60);

    const totalTests = studentSubs.length;
    const avgScore =
      totalTests > 0 ? Math.round(studentSubs.reduce((a, b) => a + b.percentage, 0) / totalTests) : 0;

    const gamification = allGamification[targetStudent.id];
    const sec = sections.find((s) => s.id === targetStudent.sectionId);

    return {
      student: targetStudent,
      sectionLabel: sec ? sec.label : '',
      studentRecords,
      studentSubs,
      masteredSkills,
      needingInterventionSkills,
      unmasteredSkills,
      totalTests,
      avgScore,
      gamification,
    };
  }, [targetStudent, allSkillRecords, submissions, allGamification, sections]);

  // Exports
  const handleExportExcel = () => {
    const filterInfo = `${selectedGrade === 'all' ? 'جميع الصفوف' : `الصف ${selectedGrade}`} | نوع الاختبار: ${selectedTestType === 'all' ? 'الكل' : selectedTestType}`;
    exportSkillMasteryTableToExcel(filteredSkillRecords, settings, filterInfo);
  };

  const handleExportWord = () => {
    const filterInfo = `${selectedGrade === 'all' ? 'جميع الصفوف' : `الصف ${selectedGrade}`} | نوع الاختبار: ${selectedTestType === 'all' ? 'الكل' : selectedTestType}`;
    exportSkillMasteryTableToWord(filteredSkillRecords, settings, filterInfo);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Header for PDF Printing (Only visible during print) */}
      <div className="hidden print:block text-center border-b-2 border-amber-500 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h3 className="font-bold text-sm">المملكة العربية السعودية - وزارة التعليم</h3>
            <h4 className="font-extrabold text-base text-amber-900">{settings.schoolName}</h4>
            <p className="text-xs text-slate-600">القسم الابتدائي - مادة العلوم</p>
          </div>
          <img
            src="/assets/aistudio/TNS2_logo_-_2023-0__426ea3a1.png"
            alt="شعار المدارس"
            className="h-16 w-auto object-contain"
          />
          <div className="text-left text-xs">
            <p><strong>المعلم المشرف:</strong> {settings.teacherName}</p>
            <p><strong>المنصة:</strong> {settings.platformTitle}</p>
            <p><strong>نوع التقرير:</strong> {reportViewMode === 'class' ? 'تقرير عام للصف' : `تقرير فردي: ${targetStudent?.name || ''}`}</p>
            <p><strong>التاريخ:</strong> {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>
      </div>

      {/* Main Header & View Mode Switcher */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-100 text-blue-800 rounded-2xl">
              <BarChart3 className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                التقارير الاحترافية وتحليل نواتج التعلم
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                مقسمة إلى واجهة عامة لكل الصف وواجهة خاصة لكل طالب بمفرده مع تصنيف المهارات المتقنة وغير المتقنة والتي تحتاج تدخل.
              </p>
            </div>
          </div>
        </div>

        {/* Global Export & Print Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-xs"
            title="تحميل كشف نواتج التعلم بصيغة Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تحميل Excel</span>
          </button>

          <button
            onClick={handleExportWord}
            className="py-2 px-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-xs"
            title="تحميل كشف نواتج التعلم بصيغة Word"
          >
            <FileText className="w-4 h-4" />
            <span>تحميل Word</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2 px-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-xs"
            title="طباعة أو تصدير PDF"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة PDF</span>
          </button>
        </div>
      </div>

      {/* Primary Switcher between (واجهة عامة لكل الصف) and (واجهة خاصة لكل طالب بمفرده) */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportViewMode('class')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-2 ${
              reportViewMode === 'class'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>الواجهة العامة (لكل الصف والشعب)</span>
          </button>

          <button
            onClick={() => setReportViewMode('student')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-2 ${
              reportViewMode === 'student'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>الواجهة الخاصة (لكل طالب بمفرده)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 px-3 hidden sm:block font-bold">
          {reportViewMode === 'class' ? '📊 نظرة شاملة لنسب الصف والشعب' : '👤 بطاقة مهارات تفصيلية لكل طالب'}
        </div>
      </div>

      {/* Global Filter Bar (Grade, Section, Test Type) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Grade filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-600">الصف الدراسي:</span>
            <div className="flex items-center gap-1">
              {(['all', '4', '5', '6'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setSelectedGrade(g);
                    setSelectedSectionId('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    selectedGrade === g
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g === 'all' ? 'جميع الصفوف' : `الصف ${g}`}
                </button>
              ))}
            </div>
          </div>

          {/* Section filter */}
          {selectedGrade !== 'all' && (
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-slate-600">الشعبة:</span>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
              >
                <option value="all">كافة الشعب</option>
                {sections
                  .filter((sec) => sec.grade === selectedGrade)
                  .map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.label}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Test Type Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-slate-600">نوع الاختبار:</span>
            <select
              value={selectedTestType}
              onChange={(e) => setSelectedTestType(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium"
            >
              <option value="all">الكل (منهج ونافس)</option>
              <option value="منهج">منهج الوزارة فقط</option>
              <option value="نافس">نافس الوطني فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: الواجهة العامة لكل الصف (CLASS OVERVIEW)                           */}
      {/* ========================================================================= */}
      {reportViewMode === 'class' && (
        <div className="space-y-6">
          {/* Sub Tab Navigation for Class View */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 print:hidden">
            <button
              onClick={() => setClassSubTab('skills-overview')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 ${
                classSubTab === 'skills-overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>تصنيف المهارات (المتقنة / تحتاج تدخل / غير متقنة)</span>
            </button>

            <button
              onClick={() => setClassSubTab('detailed-table')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                classSubTab === 'detailed-table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>كشف نواتج التعلم التفصيلي</span>
            </button>

            <button
              onClick={() => setClassSubTab('sections')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                classSubTab === 'sections'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>مقارنة الشعب الدراسية</span>
            </button>

            <button
              onClick={() => setClassSubTab('gamification')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                classSubTab === 'gamification'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>لوحة الأوسمة والتحفيز</span>
            </button>
          </div>

          {/* SubTab 1: Skills Categories (المتقنة - تحتاج تدخل - غير متقنة بالأحمر) */}
          {classSubTab === 'skills-overview' && (
            <div className="space-y-6">
              {/* Three Main Stats Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. المهارات المتقنة */}
                <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-300 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      المهارات المتقنة (80% فأعلى)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-xs font-bold font-mono">
                      ✓ متقن
                    </span>
                  </div>
                  <div className="text-3xl font-black text-emerald-700 font-mono">
                    {classSkillsCategorization.mastered.length}{' '}
                    <span className="text-xs font-bold text-emerald-600">مهارة</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    حقق طلاب الصف في هذه المهارات معدل إتقان ممتاز يلبي المعايير المعتمدة.
                  </p>
                </div>

                {/* 2. المهارات التي تحتاج تدخل */}
                <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-300 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      المهارات التي تحتاج تدخل (60% - 79%)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-xs font-bold font-mono">
                      ⚠️ تعزيز
                    </span>
                  </div>
                  <div className="text-3xl font-black text-amber-700 font-mono">
                    {classSkillsCategorization.needingIntervention.length}{' '}
                    <span className="text-xs font-bold text-amber-600">مهارة</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    تتطلب أنشطة تعزيزية وتكثيف الشرح لضمان رفع نسبة الإتقان للحد المطلوب.
                  </p>
                </div>

                {/* 3. المهارات غير المتقنة (بالأحمر الفاقع كما طلب المستخدم) */}
                <div className="bg-rose-50 rounded-3xl p-5 border-2 border-rose-400 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      المهارات غير المتقنة (أقل من 60% فاقد)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-black font-mono">
                      ✗ فاقد تعليمي
                    </span>
                  </div>
                  <div className="text-3xl font-black text-rose-600 font-mono">
                    {classSkillsCategorization.unmastered.length}{' '}
                    <span className="text-xs font-bold text-rose-500">مهارة</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    تتطلب خطة تدخل علاجي عاجلة وإعادة تدريس واختبارات تعزيزية مخصصة.
                  </p>
                </div>
              </div>

              {/* Categorized Skills Panels */}
              <div className="space-y-6">
                {/* 1. قائمة المهارات غير المتقنة باللون الأحمر البارز */}
                <div className="bg-white rounded-3xl p-6 border-2 border-rose-300 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-600"></span>
                      <h3 className="text-base font-black text-rose-800">
                        المهارات غير المتقنة على مستوى الصف (تتطلب خطة تدخل علاجي عاجلة)
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                      {classSkillsCategorization.unmastered.length} مهارة فاقد
                    </span>
                  </div>

                  {classSkillsCategorization.unmastered.length === 0 ? (
                    <div className="p-4 text-center text-emerald-700 font-bold text-xs bg-emerald-50 rounded-2xl">
                      ممتاز! لا توجد مهارات غير متقنة في هذا الصف.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {classSkillsCategorization.unmastered.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                                {s.domain}
                              </span>
                              <span className="text-xs font-black text-rose-600">
                                نسبة الإتقان العامة: {s.overallPercentage}%
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900">{s.skillName}</h4>
                            <p className="text-[11px] text-slate-600">
                              عدد الطلاب غير المتقنين: <strong>{s.unmasteredCount} طالب</strong>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. قائمة المهارات التي تحتاج تدخل */}
                <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <h3 className="text-base font-black text-amber-900">
                        المهارات التي تحتاج تدخل وتعزيز (60% - 79%)
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                      {classSkillsCategorization.needingIntervention.length} مهارة
                    </span>
                  </div>

                  {classSkillsCategorization.needingIntervention.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl">
                      لا توجد مهارات في نطاق التدخل حالياً.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {classSkillsCategorization.needingIntervention.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-2 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                                {s.domain}
                              </span>
                              <span className="text-xs font-black text-amber-700">
                                نسبة الإتقان العامة: {s.overallPercentage}%
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900">{s.skillName}</h4>
                            <p className="text-[11px] text-slate-600">
                              عدد الطلاب في نطاق التدخل: <strong>{s.interventionCount} طالب</strong>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. قائمة المهارات المتقنة */}
                <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <h3 className="text-base font-black text-emerald-900">
                        المهارات المتقنة بنجاح (80% فأعلى)
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      {classSkillsCategorization.mastered.length} مهارة متقنة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {classSkillsCategorization.mastered.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">{s.domain}</span>
                          <span className="font-black text-emerald-700">{s.overallPercentage}%</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{s.skillName}</h4>
                        <div className="text-[10px] text-emerald-800 font-bold">
                          {s.masteredCount} طالب أتقنوا المهارة
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: Detailed Table (كشف نواتج التعلم التفصيلي) */}
          {classSubTab === 'detailed-table' && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold text-slate-700">
                  عرض {filteredSkillRecords.length} سجل مهارة مطابقة للفلاتر
                </span>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="بحث بالطالب أو المهارة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0B192C] text-white">
                      <th className="py-3 px-3 text-center border-b border-slate-700 w-10">#</th>
                      <th className="py-3 px-3 border-b border-slate-700 font-black">اسم الطالب</th>
                      <th className="py-3 px-3 border-b border-slate-700 text-center">الصف والشعبة</th>
                      <th className="py-3 px-4 border-b border-slate-700 font-black">اسم الناتج أو المهارة المستهدفة</th>
                      <th className="py-3 px-3 border-b border-slate-700 text-center">نوع الاختبار</th>
                      <th className="py-3 px-3 border-b border-slate-700">المجال العلمي</th>
                      <th className="py-3 px-3 border-b border-slate-700 text-center font-black">حالة الإتقان</th>
                      <th className="py-3 px-3 border-b border-slate-700 text-center">نسبة الإتقان</th>
                      <th className="py-3 px-3 border-b border-slate-700 text-center">تاريخ المحاولة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSkillRecords.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50/80 transition ${
                          !r.isMastered ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{r.studentName}</td>
                        <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {r.grade} / {r.sectionName}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-sky-900 max-w-xs">{r.skillOrOutcomeName}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              r.testType === 'نافس'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {r.testType === 'نافس' ? 'نافس الوطني' : 'منهج الوزارة'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">{r.domain}</td>

                        {/* الخانة باللون الأحمر لـ "لم يتقن" بالأحمر الفاقع كما طلب المستخدم */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {r.isMastered ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>أتقن</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-red-600 text-white shadow-xs animate-pulse">
                              <XCircle className="w-3.5 h-3.5 text-white" />
                              <span>لم يتقن</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold">
                          <span className={r.isMastered ? 'text-emerald-700' : 'text-rose-600'}>
                            {r.masteryPercentage}% ({r.correctQuestions} من {r.totalQuestions})
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {r.attemptDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 3: مقارنة الشعب الدراسية */}
          {classSubTab === 'sections' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                مقارنة نسب الإتقان حسب الشعب الدراسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections
                  .filter((sec) => selectedGrade === 'all' || sec.grade === selectedGrade)
                  .map((sec) => {
                    const secSubs = submissions.filter((sub) => {
                      const std = students.find((s) => s.id === sub.studentId);
                      return std?.sectionId === sec.id;
                    });
                    const avg =
                      secSubs.length > 0
                        ? Math.round(secSubs.reduce((a, b) => a + b.percentage, 0) / secSubs.length)
                        : 0;

                    return (
                      <div key={sec.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-base text-slate-800">{sec.label}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                            {secSubs.length} اختبار
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">متوسط الإتقان للشعبة:</div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                            style={{ width: `${avg}%` }}
                          />
                        </div>
                        <div className="text-right text-xs font-black text-emerald-800">{avg}%</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* SubTab 4: الأوسمة والتحفيز */}
          {classSubTab === 'gamification' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                لوحة إنجازات الطلاب ونقاط التلعيب والأوسمة
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {students.slice(0, 15).map((s) => {
                  const g = allGamification[s.id];
                  return (
                    <div key={s.id} className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">{s.name}</h4>
                        <span className="text-[11px] text-amber-700 font-bold">{g?.levelTitle || 'مستكشف مبتدئ'}</span>
                      </div>
                      <div className="text-left">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-xs">
                          ⭐ {g?.points || 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: الواجهة الخاصة لكل طالب بمفرده (INDIVIDUAL STUDENT VIEW)             */}
      {/* ========================================================================= */}
      {reportViewMode === 'student' && individualStudentReport && (
        <div className="space-y-6">
          {/* Student Picker Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <User className="w-5 h-5" />
              </span>
              <div className="flex-1 md:flex-initial">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  اختر الطالب لعرض بطاقة التقرير الفردية:
                </label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full md:w-80 px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 bg-white"
                >
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (الصف {s.grade})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>طباعة بطاقة تقرير الطالب (PDF)</span>
              </button>
            </div>
          </div>

          {/* Student Profile Overview Card */}
          <div className="bg-gradient-to-r from-[#0d1d33] via-[#0f2a4a] to-[#0d1d33] rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                  <span>بطاقة تقرير قياس المهارات الفردي</span>
                  <span>•</span>
                  <span>{settings.schoolName}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {individualStudentReport.student.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                  <span>الصف {individualStudentReport.student.grade} الابتدائي</span>
                  <span>•</span>
                  <span>{individualStudentReport.sectionLabel}</span>
                  <span>•</span>
                  <span>المعلم: {settings.teacherName}</span>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center w-full md:w-auto">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-300 block">الاختبارات</span>
                  <strong className="text-base font-black text-white font-mono">
                    {individualStudentReport.totalTests}
                  </strong>
                </div>

                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-300 block">المعدل العام</span>
                  <strong className="text-base font-black text-emerald-300 font-mono">
                    {individualStudentReport.avgScore}%
                  </strong>
                </div>

                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-300 block">نقاط التلعيب</span>
                  <strong className="text-base font-black text-amber-300 font-mono">
                    ⭐ {individualStudentReport.gamification?.points || 0}
                  </strong>
                </div>

                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-300 block">الرتبة العلمية</span>
                  <strong className="text-xs font-black text-cyan-300 line-clamp-1">
                    {individualStudentReport.gamification?.levelTitle || 'مستكشف'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Dedicated Sections for Student Skills: المتقنة - التي تحتاج تدخل - غير المتقنة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: المهارات المتقنة لدى الطالب */}
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="font-black text-emerald-800 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>المهارات المتقنة لديه (80%+)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  {individualStudentReport.masteredSkills.length}
                </span>
              </div>

              {individualStudentReport.masteredSkills.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">لا توجد مهارات متقنة مسجلة بعد.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {individualStudentReport.masteredSkills.map((sk, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{sk.skillOrOutcomeName}</span>
                        <span className="font-black text-emerald-700">{sk.masteryPercentage}%</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {sk.domain} • {sk.testType === 'نافس' ? 'نافس' : 'منهج'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Box 2: المهارات التي تحتاج تدخل لدى الطالب */}
            <div className="bg-white rounded-3xl p-5 border-2 border-amber-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <span className="font-black text-amber-800 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>مهارات تحتاج تدخل (60%-79%)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                  {individualStudentReport.needingInterventionSkills.length}
                </span>
              </div>

              {individualStudentReport.needingInterventionSkills.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">لا توجد مهارات في هذا النطاق.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {individualStudentReport.needingInterventionSkills.map((sk, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{sk.skillOrOutcomeName}</span>
                        <span className="font-black text-amber-700">{sk.masteryPercentage}%</span>
                      </div>
                      <span className="text-[10px] text-amber-800 block">
                        التوصية: مراجعة المفهوم وحل ورقة عمل تدريبية
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Box 3: المهارات غير المتقنة لدى الطالب (بالأحمر الفاقع كما طلب المستخدم) */}
            <div className="bg-rose-50/60 rounded-3xl p-5 border-2 border-rose-400 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <span className="font-black text-rose-800 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>مهارات غير متقنة (تتطلب علاج)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-600 text-white animate-pulse">
                  {individualStudentReport.unmasteredSkills.length} فاقد
                </span>
              </div>

              {individualStudentReport.unmasteredSkills.length === 0 ? (
                <p className="text-xs text-emerald-700 font-bold py-6 text-center">
                  رائع! لا توجد مهارات مفقودة لدى هذا الطالب.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {individualStudentReport.unmasteredSkills.map((sk, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white border border-rose-300 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{sk.skillOrOutcomeName}</span>
                        <span className="font-black text-rose-600">{sk.masteryPercentage}%</span>
                      </div>
                      <span className="text-[10px] text-rose-700 font-bold block">
                        الإجراء المطلوب: خطة علاجية مخصصة وتعيين اختبار موجه
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Student Submissions History Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>سجل اختبارات ومحاولات الطالب:</span>
            </h4>

            {individualStudentReport.studentSubs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">لم يقم الطالب بإجراء أي اختبارات بعد.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-4">عنوان الاختبار</th>
                      <th className="py-2.5 px-3 text-center">الدرجة</th>
                      <th className="py-2.5 px-3 text-center">النسبة المئوية</th>
                      <th className="py-2.5 px-3 text-center">الحالة</th>
                      <th className="py-2.5 px-3 text-center">تاريخ الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {individualStudentReport.studentSubs.map((sub, idx) => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{sub.testTitle}</td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {sub.score} من {sub.totalQuestions}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black">
                          <span className={sub.percentage >= 80 ? 'text-emerald-700' : sub.percentage >= 60 ? 'text-amber-700' : 'text-rose-600'}>
                            {sub.percentage}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {sub.passed ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              اجتياز بنجاح
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              بحاجة لتدخل
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {sub.completedAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
