"use client";

import { useState } from "react";
import { Share, MoreVertical, Smartphone, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VisualDiscoveryGuide() {
  const [realm, setRealm] = useState<"apple" | "android" | null>(null);

  return (
    <div className="mt-2 w-full max-w-xs border-t border-cyan-900/20 pt-6 flex flex-col items-center">
      <p className="text-[10px] text-cyan-700 font-headline tracking-[0.2em] uppercase mb-4">
        Manual Installation Ritual
      </p>

      {/* 🧭 REALM SELECTION BUTTONS */}
      {!realm && (
        <div className="grid grid-cols-2 gap-4 w-full animate-in fade-in zoom-in duration-300">
          <Button 
            variant="outline" 
            onClick={() => setRealm("apple")}
            className="flex flex-col gap-2 h-20 border-slate-800 bg-black/40 hover:border-blue-500/50"
          >
            <Apple className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] font-headline tracking-widest">APPLE</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setRealm("android")}
            className="flex flex-col gap-2 h-20 border-slate-800 bg-black/40 hover:border-cyan-500/50"
          >
            <Smartphone className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] font-headline tracking-widest">ANDROID</span>
          </Button>
        </div>
      )}

      {/* 🍎 APPLE INSTRUCTIONS */}
      {realm === "apple" && (
        <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center gap-3 p-4 border border-blue-500/30 rounded-xl bg-blue-950/10">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-blue-500/50">
              <Share className="w-5 h-5 text-blue-400" />
            </div>
           <span className="text-[12px] font-mono text-blue-100 uppercase tracking-tighter text-center leading-relaxed">
  **APPLE** <br/>
  LOOK AT THE VERY BOTTOM <br/>
  OF YOUR BROWSER NAVIGATION BAR <br/>
  <strong className="text-white">
    TAP THE 'SHARE' ICON <br/>
    - IT LOOKS LIKE THE ICON ABOVE - <br/>
  </strong> 
  THEN SCROLL DOWN TO <br/>
  <strong className="text-white">'ADD TO HOME SCREEN'</strong>
</span>
          </div>
          <button onClick={() => setRealm(null)} className="text-[9px] text-slate-500 uppercase tracking-widest hover:text-cyan-400">← Back to Device Choice</button>
        </div>
      )}

      {/* 🤖 ANDROID INSTRUCTIONS */}
      {realm === "android" && (
        <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center gap-3 p-4 border border-cyan-500/30 rounded-xl bg-cyan-950/10">
            <span className="text-[12px] font-mono text-cyan-100 uppercase tracking-tighter text-center leading-relaxed">
              **ANDROID** <br/>LOOK ABOVE <br/>IN YOUR BROWSER NAVIGATION BAR <br/><strong className="text-white">TAP THE 3 DOT MENU TO THE RIGHT <br/>- IT LOOKS LIKE THE ONE BELOW - </strong> <br/> THEN SCROLL DOWN TO <strong className="text-white">'ADD TO HOME SCREEN'</strong>
            </span>
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-cyan-500/50">
              <div className="flex flex-col gap-0.5 items-center">
                
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              </div>
            </div>
           
          </div>
          <button onClick={() => setRealm(null)} className="text-[9px] text-slate-500 uppercase tracking-widest hover:text-cyan-400">← Back to Device Choice</button>
        </div>
      )}
    </div>
  );
}