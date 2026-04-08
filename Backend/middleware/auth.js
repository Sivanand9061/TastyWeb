const admin = require('firebase-admin');

// Middleware to verify Firebase Auth token and Admin role
const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Check if the user is an admin in the database
    const snapshot = await req.db.ref(`users/${uid}/role`).once('value');
    const role = snapshot.val();
    
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. Requires admin role.' });
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
  }
};

module.exports = { requireAdmin };
