"use client";

import React from 'react';
import { Obelisk } from '@/components/IstanbulProtocol/Obelisk';
import { HeroGlyphs } from '@/components/IstanbulProtocol/HeroGlyphs';
import { VariousGlyphs } from '@/components/IstanbulProtocol/VariousGlyphs';
import { Pedestal } from '@/components/IstanbulProtocol/Pedestal';

export default function GlyphInspectionPage() {
  // Cyber Egyptian Colors from your globals.css
  const cyberCyan = "#00FFFF";
  const ankhGold = "#FFC000";
  const thothPurple = "#B915CC";

  return (
    <div className="w-full h-[100dvh] bg-black flex items-center justify-center p-2 overflow-hidden">
      
      {/* THE SACRED SHRINE */}
      <div className="relative w-full h-full max-w-md bg-none rounded-3xl border border-cyan-500/20 shadow-[0_0_30px_rgba(0,255,255,0.05)] overflow-hidden flex flex-col items-center">
        
        <svg 
          viewBox="0 0 55 300" 
          className="h-[92%] w-auto mt-4"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* THE CELESTIAL STONE: No fill, Cyan Pulse */}
          <g id="obelisk-shaft" className="glow-cyan" fill="none">
            <g stroke={cyberCyan} strokeWidth="0.2">
              <Obelisk ritualStage={2} />
            </g>
            
            {/* CYAN GLYPHS: Explicitly setting the color here */}
           <g 
  id="glyph-layer" 
  stroke={cyberCyan} 
  className="filter"
  style={{ 
    filter: `
      drop-shadow(0 0 1px #fff) 
      drop-shadow(0 0 8px ${cyberCyan}) 
      drop-shadow(0 0 16px ${cyberCyan})
    ` 
  }}
>
             
              <VariousGlyphs ritualStage={2} color={cyberCyan}/>
              <HeroGlyphs ritualStage={2} />
              
            </g>
          </g>

          {/* THE PEDESTAL: Thoth Purple */}
          <g 
            id="pedestal-anchor" 
            transform="translate(0.5, 6.0)" 
            stroke={thothPurple} 
            strokeWidth="0.2" 
            fill="none"
          >
             <Pedestal ritualStage={2} />
          </g>
        </svg>

        {/* GLITCH LABEL */}
        <div className="absolute bottom-6 w-full text-center">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.3em] animate-scram">
            Istanbul Protocol // Unified Ma'at
          </span>
        </div>
      </div>
    </div>
  );
}