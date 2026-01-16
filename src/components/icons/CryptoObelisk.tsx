"use client";

import React from 'react';

export function CryptoObeliskIcon({ size = 400, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size * 2.5} 
      viewBox="0 0 100 250" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 🏺 The Pyramidion (The Golden Capstone) */}
      <path d="M50 5L35 35H65L50 5Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1"/>
      
      {/* 🗿 The Main Shaft */}
      <path d="M35 35L30 240H70L65 35H35Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>
      
      {/* 📜 Faint Etchings (The Placeholder Glyphs) */}
      <g opacity="0.3" stroke="currentColor" strokeWidth="1">
        <path d="M45 60h10M45 80h10M48 100h4M42 120h16" />
        <circle cx="50" cy="150" r="5" />
        <path d="M45 180l5 5 5-5" />
      </g>
    </svg>
  );
}