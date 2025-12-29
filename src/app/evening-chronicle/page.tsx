"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Star, Wind, Scroll, History, Cpu } from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { KhepriIconMotion } from "@/components/khepri-animation";

// --- CUSTOM CYBER ANKH COMPONENT ---
const CyberAnkh = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a4 4 0 0 1 4 4c0 2.21-1.79 4-4 4s-4-1.79-4-4a4 4 0 0 1 4-4z" />
    <path d="M12 10v12" />
    <path d="M5 14h14" />
  </svg>
);

interface Task {
  id: string;
  title: string;
  status: string;
  completed: boolean;
  category?: string;
}

export default function EveningChroniclePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [isScarabGold, setIsScarabGold] = useState(false);

  // Data State
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [incompleteRituals, setIncompleteRituals] = useState<Task[]>([]); // New: Retained Nun

  // Form State
  const [wins, setWins] = useState("");
  const [shadowWork, setShadowWork] = useState("");
  const [tomorrowQuest, setTomorrowQuest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth & Data Fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      // Fetch ALL tasks to sort them
      const q = query(
        collection(db, "tasks"),
        where("userId", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

      // 1. MA'AT CREATED: Completed items
      setCompletedTasks(allTasks.filter(t => t.completed));

      // 2. RETAINED NUN: Incomplete Daily Rituals
      setIncompleteRituals(allTasks.filter(t =>
        !t.completed && (t.category === "Daily Ritual" || t.category === "Daily Rituals")
      ));
    });

    return () => unsubscribe();
  }, [router]);

  // --- THE SMART SEAL & BANISH LOGIC ---
const handleSealChronicle = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;
  setIsSubmitting(true);

  try {
    const batch = writeBatch(db);

    // 1. CREATE THE ARCHIVE RECORD
    const chronicleRef = doc(collection(db, "chronicles"));
    batch.set(chronicleRef, {
      userId: user.uid,
      createdAt: serverTimestamp(),
      date: new Date().toLocaleDateString(),
      victoriesLog: completedTasks.map(t => t.title),
      retainedNunLog: incompleteRituals.map(t => t.title),
      winsNote: wins,
      shadowWorkNote: shadowWork,
      tomorrowQuest: tomorrowQuest,
      type: "evening-seal"
    });

    // 2. THE CLEANSING
    completedTasks.forEach((task) => {
      batch.delete(doc(db, "tasks", task.id));
    });
    incompleteRituals.forEach((task) => {
      batch.delete(doc(db, "tasks", task.id));
    });

    // 3. THE COMMIT
    await batch.commit();

    // 4. THE GATEWAY: Proceed to the Archives
    // We use a slight delay so the user sees the "Sealing..." pulse
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/archives"); 
    }, 1200);

  } catch (error) {
    console.error("The Seal was compromised:", error);
    setIsSubmitting(false);
  }
};

  const handleOpenArchives = () => {
    router.push("/archives");
  }

  const handleScarabClick = () => {
    setIsScarabGold(true);
    setTimeout(() => {
      setStep(2);
      // Reset gold state after transition for subsequent uses, if any
      // setTimeout(() => setIsScarabGold(false), 500); 
    }, 2000);
  };

  // --- STEP 1: THE THRESHOLD ---
  if (step === 1) {
    return (


      <main className="relative h-[100dvh] w-full flex flex-col items-center justify-between bg-black p-6 text-center overflow-y-auto">
        {/* 3. ESCAPE HATCH: Back to Main Hall */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-8 left-8 flex items-center gap-3 text-zinc-100 hover:text-red-500 transition-colors group"
        >
          <div className="p-2 border border-zinc-400 rounded-lg group-hover:border-red-500/50">
            <History size={15} className="text-zinc-200 hover:text-red-500" />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] font-headline font-bold">Return to Main Hall</span>
        </button>

        {/* 2. RITUAL VERBIAGE: Moved to Top */}
        <div className="pt-20 max-w-xs text-center mb-12 space-y-4 animate-in fade-in duration-1000">
          <h2 className="text-cyan-400/80 text-[24px] tracking-[0.4em] uppercase font-bold font-headline">
            The Evening Chronicle
          </h2>
        </div>

        {/* 1. THE SCARAB: Unobstructed & Clean */}
        <div className="flex flex-col gap-0 text-[hsl(280,100%,60%)] text-xl text-center font-body">
          <span> Review your Ma'at. </span>
          <span> Reflect on your actions.</span>
          <span> Imagine tomorrow.</span>
          <span> Seal the record.  </span><br />
          <span>     </span>
        </div>
        <div
          className="relative w-72 h-72 flex flex-col items-center justify-center cursor-pointer group"
          onClick={handleScarabClick}
        >
          <KhepriIconMotion
            className="w-full h-full"
            forceGold={isScarabGold}
          />

          {/* ACTIVATE TEXT: Moved below the scarab */}
          {!isScarabGold && (
            <div className="absolute bottom-0 animate-pulse">
              <p className="text-cyan-400 text-[16px] text-bold font-headline uppercase tracking-[0.6em] group-hover:text-cyan-400 transition-all">
                Initiate Khepri Protocol
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // --- STEP 2: MA'AT CREATED / NUN RETAINED / ABSOLUTION / HUMBLE OFFERING ---

  if (step === 2) {
    return (
      <main className="relative min-h-[100dvh] w-full flex flex-col items-center bg-black p-6 text-center overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-500">

        {/* 🏛️ NAVIGATION GATES: High-Visibility Lotus Edition */}
        <div className="w-full flex justify-between items-start mb-8 flex-none px-2">

          {/* Left: Back / Reset (Lime Green) */}

          {/* 🏛️ THE UNIFIED BACK TO KHEPRI PROTOCOL ANIMATION */}
          <button
            onClick={() => setStep(1)}
            className="flex flex-col items-center group"
          >
            {/* The Single Encircled Container */}
            <div className="flex items-center gap-3 p-2 px-4 border-2 border-lime-500 rounded-xl bg-lime-500/10 shadow-[0_0_15px_rgba(132,204,22,0.3)] transition-all">

              {/* The Icon */}
              <History size={16} className="text-lime-500" />

              {/* The Text (Now inside the outline) */}
              <span className="text-xs uppercase tracking-[0.2em] font-headline font-bold text-lime-500/80">
                BACK
              </span>

            </div>
          </button>

          {/* 🏛️ THE UNIFIED MAIN HALL GATE */}
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center group"
          >
            {/* The Single Encircled Container */}
            <div className="flex items-center gap-3 p-2 px-4 border-2 border-[hsl(280,100%,60%)] rounded-xl bg-[hsl(280,100%,60%)]/10 shadow-[0_0_15px_rgba(185,21,204,0.3)] transition-all">

              {/* The Icon */}
              <Scroll className="w-4 h-4 text-[hsl(280,100%,60%)]" />

              {/* The Text (Now inside the outline) */}
              <span className="text-xs uppercase tracking-[0.2em] font-headline font-bold text-[hsl(280,100%,60%)]">
                Main Hall
              </span>

            </div>
          </button>
        </div>

        {/* HEADER: Ma'at Created */}
        <h2 className="text-3xl md:text-5xl font-headline font-bold text-amber-400 tracking-widest uppercase mb-8 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
          Ma&apos;at Created
        </h2>

        {/* THE GOLDEN LIST: Completed Tasks */}
        <div className="w-full max-w-md space-y-3 mb-12">
          {completedTasks.length > 0 ? (
            completedTasks.map((task, index) => (
              <div
                key={task.id}
                className="bg-amber-950/10 border border-amber-500/30 p-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-2 bg-amber-500/10 rounded-full border border-amber-500/20 flex-none">
                  <CyberAnkh className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
                </div>
                <span className="text-md font-headline text-amber-100 tracking-wide text-left leading-tight">
                  {task.title}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-amber-500/50 italic p-6 border border-amber-900/30 rounded-lg font-serif">
              No deeds recorded in the ledger today.
            </div>
          )}
        </div>

        {/* RETAINED NUN: Incomplete Rituals */}
        {incompleteRituals.length > 0 && (
          <div className="w-full max-w-md mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <h3 className="text-xl font-headline text-cyan-400 tracking-widest uppercase mb-6 border-b border-cyan-500/30 pb-2">
              Retained Nun
            </h3>
            <div className="space-y-3">
              {incompleteRituals.map((task) => (
                <div key={task.id} className="bg-slate-900/50 border border-cyan-500/20 p-3 rounded-xl flex items-center gap-3 opacity-80">
                  <div className="w-2 h-2 rounded-full bg-cyan-500/50 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                  <span className="text-md font-headline text-cyan-200/70 tracking-wide text-left">{task.title}</span>
                </div>
              ))}
            </div>
            {/* Absolution Verbiage */}
            <div className="mt-8 p-6 bg-cyan-950/20 border border-cyan-500/10 rounded-2xl text-sm text-cyan-300/80 font-sans italic leading-relaxed">
              "Do not be guilted. You have tomorrow. Show up for yourself and take action. Reduce the scope until you cannot fail."
            </div>
          </div>
        )}

        {/* THE REFINED ATTESTATION BUTTON */}
        <div className="w-full max-w-xl pb-16 px-4">
          <div className="relative group">

            {/* THE CRACKLE: Consolidated Spinning Border */}
            <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-100 animate-spin-slow blur-sm transition-opacity group-hover:via-cyan-400 group-hover:opacity-100" />

            <Button
              onClick={() => setStep(3)}
              variant="ghost"
              className="relative w-full h-auto py-10 px-6 bg-slate-950 border border-cyan-500/40 rounded-xl font-headline text-xl text-cyan-100 uppercase tracking-widest leading-relaxed whitespace-normal transition-all duration-700 hover:shadow-[0_0_40px_rgba(34,211,238,0.3)]"
            >
              <span className="relative z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                I Attest to and Humbly<br />Offer These Deeds
              </span>
            </Button>

          </div>
        </div>
      </main>
    );
  }


  // --- STEP 3: THE BREATH ---
  if (step === 3) {
    return (

      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-1000 border-4 border-cyan-500/10 m-2 rounded-3xl">
 {/* 🏛️ NAVIGATION GATES: High-Visibility Lotus Edition */}
        <div className="w-full flex justify-between items-start mb-8 flex-none px-2">

          {/* Left: Back / Reset (Lime Green) */}

          {/* 🏛️ THE UNIFIED BACK TO KHEPRI PROTOCOL ANIMATION */}
          <button
            onClick={() => setStep(2)}
            className="flex flex-col items-center group"
          >
            {/* The Single Encircled Container */}
            <div className="flex items-center gap-3 p-2 px-4 border-2 border-lime-500 rounded-xl bg-lime-500/10 shadow-[0_0_15px_rgba(132,204,22,0.3)] transition-all">

              {/* The Icon */}
              <History size={16} className="text-lime-500" />

              {/* The Text (Now inside the outline) */}
              <span className="text-xs uppercase tracking-[0.2em] font-headline font-bold text-lime-500/80">
                BACK
              </span>

            </div>
          </button>

          {/* 🏛️ THE UNIFIED MAIN HALL GATE */}
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center group"
          >
            {/* The Single Encircled Container */}
            <div className="flex items-center gap-3 p-2 px-4 border-2 border-[hsl(280,100%,60%)] rounded-xl bg-[hsl(280,100%,60%)]/10 shadow-[0_0_15px_rgba(185,21,204,0.3)] transition-all">

              {/* The Icon */}
              <Scroll className="w-4 h-4 text-[hsl(280,100%,60%)]" />

              {/* The Text (Now inside the outline) */}
              <span className="text-xs uppercase tracking-[0.2em] font-headline font-bold text-[hsl(280,100%,60%)]">
                Main Hall
              </span>

            </div>
          </button>
        </div>

        <div className="mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
          <Wind className="w-16 h-16 text-cyan-400" strokeWidth={1.5} />
        </div>

        <h2 className="text-2xl md:text-4xl font-headline font-bold text-cyan-400 tracking-widest uppercase mb-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] leading-tight max-w-md">
          You churned chaos<br />into order.
        </h2>

        <Card className="bg-slate-900/40 border border-cyan-500/30 max-w-md mb-12 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.05)]">
          <CardContent className="p-6">
            <p className="text-lg md:text-xl text-cyan-100/90 leading-relaxed font-headline tracking-wide">
              "Take 8 breaths. Celebrate and give thanks in a way that honors yourself and those that assisted you. Stretch and pray."
            </p>
          </CardContent>
        </Card>

        {/* Sparkling Button Again */}
        <div className="relative group w-full max-w-md">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
          <Button
            onClick={() => setStep(4)}
            variant="ghost"
            className="relative w-full py-6 text-center font-headline text-xl text-cyan-400 tracking-widest uppercase border border-cyan-500/40 hover:border-cyan-300 hover:bg-cyan-950/30 hover:text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all rounded-lg"
          >
            I have given thanks
          </Button>
        </div>
      </div>

    );
  }


if (step === 4) {
  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-200 font-sans animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-32">

      {/* 1. Header: Focused Ritual Title */}
      <div className="w-full max-w-4xl mx-auto mb-8 flex items-center justify-between px-4 pt-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-950/30 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Scroll className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-cyan-400 tracking-wider drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                Evening Chronicle
            </h1>
            <p className="text-cyan-300/60 text-sm font-headline tracking-widest mt-1">Seal the record. Clear the slate.</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto space-y-6 px-2 md:px-4">
        <form onSubmit={handleSealChronicle}>

          {/* 2. THE MA'AT RECORD: Summary of the day's deeds */}
          <div className="bg-black/40 border border-cyan-500/30 rounded-xl overflow-hidden mb-8 shadow-[0_0_15px_rgba(34,211,238,0.05)]">
            <div className="bg-cyan-950/20 p-3 border-b border-cyan-500/20 flex items-center gap-3">
              <Scroll className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-[0.2em] font-headline">The Ma'at Record</h3>
            </div>
            <div className="p-4 max-h-40 overflow-y-auto space-y-3 custom-scrollbar">
              {completedTasks.length > 0 ? completedTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 text-cyan-100/90 text-sm border-b border-cyan-500/10 pb-2 last:border-0 last:pb-0 font-headline tracking-wide">
                  <CyberAnkh className="w-4 h-4 text-cyan-500 drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]" />
                  <span className="truncate">{t.title}</span>
                </div>
              )) : <p className="text-cyan-500/50 italic text-sm text-center py-2 font-headline">No deeds recorded today.</p>}
            </div>
          </div>

          {/* 3. RESTORED: ACHIEVEMENTS & GRATITUDE */}
          <Card className="bg-black/40 border-cyan-500/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="py-4 px-6">
              <CardTitle className="text-cyan-400 font-headline tracking-widest flex items-center gap-3 text-base">
                <Star className="w-5 h-5 text-cyan-400" />
                Achievements & Gratitude
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="... what did you learn? who did you help? who helped you?"
                className="bg-black border-slate-800 text-cyan-100 placeholder:text-cyan-500/50 font-headline tracking-wide min-h-[100px] text-base focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
            </CardContent>
          </Card>

          {/* 4. RESTORED: REFLECTIONS & INTENTIONS */}
          <Card className="bg-black/40 border-cyan-500/20 shadow-xl backdrop-blur-sm mt-6">
            <CardHeader className="py-4 px-6">
              <CardTitle className="text-cyan-400 font-headline tracking-widest flex items-center gap-3 text-base">
                <Moon className="w-5 h-5 text-indigo-400" />
                Reflections and Intentions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Textarea
                value={shadowWork}
                onChange={(e) => setShadowWork(e.target.value)}
                placeholder="... focus on what you will do. Take Action."
                className="bg-black border-slate-800 text-cyan-100 placeholder:text-cyan-500/50 font-headline tracking-wide min-h-[100px] text-base focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
            </CardContent>
          </Card>

          {/* 5. RESTORED: TOMORROW'S MAIN QUEST */}
          <Card className="bg-black/40 border-cyan-500/20 shadow-xl backdrop-blur-sm mt-6">
            <CardHeader className="py-4 px-6">
              <CardTitle className="text-cyan-400 font-headline tracking-widest flex items-center gap-3 text-base">
                <div className="w-5 h-5 rounded-full border-2 border-cyan-400/50" />
                Tomorrow's Main Quest
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Input
                value={tomorrowQuest}
                onChange={(e) => setTomorrowQuest(e.target.value)}
                placeholder="... speak one thing into existence."
                className="bg-black border-slate-800 text-cyan-100 placeholder:text-cyan-500/50 font-headline tracking-wide h-12 text-base focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
            </CardContent>
          </Card>

          {/* 6. Action Bar: THE THOTH CHIP (The Seal) */}
          <div className="mt-16 flex flex-col gap-10 items-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-auto py-12 bg-black border-2 border-cyan-500/30 text-cyan-400 
                          hover:bg-slate-950 hover:border-cyan-400 hover:text-cyan-200 transition-all duration-500 group flex flex-col items-center justify-center gap-8 rounded-2xl shadow-2xl"
            >
              <span className="text-xl md:text-4xl tracking-[0.25em] font-headline uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] z-10 text-center">
                {isSubmitting ? "Sealing..." : "SEAL THE CHRONICLE"}
              </span>

              {!isSubmitting && (
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 transition-transform duration-1400 group-hover:scale-110 animate-pulse">
                  <Image
                    src="/icons/thoth-icon.svg"
                    alt="Thoth Chip"
                    fill
                    className="object-contain drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]"
                  />
                </div>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(3)}
              className="text-slate-600 font-headline tracking-widest hover:text-cyan-400 text-sm uppercase"
            >
              Return to Gratitude
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
  return null;
}