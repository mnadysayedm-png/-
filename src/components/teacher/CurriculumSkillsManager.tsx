import React, { useState, useEffect } from 'react';
import { GradeLevel, PlatformSettings } from '../../types';
import { storageService } from '../../services/storageService';
import {
  CurriculumSkillItem,
  exportCurriculumToWord,
  exportCurriculumToExcel,
} from '../../utils/exportUtils';
import {
  BookOpen,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Award,
  Search,
  Filter,
  GraduationCap,
  Layers,
  Upload,
} from 'lucide-react';
import { CurriculumImportModal } from './CurriculumImportModal';
import { ClearableInput, ClearableTextarea } from '../common/ClearableInput';

interface CurriculumSkillsManagerProps {
  settings: PlatformSettings;
  defaultMode?: 'curriculum' | 'nafes' | 'both';
}

export const CurriculumSkillsManager: React.FC<CurriculumSkillsManagerProps> = ({
  settings,
  defaultMode = 'both',
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('4');
  const [activeSectionType, setActiveSectionType] = useState<'curriculum' | 'nafes'>(
    defaultMode === 'nafes' ? 'nafes' : 'curriculum'
  );
  const [items, setItems] = useState<CurriculumSkillItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Typing Form State for Curriculum Section (إرفاقه بالكتابة)
  const [curriculumForm, setCurriculumForm] = useState({
    unitOrDomain: '',
    skillTitle: '',
    learningOutcome: '',
    performanceIndicator: '',
    cognitiveLevel: 'فهم وتطبيق',
    masteryPercentageTarget: 80,
    notes: '',
  });

  // Typing Form State for Nafes Section (إرفاقه بالكتابة)
  const [nafesForm, setNafesForm] = useState({
    unitOrDomain: 'مجال علوم الحياة',
    skillTitle: '',
    learningOutcome: '',
    performanceIndicator: '',
    cognitiveLevel: 'استدلال علمي وبراهين',
    masteryPercentageTarget: 85,
    notes: '',
  });

  const [notification, setNotification] = useState<string | null>(null);

  const handleImportBulkSkills = (imported: Omit<CurriculumSkillItem, 'id'>[]) => {
    const saved = storageService.addBulkCurriculumSkills(imported);
    setItems((prev) => [...saved, ...prev]);
    showToast(`تم بنجاح إرفاق واستيراد ${saved.length} مهارة وناتج تعلم وإضافتها إلى المنهج ✓`);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const loaded = storageService.getCurriculumSkills();
    setItems(loaded);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Clear inputs handlers (زر لمسح المدخلات في كل قسم)
  const handleClearCurriculumForm = () => {
    setCurriculumForm({
      unitOrDomain: '',
      skillTitle: '',
      learningOutcome: '',
      performanceIndicator: '',
      cognitiveLevel: 'فهم وتطبيق',
      masteryPercentageTarget: 80,
      notes: '',
    });
    showToast('تم مسح جميع مدخلات قسم المنهج بنجاح');
  };

  const handleClearNafesForm = () => {
    setNafesForm({
      unitOrDomain: 'مجال علوم الحياة',
      skillTitle: '',
      learningOutcome: '',
      performanceIndicator: '',
      cognitiveLevel: 'استدلال علمي وبراهين',
      masteryPercentageTarget: 85,
      notes: '',
    });
    showToast('تم مسح جميع مدخلات قسم نافس بنجاح');
  };

  // Add Curriculum Skill by typing (إرفاقه بالكتابة)
  const handleAddCurriculumItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curriculumForm.skillTitle.trim() || !curriculumForm.learningOutcome.trim()) {
      showToast('يرجى كتابة المهارة وناتج التعلم المستهدف');
      return;
    }

    const newItem = storageService.addCurriculumSkill({
      grade: selectedGrade,
      type: 'curriculum',
      unitOrDomain: curriculumForm.unitOrDomain.trim() || 'الوحدة العامة',
      skillTitle: curriculumForm.skillTitle.trim(),
      learningOutcome: curriculumForm.learningOutcome.trim(),
      performanceIndicator: curriculumForm.performanceIndicator.trim() || 'إتقان المهارة بدقة 80% فما فوق',
      cognitiveLevel: curriculumForm.cognitiveLevel,
      masteryPercentageTarget: Number(curriculumForm.masteryPercentageTarget) || 80,
      notes: curriculumForm.notes.trim(),
    });

    setItems((prev) => [newItem, ...prev]);
    handleClearCurriculumForm();
    showToast('تمت إضافة المهارة وناتج التعلم إلى المنهج بنجاح ✓');
  };

  // Add Nafes Skill by typing (إرفاقه بالكتابة)
  const handleAddNafesItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nafesForm.skillTitle.trim() || !nafesForm.learningOutcome.trim()) {
      showToast('يرجى كتابة مؤشر نافس وناتج التعلم المستهدف');
      return;
    }

    const newItem = storageService.addCurriculumSkill({
      grade: selectedGrade,
      type: 'nafes',
      unitOrDomain: nafesForm.unitOrDomain,
      skillTitle: nafesForm.skillTitle.trim(),
      learningOutcome: nafesForm.learningOutcome.trim(),
      performanceIndicator: nafesForm.performanceIndicator.trim() || 'معيار نافس الوزاري للعلوم',
      cognitiveLevel: nafesForm.cognitiveLevel,
      masteryPercentageTarget: Number(nafesForm.masteryPercentageTarget) || 85,
      notes: nafesForm.notes.trim(),
    });

    setItems((prev) => [newItem, ...prev]);
    handleClearNafesForm();
    showToast('تمت إضافة معيار ومؤشر نافس الوطني بنجاح ✓');
  };

  const handleDeleteItem = (id: string) => {
    storageService.deleteCurriculumSkill(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('تم حذف المهارة من القائمة');
  };

  // Filter items for current tab
  const gradeLabelMap: Record<GradeLevel, string> = {
    '4': 'الصف الرابع الابتدائي',
    '5': 'الصف الخامس الابتدائي',
    '6': 'الصف السادس الابتدائي',
  };

  const currentGradeLabel = gradeLabelMap[selectedGrade];

  const filteredItems = items.filter((item) => {
    if (item.grade !== selectedGrade) return false;
    if (item.type !== activeSectionType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = item.skillTitle.toLowerCase().includes(q);
      const inOutcome = item.learningOutcome.toLowerCase().includes(q);
      const inUnit = item.unitOrDomain.toLowerCase().includes(q);
      return inTitle || inOutcome || inUnit;
    }
    return true;
  });

  // Downloads for current section
  const handleDownloadWord = () => {
    exportCurriculumToWord(
      currentGradeLabel,
      filteredItems,
      settings,
      activeSectionType === 'nafes'
    );
  };

  const handleDownloadExcel = () => {
    exportCurriculumToExcel(
      currentGradeLabel,
      filteredItems,
      settings,
      activeSectionType === 'nafes'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-xl font-bold text-xs sm:text-sm animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
              <GraduationCap className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                إدارة المناهج ومهاراتها ونواتج التعلم ومؤشرات نافس
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                تحديد ومتابعة نواتج التعلم الوزارية ومعايير الاختبار الوطني نافس لكل صف دراسي (الرابع - الخامس - السادس)
              </p>
            </div>
          </div>
        </div>

        {/* Global Import & Export Buttons for Section */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Button to attach / import content, skills & learning outcomes in Word, Excel, PDF */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 transition active:scale-95"
            title="إرفاق المحتوى والمهارات والنواتج المستهدفة بصيغة Word أو Excel أو PDF"
          >
            <Upload className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>إرفاق المحتوى والمهارات والنواتج (Word / Excel / PDF) 📁</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition"
            title="تحميل جدول المهارات بصيغة Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تحميل Excel</span>
          </button>

          <button
            onClick={handleDownloadWord}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition"
            title="تحميل وثيقة المهارات بصيغة Word مع شعار المدارس وبيانات المعلم"
          >
            <FileText className="w-4 h-4" />
            <span>تحميل Word</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-xs transition"
            title="طباعة أو تصدير PDF"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة PDF</span>
          </button>
        </div>
      </div>

      {/* Grade Selector Tabs (الرابع - الخامس - السادس) */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0B192C] p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 px-2 hidden sm:inline">اختر الصف:</span>
          {(['4', '5', '6'] as GradeLevel[]).map((gr) => (
            <button
              key={gr}
              onClick={() => setSelectedGrade(gr)}
              className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-2 ${
                selectedGrade === gr
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{gradeLabelMap[gr]}</span>
            </button>
          ))}
        </div>

        {/* Section Type Switcher (المنهج ومهاراته ونواتج التعلم vs قياس مهارات ونواتج نافس) */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveSectionType('curriculum')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSectionType === 'curriculum'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>المنهج ومهاراته ونواتج التعلم</span>
          </button>

          <button
            onClick={() => setActiveSectionType('nafes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSectionType === 'nafes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>قياس مهارات ونواتج نافس</span>
          </button>
        </div>
      </div>

      {/* Active Section Content */}
      {activeSectionType === 'curriculum' ? (
        /* ========================================================
           قسم 1: المنهج ومهاراته ونواتج التعلم
           ======================================================== */
        <div className="space-y-6">
          {/* Section 1 Typing / Attachment Form (إرفاقه بالكتابة مع زر مسح المدخلات) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/30 shadow-sm space-y-4">
            {/* Quick File Attachment Callout (Word / Excel / PDF) */}
            <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                  <Upload className="w-4 h-4" />
                </span>
                <div>
                  <strong className="text-amber-950 block font-black">
                    إرفاق واستيراد المحتوى والمهارات والنواتج (Word / Excel / PDF):
                  </strong>
                  <span className="text-amber-800 text-[11px] leading-relaxed block">
                    يمكنك إرفاق ملف المنهج أو جدول المهارات مباشرة واستخراج النواتج بدقة، أو إدخالها يدوياً أدناه.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>إرفاق واستيراد من ملف الآن 📄</span>
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  ✍️
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800">
                    إرفاق مهارة وناتج تعلم جديد بالكتابة (يدوي) - {currentGradeLabel}
                  </h3>
                  <p className="text-xs text-slate-500">
                    أدخل ناتج التعلم أو المهارة المستهدفة بالكتابة لحفظها وإضافتها لوثائق المنهج الرسمية
                  </p>
                </div>
              </div>

              {/* زر لمسح المدخلات في كل قسم */}
              <button
                type="button"
                onClick={handleClearCurriculumForm}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>مسح المدخلات</span>
              </button>
            </div>

            <form onSubmit={handleAddCurriculumItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الوحدة الدراسية / الفصل:
                  </label>
                  <ClearableInput
                    type="text"
                    placeholder="مثال: الوحدة الأولى: الخلايا والمخلوقات الحية"
                    value={curriculumForm.unitOrDomain}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, unitOrDomain: e.target.value })}
                    onClear={() => setCurriculumForm({ ...curriculumForm, unitOrDomain: '' })}
                    className="text-xs sm:text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المهارة العلمية المستهدفة: *
                  </label>
                  <ClearableInput
                    type="text"
                    required
                    placeholder="مثال: المقارنة بين الخلية النباتية والحيوانية"
                    value={curriculumForm.skillTitle}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, skillTitle: e.target.value })}
                    onClear={() => setCurriculumForm({ ...curriculumForm, skillTitle: '' })}
                    className="text-xs sm:text-sm bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المستوى المعرفي:
                  </label>
                  <select
                    value={curriculumForm.cognitiveLevel}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, cognitiveLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="استرجاع ومعرفة">استرجاع ومعرفة</option>
                    <option value="فهم وتطبيق">فهم وتطبيق</option>
                    <option value="استدلال وتحليل">استدلال وتحليل</option>
                    <option value="تقويم وابتكار">تقويم وابتكار</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ناتج التعلم المستهدف (معيار الإتقان): *
                  </label>
                  <ClearableTextarea
                    rows={2}
                    required
                    placeholder="أن يحدد الطالب بدقة الفروق التركيبية الرئيسية بين الخلية النباتية والحيوانية..."
                    value={curriculumForm.learningOutcome}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, learningOutcome: e.target.value })}
                    onClear={() => setCurriculumForm({ ...curriculumForm, learningOutcome: '' })}
                    className="text-xs sm:text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مؤشر الأداء وقياس المهارة:
                  </label>
                  <ClearableTextarea
                    rows={2}
                    placeholder="يرسم الطالب أو يصنف عضيات الخلية النباتية (الجدار، البلاستيدات) في بطاقة المقارنة..."
                    value={curriculumForm.performanceIndicator}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, performanceIndicator: e.target.value })}
                    onClear={() => setCurriculumForm({ ...curriculumForm, performanceIndicator: '' })}
                    className="text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نسبة الإتقان المستهدفة (%):
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={curriculumForm.masteryPercentageTarget}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, masteryPercentageTarget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    توجيهات تدريسية وعلاجية (اختياري):
                  </label>
                  <ClearableInput
                    type="text"
                    placeholder="مثال: تطبيق ورقة عمل علاجية ونشاط تدريبي مركز..."
                    value={curriculumForm.notes}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, notes: e.target.value })}
                    onClear={() => setCurriculumForm({ ...curriculumForm, notes: '' })}
                    className="text-xs sm:text-sm bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إرفاق بالكتابة والحفظ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCurriculumForm}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    title="مسح المدخلات"
                  >
                    مسح
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Curriculum Skills List / Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  مهارات ونواتج منهج العلوم المعتمدة ({currentGradeLabel})
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {filteredItems.length} ناتج تعلم
                </span>
              </div>

              {/* Search input with ClearableInput */}
              <div className="w-64">
                <ClearableInput
                  type="text"
                  placeholder="بحث في المهارات والنواتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  className="text-xs py-1.5 bg-white"
                />
              </div>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 gap-3.5">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-white transition space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                        {item.unitOrDomain}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {item.skillTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        المستهدف: {item.masteryPercentageTarget}%
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="حذف المهارة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div>
                      <strong className="text-slate-800">ناتج التعلم: </strong>
                      <span>{item.learningOutcome}</span>
                    </div>
                    <div>
                      <strong className="text-slate-800">مؤشر الأداء: </strong>
                      <span>{item.performanceIndicator}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                      💡 <strong>توجيه:</strong> {item.notes}
                    </div>
                  )}
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs sm:text-sm">
                  لا توجد مهارات مسجلة مطابقة للبحث. يمكنك كتابة وإرفاق مهارة جديدة أعلاه.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
           قسم 2: قياس مهارات ونواتج نافس الوطنية
           ======================================================== */
        <div className="space-y-6">
          {/* Section 2 Typing / Attachment Form (إرفاقه بالكتابة مع زر مسح المدخلات) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-blue-500/30 shadow-sm space-y-4">
            {/* Quick File Attachment Callout (Word / Excel / PDF) */}
            <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-800 rounded-xl shrink-0">
                  <Upload className="w-4 h-4" />
                </span>
                <div>
                  <strong className="text-blue-950 block font-black">
                    إرفاق واستيراد معايير ومؤشرات نافس (Word / Excel / PDF):
                  </strong>
                  <span className="text-blue-800 text-[11px] leading-relaxed block">
                    يمكنك استيراد وثيقة معايير نافس الوزارية مباشرة من ملف جاهز أو إدخالها يدوياً.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>إرفاق واستيراد من ملف الآن 📄</span>
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  🎯
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800">
                    إرفاق معيار ومؤشر نافس الوطني بالكتابة (يدوي) - {currentGradeLabel}
                  </h3>
                  <p className="text-xs text-slate-500">
                    إضافة مؤشرات أداء اختبارات نافس الوطنية في العلوم حسب مجالات هيئة تقويم التعليم والتدريب
                  </p>
                </div>
              </div>

              {/* زر لمسح المدخلات في كل قسم */}
              <button
                type="button"
                onClick={handleClearNafesForm}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>مسح المدخلات</span>
              </button>
            </div>

            <form onSubmit={handleAddNafesItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مجال نافس العلمي:
                  </label>
                  <select
                    value={nafesForm.unitOrDomain}
                    onChange={(e) => setNafesForm({ ...nafesForm, unitOrDomain: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="مجال علوم الحياة (Life Science)">مجال علوم الحياة (Life Science)</option>
                    <option value="مجال العلوم الفيزيائية (Physical Science)">مجال العلوم الفيزيائية (Physical Science)</option>
                    <option value="مجال علوم الأرض والفضاء (Earth & Space)">مجال علوم الأرض والفضاء (Earth & Space)</option>
                    <option value="العمليات والمهارات العلمية الاستقصائية">العمليات والمهارات العلمية الاستقصائية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مؤشر نافس المستهدف: *
                  </label>
                  <ClearableInput
                    type="text"
                    required
                    placeholder="مثال: مؤشر نافس BIO-01: السلاسل والشبكات الغذائية"
                    value={nafesForm.skillTitle}
                    onChange={(e) => setNafesForm({ ...nafesForm, skillTitle: e.target.value })}
                    onClear={() => setNafesForm({ ...nafesForm, skillTitle: '' })}
                    className="text-xs sm:text-sm bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المستوى المعرفي لنافس:
                  </label>
                  <select
                    value={nafesForm.cognitiveLevel}
                    onChange={(e) => setNafesForm({ ...nafesForm, cognitiveLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="معرفة واسترجاع">معرفة واسترجاع</option>
                    <option value="تطبيق علمي">تطبيق علمي</option>
                    <option value="استدلال علمي وبراهين">استدلال علمي وبراهين</option>
                    <option value="تفكير استقصائي وحل مشكلات">تفكير استقصائي وحل مشكلات</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ناتج تعلم نافس المستهدف: *
                  </label>
                  <ClearableTextarea
                    rows={2}
                    required
                    placeholder="القدرة على استنتاج أثر التغير في أعداد المفترسات على الشبكة الغذائية الطبيعية..."
                    value={nafesForm.learningOutcome}
                    onChange={(e) => setNafesForm({ ...nafesForm, learningOutcome: e.target.value })}
                    onClear={() => setNafesForm({ ...nafesForm, learningOutcome: '' })}
                    className="text-xs sm:text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مؤشر ومعيار القياس الوطني:
                  </label>
                  <ClearableTextarea
                    rows={2}
                    placeholder="يجيب الطالب عن أسئلة سيناريوهات نافس الاستقصائية بنسبة دقة لا تقل عن 85%..."
                    value={nafesForm.performanceIndicator}
                    onChange={(e) => setNafesForm({ ...nafesForm, performanceIndicator: e.target.value })}
                    onClear={() => setNafesForm({ ...nafesForm, performanceIndicator: '' })}
                    className="text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نسبة الإتقان المستهدفة (%):
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={nafesForm.masteryPercentageTarget}
                    onChange={(e) => setNafesForm({ ...nafesForm, masteryPercentageTarget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ملاحظات ومرجع المعيار الوطني:
                  </label>
                  <ClearableInput
                    type="text"
                    placeholder="مثال: متوافق مع الإطار المرجعي لنافس الصف الرابع..."
                    value={nafesForm.notes}
                    onChange={(e) => setNafesForm({ ...nafesForm, notes: e.target.value })}
                    onClear={() => setNafesForm({ ...nafesForm, notes: '' })}
                    className="text-xs sm:text-sm bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إرفاق بالكتابة والحفظ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearNafesForm}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    title="مسح المدخلات"
                  >
                    مسح
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Nafes Skills List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  معايير ومؤشرات اختبارات نافس الوطنية ({currentGradeLabel})
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  {filteredItems.length} مؤشر وطني
                </span>
              </div>

              {/* Search input with ClearableInput */}
              <div className="w-64">
                <ClearableInput
                  type="text"
                  placeholder="بحث في مؤشرات نافس..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  className="text-xs py-1.5 bg-white"
                />
              </div>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 gap-3.5">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-blue-50/20 hover:bg-white transition space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-extrabold text-blue-800 bg-blue-100/80 px-2.5 py-0.5 rounded-md">
                        {item.unitOrDomain}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {item.skillTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        مستهدف نافس: {item.masteryPercentageTarget}%
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="حذف المؤشر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div>
                      <strong className="text-slate-800">ناتج التعلم المستهدف: </strong>
                      <span>{item.learningOutcome}</span>
                    </div>
                    <div>
                      <strong className="text-slate-800">مؤشر القياس الوطني: </strong>
                      <span>{item.performanceIndicator}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="text-[11px] text-blue-900 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                      📌 <strong>معيار:</strong> {item.notes}
                    </div>
                  )}
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs sm:text-sm">
                  لا توجد مؤشرات نافس مسجلة. يمكنك كتابة وإرفاق مؤشر نافس جديد أعلاه أو إرفاق ملف جاهز.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Word / Excel / PDF / Text Curriculum Skills Import */}
      <CurriculumImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedGrade={selectedGrade}
        activeType={activeSectionType}
        onImportSkills={handleImportBulkSkills}
      />
    </div>
  );
};
