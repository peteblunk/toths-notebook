"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { usePWA } from "@/hooks/use-PWA";
import { Download, ShieldCheck, Trophy, Scroll, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThothChipAltar } from "@/components/thoth-chip-altar";
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { IstanbulDial } from "@/components/IstanbulDial"; 
import { CryptoObeliskOverlay } from '@/components/CryptoObeliskOverlay';




export default function ScribeDossierPage() {
  const { user } = useAuth();
  const { installChip, isInstalled, canInstall } = usePWA();
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const handleReturn = () => {
    setOpenMobile(false);
    router.push("/");
  };
  {/* 1. Logic at the top of the component */ }
  const isDjehuty = user?.uid === "YOUR_SORCERER_UID";
  const rank = isDjehuty ? "Sorcerer of Cyber Glyphs" : "Initiate Scribe of the First Hour";
  const connectionStatus = isInstalled
    ? "CHIP INSTALLED: CONNECTION TO TEMPLE ESTABLISHED."
    : "GUEST PROTOCOL ACTIVE: TEMPLE CONNECTION WEAK.";
  return (
    <div className="min-h-screen bg-black text-cyan-50 flex flex-col items-center pb-20 px-4 overflow-x-hidden">
      {/* 🌌 CELSTIAL BACKGROUND (Fixed to prevent scroll issues) */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(8,47,73,0.4),transparent)] pointer-events-none" />

      {/* 🔙 RETURN NAVIGATION */}
      <div className="w-full max-w-md pt-6 flex justify-start z-20">
        <button
          onClick={handleReturn}
          className="flex flex-col items-center justify-center p-0.1 rounded-2xl border-2 border-cyan-400 bg-cyan-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] min-w-[110px]"
        >
          {/* The Pylon: Expanded to the very edge of the stone */}
          <FirstPylonIcon
            size={80}
            className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]"
          />

          {/* The Text: Tightly integrated foundation */}
          <span className="font-headline font-bold text-[8px] tracking-[0.em] uppercase text-cyan-300 mt-[-4px] mb-1">
            To Main Hall
          </span>
        </button>
      </div>

      {/* 🏛️ HEADER: Compact Mobile Identity */}
      <div className="w-full max-w-md pt-10 mb-10 flex flex-col items-center gap-6 relative z-10">
        <div className="relative">
          <div className="absolute -inset-2 bg-cyan-500/20 rounded-full blur-lg" />
          <div className="w-24 h-24 rounded-full bg-black border-2 border-cyan-500/50 flex items-center justify-center relative overflow-hidden">
            <Fingerprint className="w-12 h-12 text-cyan-900 absolute opacity-40" />
            <div className="w-full h-full bg-gradient-to-b from-cyan-900/20 to-black flex items-center justify-center">
              <span className="text-3xl font-headline text-pink-500">{user?.displayName?.[0] || "S"}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-headline tracking-[0.15em] uppercase text-cyan-100 break-words max-w-full">
            {user?.displayName || "Scribe of Light"}
          </h1>
          <p className="mt-2 text-cyan-400 font-mono text-[9px] tracking-[0.2em] uppercase border border-cyan-900/30 px-3 py-1 rounded-full inline-block">
            Rank: Initiate Scribe of the First Hour
          </p>
        </div>
      </div>

      {/* 🏺 THE DOSSIER CONTENT: Vertical Stacking */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* COURT I: CRTYPOGRAPHIC OBELISK OF ISTANBUL (Now modular and clean) */}
        {/* 🗿 THE SENTINEL OF THE ARCHIVE */}
  <div className="flex justify-center w-full">
    <CryptoObeliskOverlay />
  </div>

        {/* COURT II: THE THOTH CHIP (Now modular and clean) */}
        <ThothChipAltar
          isInstalled={isInstalled}
          canInstall={canInstall}
          installChip={installChip}
        />

        {/* COURT III: RITUAL MASTERY */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 border border-cyan-900/30 bg-black/40 rounded-2xl flex flex-col items-center gap-3 text-center">
            <Trophy className="text-pink-600 w-6 h-6" />
            <h3 className="text-[10px] font-headline tracking-widest uppercase text-cyan-200">Rituals</h3>
            <p className="text-[9px] text-slate-600 font-mono uppercase">0 Cycles</p>
          </div>

          <div className="p-5 border border-cyan-900/30 bg-black/40 rounded-2xl flex flex-col items-center gap-3 text-center">
            <Scroll className="text-cyan-600 w-6 h-6" />
            <h3 className="text-[10px] font-headline tracking-widest uppercase text-cyan-200">Initiated</h3>
            <p className="text-[9px] text-slate-600 font-mono uppercase">2026.01.02</p>
          </div>
        </div>

      </div>
    </div>
  );
}