"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Bird, // Owl/Falcon Proxy
    Waves, // Water
    Eye, // Eye of Ra
    Zap // Placeholder for Snake
} from 'lucide-react';

// 🏺 THE MASON'S PATH: Custom SVG Paths for the Unique Glyphs
const HeroGlyphs = {
    ThreeJars: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M4 10c0-2 1-3 2-3s2 1 2 3v6c0 2-1 3-2 3s-2-1-2-3v-6zM10 10c0-2 1-3 2-3s2 1 2 3v6c0 2-1 3-2 3s-2-1-2-3v-6zM16 10c0-2 1-3 2-3s2 1 2 3v6c0 2-1 3-2 3s-2-1-2-3v-6z" />
            <path d="M4 8h4M10 8h4M16 8h4" strokeLinecap="round" />
        </svg>
    ),
    ScarabCartouche: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <rect x="5" y="3" width="14" height="18" rx="7" />
            <circle cx="12" cy="10" r="3" />
            <path d="M9 10h1M14 10h1M10 13l2 2 2-2M12 7v3" />
        </svg>
    ),
    BeeAndPlant: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M7 14c0-2 2-3 2-5s-1-3-1-3 4 1 4 3-2 3-2 5M15 14c0-2-2-3-2-5s1-3 1-3-4 1-4 3 2 3 2 5" />
            <ellipse cx="12" cy="16" rx="3" ry="5" />
        </svg>
    ),
    ApisBull: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M12 8c-2 0-4 1-4 3v4c0 1 1 2 2 2h4c1 0 2-1 2-2v-4c0-2-2-3-4-3z" />
            <path d="M8 11c-2-1-3-3-3-5M16 11c2-1 3-3 3-5" strokeLinecap="round" />
            <circle cx="12" cy="13" r="1" fill="currentColor" />
        </svg>
    ),
    Owl: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M12 4c-3 0-5 2-5 5v6c0 3 2 5 5 5s5-2 5-5V9c0-3-2-5-5-5z" />
            <circle cx="9" cy="9" r="1" />
            <circle cx="15" cy="9" r="1" />
            <path d="M11 12l1 1 1-1" />
        </svg>
    ),
    HornedViper: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M4 16c2 0 3-2 5-2s3 2 5 2 3-2 5-2" strokeLinecap="round" />
            <path d="M19 14l1-2M18 11l1-1M20 11l-1-1" />
        </svg>
    ),
    EyeOfRa: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 15v4m-2 0h4" />
        </svg>
    ),
    TwoFeathers: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M9 20c0-5 1-10 3-16M15 20c0-5-1-10-3-16" />
            <path d="M9 20a3 3 0 01-3-3V7a3 3 0 013 3M15 20a3 3 0 003-3V7a3 3 0 00-3 3" />
        </svg>
    ),
    HebBowl: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M4 10c0 5 4 9 8 9s8-4 8-9H4z" />
            <circle cx="12" cy="7" r="2" />
        </svg>
    ),
    SolarDisc: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
    )
};

export function IstanbulDial() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const SECRET_CODE = [1, 7, 8, 11]; 

  const handlePress = (id: number) => {
    if (sequence.length < 4 && !isUnlocked) {
      const newSeq = [...sequence, id];
      setSequence(newSeq);
      if (window.navigator.vibrate) window.navigator.vibrate(40);

      if (newSeq.length === 4) {
        if (JSON.stringify(newSeq) === JSON.stringify(SECRET_CODE)) {
          setIsUnlocked(true);
          if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 200]);
        } else {
          setTimeout(() => setSequence([]), 600);
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-8 bg-black/60 border border-cyan-500/30 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
      {!isUnlocked ? (
        <>
          <div className="flex gap-3 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-3 h-3 rounded-full border border-cyan-800 transition-all ${sequence[i] ? "bg-amber-400 shadow-[0_0_15px_#fbbf24]" : "bg-transparent"}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <GlyphButton id={1} icon={<Bird size={32} />} onClick={handlePress} />
            <GlyphButton id={2} icon={<HeroGlyphs.ApisBull className="w-full h-full" />} onClick={handlePress} />
            <GlyphButton id={3} icon={<HeroGlyphs.BeeAndPlant className="w-full h-full" />} onClick={handlePress} />
            <GlyphButton id={4} icon={<HeroGlyphs.SolarDisc className="w-full h-full" />} onClick={handlePress} />
            <GlyphButton id={5} icon={<HeroGlyphs.Owl className="w-full h-full" />} onClick={handlePress} />
            <GlyphButton id={6} icon={<Waves size={32} />} onClick={handlePress} />
            <GlyphButton id={7} icon={<HeroGlyphs.HornedViper className="w-full h-full" />} onClick={handlePress} />
            <GlyphButton id={8} icon={<HeroGlyphs.EyeOfRa className="w-full h-full" />} onClick={handlePress} />
            <GlyphButton id={9} icon={<HeroGlyphs.TwoFeathers className="w-full h-full" />} onClick={handlePress} />
            <GlyphButton id={10} icon={<HeroGlyphs.HebBowl className="w-full h-full" />} onClick={handlePress} />
            <GlyphButton id={11} icon={<HeroGlyphs.ThreeJars className="w-full h-full" />} onClick={handlePress} />
            <GlyphButton id={12} icon={<HeroGlyphs.ScarabCartouche className="w-full h-full" />} onClick={handlePress} />
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-6">
          <h4 className="font-headline text-amber-400 text-[10px] tracking-widest uppercase mb-4">Stash Revealed</h4>
          <p className="text-cyan-100 italic text-sm">"The screenshot is in the 'Old Receipts' folder."</p>
        </motion.div>
      )}
    </div>
  );
}

function GlyphButton({ id, icon, onClick }: { id: number, icon: React.ReactNode, onClick: (id: number) => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92, y: 2 }}
      onClick={() => onClick(id)}
      className="w-16 h-16 flex items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-950/10 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-400/50 transition-all shadow-inner"
    >
      <div className="w-8 h-8 opacity-80">{icon}</div>
    </motion.button>
  );
}