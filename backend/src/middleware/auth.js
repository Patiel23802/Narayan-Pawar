import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export function requireAuth(optional = false) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      if (optional) return next();
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(payload.sub);
      if (!user) {
        if (optional) return next();
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = user;
      req.userId = user.id;
      next();
    } catch {
      if (optional) return next();
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
