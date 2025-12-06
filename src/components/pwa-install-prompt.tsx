"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CyberAnkh } from "@/components/icons/cyber-ankh";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider"; // Ensure this import is present

export function PwaInstallPrompt() {
  const { user } = useAuth(); // Get user authentication status
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Guard clause: Don't show if user is not logged in
    if (!user) return;

    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return; 

    // 2. Detect iOS
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // 3. Capture Android install event
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a moment for the user to settle, then show prompt
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS, show after delay since there's no event
    if (ios) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [user]); // Add user to dependency array

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  // Don't render anything if user is not logged in (double check)
  if (!user) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="bg-slate-950/95 border border-cyan-500/50 rounded-xl p-5 shadow-[0_0_40px_rgba(34,211,238,0.2)] backdrop-blur-xl relative overflow-hidden">
            
            <button 
              onClick={() => setShowPrompt(false)}
              className="absolute top-2 right-2 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              {/* The Thoth Chip Icon */}
              <div className="bg-slate-900 p-3 rounded-lg border border-cyan-900/50 shrink-0">
                 <CyberAnkh className="w-8 h-8 text-cyan-500" />
              </div>

              <div className="flex-1">
                <h3 className="text-cyan-100 font-headline tracking-wider text-sm mb-1 uppercase font-bold">
                  Accept the Thoth Chip
                </h3>
                <p className="text-slate-400 text-xs mb-3 font-mono">
                  Install the interface for direct, full-screen access to the archives.
                </p>

                {isIOS ? (
                  <div className="text-xs text-amber-400 font-mono bg-amber-950/30 p-3 rounded border border-amber-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      1. Tap <Share className="w-4 h-4" /> <strong>Share</strong> below
                    </div>
                    <div className="flex items-center gap-2">
                      2. Select <PlusSquare className="w-4 h-4" /> <strong>Add to Home Screen</strong>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleAndroidInstall}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase tracking-widest text-xs h-8"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Initialize Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}