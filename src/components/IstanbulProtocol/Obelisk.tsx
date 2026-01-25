// src/components/IstanbulProtocol/Obelisk.tsx
import React from 'react';

export const Obelisk = ({ ritualStage, color = "#00FFFF" }: { ritualStage: number, color?: string }) => {
  const ink = color; // Connected to the Logic Flame
  const sw = 0.24;
  // Logic: 
  // Stage 0: Dark Iron Stone (#1a1a1a) with subtle yellow outline
  // Stage 1+: The stone begins to glow from within
  const shaftStroke = ritualStage === 0 ? "#666600" : ink;
  // Setting fill to none or transparent for the Inspection Phase
  const shaftFill = ritualStage >= 2 ? "none" : "none"; 

  return (
    <g id="obelisk-structure" className="animate-float-slow">
      {/* THE MAIN SHAFT: Truncated to 240 */}
      <path
        id="obelisk-outline"
        
        d="M 12.6, 245.5 L 15.688, 30.612 H 39.311 L 42.4, 245.5 Z"
        fill={shaftFill}
        stroke={shaftStroke}
        strokeWidth="0.3"
        strokeLinejoin="round"
        style={{ transition: "all 2s ease-in-out" }}
      />
      
      {/* THE CAPSTONE (The Benben Stone): Remains at the Summit */}
      {/* THE CAPSTONE (The Benben Stone) - Resonant Cyber Red */}
<path
  id="capstone"
  d="M 15.588,30.612 27.5,10.388 39.4,30.612 Z"
  fill="#db0909" // Deep base red
  stroke="#8b0000" // Vibrant red edge
  strokeWidth="0.2"
  className={`transition-all duration-1000 ${
    ritualStage >= 2 
      ? "drop-shadow-[0_0_15px_rgba(255,0,0.8)] fill-red-700" 
      : "drop-shadow-[0_0_5px_rgba(139,0,0,0.5)]"
  }`}
  style={{
    filter: ritualStage >= 2 ? 'drop-shadow(0 0 3px #ff0000)' : 'none'
  }}
/>

      <style jsx global>{`
        @keyframes obelisk-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-float-slow {
          animation: obelisk-float 10s ease-in-out infinite;
        }
      `}</style>
    </g>
  );
};