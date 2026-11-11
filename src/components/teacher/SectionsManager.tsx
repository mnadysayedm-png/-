import React, { useState } from 'react';
import { GradeLevel, Section, Student, Submission, PlatformSettings } from '../../types';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  UserPlus,
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Printer,
  Upload,
  UserCheck,
} from 'lucide-react';
import { exportStudentsRosterToExcel, exportStudentsRosterToWord } from '../../utils/exportUtils';
import { StudentImportModal } from './StudentImportModal';
import { ClearableInput, ClearableTextarea } from '../common/ClearableInput';
import { ConfirmModal } from '../common/ConfirmModal';

interface SectionsManagerProps {
  sections: Section[];
  students: Student[];
  submissions: Submission[];
  settings?: PlatformSettings;
  onAddSection: (grade: GradeLevel, name: string) => void;
  onUpdateSection: (sectionId: string, newName: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  onDeleteStudent: (studentId: string) => void;
  onPurgeMockStudents?: (grade?: GradeLevel) => number;
}

export const SectionsManager: React.FC<SectionsManagerProps> = ({
  sections,
  students,
  submissions,
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
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onAddStudent,
  onDeleteStudent,
  onPurgeMockStudents,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('4');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState('');

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // In-app Confirm Modal State (never blocked by iframes)
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonColor?: 'rose' | 'amber' | 'emerald';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleRequestDeleteStudent = (student: Student) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `حذف الطالب (${student.name})`,
      message: `هل أنت متأكد من رغبتك في حذف الطالب "${student.name}" نهائياً من الشعبة والنظام؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'نعم، حذف الطالب نهائياً',
      confirmButtonColor: 'rose',
      onConfirm: () => {
        onDeleteStudent(student.id);
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        showToast(`تم حذف الطالب (${student.name}) بنجاح ✓`);
      },
    });
  };

  const handleRequestDeleteSection = (sec: Section, count: number) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `حذف الشعبة (${sec.label || sec.name})`,
      message: count > 0 
        ? `الشعبة تحتوي على (${count} طالب). هل أنت متأكد من حذف الشعبة؟ سيتم نقل وتوزيع الطلاب على شعبة أخرى في نفس الصف لضمان عدم ضياع بياناتهم.`
        : `هل أنت متأكد من حذف الشعبة (${sec.name}) نهائياً؟`,
      confirmText: 'نعم، حذف الشعبة',
      confirmButtonColor: 'rose',
      onConfirm: () => {
        onDeleteSection(sec.id);
        if (selectedSectionId === sec.id) {
          setSelectedSectionId('all');
        }
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        showToast(`تم حذف الشعبة (${sec.name}) بنجاح ✓`);
      },
    });
  };

  const handleRequestPurgeMock = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'حذف وتطهير الأسماء الوهمية والتجريبية',
      message: 'هل تريد حذف وتطهير جميع الأسماء التجريبية والوهمية من النظام نهائياً؟ سيتم الإبقاء على الأسماء الحقيقية والمستهدفة فقط.',
      confirmText: 'نعم، تطهير وحذف الأسماء الوهمية الآن',
      confirmButtonColor: 'rose',
      onConfirm: () => {
        if (onPurgeMockStudents) {
          const count = onPurgeMockStudents(selectedGrade);
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
          showToast(`تم بنجاح حذف وتطهير ${count} اسماً وهمياً من النظام ✓`);
        }
      },
    });
  };

  // Add section state
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionLetter, setNewSectionLetter] = useState('');

  // Edit section state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');

  // Add student state
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [targetSectionForStudent, setTargetSectionForStudent] = useState('');

  // Bulk add modal
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkNamesText, setBulkNamesText] = useState('');

  // File import modal (Word, Excel, PDF)
  const [showImportModal, setShowImportModal] = useState(false);

  const gradeNameMap: Record<GradeLevel, string> = {
    '4': 'الصف الرابع الابتدائي',
    '5': 'الصف الخامس الابتدائي',
    '6': 'الصف السادس الابتدائي',
  };

  const gradeSections = sections.filter((s) => s.grade === selectedGrade);

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (s.grade !== selectedGrade) return false;
    if (selectedSectionId !== 'all' && s.sectionId !== selectedSectionId) return false;
    if (studentSearch.trim() && !s.name.includes(studentSearch.trim())) return false;
    return true;
  });

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionLetter.trim()) return;
    onAddSection(selectedGrade, newSectionLetter.trim());
    setNewSectionLetter('');
    setIsAddingSection(false);
  };

  const handleSaveEditSection = (sectionId: string) => {
    if (!editSectionName.trim()) return;
    onUpdateSection(sectionId, editSectionName.trim());
    setEditingSectionId(null);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const sectionId = targetSectionForStudent || (gradeSections[0] ? gradeSections[0].id : '');
    if (!sectionId) {
      alert('يرجى إنشاء شعبة أولاً في هذا الصف!');
      return;
    }

    onAddStudent({
      name: newStudentName.trim(),
      grade: selectedGrade,
      sectionId,
    });

    setNewStudentName('');
    setIsAddingStudent(false);
  };

  const handleBulkAddStudents = () => {
    const lines = bulkNamesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    if (lines.length === 0) return;
    const sectionId = targetSectionForStudent || (gradeSections[0] ? gradeSections[0].id : '');
    if (!sectionId) {
      alert('يرجى تحديد أو إنشاء شعبة أولاً!');
      return;
    }

    lines.forEach((name) => {
      onAddStudent({
        name,
        grade: selectedGrade,
        sectionId,
      });
    });

    setBulkNamesText('');
    setShowBulkAdd(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-black animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-amber-300" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              إدارة الفصول والشعب والطلاب
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            التحكم الكامل في عدد وتسمية الشعب الدراسية لكل صف (الرابع، الخامس، السادس) وإدارة قوائم الطلاب ونسب إنجازهم.
          </p>
        </div>

        {/* Grade Selector Switch */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
          {(['4', '5', '6'] as GradeLevel[]).map((grade) => (
            <button
              key={grade}
              onClick={() => {
                setSelectedGrade(grade);
                setSelectedSectionId('all');
              }}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                selectedGrade === grade
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الصف {grade === '4' ? 'الرابع' : grade === '5' ? 'الخامس' : 'السادس'}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Sections Controller (التحكم في الشعب) */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>التحكم في شعب {gradeNameMap[selectedGrade]}</span>
            </h3>
            <p className="text-xs text-slate-500">
              تصنيف دقيق للشعب (1 - 2 - 3 - 4) مع إمكانية إضافة أو تعديل الشعب حسب الحاجة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingSection ? (
              <button
                type="button"
                onClick={() => {
                  setIsAddingSection(true);
                  // Suggest next number: 1, 2, 3, 4, 5
                  const standardNumbers = ['1', '2', '3', '4', '5', '6'];
                  const used = gradeSections.map((s) => s.name);
                  const nextNum = standardNumbers.find((n) => !used.includes(n)) || '1';
                  setNewSectionLetter(nextNum);
                }}
                className="py-2 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs transition border border-emerald-200 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة شعبة جديدة</span>
              </button>
            ) : (
              <form onSubmit={handleCreateSection} className="flex items-center gap-2 animate-in fade-in">
                <ClearableInput
                  type="text"
                  value={newSectionLetter}
                  onChange={(e) => setNewSectionLetter(e.target.value)}
                  onClear={() => setNewSectionLetter('')}
                  placeholder="رقم الشعبة (1-4)"
                  className="w-32 text-xs font-bold text-center"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  className="p-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                  title="حفظ الشعبة"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSection(false)}
                  className="p-1.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition"
                  title="إلغاء"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sections Pills List */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSelectedSectionId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              selectedSectionId === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>جميع الشعب ({gradeSections.length})</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
              {students.filter((s) => s.grade === selectedGrade).length} طالب
            </span>
          </button>

          {gradeSections.map((sec) => {
            const secStudents = students.filter((s) => s.sectionId === sec.id);
            const isEditing = editingSectionId === sec.id;

            return (
              <div
                key={sec.id}
                className={`relative group rounded-xl border p-1 pl-2 transition flex items-center gap-2 ${
                  selectedSectionId === sec.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <ClearableInput
                      type="text"
                      value={editSectionName}
                      onChange={(e) => setEditSectionName(e.target.value)}
                      onClear={() => setEditSectionName('')}
                      className="w-24 text-xs font-bold"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEditSection(sec.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedSectionId(sec.id)}
                      className="text-xs font-bold px-2 py-1 flex items-center gap-1.5"
                    >
                      <span>الشعبة ({sec.name})</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        {secStudents.length}
                      </span>
                    </button>

                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          setEditingSectionId(sec.id);
                          setEditSectionName(sec.name);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded"
                        title="تعديل اسم الشعبة"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRequestDeleteSection(sec, secStudents.length)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="حذف الشعبة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Students Roster & Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <span>قوائم الطلاب ({filteredStudents.length} طالب)</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold">
              {selectedSectionId === 'all'
                ? 'جميع الشعب'
                : `الشعبة: ${sections.find((s) => s.id === selectedSectionId)?.name || ''}`}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setShowImportModal(true)}
              className="py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-blue-600/20"
              title="إرفاق كشف الطلاب بصيغة Word أو Excel أو PDF وتصنيفهم حسب الشعب 1-2-3-4"
            >
              <Upload className="w-4 h-4" />
              <span>إرفاق كشف وتصنيف الشعب (Word / Excel / PDF)</span>
            </button>

            <button
              onClick={() => {
                setIsAddingStudent(true);
                setTargetSectionForStudent(
                  selectedSectionId !== 'all' ? selectedSectionId : (gradeSections[0]?.id || '')
                );
              }}
              className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
              title="إضافة طالب يدوياً"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة طالب يدوياً</span>
            </button>

            <button
              onClick={() => {
                setShowBulkAdd(true);
                setTargetSectionForStudent(
                  selectedSectionId !== 'all' ? selectedSectionId : (gradeSections[0]?.id || '')
                );
              }}
              className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border border-slate-200"
              title="إضافة يدوية جماعية بالنسخ واللصق"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>إضافة يدوية جماعية</span>
            </button>

            {onPurgeMockStudents && (
              <button
                onClick={handleRequestPurgeMock}
                className="py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border border-rose-200"
                title="حذف وتطهير جميع الأسماء الوهمية والتجريبية المرفقة مسبقاً"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>حذف الأسماء الوهمية المرفقة</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Method Cards Info Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div className="p-3 bg-white rounded-xl border border-blue-200 flex items-start gap-3">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0">
              <Upload className="w-4 h-4" />
            </span>
            <div>
              <strong className="text-slate-900 block font-black">
                1. الإرفاق الآلي لكشف الطلاب (Word / Excel / PDF):
              </strong>
              <span className="text-slate-500 text-[11px] leading-relaxed block mt-0.5">
                ارفع ملف كشف الطلاب بأي صيغة ليقوم النظام تلقائياً باستخراج الأسماء وتصنيفهم وتوزيعهم على الشعب (1، 2، 3، 4).
              </span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-start gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
              <UserPlus className="w-4 h-4" />
            </span>
            <div>
              <strong className="text-slate-900 block font-black">
                2. الإضافة اليدوية (فردية أو جماعية):
              </strong>
              <span className="text-slate-500 text-[11px] leading-relaxed block mt-0.5">
                يمكنك أيضاً إدخال اسم الطالب وشعبته يدوياً واحداً تلو الآخر، أو نسخ ولصق قائمة أسماء دفعة واحدة.
              </span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="w-full">
          <ClearableInput
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            onClear={() => setStudentSearch('')}
            placeholder="بحث عن طالب بالاسم..."
            className="w-full text-xs sm:text-sm font-medium"
          />
        </div>

        {/* Students Table */}
        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs sm:text-sm bg-slate-50 rounded-2xl">
            لا يوجد طلاب مطابقين للبحث أو لم يتم تسجيل طلاب في هذه الشعبة بعد.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">اسم الطالب</th>
                  <th className="py-3 px-4">الصف والشعبة</th>
                  <th className="py-3 px-4">الاختبارات المنجزة</th>
                  <th className="py-3 px-4">متوسط النسبة</th>
                  <th className="py-3 px-4">مستوى الإتقان</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((std, idx) => {
                  const studentSubs = submissions.filter(
                    (s) => s.studentId === std.id || s.studentName === std.name
                  );
                  const subCount = studentSubs.length;
                  const avg =
                    subCount > 0
                      ? Math.round(
                          studentSubs.reduce((a, b) => a + b.percentage, 0) / subCount
                        )
                      : null;

                  const sec = sections.find((s) => s.id === std.sectionId);

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {std.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-xs">
                          {sec ? sec.label : `شعبة ${std.sectionId}`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600 font-bold">{subCount} اختبار</span>
                      </td>
                      <td className="py-3 px-4">
                        {avg !== null ? (
                          <span
                            className={`font-black font-mono ${
                              avg >= 80
                                ? 'text-emerald-700'
                                : avg >= 60
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {avg}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">لم يختبر</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {avg !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              avg >= 85
                                ? 'bg-emerald-100 text-emerald-800'
                                : avg >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {avg >= 85 ? 'متقن فائق' : avg >= 60 ? 'متمكن' : 'يحتاج تعزيز'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRequestDeleteStudent(std)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="حذف الطالب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Single Student Add */}
      {isAddingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-800">إضافة طالب جديد</h3>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطالب ثلاثياً</label>
                <ClearableInput
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  onClear={() => setNewStudentName('')}
                  placeholder="مثال: يوسف خالد المنصور"
                  className="w-full text-sm font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الشعبة الدراسية</label>
                <select
                  value={targetSectionForStudent}
                  onChange={(e) => setTargetSectionForStudent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white"
                >
                  {gradeSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.label} (الشعبة {sec.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
                >
                  إضافة الطالب
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="py-2.5 px-4 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Students Add */}
      {showBulkAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-800">
              إضافة قائمة طلاب مجمعة (نسخ ولصق)
            </h3>
            <p className="text-xs text-slate-500">
              قم بلصق أسماء الطلاب في الصندوق أدناه، اسم واحد في كل سطر:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الشعبة المستهدفة لإضافة هؤلاء الطلاب:
              </label>
              <select
                value={targetSectionForStudent}
                onChange={(e) => setTargetSectionForStudent(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white mb-3"
              >
                {gradeSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label} (الشعبة {sec.name})
                  </option>
                ))}
              </select>
            </div>

            <ClearableTextarea
              rows={8}
              value={bulkNamesText}
              onChange={(e) => setBulkNamesText(e.target.value)}
              onClear={() => setBulkNamesText('')}
              placeholder="عبدالله محمد الدوسري&#10;فيصل سعود العتيبي&#10;ريان فهد القحطاني..."
              className="w-full text-xs sm:text-sm font-medium leading-relaxed"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleBulkAddStudents}
                disabled={!bulkNamesText.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
              >
                استيراد وإضافة الأسماء
              </button>
              <button
                type="button"
                onClick={() => setShowBulkAdd(false)}
                className="py-2.5 px-4 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Word / Excel / PDF / Text Roster Import with 1-2-3-4 Section Classification */}
      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        sections={sections}
        selectedGrade={selectedGrade}
        onImportStudents={(importedStudents) => {
          importedStudents.forEach((std) => {
            onAddStudent(std);
          });
        }}
      />

      {/* Reusable In-App Confirmation Modal (replacing blocked window.confirm) */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        confirmButtonColor={confirmModalConfig.confirmButtonColor || 'rose'}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
