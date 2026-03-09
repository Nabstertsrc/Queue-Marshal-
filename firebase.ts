// Firebase is loaded via CDN script tags in index.html
// This file provides typed exports for the global firebase SDK
declare global {
  interface Window {
    firebase: any;
  }
}
declare const firebase: any;

// Helper to safely get and trim environment variables, falling back to known good keys
const getValidKey = (envVar: string | undefined, fallback: string) => {
  if (typeof envVar === 'string' && envVar.trim().length > 10 && !envVar.startsWith('%')) {
    return envVar.trim();
  }
  return fallback;
};

// Firebase configuration
const firebaseConfig = {
  apiKey: getValidKey(import.meta.env.VITE_FIREBASE_API_KEY, "AIzaSyDNadriwLBKFkXLBrORyFfog5g5SE0VC1w"),
  authDomain: getValidKey(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "queue-93413.firebaseapp.com"),
  projectId: getValidKey(import.meta.env.VITE_FIREBASE_PROJECT_ID, "queue-93413"),
  storageBucket: getValidKey(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "queue-93413.firebasestorage.app"),
  messagingSenderId: getValidKey(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "1077480569715"),
  appId: getValidKey(import.meta.env.VITE_FIREBASE_APP_ID, "1:1077480569715:web:fb000a0bc2fcb7009b2306"),
  measurementId: getValidKey(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, "G-JM53CQQ17M")
};

// Debug: Check if key is correctly reaching the app (masked for security)
if (import.meta.env.PROD) {
  const keyPrefix = firebaseConfig.apiKey?.substring(0, 7) || 'NONE';
  console.log(`Firebase Init Check [PROD]: Key detected (${keyPrefix}...) - PID: ${firebaseConfig.projectId}`);
}

// Initialize Firebase (only once)
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} else {
  console.error("Firebase SDK not found. Ensure script tags in index.html are loading.");
  // Provide a dummy object to prevent immediate crashes in other files
  window.firebase = {
    auth: () => ({ onAuthStateChanged: (cb: any) => cb(null), signInWithEmailAndPassword: () => Promise.reject(), currentUser: null }),
    firestore: () => ({ collection: () => ({ doc: () => ({ get: () => Promise.resolve({ exists: false }) }) }) }),
    apps: []
  };
}

export const auth = typeof firebase !== 'undefined' ? firebase.auth() : (window.firebase as any).auth();
export const db = typeof firebase !== 'undefined' ? firebase.firestore() : (window.firebase as any).firestore();

export default firebase;

/*
 Firestore Security Rules - Deploy via Firebase Console or CLI

 rules_version = '2';
 service cloud.firestore {
   match /databases/{database}/documents {
   
     // Helper functions
     function isAuthenticated() {
       return request.auth != null;
     }
     
     function isOwner(userId) {
       return request.auth.uid == userId;
     }
     
     function isAdmin() {
       return isAuthenticated() && 
              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
     }
     
     function isMarshal() {
       return isAuthenticated() && 
              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'marshal';
     }
     
     function isVerifiedMarshal() {
       return isMarshal() && 
              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.verificationStatus == 'verified';
     }
 
     // Users collection
     match /users/{userId} {
       allow read: if isAuthenticated();
       allow create: if isOwner(userId);
       allow update: if isOwner(userId) || isAdmin();
       allow delete: if false; // Never allow user deletion from client
     }
 
     // Tasks collection
     match /tasks/{taskId} {
       allow read: if isAuthenticated();
       allow create: if isAuthenticated() && 
                       request.resource.data.requesterId == request.auth.uid;
       allow update: if isAuthenticated() && (
                       resource.data.requesterId == request.auth.uid || 
                       resource.data.marshalId == request.auth.uid ||
                       (isMarshal() && resource.data.status == 'Open')
                     );
       allow delete: if isAuthenticated() && 
                       resource.data.requesterId == request.auth.uid && 
                       resource.data.status == 'Open';
     }
 
     // Chats collection
     match /chats/{taskId}/messages/{messageId} {
       allow read: if isAuthenticated();
       allow create: if isAuthenticated() && 
                       request.resource.data.senderId == request.auth.uid;
       allow update, delete: if false;
     }
 
     // Ratings collection
     match /ratings/{ratingId} {
       allow read: if isAuthenticated();
       allow create: if isAuthenticated() && 
                       request.resource.data.ratedByUserId == request.auth.uid;
       allow update, delete: if false;
     }
 
     // Audit log - only admins can read, server writes
     match /audit_log/{logId} {
       allow read: if isAdmin();
       allow write: if false; // Only server can write
     }
   }
 }
*/