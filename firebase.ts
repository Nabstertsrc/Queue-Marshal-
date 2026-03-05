// Firebase is loaded via CDN script tags in index.html
// This file provides typed exports for the global firebase SDK
declare const firebase: any;

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug: Check if key is correctly reaching the app (masked for security)
if (import.meta.env.PROD) {
  const keyPrefix = firebaseConfig.apiKey?.substring(0, 7) || 'NONE';
  console.log(`Firebase Init Check [PROD]: Key detected (${keyPrefix}...) - PID: ${firebaseConfig.projectId}`);
}

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

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