
"use client";

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

/**
 * Logs a user activity to the 'activity_logs' collection in Firestore.
 * 
 * @param user - The user object from Firebase Auth. Must not be null.
 * @param action - A descriptive string of the action performed.
 * @param details - An optional object with extra context about the action.
 */
export const logActivity = async (
  user: User | null,
  action: string,
  details?: Record<string, any>
) => {
  if (!user) {
    console.warn("LogActivity: User is not logged in. Action was not logged.");
    return;
  }

  try {
    await addDoc(collection(db, "activity_logs"), {
      userId: user.uid,
      userName: user.displayName || user.email || 'Unknown User',
      action: action,
      timestamp: serverTimestamp(),
      details: details || {},
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
