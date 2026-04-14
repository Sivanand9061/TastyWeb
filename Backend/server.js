require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).filter(Boolean)
  : true; // Allow all in development

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins === true || !origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
};
app.use(cors(corsOptions));
const { globalLimiter } = require('./middleware/rateLimiter');
app.use(globalLimiter);
app.use(express.json());

// Initialize Firebase Admin
// In production (Render), FIREBASE_SERVICE_ACCOUNT env var holds the JSON string.
// In development, falls back to the local file.
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('./firebase-service-account.json');
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
  });
  console.log('✅ Firebase Initialized');
} catch (error) {
  console.log('Firebase already initialized or error:', error.message);
}

const db = admin.database();

// Make db accessible to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Import routes
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const kitchenRoutes = require('./routes/kitchen');

// Use routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running ✅' });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🔥 [Global Error Handler]:", err.stack || err.message || err);
  
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({
    error: message,
    // Only send stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});
