"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, Wind } from "lucide-react";

// --- SUB-COMPONENT: THE CYBER MOON ---
const CyberMoon = ({ progress }: { progress: number }) => {
  let phaseIndex = 0; 
  if (progress < 0.5) {
    phaseIndex = Math.floor(progress * 2 * 4); 
  } else {
    phaseIndex = 4 + Math.floor((progress - 0.5) * 2 * 4);
  }
  if (phaseIndex > 8) phaseIndex = 8;

  const renderPhase = (index: number) => {
    const commonClasses = "w-full h-full text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]";
    switch(index) {
        case 0: case 8: return <svg viewBox="0 0 100 100" className={commonClasses}><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/></svg>;
        case 1: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 1 50 95 A35 45 0 0 0 50 5 Z" fill="currentColor"/></svg>;
        case 2: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 1 50 95 L50 5 Z" fill="currentColor"/></svg>;
        case 3: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 1 50 95 A35 45 0 0 1 50 5 Z" fill="currentColor"/></svg>;
        case 4: return <svg viewBox="0 0 100 100" className={`${commonClasses} animate-pulse`}><circle cx="50" cy="50" r="45" fill="currentColor" /></svg>;
        case 5: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 0 50 95 A35 45 0 0 0 50 5 Z" fill="currentColor"/></svg>;
        case 6: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 0 50 95 L50 5 Z" fill="currentColor"/></svg>;
        case 7: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 0 50 95 A35 45 0 0 1 50 5 Z" fill="currentColor"/></svg>;
        default: return null;
    }
  }
  return <div className="w-32 h-32">{renderPhase(phaseIndex)}</div>;
};

// --- MAIN COMPONENT ---
export function KhonsuTimer({ onClose }: { onClose?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'setup' | 'burning' | 'done'>('setup');
  
  // Audio State
  const [audio] = useState(() => {
    if (typeof window === 'undefined') return { ambience: null, chime: null };
    return {
      ambience: new Audio("/sounds/reeds_loop.mp3"),
      chime: new Audio("/sounds/solemn_chime.wav") // Updated to .wav as confirmed
    };
  });

  const durations = [ { label: '2m', seconds: 120 }, { label: '5m', seconds: 300 }, { label: '10m', seconds: 600 }, { label: '20m', seconds: 1200 } ];

  // --- AUDIO MANAGER (The Fix) ---
  // This effect guarantees the reeds play ONLY when 'burning', and stop otherwise.
  useEffect(() => {
    if (!audio.ambience) return;

    if (mode === 'burning') {
        audio.ambience.loop = true;
        audio.ambience.volume = 0.4;
        audio.ambience.play().catch(e => console.log("Playback prevented:", e));
    } else {
        // If mode is 'setup' or 'done', FORCE stop.
        audio.ambience.pause();
        audio.ambience.currentTime = 0;
    }

    // CLEANUP: If user closes the window (unmounts), kill the sound.
    return () => {
        audio.ambience?.pause();
    };
  }, [mode, audio.ambience]);


  const startRitual = (seconds: number) => {
    setTotalTime(seconds);
    setTimeLeft(seconds);
    setMode('burning');
    setIsActive(true);

    // Prime the chime (silent play) so browser allows it later
    if (audio.chime) {
      audio.chime.volume = 0;
      audio.chime.play().then(() => {
          audio.chime.pause();
          audio.chime.currentTime = 0;
          audio.chime.volume = 1; 
      }).catch(() => {});
    }
  };

  const extinguish = () => {
    setIsActive(false);
    setMode('setup');
    // Audio stops automatically via the useEffect above!
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setMode('done');
      
      // Trigger Chime
      if (audio.chime) audio.chime.play().catch(e => console.log(e));
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, audio]);

  const progress = mode === 'setup' ? 0 : mode === 'done' ? 1 : 1 - (timeLeft / totalTime);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative w-full h-[650px] rounded-xl overflow-hidden flex flex-col justify-end bg-black border border-cyan-500/50 shadow-[0_0_50px_rgba(0,255,255,0.2)] text-white font-sans">
      <div className="absolute inset-0 z-0 bg-contain bg-center bg-no-repeat opacity-50 pointer-events-none" style={{ backgroundImage: "url('/images/khonsu-neon.png')" }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      {onClose && <button onClick={onClose} className="absolute top-4 right-4 z-50 text-cyan-500 hover:text-white"><X /></button>}

      <div className="relative z-10 flex flex-row items-end justify-between p-8 w-full mt-auto bg-gradient-to-t from-black to-transparent">
        
        <div className="flex flex-col items-start gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-display uppercase drop-shadow-sm">KHONSU RECKONS</h2>
                <p className="text-cyan-300/70 text-xs font-mono mt-1 tracking-[0.3em] uppercase">{mode === 'burning' ? "Time is Flowing" : "Awaiting Offering"}</p>
            </div>

            <div className="p-3 bg-black/80 border-2 border-cyan-400 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                <div className="text-5xl font-mono tracking-tighter text-pink-500 drop-shadow-[0_0_10px_rgba(255,20,147,0.9)] leading-none">
                {mode === 'setup' ? "00:00" : formatTime(timeLeft)}
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
            {mode === 'setup' && durations.map(d => (
                <Button key={d.label} onClick={() => startRitual(d.seconds)} variant="outline" size="sm" className="bg-black/50 backdrop-blur-md border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all tracking-wider min-w-[60px]">{d.label}</Button>
            ))}
            {mode === 'burning' && (
                <Button onClick={extinguish} size="sm" className="bg-purple-950/80 border border-purple-500 text-purple-300 hover:bg-purple-900 hover:text-purple-100 transition-all tracking-wider backdrop-blur-md">End Cycle Early</Button>
            )}
            {mode === 'done' && (
                <Button onClick={extinguish} size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold animate-pulse shadow-[0_0_20px_cyan]"><Wind className="mr-2 h-4 w-4"/> Close The Cycle</Button>
            )}
            </div>
        </div>

        <div className="mb-4 mr-4 transition-all duration-1000 filter drop-shadow-[0_0_20px_rgba(0,255,255,0.4)]">
            <CyberMoon progress={progress} />
        </div>
      </div>
    </div>
  );
}