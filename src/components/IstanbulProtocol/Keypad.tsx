// components/IstanbulProtocol/Keypad.tsx
"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const Keypad = ({ isVisible }: { isVisible: boolean }) => {
  // 3 Columns, 4 Rows
  const rows = 4;
  const cols = 3;
  const keyW = 2.8;
  const keyH = 3.2;
  const gap = 0.4;

  return (
    <motion.g 
      id="keypad-terminal"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 2 }}
    >
      {/* 1. THE GLASS PANEL BACKGROUND */}
      <rect 
        width="10" height="15" rx="1" 
        fill="rgba(0, 10, 5, 0.9)" // Deep obsidian green
        stroke="#00ff41" 
        strokeWidth="0.1" 
        className="drop-shadow-[0_0_2px_#00ff41]"
      />

      {/* 2. THE 3x4 GRID SCAN */}
      <g transform="translate(0.4, 0.8)">
        {[...Array(rows)].map((_, r) => 
          [...Array(cols)].map((_, c) => (
            <motion.rect
              key={`${r}-${c}`}
              x={c * (keyW + gap)}
              y={r * (keyH + gap)}
              width={keyW}
              height={keyH}
              rx="0.3"
              fill="none"
              stroke="#333" // Dim grey keys
              strokeWidth="0.05"
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 0.4 : 0 }}
              transition={{ delay: (r * cols + c) * 0.05 }}
            />
          ))
        )}
      </g>

      {/* 3. TERMINAL STATUS TEXT */}
      <text 
        x="5" y="14.2" 
        textAnchor="middle" 
        fill="#00ff41" 
        fontSize="0.6" 
        fontFamily="monospace" 
        className="opacity-50"
      >
        [ STATUS: LINK_READY ]
      </text>
    </motion.g>
  );
};