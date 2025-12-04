"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { PTAH_CONFIG } from "@/lib/ptah-config";
import { Hammer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PtahManager() {
    const { user } = useAuth();
    const [updateAvailable, setUpdateAvailable] = useState(false);

    // 1. LISTENER: Only CHECK for update, don't act yet
    useEffect(() => {
        // If we are already showing the banner, stop checking
        if (updateAvailable) return;

        const savedVersion = localStorage.getItem("thoth_app_version");

        // If versions don't match, SHOW THE BANNER
        if (savedVersion !== PTAH_CONFIG.version) {
            console.log(`⚡ Ptah Protocol: Update found (${PTAH_CONFIG.version})`);
            setUpdateAvailable(true);
        }
    }, [updateAvailable]); // Removed 'user' dependency to avoid loop, simple check is fine

    // 2. THE RITUAL ACTION
    const handleEmbrace = async () => {
        if (!user) return; // Safety check

        try {
            // A. Scribe the new task into the database
            await addDoc(collection(db, "tasks"), {
                userId: user.uid,
                title: PTAH_CONFIG.releaseTitle,
                details: PTAH_CONFIG.releaseNotes,
                category: PTAH_CONFIG.targetCategory, // "Nun"
                dueDate: new Date(),
                completed: false,
                createdAt: serverTimestamp(),
                tags: ["System Update", "Gift of Ptah"]
            });

            // B. Save the new version to Local Storage (so banner doesn't show again)
            localStorage.setItem("thoth_app_version", PTAH_CONFIG.version);

            // C. Reload the page to "Scrub the Interface"
            window.location.reload();

        } catch (error) {
            console.error("Failed to scribe the Gift of Ptah:", error);
            // Even if DB fails, maybe save version to avoid infinite loop? 
            // For now, let's leave it so you can try again.
        }
    };

    // 3. THE UI (The Emerald Tablet)
    if (!updateAvailable) return null;

    return (
        <div className="fixed top-0 left-0 w-full z-[100] animate-in slide-in-from-top duration-700">
            <div className="bg-emerald-950/95 border-b-2 border-emerald-500 p-6 shadow-[0_0_50px_rgba(16,185,129,0.6)] backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center">

                <div className="flex items-center gap-3 text-emerald-400 animate-pulse">
                    <Hammer className="w-6 h-6 animate-bounce" />
                    <h3 className="text-xl font-display tracking-[0.2em] uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        Gift of Ptah Awaits
                    </h3>
                    <Sparkles className="w-6 h-6 animate-pulse" />
                </div>

                <p className="text-emerald-100/80 font-mono text-sm max-w-md">
                By an utterance has the Creator deigned to usher in codebase changes. Give thanks to Ptah and accept this gift.
                </p>

                <Button
                    onClick={handleEmbrace}
                    className="bg-emerald-600 text-black hover:bg-emerald-500 hover:scale-105 transition-all font-bold tracking-widest mt-2 px-8 py-6 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                    EMBRACE GIFT OF PTAH
                </Button>
            </div>
        </div>
    );
}