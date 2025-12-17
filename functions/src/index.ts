import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * A scheduled Cloud Function that runs at a specific time.
 * It finds all "dailyRitual" templates and creates new, uncompleted tasks
 * for each one in the main "tasks" collection.
 */
export const midnightScribe = onSchedule({
  schedule: "every day 03:00",
  timeZone: "America/Los_Angeles",
}, async () => { // Changed 'event' to empty () to silence warning
  console.log("The Midnight Scribe awakens to create the day's rituals.");

  const ritualsSnapshot = await db.collection("dailyRituals").get();

  if (ritualsSnapshot.empty) {
    console.log("No daily rituals found. The scribe rests.");
    return;
  }

  const batch = db.batch();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  ritualsSnapshot.forEach((doc) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ritual = doc.data() as any;

    const newTask = {
      userId: ritual.userId,
      title: ritual.title,
      category: ritual.category || "Daily Rituals",
      importance: ritual.importance || "medium",
      estimatedTime: ritual.estimatedTime || 15,
      details: ritual.details || "",
      subtasks: ritual.subtasks || [],
      isComplete: false,
      createdAt: Timestamp.now(),
      dueDate: Timestamp.fromDate(today),

      // THE NEW FIELDS:
      isRitual: true, // Flags this as a Ritual Instance
      originRitualId: doc.id, // Links it back to the Template
    };

    const newTaskRef = db.collection("tasks").doc();
    batch.set(newTaskRef, newTask);
  });

  await batch.commit();

  // Split long log line to satisfy linter
  console.log(
    `The Midnight Scribe has inscribed ${ritualsSnapshot.size} new tasks.`
  );
  return;
});
