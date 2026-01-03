"use client";

import { useState } from "react";
import Link from "next/link"; // Ensure Link is imported for the portals
import { Button } from "@/components/ui/button";
import { Scroll, Sparkles, Sunrise, Moon, BookOpen, X } from "lucide-react";

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

export function GrandLibrary() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 🚩 THE WELCOME BANNER (The Pylon Gate) */}
      <div 
        className="mx-4 mt-4 p-4 rounded-xl border-2 border-rose-500 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse group cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-rose-500/20 rounded-lg">
            <BookOpen className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h4 className="text-rose-400 font-headline font-bold text-xs uppercase tracking-widest">
              Initiation: The Scribe&apos;s Path
            </h4>
            <p className="text-rose-100/70 text-[10px] italic">Open the Grand Library to manifest your first ritual.</p>
          </div>
        </div>
      </div>

      {/* 🏛️ THE LIBRARY MODAL (The Inner Court) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
          
          {/* Header for the Modal */}
          <div className="w-full max-w-4xl flex justify-between items-center mb-8">
            <h2 className="text-2xl font-display font-bold text-rose-400 tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
              Grand Library Atrium
            </h2>
            <Button 
              variant="ghost" 
              onClick={() => setIsOpen(false)} 
              className="text-rose-400 hover:bg-rose-500/10"
            >
              <X size={24} />
            </Button>
          </div>

          {/* THE GOLDEN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {libraryPortals.map((portal) => (
              <Link 
                href={portal.link} 
                key={portal.title}
                className={`p-6 rounded-2xl border transition-all hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(244,63,94,0.1)] group ${portal.color} ${portal.isHero ? 'md:col-span-2' : ''}`}
              >
                <div className="flex items-center gap-4 mb-3">
                  {portal.icon}
                  <h3 className="font-display font-bold uppercase tracking-widest text-rose-100">{portal.title}</h3>
                </div>
                <p className="text-sm text-zinc-400 font-body leading-relaxed group-hover:text-rose-100 transition-colors">
                  {portal.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}