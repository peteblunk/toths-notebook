"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Obelisk } from '@/components/IstanbulProtocol/Obelisk';
import { HeroGlyphs } from '@/components/IstanbulProtocol/HeroGlyphs';
import { VariousGlyphs } from '@/components/IstanbulProtocol/VariousGlyphs';
import { Pedestal } from '@/components/IstanbulProtocol/Pedestal';

export default function ObeliskAnimationsLab() {
  const [isDescending, setIsDescending] = useState(false);
  
  const maatX = 42.5; 
  
  // The two states of our "Sekhmet Lens"
  const summitView = "07 0 40 40";
  const bottomView = "07 200 40 40";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-10 overflow-hidden">
      <button
        onClick={() => setIsDescending(!isDescending)}
        className="mb-12 px-10 py-4 bg-red-950/20 border border-red-500 text-red-500 font-mono tracking-[0.4em] uppercase text-xs hover:bg-red-500 hover:text-white transition-colors"
      >
        {isDescending ? "Reverse Gaze" : "Initiate Descent"}
      </button>

      <div className="relative w-[500px] aspect-[1/2] rounded-2xl border border-white/5 bg-black overflow-hidden">
       <motion.svg 
  animate={{ viewBox: isDescending ? "07 235 40 40" : "07 0 40 40" }}
  transition={{ duration: 15, ease: [0.45, 0.05, 0.55, 0.95] }}
  className="w-full h-full"
>
  {/* 1. THE FLOATING ASSEMBLY (Shaft + Glyphs) */}
  <g className="animate-float-slow">
    <Obelisk ritualStage={2} />
    
    <g transform={`translate(${maatX - 43}, 0)`}>
       <VariousGlyphs ritualStage={2} />
       <HeroGlyphs ritualStage={2} />
    </g>
  </g>

  {/* 2. THE STATIONARY ANCHOR (Pedestal) */}
  {/* Notice: This is OUTSIDE the 'animate-float-slow' group! */}
  <g transform="translate(0.5, 6.0)">
    <Pedestal ritualStage={2} />
  </g>
</motion.svg>
    <g transform="translate(0.5, 6.0)">
      <Pedestal ritualStage={2} />
    </g>
  

      </div>

      <p className="mt-8 text-red-500/30 font-mono text-[9px] uppercase tracking-[1em]">
        Framer-Motion Engine // {isDescending ? "Descending" : "Static"}
      </p>
    </div>
  );
}