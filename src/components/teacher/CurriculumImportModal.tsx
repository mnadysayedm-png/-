import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { GradeLevel, PlatformSettings } from '../../types';
import { CurriculumSkillItem } from '../../utils/exportUtils';
import { ClearableInput, ClearableTextarea } from '../common/ClearableInput';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  X,
  BookOpen,
  Sparkles,
  Trash2,
  Plus,
  ArrowRight,
  Check,
  FileCheck,
  RotateCcw,
} from 'lucide-react';

interface CurriculumImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGrade: GradeLevel;
  activeType: 'curriculum' | 'nafes';
  onImportSkills: (skills: Omit<CurriculumSkillItem, 'id'>[]) => void;
}

interface ParsedSkillRow {
  id: string;
  selected: boolean;
  unitOrDomain: string;
  skillTitle: string;
  learningOutcome: string;
  performanceIndicator: string;
  cognitiveLevel: string;
  masteryPercentageTarget: number;
  notes?: string;
}

export const CurriculumImportModal: React.FC<CurriculumImportModalProps> = ({
  isOpen,
  onClose,
  selectedGrade,
  activeType,
  onImportSkills,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste' | 'preset'>('file');
  const [targetGrade, setTargetGrade] = useState<GradeLevel>(selectedGrade);
  const [targetType, setTargetType] = useState<'curriculum' | 'nafes'>(activeType);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedSkillRow[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const gradeNameMap: Record<GradeLevel, string> = {
    '4': 'الصف الرابع الابتدائي',
    '5': 'الصف الخامس الابتدائي',
    '6': 'الصف السادس الابتدائي',
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Process Excel File (.xlsx, .xls, .csv)
  const handleExcelFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setFileName(file.name);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      const extracted: ParsedSkillRow[] = [];

      rows.forEach((row, rowIndex) => {
        if (!Array.isArray(row) || row.length === 0) return;

        // Skip headers if first row contains column labels
        const rowStr = row.join(' ');
        if (
          rowIndex === 0 &&
          (rowStr.includes('الوحدة') ||
            rowStr.includes('المهارة') ||
            rowStr.includes('ناتج التعلم') ||
            rowStr.includes('المعيار') ||
            rowStr.includes('المجال'))
        ) {
          return;
        }

        // Clean values
        const cells = row.map((c) => String(c || '').trim()).filter((c) => c.length > 0);
        if (cells.length === 0) return;

        let unit = 'الوحدة التعليمية';
        let skill = '';
        let outcome = '';
        let indicator = 'إتقان ناتج التعلم بدقة 80% فما فوق';
        let level = 'فهم وتطبيق';
        let mastery = 80;

        if (cells.length >= 3) {
          unit = cells[0];
          skill = cells[1];
          outcome = cells[2];
          if (cells[3]) indicator = cells[3];
          if (cells[4]) level = cells[4];
        } else if (cells.length === 2) {
          skill = cells[0];
          outcome = cells[1];
        } else if (cells.length === 1) {
          skill = cells[0];
          outcome = `أن يتقن الطالب مهارة: ${cells[0]}`;
        }

        if (skill) {
          extracted.push({
            id: `row-${rowIndex}-${Date.now().toString(36)}`,
            selected: true,
            unitOrDomain: unit,
            skillTitle: skill,
            learningOutcome: outcome || `إتقان وتطبيق مفهوم (${skill}) وفق المعايير الوزارية`,
            performanceIndicator: indicator,
            cognitiveLevel: level,
            masteryPercentageTarget: mastery,
          });
        }
      });

      setParsedRows(extracted);
      showNotification(`تم استخراج ${extracted.length} مهارة وناتج تعلم بنجاح من ملف الإكسل.`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء قراءة ملف الإكسل. يرجى التحقق من الملف.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Process Word (.docx, .doc), PDF, or Text (.txt)
  const handleWordOrTextFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setFileName(file.name);

      let text = '';
      if (file.name.endsWith('.docx')) {
        try {
          const buffer = await file.arrayBuffer();
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const raw = decoder.decode(buffer);
          const matches = raw.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (matches && matches.length > 0) {
            text = matches.map((m) => m.replace(/<w:t[^>]*>|<\/w:t>/g, '')).join('\n');
          } else {
            text = raw;
          }
        } catch {
          text = await file.text();
        }
      } else {
        text = await file.text();
      }

      parseRawTextLines(text);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء معالجة الملف. يمكنك نسخ ولصق النصوص مباشرة في التبويب الثاني.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      handleExcelFile(file);
    } else {
      handleWordOrTextFile(file);
    }
  };

  // Parse Raw Text Lines (from Word, text file, or pasted content)
  const parseRawTextLines = (content: string) => {
    const lines = content.split(/[\r\n]+/);
    const extracted: ParsedSkillRow[] = [];
    let currentUnit = 'الوحدة التعليمية';

    lines.forEach((line, idx) => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.length < 3) return;

      // Header or Document Titles to skip
      if (
        cleanLine.includes('المملكة العربية السعودية') ||
        cleanLine.includes('وزارة التعليم') ||
        cleanLine.includes('كشف مهارات') ||
        cleanLine.includes('توزيع المنهج')
      ) {
        return;
      }

      // Check if line represents a unit / chapter title
      if (
        cleanLine.startsWith('الوحدة') ||
        cleanLine.startsWith('الفصل') ||
        cleanLine.startsWith('مجال') ||
        cleanLine.includes('الوحدة الأولى') ||
        cleanLine.includes('الوحدة الثانية') ||
        cleanLine.includes('الوحدة الثالثة') ||
        cleanLine.includes('الوحدة الرابعة')
      ) {
        currentUnit = cleanLine.replace(/[:\-–]/g, '').trim();
        return;
      }

      // Extract skills / outcomes
      // Split on dash, colon, tab, or bullet
      let skillText = cleanLine
        .replace(/^[\d\-\*\•\–\(\)\.]+\s*/, '') // remove numbers/bullets
        .replace(/^(مهارة|معيار|ناتج التعلم|المؤشر)[:\-–\s]*/, '')
        .trim();

      if (skillText.length < 4) return;

      let skill = skillText;
      let outcome = '';

      if (skillText.includes(':') || skillText.includes(' - ') || skillText.includes('–')) {
        const parts = skillText.split(/[:\-–]/);
        if (parts.length >= 2) {
          skill = parts[0].trim();
          outcome = parts.slice(1).join(' - ').trim();
        }
      }

      if (!outcome) {
        outcome = skill.startsWith('أن')
          ? skill
          : `أن يتمكن الطالب من إتقان وتطبيق (${skill}) بشكل صحيح.`;
      }

      extracted.push({
        id: `parsed-line-${idx}-${Date.now().toString(36)}`,
        selected: true,
        unitOrDomain: currentUnit,
        skillTitle: skill,
        learningOutcome: outcome,
        performanceIndicator: 'إتقان ناتج التعلم واجتياز أسئلة القياس بنسبة 80% فما فوق',
        cognitiveLevel: 'فهم وتطبيق',
        masteryPercentageTarget: 80,
      });
    });

    setParsedRows(extracted);
    showNotification(`تم استخراج ${extracted.length} مهارة وناتج تعلم بنجاح من النص.`);
  };

  // Quick Preset Ministry / Nafes Science Curricula
  const handleLoadPresetCurriculum = () => {
    let presets: Omit<ParsedSkillRow, 'id' | 'selected'>[] = [];

    if (targetGrade === '4') {
      presets = [
        {
          unitOrDomain: 'الوحدة الأولى: المخلوقات الحية',
          skillTitle: 'الخلايا كوحدات بناء أساسية للحياة',
          learningOutcome: 'أن يوضح الطالب أن جميع المخلوقات الحية تتكون من خلية واحدة أو أكثر.',
          performanceIndicator: 'يحدد أجزاء الخلية ويرسم مخططاً مبسطاً لتركيبها.',
          cognitiveLevel: 'استرجاع وفهم',
          masteryPercentageTarget: 80,
        },
        {
          unitOrDomain: 'الوحدة الأولى: المخلوقات الحية',
          skillTitle: 'تصنيف الحيوانات إلى فقاريات ولافقاريات',
          learningOutcome: 'أن يصنف الطالب الحيوانات إلى مجموعات فقارية ولافقارية بناءً على وجود العمود الفقري.',
          performanceIndicator: 'يفرز 5 نماذج لحيوانات مختلفة في جدول تصنيفي صحيح.',
          cognitiveLevel: 'فهم وتطبيق',
          masteryPercentageTarget: 85,
        },
        {
          unitOrDomain: 'الوحدة الثانية: الأنظمة البيئية',
          skillTitle: 'السلاسل والشبكات الغذائية وانتقال الطاقة',
          learningOutcome: 'أن يفسر الطالب كيفية انتقال الطاقة من المنتجات إلى المستهلكات في النظام البيئي.',
          performanceIndicator: 'يركب سلسلة غذائية متكاملة تبدأ بكائن منتج وتنتهي بكائن محلل.',
          cognitiveLevel: 'استدلال وتحليل',
          masteryPercentageTarget: 80,
        },
        {
          unitOrDomain: 'الوحدة الثالثة: الأرض ومواردها',
          skillTitle: 'المعادن والصخور ودورة الصخور',
          learningOutcome: 'أن يميز الطالب بين الصخور النارية والرسوبية والمتحولة من حيث طريقة التكوين.',
          performanceIndicator: 'يصف خصائص الصخور وملمسها وقساوتها بدقة.',
          cognitiveLevel: 'فهم وتطبيق',
          masteryPercentageTarget: 80,
        },
        {
          unitOrDomain: 'الوحدة الرابعة: المادة والطاقة',
          skillTitle: 'تغيرات المادة الفيزيائية والكيميائية',
          learningOutcome: 'أن يقارن الطالب بين التغير الفيزيائي والكيميائي مع ضرب أمثلة من البيئة.',
          performanceIndicator: 'يحدد دلائل حدوث التفاعل الكيميائي مثل تغير اللون أو تصاعد الغاز.',
          cognitiveLevel: 'استدلال وتحليل',
          masteryPercentageTarget: 85,
        },
      ];
    } else if (targetGrade === '5') {
      presets = [
        {
          unitOrDomain: 'الوحدة الأولى: تنوع الحياة',
          skillTitle: 'ممالك المخلوقات الحية الست',
          learningOutcome: 'أن يصنف الطالب المخلوقات الحية إلى الممالك الست الرئيسية موضحاً خصائص كل مملكة.',
          performanceIndicator: 'يقارن بين النباتات والحيوانات والفطريات في جدول منظم.',
          cognitiveLevel: 'فهم وتطبيق',
          masteryPercentageTarget: 85,
        },
        {
          unitOrDomain: 'الوحدة الأولى: تنوع الحياة',
          skillTitle: 'التكاثر الجنسي واللاجنسي في المخلوقات الحية',
          learningOutcome: 'أن يميز الطالب بين التكاثر الجنسي واللاجنسي ومزايا كل منهما.',
          performanceIndicator: 'يحدد طرق التكاثر اللاجنسي (الانشطار، التبرعم، التكاثر الخضري).',
          cognitiveLevel: 'فهم وتطبيق',
          masteryPercentageTarget: 80,
        },
        {
          unitOrDomain: 'الوحدة الثانية: الأنظمة البيئية',
          skillTitle: 'التكيف والبقاء في البيئات القاسية',
          learningOutcome: 'أن يحلل الطالب أنواع التكيفات التركيبية والسلوكية التي تساعد الكائن على البقاء.',
          performanceIndicator: 'يقدم تفسيراً علمياً لتكيف النباتات والحيوانات الصحراوية.',
          cognitiveLevel: 'استدلال علمي',
          masteryPercentageTarget: 85,
        },
        {
          unitOrDomain: 'الوحدة الثالثة: الأرض والكون',
          skillTitle: 'طبقات الأرض وديناميكية الصفائح التكتونية',
          learningOutcome: 'أن يصف الطالب طبقات الأرض (القشرة، الستار، اللب) وأثر حركة الصفائح في حدوث الزلازل والبراكين.',
          performanceIndicator: 'يرسم قطاعاً للأرض مع كتابة البيانات بوضوح.',
          cognitiveLevel: 'فهم وتطبيق',
          masteryPercentageTarget: 80,
        },
        {
          unitOrDomain: 'الوحدة الرابعة: المادة',
          skillTitle: 'العناصر والمركبات والجدول الدوري',
          learningOutcome: 'أن يستنتج الطالب الفرق بين العنصر والمركب والمخلوط مع أمثلة كيميائية.',
          performanceIndicator: 'يحدد رموز العناصر الشائعة كالأكسجين والحديد والكربون.',
          cognitiveLevel: 'استرجاع وفهم',
          masteryPercentageTarget: 85,
        },
      ];
    } else {
      // Grade 6 (معايير نافس ومنهج سادس)
      presets = [
        {
          unitOrDomain: 'مجال علوم الحياة: الخلايا والوراثة',
          skillTitle: 'المقارنة المجهرية بين الخلية النباتية والخلية الحيوانية',
          learningOutcome: 'أن يقارن الطالب بدقة بين الخلية النباتية والخلية الحيوانية مبيناً وظائف العضيات الرئيسية.',
          performanceIndicator: 'يحدد وجود الجدار الخلوي والبلاستيدات الخضراء في الخلية النباتية وغيابها في الحيوانية.',
          cognitiveLevel: 'فهم وتطبيق',
          masteryPercentageTarget: 85,
        },
        {
          unitOrDomain: 'مجال علوم الحياة: الوراثة والصفات',
          skillTitle: 'انتقال الصفات الوراثية والجينات والكروموسومات',
          learningOutcome: 'أن يوضح الطالب كيف تنتقل الصفات الوراثية السائدة والمتنحية من الآباء إلى الأبناء عبر الأجيال.',
          performanceIndicator: 'يستخدم مخططات الوراثة المبسطة لتوقع صفات النسل.',
          cognitiveLevel: 'استدلال علمي وبراهين',
          masteryPercentageTarget: 85,
        },
        {
          unitOrDomain: 'مجال العلوم الفيزيائية: القوى والحركة',
          skillTitle: 'حساب السرعة وتأثير قوى الاحتكاك والجاذبية',
          learningOutcome: 'أن يطبق الطالب العلاقة الرياضية للسرعة (المسافة ÷ الزمن) ويفسر أثر الاحتكاك ومقاومة الهواء.',
          performanceIndicator: 'يحل مسائل حسابية على السرعة ويفسر تباطؤ الأجسام في الهواء.',
          cognitiveLevel: 'تطبيق واستدلال',
          masteryPercentageTarget: 80,
        },
        {
          unitOrDomain: 'مجال العلوم الفيزيائية: الطاقة والحرارة',
          skillTitle: 'طرق انتقال الحرارة (التوصيل، الحمل، الإشعاع)',
          learningOutcome: 'أن يميز الطالب بين طرق انتقال الطاقة الحرارية في المواد الصلبة والسائلة والغازية والفراغ.',
          performanceIndicator: 'يعطي تطبيقات عملية يومية لكل طريقة من طرق انتقال الحرارة.',
          cognitiveLevel: 'فهم وتطبيق',
          masteryPercentageTarget: 85,
        },
        {
          unitOrDomain: 'مجال علوم الأرض والفضاء: النظام الشمسي',
          skillTitle: 'دوران الأرض وتعاقب الفصول الأربعة وحركات القمر',
          learningOutcome: 'أن يربط الطالب بين ميلان محور الأرض ودورانها حول الشمس وتعاقب الفصول الأربعة وأطوار القمر.',
          performanceIndicator: 'يرسم مواقع الشمس والأرض والقمر أثناء ظاهرتي الخسوف والكسوف.',
          cognitiveLevel: 'استدلال علمي ونمذجة',
          masteryPercentageTarget: 90,
        },
      ];
    }

    const formatted: ParsedSkillRow[] = presets.map((p, idx) => ({
      ...p,
      id: `preset-${idx}-${Date.now().toString(36)}`,
      selected: true,
    }));

    setParsedRows(formatted);
    showNotification(`تم تحميل ${formatted.length} معايير ومهارات رسمية جاهزة لـ (${gradeNameMap[targetGrade]}).`);
  };

  // Toggle selection
  const handleToggleSelectAll = (checked: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const handleToggleSelectRow = (id: string) => {
    setParsedRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  };

  const handleRemoveRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateField = (id: string, field: keyof ParsedSkillRow, value: any) => {
    setParsedRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Commit and import selected skills
  const handleCommitImport = () => {
    const selectedRows = parsedRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      alert('يرجى تحديد مهارة واحدة على الأقل للاستيراد!');
      return;
    }

    const itemsToImport: Omit<CurriculumSkillItem, 'id'>[] = selectedRows.map((r) => ({
      grade: targetGrade,
      type: targetType,
      unitOrDomain: r.unitOrDomain || 'الوحدة التعليمية',
      skillTitle: r.skillTitle,
      learningOutcome: r.learningOutcome,
      performanceIndicator: r.performanceIndicator,
      cognitiveLevel: r.cognitiveLevel,
      masteryPercentageTarget: r.masteryPercentageTarget || 80,
      notes: r.notes || `تم الإرفاق والاستيراد الآلي - ${new Date().toLocaleDateString('ar-SA')}`,
    }));

    onImportSkills(itemsToImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-right">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#0b1a2d] via-[#10243d] to-[#0b1a2d] text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-400/30">
              <Upload className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black">
                  إرفاق واستيراد المحتوى والمهارات والنواتج المستهدفة
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400 text-slate-950">
                  Word / Excel / PDF
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                ارفع وثيقة المنهج أو جدول المهارات بأي صيغة لاستخراج المهارات ونواتج التعلم وتوزيعها تلقائياً.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Settings & Grade / Section Type Target Selection */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 shrink-0 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Target Grade */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 whitespace-nowrap">الصف المستهدف:</span>
              <div className="flex items-center gap-1.5 flex-1">
                {(['4', '5', '6'] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setTargetGrade(g)}
                    className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition text-xs ${
                      targetGrade === g
                        ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    الصف {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Destination Section Type */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 whitespace-nowrap">الوجهة بالمنصة:</span>
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => setTargetType('curriculum')}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 ${
                    targetType === 'curriculum'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>المنهج ونواتج التعلم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('nafes')}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 ${
                    targetType === 'nafes'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معايير نافس الوطنية</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-t border-slate-200 pt-2.5">
            <button
              onClick={() => setActiveTab('file')}
              className={`py-1.5 px-3.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'file'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileUp className="w-4 h-4 text-amber-400" />
              <span>إرفاق ملف (Word / Excel / PDF)</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`py-1.5 px-3.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>لصق نص المنهج أو الجدول</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('preset');
                handleLoadPresetCurriculum();
              }}
              className={`py-1.5 px-3.5 rounded-xl font-bold transition flex items-center gap-1.5 mr-auto ${
                activeTab === 'preset'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>معايير ومهارات الوزارة الرسمية الجاهزة ⚡</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Notification Toast */}
          {notification && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-2 font-bold text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* TAB 1: Upload File (Word, Excel, PDF) */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-3xl p-8 text-center transition bg-slate-50/50 hover:bg-amber-50/30">
                <input
                  type="file"
                  id="curriculum-file-upload"
                  accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="curriculum-file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-md">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <strong className="text-sm sm:text-base font-black text-slate-800 block">
                      انقر لاختيار ملف المحتوى أو اسحبه وأفلته هنا
                    </strong>
                    <p className="text-xs text-slate-500">
                      الصيغ المدعومة: Microsoft Word (.docx, .doc) • Excel (.xlsx, .xls, .csv) • PDF • Text
                    </p>
                  </div>
                  {fileName && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
                      <FileCheck className="w-4 h-4" />
                      <span>تم اختيار: {fileName}</span>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="text-xs font-bold text-amber-700 animate-pulse">
                      جارٍ قراءة الملف واستخراج المهارات ونواتج التعلم...
                    </div>
                  )}
                </label>
              </div>

              {/* Supported format badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>ملفات Excel:</strong> يتعرف على أعمدة الوحدة والمهارة وناتج التعلم.
                  </span>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>ملفات Word:</strong> يستخرج الفقرات والعناوين والمهارات المرقمة.
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>ملفات PDF / نص:</strong> يحلل نواتج التعلم والرموز التعليمية تلقائياً.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Direct Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الصق نصوص المنهج أو جدول المهارات من الوورد أو الإكسل هنا:
                </label>
                <ClearableTextarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  onClear={() => setRawText('')}
                  placeholder={`مثال:&#10;الوحدة الأولى: المخلوقات الحية&#10;1. الخلايا: أن يوضح الطالب تركيب الخلية ووظائف أجزائها&#10;2. الوراثة: أن يفسر انتقال الصفات الوراثية بين الأجيال&#10;الوحدة الثانية: الأنظمة البيئية&#10;3. السلاسل الغذائية: أن يركب سلسلة غذائية متكاملة`}
                  className="w-full text-xs font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => parseRawTextLines(rawText)}
                  disabled={!rawText.trim()}
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تحليل واستخراج المهارات من النص ⚡</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setParsedRows([]);
                  }}
                  className="py-2 px-3 text-slate-500 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>مسح النص بالكامل</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Preset Ministry Science Curricula info */}
          {activeTab === 'preset' && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <strong>معايير ونواتج معتمدة رسمياً:</strong> يمكنك تعديل أي خانة في الجدول أدناه قبل الاعتماد.
              </div>
              <button
                type="button"
                onClick={handleLoadPresetCurriculum}
                className="py-1 px-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition"
              >
                إعادة تحميل معايير {gradeNameMap[targetGrade]}
              </button>
            </div>
          )}

          {/* Preview Table of Extracted Skills */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-black text-slate-800">
                    معاينة وتعديل المهارات المستخرجة ({parsedRows.length} مهارة)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    محدد: {parsedRows.filter((r) => r.selected).length}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    تحديد الكل
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="text-slate-500 hover:underline font-bold"
                  >
                    إلغاء التحديد
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setParsedRows([])}
                    className="text-rose-600 hover:underline font-bold"
                  >
                    مسح القائمة
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-72">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#0f2137] text-white sticky top-0 z-10 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={parsedRows.length > 0 && parsedRows.every((r) => r.selected)}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-emerald-600"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-32">الوحدة / المجال</th>
                      <th className="py-2.5 px-3 w-40">اسم المهارة</th>
                      <th className="py-2.5 px-3">ناتج التعلم المستهدف</th>
                      <th className="py-2.5 px-3 w-28">المستوى المعرفي</th>
                      <th className="py-2.5 px-2 w-12 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`transition ${
                          row.selected ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 opacity-60'
                        }`}
                      >
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => handleToggleSelectRow(row.id)}
                            className="w-3.5 h-3.5 rounded text-emerald-600"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={row.unitOrDomain}
                            onChange={(e) => handleUpdateField(row.id, 'unitOrDomain', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-white text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={row.skillTitle}
                            onChange={(e) => handleUpdateField(row.id, 'skillTitle', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-white text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={row.learningOutcome}
                            onChange={(e) => handleUpdateField(row.id, 'learningOutcome', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs bg-white text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.cognitiveLevel}
                            onChange={(e) => handleUpdateField(row.id, 'cognitiveLevel', e.target.value)}
                            className="w-full px-1.5 py-1 rounded border border-slate-200 text-[11px] bg-white font-medium"
                          >
                            <option value="استرجاع ومعرفة">استرجاع ومعرفة</option>
                            <option value="فهم وتطبيق">فهم وتطبيق</option>
                            <option value="استدلال وتحليل">استدلال وتحليل</option>
                            <option value="استدلال علمي وبراهين">استدلال وبراهين</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="حذف هذا الصف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-bold">
            الصف المستهدف: <span className="text-amber-700">{gradeNameMap[targetGrade]}</span> • الوجهة:{' '}
            <span className="text-emerald-700">
              {targetType === 'curriculum' ? 'المنهج ونواتج التعلم' : 'معايير نافس الوطنية'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleCommitImport}
              disabled={parsedRows.filter((r) => r.selected).length === 0}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                اعتماد واستيراد المهارات المحددة ({parsedRows.filter((r) => r.selected).length})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
