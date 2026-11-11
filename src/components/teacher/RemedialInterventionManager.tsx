import React, { useState, useMemo, useEffect } from 'react';
import { GradeLevel, Section, Student, Submission, Test, RemedialPlan, PlatformSettings, Question } from '../../types';
import { storageService } from '../../services/storageService';
import { ClearableInput, ClearableTextarea } from '../common/ClearableInput';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  UserCheck,
  UserX,
  Target,
  FileCheck,
  BookOpen,
  Plus,
  Send,
  Printer,
  FileSpreadsheet,
  Layers,
  Search,
  Filter,
  Check,
  Clock,
  ArrowRight,
  ExternalLink,
  Zap,
  Trash2,
} from 'lucide-react';

interface RemedialInterventionManagerProps {
  students: Student[];
  sections: Section[];
  submissions: Submission[];
  tests: Test[];
  settings?: PlatformSettings;
  onAddTest?: (test: Omit<Test, 'id' | 'createdAt'>) => void;
  onUpdateTest?: (test: Test) => void;
  isEmbedded?: boolean;
}

export const RemedialInterventionManager: React.FC<RemedialInterventionManagerProps> = ({
  students,
  sections,
  submissions,
  tests,
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
  onAddTest,
  onUpdateTest,
  isEmbedded = false,
}) => {
  // Main view state: 'general' (واجهة عامة لكل الصفوف أو لشعبة) vs 'individual' (واجهة خاصة لكل طالب)
  const [activeInterventionMode, setActiveInterventionMode] = useState<'general' | 'individual'>('general');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');

  // Individual Student Selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Remedial Plans State from Storage
  const [plans, setPlans] = useState<RemedialPlan[]>(() => storageService.getRemedialPlans());

  // Modal for creating/assigning intervention
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [planStudentId, setPlanStudentId] = useState('');
  const [planSkillName, setPlanSkillName] = useState('');
  const [planStrategy, setPlanStrategy] = useState('مراجعة المفهوم ببطاقات تفاعلية + حل أوراق عمل علاجية مركزة + اختبار تعزيزي موجه');
  const [planNotes, setPlanNotes] = useState('');
  const [autoGenerateRemedTest, setAutoGenerateRemedTest] = useState(true);
  const [planToDelete, setPlanToDelete] = useState<RemedialPlan | null>(null);

  // Success Notification banner
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // 1. Detailed Skill Deficiencies Analysis per student & overall
  // Scans all submissions and answers to find skills where student struggled (< 60%) or (< 80%)
  const studentSkillDeficiencies = useMemo(() => {
    // Map: studentId -> { student: Student, mastered: string[], needingIntervention: string[], unmastered: string[], details: Record<string, { total: number, correct: number, percentage: number, testTitle: string }> }
    const analysis: Record<
      string,
      {
        student: Student;
        sectionLabel: string;
        mastered: string[];
        needingIntervention: string[];
        unmastered: string[];
        details: Record<string, { total: number; correct: number; percentage: number; testTitle: string }>;
      }
    > = {};

    students.forEach((std) => {
      const sec = sections.find((s) => s.id === std.sectionId);
      analysis[std.id] = {
        student: std,
        sectionLabel: sec ? sec.label : `شعبة ${std.sectionId}`,
        mastered: [],
        needingIntervention: [],
        unmastered: [],
        details: {},
      };
    });

    submissions.forEach((sub) => {
      const targetTest = tests.find((t) => t.id === sub.testId);
      if (!targetTest) return;

      const stdEntry = analysis[sub.studentId];
      if (!stdEntry) return;

      // Group answers by skillName from questions
      sub.answers.forEach((ans) => {
        const q = targetTest.questions.find((quest) => quest.id === ans.questionId);
        const skill = q?.skillName || targetTest.title;

        if (!stdEntry.details[skill]) {
          stdEntry.details[skill] = { total: 0, correct: 0, percentage: 0, testTitle: targetTest.title };
        }
        stdEntry.details[skill].total += 1;
        if (ans.isCorrect) {
          stdEntry.details[skill].correct += 1;
        }
      });
    });

    // Compute percentages and categorize
    Object.values(analysis).forEach((item) => {
      Object.entries(item.details).forEach(([skill, stat]) => {
        stat.percentage = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
        if (stat.percentage >= 80) {
          item.mastered.push(skill);
        } else if (stat.percentage >= 60) {
          item.needingIntervention.push(skill);
        } else {
          item.unmastered.push(skill);
        }
      });
    });

    return analysis;
  }, [students, sections, submissions, tests]);

  // Filter students based on grade & section selection
  const filteredStudents = useMemo(() => {
    return students.filter((std) => {
      if (selectedGrade !== 'all' && std.grade !== selectedGrade) return false;
      if (selectedSectionId !== 'all' && std.sectionId !== selectedSectionId) return false;
      if (searchStudentQuery.trim() && !std.name.includes(searchStudentQuery.trim())) return false;
      return true;
    });
  }, [students, selectedGrade, selectedSectionId, searchStudentQuery]);

  // Synchronize selectedStudentId with filtered list whenever section or grade changes
  useEffect(() => {
    if (filteredStudents.length > 0) {
      if (!selectedStudentId || !filteredStudents.some((s) => s.id === selectedStudentId)) {
        setSelectedStudentId(filteredStudents[0].id);
      }
    } else {
      setSelectedStudentId('');
    }
  }, [filteredStudents, selectedGrade, selectedSectionId]);

  // Aggregated Skills Requiring Intervention on Class/Section Level
  const classSkillsSummary = useMemo(() => {
    // Map: skillName -> { skillName: string, unmasteredCount: number, needingInterventionCount: number, masteredCount: number, affectedStudents: Student[] }
    const summary: Record<
      string,
      {
        skillName: string;
        unmasteredCount: number;
        needingInterventionCount: number;
        masteredCount: number;
        affectedStudents: Student[];
        grade: GradeLevel;
      }
    > = {};

    filteredStudents.forEach((std) => {
      const data = studentSkillDeficiencies[std.id];
      if (!data) return;

      data.unmastered.forEach((skill) => {
        if (!summary[skill]) {
          summary[skill] = {
            skillName: skill,
            unmasteredCount: 0,
            needingInterventionCount: 0,
            masteredCount: 0,
            affectedStudents: [],
            grade: std.grade,
          };
        }
        summary[skill].unmasteredCount += 1;
        summary[skill].affectedStudents.push(std);
      });

      data.needingIntervention.forEach((skill) => {
        if (!summary[skill]) {
          summary[skill] = {
            skillName: skill,
            unmasteredCount: 0,
            needingInterventionCount: 0,
            masteredCount: 0,
            affectedStudents: [],
            grade: std.grade,
          };
        }
        summary[skill].needingInterventionCount += 1;
      });

      data.mastered.forEach((skill) => {
        if (!summary[skill]) {
          summary[skill] = {
            skillName: skill,
            unmasteredCount: 0,
            needingInterventionCount: 0,
            masteredCount: 0,
            affectedStudents: [],
            grade: std.grade,
          };
        }
        summary[skill].masteredCount += 1;
      });
    });

    return Object.values(summary).sort((a, b) => b.unmasteredCount - a.unmasteredCount);
  }, [filteredStudents, studentSkillDeficiencies]);

  // Overall Remedial Stats
  const totalStudentsNeedingRemedial = useMemo(() => {
    return filteredStudents.filter((s) => (studentSkillDeficiencies[s.id]?.unmastered.length || 0) > 0).length;
  }, [filteredStudents, studentSkillDeficiencies]);

  const totalUnmasteredSkillInstances = useMemo(() => {
    return filteredStudents.reduce((acc, s) => acc + (studentSkillDeficiencies[s.id]?.unmastered.length || 0), 0);
  }, [filteredStudents, studentSkillDeficiencies]);

  // Selected Student Data for Individual View
  const currentStudentData = useMemo(() => {
    const targetId = selectedStudentId || (filteredStudents[0]?.id ?? '');
    return targetId ? studentSkillDeficiencies[targetId] : null;
  }, [selectedStudentId, filteredStudents, studentSkillDeficiencies]);

  // Activate targeted remedial test for the chosen individual student in one click
  const handleActivateTargetedTestForStudent = (studentId: string, skillName?: string) => {
    const std = students.find((s) => s.id === studentId);
    if (!std) return;

    const targetSkill = skillName || studentSkillDeficiencies[studentId]?.unmastered[0] || 'المفاهيم العلمية الأساسية';
    const testTitle = `اختبار علاجي موجه: ${targetSkill}`;

    if (onAddTest) {
      const newTest = {
        title: `${testTitle} - للطالب ${std.name}`,
        description: `اختبار تدخل علاجي موجه خصيصاً للطالب ${std.name} لإتقان مهارة: ${targetSkill}. تم نشره وتفعيله لهذا الطالب فقط.`,
        grade: std.grade,
        domain: 'علوم الحياة' as const,
        durationMinutes: 10,
        passingScorePercentage: 70,
        isActive: true,
        isNafesBenchmark: false,
        isRemedial: true,
        targetSkillName: targetSkill,
        targetStudentIds: [std.id], // EXCLUSIVELY TARGETED TO THIS STUDENT
        targetSections: [std.sectionId],
        questions: [
          {
            id: `rem-single-${Date.now()}-1`,
            grade: std.grade,
            domain: 'علوم الحياة' as const,
            skillName: targetSkill,
            questionText: `سؤال علاجي موجه في (${targetSkill}) للطالب ${std.name}: ما هو الأساس العلمي الصحيح؟`,
            options: [
              `المفهوم العلمي الدقيق المعتمد لمهارة (${targetSkill})`,
              'تفسير غير دقيق للمفهوم',
              'افتراض خاطئ شائع',
              'معلومة غير متصلة بالموضوع',
            ],
            correctAnswerIndex: 0,
            explanation: `تم تصميم هذا السؤال خصيصاً للتأكد من إتقان الطالب ${std.name} للمهارة بعد المراجعة.`,
            difficulty: 'متوسط' as const,
            diagramEmoji: '🎯',
          },
          {
            id: `rem-single-${Date.now()}-2`,
            grade: std.grade,
            domain: 'علوم الحياة' as const,
            skillName: targetSkill,
            questionText: `تطبيق علاجي في مهارة (${targetSkill}): ما النتيجة المتوقعة للتجربة العلمية؟`,
            options: [
              'النتيجة العلمية المنطقية المعتمدة للمهارة',
              'انخفاض معدل التفاعل دون سبب',
              'توقف العملية بالكامل',
              'عدم وجود تأثير واضح',
            ],
            correctAnswerIndex: 0,
            explanation: `تفسير علمي يثبت مفهوم ${targetSkill}.`,
            difficulty: 'متوسط' as const,
            diagramEmoji: '💡',
          },
        ],
      };
      onAddTest(newTest);
    }

    // Save plan
    storageService.addRemedialPlan({
      grade: std.grade,
      sectionId: std.sectionId,
      studentId: std.id,
      studentName: std.name,
      skillName: targetSkill,
      domain: 'علوم الحياة',
      strategy: 'مراجعة المفهوم ببطاقات تفاعلية + فيديو تعليمي مبسط + اختبار تعزيزي موجه مخصص',
      assignedTestId: `rem-test-${std.id}-${Date.now().toString(36)}`,
      assignedTestTitle: testTitle,
      status: 'in_progress',
      notes: `خطة واختبار علاجي موجه مفعل للطالب ${std.name} بعينه.`,
    });

    setPlans(storageService.getRemedialPlans());
    showNotification(`🎯 تم تفعيل ونشر الاختبار المستهدف للطالب (${std.name}) بعينه بنجاح! سيظهر الاختبار في حسابه فوراً.`);
  };

  // Publish remedial plans & targeted tests for all students with deficiencies in one click (زر نشر الخطط العلاجية للجميع)
  const handlePublishAllRemedialPlans = () => {
    const targetStudentsList = filteredStudents.filter((s) => {
      const def = studentSkillDeficiencies[s.id];
      return (def?.unmastered.length || 0) > 0 || (def?.needingIntervention.length || 0) > 0;
    });

    if (targetStudentsList.length === 0) {
      showNotification('جميع الطلاب في هذا النطاق متقنون لمهاراتهم بنجاح! لا توجد مهارات فاقد تعليمي حالياً.');
      return;
    }

    let createdPlansCount = 0;

    targetStudentsList.forEach((std) => {
      const def = studentSkillDeficiencies[std.id];
      const skillsToRemediate = def ? [...def.unmastered, ...def.needingIntervention] : [];

      skillsToRemediate.forEach((skill) => {
        const testTitle = `اختبار علاجي موجه: ${skill}`;
        
        if (onAddTest) {
          const newTest = {
            title: `${testTitle} - للطالب ${std.name}`,
            description: `اختبار تدخل علاجي موجه خصيصاً للطالب ${std.name} لإتقان مهارة: ${skill}.`,
            grade: std.grade,
            domain: 'علوم الحياة' as const,
            durationMinutes: 10,
            passingScorePercentage: 70,
            isActive: true,
            isNafesBenchmark: false,
            isRemedial: true,
            targetSkillName: skill,
            targetStudentIds: [std.id], // EXCLUSIVE TO THIS STUDENT
            targetSections: [std.sectionId],
            questions: [
              {
                id: `rem-auto-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-1`,
                grade: std.grade,
                domain: 'علوم الحياة' as const,
                skillName: skill,
                questionText: `سؤال علاجي موجه في مهارة (${skill}) للطالب ${std.name}: ما هو التطبيق العلمي الصحيح؟`,
                options: [
                  `التفسير العلمي المعتمد والمفهوم الدقيق لـ (${skill})`,
                  'تفسير افتراضي غير دقيق',
                  'تطبيق غير ملائم للظاهرة',
                  'معلومة غير مرتبطة بناتج التعلم',
                ],
                correctAnswerIndex: 0,
                explanation: `تم إعداد هذا السؤال خصيصاً للطالب ${std.name} لإتقان وتثبيت مهارة (${skill}).`,
                difficulty: 'متوسط' as const,
                diagramEmoji: '🎯',
              },
              {
                id: `rem-auto-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-2`,
                grade: std.grade,
                domain: 'علوم الحياة' as const,
                skillName: skill,
                questionText: `تطبيق تشخيصي مباشر: عند ملاحظة الظاهرة المرتبطة بـ (${skill})، أي الاستنتاجات يعد صائباً؟`,
                options: [
                  'الاستنتاج العلمي الصحيح المطابق للمعيار',
                  'حدوث تغير عشوائي غير مفسر',
                  'انعدام الأثر البيئي أو الفيزيائي',
                  'توقف التفاعل بشكل مفاجئ',
                ],
                correctAnswerIndex: 0,
                explanation: `استنتاج دقيق يعزز إتقان مهارة ${skill}.`,
                difficulty: 'متوسط' as const,
                diagramEmoji: '💡',
              },
            ],
          };
          onAddTest(newTest);
        }

        storageService.addRemedialPlan({
          grade: std.grade,
          sectionId: std.sectionId,
          studentId: std.id,
          studentName: std.name,
          skillName: skill,
          domain: 'علوم الحياة',
          strategy: 'مراجعة المفهوم ببطاقات تفاعلية + فيديو تعليمي مبسط + اختبار تعزيزي موجه مخصص',
          assignedTestId: `auto-rem-test-${std.id}-${Date.now().toString(36)}`,
          assignedTestTitle: testTitle,
          status: 'in_progress',
          notes: `تم النشر الآلي الشامل لجميع الطلاب المستهدفين بإشراف ${settings.teacherName}`,
        });

        createdPlansCount++;
      });
    });

    setPlans(storageService.getRemedialPlans());
    showNotification(
      `🎉 تم بنجاح نشر الخطط العلاجية وتفعيل الاختبارات المستهدفة لجميع الطلاب (${targetStudentsList.length} طالب، ${createdPlansCount} خطة واختبار موجه)! تم النشر فوراً في حساباتهم الخاصة.`
    );
  };

  // Open modal to create individual intervention
  const handleOpenCreatePlan = (studentId: string, skillName?: string) => {
    const std = students.find((s) => s.id === studentId);
    setPlanStudentId(studentId);
    setPlanSkillName(skillName || studentSkillDeficiencies[studentId]?.unmastered[0] || 'مهارة فاقد تعليمي في العلوم');
    setPlanStrategy('مراجعة المفهوم ببطاقات تفاعلية + فيديو تعليمي مبسط + اختبار تعزيزي موجه مخصص');
    setPlanNotes(
      std ? `خطة علاجية مخصصة للطالب ${std.name} لمعالجة الفاقد التعليمي في مهارة (${skillName || 'العلوم'}).` : ''
    );
    setAutoGenerateRemedTest(true);
    setIsCreatePlanModalOpen(true);
  };

  // Submit and create plan + targeted test
  const handleSavePlan = () => {
    const std = students.find((s) => s.id === planStudentId);
    if (!std || !planSkillName) {
      alert('يرجى تحديد الطالب والمهارة المستهدفة!');
      return;
    }

    let createdTestId = '';
    let createdTestTitle = '';

    // If auto create targeted remedial test:
    if (autoGenerateRemedTest && onAddTest) {
      createdTestTitle = `اختبار علاجي موجه: ${planSkillName}`;
      // Generate 2-3 focused diagnostic/remedial questions for this skill
      const remedialQuestions: Question[] = [
        {
          id: `rem-q-${Date.now()}-1`,
          grade: std.grade,
          domain: 'علوم الحياة',
          skillName: planSkillName,
          questionText: `سؤال تشخيصي علاجي حول: ${planSkillName} - ما المفهوم العلمي الدقيق الصحيح؟`,
          options: [
            `الخيار الصحيح الدقيق للمفهوم العلمي (${planSkillName})`,
            'تفسير غير دقيق للمفهوم',
            'افتراض علمي خاطئ شائع',
            'معلومة غير مرتبطة بالظاهرة',
          ],
          correctAnswerIndex: 0,
          explanation: `التفسير الصحيح لمهارة (${planSkillName}) يركز على الفهم المباشر للسبب والنتيجة العلمية.`,
          difficulty: 'متوسط',
          diagramEmoji: '🎯',
        },
        {
          id: `rem-q-${Date.now()}-2`,
          grade: std.grade,
          domain: 'علوم الحياة',
          skillName: planSkillName,
          questionText: `تطبيق عملي علاجي: عند اختبار مهارة (${planSkillName})، أي النتائج الآتية تعد متوقعة؟`,
          options: [
            'النتيجة العلمية المنطقية المعتمدة للمهارة',
            'انخفاض معدل التفاعل دون سبب',
            'توقف العملية بالكامل',
            'عدم وجود تأثير واضح',
          ],
          correctAnswerIndex: 0,
          explanation: `تم تصميم هذا السؤال خصيصاً للتأكد من إتقان الطالب ${std.name} للمهارة بعد المراجعة.`,
          difficulty: 'متوسط',
          diagramEmoji: '💡',
        },
      ];

      const newTest = {
        title: createdTestTitle,
        description: `اختبار تدخل علاجي موجه خصيصاً للطالب ${std.name} لإتقان مهارة: ${planSkillName}. تم نشر هذا الاختبار لهذا الطالب فقط.`,
        grade: std.grade,
        domain: 'علوم الحياة' as const,
        durationMinutes: 10,
        passingScorePercentage: 70,
        isActive: true,
        isNafesBenchmark: false,
        isRemedial: true,
        targetSkillName: planSkillName,
        targetStudentIds: [std.id], // TARGETED TO THIS STUDENT ONLY!
        questions: remedialQuestions,
      };

      onAddTest(newTest);
      createdTestId = `remedial-test-${Date.now()}`;
    }

    // Save Remedial Plan to storage
    const newPlan = storageService.addRemedialPlan({
      grade: std.grade,
      sectionId: std.sectionId,
      studentId: std.id,
      studentName: std.name,
      skillName: planSkillName,
      domain: 'علوم الحياة',
      strategy: planStrategy,
      assignedTestId: createdTestId,
      assignedTestTitle: createdTestTitle || 'اختبار علاجي موجه',
      status: 'in_progress',
      notes: planNotes,
    });

    setPlans(storageService.getRemedialPlans());
    setIsCreatePlanModalOpen(false);
    showNotification(
      `تم إنشاء خطة التدخل العلاجي وتعيين اختبار موجه للطالب (${std.name}) بنجاح! تم نشر الاختبار له فقط.`
    );
  };

  const handleConfirmDeletePlan = () => {
    if (planToDelete) {
      storageService.deleteRemedialPlan(planToDelete.id);
      setPlans(storageService.getRemedialPlans());
      showNotification(`تم حذف الخطة العلاجية للطالب (${planToDelete.studentName}) بنجاح.`);
      setPlanToDelete(null);
    }
  };

  const handleUpdatePlanStatus = (plan: RemedialPlan, status: 'planned' | 'in_progress' | 'completed') => {
    const updated = { ...plan, status };
    storageService.updateRemedialPlan(updated);
    setPlans(storageService.getRemedialPlans());
    showNotification(`تم تحديث حالة الخطة إلى: ${status === 'completed' ? 'تم الإتقان بنجاح ✓' : status === 'in_progress' ? 'قيد التنفيذ' : 'مخطط لها'}`);
  };

  return (
    <div className={`space-y-6 ${isEmbedded ? 'pt-2' : ''}`}>
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-black animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
              <Target className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  نظام التدخل والعلاج الموجه (الفاقد التعليمي)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                  معالجة فردية وجماعية
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                تحليل تلقائي للمهارات غير المتقنة، بناء خطط علاجية مخصصة، ونشر اختبارات موجهة للطلاب المستهدفين فقط.
              </p>
            </div>
          </div>

          {/* Mode Switcher: الواجهة العامة vs الواجهة الخاصة */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
            <button
              onClick={() => setActiveInterventionMode('general')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
                activeInterventionMode === 'general'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>الواجهة العامة (للصف والشعب)</span>
            </button>

            <button
              onClick={() => setActiveInterventionMode('individual')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
                activeInterventionMode === 'individual'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>الواجهة الخاصة (لكل طالب بمفرده)</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar (Grade & Section) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-600">الصف المستهدف:</span>
            {(['all', '4', '5', '6'] as const).map((g) => (
              <button
                key={g}
                onClick={() => {
                  setSelectedGrade(g);
                  setSelectedSectionId('all');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  selectedGrade === g
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {g === 'all' ? 'كافة الصفوف' : `الصف ${g}`}
              </button>
            ))}

            {selectedGrade !== 'all' && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className="font-bold text-slate-600">الشعبة:</span>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 bg-white font-medium text-xs"
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
          </div>

          {/* Quick Search with ClearableInput */}
          <div className="w-64">
            <ClearableInput
              type="text"
              placeholder="بحث بالاسم عن طالب..."
              value={searchStudentQuery}
              onChange={(e) => setSearchStudentQuery(e.target.value)}
              onClear={() => setSearchStudentQuery('')}
              className="text-xs py-1.5 bg-white"
            />
          </div>
        </div>

        {/* Quick Diagnostic Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-rose-50 p-4 rounded-2xl border-2 border-rose-200">
            <span className="text-xs font-bold text-rose-800">طلاب بحاجة لتدخل عاجل</span>
            <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
              {totalStudentsNeedingRemedial} <span className="text-xs font-bold text-rose-400">طالب</span>
            </div>
            <span className="text-[10px] text-rose-600 mt-0.5 block">لديهم مهارات لم تتقن (&lt;60%)</span>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <span className="text-xs font-bold text-amber-800">مهارات فاقد تعليمي مرصودة</span>
            <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
              {classSkillsSummary.length} <span className="text-xs font-bold text-amber-500">مهارة</span>
            </div>
            <span className="text-[10px] text-amber-600 mt-0.5 block">تتطلب خططاً وشروحات بديلة</span>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <span className="text-xs font-bold text-blue-800">خطط التدخل العلاجي النشطة</span>
            <div className="text-2xl font-black text-blue-700 mt-1 font-mono">
              {plans.length} <span className="text-xs font-bold text-blue-500">خطة</span>
            </div>
            <span className="text-[10px] text-blue-600 mt-0.5 block">
              {plans.filter((p) => p.status === 'completed').length} خطة تم إنجازها
            </span>
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800">اختبارات علاجية موجهة منشورة</span>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
              {tests.filter((t) => t.isRemedial || (t.targetStudentIds && t.targetStudentIds.length > 0)).length}{' '}
              <span className="text-xs font-bold text-emerald-500">اختبار</span>
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">منشورة للطلاب المستهدفين فقط</span>
          </div>
        </div>

        {/* -------------------- MODE 1: الواجهة العامة (للصف والشعب) -------------------- */}
        {activeInterventionMode === 'general' && (
          <div className="space-y-6">
            {/* Top Unmastered Skills Table */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>المهارات الأكثر احتياجاً للتدخل على مستوى الصف / الشعبة</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    مرتبة تنازلياً حسب عدد الطلاب الذين لم يتقنوا المهارة (أقل من 60%).
                  </p>
                </div>

                {/* 1-Click Mass Remedial Publish Button for All Students */}
                <button
                  onClick={handlePublishAllRemedialPlans}
                  className="py-2.5 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-95 shrink-0"
                  title="نشر وتفعيل الخطط العلاجية والاختبارات الموجهة لجميع الطلاب المستهدفين فوراً"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>نشر الخطط العلاجية والاختبارات للجميع بنقرة واحدة ⚡</span>
                </button>
              </div>

              {classSkillsSummary.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  لا توجد مهارات مسجلة كفاقد تعليمي حالياً لهذه المجموعة!
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#0f2137] text-white">
                      <tr>
                        <th className="py-3 px-3 text-center w-10">#</th>
                        <th className="py-3 px-4 font-black">اسم المهارة أو ناتج التعلم</th>
                        <th className="py-3 px-3 text-center">الصف</th>
                        <th className="py-3 px-3 text-center bg-rose-900/60 font-black">لم يتقن (فاقد تعليمي)</th>
                        <th className="py-3 px-3 text-center bg-amber-900/50">يحتاج تدخل</th>
                        <th className="py-3 px-3 text-center bg-emerald-900/50">أتقن بنجاح</th>
                        <th className="py-3 px-4">الطلاب المستهدفون بالتدخل</th>
                        <th className="py-3 px-3 text-center">إجراء علاجي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {classSkillsSummary.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 max-w-xs">{item.skillName}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                              الصف {item.grade}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                              {item.unmasteredCount} طالب
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {item.needingInterventionCount} طالب
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800">
                              {item.masteredCount} طالب
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
                              {item.affectedStudents.slice(0, 4).map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    setSelectedStudentId(s.id);
                                    setActiveInterventionMode('individual');
                                  }}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold transition"
                                  title="انتقل للتدخل الفردي لهذا الطالب"
                                >
                                  {s.name}
                                </button>
                              ))}
                              {item.affectedStudents.length > 4 && (
                                <span className="text-[11px] text-slate-500 font-bold">
                                  +{item.affectedStudents.length - 4} آخرين
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (item.affectedStudents.length > 0) {
                                  handleOpenCreatePlan(item.affectedStudents[0].id, item.skillName);
                                }
                              }}
                              className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-1 mx-auto shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>خطة وتعيين اختبار</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Active Remedial Plans Register */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>سجل خطط التدخل والاختبارات الموجهة المنشورة</span>
                </h3>
                <span className="text-xs text-slate-500 font-bold">{plans.length} خطة مسجلة</span>
              </div>

              {plans.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  لم يتم إنشاء خطط علاجية بعد. يمكنك اختيار أي مهارة أو طالب للبدء.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            الصف {plan.grade}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                              plan.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : plan.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {plan.status === 'completed'
                              ? 'تم الإتقان واجتياز الاختبار ✓'
                              : plan.status === 'in_progress'
                              ? 'قيد التنفيذ والمتابعة ⏳'
                              : 'مخطط لها 📝'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900 leading-snug">
                            طالب التدخل: <span className="text-rose-700">{plan.studentName}</span>
                          </h4>
                          <p className="text-xs text-sky-900 font-bold mt-1 line-clamp-2">
                            المهارة المستهدفة: {plan.skillName}
                          </p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                          <div className="text-slate-600 font-medium">
                            <strong>الاستراتيجية:</strong> {plan.strategy}
                          </div>
                          {plan.assignedTestTitle && (
                            <div className="text-emerald-700 font-bold flex items-center gap-1">
                              <Target className="w-3.5 h-3.5" />
                              <span>اختبار موجه: {plan.assignedTestTitle}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Buttons & Delete */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdatePlanStatus(plan, 'completed')}
                            className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                            title="تحديد كمكتمل ومتقن"
                          >
                            إتقان ✓
                          </button>
                          <button
                            onClick={() => handleUpdatePlanStatus(plan, 'in_progress')}
                            className="px-2.5 py-1 rounded-lg font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                          >
                            قيد التنفيذ
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="حذف الخطة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- MODE 2: الواجهة الخاصة (لكل طالب بمفرده) -------------------- */}
        {activeInterventionMode === 'individual' && (
          <div className="space-y-6">
            {/* Student Picker Selector Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label className="text-xs font-black text-slate-700 whitespace-nowrap">
                  اختر الطالب المستهدف بالتدخل:
                </label>
                <select
                  value={selectedStudentId || (filteredStudents[0]?.id ?? '')}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full md:w-80 px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 bg-white"
                >
                  {filteredStudents.map((s) => {
                    const info = studentSkillDeficiencies[s.id];
                    const count = info?.unmastered.length || 0;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({info?.sectionLabel}) - {count > 0 ? `⚠️ لديه ${count} مهارات فاقد` : '✓ متقن'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {currentStudentData && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 1-Click Targeted Test Activation for the Chosen Student */}
                  <button
                    onClick={() => handleActivateTargetedTestForStudent(currentStudentData.student.id)}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                    title={`تفعيل الاختبار المستهدف للطالب ${currentStudentData.student.name} بعينه`}
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>تفعيل الاختبار المستهدف للطالب بعينه 🎯</span>
                  </button>

                  <button
                    onClick={() => handleOpenCreatePlan(currentStudentData.student.id)}
                    className="py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء خطة وتعيين اختبار</span>
                  </button>
                </div>
              )}
            </div>

            {currentStudentData ? (
              <div className="space-y-6">
                {/* Student Profile & Diagnostic Overview Card */}
                <div className="bg-gradient-to-r from-slate-900 to-[#10243d] rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-black">
                      <span>التشخيص الفردي للفاقد التعليمي</span>
                      <span>•</span>
                      <span>{currentStudentData.sectionLabel}</span>
                    </div>

                    <h3 className="text-2xl font-black text-white">{currentStudentData.student.name}</h3>

                    <p className="text-xs text-slate-300">
                      تشخيص المهارات بناءً على نتائج الاختبارات الدورية واختبارات نافس المسجلة.
                    </p>
                  </div>

                  {/* Badges Count */}
                  <div className="grid grid-cols-3 gap-2.5 text-center w-full md:w-auto">
                    <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                      <span className="text-[10px] text-emerald-300 block">مهارات متقنة</span>
                      <strong className="text-lg font-black text-emerald-400 font-mono">
                        {currentStudentData.mastered.length}
                      </strong>
                    </div>

                    <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                      <span className="text-[10px] text-amber-300 block">تحتاج تدخل</span>
                      <strong className="text-lg font-black text-amber-400 font-mono">
                        {currentStudentData.needingIntervention.length}
                      </strong>
                    </div>

                    {/* الخانة باللون الأحمر الفاقع كما طلب المستخدم */}
                    <div className="p-3 bg-rose-600/30 rounded-2xl border-2 border-rose-400">
                      <span className="text-[10px] text-rose-200 font-black block">غير متقنة (فاقد)</span>
                      <strong className="text-lg font-black text-rose-300 font-mono">
                        {currentStudentData.unmastered.length}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Section 1: المهارات غير المتقنة لدى هذا الطالب (بالأحمر مع زر مباشر لتعيين الاختبار) */}
                <div className="space-y-3">
                  <h4 className="text-base font-black text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>المهارات غير المتقنة لدى الطالب (تتطلب تدخل علاجي فوري):</span>
                  </h4>

                  {currentStudentData.unmastered.length === 0 ? (
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>رائع! لا توجد مهارات غير متقنة لدى الطالب حالياً. جميع مهاراته في مستوى الإتقان.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentStudentData.unmastered.map((skill, idx) => {
                        const stat = currentStudentData.details[skill];
                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl border-2 border-rose-300 bg-rose-50/40 space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white">
                                  لم يتقن ({stat ? `${stat.percentage}%` : 'فاقد'})
                                </span>
                                <span className="text-[11px] text-slate-500 font-bold">{stat?.testTitle}</span>
                              </div>
                              <h5 className="text-sm font-black text-slate-900 leading-snug">{skill}</h5>
                              <p className="text-[11px] text-slate-600">
                                حقق الطالب {stat?.correct || 0} من أصل {stat?.total || 0} أسئلة مرتبطة بهذه المهارة.
                              </p>
                            </div>

                            <button
                              onClick={() => handleOpenCreatePlan(currentStudentData.student.id, skill)}
                              className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إنشاء خطة وتعيين اختبار علاجي موجه لهذا الطالب 🎯</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: المهارات التي تحتاج تدخل */}
                {currentStudentData.needingIntervention.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-base font-black text-amber-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span>مهارات في منطقة التدخل والتعزيز (نسبة الإتقان 60% - 79%):</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentStudentData.needingIntervention.map((skill, idx) => {
                        const stat = currentStudentData.details[skill];
                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/30 flex items-center justify-between gap-3"
                          >
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">{skill}</h5>
                              <span className="text-[11px] text-amber-700 font-bold">
                                نسبة الإنجاز: {stat?.percentage}% ({stat?.correct}/{stat?.total})
                              </span>
                            </div>
                            <button
                              onClick={() => handleOpenCreatePlan(currentStudentData.student.id, skill)}
                              className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition whitespace-nowrap"
                            >
                              تعزيز المهارة
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 3: المهارات المتقنة لدى الطالب */}
                {currentStudentData.mastered.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-base font-black text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>المهارات المتقنة بنجاح لدى الطالب (80% فما فوق):</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {currentStudentData.mastered.map((skill, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between"
                        >
                          <span className="text-xs font-bold text-slate-800">{skill}</span>
                          <span className="text-xs font-black text-emerald-700">✓ أتقن</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
                يرجى اختيار طالب لعرض تفاصيل تدخله الفردي.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Create Individual Remedial Plan & Targeted Test */}
      {isCreatePlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-[#0f2137] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-500/20 text-rose-300 rounded-xl">
                  <Target className="w-5 h-5" />
                </span>
                <h3 className="text-base sm:text-lg font-black">
                  إنشاء خطة تدخل علاجي وتعيين اختبار موجه
                </h3>
              </div>
              <button
                onClick={() => setIsCreatePlanModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الطالب المستهدف:</label>
                <input
                  type="text"
                  disabled
                  value={students.find((s) => s.id === planStudentId)?.name || ''}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المهارة المستهدفة بالمعالجة:</label>
                <ClearableInput
                  type="text"
                  value={planSkillName}
                  onChange={(e) => setPlanSkillName(e.target.value)}
                  onClear={() => setPlanSkillName('')}
                  placeholder="أدخل المهارة المستهدفة..."
                  className="font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">استراتيجية التدخل والعلاج:</label>
                <select
                  value={planStrategy}
                  onChange={(e) => setPlanStrategy(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 bg-white"
                >
                  <option value="مراجعة المفهوم ببطاقات تفاعلية + فيديو تعليمي مبسط + اختبار تعزيزي موجه">
                    مراجعة المفهوم ببطاقات تفاعلية + فيديو تعليمي مبسط + اختبار تعزيزي موجه
                  </option>
                  <option value="حل أوراق عمل علاجية وتطبيقات تدريبية موجهة">
                    حل أوراق عمل علاجية وتطبيقات تدريبية موجهة
                  </option>
                  <option value="حل أوراق عمل تدريبية موجهة بصيغة Word و PDF">
                    حل أوراق عمل تدريبية موجهة بصيغة Word و PDF
                  </option>
                  <option value="جلسة مراجعة فردية مع المعلم لشرح المفاهيم المشكلة">
                    جلسة مراجعة فردية مع المعلم لشرح المفاهيم المشكلة
                  </option>
                </select>
              </div>

              {/* Target Test Toggle */}
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-black text-rose-900">
                  <input
                    type="checkbox"
                    checked={autoGenerateRemedTest}
                    onChange={(e) => setAutoGenerateRemedTest(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>نشر وتعيين اختبار علاجي مخصص لهذا الطالب المستهدف فقط 🎯</span>
                </label>
                <p className="text-[11px] text-rose-700 leading-relaxed pr-6">
                  عند تفعيل هذا الخيار، سيتم إنشاء اختبار تشخيصي مخصص لهذه المهارة وسيظهر في حساب الطالب المستهدف فقط،
                  ولن يظهر لبقية زملائه في الصف!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وتوصيات إضافية:</label>
                <ClearableTextarea
                  rows={2}
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  onClear={() => setPlanNotes('')}
                  placeholder="ملاحظات وتوصيات المعلم..."
                  className="text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSavePlan}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>اعتماد ونشر خطة التدخل للطالب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatePlanModalOpen(false)}
                  className="py-3 px-5 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
