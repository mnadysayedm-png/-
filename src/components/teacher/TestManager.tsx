import React, { useState } from 'react';
import { GradeLevel, ScienceDomain, Test, Question, PlatformSettings } from '../../types';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Clock,
  Award,
  Atom,
  Eye,
  EyeOff,
  Filter,
  BrainCircuit,
  FlaskConical,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface TestManagerProps {
  tests: Test[];
  settings: PlatformSettings;
  onAddTest: (test: Omit<Test, 'id' | 'createdAt'>) => void;
  onUpdateTest: (test: Test) => void;
  onDeleteTest: (testId: string) => void;
  onOpenAIGenerator: () => void;
}

export const TestManager: React.FC<TestManagerProps> = ({
  tests,
  settings,
  onAddTest,
  onUpdateTest,
  onDeleteTest,
  onOpenAIGenerator,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [testToast, setTestToast] = useState<string | null>(null);

  // New test form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState<GradeLevel>('4');
  const [domain, setDomain] = useState<ScienceDomain | 'شامل - نافس'>('شامل - نافس');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passingScorePercentage, setPassingScorePercentage] = useState(60);
  const [isNafesBenchmark, setIsNafesBenchmark] = useState(true);

  // Questions inside new test
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: `q-${Date.now()}-1`,
      grade: '4',
      domain: 'علوم الحياة',
      skillName: 'تفسير تكيف الكائنات الحية',
      questionText: 'ما التكيف الذي يساعد الدب القطبي على العيش في البيئات المتجمدة؟',
      options: ['فرو سميك وطبقة دهنية عازلة', 'خياشيم للتنفس تحت الماء', 'منقار حاد طويل', 'ريش خفيف ملون'],
      correctAnswerIndex: 0,
      explanation: 'الفرو الأبيض والدهون العازلة تمنحه الدفء والتمويه في الثلوج.',
      difficulty: 'سهل',
      diagramEmoji: '🐻‍❄️',
    },
  ]);

  const filteredTests = tests.filter((t) => {
    if (selectedGrade !== 'all' && t.grade !== selectedGrade) return false;
    if (selectedDomain !== 'all' && t.domain !== selectedDomain) return false;
    return true;
  });

  const handleAddQuestionToNewTest = () => {
    const newQ: Question = {
      id: `q-${Date.now()}-${questions.length + 1}`,
      grade: grade,
      domain: domain === 'شامل - نافس' ? 'علوم الحياة' : domain,
      skillName: 'مهارة علمية جديدة',
      questionText: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      explanation: '',
      difficulty: 'متوسط',
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestionInForm = (index: number, updated: Partial<Question>) => {
    const copy = [...questions];
    copy[index] = { ...copy[index], ...updated };
    setQuestions(copy);
  };

  const handleRemoveQuestionFromForm = (index: number) => {
    if (questions.length <= 1) {
      alert('يجب أن يحتوي الاختبار على سؤال واحد على الأقل.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        alert(`يرجى كتابة نص السؤال رقم ${i + 1}`);
        return;
      }
      if (questions[i].options.some((opt) => !opt.trim())) {
        alert(`يرجى إكمال جميع خيارات السؤال رقم ${i + 1}`);
        return;
      }
    }

    onAddTest({
      title: title.trim(),
      description: description.trim(),
      grade,
      domain,
      durationMinutes,
      passingScorePercentage,
      isActive: true,
      isNafesBenchmark,
      questions,
    });

    setIsCreatingTest(false);
    // Reset form
    setTitle('');
    setDescription('');
  };

  const handleToggleActive = (test: Test) => {
    onUpdateTest({
      ...test,
      isActive: !test.isActive,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {testToast && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-black animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>{testToast}</span>
          </div>
          <button onClick={() => setTestToast(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <BookOpen className="w-5 h-5 text-amber-700" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              بنك أسئلة واختبارات العلوم (نافس والوحدات)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تصميم وتخصيص أسئلة مادة العلوم للصفوف الرابع والخامس والسادس وفق المعايير الوطنية.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={onOpenAIGenerator}
            className="flex-1 md:flex-initial py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-amber-600/20"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>توليد أسئلة ذكية (نافس)</span>
          </button>

          <button
            onClick={() => setIsCreatingTest(true)}
            className="flex-1 md:flex-initial py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء اختبار جديد</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            تصفية حسب الصف:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedGrade === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedGrade('4')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedGrade === '4'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الصف الرابع
            </button>
            <button
              onClick={() => setSelectedGrade('5')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedGrade === '5'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الصف الخامس
            </button>
            <button
              onClick={() => setSelectedGrade('6')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedGrade === '6'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الصف السادس
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">المجال العلمي:</span>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
          >
            <option value="all">جميع المجالات العلمية</option>
            <option value="شامل - نافس">شامل - نافس</option>
            <option value="علوم الحياة">علوم الحياة</option>
            <option value="العلوم الفيزيائية">العلوم الفيزيائية</option>
            <option value="علوم الأرض والفضاء">علوم الأرض والفضاء</option>
          </select>
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.map((test) => {
          const isExpanded = expandedTestId === test.id;
          return (
            <div
              key={test.id}
              className={`bg-white rounded-3xl border transition-all shadow-xs ${
                test.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      الصف {test.grade}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {test.domain}
                    </span>
                    {test.isNafesBenchmark && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        اختبار نافس
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        test.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {test.isActive ? 'متاح للطلاب' : 'معطل'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-800">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                    {test.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                      {test.questions.length} أسئلة
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {test.durationMinutes} دقيقة
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      نسبة الاجتياز {test.passingScorePercentage}%
                    </span>
                  </div>
                </div>

                {/* Test Action Controls */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleToggleActive(test)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                      test.isActive
                        ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                    title={test.isActive ? 'تعطيل ظهور الاختبار للطلاب' : 'تفعيل الاختبار للطلاب'}
                  >
                    {test.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>تعطيل</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>تفعيل</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    {isExpanded ? 'إخفاء الأسئلة' : 'عرض الأسئلة'}
                  </button>

                  <button
                    onClick={() => setTestToDelete(test)}
                    className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                    title="حذف الاختبار"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Questions List */}
              {isExpanded && (
                <div className="p-6 bg-slate-50/70 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                  <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                    <span>الأسئلة العلمية المضمنة في هذا الاختبار:</span>
                    <span>{test.questions.length} سؤال</span>
                  </div>

                  <div className="space-y-3">
                    {test.questions.map((q, qIdx) => (
                      <div
                        key={q.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            سؤال {qIdx + 1} • المهارة: {q.skillName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            المجال: {q.domain}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          {q.diagramEmoji && <span>{q.diagramEmoji}</span>}
                          <span>{q.questionText}</span>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === q.correctAnswerIndex;
                            return (
                              <div
                                key={optIdx}
                                className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                <span>{opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] text-emerald-700 font-bold">
                                    ✓ الإجابة الصحيحة
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl mt-1 border border-slate-100">
                            <strong>التعليل العلمي للمهارة:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Create Test */}
      {isCreatingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-300" />
                <span>تصميم وبناء اختبار علوم جديد</span>
              </h3>
              <button
                onClick={() => setIsCreatingTest(false)}
                className="text-white/70 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewTest} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Test meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان الاختبار
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: اختبار تشخيصي لوحدة الخلية والتكاثر"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الوصف والأهداف التعليمية
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="قياس مهارات الفهم والتطبيق العلمي لمفاهيم الخلية..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الصف الدراسي
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as GradeLevel)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-bold bg-white"
                  >
                    <option value="4">الصف الرابع الابتدائي</option>
                    <option value="5">الصف الخامس الابتدائي</option>
                    <option value="6">الصف السادس الابتدائي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المجال العلمي
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-bold bg-white"
                  >
                    <option value="شامل - نافس">شامل - معايير نافس</option>
                    <option value="علوم الحياة">علوم الحياة</option>
                    <option value="العلوم الفيزيائية">العلوم الفيزيائية</option>
                    <option value="علوم الأرض والفضاء">علوم الأرض والفضاء</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مدة الاختبار (بالدقائق)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-center"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isNafesBenchmark}
                      onChange={(e) => setIsNafesBenchmark(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>تصنيف كاختبار معياري وطني (نافس)</span>
                  </label>
                </div>
              </div>

              {/* Questions editor */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>أسئلة الاختبار ({questions.length})</span>
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddQuestionToNewTest}
                    className="py-1.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة سؤال جديد</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, qIndex) => (
                    <div
                      key={q.id || qIndex}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          سؤال رقم {qIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionFromForm(qIndex)}
                          className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف هذا السؤال</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={q.skillName}
                          onChange={(e) =>
                            handleUpdateQuestionInForm(qIndex, { skillName: e.target.value })
                          }
                          placeholder="اسم المهارة المعيارية (مثال: فهم البناء الضوئي)"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
                          required
                        />

                        <select
                          value={q.difficulty}
                          onChange={(e) =>
                            handleUpdateQuestionInForm(qIndex, { difficulty: e.target.value as any })
                          }
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                        >
                          <option value="سهل">مستوى: سهل</option>
                          <option value="متوسط">مستوى: متوسط</option>
                          <option value="متقدم">مستوى: متقدم</option>
                        </select>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) =>
                            handleUpdateQuestionInForm(qIndex, { questionText: e.target.value })
                          }
                          placeholder="نص السؤال العلمي..."
                          className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 bg-white"
                          required
                        />
                      </div>

                      {/* 4 Choices */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          خيارات الإجابة (اختر الدائرة بجانب الإجابة الصحيحة):
                        </span>
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correctAnswerIndex === optIndex}
                              onChange={() =>
                                handleUpdateQuestionInForm(qIndex, { correctAnswerIndex: optIndex })
                              }
                              className="w-4 h-4 text-emerald-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...q.options];
                                newOpts[optIndex] = e.target.value;
                                handleUpdateQuestionInForm(qIndex, { options: newOpts });
                              }}
                              placeholder={`الخيار ${optIndex + 1}`}
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border bg-white ${
                                q.correctAnswerIndex === optIndex
                                  ? 'border-emerald-500 font-bold bg-emerald-50/40'
                                  : 'border-slate-300'
                              }`}
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) =>
                            handleUpdateQuestionInForm(qIndex, { explanation: e.target.value })
                          }
                          placeholder="التعليل العلمي والشرح عند مراجعة الطالب..."
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md"
                >
                  حفظ وتفعيل الاختبار الآن
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingTest(false)}
                  className="py-3 px-5 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Test Deletion Modal */}
      <ConfirmModal
        isOpen={Boolean(testToDelete)}
        title={`حذف الاختبار (${testToDelete?.title || ''})`}
        message={`هل أنت متأكد من رغبتك في حذف اختبار "${testToDelete?.title || ''}" نهائياً؟ سيتم حذف جميع أسئلته وإزالته من لوحة تحكم الطلاب.`}
        confirmText="نعم، حذف الاختبار نهائياً"
        onConfirm={() => {
          if (testToDelete) {
            onDeleteTest(testToDelete.id);
            setTestToast(`تم حذف اختبار "${testToDelete.title}" بنجاح ✓`);
            setTestToDelete(null);
          }
        }}
        onCancel={() => setTestToDelete(null)}
      />
    </div>
  );
};
