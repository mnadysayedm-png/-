import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { GradeLevel, Section, Student } from '../../types';
import { storageService } from '../../services/storageService';
import { ClearableTextarea, ClearableInput } from '../common/ClearableInput';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  Sparkles,
  Trash2,
  ArrowRight,
  Check,
  HelpCircle,
  UserCheck,
} from 'lucide-react';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  selectedGrade: GradeLevel;
  onImportStudents: (students: Omit<Student, 'id' | 'createdAt'>[], purgeMock: boolean) => void;
  onPurgeMockStudents?: () => void;
  onAddSectionIfNeeded?: (grade: GradeLevel, name: string) => Section;
}

interface ParsedStudentRow {
  id: string;
  name: string;
  sectionCode: string; // "1", "2", "3", "4"
  targetSectionId: string;
  sourceText?: string;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  onClose,
  sections,
  selectedGrade,
  onImportStudents,
  onPurgeMockStudents,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'file' | 'paste'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [distributionMode, setDistributionMode] = useState<'auto_file' | 'round_robin' | 'specific_section'>('auto_file');
  const [manualSectionId, setManualSectionId] = useState<string>('');
  const [importSummary, setImportSummary] = useState<string | null>(null);

  // New option: Purge mock/dummy students when importing targeted students
  const [purgeMockOnImport, setPurgeMockOnImport] = useState<boolean>(true);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const gradeNameMap: Record<GradeLevel, string> = {
    '4': 'الصف الرابع الابتدائي',
    '5': 'الصف الخامس الابتدائي',
    '6': 'الصف السادس الابتدائي',
  };

  // Sections for this grade, sorted by standard numerical order: 1, 2, 3, 4
  const gradeSections = sections
    .filter((s) => s.grade === selectedGrade)
    .sort((a, b) => {
      const numA = parseInt(a.name, 10) || 99;
      const numB = parseInt(b.name, 10) || 99;
      return numA - numB;
    });

  // Precise mapping: 1, 2, 3, 4, ١, ٢, ٣, ٤, or letters أ, ب, ج, د -> 1, 2, 3, 4
  const mapTokenToSection = (token: string): Section | undefined => {
    const clean = token.replace(/شعبة|فصل|صف|مجموعة/g, '').trim();
    const numMap: Record<string, string> = {
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      'أ': '1',
      'ب': '2',
      'ج': '3',
      'د': '4',
      'هـ': '5',
    };

    const targetNumber = numMap[clean] || clean;

    return (
      gradeSections.find((s) => s.name === targetNumber) ||
      gradeSections.find((s) => s.label.includes(targetNumber)) ||
      gradeSections.find((s) => s.name === clean)
    );
  };

  // Helper to re-distribute parsed students based on mode
  const applyDistribution = (
    rows: ParsedStudentRow[],
    mode: 'auto_file' | 'round_robin' | 'specific_section',
    fixedSecId?: string
  ): ParsedStudentRow[] => {
    if (gradeSections.length === 0) return rows;

    if (mode === 'specific_section' && fixedSecId) {
      const sec = gradeSections.find((s) => s.id === fixedSecId) || gradeSections[0];
      return rows.map((r) => ({
        ...r,
        targetSectionId: sec.id,
        sectionCode: sec.name,
      }));
    }

    if (mode === 'round_robin') {
      // Distribute evenly among sections 1, 2, 3, 4
      return rows.map((r, idx) => {
        const secIndex = idx % gradeSections.length;
        const assignedSec = gradeSections[secIndex];
        return {
          ...r,
          targetSectionId: assignedSec.id,
          sectionCode: assignedSec.name,
        };
      });
    }

    // mode === 'auto_file' (try to keep detected token or fallback to round robin 1-2-3-4)
    return rows.map((r, idx) => {
      let sec = mapTokenToSection(r.sectionCode);
      if (!sec) {
        const secIndex = idx % gradeSections.length;
        sec = gradeSections[secIndex];
      }
      return {
        ...r,
        targetSectionId: sec ? sec.id : (gradeSections[0]?.id || ''),
        sectionCode: sec ? sec.name : '1',
      };
    });
  };

  // 1. Process Excel (.xlsx, .xls, .csv)
  const handleExcelFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setFileName(file.name);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      const extracted: ParsedStudentRow[] = [];

      jsonData.forEach((row, rowIndex) => {
        if (!Array.isArray(row) || row.length === 0) return;

        // Skip headers if first row contains non-student strings
        const rowStr = row.join(' ');
        if (
          rowIndex === 0 &&
          (rowStr.includes('اسم') ||
            rowStr.includes('الطالب') ||
            rowStr.includes('الشعبة') ||
            rowStr.includes('الرقم'))
        ) {
          return;
        }

        // Identify student name and possible section column (1, 2, 3, 4)
        let foundName = '';
        let foundSectionCode = '';

        for (let cell of row) {
          if (!cell) continue;
          const str = String(cell).trim();
          // Arabic full name check (2 or more words)
          if (!foundName && str.length > 5 && /^[\u0600-\u06FF\s]+$/.test(str) && str.split(/\s+/).length >= 2) {
            foundName = str;
          } else if (
            !foundSectionCode &&
            (/^[1-4١-٤]$/.test(str) ||
              /^(شعبة|فصل)?\s*[1-4١-٤أ-د]$/i.test(str) ||
              ['أ', 'ب', 'ج', 'د', '1', '2', '3', '4'].includes(str))
          ) {
            foundSectionCode = str;
          }
        }

        if (foundName) {
          extracted.push({
            id: `temp-${rowIndex}-${Date.now().toString(36)}`,
            name: foundName,
            sectionCode: foundSectionCode || '1',
            targetSectionId: '',
          });
        }
      });

      const finalized = applyDistribution(extracted, distributionMode, manualSectionId);
      setParsedRows(finalized);
      setImportSummary(`تم التعرف على ${finalized.length} طالب بنجاح من ملف الإكسل وتصنيفهم حسب الشعب (1-2-3-4).`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء قراءة ملف الإكسل. يرجى التأكد من صحة الملف.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Process Word or Text
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
            text = matches.map((m) => m.replace(/<w:t[^>]*>|<\/w:t>/g, '')).join(' ');
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
      alert('حدث خطأ أثناء معالجة الملف. يمكنك نسخ الأسماء ولصقها في التبويب الآخر.');
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

  // Parse Raw Text Lines (Word, Text, or Paste)
  const parseRawTextLines = (content: string) => {
    const lines = content.split(/[\r\n]+/);
    const extracted: ParsedStudentRow[] = [];

    lines.forEach((line, idx) => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.length < 4) return;
      if (cleanLine.includes('اسم الطالب') || cleanLine.includes('كشف درجات') || cleanLine.includes('المملكة العربية'))
        return;

      // Extract section: e.g. "شعبة 1", "شعبة 2", "[1]", "شعبة 4"
      let sectionCode = '';
      const sectionMatch = cleanLine.match(/(?:شعبة|فصل|مجموعة)?\s*([1-4١-٤أ-د])\b/);
      if (sectionMatch) {
        sectionCode = sectionMatch[1];
      }

      // Clean name: remove numbers, bullets, commas, dashes
      const studentName = cleanLine
        .replace(/^\d+[\.\-\)]\s*/, '')
        .replace(/(?:شعبة|فصل|مجموعة)?\s*[1-4١-٤أ-د]/g, '')
        .replace(/[,;\|\t]/g, ' ')
        .trim();

      const words = studentName.split(/\s+/).filter((w) => w.length > 1);
      if (words.length >= 2) {
        extracted.push({
          id: `text-row-${idx}-${Date.now().toString(36)}`,
          name: words.slice(0, 4).join(' '),
          sectionCode: sectionCode || '1',
          targetSectionId: '',
          sourceText: cleanLine,
        });
      }
    });

    const finalized = applyDistribution(extracted, distributionMode, manualSectionId);
    setParsedRows(finalized);
    setImportSummary(`تم استخراج ${finalized.length} طالب بنجاح وتصنيفهم بدقة حسب الشعب (1 - 2 - 3 - 4).`);
  };

  const handleUpdateStudentSection = (rowId: string, newSecId: string) => {
    const sec = gradeSections.find((s) => s.id === newSecId);
    setParsedRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, targetSectionId: newSecId, sectionCode: sec?.name || '1' } : r))
    );
  };

  const handleRemoveRow = (rowId: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleClearAllParsed = () => {
    setParsedRows([]);
    setFileName('');
    setRawText('');
    setImportSummary(null);
  };

  // Immediate Purge Mock Students Button Action
  const handleImmediatePurgeMock = () => {
    if (window.confirm('هل تريد حذف وتطهير كافة الأسماء الوهمية والتجريبية من النظام الآن؟')) {
      const res = storageService.purgeMockStudents(selectedGrade);
      if (onPurgeMockStudents) onPurgeMockStudents();
      setQuickNotification(`تم حذف ${res.purgedCount} اسم وهمي وتجريبي بنجاح! المتبقي: ${res.remainingCount} طالب حقيقي.`);
      setTimeout(() => setQuickNotification(null), 4000);
    }
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) {
      alert('لا توجد بيانات طلاب للاستيراد!');
      return;
    }

    const studentsToImport: Omit<Student, 'id' | 'createdAt'>[] = parsedRows.map((r) => ({
      name: r.name,
      grade: selectedGrade,
      sectionId: r.targetSectionId || (gradeSections[0]?.id || `sec-${selectedGrade}-1`),
    }));

    onImportStudents(studentsToImport, purgeMockOnImport);
    onClose();
  };

  // Accurate Section 1-2-3-4 Counts
  const sectionCounts = gradeSections.map((sec) => ({
    sec,
    count: parsedRows.filter((r) => r.targetSectionId === sec.id).length,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Upload className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black">
                إرفاق واستيراد أسماء الطلاب وتصنيف الشعب (1 - 2 - 3 - 4)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {gradeNameMap[selectedGrade]} • يدعم Word و Excel و PDF وحذف الأسماء الوهمية تلقائياً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick notification banner */}
        {quickNotification && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>{quickNotification}</span>
            </div>
            <button onClick={() => setQuickNotification(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Method tabs + Immediate Mock Cleanup Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveInputTab('file')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
                  activeInputTab === 'file'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileUp className="w-4 h-4" />
                <span>إرفاق ملف (Word / Excel / PDF)</span>
              </button>

              <button
                onClick={() => setActiveInputTab('paste')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
                  activeInputTab === 'paste'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>نسخ ولصق قائمة نصية</span>
              </button>
            </div>

            {/* Direct Purge Mock Students Button */}
            <button
              type="button"
              onClick={handleImmediatePurgeMock}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs"
              title="حذف الأسماء الوهمية والتجريبية المرفقة مسبقاً"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف الأسماء الوهمية المرفقة الآن</span>
            </button>
          </div>

          {/* Option: Checkbox to purge mock students upon import */}
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-300 flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-amber-950 select-none">
              <input
                type="checkbox"
                checked={purgeMockOnImport}
                onChange={(e) => setPurgeMockOnImport(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <span>
                <strong>حذف وتطهير الأسماء الوهمية والتجريبية السابقة</strong> عند استيراد هذه الأسماء المستهدفة (لضمان كشف نظيف وحقيقي)
              </span>
            </label>
            <span className="text-[11px] font-black px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 shrink-0">
              موصى به ✓
            </span>
          </div>

          {/* Tab 1: File Upload Box */}
          {activeInputTab === 'file' && (
            <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 text-center bg-emerald-50/30 transition group cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.docx,.doc,.txt,.pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-3 pointer-events-none">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    اضغط هنا لإرفاق كشف الطلاب المستهدفين أو اسحب الملف إلى هنا
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    صيغ الملفات المدعومة: <strong>Excel (.xlsx, .xls, .csv)</strong> أو <strong>Word (.docx)</strong> أو <strong>نصي (.txt)</strong>
                  </p>
                </div>
                {fileName && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-full text-xs font-bold pointer-events-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الملف المحدد: {fileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName('');
                        setParsedRows([]);
                        setImportSummary(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                      title="مسح الملف"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Raw Text Paste with Clear Button */}
          {activeInputTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  الصق كشف الأسماء هنا (يدعم: اسم الطالب والشعبة مثل: فهد القحطاني - شعبة 1):
                </label>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => setRawText('')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>مسح المدخلات بالكامل</span>
                  </button>
                )}
              </div>

              <ClearableTextarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                onClear={() => setRawText('')}
                placeholder="1- أحمد زياد القرني - شعبة 1&#10;2- فيصل سعود العتيبي - شعبة 2&#10;3- عبدالعزيز سامي العسيري - شعبة 3&#10;4- نواف رائد الصالح - شعبة 4..."
                className="font-mono leading-relaxed"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => parseRawTextLines(rawText)}
                  disabled={!rawText.trim()}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تحليل وتصنيف الأسماء للشعب (1 - 2 - 3 - 4)</span>
                </button>

                {rawText.trim() && (
                  <button
                    type="button"
                    onClick={() => setRawText('')}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold border border-slate-200 transition"
                  >
                    مسح النص
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Classification Options into الشعب 1 - 2 - 3 - 4 */}
          {parsedRows.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>طريقة تصنيف وتوزيع الطلاب على الشعب بدقة (1، 2، 3، 4):</span>
                </span>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button
                    onClick={() => {
                      setDistributionMode('auto_file');
                      setParsedRows(applyDistribution(parsedRows, 'auto_file'));
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      distributionMode === 'auto_file'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    حسب الشعبة المذكورة بالملف (1-4)
                  </button>

                  <button
                    onClick={() => {
                      setDistributionMode('round_robin');
                      setParsedRows(applyDistribution(parsedRows, 'round_robin'));
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      distributionMode === 'round_robin'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    توزيع متساوٍ (شعبة 1، 2، 3، 4)
                  </button>

                  <select
                    value={manualSectionId}
                    onChange={(e) => {
                      const secId = e.target.value;
                      setManualSectionId(secId);
                      setDistributionMode('specific_section');
                      setParsedRows(applyDistribution(parsedRows, 'specific_section', secId));
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white font-bold text-xs"
                  >
                    <option value="">تخصيص جميع الطلاب لشعبة محددة...</option>
                    {gradeSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        جميع الطلاب إلى (شعبة {sec.name})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleClearAllParsed}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="مسح كافة الأسماء المستخرجة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Exact Counts Badge Per Section (1 - 2 - 3 - 4) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                {sectionCounts.map(({ sec, count }) => (
                  <div key={sec.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-bold block">الشعبة {sec.name} ({sec.label})</span>
                    <strong className="text-base font-black text-emerald-700 font-mono">{count} طالب</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Students Table Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>معاينة وتعديل قائمة الطلاب المستخرجة ({parsedRows.length} طالب مستهدف):</span>
                </span>
                <span className="text-slate-400">يمكنك تعديل شعبة أي طالب (1، 2، 3، 4) مباشرة من الجدول</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-64 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#0f2137] text-white font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">#</th>
                      <th className="py-2.5 px-4 font-black">اسم الطالب المستهدف</th>
                      <th className="py-2.5 px-4">الشعبة المصنفة (1 - 2 - 3 - 4)</th>
                      <th className="py-2.5 px-3 text-center w-16">مسح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-4 font-bold text-slate-900">{row.name}</td>
                        <td className="py-2 px-4">
                          <select
                            value={row.targetSectionId}
                            onChange={(e) => handleUpdateStudentSection(row.id, e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white font-bold"
                          >
                            {gradeSections.map((sec) => (
                              <option key={sec.id} value={sec.id}>
                                الشعبة {sec.name} - ({sec.label})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="حذف هذا الاسم"
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

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            {parsedRows.length > 0 ? (
              <span>
                جاهز لاعتماد <strong>{parsedRows.length} طالب مستهدف</strong> في {gradeNameMap[selectedGrade]}
                {purgeMockOnImport && ' مع حذف الأسماء الوهمية'}
              </span>
            ) : (
              <span>يرجى اختيار ملف أو لصق قائمة الأسماء لبدء الاستيراد</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2.5 px-4 border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-100 transition"
            >
              إلغاء
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={parsedRows.length === 0}
              className="flex-1 sm:flex-initial py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Check className="w-4 h-4" />
              <span>اعتماد واستيراد الطلاب المستهدفين ({parsedRows.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
