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

// --- Middleware ---
// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Let frontend handle CSP
}));

// CORS - restrict to allowed origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173', 'https://profilegenius.fun'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' })); // Limit body size

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per window per IP
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
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
        const { taskData, paymentMethod } = req.body;
        const { uid } = req.user;

        if (!taskData || !paymentMethod) {
            return res.status(400).json({ error: 'Missing task data or payment method.' });
        }

        const { title, description, location, fee, duration } = taskData;

        // Validate
        if (!title || !description || !location || !fee || !duration) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (typeof fee !== 'number' || typeof duration !== 'number' || fee <= 0 || duration <= 0) {
            return res.status(400).json({ error: 'Invalid fee or duration.' });
        }
        if (fee > 10000) {
            return res.status(400).json({ error: 'Fee cannot exceed R10,000.' });
        }
        if (!location.address || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return res.status(400).json({ error: 'Invalid location data.' });
        }
        if (!['Pre-Paid', 'On the Spot'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method.' });
        }

        // Sanitize strings
        const sanitizedTitle = sanitizeString(title);
        const sanitizedDescription = sanitizeString(description);
        const sanitizedAddress = sanitizeString(location.address);

        const newTaskPayload = {
            title: sanitizedTitle,
            description: sanitizedDescription,
            location: {
                address: sanitizedAddress,
                lat: location.lat,
                lng: location.lng,
            },
            fee,
            duration,
            requesterId: uid,
            createdAt: Date.now(),
            status: 'Open',
            paymentMethod: paymentMethod,
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
        res.status(500).json({ error: 'Internal server error.' });
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
                const requesterRef = db.collection('users').doc(taskData.requesterId);
                const marshalRef = db.collection('users').doc(taskData.marshalId);

                const [requesterDoc, marshalDoc] = await Promise.all([
                    transaction.get(requesterRef),
                    transaction.get(marshalRef)
                ]);

                if (!requesterDoc.exists || !marshalDoc.exists) {
                    throw new Error('Requester or marshal account not found.');
                }

                const requesterData = requesterDoc.data();
                const marshalData = marshalDoc.data();
                const fee = taskData.fee;
                const commission = fee * 0.15;
                const marshalPayout = fee - commission;

                if (requesterData.balance < fee) {
                    throw new Error('Requester has insufficient funds.');
                }

                transaction.update(requesterRef, { balance: requesterData.balance - fee });
                transaction.update(marshalRef, { balance: marshalData.balance + marshalPayout });
            }

            transaction.update(taskRef, { status: 'Completed' });
        });

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

// Verify/Reject a marshal (Admin only)
app.post('/api/admin/verify-marshal', authenticate, requireAdmin, async (req, res) => {
    try {
        const { marshalId, status } = req.body;

        if (!marshalId || !['verified', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid marshalId or status.' });
        }

        const marshalRef = db.collection('users').doc(marshalId);
        const marshalDoc = await marshalRef.get();

        if (!marshalDoc.exists || marshalDoc.data().role !== 'marshal') {
            return res.status(404).json({ error: 'Marshal not found.' });
        }

        const updateData = {
            verificationStatus: status,
            verifiedAt: status === 'verified' ? Date.now() : null,
        };

        await marshalRef.update(updateData);

        // Audit log
        await db.collection('audit_log').add({
            action: `marshal_${status}`,
            adminId: req.user.uid,
            marshalId,
            timestamp: Date.now(),
        });

        res.status(200).json({ success: true, message: `Marshal ${status} successfully.` });
    } catch (error) {
        console.error('Error verifying marshal:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
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

// 1. YOCO Payment Integration (New API)
app.post('/api/payments/yoco/create-checkout', authenticate, async (req, res) => {
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
        console.error('Yoco Create Checkout Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Payment gateway error.' });
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

        if (checkoutData.status === 'paid') {
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


// Encrypt sensitive user data on registration
app.post('/api/secure/encrypt-user-data', authenticate, async (req, res) => {
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