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

        // A. ARCHIVE: Create the Chronicle Entry
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

        // B. THE CLEANSING (Handling Completed Tasks)
        completedTasks.forEach((task) => {
            const taskRef = doc(db, "tasks", task.id);
            // Completed tasks are always deleted/banished from the board
            batch.delete(taskRef);
        });

        // C. THE FORGIVENESS (Handling Incomplete Rituals)
        // We delete them so they don't pile up. The Midnight Scribe will recreate fresh ones.
        incompleteRituals.forEach((task) => {
           const taskRef = doc(db, "tasks", task.id);
           batch.delete(taskRef); 
        });

        // D. COMMIT
        await batch.commit();
        console.log("Chronicle Sealed: Board Cleansed.");

        setTimeout(() => {
            setIsSubmitting(false);
            router.push("/"); 
        }, 1500);

    } catch (error) {
        console.error("Error sealing chronicle:", error);
        setIsSubmitting(false);
    }
  };

  const handleOpenArchives = () => {
     router.push("/archives");
  }

  // --- STEP 1: THE THRESHOLD ---
  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-700 border-4 border-cyan-500/10 m-2 rounded-3xl overflow-hidden">
        
        {/* Moon Icon */}
        <div className="mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Moon className="w-16 h-16 text-cyan-400" strokeWidth={1.5} />
        </div>

        {/* Header Section */}
        <div className="mb-10 text-center space-y-4 max-w-md">
          <h1 className="text-3xl md:text-5xl font-headline text-cyan-400 tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
            The Day is Done.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed font-sans">
            The sun has set on your efforts.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed font-sans">
            Are you ready to review your deeds and close the cycle?
          </p>
        </div>
        
        {/* Action Area */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <Button 
                onClick={() => setStep(2)} 
                variant="ghost"
                className="w-full text-lg py-3 h-auto font-headline tracking-widest text-cyan-400 hover:text-cyan-100 hover:bg-cyan-950/10 transition-all drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] uppercase border border-cyan-500/20"
            >
                Scribe the Chronicle
            </Button>

             <Link href="/" className="w-full">
                <Button variant="ghost" className="w-full font-headline tracking-wider text-cyan-400 hover:text-cyan-100 text-lg uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                    Not yet
                </Button>
            </Link>
        </div>

        <div className="mt-12 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
            <Button 
                variant="link" 
                onClick={handleOpenArchives}
                className="font-headline text-cyan-400 hover:text-cyan-100 gap-2 uppercase tracking-[0.2em] text-xs drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
            >
                <History className="w-4 h-4" />
                Open Archives
            </Button>
        </div>
      </div>
    );
  }

  // --- STEP 2: MA'AT CREATED (The Offering) ---
  if (step === 2) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 animate-in slide-in-from-right duration-500 text-center border-4 border-amber-500/10 m-2 rounded-3xl overflow-y-auto">
        
        <h2 className="text-3xl md:text-5xl font-headline font-bold text-amber-400 tracking-widest uppercase mb-8 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] mt-8">
            Ma'at Created
        </h2>
        
        {/* THE GOLDEN LIST */}
        <div className="w-full max-w-md space-y-3 mb-8">
            {completedTasks.length > 0 ? (
                completedTasks.map((task, index) => (
                    <div 
                        key={task.id} 
                        className="bg-amber-950/10 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="p-2 bg-amber-500/10 rounded-full border border-amber-500/20">
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

        {/* RETAINED NUN (Incomplete Rituals) */}
        {incompleteRituals.length > 0 && (
            <div className="w-full max-w-md mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                <h3 className="text-xl font-headline text-cyan-400 tracking-widest uppercase mb-4 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] border-b border-cyan-500/30 pb-2">
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
                <div className="mt-6 p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-lg text-sm text-cyan-300/80 font-sans italic leading-relaxed max-w-sm mx-auto">
                    "Do not be guilted. You have tomorrow. Show up for yourself and take action. Reduce the scope until you cannot fail."
                </div>
            </div>
        )}

        {/* THE ATTESTATION BUTTON (Sparkling & Crackling) */}
        <div className="mb-12 relative group w-full max-w-xl">
            {/* The Crackle: Spinning Gradient Border */}
            <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 animate-spin-slow transition-opacity duration-500 blur-sm"></div>
            
            {/* The Mesmerizing Pulse Background */}
            <div className="absolute -inset-1 bg-cyan-500/20 rounded-xl blur-md animate-[pulse_4s_ease-in-out_infinite] group-hover:bg-cyan-400/30"></div>
            
            <Button 
                onClick={() => setStep(3)} 
                variant="ghost"
                className="relative w-full h-auto py-8 whitespace-normal text-center bg-slate-950/80 backdrop-blur-md border border-cyan-500/50 rounded-xl
                           font-headline text-xl md:text-2xl text-cyan-100 tracking-[0.15em] uppercase 
                           shadow-[0_0_30px_rgba(34,211,238,0.15)] 
                           hover:text-white hover:border-cyan-300 hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] 
                           transition-all duration-700 ease-out"
            >
                <span className="relative z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                    I Attest to and Humbly<br/>Offer These Deeds
                </span>
            </Button>
        </div>
      </div>
    );
  }

  // --- STEP 3: THE BREATH ---
  if (step === 3) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-1000 border-4 border-cyan-500/10 m-2 rounded-3xl">
        
        <div className="mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Wind className="w-16 h-16 text-cyan-400" strokeWidth={1.5} />
        </div>
        
        <h2 className="text-2xl md:text-4xl font-headline font-bold text-cyan-400 tracking-widest uppercase mb-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] leading-tight max-w-md">
          You churned chaos<br/>into order.
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


// --- STEP 4: THE FORM (Final Seal) ---
if (step === 4) {
  return (
      // VOID MODE: Full screen, no outer borders, pure immersion
      <div className="w-full min-h-screen bg-slate-950 text-slate-200 font-sans animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-32">
        
        {/* Header */}
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
  
        {/* Main Content */}
        <div className="w-full max-w-4xl mx-auto space-y-6 px-2 md:px-4">
          <form onSubmit={handleSealChronicle}>
            
            {/* Victories List (The Ma'at Record) */}
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
  
            {/* Section 1: Achievements & Gratitude */}
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
                      className="bg-black border-slate-800 text-cyan-100 placeholder:text-cyan-500/50 font-headline tracking-wide min-h-[100px] text-base focus:border-cyan-500/50 focus:ring-cyan-500/20 placeholder:font-headline" 
                  />
              </CardContent>
            </Card>
  
            {/* Section 2: Reflections */}
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
                      placeholder="... don't focus on the undone, but on what you will do. Take Action. Even the very smallest of actions beget more action." 
                      className="bg-black border-slate-800 text-cyan-100 placeholder:text-cyan-500/50 font-headline tracking-wide min-h-[100px] text-base focus:border-cyan-500/50 focus:ring-cyan-500/20 placeholder:font-headline" 
                  />
              </CardContent>
            </Card>
  
            {/* Section 3: Tomorrow's Quest */}
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
                      className="bg-black border-slate-800 text-cyan-100 placeholder:text-cyan-500/50 font-headline tracking-wide h-12 text-base focus:border-cyan-500/50 focus:ring-cyan-500/20 placeholder:font-headline" 
                  />
              </CardContent>
            </Card>
  
            {/* Action Bar - Vertical Layout */}
            <div className="mt-16 flex flex-col gap-10 items-center">
               
               {/* THE FINAL SEAL BUTTON (Obsidian Monolith with Pulsing SVG) */}
               <Button 
                 type="submit" 
                 disabled={isSubmitting}
                 className="w-full h-auto py-12 bg-black border-2 border-cyan-500/30 text-cyan-400 
                            hover:bg-slate-950 hover:border-cyan-400 hover:text-cyan-200 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)] 
                            transition-all duration-500 group flex flex-col items-center justify-center gap-8 rounded-2xl shadow-2xl"
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