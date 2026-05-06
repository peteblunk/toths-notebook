// ─────────────────────────────────────────────────────────────
// 🏃 KHET-STATION — Endurance & Cardio Engine Type Definitions
// ─────────────────────────────────────────────────────────────

export type CardioFitnessLevel = 'Novice' | 'Intermediate' | 'Elite';
export type CardioGoal = 'Fat Loss' | 'Engine Building' | 'VO2 Max';
export type CardioIntervalType = 'Zone2' | 'HIIT' | 'Tabata' | 'Tempo' | 'Pyramid' | 'LSD' | 'EMOM';
export type CardioExerciseCategory = 'Machine' | 'Bodyweight' | 'Outdoor' | 'Water';

export interface CardioExercise {
  id: string;
  name: string;
  category: CardioExerciseCategory;
  /** MET at moderate / Zone 2–3 intensity */
  metModerate: number;
  /** MET at high / Zone 4–5 intensity */
  metHigh: number;
  supportsWatts: boolean;
  supportsPace: boolean;
  supportsDistance: boolean;
  description: string;
  cues: string[];
}

export interface CardioInterval {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  targetRPE: number;
  targetZone: 1 | 2 | 3 | 4 | 5;
}

export interface CardioSessionSlot {
  exerciseId: string;
  exerciseName: string;
  intervalType: CardioIntervalType;
  totalDurationMinutes: number;
  warmupMinutes: number;
  cooldownMinutes: number;
  interval?: CardioInterval;
  targetRPE: number;
  targetZone: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface GeneratedCardioSession {
  index: number;
  week: number;
  label: string;
  slot: CardioSessionSlot;
  estimatedMinutes: number;
  focus: string;
  phaseName: string;
  /** Present when the program has maxModeEnabled — a burpee finisher appended to each session */
  maxFinisher?: {
    exerciseId: string;
    exerciseName: string;
    rounds: number;
    repsPerRound: number;
    notes: string;
  };
}

/** One exercise segment within a multi-modality session */
export interface CardioSegment {
  exerciseId: string;
  exerciseName: string;
  durationMinutes: number;
  calories: number;
}

/** Stored in Firestore — cardioPrograms/{id} */
export interface CardioProgram {
  id: string;
  userId: string;
  name: string;
  fitnessLevel: CardioFitnessLevel;
  goal: CardioGoal;
  primaryExerciseId: string;
  primaryExerciseName: string;
  daysPerWeek: number;
  durationWeeks: number;
  createdAt: string;
  startDate: string | null;
  lastSessionDate: string | null;
  lastSessionIndex: number;
  sessionsCompleted: number;
  totalSessions: number;
  weeklyLog: { weekStr: string; count: number };
  bodyWeightKg?: number;
  /** IDs of exercises the athlete prefers to rotate through when varietyMode is on */
  preferredExerciseIds?: string[];
  /** When true the generator rotates exercises per-session using interval-affinity rules */
  varietyMode?: boolean;
  /** When true a burpee finisher is appended to every session */
  maxModeEnabled?: boolean;
}

/** Stored in Firestore — cardioSessions/{id} */
export interface CardioSessionLog {
  id: string;
  userId: string;
  programId: string;
  programName: string;
  sessionIndex: number;
  week: number;
  label: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  durationMinutes: number;
  distance?: number;
  distanceUnit?: 'miles' | 'km';
  calories?: number;
  avgBPM?: number;
  maxBPM?: number;
  rpe?: number;
  wattsAvg?: number;
  wattsMax?: number;
  completed: boolean;
  notes?: string;
  segments?: CardioSegment[];
  /** Whether the Max Mode burpee finisher was completed */
  maxFinisherDone?: boolean;
  /** Calories attributed to the Max Mode finisher specifically */
  finisherCalories?: number;
}

export interface CardioStats {
  totalSessions: number;
  totalMinutes: number;
  totalCalories: number;
  maxCaloriesSession: number;
  bestAvgBPM: number;
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  heatmap: { date: string; count: number }[];
  programBreakdown: { programName: string; sessions: number }[];
}

// ─────────────────────────────────────────────────────────────
// Calorie Estimator  (MET × kg × hours = kcal)
// RPE 1–10 interpolates between metModerate (RPE ≤5) and metHigh (RPE 10).
// ─────────────────────────────────────────────────────────────

export function estimateCalories(
  metValue: number,
  weightKg: number,
  durationMinutes: number,
): number {
  return Math.round(metValue * weightKg * (durationMinutes / 60));
}

/**
 * Interpolate MET for a given RPE (1–10).
 * RPE ≤ 5 → metModerate, RPE 10 → metHigh, linear in between.
 */
export function metForRPE(ex: CardioExercise, rpe: number): number {
  const t = Math.max(0, Math.min(1, (rpe - 5) / 5));
  return ex.metModerate + t * (ex.metHigh - ex.metModerate);
}

/** Estimate kcal burned — uses RPE-interpolated MET for accuracy */
export function estimateCaloriesForExercise(
  ex: CardioExercise,
  weightKg: number,
  durationMinutes: number,
  rpe: number,
): number {
  return estimateCalories(metForRPE(ex, rpe), weightKg, durationMinutes);
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.2046;
}

// ─────────────────────────────────────────────────────────────
// Exercise Library
// ─────────────────────────────────────────────────────────────

export const CARDIO_EXERCISES: CardioExercise[] = [
  // ── MACHINES ──────────────────────────────────────────────
  {
    id: 'treadmill-run',
    name: 'Treadmill Run',
    category: 'Machine',
    metModerate: 8.0,
    metHigh: 13.5,
    supportsWatts: false,
    supportsPace: true,
    supportsDistance: true,
    description: 'Controlled indoor running with programmable pace and incline.',
    cues: [
      'Set incline to 1% to mimic outdoor resistance.',
      'Land midfoot directly under your hips — not heel-striking.',
      'Keep arms at 90°, driving forward not across your body.',
      'Lean slightly forward from the ankles, not the waist.',
    ],
  },
  {
    id: 'treadmill-walk-incline',
    name: 'Incline Treadmill Walk',
    category: 'Machine',
    metModerate: 5.0,
    metHigh: 7.5,
    supportsWatts: false,
    supportsPace: true,
    supportsDistance: true,
    description: 'High-incline walking — brutal calorie burn with near-zero impact.',
    cues: [
      'Do NOT hold the handrails — that defeats the purpose.',
      'Set incline to 10–15%; speed 2.5–4 mph.',
      'Keep chest up, shoulders back.',
      'Drive through your glutes with each step.',
    ],
  },
  {
    id: 'rowing-machine',
    name: 'Rowing Machine',
    category: 'Machine',
    metModerate: 7.0,
    metHigh: 12.0,
    supportsWatts: true,
    supportsPace: true,
    supportsDistance: true,
    description: 'Full-body cardio king — legs, back, core, arms in one pull.',
    cues: [
      'Sequence: legs → body → arms on the drive; reverse on recovery.',
      'Maintain a 1:2 drive-to-recovery ratio.',
      'Keep the handle path horizontal — no roller-coaster arcs.',
      'Damper setting 3–5 is optimal for most athletes.',
    ],
  },
  {
    id: 'assault-bike',
    name: 'Assault Bike (AirBike)',
    category: 'Machine',
    metModerate: 10.0,
    metHigh: 14.5,
    supportsWatts: true,
    supportsPace: false,
    supportsDistance: false,
    description: 'The most savage machine in any gym. Resistance scales with effort.',
    cues: [
      'Push AND pull the handles — use your full upper body.',
      'Stay seated for longer efforts; stand for max-effort sprints.',
      'Control your breathing — in through nose, out through mouth.',
      'Keep RPM above 60 to avoid stalling the flywheel.',
    ],
  },
  {
    id: 'stationary-bike',
    name: 'Stationary Bike',
    category: 'Machine',
    metModerate: 7.0,
    metHigh: 12.0,
    supportsWatts: true,
    supportsPace: false,
    supportsDistance: true,
    description: 'Low-impact cycling ergometer. Excellent for Zone 2 work.',
    cues: [
      'Seat height: slight bend at knee at bottom of pedal stroke.',
      'Maintain 80–100 RPM for efficient aerobic output.',
      'Keep hips stable — no bobbing.',
      'Hold handles lightly; don\'t bear weight through your arms.',
    ],
  },
  {
    id: 'spin-bike',
    name: 'Spin Bike',
    category: 'Machine',
    metModerate: 8.0,
    metHigh: 13.0,
    supportsWatts: true,
    supportsPace: false,
    supportsDistance: true,
    description: 'High-intensity indoor cycling. Adjustable resistance for intervals.',
    cues: [
      'Seat at hip height when standing beside the bike.',
      'Add resistance before standing — never sprint on an empty flywheel.',
      'Keep a light grip on handlebars; power comes from legs.',
      'Flat back position — no rounded lumbar.',
    ],
  },
  {
    id: 'elliptical',
    name: 'Elliptical Trainer',
    category: 'Machine',
    metModerate: 5.5,
    metHigh: 8.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: true,
    description: 'Zero-impact full-body movement. Great for active recovery or Zone 2.',
    cues: [
      'Push through the heels to drive the glutes.',
      'Use the moving arms — don\'t just hold the static bars.',
      'Maintain upright posture — no leaning forward.',
      'Reverse direction periodically to target different muscle groups.',
    ],
  },
  {
    id: 'stairmaster',
    name: 'StairMaster / Step Mill',
    category: 'Machine',
    metModerate: 9.0,
    metHigh: 12.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Climbing-specific cardio that shreds glutes, quads, and lungs.',
    cues: [
      'Do NOT lean on the rails — keep hands off for maximum output.',
      'Take every other step to bias glutes and hamstrings.',
      'Keep your chest up and look forward, not down.',
      'Control your steps — don\'t let the machine control you.',
    ],
  },
  {
    id: 'ski-erg',
    name: 'Ski Erg',
    category: 'Machine',
    metModerate: 9.0,
    metHigh: 13.0,
    supportsWatts: true,
    supportsPace: true,
    supportsDistance: true,
    description: 'Upper-body dominant cardio. Great complement to leg-heavy training.',
    cues: [
      'Hip hinge on the downstroke — use your lats and core, not just arms.',
      'Arms reach high at the top before the pull.',
      'Keep a slight forward lean throughout.',
      'Breathe out on the downstroke, in on the recovery.',
    ],
  },
  {
    id: 'versa-climber',
    name: 'VersaClimber / Jacobs Ladder',
    category: 'Machine',
    metModerate: 11.0,
    metHigh: 14.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: true,
    description: 'Vertical climbing machine. Arguably the highest MET output per minute.',
    cues: [
      'Alternate arm and leg movements — don\'t let them sync.',
      'Use full range of motion on each pull and push.',
      'Keep your core braced throughout.',
      'Start slow — this machine is deceptively brutal.',
    ],
  },
  // ── BODYWEIGHT / FREE-STANDING ────────────────────────────
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    category: 'Bodyweight',
    metModerate: 11.0,
    metHigh: 13.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Portable, brutal, and highly skilled. Legendary conditioning tool.',
    cues: [
      'Stay on the balls of your feet — never flat-footed.',
      'Wrists do the rotation, not your arms.',
      'Keep elbows close to your sides.',
      'Jump only 1 inch off the ground to clear the rope.',
    ],
  },
  {
    id: 'battle-ropes',
    name: 'Battle Ropes',
    category: 'Bodyweight',
    metModerate: 10.0,
    metHigh: 13.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Full-body power endurance — alternating or simultaneous wave patterns.',
    cues: [
      'Athletic stance, knees bent, hips back.',
      'Drive from your legs — don\'t just flap your arms.',
      'Alternate waves for endurance; slams for power.',
      'Keep wrists neutral to protect from strain.',
    ],
  },
  {
    id: 'burpees',
    name: 'Burpees',
    category: 'Bodyweight',
    metModerate: 9.0,
    metHigh: 12.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'No equipment required. Hated by all. Effective beyond measure.',
    cues: [
      'Hinge at the hips first — don\'t flop to the floor.',
      'Keep your core tight through the plank position.',
      'Jump with arms fully overhead — full extension at the top.',
      'Land softly with knees bent to absorb impact.',
    ],
  },
  {
    id: 'box-jumps',
    name: 'Box Jumps',
    category: 'Bodyweight',
    metModerate: 8.0,
    metHigh: 12.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Explosive power combined with cardiovascular demand.',
    cues: [
      'Step down, never jump down — protect your Achilles.',
      'Swing arms back, then drive forward and up.',
      'Land in a partial squat position, not upright.',
      'Reset fully before the next rep.',
    ],
  },
  {
    id: 'kettlebell-swings',
    name: 'Kettlebell Swings',
    category: 'Bodyweight',
    metModerate: 9.0,
    metHigh: 13.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Posterior chain power meets aerobic conditioning. The perfect exercise.',
    cues: [
      'Hip HINGE, not a squat — hike the bell like a football.',
      'Drive your hips explosively forward at the top.',
      'The bell floats to shoulder height from hip power alone.',
      'Brace your core and squeeze your glutes at the top.',
    ],
  },
  {
    id: 'sled-push',
    name: 'Sled Push',
    category: 'Bodyweight',
    metModerate: 11.0,
    metHigh: 14.0,
    supportsWatts: false,
    supportsPace: true,
    supportsDistance: true,
    description: 'Loaded sprint variation. Builds leg drive and cardiovascular capacity.',
    cues: [
      'Low angle — roughly 45° body position.',
      'Drive through the balls of your feet with powerful strides.',
      'Keep your arms straight and push through the handles.',
      'Maintain consistent stride cadence — don\'t stutter-step.',
    ],
  },
  {
    id: 'medicine-ball-slams',
    name: 'Medicine Ball Slams',
    category: 'Bodyweight',
    metModerate: 9.0,
    metHigh: 12.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Full-body explosive movement with a primal satisfaction factor.',
    cues: [
      'Reach fully overhead before the slam — max stretch.',
      'Drive your arms DOWN and hinge your hips on the slam.',
      'Pick the ball up with a squat, not a deadlift.',
      'Stay light on your feet — athletic stance throughout.',
    ],
  },
  {
    id: 'thrusters',
    name: 'Thrusters (Barbell / DB)',
    category: 'Bodyweight',
    metModerate: 10.0,
    metHigh: 14.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Front squat to overhead press. King of metabolic conditioning.',
    cues: [
      'Front rack must be solid before squatting.',
      'Drive out of the hole and use leg power to initiate the press.',
      'Lock out overhead completely — full extension.',
      'Keep the bar close — no arc outward.',
    ],
  },
  {
    id: 'farmer-carry',
    name: "Farmer's Carry",
    category: 'Bodyweight',
    metModerate: 7.5,
    metHigh: 10.0,
    supportsWatts: false,
    supportsPace: true,
    supportsDistance: true,
    description: 'Loaded carries build grip, core, traps, and lungs simultaneously.',
    cues: [
      'Walk tall — imagine a string pulling your head toward the ceiling.',
      'Keep shoulders packed and down — resist the shrug.',
      'Short, controlled steps to avoid swinging the weights.',
      'Breathe rhythmically — don\'t hold your breath.',
    ],
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'Bodyweight',
    metModerate: 8.0,
    metHigh: 11.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Running in plank position — core and cardio combined.',
    cues: [
      'Keep hips level — no popping them up.',
      'Drive the knee toward the chest in a controlled arc.',
      'Maintain plank tension — don\'t let lower back sag.',
      'Increase speed progressively as form allows.',
    ],
  },
  {
    id: 'jump-squats',
    name: 'Jump Squats',
    category: 'Bodyweight',
    metModerate: 8.5,
    metHigh: 12.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Explosive lower-body power with serious cardiovascular demand.',
    cues: [
      'Squat to parallel before the jump — no shallow quarter-squats.',
      'Drive arms overhead to maximize power output.',
      'Land softly, hips back — absorb with quads and glutes.',
      'Immediately load for the next rep once stable.',
    ],
  },
  // ── OUTDOOR ────────────────────────────────────────────────
  {
    id: 'outdoor-run',
    name: 'Outdoor Run',
    category: 'Outdoor',
    metModerate: 8.5,
    metHigh: 13.5,
    supportsWatts: false,
    supportsPace: true,
    supportsDistance: true,
    description: 'The original cardio. Variable terrain, fresh air, zero treadmill fee.',
    cues: [
      'Aim for 170–180 steps per minute regardless of speed.',
      'Look 10–20 feet ahead — not at your feet.',
      'Relax your shoulders and hands — no clenching.',
      'Breathe rhythmically; belly breathing improves efficiency.',
    ],
  },
  {
    id: 'outdoor-walk-brisk',
    name: 'Brisk Walk (Outdoor)',
    category: 'Outdoor',
    metModerate: 3.8,
    metHigh: 5.5,
    supportsWatts: false,
    supportsPace: true,
    supportsDistance: true,
    description: 'Underrated. 45+ min Zone 2 walking is legitimate aerobic training.',
    cues: [
      'Walk at a pace where you can hold a conversation but it\'s challenging.',
      'Swing your arms — it increases caloric expenditure by 10–15%.',
      'Find hills whenever possible.',
      'Aim for 3.5–4.5 mph on flat terrain.',
    ],
  },
  {
    id: 'outdoor-cycling',
    name: 'Outdoor Cycling',
    category: 'Outdoor',
    metModerate: 8.0,
    metHigh: 13.0,
    supportsWatts: true,
    supportsPace: true,
    supportsDistance: true,
    description: 'Road or trail cycling. Excellent aerobic base builder.',
    cues: [
      'Maintain 80–90 RPM cadence in a gear that allows smooth pedaling.',
      'Stay aero on climbs — don\'t sit up and soft-pedal.',
      'Fuel early on rides over 60 minutes.',
      'Look up and through corners, not directly at the road.',
    ],
  },
  {
    id: 'hiking',
    name: 'Hiking',
    category: 'Outdoor',
    metModerate: 5.5,
    metHigh: 8.0,
    supportsWatts: false,
    supportsPace: true,
    supportsDistance: true,
    description: 'Weight-bearing aerobic work on variable terrain. Great for recovery.',
    cues: [
      'Use trekking poles on steep terrain to share load with upper body.',
      'Short, quick steps on descents — absorb shock with bent knees.',
      'Pack 0.5L water per hour on the trail.',
      'Lean into uphills from the ankles, not the waist.',
    ],
  },
  {
    id: 'track-sprints',
    name: 'Track / Field Sprints',
    category: 'Outdoor',
    metModerate: 11.0,
    metHigh: 16.0,
    supportsWatts: false,
    supportsPace: true,
    supportsDistance: true,
    description: 'Max-effort short sprints. Highest caloric demand per minute.',
    cues: [
      'Drive your arms — sprint speed is as much arms as legs.',
      'Full extension behind you — don\'t shuffle.',
      'Look at the finish line, not the ground.',
      'Allow full recovery between max-effort sprints.',
    ],
  },
  // ── WATER ──────────────────────────────────────────────────
  {
    id: 'lap-swimming',
    name: 'Lap Swimming',
    category: 'Water',
    metModerate: 7.0,
    metHigh: 10.0,
    supportsWatts: false,
    supportsPace: true,
    supportsDistance: true,
    description: 'Full-body, zero-impact aerobic training. Ideal for joint-sensitive athletes.',
    cues: [
      'Rotate your body with each stroke — don\'t swim flat.',
      'Exhale continuously underwater; don\'t hold your breath.',
      'Bilateral breathing: breathe every 3rd stroke on freestyle.',
      'Push off the wall on turns for maximum momentum.',
    ],
  },
  {
    id: 'pool-running',
    name: 'Pool Running / Aqua Jogging',
    category: 'Water',
    metModerate: 6.0,
    metHigh: 9.0,
    supportsWatts: false,
    supportsPace: false,
    supportsDistance: false,
    description: 'Running mechanics in deep water — full effort with near-zero impact.',
    cues: [
      'Use a flotation belt in deep water for body position.',
      'Maintain upright posture — don\'t lean forward excessively.',
      'Drive knees up and push down through the water.',
      'Arm action mirrors land running.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Program Generator
// ─────────────────────────────────────────────────────────────

function getPhaseName(week: number, durationWeeks: number): string {
  const pct = week / durationWeeks;
  if (pct <= 0.25) return 'Aerobic Base';
  if (pct <= 0.5)  return 'Foundation Build';
  if (pct <= 0.75) return 'Intensity Ramp';
  return 'Peak Phase';
}

const DAY_PATTERNS: Record<CardioFitnessLevel, Record<number, CardioIntervalType[]>> = {
  Novice: {
    3: ['Zone2', 'Zone2', 'HIIT'],
    4: ['Zone2', 'Zone2', 'HIIT', 'Zone2'],
    5: ['Zone2', 'LSD', 'HIIT', 'Zone2', 'Zone2'],
    6: ['Zone2', 'HIIT', 'Zone2', 'Zone2', 'HIIT', 'LSD'],
    7: ['Zone2', 'HIIT', 'Zone2', 'Zone2', 'HIIT', 'LSD', 'Zone2'],
  },
  Intermediate: {
    3: ['Zone2', 'HIIT', 'Tempo'],
    4: ['Zone2', 'HIIT', 'Tempo', 'LSD'],
    5: ['Zone2', 'HIIT', 'Tempo', 'Zone2', 'HIIT'],
    6: ['Zone2', 'HIIT', 'Tempo', 'Zone2', 'HIIT', 'LSD'],
    7: ['Zone2', 'HIIT', 'Tempo', 'Zone2', 'HIIT', 'LSD', 'Zone2'],
  },
  Elite: {
    3: ['HIIT', 'Tempo', 'Pyramid'],
    4: ['HIIT', 'Zone2', 'Tempo', 'Pyramid'],
    5: ['HIIT', 'Tempo', 'Zone2', 'HIIT', 'Pyramid'],
    6: ['HIIT', 'Tempo', 'Zone2', 'HIIT', 'Pyramid', 'Tabata'],
    7: ['HIIT', 'Tempo', 'Zone2', 'HIIT', 'Pyramid', 'Tabata', 'Zone2'],
  },
};

const BASE_DURATION_STEADY: Record<CardioFitnessLevel, Record<CardioIntervalType, number>> = {
  Novice:       { Zone2: 25, LSD: 30, Tempo: 25, HIIT: 0, Tabata: 0, Pyramid: 0, EMOM: 0 },
  Intermediate: { Zone2: 35, LSD: 45, Tempo: 35, HIIT: 0, Tabata: 0, Pyramid: 0, EMOM: 0 },
  Elite:        { Zone2: 45, LSD: 60, Tempo: 45, HIIT: 0, Tabata: 0, Pyramid: 0, EMOM: 0 },
};

function buildInterval(
  type: CardioIntervalType,
  level: CardioFitnessLevel,
  week: number,
  durationWeeks: number,
): CardioInterval | undefined {
  if (type === 'Zone2' || type === 'LSD' || type === 'Tempo') return undefined;

  const prog = 1 + (week / durationWeeks) * 0.2;

  if (type === 'Tabata') {
    return { workSeconds: 20, restSeconds: 10, rounds: Math.round(8 * prog), targetRPE: 9, targetZone: 5 };
  }
  if (type === 'Pyramid') {
    const restSec = level === 'Elite' ? 30 : 45;
    return { workSeconds: 60, restSeconds: restSec, rounds: Math.round(5 * prog), targetRPE: level === 'Elite' ? 9 : 8, targetZone: 5 };
  }
  if (type === 'EMOM') {
    return { workSeconds: 45, restSeconds: 15, rounds: Math.round(12 * prog), targetRPE: 8, targetZone: 4 };
  }
  // HIIT
  const configs: Record<CardioFitnessLevel, [number, number, number]> = {
    Novice:       [30, 60, 8],   // work, rest, base rounds  → 1:2
    Intermediate: [40, 20, 12],  // 2:1
    Elite:        [40, 20, 16],  // 2:1 → progresses to 1:1 in second half
  };
  const [work, restBase, baseRounds] = configs[level];
  const rest = level === 'Elite' && week > durationWeeks / 2 ? work : restBase;
  return {
    workSeconds: work,
    restSeconds: rest,
    rounds: Math.round(baseRounds * prog),
    targetRPE: level === 'Novice' ? 7 : level === 'Intermediate' ? 8 : 9,
    targetZone: level === 'Novice' ? 4 : 5,
  };
}

function buildNotes(type: CardioIntervalType, level: CardioFitnessLevel, goal: CardioGoal, interval?: CardioInterval): string {
  if (type === 'Zone2') {
    if (goal === 'Fat Loss') return 'Stay in Zone 2 — conversational pace. Fat oxidation is maximized here.';
    if (goal === 'Engine Building') return 'Aerobic base session. RPE 3–4, you should be able to speak full sentences.';
    return 'Active recovery / aerobic base. Keep HR in Zone 2 (60–70% max HR).';
  }
  if (type === 'LSD')   return 'Long Slow Distance — build aerobic endurance with extended Zone 2 work.';
  if (type === 'Tempo') return level === 'Elite'
    ? 'Lactate threshold work. Uncomfortable but sustainable. RPE 7–8.'
    : 'Comfortably hard pace. You should NOT be able to speak full sentences. RPE 6–7.';
  if (type === 'HIIT' && interval)
    return `${interval.workSeconds}s max effort / ${interval.restSeconds}s rest × ${interval.rounds} rounds. GO.`;
  if (type === 'Tabata' && interval)
    return `Tabata: ${interval.workSeconds}s on / ${interval.restSeconds}s off × ${interval.rounds} rounds. RPE 9.`;
  if (type === 'Pyramid' && interval)
    return `Pyramid intervals: build 30s → 60s → 90s → 60s → 30s. RPE ${interval.targetRPE}.`;
  if (type === 'EMOM' && interval)
    return `EMOM: ${interval.workSeconds}s of work at the top of every minute for ${interval.rounds} minutes.`;
  return '';
}

function buildFocusLabel(type: CardioIntervalType, goal: CardioGoal): string {
  const map: Record<CardioIntervalType, Record<CardioGoal, string>> = {
    Zone2:    { 'Fat Loss': 'Zone 2 Fat Burn',         'Engine Building': 'Aerobic Base',              'VO2 Max': 'Active Recovery'         },
    LSD:      { 'Fat Loss': 'Long Distance Burn',       'Engine Building': 'Endurance Foundation',      'VO2 Max': 'Aerobic Volume'           },
    HIIT:     { 'Fat Loss': 'HIIT Power Intervals',    'Engine Building': 'High-Intensity Engine Work', 'VO2 Max': 'VO₂ Max Intervals'        },
    Tabata:   { 'Fat Loss': 'Tabata Metabolic Blast',   'Engine Building': 'Tabata Engine Builder',     'VO2 Max': 'Tabata VO₂ Blast'         },
    Tempo:    { 'Fat Loss': 'Tempo Threshold',          'Engine Building': 'Lactate Threshold Build',   'VO2 Max': 'Tempo VO₂ Work'           },
    Pyramid:  { 'Fat Loss': 'Pyramid Calorie Incinerator', 'Engine Building': 'Pyramid Power Build',    'VO2 Max': 'Pyramid VO₂ Attack'       },
    EMOM:     { 'Fat Loss': 'EMOM Metabolic Burn',      'Engine Building': 'EMOM Engine Build',         'VO2 Max': 'EMOM Intensity Work'      },
  };
  return map[type]?.[goal] ?? type;
}

function getDurationModifier(week: number, durationWeeks: number, goal: CardioGoal): number {
  const prog = 1 + (week / durationWeeks) * 0.3;
  if (goal === 'Fat Loss')       return prog * 1.1;
  if (goal === 'VO2 Max')        return prog * 0.9;
  return prog;
}

// ─────────────────────────────────────────────────────────────
// Exercise Affinity — science-based cross-training assignment
// Zone 2 / LSD → low-impact (joint recovery between hard sessions)
// HIIT / Tabata / Pyramid → high-impact / explosive (max metabolic demand)
// Tempo → pace-capable machines or outdoor running
// ─────────────────────────────────────────────────────────────

const LOW_IMPACT_IDS = new Set([
  'rowing-machine', 'stationary-bike', 'spin-bike', 'elliptical', 'ski-erg',
  'lap-swimming', 'pool-running', 'treadmill-walk-incline', 'outdoor-cycling',
  'hiking', 'farmer-carry', 'outdoor-walk-brisk',
]);

const DISTANCE_CAPABLE_IDS = new Set([
  'treadmill-run', 'outdoor-run', 'outdoor-cycling', 'rowing-machine',
  'stationary-bike', 'spin-bike', 'lap-swimming', 'treadmill-walk-incline',
  'outdoor-walk-brisk', 'hiking', 'ski-erg', 'sled-push',
]);

const HIGH_IMPACT_IDS = new Set([
  'treadmill-run', 'assault-bike', 'stairmaster', 'versa-climber',
  'jump-rope', 'burpees', 'box-jumps', 'kettlebell-swings', 'track-sprints',
  'mountain-climbers', 'jump-squats', 'thrusters', 'battle-ropes',
  'medicine-ball-slams', 'sled-push',
]);

type ExerciseAffinity = 'low-impact' | 'high-impact' | 'distance' | 'any';

const INTERVAL_AFFINITY: Record<CardioIntervalType, ExerciseAffinity> = {
  Zone2:   'low-impact',
  LSD:     'distance',
  HIIT:    'high-impact',
  Tabata:  'high-impact',
  Tempo:   'distance',
  Pyramid: 'high-impact',
  EMOM:    'high-impact',
};

function pickExerciseForSlot(
  intervalType: CardioIntervalType,
  preferredIds: string[],
  recentIds: string[],
): { id: string; name: string } {
  const affinity = INTERVAL_AFFINITY[intervalType];
  let candidates = preferredIds.filter((id) => {
    if (affinity === 'low-impact')  return LOW_IMPACT_IDS.has(id);
    if (affinity === 'high-impact') return HIGH_IMPACT_IDS.has(id);
    if (affinity === 'distance')    return DISTANCE_CAPABLE_IDS.has(id);
    return true;
  });
  // Fall back to full pool if no affinity match
  if (candidates.length === 0) candidates = [...preferredIds];
  // Prefer exercises not used recently to maximise variety
  const fresh = candidates.filter((id) => !recentIds.includes(id));
  const pool  = fresh.length > 0 ? fresh : candidates;
  const ex = CARDIO_EXERCISES.find((e) => e.id === pool[0]) ?? CARDIO_EXERCISES[0];
  return { id: ex.id, name: ex.name };
}

function buildMaxFinisher(level: CardioFitnessLevel): NonNullable<GeneratedCardioSession['maxFinisher']> {
  const configs: Record<CardioFitnessLevel, { rounds: number; repsPerRound: number }> = {
    Novice:       { rounds: 3,  repsPerRound: 10 },
    Intermediate: { rounds: 5,  repsPerRound: 10 },
    Elite:        { rounds: 10, repsPerRound: 10 },
  };
  const { rounds, repsPerRound } = configs[level];
  return {
    exerciseId:   'burpees',
    exerciseName: 'Burpees',
    rounds,
    repsPerRound,
    notes: `MAX FINISHER — ${rounds} × ${repsPerRound} Burpees. No rest between rounds. GO.`,
  };
}

export function generateCardioProgram(
  program: Pick<CardioProgram,
    | 'fitnessLevel' | 'goal' | 'primaryExerciseId' | 'primaryExerciseName'
    | 'daysPerWeek' | 'durationWeeks' | 'preferredExerciseIds' | 'varietyMode' | 'maxModeEnabled'>,
): GeneratedCardioSession[] {
  const { fitnessLevel, goal, primaryExerciseId, primaryExerciseName, daysPerWeek, durationWeeks } = program;
  const effectiveIds: string[] =
    program.varietyMode && program.preferredExerciseIds?.length
      ? program.preferredExerciseIds
      : [primaryExerciseId];
  const pattern = DAY_PATTERNS[fitnessLevel][daysPerWeek] ?? DAY_PATTERNS[fitnessLevel][3];

  const sessions: GeneratedCardioSession[] = [];
  let index = 0;
  const recentExercises: string[] = [];

  for (let week = 1; week <= durationWeeks; week++) {
    for (let day = 0; day < daysPerWeek; day++) {
      const intervalType = pattern[day % pattern.length];
      const interval = buildInterval(intervalType, fitnessLevel, week, durationWeeks);
      const warmup = intervalType === 'Zone2' || intervalType === 'LSD' ? 3 : 5;
      const cooldown = 3;

      let totalDuration: number;
      if (interval) {
        const intervalSecs = (interval.workSeconds + interval.restSeconds) * interval.rounds;
        totalDuration = warmup + Math.ceil(intervalSecs / 60) + cooldown;
      } else {
        const base = BASE_DURATION_STEADY[fitnessLevel][intervalType] ?? 30;
        totalDuration = Math.round(base * getDurationModifier(week, durationWeeks, goal));
      }

      const targetRPE = intervalType === 'Zone2' || intervalType === 'LSD' ? 3
        : intervalType === 'Tempo' ? 7
        : intervalType === 'HIIT' ? (fitnessLevel === 'Novice' ? 7 : 8)
        : intervalType === 'Tabata' ? 9
        : 8;
      const targetZone = (intervalType === 'Zone2' || intervalType === 'LSD' ? 2
        : intervalType === 'Tempo' ? 3
        : intervalType === 'HIIT' && fitnessLevel === 'Novice' ? 4
        : 5) as 1 | 2 | 3 | 4 | 5;

      // Cross-training: pick the best exercise for this session's intensity profile
      const assignedEx = effectiveIds.length > 1
        ? pickExerciseForSlot(intervalType, effectiveIds, recentExercises)
        : { id: primaryExerciseId, name: primaryExerciseName };
      if (effectiveIds.length > 1) {
        recentExercises.unshift(assignedEx.id);
        if (recentExercises.length > 2) recentExercises.pop();
      }

      const slot: CardioSessionSlot = {
        exerciseId: assignedEx.id,
        exerciseName: assignedEx.name,
        intervalType,
        totalDurationMinutes: totalDuration,
        warmupMinutes: warmup,
        cooldownMinutes: cooldown,
        interval,
        targetRPE,
        targetZone,
        notes: buildNotes(intervalType, fitnessLevel, goal, interval),
      };

      sessions.push({
        index,
        week,
        label: `Session ${day + 1}`,
        slot,
        estimatedMinutes: totalDuration,
        focus: buildFocusLabel(intervalType, goal),
        phaseName: getPhaseName(week, durationWeeks),
        maxFinisher: program.maxModeEnabled ? buildMaxFinisher(fitnessLevel) : undefined,
      });

      index++;
    }
  }

  return sessions;
}
