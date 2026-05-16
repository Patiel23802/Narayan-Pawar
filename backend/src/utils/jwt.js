import jwt from 'jsonwebtoken';

export function signUserToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(
    { sub: user.id, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}
