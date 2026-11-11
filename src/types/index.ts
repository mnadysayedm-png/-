export type GradeLevel = '4' | '5' | '6';

export type ScienceDomain = 'علوم الحياة' | 'علوم الأرض والفضاء' | 'العلوم الفيزيائية' | 'المهارات والعمليات العلمية';

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  skillName: string; // e.g. "تفسير السلاسل الغذائية" or "التمييز بين التغير الفيزيائي والكيميائي"
  domain: ScienceDomain;
  grade: GradeLevel;
  difficulty?: 'سهل' | 'متوسط' | 'متقدم';
  diagramUrl?: string;
  diagramEmoji?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  grade: GradeLevel;
  domain: ScienceDomain | 'شامل - نافس';
  targetSections?: string[]; // empty or undefined means all sections in the grade
  targetStudentIds?: string[]; // if set, ONLY targeted students can see/take this test!
  isRemedial?: boolean; // mark if it's a remedial/intervention test
  targetSkillName?: string; // target skill being remediated
  durationMinutes: number;
  passingScorePercentage: number;
  isActive: boolean;
  isNafesBenchmark: boolean;
  questions: Question[];
  createdAt: string;
}

export interface RemedialPlan {
  id: string;
  grade: GradeLevel;
  sectionId?: string; // or 'all'
  studentId?: string; // if individual
  studentName?: string;
  skillName: string;
  domain?: ScienceDomain | string;
  strategy: string; // e.g. "مراجعة المفهوم العلمي وتجارب محاكاة تفاعلية", "أوراق عمل تدريبية موجهة", etc.
  assignedTestId?: string;
  assignedTestTitle?: string;
  status: 'planned' | 'in_progress' | 'completed';
  createdAt: string;
  notes?: string;
}

export interface Section {
  id: string;
  grade: GradeLevel;
  name: string; // e.g. "أ", "ب", "ج", "د"
  label: string; // e.g. "رابع / أ"
}

export interface Student {
  id: string;
  name: string;
  grade: GradeLevel;
  sectionId: string;
  nationalId?: string;
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface Submission {
  id: string;
  testId: string;
  testTitle: string;
  grade: GradeLevel;
  studentId: string;
  studentName: string;
  sectionName: string;
  answers: StudentAnswer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  timeSpentSeconds: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  category: 'life' | 'physical' | 'earth' | 'benchmark' | 'simulation' | 'general';
  pointsRequired?: number;
  quizzesRequired?: number;
  conditionDescription: string;
}

export interface StudentGamification {
  studentId: string;
  points: number;
  level: number;
  levelTitle: string;
  earnedBadgeIds: string[];
  simulationsCompleted: string[];
  streakDays: number;
  lastActiveDate: string;
}

export type SimulationDomain = 'علوم الحياة' | 'العلوم الفيزيائية' | 'علوم الأرض والفضاء' | 'البيئة والأنظمة الحيوية';

export interface ScienceSimulation {
  id: string;
  title: string;
  description: string;
  grade: GradeLevel;
  domain: SimulationDomain;
  estimatedMinutes: number;
  pointsReward: number;
  badgeRewardId?: string;
  simulationType: 'food-chain' | 'cell-microscope' | 'electric-circuit' | 'matter-change' | 'custom';
  objective: string;
  instructions: string[];
  customEmbedUrl?: string;
  createdAt: string;
  isActive: boolean;
}

export interface PlatformSettings {
  platformTitle: string;
  subtitle: string;
  schoolName: string;
  teacherName: string;
  teacherTitle: string;
  principalName?: string; // اسم مدير المدرسة
  schoolLogoUrl?: string; // شعار المدارس (مفرغ وبدون خلفية)
  studentPin: string; // Default: '1234'
  teacherPassword: string; // Default: '10111983'
  allowStudentRetry: boolean;
  showExplanationsToStudents: boolean;
  gamificationEnabled: boolean;
  pointsPerCorrectAnswer: number; // e.g. 10
  pointsPerQuizCompletion: number; // e.g. 50
  pointsPerSimulationCompletion: number; // e.g. 100
}
