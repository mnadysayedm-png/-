import React, { useState } from 'react';
import { GradeLevel, Section, Student, Badge, StudentGamification, Submission } from '../../types';
import { Trophy, Award, Sparkles, Star, Users, Flame, CheckCircle2, Lock, Medal, ArrowLeft } from 'lucide-react';

interface LeaderboardViewProps {
  currentStudentId?: string;
  students: Student[];
  sections: Section[];
  badges: Badge[];
  allGamification: Record<string, StudentGamification>;
  submissions: Submission[];
  onClose?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentStudentId,
  students,
  sections,
  badges,
  allGamification,
  submissions,
  onClose,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges'>('leaderboard');

  // Compute leaderboard entries
  const leaderboardData = students
    .filter((s) => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (selectedSectionId !== 'all' && s.sectionId !== selectedSectionId) return false;
      return true;
    })
    .map((student) => {
      const g = allGamification[student.id] || {
        studentId: student.id,
        points: 50,
        level: 1,
        levelTitle: 'مستكشف مبتدئ 🔬',
        earnedBadgeIds: ['badge-streak'],
        simulationsCompleted: [],
        streakDays: 1,
        lastActiveDate: '',
      };

      const studentSubs = submissions.filter(
        (sub) => sub.studentId === student.id || sub.studentName === student.name
      );
      const section = sections.find((sec) => sec.id === student.sectionId);

      return {
        student,
        gamification: g,
        sectionLabel: section ? section.label : `الصف ${student.grade}`,
        submissionsCount: studentSubs.length,
        isCurrent: student.id === currentStudentId,
      };
    })
    .sort((a, b) => b.gamification.points - a.gamification.points);

  const currentStudentGamification = currentStudentId
    ? allGamification[currentStudentId]
    : null;

  const gradeSections =
    selectedGrade === 'all' ? sections : sections.filter((s) => s.grade === selectedGrade);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/20 rounded-xl text-amber-200">
                <Trophy className="w-6 h-6 fill-amber-300 text-amber-300" />
              </span>
              <span className="px-3 py-1 bg-amber-900/40 rounded-full text-xs font-bold border border-amber-400/30">
                لوحة الشرف وتحديات علماء المستقبل
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              سباق النجوم وأوسمة مادة العلوم 🌟
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
              اكسب النقاط عند إنجاز الاختبارات المعيارية وإتقان المهارات والخطط العلاجية لفتح الأوسمة وتصدّر لوحة الشرف!
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition border border-white/20 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'leaderboard'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>لوحة صدارة الأبطال</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'badges'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>معرض الأوسمة والإنجازات ({badges.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-600">الصف الدراسي:</span>
              <div className="flex items-center gap-1">
                {(['all', '4', '5', '6'] as const).map((grade) => (
                  <button
                    key={grade}
                    onClick={() => {
                      setSelectedGrade(grade);
                      setSelectedSectionId('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      selectedGrade === grade
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {grade === 'all' ? 'جميع الصفوف' : `الصف ${grade}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">الشعبة:</span>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="all">جميع الشعب</option>
                {gradeSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          {leaderboardData.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Rank 2 (Silver) */}
              <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm text-center relative flex flex-col justify-between order-2 md:order-1">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-700 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                    🥈
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                    المركز الثاني
                  </span>
                  <h4 className="text-base font-black text-slate-800">
                    {leaderboardData[1].student.name}
                  </h4>
                  <div className="text-xs text-slate-500 font-medium">
                    {leaderboardData[1].sectionLabel}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-xl font-black text-amber-600 font-mono">
                    {leaderboardData[1].gamification.points}{' '}
                    <span className="text-xs font-bold text-slate-400">نقطة</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 mt-1">
                    {leaderboardData[1].gamification.levelTitle}
                  </div>
                </div>
              </div>

              {/* Rank 1 (Gold) */}
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border-2 border-amber-400 shadow-md text-center relative flex flex-col justify-between order-1 md:order-2 transform md:-translate-y-2">
                <div className="absolute top-2 right-2">
                  <Medal className="w-6 h-6 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-400 text-amber-700 font-black text-2xl flex items-center justify-center mx-auto shadow-md">
                    👑
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs">
                    بطل المنصة الأول 🥇
                  </span>
                  <h4 className="text-lg font-black text-slate-900">
                    {leaderboardData[0].student.name}
                  </h4>
                  <div className="text-xs text-emerald-700 font-bold">
                    {leaderboardData[0].sectionLabel}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200">
                  <div className="text-2xl font-black text-amber-600 font-mono">
                    {leaderboardData[0].gamification.points}{' '}
                    <span className="text-xs font-bold text-slate-400">نقطة</span>
                  </div>
                  <div className="text-xs font-black text-emerald-800 mt-1">
                    {leaderboardData[0].gamification.levelTitle}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {leaderboardData[0].gamification.earnedBadgeIds.map((bId) => {
                      const b = badges.find((x) => x.id === bId);
                      return b ? (
                        <span key={bId} className="text-base" title={b.name}>
                          {b.icon}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="bg-white rounded-3xl p-5 border-2 border-amber-200/60 shadow-sm text-center relative flex flex-col justify-between order-3">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-800 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                    🥉
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                    المركز الثالث
                  </span>
                  <h4 className="text-base font-black text-slate-800">
                    {leaderboardData[2].student.name}
                  </h4>
                  <div className="text-xs text-slate-500 font-medium">
                    {leaderboardData[2].sectionLabel}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-xl font-black text-amber-600 font-mono">
                    {leaderboardData[2].gamification.points}{' '}
                    <span className="text-xs font-bold text-slate-400">نقطة</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 mt-1">
                    {leaderboardData[2].gamification.levelTitle}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 text-center">الترتيب</th>
                  <th className="py-3.5 px-4">اسم الطالب</th>
                  <th className="py-3.5 px-4">الصف والشعبة</th>
                  <th className="py-3.5 px-4">رتبة العالم</th>
                  <th className="py-3.5 px-4">الأوسمة</th>
                  <th className="py-3.5 px-4 text-center">النقاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leaderboardData.map((item, index) => (
                  <tr
                    key={item.student.id}
                    className={`transition ${
                      item.isCurrent
                        ? 'bg-amber-50/80 font-bold text-amber-950 ring-1 ring-amber-300'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      {index === 0 ? (
                        <span className="text-base">🥇</span>
                      ) : index === 1 ? (
                        <span className="text-base">🥈</span>
                      ) : index === 2 ? (
                        <span className="text-base">🥉</span>
                      ) : (
                        <span className="font-mono text-slate-400 font-bold">{index + 1}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800">{item.student.name}</span>
                        {item.isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                            أنت
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                        {item.sectionLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-bold text-emerald-800">
                        {item.gamification.levelTitle}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        {item.gamification.earnedBadgeIds.map((bId) => {
                          const b = badges.find((x) => x.id === bId);
                          return b ? (
                            <span key={bId} className="text-sm" title={b.name}>
                              {b.icon}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-black font-mono text-sm text-amber-700">
                        {item.gamification.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Badges Showcase */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => {
              const isUnlocked = currentStudentGamification?.earnedBadgeIds.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`rounded-3xl p-5 border-2 transition-all duration-200 flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-amber-300 shadow-sm'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl p-2 bg-white rounded-2xl shadow-xs border border-slate-100">
                        {badge.icon}
                      </span>
                      {isUnlocked ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          تم الحصول عليه
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          مغلق
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-800">{badge.name}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                    <strong>شروط الفتح:</strong> {badge.conditionDescription}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
