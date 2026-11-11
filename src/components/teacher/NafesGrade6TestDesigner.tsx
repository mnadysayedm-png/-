import React, { useState, useMemo } from 'react';
import { Test, Question, PlatformSettings, Section } from '../../types';
import {
  nafesGrade6Domains,
  nafesGrade6Outcomes,
  NafesLearningOutcome,
  NafesIndicator,
} from '../../data/nafesGrade6Standards';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Plus,
  Play,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Layers,
  Award,
  Trash2,
  HelpCircle,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import { exportCurriculumToWord, exportCurriculumToExcel } from '../../utils/exportUtils';

interface NafesGrade6TestDesignerProps {
  settings: PlatformSettings;
  sections: Section[];
  onAddTest: (test: Omit<Test, 'id' | 'createdAt'>) => void;
  existingTests: Test[];
}

export const NafesGrade6TestDesigner: React.FC<NafesGrade6TestDesignerProps> = ({
  settings,
  sections,
  onAddTest,
  existingTests,
}) => {
  // Cascading Selection State
  // 1. Domain
  const [selectedDomainId, setSelectedDomainId] = useState<string>('life');
  // 2. Sub-Domain
  const [selectedSubDomainId, setSelectedSubDomainId] = useState<string>('1-1');
  // 3. Learning Outcome Code
  const [selectedOutcomeCode, setSelectedOutcomeCode] = useState<string>('1-1-1-5-6');
  // 4. Indicator Number
  const [selectedIndicatorNum, setSelectedIndicatorNum] = useState<number>(1);

  // Test building form states
  const [testTitle, setTestTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passingScore, setPassingScore] = useState(80);
  const [targetSection, setTargetSection] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Current domain object
  const currentDomain = useMemo(() => {
    return nafesGrade6Domains.find((d) => d.id === selectedDomainId) || nafesGrade6Domains[0];
  }, [selectedDomainId]);

  // Available sub-domains for selected domain
  const availableSubDomains = currentDomain.subDomains;

  // Available outcomes for selected sub-domain
  const availableOutcomes = useMemo(() => {
    return nafesGrade6Outcomes.filter((o) => o.subDomainId === selectedSubDomainId);
  }, [selectedSubDomainId]);

  // Current selected outcome
  const currentOutcome = useMemo(() => {
    return (
      availableOutcomes.find((o) => o.code === selectedOutcomeCode) ||
      availableOutcomes[0] ||
      nafesGrade6Outcomes[0]
    );
  }, [availableOutcomes, selectedOutcomeCode]);

  // Available indicators for selected outcome
  const availableIndicators = currentOutcome ? currentOutcome.indicators : [];

  // Current selected indicator
  const currentIndicator = useMemo(() => {
    return (
      availableIndicators.find((i) => i.number === selectedIndicatorNum) ||
      availableIndicators[0]
    );
  }, [availableIndicators, selectedIndicatorNum]);

  // Update cascade selections when parent changes
  const handleDomainChange = (domainId: string) => {
    setSelectedDomainId(domainId);
    const domain = nafesGrade6Domains.find((d) => d.id === domainId);
    if (domain && domain.subDomains.length > 0) {
      const firstSub = domain.subDomains[0];
      setSelectedSubDomainId(firstSub.id);
      const outcomesForSub = nafesGrade6Outcomes.filter((o) => o.subDomainId === firstSub.id);
      if (outcomesForSub.length > 0) {
        setSelectedOutcomeCode(outcomesForSub[0].code);
        setSelectedIndicatorNum(1);
      }
    }
  };

  const handleSubDomainChange = (subId: string) => {
    setSelectedSubDomainId(subId);
    const outcomesForSub = nafesGrade6Outcomes.filter((o) => o.subDomainId === subId);
    if (outcomesForSub.length > 0) {
      setSelectedOutcomeCode(outcomesForSub[0].code);
      setSelectedIndicatorNum(1);
    }
  };

  const handleOutcomeChange = (code: string) => {
    setSelectedOutcomeCode(code);
    setSelectedIndicatorNum(1);
  };

  // Sample Generated Questions tailored to the selected indicator
  const generatedQuestions = useMemo<Question[]>(() => {
    if (!currentIndicator || !currentOutcome) return [];

    // Realistic smart questions based on the selected indicator
    const indText = currentIndicator.text;
    const outCode = currentOutcome.code;

    if (outCode.startsWith('1-1-1')) {
      // الخلايا وتراكيبها
      return [
        {
          id: `q-nafes-${Date.now()}-1`,
          questionText: 'أي من التراكيب التالية يوجد في الخلية النباتية ولا يوجد في الخلية الحيوانية؟',
          options: ['الغشاء البلازمي', 'الجدار الخلوي والبلاستيدات الخضراء', 'السيتوبلازم', 'الميتوكندريا'],
          correctAnswerIndex: 1,
          explanation: 'تتميز الخلية النباتية بوجود جدار خلوي سيليلوزي وبلاستيدات خضراء للبناء الضوئي.',
          skillName: `${currentOutcome.code}: ${currentIndicator.text.substring(0, 45)}...`,
          domain: 'علوم الحياة',
          grade: '6',
          difficulty: 'متوسط',
        },
        {
          id: `q-nafes-${Date.now()}-2`,
          questionText: 'ما وظيفة النواة الأساسية في الخلية الحية؟',
          options: [
            'التحكم في أنشطة الخلية وحفظ المادة الوراثية DNA',
            'إنتاج الغذاء فقط',
            'تخزين الفضلات والماء الزائد',
            'حماية الخلية من الصدمات الخارجية',
          ],
          correctAnswerIndex: 0,
          explanation: 'النواة هي مركز التحكم في الخلية وتحتوي على الكروموسومات التي تحمل الجينات.',
          skillName: `${currentOutcome.code}: ${currentIndicator.text.substring(0, 45)}...`,
          domain: 'علوم الحياة',
          grade: '6',
          difficulty: 'سهل',
        },
        {
          id: `q-nafes-${Date.now()}-3`,
          questionText: 'أي من المخلوقات الحية التالية يُعد مخلوقاً وحيد الخلية؟',
          options: ['نبات الفول', 'البكتيريا والبراميسيوم', 'سمكة السلمون', 'دودة الأرض'],
          correctAnswerIndex: 1,
          explanation: 'البكتيريا والأوليات مثل البراميسيوم تتكون من خلية واحدة تؤدي كافة الوظائف الحيوية.',
          skillName: `${currentOutcome.code}: ${currentIndicator.text.substring(0, 45)}...`,
          domain: 'علوم الحياة',
          grade: '6',
          difficulty: 'متوسط',
        },
      ];
    }

    if (outCode.startsWith('3-3-1') || outCode.startsWith('1-3-1') || outCode.startsWith('2-3-1')) {
      // الأنظمة البيئية وسلاسل الغذاء
      return [
        {
          id: `q-nafes-${Date.now()}-1`,
          questionText: 'في سلسلة غذائية برية: (عشب ⬅️ جراد ⬅️ ضفدع ⬅️ ثعبان ⬅️ صقر)، من الكائن المنتج الأساسي؟',
          options: ['الجراد', 'الضفدع', 'العشب (نبات)', 'الصقر'],
          correctAnswerIndex: 2,
          explanation: 'النباتات الخضراء كالعشب هي الكائنات المنتجة الوحيدة التي تصنع غذاءها بنفسها بعملية البناء الضوئي.',
          skillName: `${currentOutcome.code}: ${currentIndicator.text.substring(0, 45)}...`,
          domain: 'علوم الحياة',
          grade: '6',
          difficulty: 'سهل',
        },
        {
          id: `q-nafes-${Date.now()}-2`,
          questionText: 'ماذا يحدث إذا انقرضت المحللات (مثل البكتيريا والفطريات) من نظام بيئي معين؟',
          options: [
            'تزداد سرعة نمو النباتات وتتدفق الطاقة',
            'تتراكم جثث الكائنات الميتة وتنقطع دورة المواد العضوية',
            'تتحول الحيوانات إلى كائنات ذاتية التغذية',
            'لا يتأثر النظام البيئي بأي شكل',
          ],
          correctAnswerIndex: 1,
          explanation: 'المحللات تعيد تدوير العناصر والمركبات العضوية إلى التربة لاستمرار دورة الحياة.',
          skillName: `${currentOutcome.code}: ${currentIndicator.text.substring(0, 45)}...`,
          domain: 'علوم الحياة',
          grade: '6',
          difficulty: 'متوسط',
        },
      ];
    }

    if (outCode.includes('-2-')) {
      // العلوم الفيزيائية
      return [
        {
          id: `q-nafes-${Date.now()}-1`,
          questionText: `سؤال نافس معياري: في ضوء معيار (${currentIndicator.text.substring(0, 35)}...)، ما النتيجة العلمية المتوقعة؟`,
          options: [
            'تطبيق قانون حفظ الكتلة والطاقة في النظام الفيزيائي',
            'حدوث تغير عشوائي لا يخضع لقوانين الفيزياء',
            'فناء المادة بالكامل أثناء التفاعل',
            'انخفاض درجة الحرارة دون سبب فيزيائي',
          ],
          correctAnswerIndex: 0,
          explanation: 'ينص قانون حفظ الكتلة والطاقة على أن المادة لا تفنى ولا تستحدث من العدم بل تتحول من شكل لآخر.',
          skillName: `${currentOutcome.code}: ${currentIndicator.text.substring(0, 45)}...`,
          domain: 'العلوم الفيزيائية',
          grade: '6',
          difficulty: 'متوسط',
        },
        {
          id: `q-nafes-${Date.now()}-2`,
          questionText: 'أي الدوائر الكهربائية تسمح باستمرار إضاءة بقية المصابيح إذا احترق أحدها؟',
          options: ['دائرة التوصيل على التوالي', 'دائرة التوصيل على التوازي', 'الدائرة المفتوحة', 'دائرة بدون بطارية'],
          correctAnswerIndex: 1,
          explanation: 'في دائرة التوازي توجد مسارات متعددة لسريان التيار الكهربائي.',
          skillName: `${currentOutcome.code}: ${currentIndicator.text.substring(0, 45)}...`,
          domain: 'العلوم الفيزيائية',
          grade: '6',
          difficulty: 'سهل',
        },
      ];
    }

    // علوم الأرض والفضاء
    return [
      {
        id: `q-nafes-${Date.now()}-1`,
        questionText: `في ضوء دراسة ظواهر الأرض والفضاء وفق المؤشر (${currentIndicator.text.substring(0, 40)}...)، ما السبب العلمي لحدوث خسوف القمر؟`,
        options: [
          'وقوع الأرض تماماً بين الشمس والقمر فتحجب ضوء الشمس عنه',
          'وقوع القمر بين الأرض والشمس',
          'انطفاء ضوء القمر الداخلي',
          'دوران الشمس حول القمر',
        ],
        correctAnswerIndex: 0,
        explanation: 'يحدث خسوف القمر عندما تقع الأرض على خط مستقيم بين الشمس والقمر وتلقي بظلها عليه.',
        skillName: `${currentOutcome.code}: ${currentIndicator.text.substring(0, 45)}...`,
        domain: 'علوم الأرض والفضاء',
        grade: '6',
        difficulty: 'متوسط',
      },
      {
        id: `q-nafes-${Date.now()}-2`,
        questionText: 'أي من الظواهر الجيولوجية التالية تنتج عن حركة الصفائح التكتونية المتباعدة؟',
        options: ['حفر الانهدام وتكوّن المحيطات والبراكين', 'تآكل الصخور بالرياح فقط', 'هطول الأمطار الحمضية', 'تكوّن الكثبان الرملية'],
        correctAnswerIndex: 0,
        explanation: 'تؤدي حركة التباعد بين الصفائح إلى اتساع قاع المحيط وتكوين حفر الانهدام والنشاط البركاني.',
        skillName: `${currentOutcome.code}: ${currentIndicator.text.substring(0, 45)}...`,
        domain: 'علوم الأرض والفضاء',
        grade: '6',
        difficulty: 'متوسط',
      },
    ];
  }, [currentIndicator, currentOutcome]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Launch test built on the chosen indicator
  const handleDeployTest = () => {
    if (!currentIndicator || !currentOutcome) return;

    const titleToUse =
      testTitle.trim() ||
      `اختبار نافس سادس - مؤشر (${currentIndicator.code}): ${currentIndicator.text.substring(0, 45)}...`;

    const newTest: Omit<Test, 'id' | 'createdAt'> = {
      title: titleToUse,
      description: `اختبار معياري محاكي لاختبارات نافس الوطنية بالصف السادس - الناتج: ${currentOutcome.code} (${currentOutcome.title}) - المؤشر رقم (${currentIndicator.number}): ${currentIndicator.text}`,
      grade: '6',
      domain:
        selectedDomainId === 'life'
          ? 'علوم الحياة'
          : selectedDomainId === 'physical'
          ? 'العلوم الفيزيائية'
          : 'علوم الأرض والفضاء',
      durationMinutes: durationMinutes || 15,
      passingScorePercentage: passingScore || 80,
      isActive: true,
      isNafesBenchmark: true,
      questions: generatedQuestions,
      targetSections: targetSection === 'all' ? undefined : [targetSection],
    };

    onAddTest(newTest);
    showToast(`تم بنجاح بناء وتفعيل الاختبار المعياري لمؤشر (${currentIndicator.code}) لطلاب سادس!`);
    setTestTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-5 py-2.5 rounded-2xl shadow-xl font-black text-xs sm:text-sm animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#102A45] to-[#0B192C] rounded-3xl p-6 sm:p-8 text-white border-2 border-blue-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>هيئة تقويم التعليم والتدريب (ETEC) - وثيقة نواتج التعلم لاختبارات نافس</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              واجهة تصميم اختبارات نافس الوطنية - الصف السادس الابتدائي
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              اختر <strong className="text-amber-400">المجال</strong>، ثم <strong className="text-emerald-400">ناتج التعلم المستهدف</strong> بكوده الرسمي، ثم <strong className="text-cyan-400">المؤشر المستهدف برقمه</strong> لتصميم واشتقاق اختبار معياري مخصص وموجه فوراً للطلاب.
            </p>
          </div>

          <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center">
            <span className="text-xs text-slate-300 block mb-1">المعلم المشرف:</span>
            <span className="text-base font-black text-amber-300">{settings.teacherName}</span>
            <span className="text-xs block text-slate-300 mt-1">{settings.schoolName}</span>
          </div>
        </div>
      </div>

      {/* Cascading Dropdowns Card (المجال - ناتج التعلم - المؤشر برقمه) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-600/30 shadow-md space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">🎯</span>
            <span>تحديد المعايير من القوائم المنسدلة لاختبار نافس سادس:</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            القوائم مرتبطة تسلسلياً وفق وثيقة هيئة تقويم التعليم والتدريب المعتمدة
          </p>
        </div>

        {/* 3 Cascading Select Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. القائمة المنسدلة: المجال الرئيسي والفرعي */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>المجال الرئيسي والفرعي:</span>
            </label>
            <div className="space-y-2">
              <select
                value={selectedDomainId}
                onChange={(e) => handleDomainChange(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl border-2 border-slate-300 hover:border-blue-500 text-slate-950 text-xs sm:text-sm font-black focus:border-blue-600 focus:outline-hidden bg-white shadow-2xs"
              >
                {nafesGrade6Domains.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white text-slate-950 font-bold py-1.5">
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSubDomainId}
                onChange={(e) => handleSubDomainChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-blue-300 text-slate-950 text-xs font-bold focus:border-blue-600 focus:outline-hidden bg-blue-50/50"
              >
                {availableSubDomains.map((sub) => (
                  <option key={sub.id} value={sub.id} className="bg-white text-slate-950 font-bold py-1.5">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. القائمة المنسدلة: ناتج التعلم المستهدف */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>ناتج التعلم المستهدف (كود نافس الرسمي):</span>
            </label>
            <select
              value={selectedOutcomeCode}
              onChange={(e) => handleOutcomeChange(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl border-2 border-slate-300 hover:border-emerald-500 text-slate-950 text-xs sm:text-sm font-black focus:border-emerald-600 focus:outline-hidden bg-white shadow-2xs min-h-[52px]"
            >
              {availableOutcomes.map((out) => (
                <option key={out.code} value={out.code} className="bg-white text-slate-950 font-bold py-1.5">
                  [{out.code}] {out.title}
                </option>
              ))}
            </select>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-950 leading-relaxed font-bold">
              <strong className="text-emerald-900 block mb-0.5">كود الناتج المعتمد: {currentOutcome.code}</strong>
              <span className="text-slate-800">{currentOutcome.title}</span>
            </div>
          </div>

          {/* 3. القائمة المنسدلة: المؤشر المستهدف برقمه */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>المؤشر المستهدف برقمه المعتمد:</span>
            </label>
            <select
              value={selectedIndicatorNum}
              onChange={(e) => setSelectedIndicatorNum(Number(e.target.value))}
              className="w-full px-3.5 py-3 rounded-2xl border-2 border-slate-300 hover:border-amber-500 text-slate-950 text-xs sm:text-sm font-black focus:border-amber-600 focus:outline-hidden bg-white shadow-2xs min-h-[52px]"
            >
              {availableIndicators.map((ind) => (
                <option key={ind.number} value={ind.number} className="bg-white text-slate-950 font-bold py-1.5">
                  المؤشر ({ind.number}): {ind.text}
                </option>
              ))}
            </select>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 leading-relaxed font-bold">
              <strong className="text-amber-900 block mb-0.5">المؤشر الوطني رقم ({currentIndicator?.number}):</strong>
              <span className="text-slate-800">{currentIndicator?.text}</span>
            </div>
          </div>
        </div>

        {/* Selected Standard Full Summary Box */}
        <div className="bg-gradient-to-r from-blue-50/90 via-slate-50 to-emerald-50/90 rounded-2xl p-5 border-2 border-slate-300 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-black text-blue-950 bg-blue-100 px-3 py-1 rounded-xl border border-blue-300">
              المجال: {currentDomain.name} • {availableSubDomains.find((s) => s.id === selectedSubDomainId)?.name}
            </span>
            <span className="font-mono font-black text-slate-900 bg-white px-3 py-1 rounded-xl border-2 border-slate-300">
              كود نافس: {currentOutcome.code}
            </span>
            <span className="font-black text-amber-950 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
              المؤشر المحدد: رقم ({currentIndicator?.number})
            </span>
          </div>

          <div className="pt-2 text-xs sm:text-sm text-slate-900 space-y-2">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <strong className="text-slate-900 block font-black mb-1">نص ناتج التعلم المعتمد: </strong>
              <span className="text-slate-800 font-bold leading-relaxed">{currentOutcome.title}</span>
            </div>
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
              <strong className="text-emerald-950 block font-black mb-1">نص المؤشر الوطني المستهدف: </strong>
              <span className="font-black text-emerald-900 leading-relaxed">{currentIndicator?.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Customization & Generation Section (تصميم اختبار على الأشياء التي تم اختيارها) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>إعدادات ونشر اختبار نافس على المؤشر المحدد</span>
            </h3>
            <p className="text-xs text-slate-500">
              سيتم إنشاء اختبار تفاعلي فوري بموجب المعيار والمؤشر المختار من القوائم المنسدلة
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            الصف السادس الابتدائي
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان الاختبار المقترح:
            </label>
            <input
              type="text"
              placeholder={`اختبار نافس سادس - ${currentIndicator?.text.substring(0, 35)}...`}
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مدة الاختبار (بالدقائق):
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الشعبة المستهدفة:
            </label>
            <select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden font-medium bg-white"
            >
              <option value="all">كافة شعب الصف السادس</option>
              {sections
                .filter((s) => s.grade === '6')
                .map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Preview of Questions mapped to this indicator */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>الأسئلة المحاكية المشتقة للمؤشر ({generatedQuestions.length} أسئلة معيارية):</span>
            </h4>
            <span className="text-xs text-slate-500 font-bold">
              متوافقة مع نمط أسئلة نافس (اختيار من متعدد + تفسير علمي)
            </span>
          </div>

          <div className="space-y-3">
            {generatedQuestions.map((q, qIdx) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      {qIdx + 1}
                    </span>
                    <span>{q.questionText}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    مستوى: {q.difficulty}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-6">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg border text-[11px] ${
                        oIdx === q.correctAnswerIndex
                          ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {opt} {oIdx === q.correctAnswerIndex && '✓ (الإجابة الصحيحة)'}
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-slate-500 pr-6 pt-1">
                  💡 <strong>التفسير العلمي المعياري:</strong> {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons: Deploy Test to Platform */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            سيتم نشر هذا الاختبار فوراً في بوابة طلاب الصف السادس مع رصد نتائج الإتقان.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDeployTest}
              className="flex-1 sm:flex-initial py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>تصميم ونشر اختبار نافس الآن 🚀</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grade 6 Nafes Tests Roster */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              قائمة اختبارات نافس المنشورة للصف السادس ({existingTests.filter((t) => t.grade === '6' && t.isNafesBenchmark).length} اختبار)
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {existingTests
            .filter((t) => t.grade === '6' && t.isNafesBenchmark)
            .map((test) => (
              <div
                key={test.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{test.title}</h4>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 shrink-0">
                    نافس سادس
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{test.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>عدد الأسئلة: {test.questions.length}</span>
                  <span>المدة: {test.durationMinutes} دقيقة</span>
                  <span className="text-emerald-700 font-bold">المستهدف: {test.passingScorePercentage}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
