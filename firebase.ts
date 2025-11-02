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
    match /users/{userId} {
      // Allow authenticated users to read profiles (needed for names, ratings, etc.).
      allow read: if request.auth != null;
      
      // Users can create their own profile.
      allow create: if request.auth.uid == userId;
      
      // A user can update their own data.
      // For cross-user transactions (payment/rating), allow ONLY specific fields to be updated.
      // NOTE: In a production app, this sensitive logic should be handled by secure Cloud Functions.
      allow update: if request.auth.uid == userId ||
        (request.auth.uid != userId && (
            // Allow updating ONLY balance for payments
            (request.writeFields.size() == 1 && 'balance' in request.writeFields) ||
            // Allow updating ONLY rating fields together
            (request.writeFields.size() == 2 && 'averageRating' in request.writeFields && 'ratingCount' in request.writeFields)
          )
        );
    }
    
    // TASKS COLLECTION
    match /tasks/{taskId} {
      // Helper function to check if the current user is the requester of the task.
      function isRequester() {
        return request.auth.uid == resource.data.requesterId;
      }
      
      // Helper function to check if the current user is the assigned marshal of the task.
      function isMarshal() {
        return request.auth.uid == resource.data.marshalId;
      }
      
      // Helper function to check if a marshal is validly accepting an open task.
      function isAcceptingTask() {
        // 1. Check user permissions: The user must have the 'marshal' role.
        let userIsMarshal = get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'marshal';

        // 2. Check current state: The task must be 'Open' and have no marshal assigned yet.
        let taskIsAvailable = resource.data.status == 'Open' && 
                              (!('marshalId' in resource.data) || resource.data.marshalId == null);
        
        // 3. Check incoming state: The marshal must be assigning it to themselves and updating the status.
        let updateIsCorrect = request.resource.data.marshalId == request.auth.uid &&
                              request.resource.data.status == 'In Progress';
                              
        // 4. Check that only the allowed fields are being modified in this operation.
        // This is a key security check. The client should only update these two fields.
        let onlyAllowedFieldsModified = request.writeFields.size() == 2 && 
                                        'status' in request.writeFields && 
                                        'marshalId' in request.writeFields;
                                        
        return userIsMarshal && taskIsAvailable && updateIsCorrect && onlyAllowedFieldsModified;
      }

      // Any authenticated user can read tasks.
      allow read: if request.auth != null;
      
      // A task can only be created if the requesterId matches the logged-in user.
      allow create: if request.auth.uid == request.resource.data.requesterId;
      
      // A task can be updated if the user is the requester, the assigned marshal,
      // or if they are a marshal accepting an open task.
      allow update: if isRequester() || isMarshal() || isAcceptingTask();
      
      // A task can only be deleted by the original requester.
      allow delete: if isRequester();
    }

    // CHATS COLLECTION
    match /chats/{taskId}/messages/{messageId} {
      // Helper function to verify if the current user is part of the task's conversation.
      function isParticipant(taskId) {
        let task = get(/databases/$(database)/documents/tasks/$(taskId)).data;
        return request.auth.uid == task.requesterId || request.auth.uid == task.marshalId;
      }
      
      // Chat messages can only be read or created by the two users involved in the task.
      allow read, create: if isParticipant(taskId);
    }

    // RATINGS COLLECTION
    match /ratings/{ratingId} {
      // Ratings can be read by anyone logged in.
      allow read: if request.auth != null;
      // Ratings can only be created by the user who is submitting the rating.
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