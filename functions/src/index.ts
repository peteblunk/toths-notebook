import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const midnightScribe = onSchedule({
  schedule: "every day 03:00",
  timeZone: "America/Los_Angeles",
}, async () => {
  console.log("The Midnight Scribe awakens.");
  const ritualsSnapshot = await db.collection("dailyRituals").get();
  if (ritualsSnapshot.empty) return;

  const batch = db.batch();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  ritualsSnapshot.forEach((doc) => {
    const ritual = doc.data();
    const newTaskRef = db.collection("tasks").doc();
    batch.set(newTaskRef, {
      userId: ritual.userId,
      title: ritual.title,
      category: ritual.category || "Daily Ritual",
      importance: ritual.importance || "medium",
      estimatedTime: ritual.estimatedTime || 15,
      details: ritual.details || "",
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      subtasks: (ritual.subtasks || []).map((st: any) => ({
        ...st,
        completed: false,
      })),
      completed: false,
      createdAt: Timestamp.now(),
      dueDate: Timestamp.fromDate(today),
      isRitual: true,
      originRitualId: doc.id,
    });
  });
  await batch.commit();
});

export const automatedChronicle = onSchedule({
  schedule: "every day 02:30",
  timeZone: "America/Los_Angeles",
}, async (event) => {
  console.log("The Automated Evening Chronicle begins.");
  
  const tasksRef = db.collection("tasks");
  const chroniclesRef = db.collection("chronicles");
  const usersRef = db.collection("users");

  try {
    const usersSnapshot = await usersRef.get();
    
    // 🏺 Glitch 3b Fix: Yesterday's Ritual Date
    const ritualDate = new Date();
    ritualDate.setDate(ritualDate.getDate() - 1);
    const dateString = ritualDate.toLocaleDateString('en-US'); 

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const batch = db.batch();

      // 1. SCRIER'S CHECK: Existing Manual Entry
      const existingChronicle = await chroniclesRef
        .where("userId", "==", userId)
        .where("date", "==", dateString)
        .get();

      const alreadySealed = !existingChronicle.empty;

      // 2. FETCH DEEDS
      const tasksSnapshot = await tasksRef.where("userId", "==", userId).get();
      
      const completedTitles: string[] = [];
      const incompleteRitualTitles: string[] = [];
      const tasksToDelete: admin.firestore.DocumentReference[] = [];

      tasksSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.completed) {
          completedTitles.push(data.title);
          tasksToDelete.push(doc.ref);
        } else if (data.category === "Daily Ritual" || data.isRitual) {
          incompleteRitualTitles.push(data.title);
          tasksToDelete.push(doc.ref);
        }
      });

      // 3. ⚖️ STREAK LOGIC: The Continuity Index
      // We check if Ma'at was created today (manually or by presence of tasks)
      const maAtCreated = alreadySealed || completedTitles.length > 0;
      
      let newStreak = userData.stats?.currentStreak || 0;
      let history = userData.stats?.history10Day || [0,0,0,0,0,0,0,0,0,0];

      if (maAtCreated) {
        newStreak += 1; // ⚡ The Flame Grows
        history.push(1);
      } else {
        newStreak = 0;  // 🌑 The Flame Fails
        history.push(0);
      }
      
      // Keep only the last 10 days in the scroll
      history = history.slice(-10);

      const maxStreak = Math.max(newStreak, userData.stats?.maxStreak || 0);

      // 4. UPDATE USER STATS (For Scribe's Dossier Access)
      batch.update(userDoc.ref, {
        "stats.currentStreak": newStreak,
        "stats.maxStreak": maxStreak,
        "stats.history10Day": history,
        "stats.lastResetDate": dateString
      });

      // 5. 3a Fix: Create Ghost Archive if missing
      if (!alreadySealed) {
        const archiveRef = chroniclesRef.doc();
        batch.set(archiveRef, {
          userId,
          createdAt: Timestamp.now(),
          date: dateString, 
          victoriesLog: completedTitles,
          retainedNunLog: incompleteRitualTitles,
          winsNote: "Sealed by the Midnight Scribe (Automated Reset)",
          type: "automated-seal",
          streakAtSeal: newStreak // Log the streak state in the archive
        });
      }

      // 6. 8 & 9: Absolute Cleansing
      tasksToDelete.forEach((ref) => batch.delete(ref));

      await batch.commit();
    }
  } catch (error) {
    console.error("The Chronicle was interrupted by chaos:", error);
  }
});