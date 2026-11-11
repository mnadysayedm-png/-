import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SchoolLogo } from '../SchoolLogo';
import { GradeLevel, Section, Student, PlatformSettings } from '../../types';
import {
  GraduationCap,
  KeyRound,
  Users,
  Search,
  BookOpen,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Atom,
  X,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';

interface StudentLoginProps {
  sections: Section[];
  students: Student[];
  settings: PlatformSettings;
  onLoginSuccess: (studentData: {
    studentId: string;
    studentName: string;
    grade: GradeLevel;
    sectionName: string;
    sectionId: string;
  }) => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  sections,
  students,
  settings,
  onLoginSuccess,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('4');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [customStudentName, setCustomStudentName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sections for the selected grade
  const gradeSections = sections.filter((s) => s.grade === selectedGrade);

  // Set default section when grade changes
  useEffect(() => {
    if (gradeSections.length > 0 && (!selectedSectionId || !gradeSections.some((s) => s.id === selectedSectionId))) {
      setSelectedSectionId(gradeSections[0].id);
    }
    setSelectedStudent(null);
    setStudentSearch('');
    setError('');
  }, [selectedGrade, sections]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Students in selected section
  const sectionStudents = students.filter(
    (s) => s.grade === selectedGrade && (!selectedSectionId || s.sectionId === selectedSectionId)
  );

  // Arabic normalizer for instant search matching from the very first letter
  const normalizeArabic = (text: string) => {
    return text
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
      .trim()
      .toLowerCase();
  };

  const normalizedQuery = normalizeArabic(studentSearch);

  // Suggested students list that drops down when user starts typing (1+ characters)
  const suggestedStudents = useMemo(() => {
    if (!normalizedQuery) {
      return sectionStudents;
    }
    // Search in current grade first
    const inGrade = students.filter(
      (s) => s.grade === selectedGrade && normalizeArabic(s.name).includes(normalizedQuery)
    );
    if (inGrade.length > 0) return inGrade;

    // If not found in current grade, search across all grades
    return students.filter((s) => normalizeArabic(s.name).includes(normalizedQuery));
  }, [students, selectedGrade, sectionStudents, normalizedQuery]);

  const activeSection = sections.find((s) => s.id === selectedSectionId);

  const handleGradeChange = (grade: GradeLevel) => {
    setSelectedGrade(grade);
  };

  const handleSelectStudent = (std: Student) => {
    setSelectedStudent(std);
    setStudentSearch(std.name);
    setCustomStudentName(std.name);
    // Auto-select student's grade if different
    if (std.grade && std.grade !== selectedGrade) {
      setSelectedGrade(std.grade);
    }
    // Auto-select student's section
    if (std.sectionId && std.sectionId !== selectedSectionId) {
      setSelectedSectionId(std.sectionId);
    }
    setIsDropdownOpen(false);
    setError('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check PIN
    if (pin.trim() !== settings.studentPin) {
      setError(`رمز الدخول السري (PIN) غير صحيح! الرمز الموحد للطلاب هو: ${settings.studentPin}`);
      return;
    }

    const finalStudentName = selectedStudent ? selectedStudent.name : customStudentName.trim();
    if (!finalStudentName) {
      setError('يرجى اختيار اسم الطالب من القائمة أو كتابة الاسم ثلاثي.');
      return;
    }

    const studentId = selectedStudent ? selectedStudent.id : `guest-${Date.now()}`;
    const sectionName = activeSection ? activeSection.label : `الصف ${selectedGrade}`;

    onLoginSuccess({
      studentId,
      studentName: finalStudentName,
      grade: selectedGrade,
      sectionName,
      sectionId: selectedSectionId,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Welcome Card */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>بوابة الاختبارات وقياس المهارات العلمية</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span>مدارس التربية النموذجية</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight mb-2">
          مرحباً بكم في <span className="text-emerald-700">منصة إتقان في العلوم</span>
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          اختر صفك الدراسي وشعبتك، وابدأ اختبارات المهارات التحصيلية ونافس بإشراف{' '}
          <strong className="text-emerald-800 font-bold">{settings.teacherTitle}</strong>
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-emerald-100/80 overflow-hidden">
        {/* Step 1: Grade Selection Header Tabs */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200">
          <div className="text-xs font-bold text-slate-600 mb-2.5 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>الخطوة 1: حدد الصف الدراسي المستهدف</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleGradeChange('4')}
              className={`p-3.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                selectedGrade === '4'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500 scale-[1.01]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="text-lg font-black">الصف الرابع</span>
              <span className={`text-[11px] font-medium ${selectedGrade === '4' ? 'text-emerald-100' : 'text-slate-500'}`}>
                الابتدائي (علوم 4)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleGradeChange('5')}
              className={`p-3.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                selectedGrade === '5'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500 scale-[1.01]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="text-lg font-black">الصف الخامس</span>
              <span className={`text-[11px] font-medium ${selectedGrade === '5' ? 'text-emerald-100' : 'text-slate-500'}`}>
                الابتدائي (علوم 5)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleGradeChange('6')}
              className={`p-3.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                selectedGrade === '6'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500 scale-[1.01]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="text-lg font-black">الصف السادس</span>
              <span className={`text-[11px] font-medium ${selectedGrade === '6' ? 'text-emerald-100' : 'text-slate-500'}`}>
                الابتدائي (علوم 6)
              </span>
            </button>
          </div>
        </div>

        {/* Login Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-in slide-in-from-top-1">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">تنبيه في الدخول:</span>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Step 2: Choose Section (الشعبة) */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>الخطوة 2: اختر الشعبة الدراسية</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                الشعب المتاحة: {gradeSections.length} شعب
              </span>
            </label>

            {gradeSections.length === 0 ? (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-xs">
                لا توجد شعب مسجلة لهذا الصف حتى الآن. يمكن للمعلم إضافة شعب من لوحة التحكم.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {gradeSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setSelectedSectionId(sec.id);
                      setSelectedStudent(null);
                    }}
                    className={`py-3 px-3 rounded-xl border text-sm font-bold transition flex items-center justify-between ${
                      selectedSectionId === sec.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>الشعبة ({sec.name})</span>
                    {selectedSectionId === sec.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Choose or search student name with auto-dropdown list */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Atom className="w-4 h-4 text-emerald-600" />
                <span>الخطوة 3: اختر اسم الطالب (تنسدل القائمة فور كتابة أول حرف)</span>
              </span>
              {selectedStudent ? (
                <span className="text-xs text-emerald-800 font-black bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تم اختيار: {selectedStudent.name}</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">
                  اكتب أول حرف من اسمك للاختيار السريع
                </span>
              )}
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-emerald-600" />
              </div>

              <input
                type="text"
                value={studentSearch}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setStudentSearch(val);
                  setCustomStudentName(val);
                  setIsDropdownOpen(true);
                  if (selectedStudent && val !== selectedStudent.name) {
                    setSelectedStudent(null);
                  }
                }}
                placeholder="اكتب أول حرف من اسمك لتنسدل قائمة أسماء الطلاب..."
                className="w-full pr-10 pl-24 py-3 rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-bold transition shadow-xs bg-white"
                autoComplete="off"
              />

              <div className="absolute inset-y-0 left-0 pl-2 flex items-center gap-1">
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentSearch('');
                      setCustomStudentName('');
                      setSelectedStudent(null);
                      setIsDropdownOpen(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    title="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                  title="فتح / إغلاق القائمة المنسدلة"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Smart Auto-Dropdown List attached directly beneath the input */}
            {isDropdownOpen && (
              <div className="absolute right-0 left-0 top-full mt-1.5 z-40 bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 max-h-64 overflow-y-auto space-y-1 p-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 bg-emerald-50/80 rounded-xl border border-emerald-100 text-[11px] font-black text-emerald-900 flex items-center justify-between">
                  <span>
                    {normalizedQuery.length >= 1
                      ? `نتائج البحث المطابقة لحرف "${studentSearch}" (${suggestedStudents.length}):`
                      : `طلاب الشعبة المسجلين (${suggestedStudents.length}):`}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    اضغط على اسمك للاختيار
                  </span>
                </div>

                {suggestedStudents.length > 0 ? (
                  suggestedStudents.map((std) => {
                    const stdSec = sections.find((s) => s.id === std.sectionId);
                    const isCurrentGrade = std.grade === selectedGrade;

                    return (
                      <button
                        key={std.id}
                        type="button"
                        onClick={() => handleSelectStudent(std)}
                        className="w-full text-right p-3 rounded-xl text-xs sm:text-sm bg-white hover:bg-emerald-50 border border-slate-100 hover:border-emerald-300 transition flex items-center justify-between group shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                            👨‍🎓
                          </span>
                          <div>
                            <span className="font-black text-slate-900 text-sm block group-hover:text-emerald-950">
                              {std.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                الصف {std.grade}
                              </span>
                              <span>•</span>
                              <span>{stdSec?.label || `الشعبة (${std.sectionId})`}</span>
                              {!isCurrentGrade && (
                                <span className="text-amber-700 font-bold text-[10px]">
                                  (سيتم التحويل لصفه تلقائياً)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 group-hover:bg-emerald-600 group-hover:text-white px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0">
                          <span>اختيار</span>
                          <span>⬅️</span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center space-y-2 text-xs">
                    <p className="text-slate-700 font-bold">
                      لم يتم العثور على طالب يبدأ بـ "{studentSearch}".
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      يمكنك الاستمرار بكتابة اسمك ثلاثياً والمتابعة برمز الدخول مباشرة.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Banner when student is selected */}
            {selectedStudent && (
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-300 flex items-center justify-between gap-3 text-xs text-emerald-950 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-black text-slate-900 text-xs sm:text-sm">
                      {selectedStudent.name}
                    </span>
                    <span className="text-slate-600 block text-[11px] font-medium">
                      تم تحديد الصف ({selectedGrade}) والشعبة بنجاح. أدخل رمز PIN بالأسفل للدخول.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentSearch('');
                    setIsDropdownOpen(true);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-rose-600 bg-white border border-slate-200 rounded-lg hover:border-rose-300 transition"
                >
                  تغيير الطالب
                </button>
              </div>
            )}
          </div>

          {/* Step 4: PIN code input */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>الخطوة 4: رمز الدخول السري للطلاب (PIN)</span>
              </label>
              <button
                type="button"
                onClick={() => setPin(settings.studentPin)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
              >
                تعبئة الرمز الموحد تلقائياً ({settings.studentPin})
              </button>
            </div>

            <div className="relative max-w-xs">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="أدخل الرمز (1234)"
                className="w-full text-center tracking-widest text-xl font-bold py-3 px-8 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono transition"
                required
              />
              {pin && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setPin('');
                    setError('');
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="مسح الرمز"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              * الرمز الموحد المعتمد لجميع طلاب مدرسة التربية النموذجية هو:{' '}
              <strong className="text-emerald-700 font-mono text-xs">{settings.studentPin}</strong>
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl font-black text-base sm:text-lg shadow-lg shadow-emerald-700/25 hover:shadow-emerald-700/35 transition duration-200 flex items-center justify-center gap-3 transform active:scale-[0.99]"
            >
              <span>دخول بوابة اختبارات العلوم</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Footer info box */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>الصفوف المشمولة: الرابع الابتدائي • الخامس الابتدائي • السادس الابتدائي</span>
          </div>
          <div>
            <span>إعداد المعلم المشرف: <strong>{settings.teacherName}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
