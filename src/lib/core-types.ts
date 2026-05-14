// ─────────────────────────────────────────────────────────────
// 🔥 KHET-STATION — Core & Abs System Type Definitions
// ─────────────────────────────────────────────────────────────

export type CoreFitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
export type CoreGoal = 'Strength' | 'Endurance' | 'Athletic' | 'Aesthetics';
export type CoreFocusArea = 'Upper Abs' | 'Lower Abs' | 'Obliques' | 'Deep Core' | 'Full Core';

export interface CoreExercise {
  id: string;
  name: string;
  category: CoreFocusArea;
  /** Minimum fitness level required */
  level: CoreFitnessLevel;
  /** How this exercise is logged */
  type: 'reps' | 'time' | 'weighted';
  /** Rep range string, e.g. "10–15" — for reps/weighted exercises */
  baseReps?: string;
  /** Duration in seconds — for time-based exercises */
  baseSeconds?: number;
  defaultSets: number;
  cues: string[];
  /** How to progress when it becomes easy */
  progression?: string;
  /** How to regress if too hard */
  regression?: string;
}

export interface CoreSlot {
  exerciseId: string;
  type: 'reps' | 'time' | 'weighted';
  sets: number;
  targetReps?: string;
  targetSeconds?: number;
}

export interface GeneratedCoreSession {
  index: number;            // 0-based index across full program
  week: number;             // 1–N
  label: string;            // "Core A", "Core B", or "Session 1"
  slots: CoreSlot[];
  estimatedMinutes: number;
}

/** Stored in Firestore — corePrograms/{id} */
export interface CoreProgram {
  id: string;
  userId: string;
  name: string;
  fitnessLevel: CoreFitnessLevel;
  goal: CoreGoal;
  focusAreas: CoreFocusArea[];
  daysPerWeek: number;           // 2–5
  durationWeeks: number;         // 4, 6, 8, or 12
  structure: 'single' | 'AB';   // AB when daysPerWeek >= 4
  createdAt: string;             // ISO date YYYY-MM-DD
  startDate: string | null;
  lastSessionDate: string | null;
  lastSessionIndex: number;      // -1 = none yet
  sessionsCompleted: number;
  totalSessions: number;         // durationWeeks * daysPerWeek
  weeklyLog: {
    weekStr: string;             // ISO Monday date
    count: number;
  };
  /** User-defined exercise order per session type */
  customExerciseOrder?: Record<'single' | 'A' | 'B', string[]>;
  /** Base sets per exercise — 1 Maintenance · 2 Optimal · 3 Max Push. Defaults to 2. */
  volumeIntensity?: 1 | 2 | 3;
  /** Hard-cap session volume at 12 total sets with intelligent redistribution. */
  maxModeEnabled?: boolean;
}

/** Stored in Firestore — coreSessions/{id} */
export interface CoreSessionLog {
  id: string;
  userId: string;
  programId: string;
  programName: string;
  sessionIndex: number;
  week: number;
  label: string;
  date: string;                  // YYYY-MM-DD
  completedAt?: string;          // ISO timestamp when session was saved (for late-night grouping)
  slotsCompleted: string[];      // exerciseIds completed
  /** Per-exercise performance data (weight in lbs, reps, or seconds) */
  performanceData: Record<string, { weight?: number; reps?: number; seconds?: number }>;
  durationMinutes: number;
  completed: boolean;
}

export interface CoreStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  heatmap: { date: string; count: number }[];
  programBreakdown: { programName: string; sessions: number }[];
  weekDays: { date: string; label: string; sessions: number }[];
}

// ─────────────────────────────────────────────────────────────
// Exercise Library
// ─────────────────────────────────────────────────────────────

export const CORE_EXERCISES: CoreExercise[] = [
  // ── BEGINNER ──────────────────────────────────────────────

  {
    id: 'crunch',
    name: 'Crunch',
    category: 'Upper Abs',
    level: 'Beginner',
    type: 'reps',
    baseReps: '15–20',
    defaultSets: 3,
    cues: [
      'Cross arms on chest — never pull on your neck.',
      'Curl ribcage toward pelvis, not head toward knees.',
      'Exhale and squeeze at the top; pause one second.',
      'Lower with control — no momentum.',
    ],
    progression: 'Add a slow 3-second eccentric phase.',
    regression: 'Reduce range of motion.',
  },
  {
    id: 'sit-up',
    name: 'Sit-Up',
    category: 'Upper Abs',
    level: 'Beginner',
    type: 'reps',
    baseReps: '12–15',
    defaultSets: 3,
    cues: [
      'Feet flat, knees bent at 90°.',
      'Arms crossed on chest or fingertips at temples.',
      'Curl up until torso is vertical, then lower slowly.',
      'Keep chin slightly tucked — do not jerk the neck.',
    ],
    progression: 'Decline angle or add a chest plate.',
    regression: 'Crunch (partial sit-up).',
  },
  {
    id: 'reverse-crunch',
    name: 'Reverse Crunch',
    category: 'Lower Abs',
    level: 'Beginner',
    type: 'reps',
    baseReps: '12–15',
    defaultSets: 3,
    cues: [
      'Lie flat; hands beside hips or under glutes for support.',
      'Keep knees bent 90° throughout.',
      'Drive hips off the floor using lower abs — not momentum.',
      'Lower hips slowly — never let them crash down.',
    ],
    progression: 'Straighten legs for more leverage.',
    regression: 'Smaller hip lift.',
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    category: 'Deep Core',
    level: 'Beginner',
    type: 'reps',
    baseReps: '8–10 each side',
    defaultSets: 3,
    cues: [
      'Press lower back into the floor — keep it there.',
      'Extend opposite arm and leg simultaneously.',
      'Move slowly and with full control — speed kills the stimulus.',
      'Exhale as you extend; inhale to reset.',
    ],
    progression: 'Add a dumbbell in extended hand.',
    regression: 'Extend only one limb at a time.',
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'Deep Core',
    level: 'Beginner',
    type: 'time',
    baseSeconds: 30,
    defaultSets: 3,
    cues: [
      'Maintain a rigid line from head to heel — no sagging hips.',
      'Brace your abs as if bracing for a punch.',
      'Keep glutes squeezed and neck neutral.',
      'Breathe steadily — do not hold your breath.',
    ],
    progression: 'Increase hold duration by 10s each week.',
    regression: 'Plank from knees.',
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    category: 'Deep Core',
    level: 'Beginner',
    type: 'reps',
    baseReps: '8–10 each side',
    defaultSets: 3,
    cues: [
      'Start on hands and knees, wrists under shoulders, knees under hips.',
      'Brace core before moving — neutral spine throughout.',
      'Extend opposite arm and leg until fully parallel to the floor.',
      'Hold 1 second at the top, then return with control.',
    ],
    progression: 'Add a resistance band around feet.',
    regression: 'Extend one limb at a time.',
  },
  {
    id: 'bicycle-crunch',
    name: 'Bicycle Crunch',
    category: 'Obliques',
    level: 'Beginner',
    type: 'reps',
    baseReps: '15–20 each side',
    defaultSets: 3,
    cues: [
      'Do not pull on your neck — fingertips behind ears, elbows wide.',
      'Rotate torso, not just elbows, toward the opposite knee.',
      'Extend the other leg low (not touching the floor) for tension.',
      'Slow and controlled beats fast and sloppy every time.',
    ],
    progression: 'Add a 2-second pause at peak rotation.',
    regression: 'Keep feet higher off the ground.',
  },
  {
    id: 'lying-leg-raise',
    name: 'Lying Leg Raise',
    category: 'Lower Abs',
    level: 'Beginner',
    type: 'reps',
    baseReps: '10–12',
    defaultSets: 3,
    cues: [
      'Press lower back into the floor throughout.',
      'Keep legs straight or slightly bent — straight is harder.',
      'Raise until vertical, then lower slowly.',
      'Stop just before heels touch the floor to maintain tension.',
    ],
    progression: 'Hold a light dumbbell between feet.',
    regression: 'Bent-knee leg raise.',
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    category: 'Obliques',
    level: 'Beginner',
    type: 'time',
    baseSeconds: 20,
    defaultSets: 2,
    cues: [
      'Stack feet or stagger for stability.',
      'Drive hip up — do not let it sag.',
      'Keep body in a straight line from head to heel.',
      'Brace the obliques, not just the shoulder.',
    ],
    progression: 'Side plank with hip dips.',
    regression: 'Side plank from knees.',
  },
  {
    id: 'hollow-body-hold',
    name: 'Hollow Body Hold',
    category: 'Full Core',
    level: 'Beginner',
    type: 'time',
    baseSeconds: 20,
    defaultSets: 3,
    cues: [
      'Press lower back into the floor — imagine squishing it flat.',
      'Arms extended overhead, legs straight a few inches off the floor.',
      'Head and shoulders slightly off the floor (like a crunch position).',
      'The further arms and legs are, the harder it gets.',
    ],
    progression: 'Extend arms and legs further out.',
    regression: 'Tuck one or both knees.',
  },
  {
    id: 'mountain-climber',
    name: 'Mountain Climber',
    category: 'Full Core',
    level: 'Beginner',
    type: 'reps',
    baseReps: '20 each side',
    defaultSets: 3,
    cues: [
      'Start in a high plank — shoulders over wrists.',
      'Drive one knee toward chest while keeping hips level.',
      'Alternate legs at a controlled tempo — not a sprint.',
      'Exhale with each knee drive.',
    ],
    progression: 'Increase tempo or add cross-body reach.',
    regression: 'Slow one leg at a time.',
  },
  {
    id: 'scissor-kicks',
    name: 'Scissor Kicks',
    category: 'Lower Abs',
    level: 'Beginner',
    type: 'reps',
    baseReps: '20 each side',
    defaultSets: 3,
    cues: [
      'Lower back pressed firmly into the floor.',
      'Legs straight, kept low but not touching the floor.',
      'Alternate legs passing over each other in a small scissoring motion.',
      'Engage lower abs — do not let the back arch off the floor.',
    ],
    progression: 'Lower legs closer to the floor.',
    regression: 'Bend knees slightly.',
  },
  {
    id: 'flutter-kicks',
    name: 'Flutter Kicks',
    category: 'Lower Abs',
    level: 'Beginner',
    type: 'time',
    baseSeconds: 30,
    defaultSets: 3,
    cues: [
      'Lower back flat against the floor at all times.',
      'Legs straight, 6–12 inches off the ground.',
      'Small, rapid up-and-down alternating kicks.',
      'Core braced; do not hold your breath.',
    ],
    progression: 'Lower legs toward the floor.',
    regression: 'Raise legs higher.',
  },

  // ── INTERMEDIATE ──────────────────────────────────────────

  {
    id: 'decline-sit-up',
    name: 'Decline Sit-Up',
    category: 'Upper Abs',
    level: 'Intermediate',
    type: 'reps',
    baseReps: '12–15',
    defaultSets: 3,
    cues: [
      'Secure feet; lower slowly — 3 seconds down.',
      'Cross arms on chest; avoid pulling the neck.',
      'Crunch hard at the top and hold briefly.',
      'Add a plate to chest for progressive overload.',
    ],
    progression: 'Add plate to chest.',
    regression: 'Flat sit-up.',
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    category: 'Upper Abs',
    level: 'Intermediate',
    type: 'weighted',
    baseReps: '12–15',
    defaultSets: 3,
    cues: [
      'Kneel facing cable — rope at forehead, elbows pointing down.',
      'Crunch ribs toward hips, not head toward floor.',
      'Hold the contracted position for a full second.',
      'Let the weight stretch you fully on the way up.',
    ],
    progression: 'Increase weight; add a pause at peak contraction.',
    regression: 'Reduce weight; shorten range.',
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    category: 'Obliques',
    level: 'Intermediate',
    type: 'reps',
    baseReps: '15–20 each side',
    defaultSets: 3,
    cues: [
      'Lean back to ~45° — more lean = harder.',
      'Keep feet off the floor for max core engagement.',
      'Rotate from the torso, not just the arms.',
      'Hold a plate or dumbbell for progressive overload.',
    ],
    progression: 'Add a weight plate.',
    regression: 'Keep feet on floor.',
  },
  {
    id: 'ab-wheel-rollout-knees',
    name: 'Ab Wheel Rollout (Knees)',
    category: 'Full Core',
    level: 'Intermediate',
    type: 'reps',
    baseReps: '8–12',
    defaultSets: 3,
    cues: [
      'Start on knees — keep hips from sagging as you roll out.',
      'Brace abs hard before rolling; core must not relax.',
      'Roll out only as far as you can keep a neutral spine.',
      'Pull back using lats and abs together.',
    ],
    progression: 'Increase rollout distance; progress to standing.',
    regression: 'Shorter rollout range.',
  },
  {
    id: 'hanging-knee-raise',
    name: 'Hanging Knee Raise',
    category: 'Lower Abs',
    level: 'Intermediate',
    type: 'reps',
    baseReps: '10–15',
    defaultSets: 3,
    cues: [
      'Dead hang start — eliminate all swing.',
      'Drive knees toward chest using abs, not momentum.',
      'Round lower back slightly at the top for full contraction.',
      'Lower with control over 2 seconds.',
    ],
    progression: 'Progress to hanging leg raise.',
    regression: 'Bend knees more to shorten lever.',
  },
  {
    id: 'v-up',
    name: 'V-Up',
    category: 'Full Core',
    level: 'Intermediate',
    type: 'reps',
    baseReps: '10–15',
    defaultSets: 3,
    cues: [
      'Lie flat, arms overhead and legs extended.',
      'Simultaneously raise legs and torso, reaching hands toward feet.',
      'Keep legs straight — the goal is touching your toes.',
      'Lower slowly; do not let feet or shoulders touch the floor.',
    ],
    progression: 'Single-leg V-up alternating.',
    regression: 'Tuck-up (bent knees).',
  },
  {
    id: 'hollow-body-rocks',
    name: 'Hollow Body Rocks',
    category: 'Full Core',
    level: 'Intermediate',
    type: 'reps',
    baseReps: '10–15',
    defaultSets: 3,
    cues: [
      'Establish a hollow body position first — back flat, arms overhead.',
      'Rock forward and back without breaking the hollow shape.',
      'The goal is one rigid unit rocking, not folding and unfolding.',
      'Keep breathing — do not hold your breath.',
    ],
    progression: 'Extend arms and legs further out.',
    regression: 'Tuck one or both knees.',
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    category: 'Deep Core',
    level: 'Intermediate',
    type: 'weighted',
    baseReps: '10–12 each side',
    defaultSets: 3,
    cues: [
      'Stand perpendicular to the cable stack, handle at chest height.',
      'Brace the core hard before pressing out.',
      'Press out fully and hold 1–2 seconds — resist the rotation.',
      'Pull back to chest with control.',
    ],
    progression: 'Increase weight; add overhead press extension.',
    regression: 'Lighter weight; smaller press distance.',
  },
  {
    id: 'toe-touch-crunch',
    name: 'Toe-Touch Crunch',
    category: 'Upper Abs',
    level: 'Intermediate',
    type: 'reps',
    baseReps: '15–20',
    defaultSets: 3,
    cues: [
      'Lie with legs straight up, perpendicular to floor.',
      'Reach hands toward toes, crunching ribcage toward pelvis.',
      'Do not just reach with your arms — drive with your abs.',
      'Lower shoulders slowly — pause just before touching the floor.',
    ],
    progression: 'Add a light dumbbell to extend.',
    regression: 'Slightly bent knees.',
  },
  {
    id: 'windmill',
    name: 'Windmill',
    category: 'Obliques',
    level: 'Intermediate',
    type: 'reps',
    baseReps: '6–10 each side',
    defaultSets: 3,
    cues: [
      'Stand wide, arm overhead (can hold a weight).',
      'Hinge laterally toward the floor-side hand while keeping the top arm vertical.',
      'Eyes track the top hand throughout.',
      'Oblique drives the return — do not use momentum.',
    ],
    progression: 'Add a kettlebell overhead.',
    regression: 'No weight; shorter range.',
  },
  {
    id: 'raised-leg-plank',
    name: 'Raised Leg Plank',
    category: 'Deep Core',
    level: 'Intermediate',
    type: 'time',
    baseSeconds: 25,
    defaultSets: 3,
    cues: [
      'Standard plank position, then lift one leg 4–6 inches off the floor.',
      'Keep hips square — do not tilt or rotate.',
      'Hold for half the interval on each leg.',
      'Breathe steadily; brace hard against the asymmetry.',
    ],
    progression: 'Extend hold time.',
    regression: 'Standard plank.',
  },
  {
    id: 'copenhagen-plank',
    name: 'Copenhagen Side Plank',
    category: 'Obliques',
    level: 'Intermediate',
    type: 'time',
    baseSeconds: 15,
    defaultSets: 3,
    cues: [
      'Top foot rests on a bench; bottom leg is unsupported.',
      'Drive hips up and hold body rigid.',
      'Keep torso stiff — no sagging at the hip.',
      'This is among the hardest adductor and oblique movements.',
    ],
    progression: 'Extend hold; bottom leg fully unsupported.',
    regression: 'Bottom knee on floor.',
  },

  // ── ADVANCED ──────────────────────────────────────────────

  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'Lower Abs',
    level: 'Advanced',
    type: 'reps',
    baseReps: '8–12',
    defaultSets: 4,
    cues: [
      'Dead hang start — eliminate all swing.',
      'Posterior tilt your pelvis before lifting.',
      'Raise legs to 90° or higher in a controlled arc.',
      'Lower slowly — the eccentric is where the work is.',
    ],
    progression: 'Toes-to-bar.',
    regression: 'Hanging knee raise.',
  },
  {
    id: 'toes-to-bar',
    name: 'Toes-to-Bar',
    category: 'Full Core',
    level: 'Advanced',
    type: 'reps',
    baseReps: '6–10',
    defaultSets: 4,
    cues: [
      'Begin with a hollow-body hang — engage lats and brace abs.',
      'Drive toes up in a controlled arc, not a kip.',
      'Touch bar with toes at the top, then slowly reverse.',
      'If form breaks, switch to hanging leg raises to finish.',
    ],
    progression: 'Add a slow 3-second eccentric.',
    regression: 'Hanging leg raise.',
  },
  {
    id: 'dragon-flag',
    name: 'Dragon Flag',
    category: 'Full Core',
    level: 'Advanced',
    type: 'reps',
    baseReps: '5–8',
    defaultSets: 3,
    cues: [
      'Grip the bench firmly behind your head.',
      'Keep the body rigid from shoulders to feet — no hip bend.',
      'Lower the body slowly in one rigid plane.',
      'The only pivot point is the upper back — everything else is braced.',
    ],
    progression: 'Slower eccentric; straight legs throughout.',
    regression: 'Dragon flag negative only; tuck legs.',
  },
  {
    id: 'ab-wheel-rollout-standing',
    name: 'Ab Wheel Rollout (Standing)',
    category: 'Full Core',
    level: 'Advanced',
    type: 'reps',
    baseReps: '5–8',
    defaultSets: 3,
    cues: [
      'Start standing, wheel on the floor directly under hips.',
      'Brace maximally before rolling — any slack and the spine rounds.',
      'Roll out until body is nearly parallel to the floor.',
      'Retract using lats and core together — do not collapse.',
    ],
    progression: 'Rollout to full extension; pause at bottom.',
    regression: 'Knee rollout.',
  },
  {
    id: 'single-arm-plank',
    name: 'Single-Arm Plank',
    category: 'Deep Core',
    level: 'Advanced',
    type: 'time',
    baseSeconds: 15,
    defaultSets: 3,
    cues: [
      'High plank position — remove one arm, place it on lower back.',
      'Resist any rotation of the hips — keep them perfectly square.',
      'Active shoulder — press the floor away, do not collapse.',
      'Build up time slowly; this is not a beginner movement.',
    ],
    progression: 'Longer holds; add a leg raise simultaneously.',
    regression: 'Standard plank.',
  },
  {
    id: 'stir-the-pot',
    name: 'Stir the Pot',
    category: 'Deep Core',
    level: 'Advanced',
    type: 'reps',
    baseReps: '8–10 each direction',
    defaultSets: 3,
    cues: [
      'Forearms on a stability ball, body in a plank position.',
      'Draw small circles with your forearms without moving your hips.',
      'Resist all rotation and lateral movement from the torso.',
      'The smaller and slower the circles, the harder the stimulus.',
    ],
    progression: 'Larger, slower circles.',
    regression: 'Standard forearm plank.',
  },
  {
    id: 'l-sit',
    name: 'L-Sit (Parallel Bars)',
    category: 'Full Core',
    level: 'Advanced',
    type: 'time',
    baseSeconds: 10,
    defaultSets: 3,
    cues: [
      'Support yourself on parallel bars or rings, arms locked.',
      'Lift legs straight out to form an "L" shape.',
      'Depress and protract shoulders — push the bars down.',
      'Hold with maximum bracing; even 5 seconds of quality counts.',
    ],
    progression: 'Extend hold; progress to V-sit.',
    regression: 'L-sit tuck (bent knees); using a floor platform.',
  },
  {
    id: 'cable-woodchop',
    name: 'Cable Wood Chop',
    category: 'Obliques',
    level: 'Advanced',
    type: 'weighted',
    baseReps: '10–12 each side',
    defaultSets: 3,
    cues: [
      'Stand perpendicular to the cable, handle set high.',
      'Rotate the torso in a chopping motion diagonally downward.',
      'Keep arms mostly straight — power from the obliques, not arms.',
      'Control the return — resist the rotation eccentrically.',
    ],
    progression: 'Increase weight; add a squat to the movement.',
    regression: 'Lighter weight; seated woodchop.',
  },
  {
    id: 'dragon-flag-hold',
    name: 'Dragon Flag Hold',
    category: 'Full Core',
    level: 'Advanced',
    type: 'time',
    baseSeconds: 10,
    defaultSets: 3,
    cues: [
      'Same setup as dragon flag — rigid body, bench grip.',
      'Lower to your challenging angle and hold there.',
      'Every fiber of the core should be firing.',
      'Breathe through the hold — do not lock your breath.',
    ],
    progression: 'Extend hold time; lower the angle.',
    regression: 'Raise the angle to make it easier.',
  },

  // ── ELITE ─────────────────────────────────────────────────

  {
    id: 'front-lever-tuck',
    name: 'Front Lever Tuck',
    category: 'Full Core',
    level: 'Elite',
    type: 'time',
    baseSeconds: 8,
    defaultSets: 4,
    cues: [
      'Dead hang from a pull-up bar.',
      'Tuck knees to chest and pull body horizontal to the floor.',
      'Arms fully extended; depress scapulae and engage lats hard.',
      'The torso should be parallel to the floor — no hip drop.',
    ],
    progression: 'Single-leg front lever; full front lever.',
    regression: 'Partial horizontal hold (higher angle).',
  },
  {
    id: 'front-lever',
    name: 'Front Lever',
    category: 'Full Core',
    level: 'Elite',
    type: 'time',
    baseSeconds: 5,
    defaultSets: 4,
    cues: [
      'Dead hang from a bar, arms fully extended.',
      'Pull body to horizontal — fully straight from head to toe.',
      'Maximum lat engagement + posterior pelvic tilt + braced abs.',
      'Even 2 seconds of true front lever is elite.',
    ],
    progression: 'Extend hold; front lever pulls.',
    regression: 'Front lever tuck.',
  },
  {
    id: 'full-dragon-flag',
    name: 'Full Dragon Flag',
    category: 'Full Core',
    level: 'Elite',
    type: 'reps',
    baseReps: '3–6',
    defaultSets: 4,
    cues: [
      'Bench grip tight; body rigid from shoulders to feet — no tuck.',
      'Lower body under full control — 4+ seconds down.',
      'The body must move as one unit; any hip bend fails the rep.',
      'Press back up using the entire anterior chain.',
    ],
    progression: 'Add a weighted vest.',
    regression: 'Dragon flag with tucked or bent-leg position.',
  },
  {
    id: 'hanging-windmill',
    name: 'Hanging Windmill',
    category: 'Obliques',
    level: 'Elite',
    type: 'reps',
    baseReps: '4–6 each side',
    defaultSets: 3,
    cues: [
      'Dead hang from a pull-up bar.',
      'Rotate legs to one side, sweeping up in a windmill motion.',
      'Return with full control — no swing.',
      'Obliques and hip flexors are under intense load.',
    ],
    progression: 'Straight-leg windmill; slower tempo.',
    regression: 'Hanging knee windmill.',
  },
  {
    id: 'ring-ab-rollout',
    name: 'Ring Ab Rollout',
    category: 'Full Core',
    level: 'Elite',
    type: 'reps',
    baseReps: '4–8',
    defaultSets: 3,
    cues: [
      'Rings set at hip height; start in a plank on the rings.',
      'Roll rings forward extending body toward the floor.',
      'Maintain a rigid hollow body throughout the extension.',
      'Pull rings back to start — do not pike at the hips.',
    ],
    progression: 'Lower ring height (increases lever).',
    regression: 'Ab wheel rollout from knees.',
  },
  {
    id: 'ghd-sit-up',
    name: 'GHD Sit-Up',
    category: 'Upper Abs',
    level: 'Elite',
    type: 'reps',
    baseReps: '8–12',
    defaultSets: 3,
    cues: [
      'Secure feet on the GHD, hips at or beyond the pad edge.',
      'Lower all the way back (full hyperextension) — open hips.',
      'Sit up explosively but finish with controlled abs.',
      'If you feel lower back pain, reduce range of motion.',
    ],
    progression: 'Add a medicine ball overhead.',
    regression: 'Reduce range of motion.',
  },
  {
    id: 'one-arm-hanging-leg-raise',
    name: 'Single-Arm Hanging Leg Raise',
    category: 'Lower Abs',
    level: 'Elite',
    type: 'reps',
    baseReps: '4–6 each side',
    defaultSets: 3,
    cues: [
      'Dead hang from one arm — the other arm is free at your side.',
      'Raise legs to 90° or higher with strict control.',
      'Resist all lateral body sway from the single-arm hang.',
      'Lower slowly — each rep earns respect.',
    ],
    progression: 'Toes-to-bar single-arm.',
    regression: 'Two-arm hanging leg raise.',
  },
  {
    id: 'glute-bridge-hold',
    name: 'Glute Bridge Hold',
    category: 'Full Core',
    level: 'Beginner',
    type: 'time',
    baseSeconds: 30,
    defaultSets: 3,
    cues: [
      'Lie on your back, knees bent 90°, feet flat and hip-width apart.',
      'Drive through your heels to lift hips until body forms a straight line from knees to shoulders.',
      'Squeeze your glutes hard at the top — do not hyperextend the lower back.',
      'Brace your core and breathe steadily throughout the hold.',
      'Keep knees tracking over toes — resist letting them cave inward.',
    ],
    progression: 'Single-leg glute bridge hold.',
    regression: 'Reduce hold duration or add brief rests between holds.',
  },
  {
    id: 'skin-the-cat',
    name: 'Skin the Cat',
    category: 'Full Core',
    level: 'Elite',
    type: 'reps',
    baseReps: '3–5',
    defaultSets: 3,
    cues: [
      'Dead hang, then bring legs overhead through the bar.',
      'Continue rotating until body hangs in an inverted hang.',
      'Reverse the motion to return to dead hang.',
      'Shoulder mobility is the limiter — warm up thoroughly.',
    ],
    progression: 'Hold the inverted hang for 5 seconds.',
    regression: 'Tucked skin the cat; rings for more range.',
  },
];

// ─────────────────────────────────────────────────────────────
// Plan Generation
// ─────────────────────────────────────────────────────────────

const LEVEL_ORDER: CoreFitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

/** Returns true if an exercise is accessible at the given level */
function isAccessible(ex: CoreExercise, level: CoreFitnessLevel): boolean {
  return LEVEL_ORDER.indexOf(ex.level) <= LEVEL_ORDER.indexOf(level);
}

/** Rep/set progressions by week — builds on top of the base volumeIntensity */
function progressSlot(slot: CoreSlot, week: number): CoreSlot {
  // Week 1–2: base. Week 3–4: +1 set. Week 5+: +1 set again.
  const extraSets = week >= 5 ? 2 : week >= 3 ? 1 : 0;
  const newSets = Math.min(slot.sets + extraSets, 4); // cap at 4 sets per exercise

  if (slot.type === 'time' && slot.targetSeconds) {
    const secInc = week >= 5 ? 20 : week >= 3 ? 10 : 0;
    return { ...slot, sets: newSets, targetSeconds: slot.targetSeconds + secInc };
  }

  return { ...slot, sets: newSets };
}

/**
 * Intelligent MAX MODE redistributor.
 * Targets 12 total sets per session. Bumps highest-level exercises first when
 * below 12; trims lowest-level exercises first when above 12.
 */
function applyMaxMode(slots: CoreSlot[]): CoreSlot[] {
  const MAX_TOTAL = 12;
  const result = slots.map((s) => ({ ...s }));
  let total = result.reduce((sum, s) => sum + s.sets, 0);
  if (total === MAX_TOTAL) return result;

  const getLevel = (id: string): number => {
    const ex = CORE_EXERCISES.find((e) => e.id === id);
    return LEVEL_ORDER.indexOf(ex?.level ?? 'Beginner');
  };

  const byHighPriority = result
    .map((_, i) => i)
    .sort((a, b) => getLevel(result[b].exerciseId) - getLevel(result[a].exerciseId));
  const byLowPriority = [...byHighPriority].reverse();

  if (total < MAX_TOTAL) {
    for (let pass = 0; pass < 2 && total < MAX_TOTAL; pass++) {
      for (const idx of byHighPriority) {
        if (total >= MAX_TOTAL) break;
        if (result[idx].sets < 4) {
          result[idx] = { ...result[idx], sets: result[idx].sets + 1 };
          total++;
        }
      }
    }
  } else {
    for (let pass = 0; pass < 3 && total > MAX_TOTAL; pass++) {
      for (const idx of byLowPriority) {
        if (total <= MAX_TOTAL) break;
        if (result[idx].sets > 1) {
          result[idx] = { ...result[idx], sets: result[idx].sets - 1 };
          total--;
        }
      }
    }
  }

  return result;
}

/**
 * Build exercise slots for one session.
 * Uses volumeIntensity (1–3) as the base set count, then applies weekly
 * auto-progression. If maxModeEnabled, redistributes to cap at 12 total sets.
 */
function buildSessionSlots(
  exerciseIds: string[],
  week: number,
  volumeIntensity: 1 | 2 | 3 = 2,
  maxModeEnabled: boolean = false,
): CoreSlot[] {
  const slots = exerciseIds.map((id) => {
    const ex = CORE_EXERCISES.find((e) => e.id === id);
    if (!ex) return null;
    const base: CoreSlot = {
      exerciseId: ex.id,
      type: ex.type,
      sets: volumeIntensity,
      targetReps: ex.baseReps,
      targetSeconds: ex.baseSeconds,
    };
    return progressSlot(base, week);
  }).filter((s): s is CoreSlot => s !== null);

  if (maxModeEnabled && slots.length > 0) {
    return applyMaxMode(slots);
  }
  return slots;
}

/** Rep range targets by goal */
function adjustRepsForGoal(reps: string | undefined, goal: CoreGoal): string | undefined {
  if (!reps) return reps;
  if (goal === 'Strength') return '6–10';
  if (goal === 'Endurance') return '20–30';
  if (goal === 'Athletic') return '12–15';
  return reps; // Aesthetics = use base reps
}

/** Choose exercises for a session — selects ~5-6 exercises across focus areas */
function selectExercises(
  level: CoreFitnessLevel,
  goal: CoreGoal,
  focusAreas: CoreFocusArea[],
  sessionType: 'A' | 'B' | 'single',
  customOrder?: string[],
): string[] {
  if (customOrder && customOrder.length > 0) return customOrder;

  const pool = CORE_EXERCISES.filter((e) => isAccessible(e, level));

  // For AB structure: A = Rectus focus (upper/lower abs + full core)
  //                   B = Rotational focus (obliques + deep core)
  let primaryCategories: CoreFocusArea[];
  if (sessionType === 'A') {
    primaryCategories = ['Upper Abs', 'Lower Abs', 'Full Core'];
  } else if (sessionType === 'B') {
    primaryCategories = ['Obliques', 'Deep Core', 'Full Core'];
  } else {
    // Single: distribute across all requested focus areas
    primaryCategories = focusAreas.length > 0 ? focusAreas : ['Upper Abs', 'Lower Abs', 'Obliques', 'Deep Core', 'Full Core'];
  }

  // Goal-based tier preference for exercise selection
  // Strength: prefer weighted/reps exercises
  // Endurance: prefer time + high-rep
  // Athletic: prefer full core + anti-rotation
  // Aesthetics: balanced

  const selected: string[] = [];
  const usedCategories = new Set<CoreFocusArea>();

  // Try to get at least one from each primary category
  for (const cat of primaryCategories) {
    const candidates = pool.filter(
      (e) => e.category === cat && !selected.includes(e.id),
    );
    if (candidates.length === 0) continue;

    // Goal-based sort: prefer weighted for Strength, time for Endurance, etc.
    const sorted = [...candidates].sort((a, b) => {
      if (goal === 'Strength') {
        const aW = a.type === 'weighted' ? 0 : a.type === 'reps' ? 1 : 2;
        const bW = b.type === 'weighted' ? 0 : b.type === 'reps' ? 1 : 2;
        return aW - bW;
      }
      if (goal === 'Endurance') {
        const aW = a.type === 'time' ? 0 : a.type === 'reps' ? 1 : 2;
        const bW = b.type === 'time' ? 0 : b.type === 'reps' ? 1 : 2;
        return aW - bW;
      }
      return 0;
    });

    selected.push(sorted[0].id);
    usedCategories.add(cat);

    if (selected.length >= 3) break;
  }

  // Fill to 5–6 exercises from remaining pool
  const remaining = pool.filter((e) => !selected.includes(e.id));
  // Shuffle remaining to add variety
  const shuffled = [...remaining].sort(() => Math.random() - 0.5);
  for (const ex of shuffled) {
    if (selected.length >= 6) break;
    // Prefer categories in focus areas
    if (focusAreas.length > 0 && !focusAreas.includes(ex.category) && selected.length >= 4) continue;
    selected.push(ex.id);
  }

  return selected.slice(0, 6);
}

/** Generate all sessions for a program */
export function generateCoreProgram(
  fitnessLevel: CoreFitnessLevel,
  goal: CoreGoal,
  focusAreas: CoreFocusArea[],
  daysPerWeek: number,
  durationWeeks: number,
  customOrder?: Record<'single' | 'A' | 'B', string[]>,
  volumeIntensity: 1 | 2 | 3 = 2,
  maxModeEnabled: boolean = false,
): GeneratedCoreSession[] {
  const structure: 'single' | 'AB' = daysPerWeek >= 4 ? 'AB' : 'single';
  const sessions: GeneratedCoreSession[] = [];
  const totalSessions = durationWeeks * daysPerWeek;

  for (let i = 0; i < totalSessions; i++) {
    const week = Math.floor(i / daysPerWeek) + 1;
    const dayInWeek = i % daysPerWeek;

    let sessionType: 'A' | 'B' | 'single';
    let label: string;

    if (structure === 'AB') {
      sessionType = dayInWeek % 2 === 0 ? 'A' : 'B';
      label = `Core ${sessionType}`;
    } else {
      sessionType = 'single';
      label = `Core ${dayInWeek + 1}`;
    }

    const exerciseIds = selectExercises(
      fitnessLevel,
      goal,
      focusAreas,
      sessionType,
      customOrder?.[sessionType],
    );

    const slots = buildSessionSlots(exerciseIds, week, volumeIntensity, maxModeEnabled).map((slot) => {
      const ex = CORE_EXERCISES.find((e) => e.id === slot.exerciseId);
      return {
        ...slot,
        targetReps: adjustRepsForGoal(slot.targetReps, goal),
      };
    });

    // Estimate minutes: each slot ≈ 3 minutes (sets × ~45s per set + rest)
    const estimatedMinutes = Math.round(slots.reduce((acc, s) => acc + s.sets * 1.25, 0));

    sessions.push({
      index: i,
      week,
      label,
      slots,
      estimatedMinutes: Math.max(estimatedMinutes, 10),
    });
  }

  return sessions;
}
