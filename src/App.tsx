import React, { useState } from 'react';
import {
  GradeLevel,
  Section,
  Student,
  Test,
  Submission,
  PlatformSettings,
  Badge,
  StudentGamification,
} from './types';
import { storageService } from './services/storageService';
import { Header } from './components/Header';
import { CurriculumSkillsManager } from './components/teacher/CurriculumSkillsManager';
import { NafesGrade6TestDesigner } from './components/teacher/NafesGrade6TestDesigner';
import { LandingPortal } from './components/LandingPortal';
import { StudentLogin } from './components/student/StudentLogin';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TestTakingModal } from './components/student/TestTakingModal';
import { TestResultView } from './components/student/TestResultView';
import { TeacherLoginModal } from './components/teacher/TeacherLoginModal';
import { TeacherOverview } from './components/teacher/TeacherOverview';
import { TeacherHeader } from './components/teacher/TeacherHeader';
import { TeacherNavBar, TeacherTab } from './components/teacher/TeacherNavBar';
import { SectionsManager } from './components/teacher/SectionsManager';
import { TestManager } from './components/teacher/TestManager';
import { ReportsAnalytics } from './components/teacher/ReportsAnalytics';
import { SettingsView } from './components/teacher/SettingsView';
import { ScienceQuestionGeneratorModal } from './components/teacher/ScienceQuestionGeneratorModal';
import { LeaderboardView } from './components/gamification/LeaderboardView';
import { RemedialInterventionManager } from './components/teacher/RemedialInterventionManager';
import {
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Sparkles,
  Trophy,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  // Persistence state
  const [settings, setSettings] = useState<PlatformSettings>(storageService.getSettings());
  const [sections, setSections] = useState<Section[]>(storageService.getSections());
  const [students, setStudents] = useState<Student[]>(storageService.getStudents());
  const [tests, setTests] = useState<Test[]>(storageService.getTests());
  const [submissions, setSubmissions] = useState<Submission[]>(storageService.getSubmissions());
  const [badges, setBadges] = useState<Badge[]>(storageService.getBadges());
  const [allGamification, setAllGamification] = useState<Record<string, StudentGamification>>(
    storageService.getAllGamification()
  );

  // Default view is 'portal' matching the screenshot
  const [currentView, setCurrentView] = useState<'portal' | 'student' | 'teacher'>('portal');
  const [teacherAuthenticated, setTeacherAuthenticated] = useState<boolean>(false);
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('overview');
  const [nafesSubView, setNafesSubView] = useState<'designer' | 'standards'>('designer');
  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);

  // Student Session
  const [loggedInStudent, setLoggedInStudent] = useState<{
    studentId: string;
    studentName: string;
    grade: GradeLevel;
    sectionName: string;
    sectionId: string;
  } | null>(null);

  // Modals
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [activeSubmissionForReview, setActiveSubmissionForReview] = useState<Submission | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

  // Handle View Change
  const handleViewChange = (view: 'portal' | 'student' | 'teacher') => {
    if (view === 'teacher' && !teacherAuthenticated) {
      setIsTeacherLoginOpen(true);
    } else {
      setCurrentView(view);
    }
  };

  // Student Login
  const handleStudentLoginSuccess = (studentData: {
    studentId: string;
    studentName: string;
    grade: GradeLevel;
    sectionName: string;
    sectionId: string;
  }) => {
    setLoggedInStudent(studentData);
    storageService.getStudentGamification(studentData.studentId);
    setAllGamification(storageService.getAllGamification());
  };

  // Student Finished Test
  const handleTestFinish = (newSubmission: Submission) => {
    const saved = storageService.addSubmission(newSubmission);
    setSubmissions(storageService.getSubmissions());
    setActiveTest(null);
    setActiveSubmissionForReview(saved);

    // Award Gamification Points
    if (loggedInStudent) {
      const pointsGained =
        newSubmission.score * settings.pointsPerCorrectAnswer +
        (newSubmission.passed ? settings.pointsPerQuizCompletion : 20);

      const targetTest = tests.find((t) => t.id === newSubmission.testId);

      storageService.awardStudentActivity(loggedInStudent.studentId, pointsGained, {
        isQuizPass: newSubmission.passed,
        quizPercentage: newSubmission.percentage,
        domain: targetTest?.domain,
      });

      setAllGamification(storageService.getAllGamification());
    }
  };

  // Section operations
  const handleAddSection = (grade: GradeLevel, name: string) => {
    storageService.addSection(grade, name);
    setSections(storageService.getSections());
  };

  const handleUpdateSection = (sectionId: string, newName: string) => {
    storageService.updateSectionName(sectionId, newName);
    setSections(storageService.getSections());
  };

  const handleDeleteSection = (sectionId: string) => {
    storageService.deleteSection(sectionId);
    setSections(storageService.getSections());
    setStudents(storageService.getStudents());
  };

  // Student operations
  const handleAddStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    storageService.addStudent(studentData);
    setStudents(storageService.getStudents());
  };

  const handleDeleteStudent = (studentId: string) => {
    storageService.deleteStudent(studentId);
    setStudents(storageService.getStudents());
  };

  const handlePurgeMockStudents = (grade?: GradeLevel) => {
    const res = storageService.purgeMockStudents(grade);
    setStudents(storageService.getStudents());
    return res.purgedCount;
  };

  // Test operations
  const handleAddTest = (testData: Omit<Test, 'id' | 'createdAt'>) => {
    storageService.addTest(testData);
    setTests(storageService.getTests());
  };

  const handleUpdateTest = (updatedTest: Test) => {
    storageService.updateTest(updatedTest);
    setTests(storageService.getTests());
  };

  const handleDeleteTest = (testId: string) => {
    storageService.deleteTest(testId);
    setTests(storageService.getTests());
  };

  // Settings operations
  const handleSaveSettings = (newSettings: PlatformSettings) => {
    storageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleResetData = () => {
    storageService.resetAllData();
    setSettings(storageService.getSettings());
    setSections(storageService.getSections());
    setStudents(storageService.getStudents());
    setTests(storageService.getTests());
    setSubmissions(storageService.getSubmissions());
    setBadges(storageService.getBadges());
    setAllGamification(storageService.getAllGamification());
    setLoggedInStudent(null);
    setCurrentView('portal');
  };

  return (
    <div className="min-h-screen bg-[#071322] text-slate-100 flex flex-col font-['Cairo',sans-serif] relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Educational Science Background with Ambient Glowing Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-20">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="absolute top-[14%] left-[8%] text-4xl text-cyan-400 font-bold font-mono">⚛️</span>
        <span className="absolute top-[28%] right-[10%] text-5xl text-emerald-400 font-bold font-mono">🧬</span>
        <span className="absolute top-[55%] left-[5%] text-4xl text-amber-400 font-bold font-mono">🧪</span>
        <span className="absolute top-[70%] right-[7%] text-5xl text-blue-400 font-bold font-mono">🔬</span>
        <span className="absolute bottom-[10%] left-[18%] text-3xl text-purple-400 font-bold font-mono">🪐</span>
        <span className="absolute top-[12%] right-[22%] text-2xl text-slate-400 font-bold font-mono">Δ</span>
        <span className="absolute top-[40%] left-[16%] text-3xl text-slate-400 font-bold font-mono">∑</span>
        <span className="absolute bottom-[25%] right-[20%] text-2xl text-emerald-400 font-mono">H₂O</span>
        <span className="absolute top-[65%] left-[25%] text-2xl text-cyan-400 font-mono">CO₂</span>
      </div>

      {/* Header is shown on student view or teacher view */}
      {currentView === 'teacher' ? (
        <>
          <TeacherHeader
            settings={settings}
            onLogout={() => {
              setTeacherAuthenticated(false);
              setCurrentView('portal');
            }}
            onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
            onOpenSettings={() => setTeacherTab('settings')}
            onExportExcel={() => {
              // CSV Export of student results
              const headers = 'اسم الطالب,الصف,الشعبة,الاختبارات,المعدل,النقاط\n';
              const rows = students
                .map((s) => {
                  const sec = sections.find((sec) => sec.id === s.sectionId);
                  const g = allGamification[s.id];
                  const subs = submissions.filter((sub) => sub.studentId === s.id);
                  const avg = subs.length > 0 ? Math.round(subs.reduce((a, b) => a + b.percentage, 0) / subs.length) : 0;
                  return `"${s.name}","الصف ${s.grade}","${sec?.name || ''}",${subs.length},${avg}%,${g?.points || 0}`;
                })
                .join('\n');
              const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', `etqan-science-report-${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              link.remove();
            }}
            onReturnToPortal={() => setCurrentView('portal')}
          />
          <TeacherNavBar
            activeTab={teacherTab}
            onTabChange={(tab) => setTeacherTab(tab)}
            studentsCount={students.length || 107}
          />
        </>
      ) : (
        currentView === 'student' && (
          <Header
            currentView={currentView}
            onViewChange={handleViewChange}
            isTeacherAuthenticated={teacherAuthenticated}
            onTeacherLogout={() => {
              setTeacherAuthenticated(false);
              setCurrentView('portal');
            }}
            settings={settings}
          />
        )
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 relative z-10">
        {currentView === 'portal' && (
          <LandingPortal
            settings={settings}
            onEnterStudent={() => {
              setCurrentView('student');
            }}
            onEnterTeacher={() => {
              if (teacherAuthenticated) {
                setCurrentView('teacher');
              } else {
                setIsTeacherLoginOpen(true);
              }
            }}
          />
        )}

        {currentView === 'student' && (
          <div className="py-4">
            {/* Quick return button to portal */}
            <div className="max-w-6xl mx-auto px-4 mb-2">
              <button
                onClick={() => setCurrentView('portal')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للواجهة الرئيسية</span>
              </button>
            </div>

            {!loggedInStudent ? (
              <StudentLogin
                sections={sections}
                students={students}
                settings={settings}
                onLoginSuccess={handleStudentLoginSuccess}
              />
            ) : (
              <StudentDashboard
                student={loggedInStudent}
                tests={tests}
                submissions={submissions}
                gamification={storageService.getStudentGamification(loggedInStudent.studentId)}
                settings={settings}
                onStartTest={(test) => {
                  setActiveTest(test);
                }}
                onViewSubmission={(sub) => setActiveSubmissionForReview(sub)}
                onOpenLeaderboard={() => {
                  setIsLeaderboardOpen(true);
                }}
                onLogout={() => setLoggedInStudent(null)}
              />
            )}
          </div>
        )}

        {currentView === 'teacher' && (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Active Teacher Sub-View */}
            {teacherTab === 'overview' && (
              <TeacherOverview
                students={students}
                sections={sections}
                tests={tests}
                submissions={submissions}
                settings={settings}
                onNavigateTab={(tab) => setTeacherTab(tab)}
                onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
                onAddTest={handleAddTest}
                onUpdateTest={handleUpdateTest}
              />
            )}

            {/* قسم التدخل والعلاج الموجه */}
            {teacherTab === 'remedial' && (
              <RemedialInterventionManager
                students={students}
                sections={sections}
                submissions={submissions}
                tests={tests}
                settings={settings}
                onAddTest={handleAddTest}
                onUpdateTest={handleUpdateTest}
                isEmbedded={false}
              />
            )}

            {/* قسم المنهج ومهاراته ونواتج التعلم */}
            {teacherTab === 'curriculum' && (
              <CurriculumSkillsManager settings={settings} defaultMode="curriculum" />
            )}

            {/* قسم قياس مهارات واختبارات نافس الوطنية */}
            {teacherTab === 'nafes' && (
              <div className="space-y-6">
                {/* Nafes Mode Switcher: 1) تصميم اختبار نافس سادس بالمعايير الرسمية (القوائم المنسدلة)، 2) دليل معايير نافس */}
                <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-blue-100 text-blue-800 rounded-xl font-bold">🎯</span>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">بوابة اختبارات ومعايير نافس الوطنية</h3>
                      <p className="text-[11px] text-slate-500">
                        تصميم وتخصيص اختبارات نافس وفق وثيقة هيئة تقويم التعليم والتدريب (ETEC)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNafesSubView('designer')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                        nafesSubView === 'designer'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>تصميم اختبار نافس سادس (قوائم منسدلة)</span>
                    </button>
                    <button
                      onClick={() => setNafesSubView('standards')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        nafesSubView === 'standards'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>دليل معايير نافس الشامل (4، 5، 6)</span>
                    </button>
                  </div>
                </div>

                {nafesSubView === 'designer' ? (
                  <NafesGrade6TestDesigner
                    settings={settings}
                    sections={sections}
                    onAddTest={handleAddTest}
                    existingTests={tests}
                  />
                ) : (
                  <CurriculumSkillsManager settings={settings} defaultMode="nafes" />
                )}
              </div>
            )}

            {/* إتقان مهارات المنهج وبنك الأسئلة */}
            {teacherTab === 'skills' && (
              <TestManager
                tests={tests}
                settings={settings}
                onAddTest={handleAddTest}
                onUpdateTest={handleUpdateTest}
                onDeleteTest={handleDeleteTest}
                onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
              />
            )}

            {/* التقارير وتحليل النتائج ورصد نواتج التعلم */}
            {teacherTab === 'reports' && (
              <ReportsAnalytics
                students={students}
                sections={sections}
                submissions={submissions}
                tests={tests}
                badges={badges}
                allGamification={allGamification}
                settings={settings}
              />
            )}

            {teacherTab === 'sections' && (
              <SectionsManager
                sections={sections}
                students={students}
                submissions={submissions}
                settings={settings}
                onAddSection={handleAddSection}
                onUpdateSection={handleUpdateSection}
                onDeleteSection={handleDeleteSection}
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                onPurgeMockStudents={handlePurgeMockStudents}
              />
            )}

            {teacherTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onResetData={handleResetData}
              />
            )}
          </div>
        )}
      </main>

      {/* Interactive Modals */}
      {/* 1. Test Taking Modal */}
      {activeTest && loggedInStudent && (
        <TestTakingModal
          test={activeTest}
          student={loggedInStudent}
          settings={settings}
          onClose={() => setActiveTest(null)}
          onFinish={handleTestFinish}
        />
      )}

      {/* 2. Test Result / Certificate View */}
      {activeSubmissionForReview && (
        <TestResultView
          submission={activeSubmissionForReview}
          test={tests.find((t) => t.id === activeSubmissionForReview.testId)}
          settings={settings}
          onBack={() => setActiveSubmissionForReview(null)}
        />
      )}

      {/* 4. Leaderboard & Badges Modal */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] overflow-y-auto my-auto animate-in zoom-in-95">
            <LeaderboardView
              currentStudentId={loggedInStudent?.studentId}
              students={students}
              sections={sections}
              badges={badges}
              allGamification={allGamification}
              submissions={submissions}
              onClose={() => setIsLeaderboardOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 5. Secure Teacher Login Modal (Password is completely concealed) */}
      <TeacherLoginModal
        isOpen={isTeacherLoginOpen}
        onClose={() => setIsTeacherLoginOpen(false)}
        onSuccess={() => {
          setIsTeacherLoginOpen(false);
          setTeacherAuthenticated(true);
          setCurrentView('teacher');
        }}
        settings={settings}
      />

      {/* 6. Smart Science Question Generator Modal */}
      <ScienceQuestionGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onAddGeneratedQuestions={(newQuestions) => {
          if (tests.length > 0) {
            const updatedFirstTest = {
              ...tests[0],
              questions: [...tests[0].questions, ...newQuestions],
            };
            handleUpdateTest(updatedFirstTest);
          }
        }}
      />
    </div>
  );
}
