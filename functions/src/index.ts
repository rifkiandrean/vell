

/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();


export const duplicateInvitation = onCall(async (request) => {
  const { newInvitationId, sourceInvitationId } = request.data;
  const uid = request.auth?.uid;

  // 1. Input Validation
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  if (
    !newInvitationId ||
    !sourceInvitationId ||
    typeof newInvitationId !== "string" ||
    typeof sourceInvitationId !== "string"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with two string arguments: 'newInvitationId' and 'sourceInvitationId'."
    );
  }

  logger.info(
    `User ${uid} is requesting to duplicate invitation '${sourceInvitationId}' to '${newInvitationId}'`
  );

  const sourceInvitationRef = db.collection("invitations").doc(sourceInvitationId);
  const newInvitationRef = db.collection("invitations").doc(newInvitationId);

  try {
    // 2. Pre-flight Checks (outside of transaction)
    const sourceDoc = await sourceInvitationRef.get();
    if (!sourceDoc.exists) {
      throw new HttpsError(
        "not-found",
        `The source invitation '${sourceInvitationId}' was not found.`
      );
    }
    const sourceData = sourceDoc.data();
    if (!sourceData) {
        throw new HttpsError(
           "data-loss",
           `The source invitation '${sourceInvitationId}' has no data.`
       );
    }

    const newDocCheck = await newInvitationRef.get();
    if (newDocCheck.exists) {
      throw new HttpsError(
        "already-exists",
        `An invitation with the ID '${newInvitationId}' already exists.`
      );
    }

    // 3. Create the main document atomically
    await newInvitationRef.set(sourceData);
    logger.info(`Main invitation document '${newInvitationId}' created successfully.`);


    // 4. Copy all subcollections using a batch write
    const subcollectionsToCopy = [
      "gallery_images",
      "guestbook",
      "rsvps",
      "settings",
    ];

    const batch = db.batch();

    // Use a sequential for...of loop for stability instead of Promise.all
    for (const subcollectionId of subcollectionsToCopy) {
      const sourceSubcollectionRef = sourceInvitationRef.collection(subcollectionId);
      const documentsSnapshot = await sourceSubcollectionRef.get();

      if (!documentsSnapshot.empty) {
        logger.info(`Staging copy of ${documentsSnapshot.size} documents from subcollection '${subcollectionId}'...`);
        documentsSnapshot.forEach(doc => {
          const destDocRef = newInvitationRef.collection(subcollectionId).doc(doc.id);
          batch.set(destDocRef, doc.data());
        });
      } else {
        logger.info(`Subcollection '${subcollectionId}' is empty, skipping.`);
      }
    }
    
    // Commit the batch of all subcollection documents at once
    await batch.commit();
    logger.info(`Subcollections copied successfully for '${newInvitationId}'.`);


    logger.info(`Successfully duplicated invitation '${sourceInvitationId}' to '${newInvitationId}'.`);
    return {
      success: true,
      message: `Invitation '${newInvitationId}' created successfully.`,
    };
  } catch (error: any) {
    logger.error("Error duplicating invitation:", error);
    // If it's an HttpsError, re-throw it. Otherwise, wrap it.
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      error.message || "An unexpected error occurred while creating the invitation."
    );
  }
});
