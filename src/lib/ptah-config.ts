export const PTAH_CONFIG = {
  version: "2.3.1", // The Franklin Initiative — Virtue Architecture & the Weekly Audit Gate
  title: "THE FRANKLIN INITIATIVE — VIRTUE ARCHITECTURE & THE WEEKLY AUDIT GATE",
  date: "May 12, 2026 A.D. — Year 5526 of the Old Kingdom",
  type: "MAJOR_FEATURE",

  intro: "The Temple has inscribed a new instrument of self-cultivation into the Notebook. The Franklin Initiative is a complete, encrypted, thirteen-virtue refinement cycle drawn from the practice of Benjamin Franklin — statesman, scientist, and one of the most deliberately constructed human beings in recorded history. The system tracks lapses and alignments against a rotating virtue focus, requires a sealed weekly audit with trigger analysis and strategy selection, surfaces previous cycle records to prevent beginning from zero, and encrypts all personal reflections on-device before they reach Firestore. A Strategy Bank of behavioural techniques accompanies every virtue. The Crown Card on the Main Hall is now a live virtue dashboard. Ptah has spoken the architecture into being. The cycle begins.",

  changes: [
    {
      icon: "Scroll",
      title: "Franklin Initiative — Thirteen-Virtue Refinement Cycle",
      description: "The full Franklin system is now active. Thirteen virtues rotate weekly across the cycle: Temperance, Silence, Order, Resolution, Frugality, Industry, Sincerity, Justice, Moderation, Cleanliness, Tranquility, Chastity, and Humility. Each carries its original Franklinian command as the operative directive. The Crown Card on the Main Hall displays the current week's virtue with its command, spot counters, log buttons, and this week's context notes. The full Cycle Dashboard at /franklin shows all thirteen virtues, the current week number, and the complete audit archive."
    },
    {
      icon: "Shield",
      title: "Crown Card — Live Virtue HUD on the Main Hall",
      description: "The CrownCard component mounts on the Main Hall when the Franklin Initiative is active. It shows the current week number, primary virtue name and command, black spot (lapse) and bright spot (alignment) counters with dot visualisation, and up to five context notes from this week. A + button on each counter opens the SpotModal for logging with an optional note. The Access All Virtues toggle expands the full virtue list below the card with per-virtue log buttons. The card locks out all logging when an audit is pending and instead shows the AuditLockBanner. It also detects completed rituals whose titles overlap the virtue's name and auto-logs an alignment."
    },
    {
      icon: "Flame",
      title: "Weekly Audit Gate — Sealed Reckoning",
      description: "At the close of each virtue's week the system requires a sealed audit before the cycle advances. The AuditGate component blocks progress and presents two fields: Trigger Analysis (what caused the lapses — name the pattern plainly) and Strategy Selection (the standing directive for the next cycle of this virtue). The full week's note log is displayed inside the gate so the analysis is evidence-based. Both fields are encrypted on-device with AES-GCM before reaching Firestore. Once sealed the record is immutable. The seal button reads: Perform Without Fail What You Resolve."
    },
    {
      icon: "Eye",
      title: "Previous Cycle Recall — Continuity Across the Wheel",
      description: "When a virtue returns on the rotation, the Crown Card surfaces the last sealed audit for that virtue automatically. The Standing Directive (the strategy committed to in the previous cycle) appears above the log buttons. The Known Trigger Pattern (the named root cause) appears below. The scribe does not begin from zero. They begin from the last honest reckoning. Both fields are decrypted client-side and never transmitted in plaintext."
    },
    {
      icon: "BookOpen",
      title: "Strategy Bank — Behavioural Science Protocols for Each Virtue",
      description: "Every virtue has a corresponding Strategy Bank entry containing implementation-level technical cues drawn from behavioural science, Stoic practice, and practical method — not motivational slogans, but operational protocols. A teal glyph button beneath any virtue name on the Crown Card or Cycle Dashboard opens a slide-down panel showing the technique list and Further Study links (targeted searches, no hardcoded external URLs). The full Strategy Bank tab on the /franklin dashboard shows all thirteen entries in an accordion."
    },
    {
      icon: "AlertTriangle",
      title: "Force Audit — Mid-Cycle Voluntary Review",
      description: "The audit is not only triggered at natural week end. A Mid-Cycle Review button in the Config tab of the Cycle Dashboard allows the scribe to open an audit at any point in the week — after a significant lapse, at a turning point, or when the evidence demands attention. This sets manualAuditWeekKey on the settings document, which forces the AuditGate open with an 'Audit Required / System Locked' header replaced by 'Mid-Cycle Review / Voluntary Reflection'. Sealing the audit clears the flag and does not advance lastSealedWeekKey, preserving the natural cycle position."
    },
    {
      icon: "Lock",
      title: "Zero-Knowledge Encryption — All Personal Reflections",
      description: "Every personal reflection in the Franklin Initiative is sealed before it reaches the server. Audit trigger analyses, standing directives, and context notes are all encrypted with AES-256-GCM using the scribe's master vault key. The key is derived from the recovery phrase and never transmitted. Firestore stores only ciphertext. Decryption happens entirely on-device in the hook layer. A new franklinAudits Firestore collection stores sealed audit records, protected by owner-only security rules. The collection is append-only by design — no update or delete rule exists."
    },
  ],

  instructions: [
    "1. UNLOCK YOUR VAULT: The Franklin Initiative encrypts your reflections. Open Archives and enter your recovery phrase before your first audit, or any time the amber vault banner appears.",
    "2. ACTIVATE THE INITIATIVE: Navigate to /franklin (sidebar → Franklin Initiative). In the Config tab, toggle 'Activate Franklin Initiative' to on. Set your cycle start date. The system will calculate your current virtue and week automatically.",
    "3. LOG SPOTS FROM THE CROWN CARD: The Crown Card on the Main Hall shows your current virtue. Tap + on Black Spots to log a lapse, + on Bright Spots to log an alignment. An optional note accompanies each entry — use it to record context while it is fresh.",
    "4. COMPLETE THE WEEKLY AUDIT: When a virtue's week ends, the system locks and the Audit Gate opens at /franklin. Name your trigger pattern honestly. Select or write a standing directive. Tap 'Perform Without Fail What You Resolve' to seal the record.",
    "5. REVIEW THE STRATEGY BANK: Tap the teal glyph button beneath any virtue name to open its Strategy Bank entry. Technical cues and further study references are available for all thirteen virtues.",
    "6. USE MID-CYCLE REVIEW WHEN NEEDED: If the evidence demands a reckoning before week's end, open the Config tab on the Cycle Dashboard and tap 'Open Weekly Audit'. This creates a voluntary sealed record without advancing the cycle.",
    "7. CONTACT THE TEMPLE: Prayers, inquiries, and reports of peculiarities to: rites@unclepetelaboratories.net"
  ],

  devNote: "v2.3.1 adds the complete Franklin Initiative subsystem. Key files: src/lib/franklin-types.ts (FranklinVirtue, FranklinWeekRecord, FranklinSettings with lastSealedWeekKey + manualAuditWeekKey, FranklinAuditRecord), src/lib/franklin/strategyBank.ts (STRATEGY_BANK array, 13 entries with technicalCues and furtherStudy), src/hooks/use-franklin.ts (full audit logic: auditPending, auditVirtue, auditWeekKey, isManualAudit, forceAudit, sealAudit, latestAuditForCurrentVirtue listener, encrypted notes listener), src/components/franklin/audit-gate.tsx (AuditGate + AuditLockBanner), src/components/franklin/strategy-viewer.tsx (teal full-width toggle, slide-down panel), src/components/franklin/crown-card.tsx (live HUD, Previous Cycle Directive, StrategyViewer, AuditLockBanner, ritual event bus), src/app/franklin/page.tsx (full dashboard: AuditGate at top, StrategyViewer per virtue, FullStrategyBank tab, Force Audit in Config). Firestore collections added: franklinAudits (owner-only, append-only — no update/delete rule). franklinWeekRecords read rule uses resource==null guard. franklinAudits read rule uses same guard. Composite query on franklinAudits: userId + virtueId, ordered by sealedAt desc — may require a composite index if Firestore prompts for one. All personal text fields encrypted AES-GCM on write, decrypted in onSnapshot callback."

};
