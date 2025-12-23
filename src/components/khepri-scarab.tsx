"use client";

import { motion } from "framer-motion";
import { ScarabIcon } from "./icons/scarab-icon";
import { useState } from "react";

// This transforms your static icon into a living entity
const MotionScarab = motion(ScarabIcon);

export const KhepriScarab = ({ onInitiate }: { onInitiate: () => void }) => {
  const [isHatching, setIsHatching] = useState(false);

  return (
    <motion.div 
      onClick={() => { 
        setIsHatching(true); 
        setTimeout(onInitiate, 1500); 
      }} 
      className="cursor-pointer active:scale-95 transition-transform p-4"
      initial="idle"
      animate={isHatching ? "open" : "shimmer"}
    >
      <MotionScarab
        className="w-64 h-64 text-cyan-400"
        variants={{
          shimmer: {
            filter: [
              "drop-shadow(0 0 8px rgba(34,211,238,0.4))",
              "drop-shadow(0 0 15px rgba(16,185,129,0.6))",
              "drop-shadow(0 0 8px rgba(34,211,238,0.4))"
            ],
            transition: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          },
          open: {
            filter: "drop-shadow(0 0 30px rgba(34,211,238,0.9))",
            transition: { duration: 0.5 }
          }
        }}
      >
        {/* We reach into the ScarabIcon via Framer Motion's select-by-ID capability */}
        <motion.g 
          id="left-wing" 
          variants={{
            open: { rotate: -75, x: -10, transition: { type: "spring", stiffness: 40 } }
          }}
        />
        <motion.g 
          id="right-wing" 
          variants={{
            open: { rotate: 75, x: 10, transition: { type: "spring", stiffness: 40 } }
          }}
        />
        <motion.circle 
          id="solar-orb"
          variants={{
            open: { scale: 1.8, fill: "rgba(34,211,238,1)", transition: { duration: 0.8 } }
          }}
        />
      </MotionScarab>
    </motion.div>
  );
};