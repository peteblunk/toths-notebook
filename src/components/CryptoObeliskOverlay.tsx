"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CryptoObeliskIcon } from './icons/CryptoObelisk';
import { IstanbulDial } from './IstanbulDial';
import { X } from 'lucide-react';

export function CryptoObeliskOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [knocks, setKnocks] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleKnock = () => {
    const nextKnock = knocks + 1;
    setKnocks(nextKnock);
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    
    if (nextKnock >= 3) {
      setIsRevealed(true);
      if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 200]);
    }
  };

  return (
    <>
      {/* 🏛️ TRIGGER BUTTON (Styled like your Main Hall button) */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-amber-500/50 bg-amber-950/20 active:scale-95 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)] w-full max-w-xs"
      >
        <CryptoObeliskIcon size={60} className="text-amber-500 mb-2" />
        <span className="font-headline font-bold text-[10px] tracking-widest uppercase text-amber-400">
          The Crypto-Obelisk
        </span>
      </button>

      {/* 🌌 FULL SCREEN OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
          >
            {/* Close Button */}
            <button 
              onClick={() => {setIsOpen(false); setIsRevealed(false); setKnocks(0);}}
              className="absolute top-10 right-10 text-cyan-500/50 hover:text-cyan-400"
            >
              <X size={32} />
            </button>

            {!isRevealed ? (
              <motion.div 
                onClick={handleKnock}
                className="flex flex-col items-center cursor-pointer"
                whileTap={{ y: 5, scale: 0.98 }}
              >
                <CryptoObeliskIcon size={250} className="text-cyan-500/40 drop-shadow-[0_0_30px_rgba(34,211,238,0.2)]" />
                <p className="mt-8 font-headline text-amber-500 text-[10px] tracking-[0.5em] animate-pulse">
                  KNOCK THRICE TO AWAKEN
                </p>
                <div className="flex gap-2 mt-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full border border-amber-500 ${knocks >= i ? 'bg-amber-500 shadow-[0_0_8px_#fbbf24]' : ''}`} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md"
              >
                <IstanbulDial />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}