import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../config/db';
import { AppError } from '../utils/errors';
import { buildUpdate } from '../utils/sql';
import { revokeAllRefreshTokens } from '../utils/tokens';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

const PROFILE_COLUMNS = `id, name, email, phone, address, created_at AS "createdAt"`;

export async function getMe(req: Request, res: Response) {
  const { rows } = await pool.query(`SELECT ${PROFILE_COLUMNS} FROM users WHERE id = $1`, [
    req.user!.id,
  ]);
  if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
  res.json({ data: rows[0] });
}

export async function updateMe(req: Request, res: Response) {
  const { sets, values } = buildUpdate(req.body, {
    name: 'name',
    phone: 'phone',
    address: 'address',
  });

  if (!sets.length) return getMe(req, res);

  const { rows } = await pool.query(
    `UPDATE users SET ${sets.join(', ')}, updated_at = now()
     WHERE id = $${values.length + 1} RETURNING ${PROFILE_COLUMNS}`,
    [...values, req.user!.id],
  );
  res.json({ data: rows[0] });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body;
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [
    req.user!.id,
  ]);
  if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect');
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [
    hash,
    req.user!.id,
  ]);
  await revokeAllRefreshTokens(req.user!.id);
  res.status(204).send();
}
