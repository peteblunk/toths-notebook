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
}, async () => {
  console.log("The Evening Chronicle begins.");
  const tasksRef = db.collection("tasks");
  try {
    const oldSnapshot = await tasksRef
      .where("isRitual", "==", true)
      .where("completed", "==", false)
      .get();
    if (oldSnapshot.empty) return;
    const batch = db.batch();
    oldSnapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  } catch (error) {
    console.error("Chronicle error:", error);
  }
});
