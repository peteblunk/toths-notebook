"use client";

import { motion } from "framer-motion";
import { KhepriIconMotion } from "./icons/khepri-icon-motion";
import { useState } from "react";

// We keep the wrapper, but we'll use 'variants' to propagate the animation 
// down to the internal IDs if we convert KhepriIcon's internals.
const MotionScarab = motion(KhepriIconMotion);

export const KhepriScarab = ({ onInitiate }: { onInitiate: () => void }) => {
  const [isHatching, setIsHatching] = useState(false);

  // The Etching Sequence: Orb -> Structure -> Feathers
  const containerVariants = {
    shimmer: {
      filter: [
        "drop-shadow(0 0 5px rgba(34,211,238,0.2))",
        "drop-shadow(0 0 12px rgba(34,211,238,0.4))",
        "drop-shadow(0 0 5px rgba(34,211,238,0.2))"
      ],
      transition: { duration: 4, repeat: Infinity }
    },
    hatching: {
      filter: "drop-shadow(0 0 25px rgba(34,211,238,0.8))",
      transition: { 
        staggerChildren: 0.1, // This is the 'Etching' delay between parts
        duration: 0.5 
      }
    }
  };

  return (
    <motion.div 
      onClick={() => { 
        if (!isHatching) {
          setIsHatching(true); 
          // We wait for the 'etching' to finish before moving to the next Chronicle step
          setTimeout(onInitiate, 2000); 
        }
      }} 
      className="cursor-pointer active:scale-90 transition-transform p-4"
      initial="shimmer"
      animate={isHatching ? "hatching" : "shimmer"}
      variants={containerVariants}
    >
      <MotionScarab
        className="w-64 h-64 text-black" // Black ink on your white card
        /* NOTE: To make the inner wings move, we must eventually 
           replace the static paths in khepri-icon.tsx with motion.path 
        */
      />
      
      {isHatching && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-[-20px] text-cyan-500 font-headline text-[10px] uppercase tracking-widest"
        >
          Etching Record...
        </motion.p>
      )}
    </motion.div>
  );
};