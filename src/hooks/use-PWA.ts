"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

export function usePWA() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 🏛️ STEP 1: Always listen for the install prompt immediately
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show the pop-up automatically if a user is present
      if (user) {
        setTimeout(() => setShowPrompt(true), 500);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 🏛️ STEP 2: General Detection
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // iOS manual prompt delay (only if user is logged in)
    if (ios && user && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 750);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [user]); // Keep user in dependency array so prompts can trigger once logged in

  const installChip = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return {
    showPrompt,
    setShowPrompt,
    isIOS,
    isInstalled,
    installChip,
    // ⚖️ PROPER JUSTIFICATION: canInstall is true if prompt exists OR it's iOS/Not installed
    canInstall: !!deferredPrompt || (isIOS && !isInstalled)
  };
}