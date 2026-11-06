import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../config/db';
import { env } from '../config/env';
import { AUTH_COOKIE_PATH, REFRESH_COOKIE, Role } from '../config/constants';
import { AppError } from '../utils/errors';
import {
  hashToken,
  revokeAllRefreshTokens,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens';

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Compared against when the email is unknown, so response time doesn't leak which emails exist.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict' as const,
  path: AUTH_COOKIE_PATH,
};

const clearRefreshCookie = (res: Response) => res.clearCookie(REFRESH_COOKIE, cookieOptions);

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

/** Creates access + refresh tokens, stores the hashed refresh token, sets the cookie. */
async function issueSession(res: Response, user: SessionUser) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user.id);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + $3::int * interval '1 second')`,
    [user.id, hashToken(refreshToken), env.REFRESH_TOKEN_TTL_SECONDS],
  );

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieOptions,
    maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
  });

  return {
    accessToken,
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'CUSTOMER') RETURNING id, name, email, role`,
      [name, email, passwordHash],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err: any) {
    if (err.code === '23505') throw new AppError(409, 'EMAIL_TAKEN', 'Email is already registered');
    throw err;
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    'SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = $1',
    [email],
  );
  const user = rows[0];
  const valid = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  if (!user.is_active) throw new AppError(403, 'ACCOUNT_DISABLED', 'This account has been disabled');

  res.json({ data: await issueSession(res, user) });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Refresh token missing');

  try {
    verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid refresh token');
  }

  const { rows } = await pool.query(
    'SELECT id, user_id, revoked_at, expires_at FROM refresh_tokens WHERE token_hash = $1',
    [hashToken(token)],
  );
  const stored = rows[0];
  if (!stored) {
    clearRefreshCookie(res);
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid refresh token');
  }

  // Reuse of an already-revoked token → assume theft, kill every session of this user.
  if (stored.revoked_at) {
    await revokeAllRefreshTokens(stored.user_id);
    clearRefreshCookie(res);
    throw new AppError(401, 'UNAUTHORIZED', 'Refresh token reuse detected');
  }
  if (new Date(stored.expires_at) < new Date()) {
    clearRefreshCookie(res);
    throw new AppError(401, 'UNAUTHORIZED', 'Refresh token expired');
  }

  // Atomic rotate: only one concurrent request can revoke this token.
  const rotated = await pool.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL RETURNING id',
    [stored.id],
  );
  if (!rotated.rowCount) {
    await revokeAllRefreshTokens(stored.user_id);
    clearRefreshCookie(res);
    throw new AppError(401, 'UNAUTHORIZED', 'Refresh token reuse detected');
  }

  const userRes = await pool.query(
    'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
    [stored.user_id],
  );
  const user = userRes.rows[0];
  if (!user || !user.is_active) {
    clearRefreshCookie(res);
    throw new AppError(401, 'UNAUTHORIZED', 'Account unavailable');
  }

  res.json({ data: await issueSession(res, user) });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
      [hashToken(token)],
    );
  }
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [
    req.user!.id,
  ]);
  if (!rows[0]) throw new AppError(401, 'UNAUTHORIZED', 'Account not found');
  res.json({ data: rows[0] });
}
