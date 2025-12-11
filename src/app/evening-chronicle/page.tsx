"use client";

import { useState } from "react";
import { Moon, Star, Save, CheckCircle2, Wind, Scroll, History, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase"; 
import { writeBatch, doc, collection, serverTimestamp, query, where, orderBy, getDocs } from "firebase/firestore";
import { useTasks } from "@/hooks/use-tasks"; 
import { CyberAnkh } from '@/components/icons/cyber-ankh';

export default function EveningChroniclePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // 1. CONNECT TO REAL DATA
  const { tasks } = useTasks(); 
  const completedTasks = tasks.filter(t => t.completed);

  // Steps: 1=Start, 2=Victories, 3=Breath, 4=Form, 5=ARCHIVES
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Archive Data
  const [archives, setArchives] = useState<any[]>([]);
  const [loadingArchives, setLoadingArchives] = useState(false);

  // Form States
  const [wins, setWins] = useState("");
  const [shadowWork, setShadowWork] = useState("");
  const [tomorrowQuest, setTomorrowQuest] = useState("");

  // --- FETCH ARCHIVES ---
  const handleOpenArchives = async () => {
    if (!user) return;
    setLoadingArchives(true);
    setStep(5); // Switch to Archive View

    try {
      const q = query(
        collection(db, "chronicles"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArchives(history);
    } catch (error) {
      console.error("Error fetching archives:", error);
    } finally {
      setLoadingArchives(false);
    }
  };

  // --- THE SEAL & BANISH LOGIC ---
  const handleSealChronicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
        const batch = writeBatch(db);

        // A. ARCHIVE
        const chronicleRef = doc(collection(db, "chronicles"));
        batch.set(chronicleRef, {
            userId: user.uid,
            createdAt: serverTimestamp(),
            date: new Date().toLocaleDateString(),
            victoriesLog: completedTasks.map(t => t.title),
            winsNote: wins,
            shadowWorkNote: shadowWork,
            tomorrowQuest: tomorrowQuest,
            type: "evening-seal"
        });

        // B. PURGE
        completedTasks.forEach((task) => {
            const taskRef = doc(db, "tasks", task.id);
            batch.delete(taskRef);
        });

        // C. COMMIT
        await batch.commit();
        
        // D. REDIRECT
        setTimeout(() => {
            setIsSubmitting(false);
            router.push("/"); 
        }, 1500);

    } catch (error) {
        console.error("Error sealing chronicle:", error);
        setIsSubmitting(false);
    }
  };
// --- STEP 1: THE THRESHOLD ---
if (step === 1) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-700">
      
      {/* Moon Icon */}
      <div className="mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
          <Moon className="w-20 h-20 text-cyan-400" strokeWidth={1.5} />
      </div>

      {/* Header Section */}
      <div className="mb-12 text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-headline text-cyan-400 tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
          The Day is Done.
        </h1>
        <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed font-sans">
          The sun has set on your efforts. Are you ready to review your deeds and close the cycle?
        </p>
      </div>
      
      {/* Action Area - Balanced Text Menu */}
      <div className="flex flex-col items-center gap-4 w-full max-w-lg">
          
          {/* Main Trigger */}
          <Button 
              onClick={() => setStep(2)} 
              variant="ghost"
              className="w-full text-lg py-3 h-auto font-headline tracking-widest text-cyan-400 hover:text-cyan-100 hover:bg-cyan-950/10 transition-all drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] uppercase"
          >
              Scribe the Day's Chronicle
          </Button>

          {/* "Not Yet" - Now Full Brightness */}
           <Link href="/" className="w-full md:w-auto">
              <Button variant="ghost" className="w-full font-headline tracking-wider text-cyan-400 hover:text-cyan-100 text-lg uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                  Not yet
              </Button>
          </Link>
      </div>

      {/* Archive Button - Now Full Brightness */}
      <div className="mt-16 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 animate-in slide-in-from-right duration-500 text-center">
      
      {/* GOLD HEADER: Ma'at Created */}
      <h2 className="text-4xl md:text-5xl font-headline font-bold text-amber-400 tracking-widest uppercase mb-8 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
          Ma'at Created
      </h2>
      
      {/* THE GOLDEN LIST */}
      <div className="w-full max-w-md space-y-4 mb-12">
          {completedTasks.length > 0 ? (
              completedTasks.map((task, index) => (
                  <div 
                      key={task.id} 
                      className="bg-amber-950/10 border border-amber-500/30 p-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:bg-amber-900/20 transition-colors"
                      style={{ animationDelay: `${index * 150}ms` }}
                  >
                      {/* The Cyber-Ankh (Gold) */}
                      <div className="p-2 bg-amber-500/10 rounded-full border border-amber-500/20">
                         <CyberAnkh className="w-6 h-6 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
                      </div>
                      <span className="text-lg font-headline text-amber-100 tracking-wide text-left leading-tight">
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

      {/* THE ATTESTATION BUTTON (Neon Sizzle) */}
      <Button 
          onClick={() => setStep(3)} 
          variant="ghost"
          className="w-full max-w-xl h-auto py-6 whitespace-normal text-center font-headline text-xl md:text-2xl text-cyan-400 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] hover:text-cyan-100 hover:bg-cyan-950/20 transition-all border-y border-transparent hover:border-cyan-500/30 leading-relaxed"
      >
          I Attest to and Humbly<br/>Offer These Deeds
      </Button>
    </div>
  );
}
  // --- STEP 3: THE BREATH ---
  if (step === 3) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-1000">
        
        {/* Animated Wind Icon - Cyber Style */}
        <div className="mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Wind className="w-20 h-20 text-cyan-400" strokeWidth={1.5} />
        </div>
        
        {/* Header - Cyber Sizzle */}
        <h2 className="text-3xl md:text-5xl font-headline font-bold text-cyan-400 tracking-widest uppercase mb-12 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] leading-tight">
          You churned chaos<br/>into order.
        </h2>
        
        {/* Instruction Card - Holographic Glass */}
        <Card className="bg-slate-900/40 border border-cyan-500/30 max-w-lg mb-12 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.05)]">
            <CardContent className="p-8">
                <p className="text-xl md:text-2xl text-cyan-100/90 leading-relaxed font-headline tracking-wide">
                    "Take 8 breaths. Celebrate and give thanks in a way that honors yourself and those that assisted you. Stretch and pray."
                </p>
            </CardContent>
        </Card>

        {/* Action Button - The Neon Trigger */}
        <Button 
            onClick={() => setStep(4)} 
            variant="ghost"
            className="w-full max-w-xl h-auto py-6 text-center font-headline text-2xl text-cyan-400 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] hover:text-cyan-100 hover:bg-cyan-950/20 transition-all border-y border-transparent hover:border-cyan-500/30"
        >
            I have given thanks
        </Button>
      </div>
    );
  }

  // --- STEP 4: THE FORM (Final Seal) ---
  if (step === 4) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="max-w-3xl mx-auto mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-900/30 rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                <Scroll className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-headline font-bold text-cyan-400 tracking-wider drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                    The Evening Chronicle
                </h1>
                <p className="text-indigo-300/60 text-sm font-headline tracking-widest">Seal the record. Clear the slate.</p>
              </div>
            </div>
          </div>
    
          <div className="max-w-3xl mx-auto space-y-6">
            <form onSubmit={handleSealChronicle}>
              
              {/* Victories List (The Ma'at Record) */}
              <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl overflow-hidden mb-8 shadow-[0_0_15px_rgba(34,211,238,0.05)]">
                 <div className="bg-cyan-950/20 p-3 border-b border-cyan-500/20 flex items-center gap-2">
                    <Scroll className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-[0.2em] font-headline">The Ma'at Record</h3>
                 </div>
                 <div className="p-4 max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                    {completedTasks.length > 0 ? completedTasks.map(t => (
                       <div key={t.id} className="flex items-center gap-3 text-cyan-100/90 text-sm border-b border-cyan-500/10 pb-2 last:border-0 last:pb-0 font-headline tracking-wide">
                           <CyberAnkh className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
                           <span>{t.title}</span>
                       </div>
                    )) : <p className="text-cyan-500/50 italic text-sm text-center py-2 font-headline">No deeds recorded today.</p>}
                 </div>
              </div>
    
              {/* Section 1: Victories */}
              <Card className="bg-slate-900/50 border-cyan-500/20 shadow-xl backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-cyan-400 font-headline tracking-widest flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        Victories & Gratitude
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        value={wins} 
                        onChange={(e) => setWins(e.target.value)} 
                        placeholder="... I successfully navigated the River of Data to stabilize the API." 
                        // Updated: text-cyan-500/70 for better visibility
                        className="bg-slate-950 border-slate-800 text-cyan-100 placeholder:text-cyan-500/70 placeholder:drop-shadow-[0_0_5px_rgba(34,211,238,0.2)] font-headline tracking-wide min-h-[100px] focus:border-cyan-500/50" 
                    />
                </CardContent>
              </Card>
    
              {/* Section 2: Reflections */}
              <Card className="bg-slate-900/50 border-cyan-500/20 shadow-xl backdrop-blur-sm mt-6">
                <CardHeader>
                    <CardTitle className="text-cyan-400 font-headline tracking-widest flex items-center gap-2">
                        <Moon className="w-5 h-5 text-indigo-400" />
                        Reflections and Intentions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        value={shadowWork} 
                        onChange={(e) => setShadowWork(e.target.value)} 
                        placeholder="... my focus wavered during the midday sun; I shall temper my discipline." 
                        // Updated: text-cyan-500/70 for better visibility
                        className="bg-slate-950 border-slate-800 text-cyan-100 placeholder:text-cyan-500/70 placeholder:drop-shadow-[0_0_5px_rgba(34,211,238,0.2)] font-headline tracking-wide min-h-[100px] focus:border-cyan-500/50" 
                    />
                </CardContent>
              </Card>
    
              {/* Section 3: Tomorrow's Quest */}
              <Card className="bg-slate-900/50 border-cyan-500/20 shadow-xl backdrop-blur-sm mt-6">
                <CardHeader>
                    <CardTitle className="text-cyan-400 font-headline tracking-widest flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-cyan-400/50" />
                        Tomorrow's Main Quest
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Input 
                        value={tomorrowQuest} 
                        onChange={(e) => setTomorrowQuest(e.target.value)} 
                        placeholder="... speak one thing into existence for tomorrow."
                        // Updated: text-cyan-500/70 for better visibility
                        className="bg-slate-950 border-slate-800 text-cyan-100 placeholder:text-cyan-500/70 placeholder:drop-shadow-[0_0_5px_rgba(34,211,238,0.2)] font-headline tracking-wide h-12 text-lg focus:border-cyan-500/50" 
                    />
                </CardContent>
              </Card>
    
              {/* Action Bar */}
              <div className="mt-8 flex justify-end gap-6 items-center">
                 <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setStep(3)} 
                    className="text-slate-500 font-headline tracking-widest hover:text-cyan-400"
                 >
                    BACK
                 </Button>
                 
                 {/* THE GOLDEN SEAL BUTTON */}
                 <Button 
                   type="submit" 
                   disabled={isSubmitting}
                   className="bg-indigo-900 border border-amber-500/50 text-amber-100 hover:bg-indigo-800 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-500 px-8 py-6 text-lg tracking-[0.2em] font-headline uppercase"
                 >
                   {isSubmitting ? "Sealing..." : "SEAL THE CHRONICLE"}
                   {!isSubmitting && <Save className="ml-2 w-5 h-5 text-amber-400" />}
                 </Button>
              </div>
            </form>
          </div>
        </div>
      );
  }

  // --- STEP 5: ARCHIVES VIEW ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <History className="w-8 h-8 text-indigo-400" />
                    <h1 className="text-3xl font-display font-bold text-indigo-100">Past Chronicles</h1>
                </div>
                <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gate
                </Button>
            </div>

            {loadingArchives ? (
                <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
            ) : archives.length === 0 ? (
                <div className="text-center p-12 text-slate-500 border border-indigo-900/30 rounded-lg">No archives found. Your history begins today.</div>
            ) : (
                <div className="grid gap-6">
                    {archives.map((entry) => (
                        <Card key={entry.id} className="bg-slate-900/50 border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-indigo-200 flex items-center gap-2 text-lg">
                                    <Calendar className="w-4 h-4 text-indigo-400" />
                                    {entry.date}
                                </CardTitle>
                                <span className="text-xs text-indigo-400/50 uppercase tracking-widest font-bold">Chronicle</span>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Victories */}
                                {entry.victoriesLog && entry.victoriesLog.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {entry.victoriesLog.map((v: string, i: number) => (
                                            <span key={i} className="text-xs bg-indigo-950 text-indigo-300 px-2 py-1 rounded border border-indigo-500/10">{v}</span>
                                        ))}
                                    </div>
                                )}
                                {/* Notes */}
                                <div className="grid md:grid-cols-2 gap-4 mt-2">
                                    {entry.winsNote && (
                                        <div className="bg-slate-950/50 p-3 rounded text-sm text-slate-300 border border-slate-800">
                                            <strong className="block text-indigo-400 text-xs uppercase mb-1">Wins</strong>
                                            {entry.winsNote}
                                        </div>
                                    )}
                                    {entry.shadowWorkNote && (
                                        <div className="bg-slate-950/50 p-3 rounded text-sm text-slate-300 border border-slate-800">
                                            <strong className="block text-purple-400 text-xs uppercase mb-1">Shadow Work</strong>
                                            {entry.shadowWorkNote}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}