import type { Timestamp } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────
// Franklin Module — Core Types
// ─────────────────────────────────────────────────────────────

export interface FranklinVirtue {
  id: number;      // 1–13 (user-configurable order)
  name: string;
  command: string; // The behavioral directive / maxim
}

/** Firestore: franklinSettings/{userId} */
export interface FranklinSettings {
  userId: string;
  virtues: FranklinVirtue[];
  franklinActive: boolean;
  cycleStartDate: string;    // YYYY-MM-DD Monday of week 1
  auditWindowHour: number;   // 0–23, hour of day the Evening Audit begins
  auditWindowMinute: number; // 0–59
  lastSealedWeekKey: string | null; // YYYY-MM-DD of the last Monday whose audit was sealed
  manualAuditWeekKey: string | null; // Set to force an audit mid-cycle; cleared on seal
}

/** Firestore: franklinAudits/{userId}_{virtueId}_{weekKey} */
export interface FranklinAuditRecord {
  id: string;
  userId: string;
  virtueId: number;
  virtueName: string;
  weekKey: string;           // The Monday of the week being reviewed
  lapseCount: number;
  alignmentCount: number;
  triggerAnalysis: string;   // AES-GCM encrypted if isEncrypted=true
  strategySelected: string;  // AES-GCM encrypted if isEncrypted=true
  triggerIv: string | null;
  strategyIv: string | null;
  isEncrypted: boolean;
  sealedAt: Timestamp;
}

/** Firestore: franklinWeekRecords/{userId}_{virtueId}_{weekKey} */
export interface FranklinWeekRecord {
  id: string;
  userId: string;
  virtueId: number;
  weekKey: string;       // YYYY-MM-DD of the Monday (stable week identifier)
  lapseCount: number;
  alignmentCount: number;
}

/** Firestore: franklinNotes/{autoId} — permanent archive */
export interface FranklinNote {
  id: string;
  userId: string;
  virtueId: number;
  virtueName: string;
  type: 'lapse' | 'alignment';
  note: string;
  date: string;    // YYYY-MM-DD
  weekKey: string; // YYYY-MM-DD of the Monday
  createdAt: Timestamp;
}

// ─────────────────────────────────────────────────────────────
// Benjamin Franklin's 13 Virtues — Default Baseline
// (includes Venery and Athleticism per spec)
// ─────────────────────────────────────────────────────────────

export const DEFAULT_VIRTUES: FranklinVirtue[] = [
  {
    id: 1,
    name: 'Temperance',
    command: 'Eat not to dullness; drink not to elevation.',
  },
  {
    id: 2,
    name: 'Silence',
    command:
      'Speak not but what may benefit others or yourself; avoid trifling conversation.',
  },
  {
    id: 3,
    name: 'Order',
    command:
      'Let all your things have their places; let each part of your business have its time.',
  },
  {
    id: 4,
    name: 'Resolution',
    command:
      'Resolve to perform what you ought; perform without fail what you resolve.',
  },
  {
    id: 5,
    name: 'Frugality',
    command:
      'Make no expense but to do good to others or yourself; waste nothing.',
  },
  {
    id: 6,
    name: 'Industry',
    command:
      'Lose no time; be always employed in something useful; cut off all unnecessary actions.',
  },
  {
    id: 7,
    name: 'Sincerity',
    command:
      'Use no hurtful deceit; think innocently and justly; speak accordingly.',
  },
  {
    id: 8,
    name: 'Justice',
    command:
      'Wrong none by doing injuries or omitting the benefits that are your duty.',
  },
  {
    id: 9,
    name: 'Moderation',
    command:
      'Avoid extremes; forbear resenting injuries so much as you think they deserve.',
  },
  {
    id: 10,
    name: 'Cleanliness',
    command: 'Tolerate no uncleanliness in body, clothes, or habitation.',
  },
  {
    id: 11,
    name: 'Tranquility',
    command:
      'Be not disturbed at trifles, or at accidents common or unavoidable.',
  },
  {
    id: 12,
    name: 'Venery',
    command:
      "Rarely use venery but for health or offspring; never to dullness, weakness, or the injury of your own or another's peace or reputation.",
  },
  {
    id: 13,
    name: 'Humility',
    command: 'Imitate Jesus and Socrates.',
  },
];

// ─────────────────────────────────────────────────────────────
// Holding Tank — Optional virtues not in the default 13
// Users may add any of these to their active list at any time
// ─────────────────────────────────────────────────────────────

export const HOLDING_TANK_VIRTUES: FranklinVirtue[] = [
  {
    id: 0,
    name: 'Humility',
    command: 'Imitate Jesus and Socrates.',
  },
  {
    id: 0,
    name: 'Athleticism',
    command: 'Train the body with discipline; move daily with purpose and intensity.',
  },
  {
    id: 0,
    name: 'Fortitude',
    command:
      'Endure the long grind with a steady hand; let neither a sudden bug nor a difficult shift shake your resolve to complete the cycle.',
  },
  {
    id: 0,
    name: 'Stewardship',
    command:
      'Neglect not the tools of your trade; keep your systems, software, and physical surroundings in high repair, that they may serve you without friction.',
  },
];
