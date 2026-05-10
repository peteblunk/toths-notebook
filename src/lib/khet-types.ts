// ─────────────────────────────────────────────────────────────
// 🏋️ KHET-STATION — Workout System Type Definitions
// ─────────────────────────────────────────────────────────────

export type WorkoutSplit = 'PPL' | 'UpperLower' | 'FullBody';
export type WorkoutFrequency = 3 | 4 | 5 | 6;
export type CardioType = 'Stairs' | 'Treadmill' | 'Row' | 'Elliptical' | 'Cycling' | 'Other';

/** A single set within an exercise log */
export interface SetLog {
  weight: number;      // kg
  reps: number;
  rpe?: number;        // Rate of Perceived Exertion 1–10
  completed: boolean;
}

/** All sets logged for one exercise in a session */
export interface ExerciseLog {
  exerciseId: string;
  name: string;
  sets: SetLog[];
  notes?: string;
  /** Set when the user uses a Today-Only alternative. Preserves original for ghost log lookup. */
  originalExerciseId?: string;
  originalName?: string;
}

/** Cardio component of a session */
export interface CardioLog {
  type: CardioType;
  duration: number;    // minutes
  distance?: number;   // stored in the user's preferred DistanceUnit
  calories?: number;
  avgBPM?: number;     // average heart rate
  rpe?: number;        // rate of perceived exertion 1–10
}

/** A completed or in-progress workout session stored in Firestore */
export interface WorkoutSession {
  id: string;
  userId: string;
  programId: string;
  programName: string;
  dayIndex: number;
  dayLabel: string;
  date: string;        // ISO date string (YYYY-MM-DD)
  completedAt?: string; // ISO timestamp when session was saved (for late-night grouping)
  exerciseLogs: ExerciseLog[];
  cardioLog?: CardioLog;
  absLogs?: ExerciseLog[];
  notes?: string;
  completed: boolean;
  totalVolume: number; // sum of weight × reps across all completed sets
  durationMinutes?: number; // how long the session lasted
  linkedTaskId?: string | null;
  linkedRitualId?: string | null;
}

/** An exercise slot inside a program day */
export interface ProgramExercise {
  exerciseId: string;
  name: string;
  sets: number;        // suggested set count
  goalReps: string;    // e.g. "8–12" or "5"
  notes?: string;
  /** When true, Tally Mode is auto-enabled for this exercise (high-rep bodyweight / HIIT) */
  isHighVolume?: boolean;
}

/** One training day within a program (e.g. "Push A") */
export interface WorkoutDay {
  label: string;
  exercises: ProgramExercise[];
}

export type DeloadStrategy =
  | 'reduce-volume'
  | 'reduce-intensity'
  | 'reduce-reps'
  | 'reduce-frequency';

/** A full workout program (mesocycle) stored in Firestore */
export interface WorkoutProgram {
  id: string;
  userId: string;
  name: string;
  split: WorkoutSplit;
  frequency: WorkoutFrequency;
  days: WorkoutDay[];
  linkedTaskId?: string | null;
  linkedRitualId?: string | null;
  mesocycleStart?: string | null;  // ISO date — triggers 42-day adaptation alert
  createdAt: string;               // ISO date
  lastSessionDate?: string | null;
  lastSessionDayIndex?: number | null;
  lifetimeVolume: number;          // cumulative kg displaced across all sessions
  durationWeeks?: number;          // planned program length (8–12 weeks, default 8)
  deloadStrategy?: DeloadStrategy; // preferred deload method
  lastDeloadStart?: string | null; // ISO date deload week began
  lastDeloadEnd?: string | null;   // ISO date deload week ended
  isDeloading?: boolean;           // true while a deload week is active
  sessionsCompleted?: number;        // total sessions logged against this program
}

/**
 * Per-exercise personal record — USER-SCOPED (lifetime, all programs).
 * Computed client-side by scanning all khetSessions for the user.
 */
export interface ExercisePR {
  exerciseId: string;
  name: string;
  /** Best single-set weight ever lifted (any rep count) */
  bestWeight: number;
  /** Reps performed at that best weight */
  bestRepsAtBestWeight: number;
  /** Estimated 1-rep max using the Brzycki formula: w / (1.0278 − 0.0278 × r) */
  best1RM: number;
  /** ISO date the best weight was set */
  bestWeightDate: string;
  /** Which program was running when the PR was set */
  bestWeightProgram: string;
  /** Best total exercise volume in a single session (Σ weight × reps) */
  bestSessionVolume: number;
  /** ISO date of the best-volume session */
  bestVolumeDate: string;
  /** Total lifetime volume for this exercise across all sessions */
  lifetimeVolume: number;
  /** Number of sessions this exercise has appeared in */
  sessionCount: number;
  /** Volume per session for sparkline: [{date, volume}] — last 20 sessions */
  history: { date: string; volume: number; maxWeight: number }[];
}

/**
 * Per-program progress summary — PROGRAM-SCOPED.
 * PRs are NOT included here; use the global ExercisePR[] for that.
 */
export interface ProgramProgress {
  programId: string;
  programName: string;
  totalSessions: number;
  totalVolume: number;
  firstSessionDate: string;
  lastSessionDate: string;
  /** Volume per session: [{date, volume}] */
  volumeHistory: { date: string; volume: number }[];
}

// ─────────────────────────────────────────────────────────────
// Gainz — Global Statistics
// ─────────────────────────────────────────────────────────────

/** A foundational movement PR tracked in the Hall of PRs */
export interface FoundationalPR {
  movement: string;           // display name, e.g. "Bench Press"
  matchTerms: string[];       // lowercase substrings to match exercise names
  category: 'big3' | 'ohp' | 'row' | 'calisthenics';
  /** For weighted: best weight in kg */
  bestWeight: number;
  /** For calisthenics: best reps in one set (or seconds for plank) */
  bestReps: number;
  /** Estimated 1RM (Brzycki). 0 for bodyweight movements. */
  best1RM: number;
  bestDate: string;
  bestProgramName: string;
  /** True when this PR came from a manual entry rather than a logged session */
  isManual?: boolean;
  manualNotes?: string;
}

/** Definition used to match exercise names to foundational movements */
export type FoundationalPRDef = Omit<FoundationalPR, 'bestWeight' | 'bestReps' | 'best1RM' | 'bestDate' | 'bestProgramName' | 'isManual' | 'manualNotes'>;

/** Canonical list of tracked foundational movements — shared between hook and UI */
export const FOUNDATIONAL_MOVEMENTS: FoundationalPRDef[] = [
  { movement: 'Bench Press',         matchTerms: ['bench press', 'bench'],                                        category: 'big3' },
  { movement: 'Back Squat',          matchTerms: ['squat'],                                                       category: 'big3' },
  { movement: 'Deadlift',            matchTerms: ['deadlift'],                                                    category: 'big3' },
  { movement: 'Overhead Press',      matchTerms: ['overhead press', 'ohp', 'shoulder press', 'military press'],  category: 'ohp' },
  { movement: 'Barbell Row',         matchTerms: ['barbell row', 'bent over row', 'bb row', 'pendlay'],          category: 'row' },
  { movement: 'Pull-ups / Chin-ups', matchTerms: ['pull-up', 'pullup', 'pull up', 'chin-up', 'chinup', 'chin up'], category: 'calisthenics' },
  { movement: 'Dips',                matchTerms: ['dip'],                                                         category: 'calisthenics' },
  { movement: 'Push-ups',            matchTerms: ['push-up', 'pushup', 'push up'],                               category: 'calisthenics' },
  { movement: 'Plank',               matchTerms: ['plank'],                                                       category: 'calisthenics' },
];

/** Per-day heatmap bucket */
export interface HeatmapDay {
  date: string;   // ISO date
  count: number;  // sessions that day (0, 1, 2+)
}

/** Master global-stats object computed from all sessions */
export interface WeekStats {
  sessions: number;
  volumeKg: number;
  reps: number;
  minutes: number;
  weekStart: string; // ISO date of Monday
  weekEnd: string;   // ISO date of Sunday
  /** Mon–Sun, 7 entries */
  days: { date: string; label: string; sessions: number }[];
}

export interface GlobalStats {
  /** First ever session date */
  trainingStartDate: string;
  /** Days since trainingStartDate */
  totalDaysTraining: number;
  totalSessions: number;
  /** Sum of all session totalVolume */
  totalVolumeKg: number;
  /** Sum of every completed rep across all sessions */
  totalReps: number;
  /** Sum of durationMinutes across sessions that have it */
  totalMinutes: number;
  /** Current consecutive weeks hitting ≥1 session */
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  /** Last 90 calendar days, one entry per day */
  heatmap: HeatmapDay[];
  /** The Hall of PRs */
  foundationalPRs: FoundationalPR[];
  /** Stats for the current Mon–Sun week */
  weekStats: WeekStats;
}

/** Weight unit preference — 'lbs' is the default */
export type WeightUnit = 'lbs' | 'kg';

/** Distance unit preference — 'miles' is the default */
export type DistanceUnit = 'miles' | 'km';

/** User profile / settings stored in khetSettings/{docId} */
export interface KhetUserSettings {
  userId: string;
  /** Preferred weight unit — defaults to 'lbs' when not set */
  weightUnit?: WeightUnit;
  /** Preferred distance unit — defaults to 'miles' when not set */
  distanceUnit?: DistanceUnit;

  // ── Core stats ──────────────────────────────────────────────
  /** Body weight in the user's chosen weightUnit */
  bodyWeight?: number;
  /** Daily maintenance calorie target */
  maintenanceCalories?: number;
  /** Gym name / training location */
  gymName?: string;

  // ── Body Composition ────────────────────────────────────────
  /** Height — cm when distanceUnit=km, inches when miles */
  height?: number;
  /** Estimated body fat percentage */
  estimatedBodyFat?: number;
  /** Resting heart rate in BPM */
  restingHeartRate?: number;

  // ── Aesthetic Measurements ──────────────────────────────────
  /** Neck circumference in the user's length unit */
  neckCircumference?: number;
  /** Waist circumference in the user's length unit */
  waistCircumference?: number;
  /** Hip circumference in the user's length unit */
  hipCircumference?: number;
  /** Chest circumference in the user's length unit */
  chestCircumference?: number;
  /** Bicep circumference (dominant arm snapshot) in the user's length unit */
  bicepCircumference?: number;
  /** Thigh circumference in the user's length unit */
  thighCircumference?: number;
  /** Calf circumference in the user's length unit */
  calfCircumference?: number;

  // ── Gym Specs / Tactical ────────────────────────────────────
  /** Free-text injury limitations / notes */
  injuryLog?: string;
  /** Available equipment tags */
  equipmentAccess?: string[];
  /** ISO date string — when the user started their sober streak */
  sobrietyStartDate?: string;
}

// ─────────────────────────────────────────────────────────────
// Measurement Logs — time-series body composition tracking
// Stored in Firestore collection: measurementLogs
// ─────────────────────────────────────────────────────────────

/** Measurement categories for time-series tracking */
export type MeasurementCategory =
  | 'WEIGHT'
  | 'BODY_FAT'
  | 'NECK'
  | 'WAIST'
  | 'HIPS'
  | 'RESTING_HR'
  | 'HEIGHT'
  | 'CHEST'
  | 'BICEP_L'
  | 'BICEP_R'
  | 'THIGH_L'
  | 'THIGH_R'
  | 'CALF';

/** Human-readable label for each category */
export const MEASUREMENT_LABELS: Record<MeasurementCategory, string> = {
  WEIGHT:     'Body Weight',
  BODY_FAT:   'Body Fat',
  NECK:       'Neck',
  WAIST:      'Waist',
  HIPS:       'Hips',
  RESTING_HR: 'Resting HR',
  HEIGHT:     'Height',
  CHEST:      'Chest',
  BICEP_L:    'Bicep (L)',
  BICEP_R:    'Bicep (R)',
  THIGH_L:    'Thigh (L)',
  THIGH_R:    'Thigh (R)',
  CALF:       'Calf',
};

/** All available measurement categories in display order */
export const MEASUREMENT_CATEGORIES: MeasurementCategory[] = [
  'WEIGHT', 'BODY_FAT', 'NECK', 'WAIST', 'HIPS', 'RESTING_HR', 'HEIGHT',
  'CHEST', 'BICEP_L', 'BICEP_R', 'THIGH_L', 'THIGH_R', 'CALF',
];

/** Units suffix for each category given weight preference */
export function getMeasurementUnit(
  category: MeasurementCategory,
  weightUnit: WeightUnit,
): string {
  switch (category) {
    case 'WEIGHT':     return weightUnit;
    case 'BODY_FAT':   return '%';
    case 'RESTING_HR': return 'BPM';
    case 'HEIGHT':     return weightUnit === 'lbs' ? 'in' : 'cm';
    default:           return weightUnit === 'lbs' ? 'in' : 'cm'; // circumferences
  }
}

/**
 * Per-day delta thresholds for "impossible change" validation.
 * If the absolute delta per day exceeds these, the user is asked to confirm.
 */
export const MEASUREMENT_OUTLIER_THRESHOLDS: Record<MeasurementCategory, number> = {
  WEIGHT:     15,   // lbs or kg — 15 units per day is a red flag
  BODY_FAT:   5,    // 5% per day
  NECK:       3,    // in / cm
  WAIST:      4,
  HIPS:       4,
  RESTING_HR: 30,   // BPM
  HEIGHT:     2,    // in / cm
  CHEST:      4,
  BICEP_L:    2,
  BICEP_R:    2,
  THIGH_L:    3,
  THIGH_R:    3,
  CALF:       2,
};

/** A single time-series measurement entry stored in measurementLogs collection */
export interface MeasurementLog {
  id: string;
  userId: string;
  /** ISO date string YYYY-MM-DD — the date the measurement was taken */
  timestamp: string;
  category: MeasurementCategory;
  value: number;
  /** The unit string at time of entry (e.g. 'lbs', 'kg', 'in', 'cm', '%', 'BPM') */
  unit: string;
  /** Optional user note */
  notes?: string;
}

/** A manually entered personal record stored in khetManualPRs */
export interface KhetManualPR {
  id: string;
  userId: string;
  /** Must match a movement name from FOUNDATIONAL_MOVEMENTS */
  movement: string;
  bestWeight: number;
  bestReps: number;
  best1RM: number;
  date: string;  // ISO date
  notes?: string;
  isEncrypted?: boolean;
  iv?: string;
  encryptedPayload?: string;
}

/** An exercise entry from the data-agnostic exercise database */
export interface Exercise {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  equipment: string[];
  equivalents: string[]; // array of exercise IDs with biomechanical similarity
  /** Hypertrophy engine fields (populated in full_expanded_exercises.json) */
  tier?: 1 | 2 | 3;
  pattern?: string;
  suggestedReps?: string;
  cues?: string[];
}

/** User Discovery Phase inputs for the Hypertrophy Engine */
export type ProgramGoal = 'Aesthetics' | 'Strength' | 'Conditioning';
export type ProgramTimeSlot = '45m' | '60m' | '90m';
export type ProgramEquipment = 'Full Gym' | 'Home' | 'Dumbbells Only';

// ─────────────────────────────────────────────────────────────
// Cardio Personal Records (Endurance Engine)
// ─────────────────────────────────────────────────────────────

/** Per-exercise cardio PRs tracked by the Endurance Engine */
export interface CardioPR {
  exerciseId: string;
  exerciseName: string;
  /** Maximum watts sustained in a single interval */
  maxWatts?: number;
  maxWattsDate?: string;
  /** Best pace in seconds per km */
  bestPaceSecPerKm?: number;
  bestPaceDate?: string;
  /** Highest calorie session total */
  highestCalorieSession?: number;
  highestCalorieDate?: string;
  /** Highest average BPM for a session */
  highestAvgBPM?: number;
  highestAvgBPMDate?: string;
  /** Total sessions logged for this exercise */
  sessionCount: number;
  /** Last 20 sessions for sparkline */
  history: { date: string; calories: number; avgBPM?: number; durationMinutes?: number }[];
}

// ─────────────────────────────────────────────────────────────
// Session Reducer Types (used by the active session page)
// ─────────────────────────────────────────────────────────────

export interface ActiveSessionState {
  exerciseLogs: ExerciseLog[];
  notes: string;
  startDate: string;
}

export type SessionAction =
  | { type: 'UPDATE_SET'; exerciseIdx: number; setIdx: number; updates: Partial<SetLog> }
  | { type: 'ADD_SET'; exerciseIdx: number }
  | { type: 'REMOVE_SET'; exerciseIdx: number }
  | { type: 'SWAP_EXERCISE'; exerciseIdx: number; newExercise: ProgramExercise }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'SET_EXERCISE_NOTES'; exerciseIdx: number; notes: string };
