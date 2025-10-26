// Since we are using script tags in index.html, we need to declare firebase
declare const firebase: any;

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDNadriwLBKFkXLBrORyFfog5g5SE0VC1w",
  authDomain: "queue-93413.firebaseapp.com",
  projectId: "queue-93413",
  storageBucket: "queue-93413.firebasestorage.app",
  messagingSenderId: "1077480569715",
  appId: "1:1077480569715:web:fb000a0bc2fcb7009b2306",
  measurementId: "G-JM53CQQ17M"
};

// ============================================================================
// IMPORTANT: NEW SECURITY RULES
// To fix "Missing or insufficient permissions" errors and secure your app,
// you must update your rules in the Firebase console.
// 
// 1. Go to your Firebase Project -> Firestore Database -> Rules Tab and paste the Firestore rules.
// 2. Go to your Firebase Project -> Storage -> Rules Tab and paste the Storage rules.
// ============================================================================

/*
// --- FIRESTORE RULES ---
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
  
    // USERS COLLECTION
    // Users can create their own profile, and only they can read or update it.
    match /users/{userId} {
      allow read, update: if request.auth.uid == userId;
      allow create: if request.auth.uid == userId;
    }
    
    // TASKS COLLECTION
    // Tasks can be read by any logged-in user.
    // They can only be created, updated, or deleted by authorized users.
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      
      // A task can only be created if the requesterId matches the logged-in user.
      allow create: if request.auth.uid == request.resource.data.requesterId;
      
      // A task can be updated by its requester or its assigned marshal.
      allow update: if request.auth.uid == resource.data.requesterId || request.auth.uid == resource.data.marshalId;
      
      // A task can only be deleted by the original requester.
      allow delete: if request.auth.uid == resource.data.requesterId;
    }

    // CHATS COLLECTION
    // Chat messages can only be read or created by the two users involved in the task.
    // This rule securely checks the task document to verify participants.
    match /chats/{taskId}/messages/{messageId} {
      function isParticipant(taskId) {
        let task = get(/databases/$(database)/documents/tasks/$(taskId)).data;
        return request.auth.uid == task.requesterId || request.auth.uid == task.marshalId;
      }
      allow read, create: if isParticipant(taskId);
    }

    // RATINGS COLLECTION
    // Ratings can be read by anyone logged in.
    // They can only be created by the user who is submitting the rating.
    match /ratings/{ratingId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.ratedByUserId;
    }
  }
}
*/

/*
// --- FIREBASE STORAGE RULES ---
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
  
    // PROFILE PICTURES
    // Users can only upload profile pictures to their own user folder.
    // Anyone can read profile pictures as they are public.
    match /profile_pictures/{userId}/{fileName} {
      allow read;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/


// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();