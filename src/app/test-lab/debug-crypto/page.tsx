"use client";

import { useState } from "react";
import { 
  generateMasterKey, 
  encryptData, 
  decryptData, 
  bufferToBase64, 
  base64ToBuffer 
} from "@/lib/crypto";
import { Shield, Lock, Unlock, Zap, FlaskConical } from "lucide-react";

export default function CryptoLab() {
  const [plainText, setPlainText] = useState("");
  const [sealedData, setSealedData] = useState<{ ciphertext: string; iv: string } | null>(null);
  const [unsealedText, setUnsealedText] = useState("");
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);

  // 📜 Ritual: Manifest the Golden Key for the Lab
  const manifestKey = async () => {
    const key = await generateMasterKey();
    setMasterKey(key);
  };

 // 🏺 Ritual: Seal the Jar (Encrypt)
  const handleSeal = async () => {
    if (!masterKey || !plainText) return;
    const { ciphertext, iv } = await encryptData(masterKey, plainText);
    
    setSealedData({
      // We cast the buffer to satisfy the strict Scribe
      ciphertext: bufferToBase64(ciphertext),
      iv: bufferToBase64(iv.buffer as ArrayBuffer), 
    });
    setUnsealedText(""); 
  };

 // 👁️ Ritual: Open the Jar (Decrypt)
  const handleOpen = async () => {
    if (!masterKey || !sealedData) return;
    
    // We recreate the IV from the base64 string
    const ivBuffer = base64ToBuffer(sealedData.iv);
    
    const decrypted = await decryptData(
      masterKey,
      base64ToBuffer(sealedData.ciphertext),
      new Uint8Array(ivBuffer) // The constructor accepts the buffer source
    );
    setUnsealedText(decrypted);
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 p-8 font-headline flex flex-col items-center">
      {/* HEADER: The Scribe's Laboratory */}
      <div className="flex items-center gap-4 mb-12 border-b border-cyan-900 pb-4 w-full max-w-2xl justify-center">
        <FlaskConical className="text-amber-500 animate-pulse" size={32} />
        <h1 className="text-3xl tracking-[0.3em] uppercase font-bold text-amber-500">
          The Encryptian Lab
        </h1>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* 1. KEY GENERATION */}
        <section className="p-6 border-2 border-cyan-900 rounded-3xl bg-cyan-950/20 backdrop-blur-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm tracking-widest uppercase">Step 1: Manifest Golden Key</h2>
            {masterKey && <Shield className="text-lime-500 animate-bounce" size={20} />}
          </div>
          <button 
            onClick={manifestKey}
            className="w-full py-4 bg-cyan-500/10 border border-cyan-400/50 rounded-xl hover:bg-cyan-500/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
          >
            <Zap size={16} /> {masterKey ? "Key Manifested in RAM" : "Summon 256-bit Key"}
          </button>
        </section>

        {/* 2. THE INPUT */}
        <section className="p-6 border-2 border-cyan-900 rounded-3xl bg-cyan-950/20">
          <h2 className="text-sm tracking-widest uppercase mb-4 text-center">Step 2: Input Sacred Text</h2>
          <textarea
            value={plainText}
            onChange={(e) => setPlainText(e.target.value)}
            className="w-full bg-black border border-cyan-800 rounded-xl p-4 text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder="Enter the secrets of the Vizier..."
            rows={3}
          />
          <button 
            onClick={handleSeal}
            disabled={!masterKey || !plainText}
            className="w-full mt-4 py-4 bg-amber-500/10 border border-amber-500/50 text-amber-500 rounded-xl hover:bg-amber-500/20 disabled:opacity-30 flex items-center justify-center gap-3 uppercase text-xs"
          >
            <Lock size={16} /> Seal the Jar
          </button>
        </section>

        {/* 3. THE GIBBERISH (The Shadow) */}
        {sealedData && (
          <section className="p-6 border-2 border-red-900/50 rounded-3xl bg-red-950/10 animate-in fade-in zoom-in duration-500">
            <h2 className="text-xs tracking-widest uppercase mb-4 text-red-500">The Meaningless Characters (Firestore State)</h2>
            <div className="bg-black p-4 rounded-xl border border-red-900/30 break-all font-mono text-[10px] text-red-400/80">
              {sealedData.ciphertext}
            </div>
            <button 
              onClick={handleOpen}
              className="w-full mt-4 py-4 bg-lime-500/10 border border-lime-500/50 text-lime-500 rounded-xl hover:bg-lime-500/20 flex items-center justify-center gap-3 uppercase text-xs"
            >
              <Unlock size={16} /> Open the Jar
            </button>
          </section>
        )}

        {/* 4. THE DECRYPTIAN REVELATION */}
        {unsealedText && (
          <section className="p-6 border-2 border-lime-500/50 rounded-3xl bg-lime-950/20 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-sm tracking-widest uppercase mb-4 text-lime-500 text-center">The Truth Restored</h2>
            <p className="text-2xl text-center text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] italic">
              "{unsealedText}"
            </p>
          </section>
        )}
      </div>
    </div>
  );
}