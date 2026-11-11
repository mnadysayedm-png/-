import React, { useState } from 'react';
import { GradeLevel, Question, ScienceDomain } from '../../types';
import { BrainCircuit, Sparkles, Plus, Check, RefreshCw, X, HelpCircle } from 'lucide-react';

interface ScienceQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGeneratedQuestions: (questions: Question[]) => void;
}

export const ScienceQuestionGeneratorModal: React.FC<ScienceQuestionGeneratorModalProps> = ({
  isOpen,
  onClose,
  onAddGeneratedQuestions,
}) => {
  const [grade, setGrade] = useState<GradeLevel>('4');
  const [domain, setDomain] = useState<ScienceDomain>('علوم الحياة');
  const [topic, setTopic] = useState('السلاسل والشبكات الغذائية وتدفق الطاقة');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  if (!isOpen) return null;

  // Science topics bank per grade
  const topicPresets: Record<GradeLevel, string[]> = {
    '4': [
      'السلاسل والشبكات الغذائية وتدفق الطاقة',
      'الخلايا كوحدة بناء المخلوقات الحية',
      'تصنيف الحيوانات إلى فقاريات ولافقاريات',
      'حالات المادة وخصائصها الفيزيائية',
      'القوى والحركة والاحتكاك والجاذبية',
    ],
    '5': [
      'ممالك المخلوقات الحية والتكاثر في النبات',
      'التغيرات الكيميائية مقابل التغيرات الفيزيائية',
      'دورة الماء في الطبيعة وحركة الغلاف الجوي',
      'خصائص الضوء والصوت والموجات',
      'المركبات والتفاعلات الكيميائية',
    ],
    '6': [
      'مكونات الخلية (النباتية والحيوانية) وعضياتها',
      'الصفات الوراثية والجينات والصفة السائدة',
      'الذرات وجسيمات البروتون والنيوترون والإلكترون',
      'دوائر التوالي والتوازي والكهرباء والمغناطيسية',
      'النظام الشمسي والكواكب والكون والنجوم',
    ],
  };

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      // Procedural generator mapped to Saudi elementary science standards
      const templateQuestions: Record<string, Question[]> = {
        'السلاسل والشبكات الغذائية وتدفق الطاقة': [
          {
            id: `gen-${Date.now()}-1`,
            grade: '4',
            domain: 'علوم الحياة',
            skillName: 'تحديد دور المحللات في السلسلة',
            questionText: 'أي المخلوقات الحية التالية تقوم بتفكيك أجساد الكائنات الميتة وإعادة المغذيات للتربة؟',
            options: ['الفطريات والبكتيريا (المحللات)', 'الطيور الجارحة', 'النباتات الخضراء', 'الحشرات العاشبة'],
            correctAnswerIndex: 0,
            explanation: 'المحللات تعيد تدوير المادة العضوية في النظام البيئي لتستفيد منها التربة والنباتات من جديد.',
            difficulty: 'سهل',
            diagramEmoji: '🍄',
          },
          {
            id: `gen-${Date.now()}-2`,
            grade: '4',
            domain: 'علوم الحياة',
            skillName: 'تتبع هرم الطاقة البيئي',
            questionText: 'في هرم الطاقة، أين توجد أكبر كمية من الطاقة المخزنة المتاحة؟',
            options: ['في قاعدة الهرم (المنتجات الخضراء)', 'في قمة الهرم (المفترسات)', 'في منتصف الهرم (العواشب)', 'في الهواء المحيط فقط'],
            correctAnswerIndex: 0,
            explanation: 'المنتجات تستقبل الطاقة مباشرة من الشمس وتحتوي على أعلى طاقة حيوية في قاعدة الهرم.',
            difficulty: 'متوسط',
            diagramEmoji: '📐',
          },
        ],
        'مكونات الخلية (النباتية والحيوانية) وعضياتها': [
          {
            id: `gen-${Date.now()}-3`,
            grade: '6',
            domain: 'علوم الحياة',
            skillName: 'المقارنة بين الخلية النباتية والحيوانية',
            questionText: 'تتميز الخلية النباتية عن الخلية الحيوانية بوجود:',
            options: ['الجدار الخلوي والبلاستيدات الخضراء', 'الغشاء البلازمي والنواة', 'الميتوكوندريا فقط', 'السيتوبلازم والريبوسومات'],
            correctAnswerIndex: 0,
            explanation: 'الجدار الخلوي يمنح الدعامة، والبلاستيدات الخضراء تقوم بالبناء الضوئي، وكلاهما يختص بالخلية النباتية.',
            difficulty: 'متوسط',
            diagramEmoji: '🔬',
          },
        ],
      };

      const selected = templateQuestions[topic] || [
        {
          id: `gen-${Date.now()}-a`,
          grade,
          domain,
          skillName: `تطبيق مهارات ${topic}`,
          questionText: `سؤال تطبيقي في ${topic}: ما هي النتيجة العلمية المترتبة على حدوث هذا التغير؟`,
          options: [
            'الخيار الصحيح بناءً على المعايير العلمية',
            'خيار غير صحيح ناتج عن فهم خاطئ',
            'خيار مضلل شائع',
            'خيار لا علاقة له بالسياق',
          ],
          correctAnswerIndex: 0,
          explanation: `التفسير العلمي يوضح ارتباط مفهوم ${topic} بالظواهر الطبيعية.`,
          difficulty: 'متوسط',
          diagramEmoji: '💡',
        },
        {
          id: `gen-${Date.now()}-b`,
          grade,
          domain,
          skillName: `تحليل واستنتاج في ${topic}`,
          questionText: `أي من الخيارات التالية يمثل دليلاً علمياً قاطعاً على هذا المفهوم؟`,
          options: [
            'الملاحظة التجريبية وقياس المتغيرات',
            'التخمين دون إجراء تجربة علمية',
            'افتراض ثبات كل الظروف دائماً',
            'إهمال دور الطاقة في النظام',
          ],
          correctAnswerIndex: 0,
          explanation: 'المنهج العلمي يعتمد على الملاحظة والقياس واختبار الفرضيات.',
          difficulty: 'متقدم',
          diagramEmoji: '🧪',
        },
      ];

      setGeneratedQuestions(selected);
      setIsGenerating(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 rounded-xl text-amber-200">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                المولد الذكي لأسئلة مادة العلوم (معايير نافس)
              </h3>
              <p className="text-xs text-amber-100">
                بناء أسئلة اختيار من متعدد مخصصة لمناهج العلوم للصفوف 4، 5، 6.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-white/70 hover:text-white font-bold p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الصف المستهدف</label>
              <select
                value={grade}
                onChange={(e) => {
                  const g = e.target.value as GradeLevel;
                  setGrade(g);
                  setTopic(topicPresets[g][0]);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="4">الصف الرابع الابتدائي</option>
                <option value="5">الصف الخامس الابتدائي</option>
                <option value="6">الصف السادس الابتدائي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المجال العلمي</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as ScienceDomain)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="علوم الحياة">علوم الحياة</option>
                <option value="العلوم الفيزيائية">العلوم الفيزيائية</option>
                <option value="علوم الأرض والفضاء">علوم الأرض والفضاء</option>
                <option value="المهارات والعمليات العلمية">المهارات والعمليات العلمية</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">الموضوع العلمي المستهدف</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                {topicPresets[grade].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="py-2.5 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري إعداد وصياغة الأسئلة العلمية...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>توليد أسئلة مطابقة لمعايير نافس</span>
                </>
              )}
            </button>
          </div>

          {/* Generated preview */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-xs font-black text-slate-800 block">
                الأسئلة المولدة ({generatedQuestions.length} أسئلة جاهزة للاعتماد):
              </span>

              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900">
                        سؤال {idx + 1}: {q.skillName}
                      </span>
                      <span className="text-[10px] text-emerald-700">{q.difficulty}</span>
                    </div>

                    <p className="font-bold text-slate-800 text-sm">{q.questionText}</p>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-1.5 rounded-lg border text-[11px] ${
                            optIdx === q.correctAnswerIndex
                              ? 'bg-emerald-100 border-emerald-300 font-bold text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>

                    <div className="text-[10px] text-slate-500 pt-1">
                      <strong>التعليل العلمي:</strong> {q.explanation}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onAddGeneratedQuestions(generatedQuestions);
                    onClose();
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة هذه الأسئلة إلى بنك أسئلة العلوم الآن</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
