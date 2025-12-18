"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, Wind } from "lucide-react";

// --- SUB-COMPONENT: THE CYBER MOON ---
const CyberMoon = ({ progress, onClick, isClickable, label }: { progress: number, onClick?: () => void, isClickable?: boolean, label?: string }) => {
  let phaseIndex = 0; 
  if (progress < 0.5) {
    phaseIndex = Math.floor(progress * 2 * 4); 
  } else {
    phaseIndex = 4 + Math.floor((progress - 0.5) * 2 * 4);
  }
  if (phaseIndex > 8) phaseIndex = 8;

  const renderPhase = (index: number) => {
    const baseClasses = "w-full h-full text-cyan-400 transition-all duration-300";
    const glowClasses = isClickable 
        ? "drop-shadow-[0_0_25px_rgba(0,255,255,0.9)] cursor-pointer hover:text-cyan-200 hover:scale-105" 
        : "drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]";
    
    const commonClasses = `${baseClasses} ${glowClasses}`;

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
  
  return (
    <div onClick={isClickable ? onClick : undefined} className="w-32 h-32 relative group">
        {isClickable && label && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <span className="text-cyan-900 font-bold bg-cyan-400/90 px-2 py-1 rounded text-xs tracking-widest backdrop-blur-sm shadow-[0_0_10px_cyan] uppercase">
                    {label}
                </span>
            </div>
        )}
        {renderPhase(phaseIndex)}
    </div>
  );
};

// --- MAIN COMPONENT ---
export function KhonsuTimer({ onClose }: { onClose?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  
  // Custom Input State
  // We store RAW digits (e.g. "230") but display them formatted
  const [rawDigits, setRawDigits] = useState(""); 
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'setup' | 'burning' | 'done'>('setup');
  
  // Audio State
  const [audio] = useState(() => {
    if (typeof window === 'undefined') return { ambience: null, chime: null };
    return {
      ambience: new Audio("/sounds/reeds_loop.mp3"),
      chime: new Audio("/sounds/solemn_chime.wav") 
    };
  });

  const durations = [ { label: '2m', seconds: 120 }, { label: '5m', seconds: 300 }, { label: '10m', seconds: 600 } ];

  // Focus hidden input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isEditing]);

  // --- AUDIO MANAGER ---
  useEffect(() => {
    if (!audio.ambience) return;
    if (mode === 'burning' && isActive) {
        audio.ambience.loop = true;
        audio.ambience.volume = 0.4;
        audio.ambience.play().catch(e => console.log("Playback prevented:", e));
    } else {
        audio.ambience.pause();
        if (mode !== 'burning') {
             audio.ambience.currentTime = 0; 
        }
    }
    return () => { audio.ambience?.pause(); };
  }, [mode, isActive, audio.ambience]);

  // --- HELPER: FORMAT RAW DIGITS FOR DISPLAY ---
  // Takes "230" and returns "02:30"
  // Takes "5" and returns "00:05"
  const getFormattedDisplay = (digits: string) => {
    // Pad to at least 4 zeros: "230" -> "0230"
    const padded = digits.padStart(4, '0');
    // Grab the last 4 characters (MMSS)
    const normalized = padded.slice(-4);
    
    const mins = normalized.slice(0, 2);
    const secs = normalized.slice(2, 4);
    
    return `${mins}:${secs}`;
  };

  // --- HELPER: CALCULATE SECONDS ---
  const getSecondsFromDigits = (digits: string) => {
    if (!digits) return 0;
    const padded = digits.padStart(4, '0');
    const mins = parseInt(padded.slice(-4, -2));
    const secs = parseInt(padded.slice(-2));
    return (mins * 60) + secs;
  };

  const startRitual = (seconds: number) => {
    if(!seconds || seconds <= 0) return;
    setTotalTime(seconds);
    setTimeLeft(seconds);
    setMode('burning');
    setIsActive(true);
    setRawDigits(""); // Clear input
    setIsEditing(false);

    if (audio.chime) {
      audio.chime.volume = 0;
      audio.chime.play().then(() => {
          audio.chime.pause();
          audio.chime.currentTime = 0;
          audio.chime.volume = 1; 
      }).catch(() => {});
    }
  };

  const handleMoonClick = () => {
    if (mode === 'setup') {
        const secs = getSecondsFromDigits(rawDigits);
        if (secs > 0) {
            startRitual(secs);
        }
    } else if (mode === 'burning') {
        setIsActive(!isActive);
    }
  };

  const extinguish = () => {
    setIsActive(false);
    setMode('setup');
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setMode('done');
      if (audio.chime) audio.chime.play().catch(e => console.log(e));
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, audio]);

  const progress = mode === 'setup' ? 0 : mode === 'done' ? 1 : 1 - (timeLeft / totalTime);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const isInputValid = rawDigits.length > 0 && getSecondsFromDigits(rawDigits) > 0;
  const isMoonInteractive = (mode === 'setup' && isInputValid) || mode === 'burning';
  
  const getMoonLabel = () => {
      if (mode === 'setup') return "IGNITE";
      if (mode === 'burning') return isActive ? "SUSPEND" : "RESUME";
      return "";
  };

  const getStatusText = () => {
      if (mode === 'setup') return isInputValid ? "Touch the Moon to Begin" : "Awaiting Offering";
      if (mode === 'burning') return isActive ? "Time is Flowing" : "Time Suspended";
      if (mode === 'done') return "The Cycle is Complete";
      return "";
  };

  return (
    <div className="relative w-full h-[100dvh] md:h-[min(650px,85vh)] rounded-xl overflow-hidden flex flex-col justify-end bg-black border border-cyan-500/50 shadow-[0_0_50px_rgba(0,255,255,0.2)] text-white font-sans">
      <div className="absolute inset-0 z-0 bg-contain bg-center bg-no-repeat opacity-50 pointer-events-none" style={{ backgroundImage: "url('/images/khonsu-neon.png')" }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      {onClose && <button onClick={onClose} className="absolute top-4 right-4 z-50 text-cyan-500 hover:text-white"><X /></button>}

      <div className="relative z-10 flex flex-row items-end justify-between p-8 w-full mt-auto bg-gradient-to-t from-black to-transparent">
        
        <div className="flex flex-col items-start gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-display uppercase drop-shadow-sm">KHONSU RECKONS</h2>
                <p className={`text-xs font-mono mt-1 tracking-[0.3em] uppercase transition-colors ${!isActive && mode === 'burning' ? "text-red-400 animate-pulse" : "text-cyan-300/70"}`}>
                    {getStatusText()}
                </p>
            </div>

            <div className="p-3 bg-black/80 border-2 border-cyan-400 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.5)] min-w-[200px] text-center cursor-pointer hover:border-cyan-300 transition-colors"
                 onClick={() => mode === 'setup' && setIsEditing(true)}>
                
                {mode === 'setup' ? (
                    <div className="relative">
                        {/* THE VISUAL DISPLAY (Static with Colon) */}
                        <div className={`text-5xl font-mono tracking-tighter leading-none select-none ${isEditing ? "text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]" : "text-pink-500 drop-shadow-[0_0_10px_rgba(255,20,147,0.9)]"}`}>
                            {getFormattedDisplay(rawDigits)}
                        </div>

                        {/* THE INVISIBLE INPUT (Overlaid) */}
                        {isEditing && (
                            <input 
                                ref={inputRef}
                                type="tel" 
                                value={rawDigits}
                                onChange={(e) => {
                                    // Strip non-digits and cap at 4 chars (MMSS)
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    setRawDigits(val);
                                }}
                                onBlur={() => setIsEditing(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                                autoFocus
                            />
                        )}
                    </div>
                ) : (
                    <div className={`text-5xl font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(255,20,147,0.9)] leading-none ${isActive ? "text-pink-500" : "text-pink-900"}`}>
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            <div className="flex gap-2 flex-wrap items-center">
            {mode === 'setup' && (
                 durations.map(d => (
                    <Button key={d.label} onClick={() => startRitual(d.seconds)} variant="outline" size="sm" className="bg-black/50 backdrop-blur-md border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all tracking-wider min-w-[60px]">{d.label}</Button>
                ))
            )}

            {mode === 'burning' && (
                <Button onClick={extinguish} size="sm" className="bg-purple-950/80 border border-purple-500 text-purple-300 hover:bg-purple-900 hover:text-purple-100 transition-all tracking-wider backdrop-blur-md">End Cycle Early</Button>
            )}
            {mode === 'done' && (
                <Button onClick={extinguish} size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold animate-pulse shadow-[0_0_20px_cyan]"><Wind className="mr-2 h-4 w-4"/> Close The Cycle</Button>
            )}
            </div>
        </div>

        <div className="mb-4 mr-4 transition-all duration-1000 filter">
            <CyberMoon 
                progress={progress} 
                isClickable={isMoonInteractive} 
                onClick={handleMoonClick}
                label={getMoonLabel()}
            />
        </div>
      </div>
    </div>
  );
}