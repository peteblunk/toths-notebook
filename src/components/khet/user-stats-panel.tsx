"use client";

import { useState, useEffect, useRef } from 'react';
import {
  X, User, Save, ChevronDown, ChevronUp,
  Activity, Shield, Dumbbell, Wine, Zap
} from 'lucide-react';
import { useKhet } from '@/hooks/use-khet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { KhetUserSettings, WeightUnit, DistanceUnit } from '@/lib/khet-types';
import { IstanbulDial } from '@/components/IstanbulDial';

// ─────────────────────────────────────────────────────────────
// Equipment options
// ─────────────────────────────────────────────────────────────
const EQUIPMENT_OPTIONS = [
  { id: 'BARBELL',    label: 'Barbell' },
  { id: 'DUMBBELL',  label: 'Dumbbell' },
  { id: 'CABLES',    label: 'Cables' },
  { id: 'KETTLEBELL',label: 'Kettlebell' },
  { id: 'BANDS',     label: 'Bands' },
  { id: 'BODYWEIGHT',label: 'Bodyweight Only' },
  { id: 'MACHINE',   label: 'Machines' },
  { id: 'POOL',      label: 'Pool / Swim' },
];

// ─────────────────────────────────────────────────────────────
// Collapsible section wrapper
// ─────────────────────────────────────────────────────────────
function ProfileSection({
  icon,
  title,
  color = 'amber',
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color?: 'amber' | 'cyan' | 'violet' | 'red';
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const colorMap = {
    amber:  { border: 'border-amber-800/40',  header: 'text-amber-300',  bg: 'bg-amber-950/10',  icon: 'text-amber-400' },
    cyan:   { border: 'border-cyan-800/40',   header: 'text-cyan-300',   bg: 'bg-cyan-950/10',   icon: 'text-cyan-400' },
    violet: { border: 'border-violet-800/40', header: 'text-violet-300', bg: 'bg-violet-950/10', icon: 'text-violet-400' },
    red:    { border: 'border-red-800/40',    header: 'text-red-300',    bg: 'bg-red-950/10',    icon: 'text-red-400' },
  };
  const c = colorMap[color];

  return (
    <div className={cn('rounded-xl border overflow-hidden', c.border)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('w-full flex items-center justify-between px-4 py-3 text-left transition-colors active:scale-[0.99]', c.bg)}
      >
        <div className="flex items-center gap-2">
          <span className={cn('w-4 h-4', c.icon)}>{icon}</span>
          <span className={cn('text-sm font-headline uppercase tracking-[0.2em]', c.header)}>{title}</span>
        </div>
        <span className="text-zinc-500">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4 border-t border-zinc-800/60">
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Field + input helpers
// ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">{label}</label>
      {children}
      {hint && <p className="text-sm text-zinc-400 leading-snug">{hint}</p>}
    </div>
  );
}

function NumericInput({
  value, onChange, placeholder, min = 0, step = 1,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; min?: number; step?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
interface UserStatsPanelProps {
  onClose: () => void;
}

export function UserStatsPanel({ onClose }: UserStatsPanelProps) {
  const { getUserSettings, updateUserSettings } = useKhet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Easter Egg: Torsion System ────────────────────────────
  const [torsionTaps, setTorsionTaps] = useState(0);
  const [showKeypad, setShowKeypad] = useState(false);
  const [torsionRevealed, setTorsionRevealed] = useState(false);
  const [torsionEnabledLocal, setTorsionEnabledLocal] = useState(false);

  useEffect(() => {
    const isEnabled = localStorage.getItem('khet-torsion-enabled') === 'true';
    setTorsionEnabledLocal(isEnabled);
  }, []);

  const handleTorsionTap = () => {
    const newTaps = torsionTaps + 1;
    setTorsionTaps(newTaps);
    if (newTaps >= 4) {
      setShowKeypad(true);
      setTorsionTaps(0);
    }
  };

  const handleTorsionUnlock = () => {
    setTorsionRevealed(true);
    setTimeout(() => {
        setShowKeypad(false);
    }, 2000);
  };

  const handleTorsionToggle = () => {
    const next = !torsionEnabledLocal;
    setTorsionEnabledLocal(next);
    localStorage.setItem('khet-torsion-enabled', next ? 'true' : 'false');
    window.dispatchEvent(new Event('storage'));
    if (next) {
        toast({ title: 'Torsion System Enabled', description: 'Access granted.' });
    } else {
        toast({ title: 'Torsion System Disabled', description: 'Systems powered down.' });
    }
  };

  // ── Preferences ───────────────────────────────────────────
  const [weightUnit, setWeightUnitLocal] = useState<WeightUnit>('lbs');
  const [distanceUnit, setDistanceUnitLocal] = useState<DistanceUnit>('miles');

  // ── Core stats ────────────────────────────────────────────
  const [bodyWeight, setBodyWeight] = useState('');
  const [maintenanceCalories, setMaintenanceCalories] = useState('');
  const [gymName, setGymName] = useState('');


  // ── Gym Specs / Tactical ──────────────────────────────────
  const [injuryLog, setInjuryLog] = useState('');
  const [equipmentAccess, setEquipmentAccess] = useState<string[]>([]);
  const [sobrietyStartDate, setSobrietyStartDate] = useState('');

  // ── localStorage draft persistence ────────────────────────
  const DRAFT_KEY = 'athlete-profile-draft';
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const draft = {
      weightUnit, distanceUnit,
      bodyWeight, maintenanceCalories, gymName,
      injuryLog, equipmentAccess, sobrietyStartDate,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    weightUnit, distanceUnit,
    bodyWeight, maintenanceCalories, gymName,
    injuryLog, equipmentAccess, sobrietyStartDate,
  ]);

  // ── Load from Firestore (fallback to localStorage draft) ──
  useEffect(() => {
    getUserSettings().then((s) => {
      const draft = (() => {
        try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}'); }
        catch { return {}; }
      })();

      if (s) {
        // Draft wins for units — preserves any unsaved toggle choice
        setWeightUnitLocal(  draft.weightUnit   ?? s.weightUnit   ?? 'lbs');
        setDistanceUnitLocal(draft.distanceUnit ?? s.distanceUnit ?? 'miles');
        setBodyWeight(           draft.bodyWeight            ?? (s.bodyWeight            ? String(s.bodyWeight)            : ''));
        setMaintenanceCalories(  draft.maintenanceCalories   ?? (s.maintenanceCalories   ? String(s.maintenanceCalories)   : ''));
        setGymName(              draft.gymName               ?? (s.gymName               ?? ''));
        setInjuryLog(            draft.injuryLog             ?? (s.injuryLog             ?? ''));
        setEquipmentAccess(      draft.equipmentAccess       ?? (s.equipmentAccess       ?? []));
        setSobrietyStartDate(    draft.sobrietyStartDate     ?? (s.sobrietyStartDate     ?? ''));
      }

      setLoading(false);
      hydratedRef.current = true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Unit toggle handlers (auto-save + convert values) ────
  const handleWeightUnitToggle = async (newUnit: WeightUnit) => {
    if (newUnit === weightUnit) return;

    const cvt = (str: string, multiplier: number) => {
      const v = parseFloat(str);
      if (isNaN(v) || v <= 0) return str;
      return String(Math.round(v * multiplier * 10) / 10);
    };

    setBodyWeight(newUnit === 'lbs' ? cvt(bodyWeight, 2.20462) : cvt(bodyWeight, 1 / 2.20462));
    setWeightUnitLocal(newUnit);
    // Immediately persist — unit choice is permanent, not part of Save
    await updateUserSettings({ weightUnit: newUnit });
  };

  const handleDistanceUnitToggle = async (newUnit: DistanceUnit) => {
    if (newUnit === distanceUnit) return;
    setDistanceUnitLocal(newUnit);
    await updateUserSettings({ distanceUnit: newUnit });
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    const num = (v: string) => { const n = parseFloat(v); return isNaN(n) || n <= 0 ? undefined : n; };
    const int = (v: string) => { const n = parseInt(v, 10); return isNaN(n) || n <= 0 ? undefined : n; };

    const data: Partial<KhetUserSettings> = {
      weightUnit,
      distanceUnit,
      bodyWeight:          num(bodyWeight),
      maintenanceCalories: int(maintenanceCalories),
      gymName:             gymName.trim() || undefined,
      injuryLog:           injuryLog.trim() || undefined,
      equipmentAccess:     equipmentAccess.length > 0 ? equipmentAccess : undefined,
      sobrietyStartDate:   sobrietyStartDate || undefined,
    };

    // Strip undefined keys — Firestore rejects them
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ) as Partial<KhetUserSettings>;

    await updateUserSettings(clean);
    localStorage.removeItem(DRAFT_KEY);
    setSaving(false);
    toast({ title: 'Profile Updated', description: 'Athlete profile saved successfully.' });
    onClose();
  };

  const toggleEquipment = (id: string) =>
    setEquipmentAccess((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Keypad Overlay */}
      {showKeypad && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-sm">
            <button onClick={() => setShowKeypad(false)} className="absolute -top-12 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400">
              <X className="w-4 h-4" />
            </button>
            <IstanbulDial 
              secretCode={[2, 11, 4, 6]} 
              onUnlock={handleTorsionUnlock}
              successTitle="Access Granted"
              successMessage="Torsion System online."
            />
          </div>
        </div>
      )}

      {/* Panel */}
      <div className="relative mt-auto w-full max-h-[92dvh] bg-[#060810] border-t border-zinc-800 rounded-t-2xl flex flex-col overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <User
                className="w-4 h-4 text-amber-500 cursor-pointer hover:text-amber-400 transition-colors"
                onClick={handleTorsionTap}
              />
              <h2 className="font-headline text-amber-300 text-base uppercase tracking-[0.2em]">
                Athlete Profile
              </h2>
            </div>
            <p className="text-sm text-zinc-400 mt-0.5">Body stats &amp; training preferences</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-400 active:scale-90 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-zinc-500 text-sm font-headline uppercase tracking-widest animate-pulse">
                Loading…
              </p>
            </div>
          ) : (
            <>
              {/* ── Units & Core Stats ────────────────────────── */}
              <ProfileSection icon={<Activity className="w-4 h-4" />} title="Units & Core Stats" color="amber" defaultOpen>
                <Field label="Weight Unit" hint="Sets the unit label for all strength workouts.">
                  <div className="flex rounded-lg overflow-hidden border border-zinc-800">
                    {(['lbs', 'kg'] as WeightUnit[]).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => handleWeightUnitToggle(unit)}
                        className={cn(
                          'flex-1 py-2.5 text-sm font-headline uppercase tracking-widest transition-all active:scale-[0.98]',
                          weightUnit === unit ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-300',
                        )}
                      >{unit}</button>
                    ))}
                  </div>
                </Field>

                <Field label="Distance Unit" hint="Used for pace and distance in cardio sessions.">
                  <div className="flex rounded-lg overflow-hidden border border-zinc-800">
                    {(['miles', 'km'] as DistanceUnit[]).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => handleDistanceUnitToggle(unit)}
                        className={cn(
                          'flex-1 py-2.5 text-sm font-headline uppercase tracking-widest transition-all active:scale-[0.98]',
                          distanceUnit === unit ? 'bg-cyan-600 text-black' : 'bg-zinc-900 text-zinc-300',
                        )}
                      >{unit}</button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={`Body Weight (${weightUnit})`}>
                    <NumericInput value={bodyWeight} onChange={setBodyWeight}
                      placeholder={weightUnit === 'lbs' ? 'e.g. 185' : 'e.g. 84'} step={0.5} />
                  </Field>
                  <Field label="Maint. Calories (kcal)">
                    <NumericInput value={maintenanceCalories} onChange={setMaintenanceCalories}
                      placeholder="e.g. 2800" step={50} />
                  </Field>
                </div>

                <Field label="Gym / Training Location">
                  <input
                    type="text"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    placeholder="e.g. Iron Temple, Home Gym…"
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </Field>
              </ProfileSection>





              {/* ── Gym Specs ─────────────────────────────────── */}
              <ProfileSection icon={<Dumbbell className="w-4 h-4" />} title="Gym Specs" color="amber">
                <Field label="Equipment Access">
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((eq) => {
                      const active = equipmentAccess.includes(eq.id);
                      return (
                        <button
                          key={eq.id}
                          onClick={() => toggleEquipment(eq.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border text-sm font-headline uppercase tracking-wider transition-all active:scale-[0.97]',
                            active
                              ? 'border-amber-500/70 bg-amber-950/30 text-amber-300'
                              : 'border-zinc-700 bg-zinc-900/40 text-zinc-400',
                          )}
                        >{eq.label}</button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Injury Log / Limitations">
                  <textarea
                    value={injuryLog}
                    onChange={(e) => setInjuryLog(e.target.value)}
                    placeholder="e.g. Lower back — avoid heavy deadlifts. Right shoulder impingement…"
                    rows={3}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
                  />
                </Field>
              </ProfileSection>

              {/* ── Sober Protocol ───────────────────────────── */}
              <ProfileSection icon={<Wine className="w-4 h-4" />} title="Sober Protocol" color="red">
                <Field
                  label="Sobriety Start Date"
                  hint="Tracks your streak length in Goals and the 75 Hard Protocol. Leave blank if not applicable."
                >
                  <input
                    type="date"
                    value={sobrietyStartDate}
                    onChange={(e) => setSobrietyStartDate(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </Field>
                {sobrietyStartDate && (() => {
                  const days = Math.floor((Date.now() - new Date(sobrietyStartDate).getTime()) / 86_400_000);
                  if (days < 0) return null;
                  return (
                    <div className="flex items-center gap-3 rounded-lg border border-red-900/40 bg-red-950/10 px-3 py-2.5">
                      <Shield className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-300 font-headline">
                        {days} day{days !== 1 ? 's' : ''} sober
                      </p>
                    </div>
                  );
                })()}
              </ProfileSection>

              {/* ── Torsion System (Hidden) ──────────────────── */}
              {torsionRevealed && (
                <ProfileSection icon={<Zap className="w-4 h-4" />} title="Torsion System" color="violet" defaultOpen>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-headline uppercase tracking-widest text-violet-300">Torsion Protocol</p>
                      <p className="text-sm text-zinc-300 mt-1">Enable advanced diagnostic routines</p>
                    </div>
                    <button
                      onClick={handleTorsionToggle}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative flex-shrink-0",
                        torsionEnabledLocal ? "bg-violet-600" : "bg-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                        torsionEnabledLocal ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </ProfileSection>
              )}

              {/* ── Save ─────────────────────────────────────── */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-amber-600/60 bg-amber-950/20 text-amber-300 text-sm font-headline uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
