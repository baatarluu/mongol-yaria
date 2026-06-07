// ─────────────────────────────────────────────────────────────
//  Нэвтрэлт — JWT токен + нууц үг хэшлэх (bcrypt)
// ─────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function secret() {
  return process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(teacher) {
  return jwt.sign(
    { sub: teacher.id, email: teacher.email, name: teacher.name },
    secret(),
    { expiresIn: '30d' }
  );
}

// Authorization header-ээс токен задлаж, teacherId буцаана. Алдаатай бол null.
export function verifyToken(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret());
    return { id: payload.sub, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}
