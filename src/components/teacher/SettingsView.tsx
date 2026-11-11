import React, { useState } from 'react';
import { PlatformSettings } from '../../types';
import { SchoolLogo } from '../SchoolLogo';
import { ClearableInput } from '../common/ClearableInput';
import {
  Settings,
  Shield,
  KeyRound,
  UserCheck,
  School,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Trophy,
  Upload,
  Image as ImageIcon,
  Trash2,
  User,
} from 'lucide-react';

interface SettingsViewProps {
  settings: PlatformSettings;
  onSaveSettings: (settings: PlatformSettings) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<PlatformSettings>({
    ...settings,
    principalName: settings.principalName || 'أ. فهد بن ناصر القحطاني',
    schoolLogoUrl: settings.schoolLogoUrl || '/assets/aistudio/tns_logo_transparent.png',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, SVG, WebP, JPG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, schoolLogoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToOfficialLogo = () => {
    setFormData((prev) => ({
      ...prev,
      schoolLogoUrl: '/assets/aistudio/tns_logo_transparent.png',
    }));
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `etqan-science-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              إعدادات المنصة وهوية المعلم والمدرسة
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تخصيص شعار المدارس، اسم مدير المدرسة، بيانات المعلم المشرف، كلمات المرور، ورمز الطلاب.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs sm:text-sm font-bold animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم حفظ وتحديث الإعدادات بنجاح في المنصة!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: School Logo Upload & Background-Free Verification */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-500" />
              <span>شعار مدارس التربية النموذجية (مفرغ وبدون خلفية)</span>
            </h3>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              معتمد مفرغ وبدون خلفية
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Logo Live Preview */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#0a1829] rounded-2xl border border-slate-700 min-w-[200px] shadow-inner text-center">
              <span className="text-[10px] text-slate-400 font-bold mb-2 block">
                معاينة الشعار المفرغ على خلفية داكنة:
              </span>
              <SchoolLogo size="md" showSubtitle={false} customLogoUrl={formData.schoolLogoUrl} />
            </div>

            {/* Upload & Reset Controls */}
            <div className="space-y-3 flex-1 w-full">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  رفع شعار المدارس المفرغ (مكان لرفع شعار المدارس):
                </label>
                <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                  يمكنك رفع ملف شعار المدارس بصيغة PNG أو SVG شفافة. يتم اعتماد الشعار المفرغ دائماً في كافة واجهات المنصة والشهادات والمستندات ولا يتم تغييره.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-2 shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>اختيار ملف شعار جديد</span>
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/webp,image/jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleResetToOfficialLogo}
                  className="py-2.5 px-3.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  title="استعادة الشعار الرسمي المفرغ المعتمد لمدارس التربية النموذجية"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>استعادة الشعار الرسمي المعتمد</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Administrative and Teacher Identity with Clear Buttons */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <School className="w-5 h-5 text-emerald-600" />
            <span>بيانات الإدارة المدرسية والمعلم المشرف</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Teacher Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المعلم المشرف:</label>
              <ClearableInput
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                onClear={() => setFormData({ ...formData, teacherName: '' })}
                placeholder="اسم المعلم المشرف..."
                required
              />
            </div>

            {/* School Principal Name (اسم مدير المدرسة كما طلب المستخدم) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم مدير المدرسة (يظهر في التقارير والشهادات الرسمية):
              </label>
              <ClearableInput
                value={formData.principalName || ''}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                onClear={() => setFormData({ ...formData, principalName: '' })}
                placeholder="أ. فهد بن ناصر القحطاني..."
                required
              />
            </div>

            {/* Teacher Separate Line Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                صيغة سطر إعداد المعلم (يظهر في سطر مستقل بمفرده):
              </label>
              <ClearableInput
                value={formData.teacherTitle}
                onChange={(e) => setFormData({ ...formData, teacherTitle: e.target.value })}
                onClear={() => setFormData({ ...formData, teacherTitle: '' })}
                placeholder="إعداد المعلم - محمد نادي سيد محمد"
                required
              />
            </div>

            {/* School Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المدرسة أو المجمع:</label>
              <ClearableInput
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                onClear={() => setFormData({ ...formData, schoolName: '' })}
                placeholder="مدارس التربية النموذجية..."
                required
              />
            </div>

            {/* Platform Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان المنصة الرئيسي:</label>
              <ClearableInput
                value={formData.platformTitle}
                onChange={(e) => setFormData({ ...formData, platformTitle: e.target.value })}
                onClear={() => setFormData({ ...formData, platformTitle: '' })}
                placeholder="منصة إتقان في العلوم..."
                required
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الوصف التوضيحي للمنصة:</label>
              <ClearableInput
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                onClear={() => setFormData({ ...formData, subtitle: '' })}
                placeholder="إدارة وتصميم اختبارات وقياس مهارات العلوم..."
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Passwords and PIN with Clear Buttons */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-5 h-5 text-amber-500" />
            <span>الصلاحيات ورموز الدخول السرية</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تحديث كلمة مرور لوحة المعلم المشرف
              </label>
              <ClearableInput
                type="password"
                dir="ltr"
                value={formData.teacherPassword}
                onChange={(e) => setFormData({ ...formData, teacherPassword: e.target.value })}
                onClear={() => setFormData({ ...formData, teacherPassword: '' })}
                placeholder="••••••••"
                className="text-center font-mono"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                كلمة المرور الافتراضية للمعلم: 10111983
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رمز الدخول السري الموحد للطلاب (PIN)
              </label>
              <ClearableInput
                type="text"
                dir="ltr"
                maxLength={6}
                value={formData.studentPin}
                onChange={(e) => setFormData({ ...formData, studentPin: e.target.value })}
                onClear={() => setFormData({ ...formData, studentPin: '' })}
                className="text-center font-mono font-bold tracking-widest"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                القيمة المعتمدة لجميع الطلاب: <strong>1234</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Gamification Settings with Clear Buttons */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Trophy className="w-5 h-5 text-amber-600" />
            <span>نظام التلعيب والنقاط والأوسمة العلمية</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نقاط كل إجابة صحيحة في الاختبار
              </label>
              <ClearableInput
                type="number"
                min={5}
                max={50}
                value={formData.pointsPerCorrectAnswer}
                onChange={(e) =>
                  setFormData({ ...formData, pointsPerCorrectAnswer: Number(e.target.value) })
                }
                onClear={() => setFormData({ ...formData, pointsPerCorrectAnswer: 10 })}
                className="text-center font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مكافأة إتمام الاختبار
              </label>
              <ClearableInput
                type="number"
                min={10}
                max={200}
                value={formData.pointsPerQuizCompletion}
                onChange={(e) =>
                  setFormData({ ...formData, pointsPerQuizCompletion: Number(e.target.value) })
                }
                onClear={() => setFormData({ ...formData, pointsPerQuizCompletion: 50 })}
                className="text-center font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مكافأة إتمام خطة علاجية واختبار موجه
              </label>
              <ClearableInput
                type="number"
                min={20}
                max={300}
                value={formData.pointsPerSimulationCompletion}
                onChange={(e) =>
                  setFormData({ ...formData, pointsPerSimulationCompletion: Number(e.target.value) })
                }
                onClear={() => setFormData({ ...formData, pointsPerSimulationCompletion: 100 })}
                className="text-center font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق التعديلات</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير نسخة احتياطية</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'هل أنت متأكد من استعادة بيانات المنصة الافتراضية؟ سيتم إعادة ضبط الإعدادات والأسئلة والشعب.'
                )
              ) {
                onResetData();
              }
            }}
            className="py-2.5 px-4 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition border border-transparent hover:border-rose-200 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>استعادة الإعدادات الأولية</span>
          </button>
        </div>
      </form>
    </div>
  );
};
