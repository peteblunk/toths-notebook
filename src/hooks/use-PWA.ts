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
    if (!user) return;

    // 1. Check if already running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);
    if (isStandalone) return;

    // 2. Detect iOS
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // 3. Capture the "Thoth Chip" event (Android/Chrome)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-trigger the pop-up for the uninitiated
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS manual prompt delay
    if (ios) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [user]);

  const installChip = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return {
    showPrompt,
    setShowPrompt,
    isIOS,
    isInstalled,
    installChip,
    canInstall: !!deferredPrompt || (isIOS && !isInstalled)
  };
}