import React, { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const SEBAYT_ENTRIES = [
  {
    id: 'security',
    title: 'Security & Sovereignty: The 24 Words',
    content: `Your journey in the Ptah Network begins with absolute sovereignty. Upon initiation, you were granted the 24 Words of Heka (Magic). This seed phrase is the ultimate key to your digital Ba (soul). 
    
WARNING: The Midnight Scribe cannot recover lost words. You must write these 24 words down on physical papyrus or stone and guard them with your life. Do not store them in the digital ether. Without them, your connection to Thoth's Notebook is severed permanently.`
  },
  {
    id: 'task-creation',
    title: 'The Paths of Action: Task Creation',
    content: `In Thoth's Notebook, thoughts are rendered into reality through Task Creation. You are the architect of your day. While you can create standard tasks for fleeting thoughts, the true power of the Ptah Network lies in categorization. You must define your tasks carefully, separating the mundane from the divine, to maintain order in your personal cosmos.`
  },
  {
    id: 'daily-rituals',
    title: 'Daily Rituals & The Midnight Scribe',
    content: `Daily Rituals are the cornerstone of a disciplined mind. Unlike fleeting tasks, Daily Rituals are intended to help you forge unbreakable habits. 

At the stroke of 12:00 AM, the automated Midnight Scribe runs through the network, dutifully copying your active Daily Rituals and presenting you with a fresh slate for the new day. 

Ostraca Integration: You can link your Daily Rituals to your Ostraca (digital shards of notes and knowledge) so that the necessary instructions, incantations, or references are always attached to the ritual when it regenerates.`
  },
  {
    id: 'khet-special-missions',
    title: 'Khet & Special Missions',
    content: `Beyond standard routines, the Ptah Network offers open-ended classifications for your actions.

Khet (The Physical Body): In the ancient tongue, Khet represents the physical form. Use this category for tasks that require physical exertion, material gathering, or real-world manifestation.

Special Missions & Other Categories: What constitutes a "Special Mission"? That is entirely up to your perception. The Ptah Network leaves these classifications intentionally fluid. A Special Mission is exactly what you believe it to be—a high-priority quest, a sudden burst of inspiration, or an anomaly in your daily cycle.`
  },
  {
    id: 'maat-nun',
    title: 'The Scales of Balance: Ma\'at and Nun',
    content: `Your actions in Thoth's Notebook are weighed on the cosmic scales. 

Ma'at: Represents truth, balance, and cosmic order. Completing your tasks and honoring your commitments brings your digital ecosystem into a state of Ma'at.

Nun: The primordial abyss of chaos and unformed potential. When tasks are abandoned and rituals are ignored, your interface begins to slip into Nun. The void consumes disorder. Do not let your tasks drown in the abyss.`
  },
  {
    id: 'oath-streaks',
    title: 'The Oath of Commitment & Streaks',
    content: `To uphold Ma'at, you must take the Oath of Commitment. This is a pledge to consistency. As you complete your Daily Rituals, the Ptah Network tracks your Streaks—a glowing, numerical testament to your unwavering discipline. Breaking the Oath resets your Streak, forcing you to rebuild your temple from the foundation up.`
  },
  {
    id: 'evening-chronicle',
    title: 'The Evening Chronicle',
    content: `As Ra's solar barque descends into the underworld, it is time for reflection. The Evening Chronicle is your nightly space to log your triumphs, record your failures, and synthesize the events of your waking hours. Managing your Daily Rituals culminates here, ensuring your mind is clear before the Midnight Scribe arrives.`
  },
  {
    id: 'gifts-of-ptah',
    title: 'Gifts of Ptah: The Franklin Initiative',
    content: `Ptah is the opener of mouths. Before all things existed, he spoke the cosmos into being through thought and word alone — Sia and Hu, conception and utterance, the two pillars of creation. He did not forge the world with force. He willed it into order.

A Gift of Ptah is not bestowed lightly. It is not given for a streak counter or a completed checklist. It is conferred when the architecture of the self has been deliberately redesigned — when a seeker has turned the craftsman's eye inward and begun the true work.

You have received the Franklin Initiative.

─────────────────────────────────────────────

THE GIFT ITSELF

Benjamin Franklin — statesman, scientist, and one of the most deliberately constructed human beings in recorded history — spent his life working through a system of thirteen virtues. Not by willpower alone, but through observation, record, and honest reckoning. He tracked his lapses in ink. He stared at the evidence. He did not flinch. And across decades, he became the shape of the man he intended to be.

Thoth's Notebook carries that same system forward. The Franklin Initiative is your thirteen-virtue refinement cycle — a living, encrypted ledger of who you are versus who you resolve to be.

─────────────────────────────────────────────

THE THIRTEEN VIRTUES

Each virtue is assigned its own week in rotation. The cycle runs continuously. You practice one virtue at a time, giving it your full focused attention while keeping all others in the background of your conduct.

The thirteen virtues, in order:

I. TEMPERANCE — Eat not to dullness. Drink not to elevation.
II. SILENCE — Speak not but what may benefit others or yourself. Avoid trifling conversation.
III. ORDER — Let all your things have their places. Let each part of your business have its time.
IV. RESOLUTION — Resolve to perform what you ought. Perform without fail what you resolve.
V. FRUGALITY — Make no expense but to do good to others or yourself. Waste nothing.
VI. INDUSTRY — Lose no time. Be always employed in something useful. Cut off all unnecessary actions.
VII. SINCERITY — Use no hurtful deceit. Think innocently and justly; speak accordingly.
VIII. JUSTICE — Wrong none by doing injuries, or omitting the benefits that are your duty.
IX. MODERATION — Avoid extremes. Forbear resenting injuries so much as you think they deserve.
X. CLEANLINESS — Tolerate no uncleanliness in body, clothes, or habitation.
XI. TRANQUILITY — Be not disturbed at trifles, or at accidents common or unavoidable.
XII. CHASTITY — Rarely use venery but for health or offspring. Never to dullness, weakness, or the injury of your own or another's peace or reputation.
XIII. HUMILITY — Imitate Jesus and Socrates.

─────────────────────────────────────────────

HOW THE SYSTEM WORKS

The Crown Card appears on your Main Hall when the Franklin Initiative is active. It displays your current virtue — the one under focus this week. You log Black Spots (lapses) and Bright Spots (alignments) directly from this card. A note accompanies each entry; these notes form your honest ledger.

The Cycle Dashboard (/franklin) shows the full state of your practice: which week you are in, all thirteen virtues, the Strategy Bank for each, the audit archive, and configuration controls.

─────────────────────────────────────────────

THE WEEKLY AUDIT GATE

At the close of each virtue's week, the system requires an Audit. This is the heart of the Gift.

You will be asked two questions:

1. What triggered the lapses you recorded? — Write plainly. Name the circumstance, the emotional state, the environment, the pattern. The trigger is the root. Until you name it, you cannot address it.

2. What strategy will you carry forward? — Select or write a standing directive. This becomes your operational order for the next time this virtue returns in the cycle.

Both fields are encrypted with your personal key before they leave your device. The system itself cannot read them. Only you hold the cipher.

Once you seal the audit, it is permanent. The record is immutable. This is intentional — the past cycle is a fact, not a draft.

─────────────────────────────────────────────

PREVIOUS CYCLE RECALL

When a virtue returns on the wheel, the Crown Card surfaces your last sealed audit for it automatically. Your standing directive appears above the log buttons — a reminder of the strategy you committed to. Your known trigger pattern appears below it — the pattern you identified in the last cycle.

You do not begin from zero. You begin from the last honest reckoning.

─────────────────────────────────────────────

THE STRATEGY BANK

Every virtue in the system has a corresponding Strategy Bank entry. These are technical behavioral cues — not motivational slogans, but operational protocols drawn from behavioral science, stoic practice, and practical method.

Access the Strategy Bank by tapping the teal glyph button beneath any virtue name on the Crown Card or the Cycle Dashboard. The panel slides open to reveal implementation-level techniques and further study references.

The Further Study links open targeted searches for deeper reading. No external accounts. No paywalls in the path.

─────────────────────────────────────────────

FORCE AUDIT / MID-CYCLE REVIEW

The audit is not only triggered at the end of a week. Any time you feel the need to reckon — after a significant lapse, at a turning point, or simply when the pattern demands attention — you may open a Mid-Cycle Review from the Config tab.

This is a voluntary act of self-examination. It does not advance the cycle. It creates a sealed record. Use it when the evidence demands it.

─────────────────────────────────────────────

ZERO-KNOWLEDGE ENCRYPTION

All personal reflections in the Franklin Initiative — audit trigger analyses, standing directives, and context notes — are encrypted on your device using AES-256-GCM before they are stored. The encryption key is derived from your seed phrase and never transmitted. The Ptah Network stores only ciphertext. The plaintext exists only in your hands.

This is not a privacy policy. It is a cryptographic guarantee.

─────────────────────────────────────────────

ON THE NATURE OF THIS WORK

Franklin ran his virtue cycle for the rest of his life. He never perfected any virtue. He noted, near the end of his autobiography, that he had given up on the project of perfection — but found the attempt had made him a better and happier man than he would otherwise have been.

The system does not promise perfection. It promises clarity. It promises that you will know yourself more honestly at the end of the year than at the beginning — not because you were told to improve, but because you watched yourself and did not look away.

Ptah speaks the form into existence. You supply the observation and the will.

Begin the cycle.`
  },
  {
    id: 'seshat-interface',
    title: 'The Seshat Interface: Cosmic Arithmetics',
    content: `The Seshat Interface is Thoth's Notebook's advanced calculation chamber, presided over by Seshat — goddess of counting, writing, and the measurement of time. Access it from the Main Hall.

The Controller Bar sits above the display and contains two keys: the mode button, which cycles through the three calculator modes, and the 𓂀 glyph, which opens the Esoterica panel.

Three Core Modes (tap the mode button to cycle):

SIMPLE — A clean four-function calculator with parentheses and a random-number generator (RND). Ideal for everyday arithmetic.

SCIENTIFIC — Full scientific calculator with trigonometric functions (sin, cos, tan), logarithms (log, ln), square root (√), powers (x^y), and reciprocal (1/x). Function keys insert proper notation directly into the expression; tap = to evaluate.

EGYPTIAN — Transforms numeric results into Egyptian unit fractions. The ancient Egyptians expressed no general fraction a/b — every fractional value was written as a sum of distinct unit fractions (e.g. 2/3 = 1/2 + 1/6). The result display rewrites your answer in this ancient arithmetic notation.

The Esoterica System:
Tap the 𓂀 glyph in the Controller to open the Esoterica panel. Three hidden chambers of deeper mathematical knowledge appear: EUCLID (a complete reader of Euclid's Elements), CALCULUS (a graphing calculator with numeric derivative and integral), and HARMONIA (a Pythagorean tuning and sound synthesiser).`
  },
  {
    id: 'harmonia-mode',
    title: 'Harmonia: The Music of the Spheres',
    content: `Pythagoras discovered that the harmonious intervals of music are governed by simple integer ratios: 2:1 for the octave, 3:2 for the perfect fifth, 4:3 for the perfect fourth. He called this the Music of the Spheres — the cosmos itself vibrates in these proportions.

Harmonia is a Pythagorean monochord calculator that computes these ratios and lets you hear them directly through your device's speaker.

HOW TO USE HARMONIA:

Root Note — Select the chromatic note you want as your starting pitch. All twelve notes of the chromatic scale are available. The base frequency updates automatically (A4 = 440 Hz is standard concert pitch; you can override this).

Base (Hz) — Type a custom frequency. Useful for historical tuning: A4 = 432 Hz (Verdi pitch), A4 = 415 Hz (Baroque standard), or any other system.

Waveform — The timbre of the synthesiser:
• Sine: pure, mathematically clean — the tone Pythagoras envisioned on the monochord
• Triangle: warm, resembling a wooden flute or soft organ pipe
• Sawtooth: bright and rich in harmonics; consonance and dissonance become most vivid here

Pythagorean Interval — Select any of the 13 intervals from the Pythagorean chromatic scale. These use the exact integer ratios derived from dividing a string by whole number lengths — the same method Pythagoras used on his monochord instrument.

The Mini Keyboard — Displays two octaves of the chromatic scale. Your root note is highlighted in violet; the interval note in amber. When both share the same pitch class (Unison 1:1, Octave 2:1), they glow fused magenta. The note names appear on highlighted keys.

Play Buttons:
• ▶ Root — sounds the base note alone, sustaining for 2 seconds
• ▶ Interval — sounds the second note of the interval alone
• ▶ Together — plays both simultaneously as a Pythagorean dyad for 3.5 seconds. Consonant ratios (Perfect 5th 3:2, Perfect 4th 4:3) ring pure and stable. Dissonant ones (Tritone 729:512, Minor 2nd 256:243) vibrate with audible tension.

Auto Mode — When enabled, selecting any interval in the list immediately plays the dyad, letting you scan the entire scale to hear each interval's character in sequence.

The Three Readouts:
• Result (Hz) — the exact frequency of the interval note
• Cents — the interval in cents. 100 cents equals one equal-tempered semitone (modern piano). Pythagorean intervals deviate slightly from equal temperament, which is precisely why they sound more resonant on pure intervals and more tense on complex ones.
• String ℓ — the monochord string length ratio: the fraction of string length that Pythagoras would have stopped to produce this interval. The reciprocal of the frequency ratio.`
  },
  {
    id: 'esoterica-euclid-calculus',
    title: 'Esoterica: Euclid & Calculus Modes',
    content: `The Esoterica panel (opened with the 𓂀 button in the Seshat Controller) contains three hidden mathematical chambers. The EUCLID and CALCULUS modes are described here.

EUCLID — Elements Reader

A complete reading environment for Euclid's Elements (circa 300 BCE) — the most influential mathematical text in history, in continuous use for over two thousand years.

All thirteen Books are available, from the foundations of plane geometry (Book I: parallel lines, triangles, the Pythagorean theorem) through geometric algebra (Book II), circle theorems (Books III–IV), the theory of proportions (Books V–VI), elementary number theory (Books VII–IX), incommensurable magnitudes and irrationals (Book X), solid geometry (Book XI), and the construction of the five Platonic solids (Book XIII).

Use the ‹ › arrows to navigate between Books and Propositions. The left arrows move between books; the smaller arrows move between propositions within a book.

Tap Work a Problem to receive a numeric challenge drawn from the proposition. Write your solution in the scratch field below — the full Seshat calculator display remains active above the Esoterica panel so you can verify your arithmetic. Tap Reveal Hint if you are stuck.

CALCULUS — Graphing Calculator

A live SVG graphing calculator supporting nine functions: sin(x), cos(x), tan(x), x², x³, eˣ, ln(x), 1/x, and √x.

Select a function using the chip buttons along the top. The graph updates immediately. Use the + and − zoom buttons to examine different regions of the function, and Reset to return to the default view.

Enter an x value in the input field and tap Compute to receive two numerical results:
• f′(x) — the derivative at that point, computed via the symmetric difference quotient: (f(x+h) − f(x−h)) / 2h. This is a numerical approximation with h = 0.0001.
• ∫₀ˣ f dt — the definite integral from 0 to x, computed via Simpson's rule with 200 intervals. This gives a highly accurate numerical approximation of the area under the curve from zero to your chosen point.

The graph and the numbers speak the same language. This is the calculus of Newton and Leibniz made tactile.`
  },
  {
    id: 'franklin-overview',
    title: 'The Franklin Initiative: Character Architecture',
    content: `The Franklin Initiative is a 13-week character development protocol embedded within Thoth's Notebook, inspired by Benjamin Franklin's method of moral perfection as described in his autobiography.

Franklin believed that perfect virtue was achievable through focused, systematic attention — not by attempting to embody all virtues simultaneously, but by concentrating on one at a time. He created a small book in which he tracked his daily transgressions against each virtue with a simple mark. Over thirteen weeks, he would cycle through his complete list, returning to each virtue year after year, gradually clearing the marks from his pages.

The Franklin Initiative digitizes and extends this method.

THE 13-WEEK ROTATION: Each week, one virtue is designated as your Primary Virtue. The system rotates automatically through your full list using a modulo calculation against the cycle start date. You are not told to be perfect in all things — only to place one virtue under the microscope.

THE BASELINE VIRTUES: The system ships with Franklin's original 13 virtues: Temperance, Silence, Order, Resolution, Frugality, Industry, Sincerity, Justice, Moderation, Cleanliness, Tranquility, and two additional virtues relevant to modern practice — Venery and Athleticism. All 13 are fully editable. You may rename them, rewrite their commands, add new virtues, or remove those that do not apply to your life.

ACTIVATION: Navigate to the Franklin Initiative page via the sidebar. The initiative begins in an inactive state. You may pre-configure your virtue list before activating. When you press Begin the Initiative, the cycle starts from the current Monday and the Crown Card appears on your Main Hall.`
  },
  {
    id: 'franklin-crown-card',
    title: 'The Crown Card: Black Spots & Bright Spots',
    content: `The Crown Card is a persistent HUD (Heads-Up Display) injected at the top of your Main Hall when the Franklin Initiative is active. It is your daily interface with the active virtue.

THE CROWN CARD DISPLAYS:

Current Week — Which week of the cycle you are in (e.g., Week 4 of 13) and the name and command of your Primary Virtue for that week.

Black Spot Count (Lapses) — A row of dark dots, one for each recorded failure against the active virtue this week. This is your transgression ledger. The count resets to zero when the virtue rotates out of the primary slot.

Bright Spot Count (Alignments) — A row of amber dots, one for each recorded alignment this week. These mark moments when you successfully embodied the virtue.

THE BLACK SPOT — LAPSE:

Press the Black Spot button when you have failed to live according to the active virtue. A modal opens prompting you to record a Context Note. Specificity is required. "Failed Order: desk was a mess after shift" is useful data. "Messed up" is not. The note is permanently archived in your Franklin Archive and will be available for review every time this virtue cycles back around.

THE BRIGHT SPOT — ALIGNMENT:

Press the Bright Spot button when you have demonstrated the active virtue with clarity. Record the specific action. "Industry: completed the SUDO module two hours ahead of schedule" is the correct format. The note is permanently archived alongside your lapses.

NUMERICAL RESET: The dot counts reset each time a virtue returns to the primary position. This mirrors Franklin's original chart — each cycle is a fresh ledger.

NOTE PERSISTENCE: Your Context Notes do not reset. They accumulate in The Franklin Archive, indexed by virtue, allowing you to read through years of lessons learned each time a virtue comes around again. This is the long-term learning mechanism of the system.

AUTO-ALIGNMENT (RITUAL BRIDGE): The Crown Card listens to your Daily Rituals module. When you mark a ritual complete, the system automatically scans for keyword overlap between the ritual's title and the active virtue's name and command. If a match is detected — for example, completing a "Morning Exercise" ritual while Athleticism is the active virtue — the system automatically logs a Bright Spot alignment on your behalf and flashes a confirmation on the Crown Card.`
  },
  {
    id: 'franklin-config-archive',
    title: 'Virtue Configuration & The Franklin Archive',
    content: `VIRTUE CONFIGURATION

Access the configuration panel at /franklin (Franklin Initiative in the sidebar).

ADDING A VIRTUE: Scroll to the bottom of the virtue list and press Add Virtue. Enter a name (e.g., "Courage") and a command — the behavioral directive that defines what success looks like (e.g., "Act despite fear; do not delay the difficult thing"). Press Add. The new virtue is appended to the rotation cycle.

EDITING A VIRTUE: Press the pencil icon on any virtue row. The row expands inline. Modify the name and command and press the check mark to save. The change takes effect immediately, including on the currently active virtue if you are editing it.

DELETING A VIRTUE: Press the trash icon on any virtue row. The virtue is removed and the remaining virtues are re-numbered sequentially. The cycle length adjusts automatically — if you have 10 virtues, the cycle becomes 10 weeks.

THE CYCLE START DATE: Displayed at the bottom of the Cycle Status card. This is the Monday on which your current cycle began. It resets whenever you toggle the Initiative off and back on.

THE AUDIT WINDOW: Configure the hour and minute at which your day ends for tracking purposes. If you work a 14:00–22:00 shift, set the audit window to 23:00 or later to ensure your evening session data is captured before midnight rolls the date. This mirrors the Scribe's End of Day logic used elsewhere in Thoth's Notebook.

THE FRANKLIN ARCHIVE

Access the archive via the Archive tab on the Franklin Initiative page.

The Archive is the permanent record of all your Context Notes — every lapse and alignment you have ever logged, indexed by virtue and week.

FILTERING: Use the type filter chips (All Types / Lapses / Alignments) and the virtue filter chips to narrow the archive to specific categories. Notes are grouped by week, displayed in reverse chronological order.

READING THE ARCHIVE: Each time a virtue rotates back into the primary position, you should visit the archive and read the notes from every previous cycle. This is the learning loop Franklin intended — not perfection in a single pass, but incremental reduction of transgressions over years of practice.

DELETING NOTES: Hover over any note to reveal the delete button. Deletion is permanent. Use this only to remove duplicate or incorrectly logged entries — the value of the archive is in its completeness.

FIRESTORE COLLECTIONS: The Franklin module uses three Firestore collections: franklinSettings (one document per user, contains the virtue list and cycle configuration), franklinWeekRecords (one document per virtue per week, contains lapse and alignment counts), and franklinNotes (the permanent archive of all context notes, never auto-deleted).`
  },
];

export default function SebaytConsole({ onClose }: { onClose?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEntry, setActiveEntry] = useState(SEBAYT_ENTRIES[0]);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [blinkingId, setBlinkingId] = useState<string | null>(null);

  // Filter entries based on the search query
  const filteredEntries = SEBAYT_ENTRIES.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectEntry = (entry: typeof SEBAYT_ENTRIES[0]) => {
    setActiveEntry(entry);
    setBlinkingId(entry.id);
    setTimeout(() => {
      setBlinkingId(null);
      setMobileView('detail');
    }, 700);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-900 text-cyan-400 font-mono border-0 md:border-4 border-amber-600 md:rounded-lg shadow-[0_0_20px_rgba(217,119,6,0.4)] overflow-hidden">

      {/* ── SIDEBAR / SCROLL OF TOPICS ─────────────────────────── */}
      <div className={`
        w-full md:w-1/3 shrink-0
        border-b-2 md:border-b-0 md:border-r-2 border-amber-600
        bg-gray-950 flex flex-col
        ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="p-4 md:p-6 border-b-2 border-amber-600">
          {/* Title row with mobile close button */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-amber-500 uppercase tracking-widest drop-shadow-md">
              Sebayt Console
            </h1>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden text-cyan-600 hover:text-amber-500 transition-colors p-2 -mr-1"
                aria-label="Close Sebayt Console"
              >
                <X size={22} />
              </button>
            )}
          </div>
          <p className="text-xs text-cyan-600 mb-4 uppercase tracking-widest">
            Instructions of the Ptah Network
          </p>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              className="w-full bg-gray-900 border border-cyan-700 text-cyan-300 px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-cyan-800 text-sm"
              placeholder="Search the sacred texts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-3 text-cyan-700">
              ☥
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredEntries.length > 0 ? (
            <ul className="divide-y divide-cyan-900/30">
              {filteredEntries.map((entry) => (
                <li key={entry.id}>
                  <motion.button
                    onClick={() => handleSelectEntry(entry)}
                    animate={blinkingId === entry.id
                      ? { opacity: [1, 0.1, 1, 0.1, 1, 0.1, 1] }
                      : { opacity: 1 }
                    }
                    transition={{ duration: 0.65, ease: 'linear' }}
                    className={`w-full text-left px-5 py-4 hover:bg-cyan-900/20 active:bg-cyan-900/40 transition-colors uppercase text-sm tracking-wider min-h-[56px] ${
                      activeEntry.id === entry.id
                        ? 'bg-cyan-900/40 text-amber-400 border-l-4 border-amber-500'
                        : 'text-cyan-500'
                    }`}
                  >
                    {entry.title}
                  </motion.button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-cyan-700 text-sm">
              The archives yield no results for your query. The void of Nun returns nothing.
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT / READING PANE ────────────────────────── */}
      <div className={`
        w-full md:w-2/3 flex flex-col overflow-hidden bg-gray-900
        ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Mobile nav bar — back + close */}
        <div className="md:hidden shrink-0 flex items-center gap-2 px-3 py-3 border-b-2 border-amber-600 bg-gray-950">
          <button
            onClick={() => setMobileView('list')}
            className="flex items-center gap-1 text-cyan-500 hover:text-amber-400 active:text-amber-300 transition-colors py-1 pr-2"
            aria-label="Back to topics"
          >
            <ChevronLeft size={20} />
            <span className="text-xs uppercase tracking-wider">Topics</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto text-cyan-600 hover:text-amber-500 transition-colors p-1.5"
              aria-label="Close Sebayt Console"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-10 relative">
          {/* Desktop close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="hidden md:block absolute top-4 right-4 text-cyan-600 hover:text-amber-500 transition-colors p-2"
              aria-label="Close Sebayt Console"
            >
              <X size={28} />
            </button>
          )}

          {activeEntry ? (
            <div className="max-w-2xl mx-auto md:mt-4">
              {/* Eye of Horus / Aesthetic Header */}
              <div className="flex items-start gap-3 mb-6 border-b border-amber-600/50 pb-4">
                <span className="text-3xl md:text-4xl text-amber-500 shrink-0 leading-none mt-1">𓂀</span>
                <h2 className="text-xl md:text-3xl text-amber-400 font-bold uppercase tracking-widest leading-snug">
                  {activeEntry.title}
                </h2>
              </div>

              <div className="prose prose-invert prose-cyan max-w-none">
                {activeEntry.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-5 leading-relaxed text-cyan-100 text-base md:text-lg drop-shadow-md">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-cyan-800 flex-col">
              <span className="text-6xl mb-4">𓋹</span>
              <p className="uppercase tracking-widest">Awaiting your query, Initiate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
