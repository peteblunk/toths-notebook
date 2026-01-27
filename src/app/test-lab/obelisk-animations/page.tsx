"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Obelisk } from '@/components/IstanbulProtocol/Obelisk';
import { HeroGlyphs } from '@/components/IstanbulProtocol/HeroGlyphs';
import { VariousGlyphs } from '@/components/IstanbulProtocol/VariousGlyphs';
import { Pedestal } from '@/components/IstanbulProtocol/Pedestal';
import { Keypad } from '@/components/IstanbulProtocol/Keypad';

export default function ObeliskAnimationsLab() {
  const [stage, setStage] = useState('summit'); // 'summit' | 'descending' | 'anchored' | 'totality'
  const [knockCount, setKnockCount] = useState(0);
  const maatX = 42.5;

  const views = {
    summit: "07 0 40 40",
    landing: "07 235 40 40",
    anchored: "-10 235 65 65",
    totality: "-25 0 100 300",
    panelZoom: "19.5 253 15 20" // Focused tightly on the Emperor and Panel
  };
  const RITUAL_TIMINGS = {
    settle: 1000,
    descent: 1,    // Seconds
    anchor: 1,    // Seconds to reveal pedestal
    totality: 5,    // Seconds for the grand pull-back
    keypad: 10     // Seconds for the final zoom
  };
  const handleKnock = () => {
    if (stage === 'totality' && knockCount < 3) {
      setKnockCount(prev => prev + 1);
    }
  };
  // The Chromatic Logic
  const getHeroColor = () => {
    if (knockCount === 0) return "#00FFFF"; // Cyber Cyan
    if (knockCount === 1) return "#6a0dad"; // Dim Thoth Purple
    if (knockCount === 2) return "#a020f0"; // Bright Thoth Purple
    return "#00ff41"; // Matrix/Ritual Green
  };

  const getPanelOpacity = () => knockCount * 0.33;

  const [isMigrating, setIsMigrating] = useState(false);
  const getOrbitCoords = (index: number, total: number = 12) => {
  const radius = 12; // How far they orbit from the panel center
  const centerX = 27.1;
  const centerY = 261.5;
  const angle = (index / total) * 2 * Math.PI;
  
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
};

  useEffect(() => {
  if (knockCount === 3) {
    // 1. Brief pause to admire the Green (2 seconds)
    const migrationTimer = setTimeout(() => {
      setIsMigrating(true);
    }, 2000);

    return () => clearTimeout(migrationTimer);
  }
}, [knockCount]);

  useEffect(() => {
    const startTimer = setTimeout(() => setStage('descending'), RITUAL_TIMINGS.settle);

    const anchorTimer = setTimeout(() => {
      setStage('anchored');
    }, RITUAL_TIMINGS.settle + (RITUAL_TIMINGS.descent * 1000));

    const totalityTimer = setTimeout(() => {
      setStage('totality');
    }, RITUAL_TIMINGS.settle + (RITUAL_TIMINGS.descent * 1000) + 2000); // 2s pause on pedestal

    return () => {
      clearTimeout(startTimer);
      clearTimeout(anchorTimer);
      clearTimeout(totalityTimer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden touch-none"
      onClick={handleKnock} // The Screen is the Stone
    >
      <div className="w-full h-full max-w-[500px] aspect-[1/2] flex items-center justify-center">
        <motion.svg 
  animate={{ 
    viewBox: isMigrating ? views.panelZoom : 
             (knockCount === 3 ? views.totality : 
             (stage === 'totality' ? views.totality : 
             (stage === 'anchored' ? views.anchored : views.landing)))
  }}

          /* THE CORRECTED TRANSITION LOGIC */
          transition={{
            duration:
            isMigrating ? 4 : // The Grand Terminal Zoom
              stage === 'descending' ? RITUAL_TIMINGS.descent :
                stage === 'anchored' ? RITUAL_TIMINGS.anchor :
                  stage === 'totality' ? RITUAL_TIMINGS.totality :
                    knockCount === 3 ? RITUAL_TIMINGS.keypad : 0.8,

            ease: [0.45, 0.05, 0.55, 0.95]
          }}
          className="w-full h-full"
        >
{/* 1. THE FLOATING ASSEMBLY (Shaft + Various Glyphs) */}
 {/* 1. THE SHARED VESSEL: Everything here bobs together */}
<g className={isMigrating ? "" : "animate-float-slow"}>
  
  {/* THE STONE */}
  <Obelisk ritualStage={2} color="#00FFFF" capstoneColor={getHeroColor()} />
  
  {/* THE VARIOUS GLYPHS (Static to the stone) */}
  <g transform={`translate(${maatX - 43}, 0)`}>
    <motion.g animate={{ opacity: 1 - (knockCount * 0.25) }}>
      <VariousGlyphs ritualStage={2} />
    </motion.g>
  </g>

  {/* THE HERO GLYPHS (Now back inside the float group, but with their own motion) */}
  <motion.g 
    initial={{ x: maatX - 43, y: 0 }}
    animate={{ 
      x: maatX - 43, 
      y: isMigrating ? 245 : 0,
      // We only rotate once they've cleared the stone
      rotate: isMigrating ? 360 : 0 
    }}
    transition={{ 
      y: { duration: 3, ease: "circIn" },
      rotate: { duration: 10, repeat: Infinity, ease: "linear" } 
    }}
    style={{ transformOrigin: "27.1px 261.5px" }}
  >
    <HeroGlyphs 
      ritualStage={2} 
      color={getHeroColor()} 
      isMigrating={isMigrating} 
    />
  </motion.g>
</g>
        {/* 3. THE STATIONARY ANCHOR (Unified Pedestal & Interface) */}
        <g transform="translate(0.5, 6.0)">
          <Pedestal ritualStage={2} />
          
          {/* THE NEW PANEL: Illuminates with knocks */}
          <motion.rect
            x="22.1" y="254" width="10" height="15" rx="1"
            fill="none"
            stroke="#00ff41"
            strokeWidth="0.2"
            animate={{ opacity: getPanelOpacity() }}
            className="drop-shadow-[0_0_5px_#00ff41]"
          />

          {/* THE KEYPAD TERMINAL: Wakes up when migrating */}
          <g transform="translate(22.1, 254)">
            <Keypad isVisible={isMigrating} />
          </g>
        </g>
      </motion.svg>
    </div>

    {/* Progress HUD */}
    <div className="absolute top-10 font-mono text-[10px] text-purple-500/50 uppercase tracking-[0.3em]">
      {isMigrating ? "PROTOCOL: MIGRATION_ACTIVE" : `KNOCK_SEQUENCE: ${knockCount}/3`}
    </div>
  </div>
);
}