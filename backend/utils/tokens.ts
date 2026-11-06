import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../config/db';
import { Role } from '../config/constants';

export function signAccessToken(user: { id: number; role: Role }): string {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: String(user.id),
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  });
}

/** Throws jsonwebtoken errors (TokenExpiredError / JsonWebTokenError) on failure. */
export function verifyAccessToken(token: string): { id: number; role: Role } {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  return { id: Number(payload.sub), role: payload.role as Role };
}

export function signRefreshToken(userId: number): string {
  // jti makes every refresh token unique, even when issued in the same second
  return jwt.sign({ jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    subject: String(userId),
    expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
  });
}

export function verifyRefreshToken(token: string): number {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  return Number(payload.sub);
}

/** Refresh tokens are stored hashed, never in plain text. */
export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export async function revokeAllRefreshTokens(userId: number): Promise<void> {
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId],
  );
}
