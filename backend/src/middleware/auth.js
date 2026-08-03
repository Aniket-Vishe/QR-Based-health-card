const { admin, db } = require('../firebaseAdmin');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let idToken = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    idToken = authHeader.split(' ')[1];
  } else if (req.body?.idToken) {
    idToken = req.body.idToken;
  } else if (req.query?.idToken) {
    idToken = req.query.idToken;
  }

  if (!idToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid, email: decodedToken.email, name: decodedToken.name || decodedToken.email };
    next();
  } catch (err) {
    console.error('Token verification failed', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      const userData = userDoc.data();
      if (!userData || !roles.includes(userData.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      req.user = { ...req.user, role: userData.role, name: userData.name };
      next();
    } catch (err) {
      console.error('Role verification failed', err);
      res.status(500).json({ error: 'Could not verify user role' });
    }
  };
}

module.exports = { authMiddleware, requireRole };
