// ─────────────────────────────────────────────────────────────
// Franklin Initiative — Strategy Bank
// One entry per virtue. Extensible: add cues and study refs freely.
// ─────────────────────────────────────────────────────────────

export interface VirtueStrategy {
  virtueId: number;
  name: string;
  /** Actionable implementation cues — behavioral engineering instructions. */
  technicalCues: string[];
  /** External references, expressed as search queries for privacy. */
  furtherStudy: { label: string; query: string }[];
}

export const STRATEGY_BANK: VirtueStrategy[] = [
  {
    virtueId: 1,
    name: 'Temperance',
    technicalCues: [
      'Log each meal before eating it — commit to the quantity before it is in front of you.',
      'Apply the half-plate rule: consume half your portion, then pause for 10 minutes before deciding on seconds.',
      'Set a fixed drink ceiling (e.g., two) before arriving at any social event.',
      'Identify your highest-risk consumption window (late nights, stress peaks) and engineer a pre-commitment barrier.',
    ],
    furtherStudy: [
      { label: 'Implementation Intentions & eating', query: 'Gollwitzer implementation intentions eating behavior research' },
      { label: 'HALT decision framework', query: 'HALT hunger angry lonely tired decision quality' },
      { label: 'Delay discounting & food choice', query: 'delay discounting food self-control psychology research' },
    ],
  },
  {
    virtueId: 2,
    name: 'Silence',
    technicalCues: [
      'Impose a 3-second pause before responding in any conversation — use it to evaluate whether speech adds value.',
      'Replace opinion-giving with question-asking: one genuine question before any statement of your own view.',
      'Write the message before sending it; review for "trifling" content and delete freely.',
      'Track your daily "unnecessary speech" triggers (boredom, anxiety, group pressure) and log them in your evening review.',
    ],
    furtherStudy: [
      { label: 'Active listening research', query: 'active listening effectiveness workplace research meta-analysis' },
      { label: 'SBAR communication framework', query: 'SBAR structured communication brevity healthcare engineering' },
      { label: 'Verbal disfluency & trust', query: 'verbal silence pause cognition social perception research' },
    ],
  },
  {
    virtueId: 3,
    name: 'Order',
    technicalCues: [
      'Assign every object a designated home before acquiring it; the location is decided at purchase, not at discard.',
      'Execute a 3-minute physical reset at the end of each work block — clear the surface before switching contexts.',
      'Use time-blocking for context switches; unscheduled transitions are the primary order-failure mode.',
      'Conduct a weekly GTD-style capture + clarify pass: nothing stays in your head as "pending."',
    ],
    furtherStudy: [
      { label: 'GTD methodology', query: 'David Allen Getting Things Done GTD system productivity' },
      { label: 'Mise en place applied to knowledge work', query: 'mise en place productivity knowledge worker workspace setup' },
      { label: 'Context switching cost research', query: 'context switching cognitive cost productivity research APA' },
    ],
  },
  {
    virtueId: 4,
    name: 'Resolution',
    technicalCues: [
      'Write your top 3 non-negotiable tasks for tomorrow before closing your workday today — they are pre-committed, not aspirational.',
      'Apply implementation intentions format: "When [situation X], I will perform [behavior Y] in [location Z]."',
      'Decompose any task that has sat undone for 48 hours into sub-units under 25 minutes.',
      'Identify and name one accountability partner. State one commitment to them per week.',
    ],
    furtherStudy: [
      { label: 'Implementation intentions meta-analysis', query: 'Gollwitzer Sheeran implementation intentions meta-analysis effect size' },
      { label: 'Commitment devices', query: 'commitment devices behavioral economics self-control Ariely' },
      { label: 'Activation energy & procrastination', query: 'activation energy procrastination task initiation psychology' },
    ],
  },
  {
    virtueId: 5,
    name: 'Frugality',
    technicalCues: [
      'Enforce a 48-hour rule on all non-essential purchases above your defined threshold.',
      'Classify every transaction as: Investment / Maintenance / Waste. Review weekly.',
      'Log expenditures same-day; delayed logging enables rationalization.',
      'Run a zero-based budget monthly — every dollar is assigned a purpose before the month begins.',
    ],
    furtherStudy: [
      { label: 'Zero-based budgeting', query: 'zero-based budgeting method personal finance effectiveness' },
      { label: 'Delay discounting & financial decisions', query: 'delay discounting financial decision making temporal self-control' },
      { label: 'Mental accounting research', query: 'Thaler mental accounting behavioral economics framing spending' },
    ],
  },
  {
    virtueId: 6,
    name: 'Industry',
    technicalCues: [
      'Pre-plan all known idle transitions (commute, waiting, between tasks) with a default useful activity.',
      'Use a Pomodoro-style timer (25/5) to overcome activation resistance on difficult tasks.',
      'Audit your top 3 time sinks once per week by reviewing your calendar or screen-time data.',
      'Apply Parkinson\'s Law deliberately: assign a compressed time budget to tasks that tend to expand.',
    ],
    furtherStudy: [
      { label: 'Pomodoro technique research', query: 'Pomodoro technique productivity focus research evidence' },
      { label: 'Time audit methodology', query: 'time audit productivity tracking method Laura Vanderkam' },
      { label: "Parkinson's Law", query: "Parkinson's Law time management work expansion research" },
    ],
  },
  {
    virtueId: 7,
    name: 'Sincerity',
    technicalCues: [
      'In your evening review, identify one instance where you communicated something other than what you knew to be true — however minor.',
      'Practice steel-manning: before any disagreement, state the strongest version of the opposing position.',
      'Express disagreement directly and promptly; delayed honesty compounds the deceit.',
      'Maintain a weekly "self-deception audit": what are you currently lying to yourself about?',
    ],
    furtherStudy: [
      { label: 'Radical honesty practice', query: 'radical honesty Brad Blanton interpersonal communication research' },
      { label: 'Self-deception psychology', query: 'self-deception motivated reasoning psychology research review' },
      { label: 'Epistemic cowardice', query: 'epistemic cowardice dishonesty philosophy psychology' },
    ],
  },
  {
    virtueId: 8,
    name: 'Justice',
    technicalCues: [
      'Maintain a running log of promises made; review it weekly for outstanding commitments.',
      'Identify one "duty omitted" this week — a benefit you could have provided and did not.',
      'Audit your professional and personal obligations quarterly for scope creep or chronic neglect.',
      'When you have caused harm or failed a duty, identify a restorative action and schedule it immediately.',
    ],
    furtherStudy: [
      { label: 'Duty ethics (deontological framework)', query: 'Kant deontological ethics duty obligations summary' },
      { label: 'Restorative practices', query: 'restorative justice practices relationships harm repair research' },
      { label: 'Obligation tracking systems', query: 'personal obligation tracking accountability system productivity' },
    ],
  },
  {
    virtueId: 9,
    name: 'Moderation',
    technicalCues: [
      'Rate your emotional intensity on a 1–10 scale before taking any action driven by irritation or resentment.',
      'Apply the surgeon rule: make no drastic changes to a system that is mid-operation.',
      'Create a mandatory 24-hour delay before sending any message written in an elevated emotional state.',
      'Define explicit "good enough" thresholds for recurring tasks — perfectionism is extremism applied to output.',
    ],
    furtherStudy: [
      { label: 'Cognitive defusion (ACT)', query: 'cognitive defusion acceptance commitment therapy emotion regulation' },
      { label: 'Emotional regulation techniques', query: 'emotional regulation reappraisal suppression effectiveness meta-analysis' },
      { label: 'The surgeon rule', query: '"surgeon rule" mid-project change management decision making' },
    ],
  },
  {
    virtueId: 10,
    name: 'Cleanliness',
    technicalCues: [
      'Execute a 10-minute physical reset at the same time each day — treat it as a non-negotiable system process.',
      'Apply the rule: never leave a room in a worse state than you entered it.',
      'Batch hygiene and grooming tasks (laundry, haircut, equipment maintenance) into a single weekly slot.',
      'Conduct a monthly "broken windows" audit: identify one environmental degradation point and repair it.',
    ],
    furtherStudy: [
      { label: 'Environment design & behavior', query: 'environment design behavior change nudge architecture research' },
      { label: 'Broken windows theory applied', query: 'broken windows theory environment disorder behavior psychology' },
      { label: 'Habit stacking with environment cues', query: 'habit stacking environmental cues BJ Fogg James Clear atomic habits' },
    ],
  },
  {
    virtueId: 11,
    name: 'Tranquility',
    technicalCues: [
      'Apply the Stoic dichotomy of control daily: for each disturbance, explicitly classify it as within or outside your control before responding.',
      'Practice negative visualization for 2 minutes before sleep: enumerate what could go wrong. Reduce its novelty.',
      'Use the 4-7-8 breathing pattern as a physiological interrupt at the first sign of disproportionate stress.',
      'Maintain a weekly "annoyance log" — pattern recognition across entries reveals your actual trigger profile.',
    ],
    furtherStudy: [
      { label: 'Stoic dichotomy of control', query: 'Stoicism dichotomy of control Epictetus Marcus Aurelius practical application' },
      { label: 'Cognitive reappraisal research', query: 'cognitive reappraisal stress response effectiveness neuroscience research' },
      { label: 'Vagal tone & stress response', query: 'vagal toning breathing exercises parasympathetic activation research' },
    ],
  },
  {
    virtueId: 12,
    name: 'Venery',
    technicalCues: [
      'Map your lapse trigger chain: identify the environmental and emotional states that precede each incident.',
      'Engineer friction barriers: increase the number of deliberate steps required to access the stimulus.',
      'Apply urge-surfing: when the urge arises, observe it without acting for 10 minutes and log its intensity trajectory.',
      'Track the trigger → pattern → outcome sequence for each lapse; the pattern is the diagnostic target, not the outcome.',
    ],
    furtherStudy: [
      { label: 'Urge surfing (mindfulness-based relapse prevention)', query: 'urge surfing mindfulness-based relapse prevention Witkiewitz research' },
      { label: 'Stimulus control in behavioral psychology', query: 'stimulus control behavioral psychology habit disruption research' },
      { label: 'Dopamine regulation & reward pathways', query: 'dopamine reward pathway regulation behavioral impulse control neuroscience' },
    ],
  },
  {
    virtueId: 13,
    name: 'Humility',
    technicalCues: [
      'In every conversation, attempt to understand the other position fully before formulating a response.',
      'Acknowledge one mistake publicly per week — the act of naming it is the corrective mechanism.',
      'Ask yourself daily: "What am I currently wrong about?" Write the answer down.',
      'Maintain a "superiority bias" journal: log every instance where you assumed your judgment was more reliable than the evidence warranted.',
    ],
    furtherStudy: [
      { label: 'Intellectual humility research', query: 'intellectual humility psychology measurement outcomes research' },
      { label: 'Dunning-Kruger effect & metacognition', query: 'Dunning-Kruger effect competence metacognition self-assessment accuracy' },
      { label: 'Epistemic humility in practice', query: 'epistemic humility philosophy practice decision making calibration' },
    ],
  },
];

/** Look up strategy by virtueId. Returns null if not found. */
export function getStrategy(virtueId: number): VirtueStrategy | null {
  return STRATEGY_BANK.find((s) => s.virtueId === virtueId) ?? null;
}
