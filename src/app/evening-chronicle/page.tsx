"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// --- THE NEW MODULAR COMPONENTS ---
import { ChronicleThreshold } from "./components/chronicle-threshold";
import { MaatAttestation } from "./components/maat-attestation";
import { GratitudeBreath } from "./components/gratitude-breath";
import { ChronicleSealingForm } from "./components/chronicle-sealing-form";

interface Task {
  id: string;
  title: string;
  category?: string;
  isRitual?: boolean;
  completed: boolean;
  dueDate?: string;
}

export default function EveningChroniclePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0); // 🏺 Moved inside component
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, setFormState] = useState({
  winsNote: "",       // 🏺 Changed from 'wins'
  shadowWorkNote: "", // 🏺 Changed from 'shadowWork'
  tomorrowQuest: ""   // 🏺 Keep this as is, as the Archive already uses it
});

  // 📜 AUTH & DATA FETCHING
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push("/login"); return; }
      setUser(currentUser);

      // Fetch Tasks
      const q = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setAllTasks(tasksData);

      // Fetch User Stats (Streak)
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setCurrentStreak(userSnap.data().stats?.currentStreak || 0);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ⚡ THE MANUAL SEAL RITUAL
  const handleSealChronicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);

      // 🏺 INTERNAL SCRYING FOR THE ARCHIVE
      const completedTasks = allTasks.filter(t => t.completed);
      // Logic for Nun: rituals or overdue items
      const now = new Date();
      const scribeDate = (now.getHours() < 2 || (now.getHours() === 2 && now.getMinutes() < 30))
        ? new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0]
        : now.toISOString().split('T')[0];

      const incompleteRituals = allTasks.filter(t => 
        !t.completed && (t.category === "Daily Ritual" || t.isRitual || (t.dueDate && t.dueDate <= scribeDate))
      );

      // 1. STREAK CALCULATION
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      let newStreak = (userData?.stats?.currentStreak || 0) + 1;
      let history = userData?.stats?.history10Day || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      history.push(1);
      history = history.slice(-10);

      // 2. CREATE ARCHIVE
      const archiveRef = doc(collection(db, "chronicles"));
      batch.set(archiveRef, {
        userId: user.uid,
        createdAt: serverTimestamp(),
        date: scribeDate, // Use consistent scribe date
        victoriesLog: completedTasks.map(t => t.title),
        retainedNunLog: incompleteRituals.map(t => t.title),
        ...formState,
        streakAtSeal: newStreak,
        type: "evening-seal"
      });

      // 3. UPDATE USER STATS
      batch.update(userRef, {
        "stats.currentStreak": newStreak,
        "stats.maxStreak": Math.max(newStreak, userData?.stats?.maxStreak || 0),
        "stats.history10Day": history,
        "stats.lastRitualDate": scribeDate
      });

      // 4. PURGE DEEDS (Delete only what was sealed/retained)
      completedTasks.forEach(t => batch.delete(doc(db, "tasks", t.id)));
      incompleteRituals.forEach(t => batch.delete(doc(db, "tasks", t.id)));

      await batch.commit();
      router.push("/archives");
    } catch (err) {
      console.error("Seal broken:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-black relative">
      {step === 1 && (
        <ChronicleThreshold onNext={() => setStep(2)} onMainHall={() => router.push("/")} />
      )}
      {step === 2 && (
        <MaatAttestation allTasks={allTasks} onNext={() => setStep(3)} onBack={() => setStep(1)} onMainHall={() => router.push("/")} />
      )}
      {step === 3 && (
        <GratitudeBreath onNext={() => setStep(4)} onBack={() => setStep(2)} onMainHall={() => router.push("/")} />
      )}
      {step === 4 && (
        <ChronicleSealingForm
          completedTasks={allTasks.filter(t => t.completed)} // 🏺 Pass only deeds here
          formState={formState}
          setFormState={setFormState}
          onSeal={handleSealChronicle}
          isSubmitting={isSubmitting}
          onBack={() => setStep(3)}
          onMainHall={() => router.push("/")}
          displayStreak={currentStreak + 1}
        />
      )}
    </main>
  );
}