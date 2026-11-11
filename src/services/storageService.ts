import { Test, Section, Student, PlatformSettings, Submission, GradeLevel, RemedialPlan } from '../types';
import {
  initialSettings,
  initialSections,
  initialStudents,
  initialTests,
  initialSubmissions,
  initialBadges,
  initialSimulations,
  initialGamificationData,
  initialRemedialPlans,
} from '../data/initialData';
import { initialCurriculumItems } from '../data/curriculumData';
import { CurriculumSkillItem } from '../utils/exportUtils';

const SETTINGS_KEY = 'etqan_science_settings_v1';
const SECTIONS_KEY = 'etqan_science_sections_v1';
const STUDENTS_KEY = 'etqan_science_students_v1';
const TESTS_KEY = 'etqan_science_tests_v1';
const SUBMISSIONS_KEY = 'etqan_science_submissions_v1';
const REMEDIAL_PLANS_KEY = 'etqan_science_remedial_plans_v1';

export const storageService = {
  // Settings
  getSettings(): PlatformSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return initialSettings;
  },

  saveSettings(settings: PlatformSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Sections (التحكم في الشعب بدقة 1 - 2 - 3 - 4)
  getSections(): Section[] {
    try {
      const data = localStorage.getItem(SECTIONS_KEY);
      if (data) {
        let parsed: Section[] = JSON.parse(data);
        const migrationDone = localStorage.getItem('etqan_sections_migrated_v3');
        if (!migrationDone) {
          // One-time migration: normalize old letter names ('أ', 'ب', 'ج', 'د') to '1', '2', '3', '4'
          const letterToNum: Record<string, string> = { 'أ': '1', 'ب': '2', 'ج': '3', 'د': '4', 'هـ': '5' };
          parsed = parsed.map((sec) => {
            if (letterToNum[sec.name]) {
              const newName = letterToNum[sec.name];
              const gradeLabelMap: Record<GradeLevel, string> = { '4': 'رابع', '5': 'خامس', '6': 'سادس' };
              return {
                ...sec,
                name: newName,
                label: `${gradeLabelMap[sec.grade] || `الصف ${sec.grade}`} / ${newName}`,
              };
            }
            return sec;
          });

          // Ensure baseline sections exist initially
          (['4', '5', '6'] as GradeLevel[]).forEach((grade) => {
            const gradeSecs = parsed.filter((s) => s.grade === grade);
            ['1', '2', '3', '4'].forEach((num) => {
              if (!gradeSecs.some((s) => s.name === num)) {
                const gradeLabelMap: Record<GradeLevel, string> = { '4': 'رابع', '5': 'خامس', '6': 'سادس' };
                parsed.push({
                  id: `sec-${grade}-${num}`,
                  grade,
                  name: num,
                  label: `${gradeLabelMap[grade]} / ${num}`,
                });
              }
            });
          });

          localStorage.setItem('etqan_sections_migrated_v3', 'true');
          this.saveSections(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return initialSections;
  },

  saveSections(sections: Section[]): void {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
  },

  getSectionsByGrade(grade: GradeLevel): Section[] {
    return this.getSections().filter((s) => s.grade === grade);
  },

  addSection(grade: GradeLevel, name: string): Section {
    const sections = this.getSections();
    const gradeLabelMap: Record<GradeLevel, string> = {
      '4': 'رابع',
      '5': 'خامس',
      '6': 'سادس',
    };
    const cleanName = name.trim();
    const newSection: Section = {
      id: `sec-${grade}-${cleanName}-${Date.now().toString(36)}`,
      grade,
      name: cleanName,
      label: `${gradeLabelMap[grade]} / ${cleanName}`,
    };
    sections.push(newSection);
    this.saveSections(sections);
    return newSection;
  },

  deleteSection(sectionId: string): boolean {
    const sections = this.getSections();
    const targetSec = sections.find((s) => s.id === sectionId);
    const updated = sections.filter((s) => s.id !== sectionId);
    this.saveSections(updated);

    // Reassign or update any students in this section to another section in the same grade
    if (targetSec) {
      const fallbackSec = updated.find((s) => s.grade === targetSec.grade);
      const allStudents = this.getStudents();
      const updatedStudents = allStudents.map((std) => {
        if (std.sectionId === sectionId) {
          return fallbackSec ? { ...std, sectionId: fallbackSec.id } : null;
        }
        return std;
      }).filter(Boolean) as Student[];
      this.saveStudents(updatedStudents);
    }
    return true;
  },

  updateSectionName(sectionId: string, newName: string): void {
    const sections = this.getSections();
    const target = sections.find((s) => s.id === sectionId);
    if (target) {
      target.name = newName.trim();
      const gradeLabelMap: Record<GradeLevel, string> = {
        '4': 'رابع',
        '5': 'خامس',
        '6': 'سادس',
      };
      target.label = `${gradeLabelMap[target.grade]} / ${newName.trim()}`;
      this.saveSections(sections);
    }
  },

  // Students & Mock/Dummy Student Purging (حذف الأسماء الوهمية)
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STUDENTS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return initialStudents;
  },

  saveStudents(students: Student[]): void {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  },

  isMockStudent(studentId: string): boolean {
    const mockIds = initialStudents.map((s) => s.id);
    return mockIds.includes(studentId) || /^std-(40|50|60)\d$/.test(studentId);
  },

  purgeMockStudents(grade?: GradeLevel): { purgedCount: number; remainingCount: number } {
    const all = this.getStudents();
    const mockIds = initialStudents.map((s) => s.id);
    const filtered = all.filter((s) => {
      if (grade && s.grade !== grade) return true; // keep other grades
      // Purge if in mockIds or matches initial mock ID pattern
      const isMock = mockIds.includes(s.id) || /^std-(40|50|60)\d$/.test(s.id);
      return !isMock;
    });

    const purgedCount = all.length - filtered.length;
    this.saveStudents(filtered);
    return { purgedCount, remainingCount: filtered.length };
  },

  getStudentsByGradeAndSection(grade: GradeLevel, sectionId?: string): Student[] {
    const all = this.getStudents();
    return all.filter((s) => s.grade === grade && (!sectionId || s.sectionId === sectionId));
  },

  addStudent(student: Omit<Student, 'id' | 'createdAt'>): Student {
    const students = this.getStudents();
    const newStudent: Student = {
      ...student,
      id: `std-real-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    students.push(newStudent);
    this.saveStudents(students);
    return newStudent;
  },

  deleteStudent(studentId: string): void {
    const students = this.getStudents().filter((s) => s.id !== studentId);
    this.saveStudents(students);
  },

  // Tests
  getTests(): Test[] {
    try {
      const data = localStorage.getItem(TESTS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return initialTests;
  },

  saveTests(tests: Test[]): void {
    localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
  },

  getTestsByGrade(grade: GradeLevel): Test[] {
    return this.getTests().filter((t) => t.grade === grade && t.isActive);
  },

  addTest(test: Omit<Test, 'id' | 'createdAt'>): Test {
    const tests = this.getTests();
    const newTest: Test = {
      ...test,
      id: `test-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    tests.unshift(newTest);
    this.saveTests(tests);
    return newTest;
  },

  updateTest(updatedTest: Test): void {
    const tests = this.getTests().map((t) => (t.id === updatedTest.id ? updatedTest : t));
    this.saveTests(tests);
  },

  deleteTest(testId: string): void {
    const tests = this.getTests().filter((t) => t.id !== testId);
    this.saveTests(tests);
  },

  // Submissions
  getSubmissions(): Submission[] {
    try {
      const data = localStorage.getItem(SUBMISSIONS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return initialSubmissions;
  },

  saveSubmissions(submissions: Submission[]): void {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  },

  addSubmission(submission: Omit<Submission, 'id'>): Submission {
    const subs = this.getSubmissions();
    const newSub: Submission = {
      ...submission,
      id: `sub-${Date.now().toString(36)}`,
    };
    subs.unshift(newSub);
    this.saveSubmissions(subs);
    return newSub;
  },

  // Remedial & Intervention Plans (التدخل والعلاج)
  getRemedialPlans(): RemedialPlan[] {
    try {
      const data = localStorage.getItem(REMEDIAL_PLANS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return initialRemedialPlans;
  },

  saveRemedialPlans(plans: RemedialPlan[]): void {
    localStorage.setItem(REMEDIAL_PLANS_KEY, JSON.stringify(plans));
  },

  addRemedialPlan(plan: Omit<RemedialPlan, 'id' | 'createdAt'>): RemedialPlan {
    const plans = this.getRemedialPlans();
    const newPlan: RemedialPlan = {
      ...plan,
      id: `rem-plan-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    plans.unshift(newPlan);
    this.saveRemedialPlans(plans);
    return newPlan;
  },

  updateRemedialPlan(updated: RemedialPlan): void {
    const plans = this.getRemedialPlans().map((p) => (p.id === updated.id ? updated : p));
    this.saveRemedialPlans(plans);
  },

  deleteRemedialPlan(planId: string): void {
    const plans = this.getRemedialPlans().filter((p) => p.id !== planId);
    this.saveRemedialPlans(plans);
  },

  // Reset to defaults
  resetAllData(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialSettings));
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(initialSections));
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(initialStudents));
    localStorage.setItem(TESTS_KEY, JSON.stringify(initialTests));
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(initialSubmissions));
    localStorage.setItem('etqan_science_badges_v1', JSON.stringify(initialBadges));
    localStorage.setItem('etqan_science_gamification_v1', JSON.stringify(initialGamificationData));
    localStorage.setItem(REMEDIAL_PLANS_KEY, JSON.stringify(initialRemedialPlans));
  },

  // Gamification (Points & Badges)
  getBadges(): import('../types').Badge[] {
    try {
      const data = localStorage.getItem('etqan_science_badges_v1');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return initialBadges;
  },

  getAllGamification(): Record<string, import('../types').StudentGamification> {
    try {
      const data = localStorage.getItem('etqan_science_gamification_v1');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return initialGamificationData;
  },

  getStudentGamification(studentId: string): import('../types').StudentGamification {
    const all = this.getAllGamification();
    if (all[studentId]) return all[studentId];

    // default entry
    const newEntry: import('../types').StudentGamification = {
      studentId,
      points: 50,
      level: 1,
      levelTitle: 'مستكشف مبتدئ 🔬',
      earnedBadgeIds: ['badge-streak'],
      simulationsCompleted: [],
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
    };
    all[studentId] = newEntry;
    localStorage.setItem('etqan_science_gamification_v1', JSON.stringify(all));
    return newEntry;
  },

  calculateLevelTitle(level: number): string {
    if (level >= 6) return 'كبير علماء إتقان ⭐⭐⭐';
    if (level === 5) return 'عالم علوم عبقري ⭐⭐';
    if (level === 4) return 'باحث علمي متميز ⭐';
    if (level === 3) return 'مكتشف علوم نشط 🚀';
    if (level === 2) return 'مستكشف علمي بارع 📘';
    return 'مستكشف مبتدئ 🔬';
  },

  awardStudentActivity(
    studentId: string,
    pointsGained: number,
    options?: {
      simulationId?: string;
      isQuizPass?: boolean;
      quizPercentage?: number;
      domain?: string;
    }
  ): { gamification: import('../types').StudentGamification; newBadges: import('../types').Badge[] } {
    const all = this.getAllGamification();
    const current = this.getStudentGamification(studentId);
    const newBadges: import('../types').Badge[] = [];

    current.points += pointsGained;
    // Level formula: 100 points per level
    const newLevel = Math.max(1, Math.floor(current.points / 100) + 1);
    current.level = newLevel;
    current.levelTitle = this.calculateLevelTitle(newLevel);
    current.lastActiveDate = new Date().toISOString().split('T')[0];

    // Check milestone badge unlocking
    const allBadges = this.getBadges();
    allBadges.forEach((badge) => {
      if (current.earnedBadgeIds.includes(badge.id)) return;

      let unlock = false;
      if (badge.id === 'badge-ecosystem' && options?.domain === 'علوم الحياة') {
        unlock = true;
      } else if (badge.id === 'badge-biologist' && (options?.quizPercentage || 0) >= 80) {
        unlock = true;
      } else if (badge.id === 'badge-physicist' && (options?.quizPercentage || 0) >= 85) {
        unlock = true;
      } else if (badge.id === 'badge-nafes-gold' && (options?.quizPercentage || 0) >= 90) {
        unlock = true;
      } else if (badge.id === 'badge-lab-master' && ((options?.quizPercentage || 0) === 100 || current.points >= 350)) {
        unlock = true;
      } else if (badge.pointsRequired && current.points >= badge.pointsRequired) {
        unlock = true;
      }

      if (unlock) {
        current.earnedBadgeIds.push(badge.id);
        newBadges.push(badge);
      }
    });

    all[studentId] = current;
    localStorage.setItem('etqan_science_gamification_v1', JSON.stringify(all));
    return { gamification: current, newBadges };
  },

  // Interactive Science Simulations
  getSimulations(): import('../types').ScienceSimulation[] {
    try {
      const data = localStorage.getItem('etqan_science_simulations_v1');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return initialSimulations;
  },

  saveSimulations(sims: import('../types').ScienceSimulation[]): void {
    localStorage.setItem('etqan_science_simulations_v1', JSON.stringify(sims));
  },

  getSimulationsByGrade(grade: GradeLevel): import('../types').ScienceSimulation[] {
    return this.getSimulations().filter((s) => s.grade === grade && s.isActive);
  },

  addSimulation(sim: Omit<import('../types').ScienceSimulation, 'id' | 'createdAt'>): import('../types').ScienceSimulation {
    const list = this.getSimulations();
    const newSim: import('../types').ScienceSimulation = {
      ...sim,
      id: `sim-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    list.unshift(newSim);
    this.saveSimulations(list);
    return newSim;
  },

  updateSimulation(updated: import('../types').ScienceSimulation): void {
    const list = this.getSimulations().map((s) => (s.id === updated.id ? updated : s));
    this.saveSimulations(list);
  },

  deleteSimulation(simId: string): void {
    const list = this.getSimulations().filter((s) => s.id !== simId);
    this.saveSimulations(list);
  },

  // Curriculum Skills & Nafes Outcomes
  getCurriculumSkills(): import('../utils/exportUtils').CurriculumSkillItem[] {
    try {
      const data = localStorage.getItem('etqan_science_curriculum_skills_v1');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return initialCurriculumItems;
  },

  saveCurriculumSkills(items: import('../utils/exportUtils').CurriculumSkillItem[]): void {
    localStorage.setItem('etqan_science_curriculum_skills_v1', JSON.stringify(items));
  },

  addCurriculumSkill(item: Omit<import('../utils/exportUtils').CurriculumSkillItem, 'id'>): import('../utils/exportUtils').CurriculumSkillItem {
    const list = this.getCurriculumSkills();
    const newItem: import('../utils/exportUtils').CurriculumSkillItem = {
      ...item,
      id: `skill-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    };
    list.unshift(newItem);
    this.saveCurriculumSkills(list);
    return newItem;
  },

  addBulkCurriculumSkills(items: Omit<import('../utils/exportUtils').CurriculumSkillItem, 'id'>[]): import('../utils/exportUtils').CurriculumSkillItem[] {
    const list = this.getCurriculumSkills();
    const newItems = items.map((item, idx) => ({
      ...item,
      id: `skill-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    }));
    const updated = [...newItems, ...list];
    this.saveCurriculumSkills(updated);
    return newItems;
  },

  deleteCurriculumSkill(id: string): void {
    const list = this.getCurriculumSkills().filter((i) => i.id !== id);
    this.saveCurriculumSkills(list);
  },
};

