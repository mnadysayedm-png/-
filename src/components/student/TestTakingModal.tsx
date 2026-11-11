import React, { useState, useEffect } from 'react';
import { Test, Submission, StudentAnswer, GradeLevel, PlatformSettings } from '../../types';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  FlaskConical,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TestTakingModalProps {
  test: Test;
  student: {
    studentId: string;
    studentName: string;
    grade: GradeLevel;
    sectionName: string;
  };
  settings: PlatformSettings;
  onClose: () => void;
  onFinish: (submission: Submission) => void;
}

export const TestTakingModal: React.FC<TestTakingModalProps> = ({
  test,
  student,
  settings,
  onClose,
  onFinish,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(test.durationMinutes * 60);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [startTime] = useState(Date.now());

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test.id]);

  const currentQuestion = test.questions[currentIndex];
  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectOption = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmitTest = () => {
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
    let correctCount = 0;

    const studentAnswers: StudentAnswer[] = test.questions.map((q) => {
      const selectedIndex = answers[q.id] !== undefined ? answers[q.id] : -1;
      const isCorrect = selectedIndex === q.correctAnswerIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedOptionIndex: selectedIndex,
        isCorrect,
      };
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = percentage >= test.passingScorePercentage;

    const submission: Submission = {
      id: `sub-${Date.now().toString(36)}`,
      testId: test.id,
      testTitle: test.title,
      grade: test.grade,
      studentId: student.studentId,
      studentName: student.studentName,
      sectionName: student.sectionName,
      answers: studentAnswers,
      score: correctCount,
      totalQuestions,
      percentage,
      passed,
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      timeSpentSeconds,
    };

    // Confetti celebration if passed or high score
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b', '#38bdf8'],
        });
      } catch (e) {
        // Safe fallback
      }
    }

    onFinish(submission);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        {/* Test Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl text-amber-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-700/60 text-emerald-200 border border-emerald-500/30">
                  {test.domain}
                </span>
                <span className="text-[11px] text-emerald-200 font-medium">
                  {student.studentName} ({student.sectionName})
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black truncate max-w-md sm:max-w-lg mt-0.5">
                {test.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold ${
                timeLeftSeconds < 180
                  ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400 animate-pulse'
                  : 'bg-white/15 text-emerald-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            <button
              onClick={() => {
                if (window.confirm('هل تريد الخروج من الاختبار دون حفظ الإجابات؟')) {
                  onClose();
                }
              }}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
              title="إغلاق الاختبار"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Question Jump bar */}
        <div className="bg-slate-50 p-3 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-700">
              السؤال {currentIndex + 1} من {totalQuestions}
            </span>
            <div className="w-32 sm:w-48 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">
              (أُجيب {answeredCount} من {totalQuestions})
            </span>
          </div>

          {/* Quick jump circles */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {test.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Skill Name Pill */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>المهارة المستهدفة: {currentQuestion.skillName}</span>
            </span>
            {currentQuestion.difficulty && (
              <span className="text-[11px] font-semibold text-slate-400">
                مستوى الصعوبة: {currentQuestion.difficulty}
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {currentQuestion.diagramEmoji && (
                <span className="text-3xl p-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                  {currentQuestion.diagramEmoji}
                </span>
              )}
              <h2 className="text-lg sm:text-xl font-black text-slate-800 leading-relaxed">
                {currentQuestion.questionText}
              </h2>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === idx;
              const optionLetters = ['أ', 'ب', 'ج', 'د'];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-2xl border-2 text-right font-semibold text-sm sm:text-base transition-all duration-150 flex items-center justify-between group ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {optionLetters[idx] || idx + 1}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mr-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 p-4 sm:px-6 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-white disabled:opacity-40 transition flex items-center gap-1.5"
          >
            <ArrowRight className="w-4 h-4" />
            <span>السؤال السابق</span>
          </button>

          <div className="flex items-center gap-2">
            {currentIndex === totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-md shadow-emerald-700/20 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إنهاء الاختبار وتسليم الإجابات</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-1.5"
              >
                <span>السؤال التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">
                تأكيد تسليم الاختبار
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                لقد قمت بالإجابة على{' '}
                <strong className="text-emerald-700 font-bold">{answeredCount}</strong> من أصل{' '}
                <strong className="text-slate-800 font-bold">{totalQuestions}</strong> أسئلة.
                {answeredCount < totalQuestions && (
                  <span className="block mt-1 text-amber-700 font-bold">
                    ⚠️ تنبيه: توجد {totalQuestions - answeredCount} أسئلة لم تقم بالإجابة عليها بعد!
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmitTest}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition"
              >
                نعم، اعتمد النتيجة
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition"
              >
                مراجعة الإجابات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
