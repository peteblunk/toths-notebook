"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Scroll, ChevronDown, ChevronUp, ArrowLeft, Star, Moon, Sparkles } from "lucide-react";

export default function ArchivesPage() {
  const router = useRouter();
  const [chronicles, setChronicles] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "chronicles"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChronicles(docs);
      setLoading(false);
      if (docs.length > 0 && !expandedId) setExpandedId(docs[0].id);
    });

    return () => unsubscribe();
  }, [expandedId]);

  return (
    <main className="min-h-[100dvh] w-full bg-slate-950 text-slate-200 overflow-y-auto custom-scrollbar">
      
      {/* 🏛️ THE LUMINOUS HEADER: Now explicitly visible on mobile */}
      <div className="sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-xl border-b border-cyan-500/30 px-4 py-6 flex items-center justify-between shadow-[0_4px_20px_rgba(34,211,238,0.15)]">
        <button 
          onClick={() => router.push("/")}
          className="p-2 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        
        <h1 className="font-headline font-bold text-xl text-cyan-400 tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
          The Archives
        </h1>

        <div className="w-10 flex justify-end">
           <Scroll className="text-lime-400 drop-shadow-[0_0_5px_rgba(163,230,53,0.8)]" size={24} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4 pt-8">
        {loading ? (
          <div className="text-center py-20 text-cyan-400 animate-pulse font-headline tracking-widest">
            DECRYPTING ANCIENT SCROLLS...
          </div>
        ) : chronicles.map((entry) => {
          const isExpanded = expandedId === entry.id;
          return (
            <div 
              key={entry.id} 
              className={`group border rounded-2xl transition-all duration-500 ${
                  isExpanded 
                  ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(34,211,238,0.2)] scale-[1.02]' 
                  : 'border-cyan-500/20 bg-black/40 hover:border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.05)]'
              }`}
            >
              <button 
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="w-full p-5 flex justify-between items-center text-left"
              >
                <div className="flex items-center gap-4">
                  {/* ICON: Now Lime Green and Brighter */}
                  <div className={`p-3 rounded-xl border-2 transition-all duration-500 ${
                    isExpanded 
                    ? 'border-lime-400 bg-lime-400/20 shadow-[0_0_15px_rgba(163,230,53,0.6)]' 
                    : 'border-lime-500/30 bg-lime-950/10'
                  }`}>
                    <Scroll size={22} className="text-lime-400" />
                  </div>
                  
                  <div>
                    <h3 className={`font-headline font-bold tracking-widest uppercase transition-all duration-500 ${
                      isExpanded ? 'text-2xl text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-sm text-cyan-500/70'
                    }`}>
                      {entry.date}
                    </h3>
                    {!isExpanded && (
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 italic">
                        {entry.tomorrowQuest || "Quest Sealed"}
                      </p>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={24} className="text-cyan-400" /> : <ChevronDown size={20} className="text-cyan-900" />}
              </button>

              {isExpanded && (
                
                <div className="px-6 pb-8 space-y-8 animate-in zoom-in-95 fade-in duration-500">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/5">
                      <h4 className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <Star size={12} /> Achievements
                      </h4>
                      <p className="text-sm text-amber-100/90 italic font-serif leading-relaxed">"{entry.winsNote}"</p>
                    </div>
                    
                    <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/5">
                      <h4 className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <Moon size={12} /> Shadow Reflection
                      </h4>
                      <p className="text-sm text-indigo-100/80 leading-relaxed font-sans">"{entry.shadowWorkNote}"</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-lime-500/30 bg-lime-950/5 shadow-[inset_0_0_15px_rgba(163,230,53,0.05)]">
                    <h4 className="text-[10px] text-lime-400 font-bold uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                      <Sparkles size={12} /> Tomorrow&apos;s Prophecy
                    </h4>
                    <p className="text-md text-lime-100/90 font-headline tracking-wide italic">
                      {entry.tomorrowQuest || "No prophecy was recorded."}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-cyan-500/20">
                     <div className="flex flex-wrap justify-center gap-2">
                       {entry.victoriesLog?.map((task: string, i: number) => (
                         <span key={i} className="text-[10px] px-3 py-1.5 bg-black border border-cyan-400/30 rounded-lg text-cyan-300 font-headline tracking-widest shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]">
                           {task}
                         </span>
                       ))}
                     </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}