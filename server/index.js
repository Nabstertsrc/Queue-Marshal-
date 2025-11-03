const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization ---
// The server will now look for the credentials file at the path specified
// by the GOOGLE_APPLICATION_CREDENTIALS environment variable.
// Render will set this variable when you create a "Secret File".
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();


// Create an instance of the Express application
const app = express();

// Define the port the server will run on.
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Authentication middleware to verify Firebase ID tokens
const authenticate = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    const token = authorization.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken; // Add decoded user info to the request object
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ error: 'Forbidden: Invalid token.' });
    }
};


// --- API Routes ---

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the server! Your backend is up and running.' });
});

// Create a new task (Protected Route)
app.post('/api/tasks', authenticate, async (req, res) => {
    try {
        const { taskData, paymentMethod } = req.body;
        const { uid } = req.user; // User ID from the authenticated token

        if (!taskData || !paymentMethod) {
            return res.status(400).json({ error: 'Missing task data or payment method.'});
        }
        
        // 1. Securely destructure only the fields we expect from the client.
        // This prevents users from injecting unexpected data.
        const { title, description, location, fee, duration } = taskData;

        // 2. Add robust server-side validation.
        if (!title || !description || !location || !fee || !duration) {
             return res.status(400).json({ error: 'Incomplete task data. All fields are required.' });
        }
        if (typeof fee !== 'number' || typeof duration !== 'number' || fee <= 0 || duration <= 0) {
            return res.status(400).json({ error: 'Invalid fee or duration. They must be positive numbers.' });
        }
        if (!location.address || !location.lat || !location.lng) {
            return res.status(400).json({ error: 'Invalid location data provided.' });
        }

        // 3. Construct the new object on the server, ensuring data integrity.
        const newTaskPayload = {
            title,
            description,
            location,
            fee,
            duration,
            requesterId: uid, // Securely set from the verified token
            createdAt: Date.now(),
            status: 'Open',
            paymentMethod: paymentMethod,
            marshalId: null,      // Initialize optional fields to a known safe state
            requesterRated: false,
            marshalRated: false,
        };

        const docRef = await db.collection('tasks').add(newTaskPayload);
        
        // Return the newly created task with its ID
        res.status(201).json({ ...newTaskPayload, id: docRef.id });

    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'An internal server error occurred while creating the task.' });
    }
});

// Accept a task (Protected Route for Marshals)
app.post('/api/tasks/:taskId/accept', authenticate, async (req, res) => {
    const { taskId } = req.params;
    const { uid } = req.user;
    const taskRef = db.collection('tasks').doc(taskId);
    const userRef = db.collection('users').doc(uid);

    try {
        await db.runTransaction(async (transaction) => {
            const taskDoc = await transaction.get(taskRef);
            if (!taskDoc.exists) {
                throw new Error('Task not found.');
            }

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists || userDoc.data().role !== 'marshal') {
                 throw new Error('User is not authorized to accept tasks.');
            }

            const taskData = taskDoc.data();
            if (taskData.status !== 'Open') {
                throw new Error('Task is no longer available.');
            }

            transaction.update(taskRef, {
                status: 'In Progress',
                marshalId: uid,
            });
        });
        res.status(200).json({ success: true, message: 'Task accepted successfully.' });
    } catch (error) {
        console.error(`Error accepting task ${taskId}:`, error);
        res.status(400).json({ error: error.message || 'Could not accept task.' });
    }
});

// Complete a task (Protected Route for assigned Marshal)
app.post('/api/tasks/:taskId/complete', authenticate, async (req, res) => {
    const { taskId } = req.params;
    const { uid } = req.user; // This is the marshal completing the task
    const taskRef = db.collection('tasks').doc(taskId);

    try {
        await db.runTransaction(async (transaction) => {
            const taskDoc = await transaction.get(taskRef);
            if (!taskDoc.exists) {
                throw new Error("Task not found.");
            }

            const taskData = taskDoc.data();

            // --- Server-Side Validation ---
            if (taskData.marshalId !== uid) {
                throw new Error("Only the assigned marshal can complete this task.");
            }
            if (taskData.status !== 'In Progress') {
                throw new Error("Task cannot be completed as it's not in progress.");
            }

            // --- Payment Logic for Pre-Paid Tasks ---
            if (taskData.paymentMethod === 'Pre-Paid') {
                const requesterRef = db.collection('users').doc(taskData.requesterId);
                const marshalRef = db.collection('users').doc(taskData.marshalId);

                const [requesterDoc, marshalDoc] = await Promise.all([
                    transaction.get(requesterRef),
                    transaction.get(marshalRef)
                ]);

                if (!requesterDoc.exists || !marshalDoc.exists) {
                    throw new Error("Requester or marshal account not found.");
                }

                const requesterData = requesterDoc.data();
                const marshalData = marshalDoc.data();
                const fee = taskData.fee;

                // Note: In a real app, this would involve a more robust escrow system.
                // This simulates the transfer from a user's balance.
                if (requesterData.balance < fee) {
                    throw new Error("Requester has insufficient funds. Please contact support.");
                }

                const newRequesterBalance = requesterData.balance - fee;
                const newMarshalBalance = marshalData.balance + fee;

                transaction.update(requesterRef, { balance: newRequesterBalance });
                transaction.update(marshalRef, { balance: newMarshalBalance });
            }

            // --- Finalize Task ---
            transaction.update(taskRef, { status: 'Completed' });
        });

        res.status(200).json({ success: true, message: 'Task completed and payment processed.' });

    } catch (error) {
        console.error(`Error completing task ${taskId}:`, error);
        res.status(400).json({ error: error.message || 'Could not complete task.' });
    }
});


// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});