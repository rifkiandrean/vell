// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const defaultFirebaseConfig = {
  "projectId": "studio-9182034779-49751",
  "appId": "1:1093479734485:web:120d8bee0044ee3336d65c",
  "apiKey": "AIzaSyDMmQtapduzcMqziyKt1a1brCWEl79iKkw",
  "authDomain": "studio-918203479-49751.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1093479734485"
};

let app = getApps().length ? getApp() : initializeApp(defaultFirebaseConfig);
let db = getFirestore(app);
let auth = getAuth(app);

// Function to fetch config and re-initialize Firebase if necessary
const initializeFirebase = async () => {
    // Only run on the client-side
    if (typeof window === "undefined") {
        return;
    }
    
    // Create a temporary db instance to fetch config
    const tempDb = getFirestore(initializeApp(defaultFirebaseConfig, "temp-for-config"));
    const configDocRef = doc(tempDb, "settings", "firebaseConfig");

    try {
        const docSnap = await getDoc(configDocRef);
        let finalConfig = defaultFirebaseConfig;

        if (docSnap.exists()) {
            const remoteConfig = docSnap.data();
            // Basic validation to ensure remote config isn't empty/malformed
            if (remoteConfig.apiKey && remoteConfig.projectId) {
                finalConfig = remoteConfig as any;
            }
        }
        
        // If the current app's config doesn't match the final config, re-initialize
        const currentApp = getApps().length ? getApp() : null;
        if (!currentApp || currentApp.options.projectId !== finalConfig.projectId) {
             console.log("Firebase config mismatch, re-initializing...");
             app = initializeApp(finalConfig, "default"); // Re-initialize the default app
        }
        
    } catch (error) {
        console.error("Error fetching remote Firebase config, using default:", error);
        // Ensure default app is initialized if remote fetch fails
        if (!getApps().length) {
            app = initializeApp(defaultFirebaseConfig, "default");
        }
    }

    db = getFirestore(app);
    auth = getAuth(app);
};

// We call this to potentially re-initialize firebase on client-side
if (typeof window !== "undefined") {
    initializeFirebase();
}

export { db, auth };
