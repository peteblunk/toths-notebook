import { db } from "./firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { INITIAL_STREAK_DATA } from "./types";

export const migrateRitualsToKhnum = async () => {
  console.log("🏺 The Soldiers emerge from the jars...");
  const batch = writeBatch(db);
  
  try {
    // 1. Target the Templates
    const ritualsSnap = await getDocs(collection(db, "dailyRituals"));
    console.log(`🔍 Found ${ritualsSnap.size} templates.`);
    
    ritualsSnap.forEach((ritualDoc) => {
      batch.update(doc(db, "dailyRituals", ritualDoc.id), {
        streakData: INITIAL_STREAK_DATA
      });
    });

    // 2. Target Today's Active Tasks
    const tasksSnap = await getDocs(collection(db, "tasks"));
    console.log(`🔍 Found ${tasksSnap.size} total tasks.`);
    
    tasksSnap.forEach((taskDoc) => {
      const data = taskDoc.data();
      if (data.isRitual) {
        batch.update(doc(db, "tasks", taskDoc.id), {
          streakData: INITIAL_STREAK_DATA
        });
      }
    });

    await batch.commit();
    console.log("✅ SUCCESS: The pottery is fired!");
    return true;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return false;
  }
};