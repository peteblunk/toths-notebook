import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Obelisk } from './Obelisk';
import { HeroGlyphs } from './HeroGlyphs';
import { VariousGlyphs } from './VariousGlyphs';
import { Pedestal } from './Pedestal';
import { NedjemBastet } from './NedjemBastet';

export const ObeliskGuardian = ({ onRitualComplete }: { onRitualComplete: () => void }) => {
  const [knocks, setKnocks] = useState(0);
  const [ritualStage, setRitualStage] = useState(0); // 0: Stone, 1: Cyan, 2: Quickened, 3: Eye Revealed, 4: Sling
  const [isAwakened, setIsAwakened] = useState(false);

  const handleInteraction = () => {
    if (!isAwakened) {
      const nextKnock = knocks + 1;
      setKnocks(nextKnock);
      if (nextKnock >= 3) setIsAwakened(true);
      return;
    }

    // After awakening, proceed through ritual stages
    if (ritualStage < 3) setRitualStage(prev => prev + 1);
  };

  return (
    <div className="flex items-center justify-center w-full h-[600px] cursor-pointer">
      <motion.svg
        viewBox={isAwakened ? "0 0 55 297" : "0 70 55 100"} // Zoomed in on Horus until awakened
        onClick={handleInteraction}
        className="h-full w-auto"
      >
        <motion.g id="main-monument">
          {/* If ritualStage is 0 and isAwakened is false, use stone colors */}
          <Obelisk ritualStage={isAwakened ? ritualStage : 0} />
          <VariousGlyphs ritualStage={isAwakened ? ritualStage : 0} />
          <HeroGlyphs ritualStage={isAwakened ? ritualStage : 0} />
          
          {isAwakened && (
            <>
              <Pedestal ritualStage={ritualStage} />
              <NedjemBastet 
                ritualStage={ritualStage} 
                onEyeClick={() => setRitualStage(4)} 
              />
            </>
          )}
        </motion.g>

        {/* GUIDANCE TEXT */}
        {!isAwakened && (
           <text x="27.5" y="160" textAnchor="middle" fill="#fbbf24" fontSize="3" className="uppercase tracking-widest animate-pulse">
             Knock {3 - knocks}x to Awaken
           </text>
        )}
      </motion.svg>
    </div>
  );
};