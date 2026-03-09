const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

// --- Firebase Admin SDK Initialization ---
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

        // Ensure private key newlines are handled correctly (common issue with environment variables)
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error("❌ CRITICAL ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT variable. Please ensure you copied the entire JSON file perfectly.");
        console.error("Details:", e.message);
        process.exit(1); // Crash immediately with clear error
    }
} else {
    console.error("❌ CRITICAL ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is MISSING in Railway.");
    console.error("Please add the entire JSON file text as the FIREBASE_SERVICE_ACCOUNT variable.");
    process.exit(1); // Crash immediately with clear error
}

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3001;

// Admin email - only this email can have admin access
const ADMIN_EMAIL = 'nabstertsr@gmail.com';

// --- Encryption Utilities ---
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 64);
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function hashSensitiveData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// --- Push Notification Helper ---
async function sendPushNotification(userId, title, body, data = {}) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return;

        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
            console.log(`No FCM token for user ${userId}, skipping notification.`);
            return;
        }

        const message = {
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK', // For some older SDKs
            },
            token: fcmToken,
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

// --- Middleware ---
// CORS - MUST BE FIRST
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://profilegenius.fun',
    'https://www.profilegenius.fun'
];

if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
        if (origin && !allowedOrigins.includes(origin)) {
            allowedOrigins.push(origin.trim());
        }
    });
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200
}));

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '10kb' })); // Limit body size

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per window per IP
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS', // SKIP preflight requests!
});
app.use('/api/', limiter);

// Stricter rate limit for auth operations
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many authentication attempts. Try again later.' },
});

// Authentication middleware
const authenticate = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    const token = authorization.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error.message);
        return res.status(403).json({ error: 'Forbidden: Invalid or expired token.' });
    }
};

// Admin-only middleware
const requireAdmin = async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required.' });
        }
        // Double-check: verify the email matches the designated admin
        if (req.user.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Forbidden: Unauthorized admin access attempt.' });
        }
        req.adminUser = userDoc.data();
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Server error during admin verification.' });
    }
};

// Input sanitizer
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '').trim().slice(0, 500);
}


// --- API Routes ---

app.get('/api/test', (req, res) => {
    res.json({ message: 'Queue-Marshal API is running.', version: '2.0.0', timestamp: Date.now() });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime() });
});


// === TASK ROUTES === //

// Create a new task (Protected)
app.post('/api/tasks', authenticate, async (req, res) => {
    try {
        const { taskData, paymentMethod, isPaid } = req.body;
        const { uid } = req.user;

        if (!taskData || !paymentMethod) {
            return res.status(400).json({ error: 'Missing task data or payment method.' });
        }

        const title = sanitizeString(taskData.title);
        const description = sanitizeString(taskData.description);
        const { location, fee, duration, appCommission, vatRate, totalFee } = taskData;

        // Use totalFee for fee limit check
        const finalAmountToCheck = totalFee || fee;

        // Validate
        if (!title || !description || !location || !fee || !duration) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (typeof fee !== 'number' || typeof duration !== 'number' || fee <= 0 || duration <= 0) {
            return res.status(400).json({ error: 'Invalid fee or duration.' });
        }
        if (finalAmountToCheck > 10000) {
            return res.status(400).json({ error: 'Fee cannot exceed R10,000.' });
        }
        if (!location.address || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return res.status(400).json({ error: 'Invalid location data.' });
        }
        if (!['Pre-Paid', 'On the Spot'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method.' });
        }

        const sanitizedTitle = sanitizeString(title);
        const sanitizedDescription = sanitizeString(description);
        const sanitizedAddress = sanitizeString(location.address);

        let finalIsPaid = false;
        const appComm = appCommission || (fee * 0.05);
        const vat = vatRate || 0.15;
        const total = totalFee || (fee * (1 + 0.05) * (1 + 0.15));

        // CRITICAL: Financial transaction logic
        if (paymentMethod === 'Pre-Paid') {
            const userRef = db.collection('users').doc(uid);

            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error('User not found.');

                // If the client says it's already paid, we assume the verification happened 
                // in a separate step (like the Yoco return handler). 
                // In this case, we trust the client ONLY because the server-side verify-checkout 
                // already added the funds to the wallet. We still deduct it here to fulfill the task.

                const currentBalance = userDoc.data().balance || 0;
                // Rounding to avoid floating point issues during comparison
                const roundedBalance = Math.round(currentBalance * 100) / 100;
                const roundedTotal = Math.round(total * 100) / 100;

                if (roundedBalance < roundedTotal) {
                    throw new Error(`Insufficient balance. You need R${roundedTotal.toFixed(2)} but have R${roundedBalance.toFixed(2)}.`);
                }

                // Deduct balance immediately upon task creation for Pre-Paid
                transaction.update(userRef, { balance: Math.max(0, Math.round((currentBalance - total) * 100) / 100) });
                finalIsPaid = true;
            });
        }

        const newTaskPayload = {
            title: sanitizedTitle,
            description: sanitizedDescription,
            location: {
                address: sanitizedAddress,
                lat: location.lat,
                lng: location.lng,
            },
            fee,
            appCommission: appComm,
            vatRate: vat,
            totalFee: total,
            duration,
            requesterId: uid,
            createdAt: Date.now(),
            status: 'Open',
            paymentMethod: paymentMethod,
            isPaid: finalIsPaid,
            marshalId: null,
            requesterRated: false,
            marshalRated: false,
        };

        const docRef = await db.collection('tasks').add(newTaskPayload);

        // Log the action
        await db.collection('audit_log').add({
            action: 'task_created',
            userId: uid,
            taskId: docRef.id,
            timestamp: Date.now(),
            details: { title: sanitizedTitle, fee, paymentMethod },
        });

        res.status(201).json({ ...newTaskPayload, id: docRef.id });

    } catch (error) {
        console.error('Error creating task:', error);
        if (error.message && (error.message.includes('Insufficient balance') || error.message.includes('User not found'))) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Internal server error.' });
    }
});


// Accept a task (Protected; marshal must be verified)
app.post('/api/tasks/:taskId/accept', authenticate, async (req, res) => {
    const { taskId } = req.params;
    const { uid } = req.user;
    const taskRef = db.collection('tasks').doc(taskId);
    const userRef = db.collection('users').doc(uid);

    try {
        await db.runTransaction(async (transaction) => {
            const taskDoc = await transaction.get(taskRef);
            if (!taskDoc.exists) throw new Error('Task not found.');

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists || userDoc.data().role !== 'marshal') {
                throw new Error('Only marshals can accept tasks.');
            }

            // Check verification status
            const userData = userDoc.data();
            if (userData.verificationStatus !== 'verified') {
                throw new Error('Your account must be verified before accepting tasks. Please wait for admin approval.');
            }

            const taskData = taskDoc.data();
            if (taskData.status !== 'Open') {
                throw new Error('This task is no longer available.');
            }

            // Prevent self-assignment
            if (taskData.requesterId === uid) {
                throw new Error('You cannot accept your own task.');
            }

            transaction.update(taskRef, {
                status: 'In Progress',
                marshalId: uid,
            });
        });

        // Notify the requester that their task was accepted
        const taskDoc = await taskRef.get();
        const taskData = taskDoc.data();
        if (taskData.requesterId) {
            sendPushNotification(
                taskData.requesterId,
                'Task Accepted! 🚀',
                `A Marshal has accepted your task: "${taskData.title}".`,
                { taskId, type: 'task_accepted' }
            );
        }

        // Audit log
        await db.collection('audit_log').add({
            action: 'task_accepted',
            userId: uid,
            taskId,
            timestamp: Date.now(),
        });

        res.status(200).json({ success: true, message: 'Task accepted.' });
    } catch (error) {
        console.error(`Error accepting task ${taskId}:`, error);
        res.status(400).json({ error: error.message || 'Could not accept task.' });
    }
});

// Complete a task (Protected; assigned marshal only)
app.post('/api/tasks/:taskId/complete', authenticate, async (req, res) => {
    const { taskId } = req.params;
    const { uid } = req.user;
    const taskRef = db.collection('tasks').doc(taskId);

    try {
        await db.runTransaction(async (transaction) => {
            const taskDoc = await transaction.get(taskRef);
            if (!taskDoc.exists) throw new Error('Task not found.');

            const taskData = taskDoc.data();

            if (taskData.marshalId !== uid) {
                throw new Error('Only the assigned marshal can complete this task.');
            }
            if (taskData.status !== 'In Progress') {
                throw new Error("Task is not in progress.");
            }

            // Payment logic for Pre-Paid tasks
            if (taskData.paymentMethod === 'Pre-Paid') {
                const marshalRef = db.collection('users').doc(taskData.marshalId);
                const marshalDoc = await transaction.get(marshalRef);

                if (!marshalDoc.exists) {
                    throw new Error('Marshal account not found.');
                }

                if (!taskData.isPaid) {
                    const requesterRef = db.collection('users').doc(taskData.requesterId);
                    const requesterDoc = await transaction.get(requesterRef);
                    if (!requesterDoc.exists) throw new Error('Requester account not found.');

                    const totalDeductionVal = taskData.totalFee || (taskData.fee * 1.05 * 1.15);
                    if (requesterDoc.data().balance < totalDeductionVal) {
                        throw new Error('Requester has insufficient funds.');
                    }
                    transaction.update(requesterRef, { balance: requesterDoc.data().balance - totalDeductionVal });
                }

                const marshalPayout = taskData.fee;
                transaction.update(marshalRef, { balance: (marshalDoc.data().balance || 0) + marshalPayout });
            }

            transaction.update(taskRef, { status: 'Completed' });
        });

        // Notify the requester that their task was completed
        const taskDoc = await taskRef.get();
        const taskData = taskDoc.data();
        if (taskData.requesterId) {
            sendPushNotification(
                taskData.requesterId,
                'Task Completed! ✅',
                `Your task "${taskData.title}" has been completed by the Marshal.`,
                { taskId, type: 'task_completed' }
            );
        }

        // Audit
        await db.collection('audit_log').add({
            action: 'task_completed',
            userId: uid,
            taskId,
            timestamp: Date.now(),
        });

        res.status(200).json({ success: true, message: 'Task completed and payment processed.' });

    } catch (error) {
        console.error(`Error completing task ${taskId}:`, error);
        res.status(400).json({ error: error.message || 'Could not complete task.' });
    }
});

// Delete a task (Protected; requester only, only if still Open)
app.delete('/api/tasks/:taskId', authenticate, async (req, res) => {
    const { taskId } = req.params;
    const { uid } = req.user;

    try {
        const taskRef = db.collection('tasks').doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        const taskData = taskDoc.data();
        if (taskData.requesterId !== uid) {
            return res.status(403).json({ error: 'Only the task creator can delete this task.' });
        }
        if (taskData.status !== 'Open') {
            return res.status(400).json({ error: 'Can only delete tasks that are still open.' });
        }

        await taskRef.delete();

        await db.collection('audit_log').add({
            action: 'task_deleted',
            userId: uid,
            taskId,
            timestamp: Date.now(),
        });

        res.status(200).json({ success: true, message: 'Task deleted.' });
    } catch (error) {
        console.error(`Error deleting task ${taskId}:`, error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Add a rating (Protected)
app.post('/api/tasks/:taskId/rate', authenticate, async (req, res) => {
    const { taskId } = req.params;
    const { uid } = req.user;
    const { ratedUserId, rating, comment } = req.body;

    try {
        if (!ratedUserId || !rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid rating. Must be 1-5.' });
        }

        const taskRef = db.collection('tasks').doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) return res.status(404).json({ error: 'Task not found.' });

        const taskData = taskDoc.data();
        if (taskData.status !== 'Completed') {
            return res.status(400).json({ error: 'Can only rate completed tasks.' });
        }

        // Verify the rater is involved in the task
        if (uid !== taskData.requesterId && uid !== taskData.marshalId) {
            return res.status(403).json({ error: 'Not authorized to rate this task.' });
        }

        // Check duplicate ratings
        const isRequester = uid === taskData.requesterId;
        if (isRequester && taskData.requesterRated) {
            return res.status(400).json({ error: 'You have already rated this task.' });
        }
        if (!isRequester && taskData.marshalRated) {
            return res.status(400).json({ error: 'You have already rated this task.' });
        }

        // Save rating
        const ratingData = {
            taskId,
            ratedUserId,
            ratedByUserId: uid,
            rating,
            comment: comment ? sanitizeString(comment) : '',
            createdAt: Date.now(),
        };

        await db.collection('ratings').add(ratingData);

        // Update task rated flag
        await taskRef.update({
            [isRequester ? 'requesterRated' : 'marshalRated']: true,
        });

        // Update rated user's average
        const ratedUserRef = db.collection('users').doc(ratedUserId);
        const ratedUserDoc = await ratedUserRef.get();
        if (ratedUserDoc.exists) {
            const userData = ratedUserDoc.data();
            const currentCount = userData.ratingCount || 0;
            const currentAvg = userData.averageRating || 0;
            const newCount = currentCount + 1;
            const newAvg = ((currentAvg * currentCount) + rating) / newCount;

            await ratedUserRef.update({
                averageRating: Math.round(newAvg * 100) / 100,
                ratingCount: newCount,
            });
        }

        res.status(201).json({ success: true, message: 'Rating submitted.' });

    } catch (error) {
        console.error(`Error rating task ${taskId}:`, error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


// === ADMIN ROUTES === //

// Get all marshals (Admin only)
app.get('/api/admin/marshals', authenticate, requireAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('role', '==', 'marshal').get();
        const marshals = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                surname: data.surname,
                email: data.email,
                cellphone: data.cellphone,
                idNumber: data.idNumber ? '***' + data.idNumber.slice(-4) : 'N/A', // Mask sensitive data
                verificationStatus: data.verificationStatus || 'pending',
                verifiedAt: data.verifiedAt,
                averageRating: data.averageRating,
                ratingCount: data.ratingCount,
                balance: data.balance,
            };
        });
        res.json({ marshals });
    } catch (error) {
        console.error('Error fetching marshals:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Verify/Reject a user (Admin only) - supports both marshals and requesters
app.post('/api/admin/verify-user', authenticate, requireAdmin, async (req, res) => {
    try {
        const { userId, status } = req.body;

        if (!userId || !['verified', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid userId or status.' });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const updateData = {
            verificationStatus: status,
            verifiedAt: status === 'verified' ? Date.now() : null,
        };

        await userRef.update(updateData);

        // Audit log
        await db.collection('audit_log').add({
            action: `user_verification_${status}`,
            adminId: req.user.uid,
            targetUserId: userId,
            timestamp: Date.now(),
        });

        res.status(200).json({ success: true, message: `User ${status} successfully.` });
    } catch (error) {
        console.error('Error verifying user:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Alias routes for backward compatibility with frontend calls
app.post('/api/admin/verify-marshal', (req, res, next) => { req.route_alias = 'marshal'; next(); }, authenticate, requireAdmin, async (req, res) => {
    // Redirect to the generic verify-user logic
    return app._router.handle({ method: 'post', url: '/api/admin/verify-user', body: req.body }, req, res);
});

app.post('/api/admin/verify-requester', (req, res, next) => { req.route_alias = 'requester'; next(); }, authenticate, requireAdmin, async (req, res) => {
    // Redirect to the generic verify-user logic
    return app._router.handle({ method: 'post', url: '/api/admin/verify-user', body: req.body }, req, res);
});

// Get audit log (Admin only)
app.get('/api/admin/audit-log', authenticate, requireAdmin, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const snapshot = await db.collection('audit_log')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ logs });
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


// === PAYMENT ROUTES === //

const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Stricter rate limit for payment operations
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: 'Too many payment attempts. Please wait an hour.' },
});

// 1. YOCO Payment Integration (New API)
app.post('/api/payments/yoco/create-checkout', authenticate, paymentLimiter, async (req, res) => {
    try {
        const { amountInCents, currency = 'ZAR', successUrl, cancelUrl } = req.body;
        const { uid } = req.user;

        if (!amountInCents) {
            return res.status(400).json({ error: 'Missing amount.' });
        }

        const response = await axios.post('https://payments.yoco.com/api/checkouts',
            {
                amount: amountInCents,
                currency,
                successUrl: successUrl || 'https://profilegenius.fun/#/payment?yoco_success=true',
                cancelUrl: cancelUrl || 'https://profilegenius.fun/#/payment',
                metadata: { userId: uid }
            },
            {
                headers: {
                    'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.redirectUrl) {
            return res.json({
                success: true,
                redirectUrl: response.data.redirectUrl,
                checkoutId: response.data.id
            });
        } else {
            return res.status(400).json({ error: 'Failed to create Yoco checkout.', details: response.data });
        }
    } catch (error) {
        console.error('Yoco API Error:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.displayMessage || error.response?.data?.message || 'Payment gateway error.';
        res.status(error.response?.status || 500).json({
            error: errorMessage,
            details: error.response?.data || error.message
        });
    }
});

app.post('/api/payments/yoco/verify-checkout', authenticate, async (req, res) => {
    try {
        const { checkoutId } = req.body;
        const { uid } = req.user;

        if (!checkoutId) {
            return res.status(400).json({ error: 'Missing checkout ID.' });
        }

        // Verify the checkout status with Yoco
        const response = await axios.get(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
            headers: {
                'Authorization': `Bearer ${YOCO_SECRET_KEY}`
            }
        });

        const checkoutData = response.data;

        if (checkoutData.status === 'paid' || checkoutData.status === 'completed' || checkoutData.status === 'successful') {
            // Check if already processed
            const auditSnapshot = await db.collection('audit_log')
                .where('yocoId', '==', checkoutId)
                .where('action', '==', 'payment_yoco_success')
                .get();

            if (!auditSnapshot.empty) {
                return res.json({ success: true, message: 'Payment already processed.' });
            }

            const amountInRands = checkoutData.amount / 100;
            const userRef = db.collection('users').doc(uid);

            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(userRef);
                const currentBalance = doc.data().balance || 0;
                transaction.update(userRef, { balance: currentBalance + amountInRands });
            });

            // Log completion
            await db.collection('audit_log').add({
                action: 'payment_yoco_success',
                userId: uid,
                amount: amountInRands,
                timestamp: Date.now(),
                yocoId: checkoutId
            });

            return res.json({ success: true, balanceUpdate: amountInRands });
        } else {
            return res.status(400).json({ error: 'Yoco payment not successful or pending.', status: checkoutData.status });
        }
    } catch (error) {
        console.error('Yoco Verify Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to verify payment.' });
    }
});

// 2. PAYPAL Payment Integration
// Helper to get PayPal access token
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post('https://api-m.sandbox.paypal.com/v1/oauth2/token', 'grant_type=client_credentials', {
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data.access_token;
}

app.post('/api/payments/paypal/create-order', authenticate, async (req, res) => {
    try {
        const { amount, currency = 'USD' } = req.body;
        const accessToken = await getPayPalAccessToken();

        const response = await axios.post('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: currency,
                    value: amount.toString()
                }
            }]
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('PayPal Create Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Could not create PayPal order.' });
    }
});

app.post('/api/payments/paypal/capture-order', authenticate, async (req, res) => {
    try {
        const { orderId } = req.body;
        const { uid } = req.user;
        const accessToken = await getPayPalAccessToken();

        const response = await axios.post(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status === 'COMPLETED') {
            const amount = parseFloat(response.data.purchase_units[0].payments.captures[0].amount.value);

            // Note: If paying in USD, you might want to convert to ZAR here. 
            // For now, we'll keep it 1:1 or assume system handles multiple currencies.
            const userRef = db.collection('users').doc(uid);
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(userRef);
                const currentBalance = doc.data().balance || 0;
                transaction.update(userRef, { balance: currentBalance + amount });
            });

            await db.collection('audit_log').add({
                action: 'payment_paypal_success',
                userId: uid,
                amount: amount,
                timestamp: Date.now(),
                paypalId: response.data.id
            });

            return res.json({ success: true, balanceUpdate: amount });
        }

        res.status(400).json({ error: 'PayPal capture failed.' });
    } catch (error) {
        console.error('PayPal Capture Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Could not capture PayPal order.' });
    }
});


// === ENCRYPTION ENDPOINTS (for sensitive user data) === //


// Encrect sensitive user data on registration (Heavy operation, rate limit)
app.post('/api/secure/encrypt-user-data', authenticate, authLimiter, async (req, res) => {
    try {
        const { idNumber, bankAccount } = req.body;
        const encryptedData = {};

        if (idNumber) {
            encryptedData.idNumberEncrypted = encrypt(idNumber);
            encryptedData.idNumberHash = hashSensitiveData(idNumber);
        }
        if (bankAccount) {
            encryptedData.bankAccountEncrypted = encrypt(bankAccount);
        }

        // Store encrypted data in the user's document
        await db.collection('users').doc(req.user.uid).update(encryptedData);

        res.json({ success: true, message: 'Sensitive data encrypted and stored.' });
    } catch (error) {
        console.error('Error encrypting user data:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


// --- NOTIFICATION ROUTES --- //

// Endpoint for client to trigger a chat notification
app.post('/api/notifications/chat', authenticate, rateLimit({ windowMs: 1 * 60 * 1000, max: 20 }), async (req, res) => {
    try {
        const { taskId, recipientId, messageSnippet } = req.body;
        const senderName = req.user.name || 'User';

        if (!taskId || !recipientId || !messageSnippet) {
            return res.status(400).json({ error: 'Missing required fields for chat notification.' });
        }

        const taskDoc = await db.collection('tasks').doc(taskId).get();
        const taskTitle = taskDoc.exists ? taskDoc.data().title : 'Task Chat';

        await sendPushNotification(
            recipientId,
            `New message from ${senderName}`,
            `[${taskTitle}] ${messageSnippet}`,
            { taskId, type: 'chat_message' }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error sending chat notification route:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


// --- Error Handler ---
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
});

// --- 404 Handler ---
app.use((req, res) => {
    res.status(404).json({ error: 'Not found.' });
});


// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`Queue-Marshal Server v2.0 running on http://localhost:${PORT}`);
    console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});