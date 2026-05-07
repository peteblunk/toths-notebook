"use client";

import { useState } from 'react';
import {
  Dumbbell,
  Wind,
  Droplets,
  BookOpen,
  Camera,
  Utensils,
  Flame,
  CheckCircle2,
  Circle,
  RotateCcw,
  ShieldOff,
  ChevronDown,
  ChevronUp,
  Zap,
  X,
  Skull,
  Shield,
  Wine,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { use75Hard, type HardMode75, type CustomObjective, type CustomObjectiveDefinition } from '@/hooks/use-75hard';

// ─────────────────────────────────────────────────────────────
// Individual checklist item
// ─────────────────────────────────────────────────────────────

interface CheckItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  done: boolean;
  onToggle: () => void;
}

function CheckItem({ icon, label, sublabel, done, onToggle }: CheckItemProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300 text-left active:scale-[0.98]',
        done
          ? 'border-emerald-500/70 bg-emerald-950/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
          : 'border-red-600/60 bg-red-950/10 shadow-[0_0_8px_rgba(220,38,38,0.15)]'
      )}
    >
      <span className={cn('flex-shrink-0 w-5 h-5', done ? 'text-emerald-400' : 'text-red-500')}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-headline uppercase tracking-widest', done ? 'text-emerald-300' : 'text-red-300')}>
          {label}
        </p>
        {sublabel && <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{sublabel}</p>}
      </div>
      <span className="flex-shrink-0">
        {done
          ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          : <Circle className="w-5 h-5 text-red-600/70" />}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Water Tracker
// ─────────────────────────────────────────────────────────────

const WATER_INCREMENTS = [8, 12, 24] as const;

function WaterTracker({ waterOz, onAdd, onReset }: { waterOz: number; onAdd: (oz: number) => void; onReset: () => void }) {
  const TARGET = 128;
  const pct = Math.min((waterOz / TARGET) * 100, 100);
  const reached = waterOz >= TARGET;

  return (
    <div className={cn(
      'rounded-lg border p-4 transition-all duration-300',
      reached
        ? 'border-emerald-500/70 bg-emerald-950/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
        : 'border-red-600/60 bg-red-950/10 shadow-[0_0_8px_rgba(220,38,38,0.15)]'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className={cn('w-4 h-4', reached ? 'text-emerald-400' : 'text-red-500')} />
          <div>
            <span className={cn('text-sm font-headline uppercase tracking-widest', reached ? 'text-emerald-300' : 'text-red-300')}>
              Nile Flow
            </span>
            <p className="text-xs text-zinc-400 leading-none mt-0.5">Plain water only</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-headline font-bold', reached ? 'text-emerald-300' : 'text-red-300')}>
            {waterOz} / {TARGET} fl oz
          </span>
          {waterOz > 0 && (
            <button onClick={onReset} className="text-zinc-500 transition-colors active:scale-90" title="Reset water">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mb-3 border border-zinc-800">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            reached
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
              : 'bg-gradient-to-r from-red-800 to-red-500 shadow-[0_0_6px_rgba(220,38,38,0.4)]'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2">
        {WATER_INCREMENTS.map((oz) => (
          <button
            key={oz}
            onClick={() => onAdd(oz)}
            className={cn(
              'flex-1 py-2 rounded-md border text-sm font-headline uppercase tracking-widest transition-all active:scale-95',
              reached
                ? 'border-emerald-700/50 text-emerald-400 bg-emerald-950/20'
                : 'border-red-700/50 text-red-300 bg-red-950/20'
            )}
          >
            +{oz} oz
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Day Progress Ring
// ─────────────────────────────────────────────────────────────

function DayRing({ value, total = 75 }: { value: number; total?: number }) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = Math.min(value / total, 1) * circ;
  return (
    <div className="relative flex items-center justify-center w-14 h-14 flex-shrink-0">
      <svg className="absolute inset-0" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={radius} strokeWidth="3" className="fill-none stroke-zinc-800" />
        <circle
          cx="28" cy="28" r={radius} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="fill-none stroke-red-500 transition-all duration-700"
          style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.7))' }}
        />
      </svg>
      <span className="relative z-10 text-xs font-headline font-bold text-red-400 leading-none">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mode selector tile
// ─────────────────────────────────────────────────────────────

interface ModeTileProps {
  mode: HardMode75;
  selected: boolean;
  onSelect: () => void;
}

function ModeTile({ mode, selected, onSelect }: ModeTileProps) {
  const isSuper = mode === 'super';
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex-1 flex flex-col items-center gap-2 px-3 py-4 rounded-lg border-2 transition-all duration-200 active:scale-[0.97]',
        selected
          ? isSuper
            ? 'border-red-500 bg-red-950/40 shadow-[0_0_16px_rgba(220,38,38,0.35)]'
            : 'border-amber-500 bg-amber-950/40 shadow-[0_0_16px_rgba(245,158,11,0.3)]'
          : 'border-zinc-700 bg-zinc-950/40'
      )}
    >
      {isSuper
        ? <Skull className={cn('w-5 h-5', selected ? 'text-red-400' : 'text-zinc-400')} />
        : <Shield className={cn('w-5 h-5', selected ? 'text-amber-400' : 'text-zinc-400')} />
      }
      <span className={cn('text-sm font-headline uppercase tracking-[0.2em]', selected ? isSuper ? 'text-red-300' : 'text-amber-300' : 'text-zinc-300')}>
        {isSuper ? 'Super Hard' : 'Easy Mode'}
      </span>
      <p className={cn('text-xs text-center leading-tight', selected ? isSuper ? 'text-red-400' : 'text-amber-500' : 'text-zinc-400')}>
        {isSuper ? 'Miss any element → full restart from Day 1' : 'Miss a day → subtract 1 from your total'}
      </p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Start Flow (rules + mode select + CTA)
// ─────────────────────────────────────────────────────────────

interface StartFlowProps {
  onClose: () => void;
  onStart: (mode: HardMode75, initialObjectives: CustomObjectiveDefinition[]) => void;
}

function StartFlow({ onClose, onStart }: StartFlowProps) {
  const [selectedMode, setSelectedMode] = useState<HardMode75>('super');
  const [objectives, setObjectives] = useState<CustomObjectiveDefinition[]>([]);
  const [newObjText, setNewObjText] = useState('');
  const [newObjCritical, setNewObjCritical] = useState(false);
  const [showObjForm, setShowObjForm] = useState(false);

  const handleAddObj = () => {
    if (!newObjText.trim()) return;
    setObjectives((prev) => [
      ...prev,
      { id: `obj-${Date.now()}`, label: newObjText.trim(), criticalFailure: newObjCritical },
    ]);
    setNewObjText('');
    setNewObjCritical(false);
    setShowObjForm(false);
  };

  return (
    <div className="rounded-xl border-2 border-red-700/60 bg-zinc-950 overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.15)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-red-900/40 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="font-headline text-red-300 text-sm uppercase tracking-[0.25em]">
              The 75 Hard Protocol
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 ml-6">75 days. No exceptions. No modifications.</p>
        </div>
        <button onClick={onClose} className="text-zinc-400 transition-colors mt-0.5 flex-shrink-0 active:scale-90">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Protocol rules */}
        <div className="border border-red-900/30 rounded-lg p-3 bg-black/30 space-y-1.5">
          {PROTOCOL_RULES.map((rule, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-red-500 flex-shrink-0 text-sm mt-0.5">▸</span>
              <span className="text-sm text-zinc-300">{rule}</span>
            </div>
          ))}
        </div>

        {/* Mode selection */}
        <div className="space-y-2">
          <p className="text-xs font-headline uppercase tracking-[0.3em] text-zinc-400 pl-0.5">Choose Your Mode</p>
          <div className="flex gap-2">
            <ModeTile mode="super" selected={selectedMode === 'super'} onSelect={() => setSelectedMode('super')} />
            <ModeTile mode="easy" selected={selectedMode === 'easy'} onSelect={() => setSelectedMode('easy')} />
          </div>
        </div>

        {/* Custom Objectives pre-commitment */}
        <div className="space-y-2">
          <p className="text-xs font-headline uppercase tracking-[0.3em] text-zinc-400 pl-0.5">Custom Objectives <span className="text-zinc-600 normal-case tracking-normal font-body">(optional)</span></p>
          {objectives.length > 0 && (
            <div className="space-y-1.5">
              {objectives.map((obj) => (
                <div key={obj.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900/50">
                  <Circle className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  <p className="flex-1 text-sm text-zinc-200 font-headline">{obj.label}</p>
                  {obj.criticalFailure && (
                    <span className="text-xs text-red-400 border border-red-900/40 rounded px-1.5 py-0.5">Critical</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {showObjForm ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 space-y-2.5">
              <input
                type="text"
                value={newObjText}
                onChange={(e) => setNewObjText(e.target.value)}
                placeholder="e.g. No Fap, Run a Mile…"
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddObj(); }}
                autoFocus
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newObjCritical}
                  onChange={(e) => setNewObjCritical(e.target.checked)}
                  className="accent-red-500 w-4 h-4"
                />
                <span className="text-sm text-zinc-300">Critical failure (miss = Day 1 reset)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleAddObj}
                  disabled={!newObjText.trim()}
                  className="flex-1 py-2 rounded-lg border border-red-700/60 bg-red-950/30 text-red-300 text-sm font-headline uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
                >Add</button>
                <button
                  onClick={() => { setShowObjForm(false); setNewObjText(''); setNewObjCritical(false); }}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all"
                >Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowObjForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-300 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Custom Objective
            </button>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => onStart(selectedMode, objectives)}
          className={cn(
            'w-full py-3 rounded-lg border-2 font-headline uppercase tracking-[0.3em] text-sm active:scale-[0.98] transition-all duration-200',
            selectedMode === 'super'
              ? 'border-red-600 bg-red-950/40 text-red-400 hover:bg-red-900/50 hover:text-red-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]'
              : 'border-amber-600 bg-amber-950/40 text-amber-400 hover:bg-amber-900/50 hover:text-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]'
          )}
        >
          <Flame className="inline w-4 h-4 mr-2 mb-0.5" />
          Enter 75 Hard Mode?
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Active tracking panel
// ─────────────────────────────────────────────────────────────

function ActivePanel() {
  const {
    data, todayLog, todayObjectives, effectiveDays, missedDays, dayNumber,
    stopProtocol, logItem, addWater, resetWater,
    addCustomObjective, toggleCustomObjective,
  } = use75Hard();

  const [confirmStop, setConfirmStop] = useState<'idle' | 'first' | 'final'>('idle');
  const [expanded, setExpanded] = useState(true);
  const [newObjectiveText, setNewObjectiveText] = useState('');
  const [newObjectiveCritical, setNewObjectiveCritical] = useState(false);
  const [showAddObjective, setShowAddObjective] = useState(false);

  const todayComplete = todayLog.complete;
  const mode = data?.mode ?? 'super';
  const isEasy = mode === 'easy';

  const handleAddObjective = async () => {
    if (!newObjectiveText.trim()) return;
    await addCustomObjective(newObjectiveText, newObjectiveCritical);
    setNewObjectiveText('');
    setNewObjectiveCritical(false);
    setShowAddObjective(false);
  };

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-500',
      todayComplete
        ? 'border-emerald-500/50 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
        : 'border-red-700/50 bg-red-950/10 shadow-[0_0_15px_rgba(220,38,38,0.08)]'
    )}>
      {/* Header / collapse toggle */}
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <DayRing value={effectiveDays} />
          <div className="text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <Flame className={cn('w-4 h-4', todayComplete ? 'text-emerald-400' : 'text-red-500')} />
              <span className={cn('font-headline text-sm uppercase tracking-[0.2em]', todayComplete ? 'text-emerald-300' : 'text-red-300')}>
                75 Hard — Day {dayNumber}
              </span>
              <span className={cn(
                'text-xs font-headline uppercase tracking-widest px-1.5 py-0.5 rounded border',
                isEasy
                  ? 'border-amber-700/50 text-amber-400 bg-amber-950/30'
                  : 'border-red-800/50 text-red-400 bg-red-950/30'
              )}>
                {isEasy ? 'Easy' : 'Super Hard'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {effectiveDays} / 75 days{isEasy && missedDays > 0 ? ` · ${missedDays} missed` : ''}
              {todayComplete ? ' · Today ✓' : ''}
            </p>
          </div>
        </div>
        <span className="text-zinc-600">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2.5">
          <CheckItem icon={<Dumbbell className="w-4 h-4" />} label="Indoor Workout" sublabel="45 min minimum"
            done={todayLog.indoorWorkout} onToggle={() => logItem('indoorWorkout', !todayLog.indoorWorkout)} />
          <CheckItem icon={<Wind className="w-4 h-4" />} label="Outdoor Workout" sublabel="45 min minimum"
            done={todayLog.outdoorWorkout} onToggle={() => logItem('outdoorWorkout', !todayLog.outdoorWorkout)} />
          <CheckItem icon={<BookOpen className="w-4 h-4" />} label="Read 10 Pages" sublabel="Non-fiction only · MUST be a physical book"
            done={todayLog.readPages} onToggle={() => logItem('readPages', !todayLog.readPages)} />
          <CheckItem icon={<Camera className="w-4 h-4" />} label="Progress Photo" sublabel="One per day"
            done={todayLog.pictureTaken} onToggle={() => logItem('pictureTaken', !todayLog.pictureTaken)} />
          <CheckItem icon={<Utensils className="w-4 h-4" />} label="No Cheat Meals" sublabel="Strict diet, no cheat meals"
            done={todayLog.noCheatMeals} onToggle={() => logItem('noCheatMeals', !todayLog.noCheatMeals)} />
          <CheckItem icon={<Wine className="w-4 h-4" />} label="Sober Protocol" sublabel="Zero alcohol · Zero substances"
            done={todayLog.soberProtocol ?? false} onToggle={() => logItem('soberProtocol', !(todayLog.soberProtocol ?? false))} />
          <WaterTracker waterOz={todayLog.waterOz} onAdd={addWater} onReset={resetWater} />

          {todayComplete && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-emerald-500/60 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-headline uppercase tracking-widest text-emerald-300">
                  Day {dayNumber} Sealed in Ma&apos;at
                </p>
                <p className="text-xs text-emerald-500 mt-0.5">All protocols complete. The scales are balanced.</p>
              </div>
            </div>
          )}

          {/* Custom Objectives */}
          {todayObjectives.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-headline uppercase tracking-[0.25em] text-zinc-400">Custom Objectives</p>
              {todayObjectives.map((obj: CustomObjective) => (
                <button
                  key={obj.id}
                  onClick={() => toggleCustomObjective(obj.id, !obj.completed)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all active:scale-[0.98] text-left',
                    obj.completed
                      ? 'border-emerald-500/70 bg-emerald-950/30'
                      : obj.criticalFailure
                        ? 'border-red-600/60 bg-red-950/10'
                        : 'border-zinc-700 bg-zinc-900/40',
                  )}
                >
                  {obj.completed
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    : <Circle className={cn('w-5 h-5 flex-shrink-0', obj.criticalFailure ? 'text-red-600/70' : 'text-zinc-600')} />}
                  <div className="flex-1">
                    <p className={cn('text-sm font-headline', obj.completed ? 'text-emerald-300' : 'text-zinc-200')}>{obj.label}</p>
                    {obj.criticalFailure && (
                      <p className="text-xs text-red-400 mt-0.5">Critical — miss triggers reset</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Add custom objective */}
          {showAddObjective ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 space-y-3">
              <p className="text-xs font-headline uppercase tracking-[0.25em] text-zinc-300">New Objective</p>
              <input
                type="text"
                value={newObjectiveText}
                onChange={(e) => setNewObjectiveText(e.target.value)}
                placeholder="e.g. No Fap, Run a Mile…"
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddObjective(); }}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newObjectiveCritical}
                  onChange={(e) => setNewObjectiveCritical(e.target.checked)}
                  className="accent-red-500 w-4 h-4"
                />
                <span className="text-sm text-zinc-300">Critical failure (miss = Day 1 reset)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleAddObjective}
                  disabled={!newObjectiveText.trim()}
                  className="flex-1 py-2 rounded-lg border border-red-700/60 bg-red-950/30 text-red-300 text-sm font-headline uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowAddObjective(false); setNewObjectiveText(''); setNewObjectiveCritical(false); }}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddObjective(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-zinc-700 text-zinc-300 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Custom Objective
            </button>
          )}

          <div className="pt-1">
            {confirmStop === 'idle' && (
              <button onClick={() => setConfirmStop('first')}
                className="flex items-center gap-1.5 text-zinc-400 text-sm font-headline uppercase tracking-widest transition-colors active:scale-[0.98]">
                <ShieldOff className="w-3 h-3" />
                End Protocol
              </button>
            )}
            {confirmStop === 'first' && (
              <div className="flex gap-2">
                <button onClick={() => setConfirmStop('final')}
                  className="flex-1 py-2 rounded-lg border border-red-700 bg-red-950/40 text-red-300 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all">
                  Abandon Protocol
                </button>
                <button onClick={() => setConfirmStop('idle')}
                  className="flex-1 py-2 rounded-lg border border-zinc-700 bg-zinc-950/40 text-zinc-300 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all">
                  Cancel
                </button>
              </div>
            )}
            {confirmStop === 'final' && (
              <div className="rounded-xl border-2 border-red-700 bg-red-950/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-headline uppercase tracking-widest text-red-300">Are you sure?</p>
                    <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
                      You are on <span className="text-red-300 font-bold">Day {dayNumber}</span>. That is {dayNumber} days of discipline you have built. This is a lifestyle change — not just a challenge. Walking away now means starting over from zero.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmStop('idle')}
                    className="flex-1 py-3 rounded-lg border-2 border-emerald-600 bg-emerald-950/30 text-emerald-300 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  >
                    Stick With It
                  </button>
                  <button
                    onClick={stopProtocol}
                    className="flex-1 py-3 rounded-lg border border-zinc-700 bg-zinc-950/40 text-zinc-400 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all"
                  >
                    I&apos;m a Quitter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export function Khet75Hard() {
  const { data, loading, startProtocol } = use75Hard();
  const [startFlowOpen, setStartFlowOpen] = useState(false);

  if (loading) {
    return <div className="h-10 rounded-lg border border-zinc-800 bg-zinc-950/30 animate-pulse" />;
  }

  // Active — show full tracking panel
  if (data?.active) {
    return <ActivePanel />;
  }

  // Inactive + start flow open — show rules/mode/confirm
  if (startFlowOpen) {
    return (
      <StartFlow
        onClose={() => setStartFlowOpen(false)}
        onStart={async (mode, initialObjectives) => {
          await startProtocol(mode, initialObjectives);
          setStartFlowOpen(false);
        }}
      />
    );
  }

  // Inactive + flow closed — compact button only
  return (
    <button
      onClick={() => setStartFlowOpen(true)}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-red-600/80 bg-red-950/20 hover:border-red-500 hover:bg-red-950/35 hover:shadow-[0_0_20px_rgba(220,38,38,0.35)] transition-all text-sm font-headline font-bold uppercase tracking-[0.25em] text-red-400 hover:text-red-300 active:scale-[0.98] shadow-[0_0_10px_rgba(220,38,38,0.15)]"
    >
      <Flame className="w-4 h-4" />
      75 Hard Protocol
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Protocol rules (static)
// ─────────────────────────────────────────────────────────────

const PROTOCOL_RULES = [
  'Two 45-min workouts per day — one must be outdoors',
  'Follow a strict diet — no cheat meals',
  'Zero alcohol · Zero substances — full sobriety required',
  'Drink 1 gallon (128 fl oz) of plain water every day',
  'Read 10 pages of a non-fiction physical book',
  'Take a daily progress photo',
  'Miss any element? (Super Hard) — restart from Day 1',
];
