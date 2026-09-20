const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

const FALLBACK_SECRET = 'alumniconnect_super_secret_jwt_key_2026';

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = auth.split(' ')[1];
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e1) {
      decoded = jwt.verify(token, FALLBACK_SECRET);
    }
    if (decoded && decoded.role) {
      decoded.role = String(decoded.role).toLowerCase().trim();
    }
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

function optionalToken(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.split(' ')[1];
    try {
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (e1) {
        decoded = jwt.verify(token, FALLBACK_SECRET);
      }
      if (decoded && decoded.role) {
        decoded.role = String(decoded.role).toLowerCase().trim();
      }
      req.user = decoded;
    } catch (e) {
      // ignore invalid token in optional check
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  const role = String(req.user?.role || '').toLowerCase().trim();
  if (!req.user || role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  next();
}

function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    requireAdmin(req, res, next);
  });
}

module.exports = {
  verifyToken,
  optionalToken,
  requireAdmin,
  verifyAdmin
};
