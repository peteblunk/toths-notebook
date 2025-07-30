import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * A scheduled Cloud Function that runs every day at 3:00 AM America/Los_Angeles time.
 * It finds all "dailyRitual" templates and creates new, uncompleted tasks
 * for each one in the main "tasks" collection.
 */
export const midnightScribe = functions.pubsub
  .schedule("every day 03:00")
  .timeZone("America/Los_Angeles") // This automatically handles DST!
  .onRun(async (context) => {
    console.log("The Midnight Scribe awakens to create the day's rituals.");

    const ritualsSnapshot = await db.collection("dailyRituals").get();
    
    if (ritualsSnapshot.empty) {
      console.log("No daily rituals found. The scribe rests.");
      return null;
    }

    // Use a batch to perform all writes at once for efficiency
    const batch = db.batch();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of the day

    ritualsSnapshot.forEach((doc) => {
      const ritual = doc.data();
      
      const newTask = {
        userId: ritual.userId,
        title: ritual.title,
        category: ritual.category,
        importance: ritual.importance,
        estimatedTime: ritual.estimatedTime,
        isComplete: false,
        createdAt: Timestamp.now(), // Use server timestamp
        dueDate: Timestamp.fromDate(today), // Set due date to today
        details: "",
        subtasks: [],
      };
      
      // Add the new task creation to the batch
      const newTaskRef = db.collection("tasks").doc(); // Create a new doc reference
      batch.set(newTaskRef, newTask);
    });

    // Commit the batch to write all new tasks to the database
    await batch.commit();

    console.log(`The Midnight Scribe has inscribed ${ritualsSnapshot.size} new tasks.`);
    return null;
  });
