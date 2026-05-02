// ─────────────────────────────────────────────────────────────
// 🧘 KHET-STATION — Mobility & Recovery Type Definitions
// ─────────────────────────────────────────────────────────────

export type TightSpot = 'Hips' | 'Lower Back' | 'Shoulders' | 'Ankles' | 'Hamstrings';

export interface MobilityExercise {
  id: string;
  name: string;
  targets: string[];
  tightSpots: TightSpot[];
  baseHoldSeconds: number;
  reps?: number;
  breaths: number;
  sides: 'bilateral' | 'left-right';
  cues: string;
  difficulty: 1 | 2 | 3;
  modifications: string[];
  isDynamic?: boolean;
}

export interface MobilitySlot {
  exerciseId: string;
  holdSeconds: number;   // 0 for dynamic exercises
  sets: number;
  isDynamic: boolean;
  reps?: number;         // for dynamic exercises
}

export interface GeneratedSession {
  index: number;         // 0-based index across the full 6-week plan; -1 for pre-bed
  week: number;          // 1–6; 0 for pre-bed
  label: string;         // "Day A", "Day B", "Session 1", or "Pre-Bed"
  type: 'main' | 'prebed';
  slots: MobilitySlot[];
  estimatedMinutes: number;
}

/** Stored in Firestore — mobilityPrograms/{id} */
export interface MobilityProgram {
  id: string;
  userId: string;
  name: string;
  tightSpots: TightSpot[];
  daysPerWeek: number;           // 2–6
  includePreBed: boolean;
  structure: 'single' | 'AB';   // AB if daysPerWeek > 3
  createdAt: string;             // ISO date
  startDate: string | null;      // ISO date when first session completed
  lastSessionDate: string | null;
  lastSessionIndex: number;      // -1 = none yet
  sessionsCompleted: number;
  totalMainSessions: number;     // 6 * daysPerWeek
  weeklyLog: {
    weekStr: string;             // ISO date of Monday of the current week
    count: number;
  };
  /** User-defined exercise ordering per session type (set in wizard review step) */
  customSlotOrder?: Record<'single' | 'A' | 'B', string[]>;
}

/** Stored in Firestore — mobilitySessions/{id} */
export interface MobilitySessionLog {
  id: string;
  userId: string;
  programId: string;
  programName: string;
  sessionIndex: number;          // -1 for pre-bed
  week: number;
  label: string;
  type: 'main' | 'prebed';
  date: string;                  // ISO date YYYY-MM-DD
  slotsCompleted: string[];      // exerciseIds of completed slots
  durationMinutes: number;
  completed: boolean;
  levelUpMode?: boolean;          // was Level-Up Mode active?
}

export interface MobilityStats {
  totalSessions: number;
  levelUpSessions: number;
  totalMinutes: number;
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  heatmap: { date: string; count: number; hasLevelUp: boolean }[];  // 90 days newest-last
  programBreakdown: { programName: string; sessions: number }[];
}

// ─────────────────────────────────────────────────────────────
// Plan generation
// ─────────────────────────────────────────────────────────────

/** IDs that always appear regardless of tight-spot selection */
const UNIVERSAL_IDS = new Set([
  'cat-cow',
  'childs-pose',
  'worlds-greatest-stretch',
  'supine-spinal-twist',
  'supine-knee-to-chest',
]);

/** Exercise templates per session structure and progression phase */
const TEMPLATES = {
  single: {
    p1: [
      'cat-cow',
      'worlds-greatest-stretch',
      'hip-flexor-lunge',
      'figure-4-lying',
      'supine-knee-to-chest',
      'supine-spinal-twist',
      'standing-hamstring-stretch',
      'wall-calf-stretch',
      'cross-body-shoulder-stretch',
      'childs-pose',
    ],
    p2: [
      'cat-cow',
      'worlds-greatest-stretch',
      'couch-stretch',
      '90-90-hip-stretch',
      'press-up-cobra',
      'thread-the-needle',
      'seated-forward-fold',
      'half-kneel-ankle-stretch',
      'doorway-chest-stretch',
      'supine-spinal-twist',
      'childs-pose',
    ],
    p3: [
      'cat-cow',
      'worlds-greatest-stretch',
      'couch-stretch',
      'pigeon-pose',
      'frog-stretch',
      'press-up-cobra',
      'seated-forward-fold',
      'deep-squat-hold',
      'sleeper-stretch',
      'overhead-lat-stretch',
      'supine-spinal-twist',
      'childs-pose',
    ],
  },
  A: {
    p1: [
      'worlds-greatest-stretch',
      'hip-flexor-lunge',
      'figure-4-lying',
      'lateral-lunge',
      'standing-hamstring-stretch',
      'supine-hamstring-stretch',
      'wall-calf-stretch',
      'childs-pose',
    ],
    p2: [
      'worlds-greatest-stretch',
      'couch-stretch',
      '90-90-hip-stretch',
      'frog-stretch',
      'supine-hamstring-stretch',
      'seated-forward-fold',
      'half-kneel-ankle-stretch',
      'childs-pose',
    ],
    p3: [
      'worlds-greatest-stretch',
      'couch-stretch',
      'pigeon-pose',
      'frog-stretch',
      'deep-squat-hold',
      'seated-forward-fold',
      'supine-hamstring-stretch',
      'half-kneel-ankle-stretch',
      'bent-knee-calf-stretch',
    ],
  },
  B: {
    p1: [
      'cat-cow',
      'supine-knee-to-chest',
      'supine-spinal-twist',
      'press-up-cobra',
      'thread-the-needle',
      'cross-body-shoulder-stretch',
      'doorway-chest-stretch',
      'childs-pose',
    ],
    p2: [
      'cat-cow',
      'quadruped-rock-back',
      'supine-spinal-twist',
      'press-up-cobra',
      'thread-the-needle',
      'sleeper-stretch',
      'doorway-chest-stretch',
      'overhead-lat-stretch',
      'childs-pose',
    ],
    p3: [
      'cat-cow',
      'quadruped-rock-back',
      'supine-spinal-twist',
      'press-up-cobra',
      'thread-the-needle',
      'sleeper-stretch',
      'overhead-lat-stretch',
      'wall-pec-stretch',
      'childs-pose',
    ],
  },
};

const PREBED_IDS = [
  'supine-knee-to-chest',
  'supine-spinal-twist',
  'happy-baby',
  'legs-up-wall',
  'childs-pose',
];

function getPhase(week: number): 'p1' | 'p2' | 'p3' {
  if (week <= 2) return 'p1';
  if (week <= 4) return 'p2';
  return 'p3';
}

function getHoldSeconds(baseHold: number, week: number): number {
  const multiplier = week <= 2 ? 1.0 : week <= 4 ? 1.35 : 1.65;
  return Math.round(baseHold * multiplier);
}

function getSets(week: number, isDynamic: boolean): number {
  if (isDynamic) return 1;
  return week >= 5 ? 2 : 1;
}

function estimateMinutes(slots: MobilitySlot[], byId: Map<string, MobilityExercise>): number {
  let totalSeconds = 0;
  for (const slot of slots) {
    const ex = byId.get(slot.exerciseId);
    if (!ex) continue;
    if (slot.isDynamic) {
      totalSeconds += (slot.reps ?? 10) * 4;
    } else {
      const sides = ex.sides === 'left-right' ? 2 : 1;
      totalSeconds += slot.holdSeconds * slot.sets * sides;
      totalSeconds += 10; // transition
    }
  }
  return Math.max(1, Math.ceil(totalSeconds / 60));
}

export function generateMobilityPlan(
  config: Pick<MobilityProgram, 'tightSpots' | 'daysPerWeek' | 'includePreBed' | 'structure' | 'customSlotOrder'>,
  allExercises: MobilityExercise[],
): GeneratedSession[] {
  const byId = new Map(allExercises.map((e) => [e.id, e]));
  const { tightSpots, daysPerWeek, structure, customSlotOrder } = config;

  const filterIds = (ids: string[], typeKey?: 'single' | 'A' | 'B'): string[] => {
    // If user has a custom exercise list for this type, use it as the authoritative source.
    // This preserves deletes, adds, and swaps the user made in the wizard or card editor.
    if (typeKey && customSlotOrder?.[typeKey] && customSlotOrder[typeKey].length > 0) {
      return customSlotOrder[typeKey];
    }
    // Otherwise filter template IDs by tight spots (backward compat + programs without customSlotOrder)
    return ids.filter((id) => {
      if (UNIVERSAL_IDS.has(id)) return true;
      const ex = byId.get(id);
      if (!ex) return false;
      return ex.tightSpots.some((ts) => (tightSpots as string[]).includes(ts));
    });
  };

  const makeSlots = (ids: string[], week: number): MobilitySlot[] =>
    ids
      .map((id): MobilitySlot | null => {
        const ex = byId.get(id);
        if (!ex) return null;
        const isDynamic = ex.isDynamic ?? false;
        return {
          exerciseId: id,
          holdSeconds: isDynamic ? 0 : getHoldSeconds(ex.baseHoldSeconds, week),
          sets: getSets(week, isDynamic),
          isDynamic,
          reps: isDynamic ? (ex.reps ?? 10) : undefined,
        };
      })
      .filter((s): s is MobilitySlot => s !== null);

  const sessions: GeneratedSession[] = [];

  for (let week = 1; week <= 6; week++) {
    const phase = getPhase(week);
    for (let dayOfWeek = 0; dayOfWeek < daysPerWeek; dayOfWeek++) {
      const sessionIndex = (week - 1) * daysPerWeek + dayOfWeek;
      let templateIds: string[];
      let label: string;

      if (structure === 'AB') {
        const isA = dayOfWeek % 2 === 0;
        templateIds = filterIds(TEMPLATES[isA ? 'A' : 'B'][phase], isA ? 'A' : 'B');
        label = isA ? 'Day A' : 'Day B';
      } else {
        templateIds = filterIds(TEMPLATES.single[phase], 'single');
        label = daysPerWeek > 1 ? `Session ${dayOfWeek + 1}` : 'Session';
      }

      const slots = makeSlots(templateIds, week);
      sessions.push({
        index: sessionIndex,
        week,
        label,
        type: 'main',
        slots,
        estimatedMinutes: estimateMinutes(slots, byId),
      });
    }
  }

  return sessions;
}

export function generatePrebedSession(allExercises: MobilityExercise[]): GeneratedSession {
  const byId = new Map(allExercises.map((e) => [e.id, e]));
  const slots: MobilitySlot[] = PREBED_IDS.map((id): MobilitySlot | null => {
    const ex = byId.get(id);
    if (!ex) return null;
    return {
      exerciseId: id,
      holdSeconds: ex.baseHoldSeconds,
      sets: 1,
      isDynamic: false,
    };
  }).filter((s): s is MobilitySlot => s !== null);

  return {
    index: -1,
    week: 0,
    label: 'Pre-Bed',
    type: 'prebed',
    slots,
    estimatedMinutes: 10,
  };
}
