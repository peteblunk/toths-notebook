"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, Play, Pause, RotateCcw } from "lucide-react";

// --- SUB-COMPONENT: THE CYBER MOON ---
const CyberMoon = ({ progress, onClick, isClickable, isMerkhet }: {
  progress: number,
  onClick?: () => void,
  isClickable?: boolean,
  isMerkhet: boolean
}) => {
  let phaseIndex = 0;
  if (progress < 0.5) {
    phaseIndex = Math.floor(progress * 2 * 4);
  } else {
    phaseIndex = 4 + Math.floor((progress - 0.5) * 2 * 4);
  }
  if (phaseIndex > 8) phaseIndex = 8;

  const renderPhase = (index: number) => {
    const colorClass = isMerkhet ? "text-rose-600" : "text-cyan-400";
    const glowColor = isMerkhet ? "rgba(255,0,60,1)" : "rgba(0,255,255,0.9)";
    const shadowClass = isMerkhet ? "rgba(255,0,60,0.8)" : "rgba(0,255,255,0.6)";

    const baseClasses = `w-full h-full ${colorClass} transition-all duration-300`;
    const glowClasses = isClickable
      ? `drop-shadow-[0_0_35px_${glowColor}] cursor-pointer hover:scale-110`
      : `drop-shadow-[0_0_15px_${shadowClass}]`;

    const commonClasses = `${baseClasses} ${glowClasses}`;

    switch (index) {
      case 0: case 8: return <svg viewBox="0 0 100 100" className={commonClasses}><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" /></svg>;
      case 1: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 1 50 95 A35 45 0 0 0 50 5 Z" fill="currentColor" /></svg>;
      case 2: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 1 50 95 L50 5 Z" fill="currentColor" /></svg>;
      case 3: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 1 50 95 A35 45 0 0 1 50 5 Z" fill="currentColor" /></svg>;
      case 4: return <svg viewBox="0 0 100 100" className={commonClasses}><circle cx="50" cy="50" r="45" fill="currentColor" /></svg>;
      case 5: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 0 50 95 A35 45 0 0 0 50 5 Z" fill="currentColor" /></svg>;
      case 6: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 0 50 95 L50 5 Z" fill="currentColor" /></svg>;
      case 7: return <svg viewBox="0 0 100 100" className={commonClasses}><path d="M50 5 A45 45 0 0 0 50 95 A35 45 0 0 1 50 5 Z" fill="currentColor" /></svg>;
      default: return null;
    }
  }

  return (
    <div onClick={isClickable ? onClick : undefined} className="w-32 h-32 relative">
      {renderPhase(phaseIndex)}
    </div>
  );
};

export function KhonsuTimer({ onClose }: { onClose?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMerkhet, setIsMerkhet] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [mode, setMode] = useState<'setup' | 'burning' | 'done'>('setup');
  const [rawDigits, setRawDigits] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const durations = [{ label: '2m', seconds: 120 }, { label: '5m', seconds: 300 }, { label: '10m', seconds: 600 }];

  // --- 6-DIGIT SYNCED LOGIC ---
  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFormattedInput = (digits: string) => {
    const padded = digits.padStart(6, '0').slice(-6);
    const hrs = parseInt(padded.slice(0, 2));
    const mins = padded.slice(2, 4);
    const secs = padded.slice(4, 6);
    return `${hrs}:${mins}:${secs}`;
  };

  const handleKhonsuTap = () => {
    setTapCount(prev => {
      const next = prev + 1;
      if (next === 4) {
        setIsMerkhet(!isMerkhet);
        resetAll();
        return 0;
      }
      return next;
    });
    setTimeout(() => setTapCount(0), 2000);
  };

  useEffect(() => {
    if (!isActive || !isMerkhet) return;
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 150);
      }
    }, 3000);
    return () => clearInterval(glitchInterval);
  }, [isActive, isMerkhet]);

  const progress = isMerkhet
    ? (elapsedTime % 3600) / 3600
    : (mode === 'setup' ? 0 : mode === 'done' ? 1 : 1 - (timeLeft / (totalTime || 1)));

  const startRitual = (seconds: number) => {
    if (!seconds || seconds <= 0) return;
    setTotalTime(seconds);
    setTimeLeft(seconds);
    setMode('burning');
    setIsActive(true);
    setRawDigits("");
    setIsEditing(false);
  };

  const resetAll = () => {
    setIsActive(false);
    setMode('setup');
    setElapsedTime(0);
    setTimeLeft(0);
    setTotalTime(0);
    setRawDigits("");
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        if (isMerkhet) setElapsedTime(prev => prev + 1);
        else {
          if (timeLeft > 0) setTimeLeft(prev => prev - 1);
          else { setIsActive(false); setMode('done'); }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isMerkhet]);

  const timeString = isMerkhet
    ? formatTime(elapsedTime)
    : (mode === 'setup' ? getFormattedInput(rawDigits) : formatTime(timeLeft));

  const timeChars = timeString.split("");

  return (
    <div className={`relative w-full h-[100dvh] md:h-[min(650px,85vh)] rounded-2xl overflow-hidden flex flex-col justify-end bg-black border ${isMerkhet ? 'border-rose-900/60 shadow-[0_0_60px_rgba(255,0,60,0.1)]' : 'border-cyan-900/60 shadow-[0_0_50px_rgba(0,255,255,0.2)]'} transition-all duration-1000`}>

      <style jsx>{`
        @keyframes glitch-shake {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(-2px, -1px); }
          60% { transform: translate(2px, 1px); }
          80% { transform: translate(2px, -1px); }
          100% { transform: translate(0); }
        }
        .glitch-active {
          animation: glitch-shake 0.15s infinite;
          filter: brightness(2) contrast(1.5) blur(0.5px);
        }
      `}</style>

      <div
        onClick={handleKhonsuTap}
        className="absolute inset-0 z-0 bg-contain bg-center bg-no-repeat opacity-30 cursor-crosshair"
        style={{ backgroundImage: "url('/images/khonsu-neon.png')", backgroundBlendMode: "screen" }}
      />

      {onClose && <button onClick={onClose} className={`absolute top-4 right-4 z-50 ${isMerkhet ? 'text-rose-500' : 'text-cyan-500'} hover:text-white`}><X /></button>}

      <div className="relative z-20 flex flex-row items-end justify-between p-10 w-full mt-auto bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="flex flex-col items-start gap-6">
          <div>
            <h2 className={`text-2xl font-bold tracking-[0.2em] font-display uppercase transition-colors ${isMerkhet ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
              {isMerkhet ? "CHRONO-MERKHET" : "KHONSU RECKONS"}
            </h2>
            <p className={`text-[9px] font-headline mt-1 tracking-[0.4em] uppercase ${isMerkhet ? 'text-red-500/90 font-bold' : 'text-cyan-500/50'}`}>
              {mode === 'setup' ? "Awaiting Offering" : isActive ? "Circuit Flow Active" : "Circuit Flow Suspended"}
            </p>
          </div>

          <div className="space-y-4">
            {/* THE CLOCK BOX: Widened slightly for safe HH:MM:SS entry */}
            <div 
              className={`group relative p-2 bg-black/40 backdrop-blur-md border-2 rounded-[1rem] w-[140px] h-[54px] flex items-center justify-center transition-all duration-500
              ${isMerkhet 
                ? `border-rose-600 shadow-[0_0_20px_rgba(255,0,60,0.2)] ${isGlitching ? 'glitch-active border-rose-300' : ''}` 
                : 'border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.15)]'}`}
              onClick={() => !isMerkhet && mode === 'setup' && setIsEditing(true)}
            >
              <div className={`flex flex-row items-baseline justify-center w-full px-2 tabular-nums font-headline text-3xl tracking-normal transition-all
                ${isMerkhet 
                  ? `text-rose-500 drop-shadow-[0_0_10px_rgba(255,0,60,0.8)]` 
                  : (isEditing ? "text-cyan-300 animate-pulse" : "text-pink-500 drop-shadow-[0_0_8px_rgba(255,20,147,0.7)]")}`}>
                
                {timeChars.map((char, index) => (
                  <span 
                    key={index} 
                    className={`inline-flex justify-center ${char === ':' ? 'w-[10px]' : 'w-[20px]'} transition-all duration-100`}
                  >
                    {char}
                  </span>
                ))}
              </div>

              {isEditing && !isMerkhet && (
                <input 
                  ref={inputRef}
                  type="text" 
                  inputMode="numeric"
                  value={rawDigits}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setRawDigits(val);
                  }}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditing(false);
                      const padded = rawDigits.padStart(6, '0').slice(-6);
                      const h = parseInt(padded.slice(0, 2));
                      const m = parseInt(padded.slice(2, 4));
                      const s = parseInt(padded.slice(4, 6));
                      const totalSecs = (h * 3600) + (m * 60) + s;
                      if (totalSecs > 0) startRitual(totalSecs);
                    }
                  }}
                  autoFocus
                  className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-text"
                />
              )}
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              {mode === 'setup' && !isMerkhet && (
                durations.map(d => (
                  <Button key={d.label} onClick={() => startRitual(d.seconds)} variant="outline" size="sm" className="bg-black/50 backdrop-blur-md border-cyan-800 text-cyan-500 hover:bg-cyan-500 hover:text-black font-headline text-[9px] tracking-[0.2em]">{d.label}</Button>
                ))
              )}
              {mode === 'burning' && (
                <Button onClick={() => setIsActive(!isActive)} variant="ghost" size="sm" className={`border rounded-xl ${isMerkhet ? 'border-rose-800 text-rose-500 hover:bg-rose-950' : 'border-cyan-800 text-cyan-400 hover:bg-cyan-950'} font-headline text-[9px] tracking-[0.2em] uppercase px-4`}>
                  {isActive ? "Suspend" : "Resume"}
                </Button>
              )}
              {(mode === 'burning' || mode === 'done') && (
                <Button onClick={resetAll} variant="ghost" size="sm" className={`border rounded-xl ${isMerkhet ? 'border-rose-950 text-rose-900' : 'border-purple-900 text-purple-700'} font-headline text-[9px] tracking-[0.2em] uppercase px-4`}>
                  Reset Cycle
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 mr-6">
          <CyberMoon
            progress={progress}
            isClickable={true}
            onClick={() => {
              if (mode === 'setup' && !isMerkhet) {
                const padded = rawDigits.padStart(6, '0').slice(-6);
                const h = parseInt(padded.slice(0, 2));
                const m = parseInt(padded.slice(2, 4));
                const s = parseInt(padded.slice(4, 6));
                const totalSecs = (h * 3600) + (m * 60) + s;
                if (totalSecs > 0) startRitual(totalSecs);
              } else {
                if (mode === 'setup') setMode('burning');
                setIsActive(!isActive);
              }
            }}
            isMerkhet={isMerkhet}
          />
        </div>
      </div>
    </div>
  );
}