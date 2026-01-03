"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  Scroll, 
  Sunrise, 
  Moon, 
  Zap 
} from "lucide-react";

const libraryPortals = [
  {
    title: "The Scribe's Primer",
    desc: "A comprehensive guide to every feature and ritual within the Temple.",
    link: "/library/how-to",
    icon: <BookOpen className="text-rose-400" />,
    color: "border-rose-500/40 bg-rose-950/10",
    isHero: true
  },
  {
    title: "Chronicle Protocol",
    desc: "Master the art of the Evening Seal and the Khepri Protocol.",
    link: "/evening-chronicle",
    icon: <Moon className="text-indigo-400" />,
    color: "border-indigo-500/20 bg-indigo-950/5"
  },
  {
    title: "Archive Navigation",
    desc: "How to consult the scrolls and review your lived Ma'at.",
    link: "/archives",
    icon: <Scroll className="text-cyan-400" />,
    color: "border-cyan-500/20 bg-cyan-950/5"
  },
  {
    title: "Ritual Mastery",
    desc: "Learn to edit, banish, and manifest your Daily Rituals.",
    link: "/rituals",
    icon: <Sunrise className="text-amber-400" />,
    color: "border-amber-500/20 bg-amber-950/5"
  }
];

export default function LibraryPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-rose-100 font-sans selection:bg-rose-500/30 overflow-y-auto pb-20 custom-scrollbar">
      
      {/* 🏛️ HEADER */}
      <div className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl border-b border-rose-500/30 px-6 py-8 flex items-center justify-between shadow-[0_4px_30px_rgba(244,63,94,0.1)]">
        <Button 
          onClick={() => router.push("/")}
          variant="ghost"
          className="text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-all"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <h1 className="font-display font-bold text-2xl text-rose-400 tracking-[0.3em] uppercase drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]">
          Grand Library
        </h1>

        <div className="w-10 flex justify-end">
           <Sparkles className="text-rose-300 animate-pulse" size={24} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pt-12">
        
        {/* 📜 THE GOLDEN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-700">
          {libraryPortals.map((portal) => (
            <Link 
              href={portal.link} 
              key={portal.title}
              className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] group active:scale-95 ${portal.color} ${portal.isHero ? 'md:col-span-2' : ''}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 group-hover:border-rose-500/50 transition-colors">
                  {portal.icon}
                </div>
                <h3 className="font-display font-bold uppercase tracking-[0.2em] text-rose-100 group-hover:text-rose-400 transition-colors">
                  {portal.title}
                </h3>
              </div>
              <p className="text-sm text-zinc-400 font-body leading-relaxed group-hover:text-rose-100/90 transition-colors">
                {portal.desc}
              </p>
              
              {/* Subtle "Enter" indicator */}
              <div className="mt-6 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold flex items-center gap-2">
                  Enter Chamber <ArrowLeft className="rotate-180 w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* 🏺 FOOTER INSCRIPTION */}
        <div className="mt-20 text-center space-y-2 opacity-40">
           <p className="text-[10px] uppercase tracking-[0.5em] font-display">The House of Life</p>
           <p className="text-[9px] italic font-body">"Knowledge is the light that Ra carries into the night."</p>
        </div>

      </div>
    </main>
  );
}