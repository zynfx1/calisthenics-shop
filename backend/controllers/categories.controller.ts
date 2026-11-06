import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { AppError } from '../utils/errors';
import { parseId } from '../utils/params';
import { slugify } from '../utils/slug';

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

const CATEGORY_SELECT = `
  SELECT c.id, c.name, c.slug,
         (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id) AS "productCount"
  FROM categories c`;

const nameTaken = () => new AppError(409, 'CATEGORY_NAME_TAKEN', 'Category name already exists');

export async function listCategories(_req: Request, res: Response) {
  const { rows } = await pool.query(`${CATEGORY_SELECT} ORDER BY c.name`);
  res.json({ data: rows });
}

export async function createCategory(req: Request, res: Response) {
  const { name } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id',
      [name, slugify(name)],
    );
    const created = await pool.query(`${CATEGORY_SELECT} WHERE c.id = $1`, [rows[0].id]);
    res.status(201).json({ data: created.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') throw nameTaken();
    throw err;
  }
}

export async function updateCategory(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1, slug = $2, updated_at = now() WHERE id = $3',
      [name, slugify(name), id],
    );
    if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  } catch (err: any) {
    if (err.code === '23505') throw nameTaken();
    throw err;
  }
  const { rows } = await pool.query(`${CATEGORY_SELECT} WHERE c.id = $1`, [id]);
  res.json({ data: rows[0] });
}

export async function deleteCategory(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const exists = await pool.query('SELECT 1 FROM categories WHERE id = $1', [id]);
  if (!exists.rowCount) throw new AppError(404, 'NOT_FOUND', 'Category not found');

  const used = await pool.query('SELECT 1 FROM products WHERE category_id = $1 LIMIT 1', [id]);
  if (used.rowCount) {
    throw new AppError(
      409,
      'CATEGORY_HAS_PRODUCTS',
      'Cannot delete a category that still has products',
    );
  }
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  res.status(204).send();
}
