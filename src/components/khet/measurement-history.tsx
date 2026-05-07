"use client";

import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import {
  Plus, X, AlertTriangle, Check, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Clock,
} from 'lucide-react';
import { useKhet } from '@/hooks/use-khet';
import { useToast } from '@/hooks/use-toast';
import { cn, localDateStr } from '@/lib/utils';
import type { MeasurementLog, MeasurementCategory, WeightUnit } from '@/lib/khet-types';
import {
  MEASUREMENT_LABELS, MEASUREMENT_CATEGORIES, getMeasurementUnit,
  MEASUREMENT_OUTLIER_THRESHOLDS,
} from '@/lib/khet-types';

// ─────────────────────────────────────────────────────────────
// Palette — one accent color per category
// ─────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<MeasurementCategory, string> = {
  WEIGHT:     '#f59e0b', // amber
  BODY_FAT:   '#ef4444', // red
  NECK:       '#06b6d4', // cyan
  WAIST:      '#a855f7', // violet
  HIPS:       '#ec4899', // pink
  RESTING_HR: '#22c55e', // green
  HEIGHT:     '#64748b', // slate
  CHEST:      '#f97316', // orange
  BICEP_L:    '#3b82f6', // blue
  BICEP_R:    '#60a5fa', // sky-blue
  THIGH_L:    '#14b8a6', // teal
  THIGH_R:    '#2dd4bf', // teal-lighter
  CALF:       '#a78bfa', // violet-light
};

const CATEGORY_BORDER: Record<MeasurementCategory, string> = {
  WEIGHT:     'border-amber-800/50',
  BODY_FAT:   'border-red-800/50',
  NECK:       'border-cyan-800/50',
  WAIST:      'border-violet-800/50',
  HIPS:       'border-pink-800/50',
  RESTING_HR: 'border-green-800/50',
  HEIGHT:     'border-slate-700/50',
  CHEST:      'border-orange-800/50',
  BICEP_L:    'border-blue-800/50',
  BICEP_R:    'border-sky-800/50',
  THIGH_L:    'border-teal-800/50',
  THIGH_R:    'border-teal-700/50',
  CALF:       'border-violet-700/50',
};

const CATEGORY_BG: Record<MeasurementCategory, string> = {
  WEIGHT:     'bg-amber-950/15',
  BODY_FAT:   'bg-red-950/15',
  NECK:       'bg-cyan-950/15',
  WAIST:      'bg-violet-950/15',
  HIPS:       'bg-pink-950/15',
  RESTING_HR: 'bg-green-950/15',
  HEIGHT:     'bg-slate-950/15',
  CHEST:      'bg-orange-950/15',
  BICEP_L:    'bg-blue-950/15',
  BICEP_R:    'bg-sky-950/15',
  THIGH_L:    'bg-teal-950/15',
  THIGH_R:    'bg-teal-900/10',
  CALF:       'bg-violet-900/10',
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function fmtVal(v: number, category: MeasurementCategory): string {
  if (category === 'BODY_FAT' || category === 'RESTING_HR') return v.toFixed(0);
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
}

function DeltaBadge({ delta, unit }: { delta: number | null; unit: string }) {
  if (delta === null) return <span className="text-sm text-zinc-500">—</span>;
  const abs = Math.abs(delta).toFixed(delta % 1 !== 0 ? 1 : 0);
  if (delta === 0) return (
    <span className="flex items-center gap-0.5 text-sm text-zinc-400">
      <Minus className="w-3 h-3" />no change
    </span>
  );
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-sm text-emerald-400">
      <TrendingUp className="w-3 h-3" />+{abs} {unit}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-sm text-red-400">
      <TrendingDown className="w-3 h-3" />{abs} {unit}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// MeasurementCard — shared component for both tabs
// ─────────────────────────────────────────────────────────────
interface MeasurementCardProps {
  category: MeasurementCategory;
  latest: MeasurementLog | null;
  previous: MeasurementLog | null;
  dayOneEntry: MeasurementLog | null;
  weightUnit: WeightUnit;
  /** Show an expand-to-chart affordance on Snapshot tab */
  onExpandChart?: () => void;
  /** Compact mode for the Snapshot tab 2-column grid */
  compact?: boolean;
}

export function MeasurementCard({
  category, latest, previous, dayOneEntry, weightUnit,
  onExpandChart, compact = false,
}: MeasurementCardProps) {
  const unit = getMeasurementUnit(category, weightUnit);
  const color = CATEGORY_COLORS[category];

  const delta = latest && previous && latest.id !== previous.id
    ? latest.value - previous.value
    : null;

  const totalChange = latest && dayOneEntry && latest.id !== dayOneEntry.id
    ? latest.value - dayOneEntry.value
    : null;

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5 space-y-1.5',
        CATEGORY_BORDER[category],
        CATEGORY_BG[category],
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm font-headline uppercase tracking-[0.2em]"
          style={{ color }}>{MEASUREMENT_LABELS[category]}</span>
        {onExpandChart && latest && (
          <button
            onClick={onExpandChart}
            className="w-5 h-5 rounded flex items-center justify-center text-zinc-600 active:scale-90 transition-all"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {latest ? (
        <>
          {/* Primary value */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-headline" style={{ color }}>
              {fmtVal(latest.value, category)}
            </span>
            <span className="text-sm text-zinc-400">{unit}</span>
          </div>

          {/* Deltas */}
          {!compact && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-zinc-400 uppercase tracking-wider">Since last</span>
                <DeltaBadge delta={delta} unit={unit} />
              </div>
              {totalChange !== null && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider">Since Day 1</span>
                  <DeltaBadge delta={totalChange} unit={unit} />
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {format(parseISO(latest.timestamp), 'MMM d, yyyy')}
          </p>
        </>
      ) : (
        <p className="text-sm text-zinc-400">No data yet</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MeasurementChart (recharts)
// ─────────────────────────────────────────────────────────────
function MeasurementChart({ logs, category, weightUnit }: {
  logs: MeasurementLog[];
  category: MeasurementCategory;
  weightUnit: WeightUnit;
}) {
  const unit = getMeasurementUnit(category, weightUnit);
  const color = CATEGORY_COLORS[category];

  // Sort ascending for graph
  const sorted = [...logs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const data = sorted.map((l) => ({
    date: format(parseISO(l.timestamp), 'M/d'),
    value: l.value,
    fullDate: l.timestamp,
  }));

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-20 text-sm text-zinc-400">
        Need at least 2 entries to draw a trend line.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { value, fullDate } = payload[0].payload;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs">
        <p className="text-zinc-400">{format(parseISO(fullDate), 'MMM d, yyyy')}</p>
        <p className="font-headline mt-0.5" style={{ color }}>
          {fmtVal(value, category)} {unit}
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: '#52525b' }}
          tickLine={false}
          axisLine={{ stroke: '#3f3f46' }}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#52525b' }}
          tickLine={false}
          axisLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Log Entry Row (in History list)
// ─────────────────────────────────────────────────────────────
function LogEntryRow({ log, category, weightUnit }: {
  log: MeasurementLog;
  category: MeasurementCategory;
  weightUnit: WeightUnit;
}) {
  const unit = getMeasurementUnit(category, weightUnit);
  const color = CATEGORY_COLORS[category];
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-sm text-zinc-300">{format(parseISO(log.timestamp), 'MMM d, yyyy')}</span>
        {log.notes && (
          <span className="text-xs text-zinc-400 italic truncate max-w-[120px]">{log.notes}</span>
        )}
      </div>
      <span className="text-sm font-headline" style={{ color }}>
        {fmtVal(log.value, category)} {unit}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Log Measurement Modal
// ─────────────────────────────────────────────────────────────
interface LogMeasurementModalProps {
  defaultCategory?: MeasurementCategory;
  weightUnit: WeightUnit;
  onSaved: () => void;
  onClose: () => void;
}

export function LogMeasurementModal({
  defaultCategory = 'WEIGHT',
  weightUnit,
  onSaved,
  onClose,
}: LogMeasurementModalProps) {
  const { logMeasurement, overwriteMeasurement } = useKhet();
  const { toast } = useToast();

  const [category, setCategory] = useState<MeasurementCategory>(defaultCategory);
  const [valueStr, setValueStr] = useState('');
  const [timestamp, setTimestamp] = useState(localDateStr());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Overwrite confirmation state
  const [overwritePending, setOverwritePending] = useState<{ id: string; existingValue?: number } | null>(null);
  // Outlier confirmation state
  const [outlierPending, setOutlierPending] = useState<{ value: number } | null>(null);

  const unit = getMeasurementUnit(category, weightUnit);
  const threshold = MEASUREMENT_OUTLIER_THRESHOLDS[category];

  // Reset form when category changes
  useEffect(() => { setValueStr(''); setOverwritePending(null); setOutlierPending(null); }, [category]);

  const handleSubmit = async () => {
    const v = parseFloat(valueStr);
    if (isNaN(v) || v <= 0) return;

    setSaving(true);
    try {
      const result = await logMeasurement({ timestamp, category, value: v, unit, notes: notes.trim() || undefined });

      if (result.wasOverwrite && result.existingId) {
        setOverwritePending({ id: result.existingId });
        setSaving(false);
        return;
      }

      toast({ title: 'Logged', description: `${MEASUREMENT_LABELS[category]}: ${fmtVal(v, category)} ${unit}` });
      onSaved();
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const v = parseFloat(valueStr);
    if (isNaN(v) || v <= 0) return;

    // Outlier check — only fires if no pending confirmation yet
    if (!outlierPending) {
      // We can't easily check the previous entry here without an extra fetch,
      // so we do a simple range sanity check: flag if value is clearly wrong for a human
      const sanityBounds: Record<MeasurementCategory, [number, number]> = {
        WEIGHT:     [30, 400],   // lbs or kg
        BODY_FAT:   [1, 65],     // %
        NECK:       [5, 80],     // in or cm
        WAIST:      [15, 200],
        HIPS:       [15, 200],
        RESTING_HR: [30, 200],
        HEIGHT:     [36, 300],
        CHEST:      [20, 200],
        BICEP_L:    [5, 60],
        BICEP_R:    [5, 60],
        THIGH_L:    [10, 100],
        THIGH_R:    [10, 100],
        CALF:       [5, 70],
      };
      const [lo, hi] = sanityBounds[category];
      if (v < lo || v > hi) {
        setOutlierPending({ value: v });
        return;
      }
    }

    await handleSubmit();
  };

  const handleConfirmOverwrite = async () => {
    if (!overwritePending) return;
    const v = parseFloat(valueStr);
    setSaving(true);
    try {
      await overwriteMeasurement(overwritePending.id, v, notes.trim() || undefined);
      toast({ title: 'Overwritten', description: `${MEASUREMENT_LABELS[category]} updated for ${format(parseISO(timestamp), 'MMM d, yyyy')}.` });
      onSaved();
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-20 bg-black/80 flex items-end">
      <div className="w-full bg-[#0c0e1a] border-t border-zinc-800 rounded-t-2xl p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-headline uppercase tracking-widest text-amber-300">
            Log Measurement
          </p>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 active:scale-90"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Overwrite confirmation */}
        {overwritePending && (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-300 font-headline uppercase tracking-wide">Entry Exists</p>
                <p className="text-sm text-zinc-300 mt-0.5">
                  A {MEASUREMENT_LABELS[category]} entry already exists for <strong>{format(parseISO(timestamp), 'MMM d, yyyy')}</strong>.
                  Overwrite it with <strong>{fmtVal(parseFloat(valueStr), category)} {unit}</strong>?
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirmOverwrite}
                disabled={saving}
                className="flex-1 py-2 rounded-lg border border-amber-600/50 bg-amber-950/20 text-amber-300 text-sm font-headline uppercase tracking-wider disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Overwrite'}
              </button>
              <button
                onClick={() => setOverwritePending(null)}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-headline uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Outlier confirmation */}
        {outlierPending && !overwritePending && (
          <div className="rounded-xl border border-red-700/50 bg-red-950/15 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-300 font-headline uppercase tracking-wide">Unusual Value</p>
                <p className="text-sm text-zinc-300 mt-0.5">
                  <strong>{fmtVal(outlierPending.value, category)} {unit}</strong> is outside the expected range for{' '}
                  {MEASUREMENT_LABELS[category]}. Are you sure?
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2 rounded-lg border border-red-700/50 bg-red-950/20 text-red-300 text-sm font-headline uppercase tracking-wider disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Yes, Log It'}
              </button>
              <button
                onClick={() => setOutlierPending(null)}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-headline uppercase tracking-wider"
              >
                Correct It
              </button>
            </div>
          </div>
        )}

        {/* Form — hidden while confirmations are showing */}
        {!overwritePending && !outlierPending && (
          <>
            {/* Category selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-headline uppercase tracking-[0.25em] text-zinc-300 block">Category</label>
              <div className="grid grid-cols-2 gap-1.5">
                {MEASUREMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'py-2 px-2 rounded-lg border text-sm font-headline uppercase tracking-wider text-left transition-all active:scale-[0.97]',
                      category === cat
                        ? 'text-black'
                        : 'border-zinc-700 bg-zinc-900/40 text-zinc-300',
                    )}
                    style={category === cat ? {
                      borderColor: CATEGORY_COLORS[cat],
                      background: CATEGORY_COLORS[cat] + '25',
                      color: CATEGORY_COLORS[cat],
                    } : {}}
                  >
                    {MEASUREMENT_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Value + unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-headline uppercase tracking-[0.25em] text-zinc-300 block">
                Value ({unit})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  placeholder="e.g. 185"
                  className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  autoFocus
                />
                <span className="flex items-center px-3 rounded-lg border border-zinc-700 bg-zinc-900/40 text-sm text-zinc-300 font-headline">
                  {unit}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-headline uppercase tracking-[0.25em] text-zinc-300 block">
                Date
                {timestamp !== localDateStr() && (
                  <span className="ml-2 text-xs text-amber-400 normal-case tracking-normal">retrospective entry</span>
                )}
              </label>
              <input
                type="date"
                value={timestamp}
                max={localDateStr()}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Notes (optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-headline uppercase tracking-[0.25em] text-zinc-300 block">
                Notes <span className="text-zinc-400 normal-case tracking-normal font-sans">optional</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Morning, fasted · post-vacation"
                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || !valueStr || parseFloat(valueStr) <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-amber-600/50 bg-amber-950/20 text-amber-300 text-sm font-headline uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Logging…' : 'Log Measurement'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Snapshot Tab
// ─────────────────────────────────────────────────────────────
interface SnapshotTabProps {
  latestMap: Partial<Record<MeasurementCategory, MeasurementLog>>;
  allLogs: MeasurementLog[];
  weightUnit: WeightUnit;
  onExpandChart: (category: MeasurementCategory) => void;
  onLogNew: (category: MeasurementCategory) => void;
}

function SnapshotTab({ latestMap, allLogs, weightUnit, onExpandChart, onLogNew }: SnapshotTabProps) {
  // Build prev and day-1 maps from allLogs
  const prevMap: Partial<Record<MeasurementCategory, MeasurementLog>> = {};
  const day1Map: Partial<Record<MeasurementCategory, MeasurementLog>> = {};

  for (const cat of MEASUREMENT_CATEGORIES) {
    const catLogs = allLogs
      .filter((l) => l.category === cat)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (catLogs.length >= 2) prevMap[cat] = catLogs[1];
    if (catLogs.length >= 1) day1Map[cat] = catLogs[catLogs.length - 1];
  }

  const hasAnyData = MEASUREMENT_CATEGORIES.some((c) => latestMap[c]);

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
        <p className="text-zinc-300 text-sm">No measurements logged yet.</p>
        <p className="text-zinc-400 text-sm">
          Tap <span className="text-amber-400">"Log Measurement"</span> to start tracking your body composition over time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400 font-headline uppercase tracking-widest">
        Current Stats — pulled from latest log entry
      </p>

      {/* ── Symmetry Alerts ──────────────────────────────── */}
      {(() => {
        const threshold = weightUnit === 'lbs' ? 0.5 : 1.27; // 0.5 in ≈ 1.27 cm
        const pairs: [MeasurementCategory, MeasurementCategory, string][] = [
          ['BICEP_L', 'BICEP_R', 'Bicep'],
          ['THIGH_L', 'THIGH_R', 'Thigh'],
        ];
        const alerts = pairs.filter(([l, r]) => {
          const lv = latestMap[l]?.value;
          const rv = latestMap[r]?.value;
          return lv != null && rv != null && Math.abs(lv - rv) > threshold;
        });
        if (alerts.length === 0) return null;
        return (
          <div className="space-y-2">
            {alerts.map(([l, r, name]) => {
              const lv = latestMap[l]!.value;
              const rv = latestMap[r]!.value;
              const diff = Math.abs(lv - rv).toFixed(1);
              const unit = getMeasurementUnit(l, weightUnit);
              return (
                <div key={name} className="flex items-start gap-2 rounded-lg border border-yellow-800/50 bg-yellow-950/15 px-3 py-2.5">
                  <span className="text-yellow-400 text-sm mt-0.5">⚠</span>
                  <div>
                    <p className="text-sm text-yellow-300 font-headline uppercase tracking-wider">
                      Symmetry Focus — {name}
                    </p>
                    <p className="text-sm text-zinc-400">
                      L/R discrepancy of {diff} {unit}. Consider prioritising weaker side.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      <div className="grid grid-cols-2 gap-2">
        {MEASUREMENT_CATEGORIES.map((cat) => (
          <MeasurementCard
            key={cat}
            category={cat}
            latest={latestMap[cat] ?? null}
            previous={prevMap[cat] ?? null}
            dayOneEntry={day1Map[cat] ?? null}
            weightUnit={weightUnit}
            onExpandChart={latestMap[cat] ? () => onExpandChart(cat) : undefined}
            compact={false}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// History & Trends Tab
// ─────────────────────────────────────────────────────────────
interface HistoryTabProps {
  allLogs: MeasurementLog[];
  weightUnit: WeightUnit;
  defaultCategory?: MeasurementCategory;
  onLogNew: (category?: MeasurementCategory) => void;
}

function HistoryTab({ allLogs, weightUnit, defaultCategory, onLogNew }: HistoryTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<MeasurementCategory>(
    defaultCategory ?? 'WEIGHT'
  );

  const categoryLogs = allLogs
    .filter((l) => l.category === selectedCategory)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // desc for list

  const color = CATEGORY_COLORS[selectedCategory];

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {MEASUREMENT_CATEGORIES.map((cat) => {
          const hasData = allLogs.some((l) => l.category === cat);
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-sm font-headline uppercase tracking-wider transition-all active:scale-[0.97]',
                selectedCategory === cat
                  ? 'text-black'
                  : 'border-zinc-700 text-zinc-300',
                !hasData && selectedCategory !== cat && 'opacity-50',
              )}
              style={selectedCategory === cat ? {
                borderColor: CATEGORY_COLORS[cat],
                background: CATEGORY_COLORS[cat],
                color: '#000',
              } : {}}
            >
              {MEASUREMENT_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className={cn('rounded-xl border p-3 space-y-2', CATEGORY_BORDER[selectedCategory], CATEGORY_BG[selectedCategory])}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-headline uppercase tracking-[0.2em]" style={{ color }}>
            {MEASUREMENT_LABELS[selectedCategory]} trend
          </p>
          <span className="text-xs text-zinc-400 uppercase tracking-wide">
            {categoryLogs.length} entr{categoryLogs.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>
        <MeasurementChart
          logs={categoryLogs}
          category={selectedCategory}
          weightUnit={weightUnit}
        />
      </div>

      {/* Log entry list (sorted desc) */}
      {categoryLogs.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-1">
          {categoryLogs.map((log) => (
            <LogEntryRow
              key={log.id}
              log={log}
              category={selectedCategory}
              weightUnit={weightUnit}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-24 gap-2 text-center">
          <p className="text-zinc-400 text-sm">No {MEASUREMENT_LABELS[selectedCategory]} entries yet.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Top-level AthleteStatsPanel — rendered as a tab inside GainzPanel
// ─────────────────────────────────────────────────────────────
interface AthleteStatsPanelProps {
  weightUnit: WeightUnit;
}

export function AthleteStatsPanel({ weightUnit }: AthleteStatsPanelProps) {
  const { getMeasurementLogs, getLatestMeasurements } = useKhet();

  const [subTab, setSubTab] = useState<'snapshot' | 'history'>('snapshot');
  const [allLogs, setAllLogs] = useState<MeasurementLog[]>([]);
  const [latestMap, setLatestMap] = useState<Partial<Record<MeasurementCategory, MeasurementLog>>>({});
  const [loading, setLoading] = useState(true);
  const [logModalCategory, setLogModalCategory] = useState<MeasurementCategory | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<MeasurementCategory | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    Promise.all([
      getMeasurementLogs({ limitCount: 500 }),
      getLatestMeasurements(),
    ]).then(([logs, latest]) => {
      setAllLogs(logs);
      setLatestMap(latest);
      setLoading(false);
    });
  }, [getMeasurementLogs, getLatestMeasurements]);

  useEffect(() => { reload(); }, [reload]);

  const handleExpandChart = (cat: MeasurementCategory) => {
    setExpandedCategory(cat);
    setSubTab('history');
  };

  return (
    <div className="space-y-4 relative">
      {/* Sub-tab switcher */}
      <div className="flex gap-2">
        {([
          { id: 'snapshot', label: 'Snapshot' },
          { id: 'history',  label: 'History & Trends' },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={cn(
              'flex-1 py-2 rounded-xl border text-xs font-headline uppercase tracking-wider transition-all active:scale-[0.98]',
              subTab === id
                ? 'border-amber-500/60 bg-amber-950/20 text-amber-300'
                : 'border-zinc-800 text-zinc-500',
            )}
          >{label}</button>
        ))}
      </div>

      {/* FAB — log measurement */}
      <button
        onClick={() => setLogModalCategory('WEIGHT')}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/40 text-zinc-300 text-xs font-headline uppercase tracking-wider active:scale-[0.98] transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Log Measurement
      </button>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-zinc-400 text-sm font-headline uppercase tracking-widest animate-pulse">
            Loading Chronicle…
          </p>
        </div>
      ) : subTab === 'snapshot' ? (
        <SnapshotTab
          latestMap={latestMap}
          allLogs={allLogs}
          weightUnit={weightUnit}
          onExpandChart={handleExpandChart}
          onLogNew={(cat) => setLogModalCategory(cat)}
        />
      ) : (
        <HistoryTab
          allLogs={allLogs}
          weightUnit={weightUnit}
          defaultCategory={expandedCategory ?? undefined}
          onLogNew={(cat) => setLogModalCategory(cat ?? 'WEIGHT')}
        />
      )}

      {/* Log modal overlay */}
      {logModalCategory && (
        <LogMeasurementModal
          defaultCategory={logModalCategory}
          weightUnit={weightUnit}
          onSaved={reload}
          onClose={() => setLogModalCategory(null)}
        />
      )}
    </div>
  );
}
