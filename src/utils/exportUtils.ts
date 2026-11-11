/**
 * Export utility for Etqan Science Platform
 * Supports Word (.doc), Excel (.xls/.csv), and printable PDF formats
 * strictly embedding teacher information, school branding, and official school logo.
 */

import { PlatformSettings, Student, Section, Submission, Test } from '../types';

export interface CurriculumSkillItem {
  id: string;
  grade: '4' | '5' | '6';
  type: 'curriculum' | 'nafes';
  unitOrDomain: string; // e.g. "الوحدة الأولى: الأنظمة البيئية" or "مجال علوم الحياة"
  skillTitle: string;
  learningOutcome: string; // ناتج التعلم المستهدف
  performanceIndicator: string; // مؤشر الأداء
  cognitiveLevel?: string; // مستوى المعرفة: استرجاع، تطبيق، استدلال
  masteryPercentageTarget: number; // e.g. 80
  notes?: string;
}

const OFFICIAL_LOGO_URL = '/assets/aistudio/TNS2_logo_-_2023-0__426ea3a1.png';

/**
 * Common HTML Header for Word and Excel exports
 */
const buildDocumentHeaderHtml = (title: string, subtitle: string, settings: PlatformSettings, grade?: string, studentName?: string) => {
  return `
    <div style="direction: rtl; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px double #d97706;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; direction: rtl;">
        <tr>
          <td style="width: 30%; text-align: right; vertical-align: middle;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e293b;">المملكة العربية السعودية</p>
            <p style="margin: 2px 0; font-size: 13px; font-weight: bold; color: #1e293b;">وزارة التعليم</p>
            <p style="margin: 2px 0; font-size: 14px; font-weight: bold; color: #b45309;">${settings.schoolName || 'مدارس التربية النموذجية'}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">القسم الابتدائي - بنين</p>
          </td>
          <td style="width: 40%; text-align: center; vertical-align: middle;">
            <div style="display: inline-block; padding: 10px 15px; background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px;">
              <h2 style="margin: 0; color: #92400e; font-size: 18px; font-weight: 900;">${settings.platformTitle || 'منصة إتقان في العلوم'}</h2>
              <p style="margin: 4px 0 0; color: #78350f; font-size: 11px;">إدارة وتصميم اختبارات وقياس مهارات ونواتج التعلم</p>
            </div>
          </td>
          <td style="width: 30%; text-align: left; vertical-align: middle;">
            <p style="margin: 0; font-size: 12px; color: #475569;">المعلم المشرف: <strong style="color: #0f172a; font-size: 13px;">${settings.teacherName || 'محمد نادي سيد محمد'}</strong></p>
            <p style="margin: 2px 0; font-size: 12px; color: #475569;">المادة: <strong style="color: #059669;">العلوم</strong></p>
            ${grade ? `<p style="margin: 2px 0; font-size: 12px; color: #475569;">الصف: <strong style="color: #0284c7;">${grade}</strong></p>` : ''}
            ${studentName ? `<p style="margin: 2px 0; font-size: 12px; color: #475569;">اسم الطالب: <strong style="color: #7c3aed;">${studentName}</strong></p>` : ''}
            <p style="margin: 2px 0; font-size: 11px; color: #94a3b8;">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
          </td>
        </tr>
      </table>
      
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-top: 10px;">
        <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: bold;">${title}</h1>
        ${subtitle ? `<p style="margin: 5px 0 0; color: #475569; font-size: 13px;">${subtitle}</p>` : ''}
      </div>
    </div>
  `;
};

/**
 * Common HTML Footer for Word exports
 */
const buildDocumentFooterHtml = (settings: PlatformSettings) => {
  return `
    <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; direction: rtl;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 33%; text-align: right;">
            <strong>المعلم المشرف:</strong> ${settings.teacherName || 'محمد نادي سيد محمد'}
          </td>
          <td style="width: 34%; text-align: center;">
            <strong>المدرسة:</strong> ${settings.schoolName || 'مدارس التربية النموذجية'}
          </td>
          <td style="width: 33%; text-align: left;">
            منصة إتقان التعليمية للعلوم © ${new Date().getFullYear()}
          </td>
        </tr>
      </table>
    </div>
  `;
};

/**
 * Downloads a generated file blob in browser
 */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

// ==========================================
// 1. Curriculum & Learning Outcomes Exports
// ==========================================

export const exportCurriculumToWord = (
  gradeLabel: string,
  items: CurriculumSkillItem[],
  settings: PlatformSettings,
  isNafes: boolean = false
) => {
  const docTitle = isNafes
    ? `دليل قياس مهارات ونواتج اختبارات نافس الوطنية - ${gradeLabel}`
    : `وثيقة المنهج والمهارات ونواتج التعلم المستهدفة - ${gradeLabel}`;
  
  const docSubtitle = isNafes
    ? 'تصنيف المهارات وفق مجالات الاختبار الوطني نافس ومؤشرات الإتقان المستهدفة'
    : 'تحليل وحدات وموضوعات مادة العلوم ونواتج التعلم المعتمدة من وزارة التعليم';

  const rowsHtml = items
    .map(
      (item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">${item.unitOrDomain}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">${item.skillTitle}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; color: #334155;">${item.learningOutcome}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; color: #475569;">${item.performanceIndicator}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #059669;">${item.masteryPercentageTarget}%</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #64748b;">${item.notes || '-'}</td>
      </tr>
    `
    )
    .join('');

  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; direction: rtl; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; padding: 10px; border: 1px solid #0f172a; font-weight: bold; }
        </style>
      </head>
      <body>
        ${buildDocumentHeaderHtml(docTitle, docSubtitle, settings, gradeLabel)}
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 15%;">${isNafes ? 'المجال العلمي' : 'الوحدة / الفصل'}</th>
              <th style="width: 20%;">المهارة المستهدفة</th>
              <th style="width: 25%;">ناتج التعلم المستهدف</th>
              <th style="width: 20%;">مؤشر الأداء وقياس المهارة</th>
              <th style="width: 7%;">المستهدف</th>
              <th style="width: 8%;">ملاحظات وتوجيهات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${buildDocumentFooterHtml(settings)}
      </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
  const filename = isNafes
    ? `نافس_مهارات_ونواتج_${gradeLabel.replace(/\s+/g, '_')}_${Date.now()}.doc`
    : `منهج_العلوم_ونواتج_التعلم_${gradeLabel.replace(/\s+/g, '_')}_${Date.now()}.doc`;
  downloadBlob(blob, filename);
};

export const exportCurriculumToExcel = (
  gradeLabel: string,
  items: CurriculumSkillItem[],
  settings: PlatformSettings,
  isNafes: boolean = false
) => {
  const docTitle = isNafes
    ? `قياس مهارات ونواتج نافس - ${gradeLabel}`
    : `منهج العلوم ومهاراته ونواتج التعلم - ${gradeLabel}`;

  const rowsHtml = items
    .map(
      (item, idx) => `
      <tr>
        <td style="border: 1px solid #999; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #999;">${item.unitOrDomain}</td>
        <td style="border: 1px solid #999; font-weight: bold;">${item.skillTitle}</td>
        <td style="border: 1px solid #999;">${item.learningOutcome}</td>
        <td style="border: 1px solid #999;">${item.performanceIndicator}</td>
        <td style="border: 1px solid #999; text-align: center;">${item.masteryPercentageTarget}%</td>
        <td style="border: 1px solid #999;">${item.notes || ''}</td>
      </tr>
    `
    )
    .join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; direction: rtl; font-family: Tahoma, Arial, sans-serif; }
          th { background-color: #0b192c; color: #ffffff; font-weight: bold; border: 1px solid #000; padding: 8px; }
          td { padding: 6px; }
        </style>
      </head>
      <body>
        <table style="direction: rtl;">
          <tr>
            <td colspan="7" style="font-size: 16px; font-weight: bold; text-align: center; background-color: #fef3c7; color: #92400e; padding: 10px;">
              ${settings.schoolName || 'مدارس التربية النموذجية'} - ${settings.platformTitle || 'منصة إتقان في العلوم'}
            </td>
          </tr>
          <tr>
            <td colspan="7" style="text-align: center; font-size: 14px; font-weight: bold; padding: 6px;">
              ${docTitle} | المعلم المشرف: ${settings.teacherName || 'محمد نادي سيد محمد'} | تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}
            </td>
          </tr>
          <tr></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>${isNafes ? 'المجال العلمي' : 'الوحدة / الفصل'}</th>
              <th>المهارة المستهدفة</th>
              <th>ناتج التعلم المستهدف</th>
              <th>مؤشر الأداء وقياس المهارة</th>
              <th>نسبة الإتقان المستهدفة</th>
              <th>ملاحظات وتوجيهات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const filename = isNafes
    ? `نافس_مهارات_${gradeLabel.replace(/\s+/g, '_')}_${Date.now()}.xls`
    : `منهج_العلوم_${gradeLabel.replace(/\s+/g, '_')}_${Date.now()}.xls`;
  downloadBlob(blob, filename);
};

// ==========================================
// 2. Student Rosters & Sections Exports
// ==========================================

export const exportStudentsRosterToExcel = (
  students: Student[],
  sections: Section[],
  gradeLabel: string,
  settings: PlatformSettings
) => {
  const rowsHtml = students
    .map((s, idx) => {
      const sec = sections.find((sc) => sc.id === s.sectionId);
      return `
      <tr>
        <td style="border: 1px solid #999; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #999; font-weight: bold;">${s.name}</td>
        <td style="border: 1px solid #999; text-align: center;">الصف ${s.grade}</td>
        <td style="border: 1px solid #999; text-align: center;">${sec?.name || 'غير محدد'}</td>
        <td style="border: 1px solid #999; text-align: center;">${s.nationalId || '-'}</td>
        <td style="border: 1px solid #999; text-align: center;">${s.createdAt || '-'}</td>
      </tr>
    `;
    })
    .join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; direction: rtl; font-family: Tahoma, Arial, sans-serif; }
          th { background-color: #0b192c; color: #ffffff; font-weight: bold; border: 1px solid #000; padding: 8px; }
          td { padding: 6px; }
        </style>
      </head>
      <body>
        <table style="direction: rtl;">
          <tr>
            <td colspan="6" style="font-size: 16px; font-weight: bold; text-align: center; background-color: #fef3c7; color: #92400e; padding: 10px;">
              ${settings.schoolName || 'مدارس التربية النموذجية'} - قوائم الطلاب والشعب لمادة العلوم
            </td>
          </tr>
          <tr>
            <td colspan="6" style="text-align: center; font-size: 13px; font-weight: bold; padding: 6px;">
              ${gradeLabel} | إعداد المعلم: ${settings.teacherName || 'محمد نادي سيد محمد'} | إجمالي الطلاب: ${students.length}
            </td>
          </tr>
          <tr></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الطالب الرباعي</th>
              <th>الصف الدراسي</th>
              <th>الشعبة</th>
              <th>رقم الهوية / السجل</th>
              <th>تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, `قوائم_الطلاب_${gradeLabel.replace(/\s+/g, '_')}_${Date.now()}.xls`);
};

export const exportStudentsRosterToWord = (
  students: Student[],
  sections: Section[],
  gradeLabel: string,
  settings: PlatformSettings
) => {
  const docTitle = `كشف أسماء وقوائم الطلاب والشعب الدراسية - ${gradeLabel}`;
  const docSubtitle = `مادة العلوم - إجمالي الطلاب المسجلين (${students.length} طالب)`;

  const rowsHtml = students
    .map((s, idx) => {
      const sec = sections.find((sc) => sc.id === s.sectionId);
      return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${s.name}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">الصف ${s.grade}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0284c7;">${sec?.name || 'غير محدد'}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${s.nationalId || '-'}</td>
      </tr>
    `;
    })
    .join('');

  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; direction: rtl; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; padding: 9px; border: 1px solid #0f172a; font-weight: bold; }
        </style>
      </head>
      <body>
        ${buildDocumentHeaderHtml(docTitle, docSubtitle, settings, gradeLabel)}
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">#</th>
              <th style="width: 42%;">اسم الطالب</th>
              <th style="width: 15%;">الصف</th>
              <th style="width: 15%;">الشعبة</th>
              <th style="width: 20%;">رقم الهوية / السجل</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${buildDocumentFooterHtml(settings)}
      </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `كشف_طلاب_${gradeLabel.replace(/\s+/g, '_')}_${Date.now()}.doc`);
};

// ==========================================
// 3. General & Individual Results Exports
// ==========================================

export const exportGeneralResultsToExcel = (
  submissions: Submission[],
  students: Student[],
  sections: Section[],
  settings: PlatformSettings
) => {
  const rowsHtml = submissions
    .map((sub, idx) => {
      const student = students.find((s) => s.id === sub.studentId);
      const section = sections.find((sc) => sc.id === student?.sectionId);
      return `
      <tr>
        <td style="border: 1px solid #999; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #999; font-weight: bold;">${sub.studentName}</td>
        <td style="border: 1px solid #999; text-align: center;">الصف ${sub.grade}</td>
        <td style="border: 1px solid #999; text-align: center;">${section?.name || sub.sectionName || '-'}</td>
        <td style="border: 1px solid #999;">${sub.testTitle}</td>
        <td style="border: 1px solid #999; text-align: center;">${sub.score} / ${sub.totalQuestions}</td>
        <td style="border: 1px solid #999; text-align: center; font-weight: bold; color: ${sub.percentage >= 80 ? '#059669' : sub.percentage >= 60 ? '#d97706' : '#dc2626'};">${sub.percentage}%</td>
        <td style="border: 1px solid #999; text-align: center;">${sub.passed ? 'متقن ✓' : 'بحاجة لتدخل ✗'}</td>
        <td style="border: 1px solid #999; text-align: center;">${sub.completedAt}</td>
      </tr>
    `;
    })
    .join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; direction: rtl; font-family: Tahoma, Arial, sans-serif; }
          th { background-color: #0b192c; color: #ffffff; font-weight: bold; border: 1px solid #000; padding: 8px; }
          td { padding: 6px; }
        </style>
      </head>
      <body>
        <table style="direction: rtl;">
          <tr>
            <td colspan="9" style="font-size: 16px; font-weight: bold; text-align: center; background-color: #fef3c7; color: #92400e; padding: 10px;">
              ${settings.schoolName || 'مدارس التربية النموذجية'} - كشف نتائج وتقييم اختبارات العلوم ونافس
            </td>
          </tr>
          <tr>
            <td colspan="9" style="text-align: center; font-size: 13px; font-weight: bold; padding: 6px;">
              إعداد وتصميم المعلم: ${settings.teacherName || 'محمد نادي سيد محمد'} | إجمالي المحاولات المرصودة: ${submissions.length}
            </td>
          </tr>
          <tr></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الطالب</th>
              <th>الصف</th>
              <th>الشعبة</th>
              <th>عنوان الاختبار</th>
              <th>الدرجة</th>
              <th>نسبة الإتقان</th>
              <th>حالة الإتقان</th>
              <th>تاريخ الإنجاز</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, `تقرير_نتائج_العلوم_العامة_${Date.now()}.xls`);
};

export const exportGeneralResultsToWord = (
  submissions: Submission[],
  students: Student[],
  sections: Section[],
  settings: PlatformSettings
) => {
  const docTitle = 'تقرير الرصد والتحليل الإحصائي لنتائج مادة العلوم';
  const docSubtitle = 'كشف تفصيلي بدرجات ومستويات إتقان الطلاب لاختبارات المنهج ونافس الوطنية';

  const rowsHtml = submissions
    .map((sub, idx) => {
      const student = students.find((s) => s.id === sub.studentId);
      const section = sections.find((sc) => sc.id === student?.sectionId);
      return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${sub.studentName}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">الصف ${sub.grade}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${section?.name || sub.sectionName || '-'}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${sub.testTitle}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${sub.score} / ${sub.totalQuestions}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${sub.percentage >= 80 ? '#059669' : sub.percentage >= 60 ? '#d97706' : '#dc2626'};">${sub.percentage}%</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${sub.passed ? 'متقن ✓' : 'بحاجة لتدخل'}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px;">${sub.completedAt}</td>
      </tr>
    `;
    })
    .join('');

  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; direction: rtl; font-size: 11px; }
          th { background-color: #0f172a; color: #ffffff; padding: 8px; border: 1px solid #0f172a; font-weight: bold; }
        </style>
      </head>
      <body>
        ${buildDocumentHeaderHtml(docTitle, docSubtitle, settings)}
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 20%;">اسم الطالب</th>
              <th style="width: 8%;">الصف</th>
              <th style="width: 8%;">الشعبة</th>
              <th style="width: 25%;">الاختبار</th>
              <th style="width: 8%;">الدرجة</th>
              <th style="width: 8%;">النسبة</th>
              <th style="width: 8%;">الحالة</th>
              <th style="width: 10%;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${buildDocumentFooterHtml(settings)}
      </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `تقرير_رصد_النتائج_العامة_${Date.now()}.doc`);
};

export const exportStudentScorecardToWord = (
  submission: Submission,
  test: Test | undefined,
  settings: PlatformSettings
) => {
  const docTitle = `بطاقة إتقان الطالب واختبار العلوم`;
  const docSubtitle = `تفاصيل الإنجاز الفردي والمهارات المكتسبة في اختبار: ${submission.testTitle}`;

  const questionBreakdownRows = test
    ? test.questions
        .map((q, idx) => {
          const ans = submission.answers.find((a) => a.questionId === q.id);
          const isCorrect = ans?.isCorrect ?? false;
          return `
        <tr style="background-color: ${isCorrect ? '#f0fdf4' : '#fef2f2'};">
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${q.skillName}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${q.questionText}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${isCorrect ? '#15803d' : '#b91c1c'};">
            ${isCorrect ? 'صحيحة ✓' : 'غير صحيحة ✗'}
          </td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569;">${q.explanation}</td>
        </tr>
      `;
        })
        .join('')
    : '';

  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docTitle} - ${submission.studentName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; direction: rtl; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; padding: 9px; border: 1px solid #0f172a; font-weight: bold; }
        </style>
      </head>
      <body>
        ${buildDocumentHeaderHtml(docTitle, docSubtitle, settings, `الصف ${submission.grade} - ${submission.sectionName}`, submission.studentName)}
        
        <div style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 15px; margin: 15px 0; text-align: center;">
          <h2 style="margin: 0 0 10px; color: #92400e;">بيانات نتيجة الطالب: ${submission.studentName}</h2>
          <table style="width: 80%; margin: 0 auto; border: none;">
            <tr>
              <td style="text-align: center; padding: 8px; border: 1px solid #fde68a; background-color: #ffffff;">
                <span style="font-size: 11px; color: #64748b;">الدرجة المستحقة:</span><br>
                <strong style="font-size: 18px; color: #0f172a;">${submission.score} / ${submission.totalQuestions}</strong>
              </td>
              <td style="text-align: center; padding: 8px; border: 1px solid #fde68a; background-color: #ffffff;">
                <span style="font-size: 11px; color: #64748b;">نسبة الإتقان:</span><br>
                <strong style="font-size: 18px; color: #059669;">${submission.percentage}%</strong>
              </td>
              <td style="text-align: center; padding: 8px; border: 1px solid #fde68a; background-color: #ffffff;">
                <span style="font-size: 11px; color: #64748b;">حالة الاجتياز:</span><br>
                <strong style="font-size: 16px; color: ${submission.passed ? '#15803d' : '#b91c1c'};">${submission.passed ? 'تم الإتقان والاجتياز بنجاح' : 'يحتاج خطة تعزيز وتدريب'}</strong>
              </td>
            </tr>
          </table>
        </div>

        ${
          test
            ? `
          <h3 style="color: #0f172a; margin-top: 25px;">تحليل الأسئلة والمهارات المكتسبة:</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 20%;">المهارة</th>
                <th style="width: 35%;">نص السؤال</th>
                <th style="width: 12%;">إجابة الطالب</th>
                <th style="width: 28%;">التوضيح والشرح العلمي</th>
              </tr>
            </thead>
            <tbody>
              ${questionBreakdownRows}
            </tbody>
          </table>
        `
            : ''
        }

        ${buildDocumentFooterHtml(settings)}
      </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `بطاقة_نتيجة_${submission.studentName.replace(/\s+/g, '_')}_${Date.now()}.doc`);
};

export const exportStudentScorecardToExcel = (
  submission: Submission,
  test: Test | undefined,
  settings: PlatformSettings
) => {
  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; direction: rtl; font-family: Tahoma, Arial, sans-serif; }
          th { background-color: #0b192c; color: #ffffff; font-weight: bold; border: 1px solid #000; padding: 8px; }
          td { padding: 6px; }
        </style>
      </head>
      <body>
        <table style="direction: rtl;">
          <tr>
            <td colspan="5" style="font-size: 16px; font-weight: bold; text-align: center; background-color: #fef3c7; color: #92400e; padding: 10px;">
              ${settings.schoolName || 'مدارس التربية النموذجية'} - بطاقة إتقان نتيجة طالب
            </td>
          </tr>
          <tr>
            <td colspan="5" style="text-align: center; font-size: 13px; font-weight: bold; padding: 6px;">
              الطالب: ${submission.studentName} | الصف: ${submission.grade} (${submission.sectionName}) | المعلم: ${settings.teacherName || 'محمد نادي سيد محمد'}
            </td>
          </tr>
          <tr>
            <td colspan="5" style="text-align: center; font-size: 13px; padding: 6px;">
              الاختبار: ${submission.testTitle} | الدرجة: ${submission.score} من ${submission.totalQuestions} | النسبة: ${submission.percentage}% | التاريخ: ${submission.completedAt}
            </td>
          </tr>
          <tr></tr>
          ${
            test
              ? `
            <thead>
              <tr>
                <th>#</th>
                <th>المهارة</th>
                <th>السؤال</th>
                <th>النتيجة</th>
                <th>التوضيح العلمي</th>
              </tr>
            </thead>
            <tbody>
              ${test.questions
                .map((q, idx) => {
                  const ans = submission.answers.find((a) => a.questionId === q.id);
                  return `
                  <tr>
                    <td style="border: 1px solid #999; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid #999; font-weight: bold;">${q.skillName}</td>
                    <td style="border: 1px solid #999;">${q.questionText}</td>
                    <td style="border: 1px solid #999; text-align: center;">${ans?.isCorrect ? 'صحيحة ✓' : 'خاطئة ✗'}</td>
                    <td style="border: 1px solid #999;">${q.explanation}</td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          `
              : ''
          }
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, `نتيجة_${submission.studentName.replace(/\s+/g, '_')}_${Date.now()}.xls`);
};

// ==========================================
// 4. Detailed Skill Mastery & Outcome Results Table
// (اسم الطالب - اسم الناتج أو المهارة المستهدفة - أتقن أم لم يتقن - نسبة الإتقان - تاريخ المحاولة - عدد مرات المحاولة - لم يتقن بالأحمر - نوع الاختبار منهج أم نافس وفي أي مجال)
// ==========================================

export interface SkillOutcomeResultRow {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  sectionName: string;
  skillOrOutcomeName: string;
  testType: 'منهج' | 'نافس';
  domain: string;
  isMastered: boolean;
  masteryPercentage: number;
  correctQuestions: number;
  totalQuestions: number;
  attemptDate: string;
  attemptCount: number;
  testTitle: string;
}

export const buildSkillOutcomeRecords = (
  submissions: Submission[],
  tests: Test[],
  students: Student[],
  sections: Section[]
): SkillOutcomeResultRow[] => {
  const records: SkillOutcomeResultRow[] = [];

  // Group submissions per student and test to calculate attempt counts chronologically
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const studentTestAttempts: Record<string, number> = {};

  sortedSubmissions.forEach((sub) => {
    const student = students.find((s) => s.id === sub.studentId);
    const section = sections.find((sc) => sc.id === student?.sectionId);
    const test = tests.find((t) => t.id === sub.testId);

    const pairKey = `${sub.studentId}_${sub.testId}`;
    studentTestAttempts[pairKey] = (studentTestAttempts[pairKey] || 0) + 1;
    const currentAttempt = studentTestAttempts[pairKey];

    if (!test || test.questions.length === 0) {
      // Fallback record if questions not available
      records.push({
        id: `${sub.id}-gen`,
        studentId: sub.studentId,
        studentName: sub.studentName,
        grade: `الصف ${sub.grade}`,
        sectionName: section?.name || sub.sectionName || 'أ',
        skillOrOutcomeName: sub.testTitle,
        testType: test?.isNafesBenchmark ? 'نافس' : 'منهج',
        domain: test?.domain || 'علوم الحياة',
        isMastered: sub.passed,
        masteryPercentage: sub.percentage,
        correctQuestions: sub.score,
        totalQuestions: sub.totalQuestions,
        attemptDate: sub.completedAt,
        attemptCount: currentAttempt,
        testTitle: sub.testTitle,
      });
      return;
    }

    // Group questions by skillName
    const skillGroups: Record<string, import('../types').Question[]> = {};
    test.questions.forEach((q) => {
      const skill = q.skillName || 'المهارة الأساسية للاختبار';
      if (!skillGroups[skill]) {
        skillGroups[skill] = [];
      }
      skillGroups[skill].push(q);
    });

    Object.entries(skillGroups).forEach(([skillName, questionsInSkill], idx) => {
      let correct = 0;
      questionsInSkill.forEach((q) => {
        const studentAns = sub.answers.find((a) => a.questionId === q.id);
        if (studentAns?.isCorrect) {
          correct++;
        }
      });

      const total = questionsInSkill.length;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      const isMastered = pct >= (test.passingScorePercentage || 75);

      records.push({
        id: `${sub.id}-${idx}`,
        studentId: sub.studentId,
        studentName: sub.studentName,
        grade: `الصف ${sub.grade}`,
        sectionName: section?.name || sub.sectionName || 'أ',
        skillOrOutcomeName: skillName,
        testType: test.isNafesBenchmark ? 'نافس' : 'منهج',
        domain: questionsInSkill[0]?.domain || test.domain || 'علوم عامة',
        isMastered,
        masteryPercentage: pct,
        correctQuestions: correct,
        totalQuestions: total,
        attemptDate: sub.completedAt,
        attemptCount: currentAttempt,
        testTitle: test.title,
      });
    });
  });

  return records;
};

export const exportSkillMasteryTableToExcel = (
  records: SkillOutcomeResultRow[],
  settings: PlatformSettings,
  filterInfo?: string
) => {
  const rowsHtml = records
    .map(
      (r, idx) => `
    <tr>
      <td style="border: 1px solid #999; text-align: center;">${idx + 1}</td>
      <td style="border: 1px solid #999; font-weight: bold; color: #0f172a;">${r.studentName}</td>
      <td style="border: 1px solid #999; text-align: center;">${r.grade} (${r.sectionName})</td>
      <td style="border: 1px solid #999; font-weight: bold; color: #0369a1;">${r.skillOrOutcomeName}</td>
      <td style="border: 1px solid #999; text-align: center; font-weight: bold; background-color: ${r.testType === 'نافس' ? '#dbeafe' : '#ecfdf5'}; color: ${r.testType === 'نافس' ? '#1e40af' : '#065f46'};">
        ${r.testType === 'نافس' ? 'نافس الوطني' : 'منهج الوزارة'}
      </td>
      <td style="border: 1px solid #999; color: #334155;">${r.domain}</td>
      <!-- خانة لم يتقن تكون بالأحمر الفاقع -->
      <td style="border: 1px solid #999; text-align: center; font-weight: bold; background-color: ${r.isMastered ? '#dcfce7' : '#fee2e2'}; color: ${r.isMastered ? '#15803d' : '#dc2626'};">
        ${r.isMastered ? 'أتقن ✓' : 'لم يتقن ✗'}
      </td>
      <td style="border: 1px solid #999; text-align: center; font-weight: bold;">
        ${r.masteryPercentage}% (${r.correctQuestions} من ${r.totalQuestions})
      </td>
      <td style="border: 1px solid #999; text-align: center;">${r.attemptDate}</td>
      <td style="border: 1px solid #999; text-align: center; font-weight: bold;">المحاولة ${r.attemptCount}</td>
      <td style="border: 1px solid #999; font-size: 11px; color: #475569;">${r.testTitle}</td>
    </tr>
  `
    )
    .join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; direction: rtl; font-family: Tahoma, Arial, sans-serif; font-size: 11px; }
          th { background-color: #0b192c; color: #ffffff; font-weight: bold; border: 1px solid #000; padding: 8px; text-align: center; }
          td { padding: 6px; }
        </style>
      </head>
      <body>
        <table style="direction: rtl;">
          <tr>
            <td colspan="11" style="font-size: 16px; font-weight: 900; text-align: center; background-color: #fef3c7; color: #92400e; padding: 12px; border: 1px solid #d97706;">
              ${settings.schoolName || 'مدارس التربية النموذجية'} - كشف قياس نواتج التعلم والمهارات (منهج ونافس)
            </td>
          </tr>
          <tr>
            <td colspan="11" style="text-align: center; font-size: 13px; font-weight: bold; padding: 8px; background-color: #f8fafc; border: 1px solid #cbd5e1;">
              المعلم المشرف: ${settings.teacherName || 'محمد نادي سيد محمد'} | المادة: العلوم | ${filterInfo || 'كافة الصفوف والشعب'} | تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}
            </td>
          </tr>
          <tr></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الطالب</th>
              <th>الصف والشعبة</th>
              <th>اسم الناتج أو المهارة المستهدفة</th>
              <th>نوع الاختبار</th>
              <th>المجال العلمي</th>
              <th>حالة الإتقان</th>
              <th>نسبة الإتقان (عدد الأسئلة)</th>
              <th>تاريخ المحاولة</th>
              <th>عدد مرات المحاولة</th>
              <th>عنوان الاختبار</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, `كشف_إتقان_المهارات_والنواتج_${Date.now()}.xls`);
};

export const exportSkillMasteryTableToWord = (
  records: SkillOutcomeResultRow[],
  settings: PlatformSettings,
  filterInfo?: string
) => {
  const docTitle = 'كشف رصد وقياس نواتج التعلم ومهارات العلوم واختبارات نافس';
  const docSubtitle = `تحليل تفصيلي لمستويات إتقان الطلاب لكل مهارة وناتج تعلم - ${filterInfo || 'جميع الصفوف والشعب'}`;

  const rowsHtml = records
    .map(
      (r, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
      <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${r.studentName}</td>
      <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px;">${r.grade} (${r.sectionName})</td>
      <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">${r.skillOrOutcomeName}</td>
      <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background-color: ${r.testType === 'نافس' ? '#dbeafe' : '#ecfdf5'}; color: ${r.testType === 'نافس' ? '#1e40af' : '#065f46'};">
          ${r.testType === 'نافس' ? 'نافس الوطني' : 'منهج الوزارة'}
        </span>
      </td>
      <td style="padding: 6px; border: 1px solid #cbd5e1; color: #475569; font-size: 11px;">${r.domain}</td>
      <!-- خانة لم يتقن تكون بالأحمر الفاقع -->
      <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; background-color: ${r.isMastered ? '#dcfce7' : '#fee2e2'}; color: ${r.isMastered ? '#15803d' : '#dc2626'};">
        ${r.isMastered ? 'أتقن ✓' : 'لم يتقن ✗'}
      </td>
      <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">
        ${r.masteryPercentage}% (${r.correctQuestions}/${r.totalQuestions})
      </td>
      <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px;">${r.attemptDate}</td>
      <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">المحاولة ${r.attemptCount}</td>
    </tr>
  `
    )
    .join('');

  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; direction: rtl; font-size: 11px; }
          th { background-color: #0f172a; color: #ffffff; padding: 8px; border: 1px solid #0f172a; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        ${buildDocumentHeaderHtml(docTitle, docSubtitle, settings)}
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 17%;">اسم الطالب</th>
              <th style="width: 10%;">الصف والشعبة</th>
              <th style="width: 22%;">اسم الناتج أو المهارة المستهدفة</th>
              <th style="width: 9%;">نوع الاختبار</th>
              <th style="width: 12%;">المجال العلمي</th>
              <th style="width: 8%;">حالة الإتقان</th>
              <th style="width: 10%;">نسبة الإتقان</th>
              <th style="width: 8%;">تاريخ المحاولة</th>
              <th style="width: 6%;">المحاولة</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${buildDocumentFooterHtml(settings)}
      </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `كشف_نواتج_التعلم_والمهارات_${Date.now()}.doc`);
};
