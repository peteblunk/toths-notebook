"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useFranklin, getWeekKey } from "@/hooks/use-franklin";
import { VirtueConfig } from "@/components/franklin/virtue-config";
import { FranklinArchive } from "@/components/franklin/franklin-archive";
import { AuditGate } from "@/components/franklin/audit-gate";
import { StrategyViewer } from "@/components/franklin/strategy-viewer";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ToggleLeft,
  ToggleRight,
  Settings,
  Archive,
  Clock,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";

import { STRATEGY_BANK } from "@/lib/franklin/strategyBank";

type Tab = "config" | "archive" | "strategy";
type SetupStep = "splash" | "setup";

// ── Full Strategy Bank ─────────────────────────────────────────────────────

function FullStrategyBank() {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs font-headline uppercase tracking-[0.4em] text-zinc-400 pb-1">
        All Virtues — Strategy Reference
      </p>
      {STRATEGY_BANK.map((s) => {
        const isOpen = openId === s.virtueId;
        return (
          <div
            key={s.virtueId}
            className="rounded-lg border border-zinc-800 bg-zinc-950/50 overflow-hidden"
          >
            {/* Virtue header row */}
            <button
              onClick={() => setOpenId(isOpen ? null : s.virtueId)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-headline uppercase tracking-wider text-zinc-200">
                  {s.name}
                </p>
              </div>
              <span className={cn("text-xs text-cyan-400 flex-shrink-0 transition-transform", isOpen ? "rotate-180" : "")}>
                ▾
              </span>
            </button>

            {/* Expandable body */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="border-t border-zinc-800 px-4 py-4 space-y-4">
                {/* Technical Cues */}
                <div className="space-y-2">
                  <p className="text-[10px] font-headline uppercase tracking-[0.4em] text-zinc-500">
                    Technical Cues
                  </p>
                  <ul className="space-y-2">
                    {s.technicalCues.map((cue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-cyan-600 flex-shrink-0 mt-0.5 text-xs">›</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{cue}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Further Study */}
                {s.furtherStudy.length > 0 && (
                  <div className="border-t border-zinc-800 pt-3 space-y-2">
                    <p className="text-[10px] font-headline uppercase tracking-[0.4em] text-zinc-500">
                      Further Study
                    </p>
                    <ul className="space-y-1.5">
                      {s.furtherStudy.map((ref, i) => (
                        <li key={i}>
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(ref.query)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-cyan-500/80 hover:text-cyan-400 transition-colors"
                          >
                            <span className="text-[10px]">↗</span>
                            {ref.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Audit Window Setting ──────────────────────────────────────────────────────

function AuditWindowSetting() {
  const { settings, updateSettings } = useFranklin();
  const [hour, setHour] = useState(
    String(settings?.auditWindowHour ?? 22).padStart(2, "0")
  );
  const [minute, setMinute] = useState(
    String(settings?.auditWindowMinute ?? 0).padStart(2, "0")
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setHour(String(settings.auditWindowHour).padStart(2, "0"));
      setMinute(String(settings.auditWindowMinute).padStart(2, "0"));
    }
  }, [settings]);

  const handleSave = async () => {
    const h = Math.min(23, Math.max(0, parseInt(hour || "0", 10)));
    const m = Math.min(59, Math.max(0, parseInt(minute || "0", 10)));
    await updateSettings({ auditWindowHour: h, auditWindowMinute: m });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950/40 px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-zinc-400" />
        <p className="text-sm font-headline uppercase tracking-widest text-zinc-300">
          Evening Audit Window
        </p>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">
        The hour your day ends for virtue tracking. Adjust for non-standard work
        shifts — e.g. set to 23:00 for a 14:00–22:00 shift.
      </p>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="w-16 bg-black border-zinc-600 text-zinc-100 text-sm h-10 text-center"
        />
        <span className="text-zinc-400 font-headline text-lg">:</span>
        <Input
          type="number"
          min={0}
          max={59}
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className="w-16 bg-black border-zinc-600 text-zinc-100 text-sm h-10 text-center"
        />
        <span className="text-sm text-zinc-400">24-hr</span>
        <Button
          size="sm"
          onClick={handleSave}
          className="ml-auto h-10 px-5 text-sm font-headline uppercase tracking-wider bg-black border-2 border-zinc-500 text-zinc-200"
        >
          {saved ? "Saved ✓" : "Save"}
        </Button>
      </div>
    </div>
  );
}

// ── Cycle Status Card ─────────────────────────────────────────────────────────

function CycleStatus() {
  const { settings, currentVirtue, currentWeekNumber, weekRecord, notes } =
    useFranklin();
  if (!settings || !currentVirtue) return null;

  const lapseCount = weekRecord?.lapseCount ?? 0;
  const alignmentCount = weekRecord?.alignmentCount ?? 0;
  const totalVirtues = settings.virtues.length;

  // All-time notes for the current virtue, newest first
  const virtueNotes = notes.filter((n) => n.virtueId === currentVirtue.id);
  const visibleNotes = virtueNotes.slice(0, 6);

  return (
    <div className="rounded-xl border-2 border-cyan-500 bg-zinc-950 px-4 py-4 space-y-4 shadow-[0_0_28px_rgba(6,182,212,0.3),0_0_56px_rgba(6,182,212,0.1),inset_0_0_14px_rgba(6,182,212,0.05)]">
      {/* Header — virtue name + command */}
      <div>
        <p className="text-xs font-headline uppercase tracking-[0.4em] text-cyan-400/80 mb-0.5">
          Week {currentWeekNumber} of {totalVirtues}
        </p>
        <p className="text-xs font-headline uppercase tracking-[0.4em] text-cyan-400/60 mb-1">
          Current Virtue
        </p>
        <h2 className="text-2xl font-headline uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
          {currentVirtue.name}
        </h2>
        <p className="text-sm text-zinc-300 mt-1.5 leading-relaxed">
          {currentVirtue.command}
        </p>
      </div>

      {/* Strategy Bank ⓘ glyph */}
      <StrategyViewer virtueId={currentVirtue.id} virtueName={currentVirtue.name} />

      {/* This Week tally — directly below command */}
      <div className="border-t border-cyan-900/40 pt-3">
        <p className="text-xs font-headline uppercase tracking-[0.4em] text-cyan-400/80 mb-2">
          This Week
        </p>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-headline text-rose-400 tabular-nums leading-none">
              {lapseCount}
            </p>
            <p className="text-xs text-zinc-400 uppercase tracking-wider mt-0.5">
              Lapses
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-headline text-emerald-400 tabular-nums leading-none">
              {alignmentCount}
            </p>
            <p className="text-xs text-zinc-400 uppercase tracking-wider mt-0.5">
              Aligned
            </p>
          </div>
        </div>
      </div>

      {/* Lapse & Alignment notes for this virtue */}
      {visibleNotes.length > 0 && (
        <div className="border-t border-cyan-900/40 pt-3 space-y-2">
          <p className="text-xs font-headline uppercase tracking-[0.4em] text-zinc-200">
            Lapse &amp; Alignment
          </p>
          {visibleNotes.map((n) => (
            <div key={n.id} className="flex items-start gap-2">
              <span className={cn("mt-0.5 flex-shrink-0 text-[11px]", n.type === "lapse" ? "text-rose-500" : "text-emerald-400")}>
                {n.type === "lapse" ? "⬛" : "★"}
              </span>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-400 mr-1.5">{n.date}</span>
                <span className="text-xs text-zinc-300 leading-snug">{n.note}</span>
              </div>
            </div>
          ))}
          {virtueNotes.length > 6 && (
            <p className="text-[10px] font-headline uppercase tracking-widest text-cyan-500/60">
              +{virtueNotes.length - 6} more in Archive
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Splash Screen ─────────────────────────────────────────────────────────────

function SplashScreen({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-8 py-10 px-2">
      <p className="text-6xl leading-none">𓂀</p>

      <div className="space-y-3 max-w-md">
        <h2 className="text-2xl font-headline uppercase tracking-widest text-zinc-100">
          The Franklin Protocol
        </h2>
        <p className="text-base text-zinc-300 leading-relaxed">
          A virtue rotation system inspired by Benjamin Franklin's method of
          moral perfection. Rather than attempting all virtues simultaneously,
          one virtue is placed under focused observation each week — a single
          lens through which every action of the day is judged.
        </p>
        <p className="text-base text-zinc-300 leading-relaxed">
          Franklin maintained a small ledger. Each day he marked a black spot
          for every transgression. Over time, the marks thinned. The goal was
          not perfection in a single pass, but incremental reduction across
          years of practice.
        </p>
        <p className="text-base text-zinc-300 leading-relaxed">
          This system digitizes that ledger. Your lapses and alignments are
          permanently archived — so that each time a virtue returns, you have
          the record of every previous cycle to learn from.
        </p>
      </div>

      <Button
        onClick={onConfigure}
        className="h-auto min-h-14 py-3 px-6 text-base font-headline uppercase tracking-[0.3em] border-2 border-zinc-300 text-zinc-100 bg-black w-full max-w-xs flex items-center justify-center gap-2 whitespace-normal text-center leading-snug"
      >
        <span>Configure Virtues</span>
      </Button>
    </div>
  );
}

// ── Setup Screen ──────────────────────────────────────────────────────────────

function SetupScreen({
  onBack,
  onBegin,
  activating,
}: {
  onBack: () => void;
  onBegin: () => void;
  activating: boolean;
}) {
  const { settings } = useFranklin();
  const virtueCount = settings?.virtues.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-400 font-headline uppercase tracking-wider"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      {/* Setup header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-headline uppercase tracking-widest text-zinc-100">
          Configure Your Virtues
        </h2>
        <p className="text-base text-zinc-300 leading-relaxed">
          You may have as many or as few virtues as you like. The cycle rotates
          through all of them — one virtue per week — then repeats.
        </p>
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-3">
          <p className="text-sm text-zinc-200 leading-relaxed">
            <span className="text-zinc-100 font-headline">13 virtues</span> is
            the original Franklin configuration and provides an even quarterly
            rhythm — one complete pass through all virtues every{" "}
            <span className="text-zinc-100 font-headline">91 days</span>, four
            full cycles per year. Each time a virtue returns, you bring the
            lessons of every previous cycle with you.
          </p>
        </div>
      </div>

      {/* Virtue list */}
      <VirtueConfig />

      {/* Begin button — gated: needs at least one virtue */}
      <div className="pt-2 pb-8 space-y-3">
        {virtueCount === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Add at least one virtue to begin.
          </p>
        ) : (
          <p className="text-center text-sm text-zinc-400">
            {virtueCount} virtue{virtueCount !== 1 ? "s" : ""} configured —
            {virtueCount === 13
              ? " quarterly rhythm achieved."
              : ` ${Math.round(365 / virtueCount)}-day cycle.`}
          </p>
        )}
        <Button
          onClick={onBegin}
          disabled={activating || virtueCount === 0}
          className="w-full h-14 text-base font-headline uppercase tracking-[0.3em] border-2 border-zinc-300 text-zinc-100 bg-black disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {activating ? "Initializing…" : "Begin the Initiative"}
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FranklinPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { settings, loading, toggleFranklinMode, updateSettings, auditPending, forceAudit } =
    useFranklin();
  const [tab, setTab] = useState<Tab>("archive");
  const [toggling, setToggling] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("splash");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || loading || !user) return null;

  const franklinActive = settings?.franklinActive ?? false;

  const handleBegin = async () => {
    setToggling(true);
    try {
      await toggleFranklinMode();
      await updateSettings({ cycleStartDate: getWeekKey() });
    } finally {
      setToggling(false);
    }
  };

  const handleDeactivate = async () => {
    setToggling(true);
    try {
      await toggleFranklinMode();
      setSetupStep("splash");
    } finally {
      setToggling(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar activeCategory="" setActiveCategory={() => {}} />
      </Sidebar>
      <SidebarInset className="flex flex-col flex-1 bg-background min-h-screen overflow-y-auto">
        <main className="flex-1">
          <div className="max-w-xl mx-auto px-4 md:px-6 py-6 space-y-6">
            {/* Top nav */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-zinc-400" />
              <Link
                href="/"
                className="flex flex-col items-center justify-center p-0.5 rounded-2xl border-2 border-cyan-400 bg-cyan-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] min-w-[70px]"
                title="Main Hall"
              >
                <FirstPylonIcon size={48} className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-cyan-300 mt-[-4px] mb-1">
                  Main Hall
                </span>
              </Link>
            </div>

            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-headline uppercase tracking-[0.4em] text-zinc-400 mb-1">
                  Character Architecture
                </p>
                <h1 className="text-2xl font-headline uppercase tracking-widest text-zinc-100">
                  Franklin Initiative
                </h1>
              </div>

              {/* Active/inactive toggle — only show when already active */}
              {franklinActive && (
                <button
                  onClick={handleDeactivate}
                  disabled={toggling}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-emerald-700 text-emerald-400 text-sm font-headline uppercase tracking-wider flex-shrink-0"
                >
                  <ToggleRight className="w-4 h-4" />
                  Active
                </button>
              )}
            </div>

            {/* ── ACTIVE STATE ── */}
            {franklinActive ? (
              <div className="space-y-5">
                {/* Audit Gate — shown first when a review is pending */}
                {auditPending && <AuditGate />}

                <CycleStatus />

                {/* Tab bar */}
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { id: "config" as Tab, label: "Virtue Config", icon: Settings },
                      { id: "archive" as Tab, label: "Archive", icon: Archive },
                      { id: "strategy" as Tab, label: "Strategy Bank", icon: BookOpen },
                    ] as const
                  ).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={cn(
                        "flex items-center gap-2 text-sm font-headline uppercase tracking-wider px-4 py-2.5 rounded border-2 transition-colors",
                        tab === id
                          ? "border-zinc-500 text-zinc-100 bg-zinc-900"
                          : "border-zinc-700 text-zinc-400"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {tab === "config" && (
                  <div className="space-y-4">
                    <AuditWindowSetting />
                    {/* Force mid-cycle audit */}
                    {!auditPending && (
                      <div className="rounded-lg border border-zinc-700 bg-zinc-950/40 px-4 py-4 space-y-3">
                        <div>
                          <p className="text-sm font-headline uppercase tracking-widest text-zinc-300">
                            Mid-Cycle Review
                          </p>
                          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                            Force a voluntary reflection on the current week’s virtue before the natural cycle ends. Useful for course-correcting mid-week.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={forceAudit}
                          className="h-10 px-5 text-sm font-headline uppercase tracking-wider bg-black border-2 border-amber-600 text-amber-300"
                        >
                          Open Weekly Audit
                        </Button>
                      </div>
                    )}
                    <VirtueConfig />
                  </div>
                )}
                {tab === "archive" && <FranklinArchive />}
                {tab === "strategy" && <FullStrategyBank />}
              </div>
            ) : (
              // ── INACTIVE / SETUP FLOW ──
              <div>
                {setupStep === "splash" && (
                  <SplashScreen
                    onConfigure={() => setSetupStep("setup")}
                  />
                )}
                {setupStep === "setup" && (
                  <SetupScreen
                    onBack={() => setSetupStep("splash")}
                    onBegin={handleBegin}
                    activating={toggling}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
