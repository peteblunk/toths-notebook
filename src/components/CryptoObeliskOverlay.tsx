"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CryptoObeliskIcon } from './icons/CryptoObelisk';
import { IstanbulDial } from './IstanbulDial';
import { X } from 'lucide-react';
import { ObeliskGuardian } from './IstanbulProtocol/ObeliskGuardian';

export function CryptoObeliskOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [knocks, setKnocks] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  const handleKnock = () => {
    if (knocks < 2) {
      setKnocks(prev => prev + 1);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    } else {
      // THIRD KNOCK: Force the switch
      if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 200]);
      setIsRevealed(true);
    }
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button onClick={() => setIsOpen(true)} className="...">
        <CryptoObeliskIcon size={60} className="text-amber-500 mb-2" />
        <span className="...">The Crypto-Obelisk</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6"
          >
            {/* Close Button */}
            <button 
              onClick={() => {setIsOpen(false); setIsRevealed(false); setKnocks(0); setShowKeypad(false);}}
              className="absolute top-10 right-10 text-cyan-500 z-[110]"
            >
              <X size={32} />
            </button>

            {/* THE LOGIC GATE */}
            <div className="w-full h-full flex items-center justify-center">
              {!isRevealed ? (
                <motion.div 
                  key="knocker"
                  onClick={handleKnock}
                  className="flex flex-col items-center cursor-pointer"
                >
                  <CryptoObeliskIcon size={250} className="text-cyan-500/40" />
                  <p className="mt-8 text-amber-500 tracking-[0.5em]">KNOCK THRICE</p>
                  <div className="flex gap-2 mt-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-3 h-3 rounded-full border border-amber-500 ${knocks >= i ? 'bg-amber-500' : ''}`} />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="ritual-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {!showKeypad ? (
                    <ObeliskGuardian onRitualComplete={() => setShowKeypad(true)} />
                  ) : (
                    <IstanbulDial />
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}