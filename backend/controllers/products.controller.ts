import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { AppError } from '../utils/errors';
import { parseId } from '../utils/params';
import { buildUpdate } from '../utils/sql';

export const listProductsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(100).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  isActive: z.enum(['true', 'false']).optional(), // admin list only
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  categoryId: z.number().int().positive(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.number().int().positive().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.description, p.price, p.stock,
         p.image_url, p.is_active, p.created_at, p.updated_at,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id DESC',
};

function mapProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    isActive: row.is_active,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findProduct(id: number) {
  const { rows } = await pool.query(`${PRODUCT_SELECT} WHERE p.id = $1`, [id]);
  return rows[0] ? mapProduct(rows[0]) : null;
}

async function assertCategoryExists(categoryId: number) {
  const { rowCount } = await pool.query('SELECT 1 FROM categories WHERE id = $1', [categoryId]);
  if (!rowCount) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
}

async function listProducts(res: Response, adminView: boolean) {
  const q = res.locals.query as z.infer<typeof listProductsQuery>;
  const where: string[] = [];
  const params: unknown[] = [];

  if (!adminView) {
    where.push('p.is_active = true');
  } else if (q.isActive) {
    params.push(q.isActive === 'true');
    where.push(`p.is_active = $${params.length}`);
  }
  if (q.q) {
    params.push(`%${q.q}%`);
    where.push(`p.name ILIKE $${params.length}`);
  }
  if (q.categoryId) {
    params.push(q.categoryId);
    where.push(`p.category_id = $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    await pool.query(`SELECT COUNT(*)::int AS count FROM products p ${whereSql}`, params)
  ).rows[0].count as number;

  const { rows } = await pool.query(
    `${PRODUCT_SELECT} ${whereSql} ORDER BY ${SORTS[q.sort]}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, q.limit, (q.page - 1) * q.limit],
  );

  res.json({
    data: rows.map(mapProduct),
    meta: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
  });
}

export const listPublicProducts = (_req: Request, res: Response) => listProducts(res, false);
export const listAdminProducts = (_req: Request, res: Response) => listProducts(res, true);

export async function getProduct(req: Request, res: Response) {
  const product = await findProduct(parseId(req.params.id));
  if (!product || !product.isActive) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  res.json({ data: product });
}

export async function createProduct(req: Request, res: Response) {
  const b = req.body;
  await assertCategoryExists(b.categoryId);

  const { rows } = await pool.query(
    `INSERT INTO products (category_id, name, description, price, stock, image_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [b.categoryId, b.name, b.description ?? null, b.price, b.stock, b.imageUrl ?? null, b.isActive],
  );
  res.status(201).json({ data: await findProduct(rows[0].id) });
}

export async function updateProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const existing = await findProduct(id);
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Product not found');

  if (req.body.categoryId !== undefined) await assertCategoryExists(req.body.categoryId);

  const { sets, values } = buildUpdate(req.body, {
    name: 'name',
    description: 'description',
    price: 'price',
    stock: 'stock',
    categoryId: 'category_id',
    imageUrl: 'image_url',
    isActive: 'is_active',
  });

  if (sets.length) {
    await pool.query(
      `UPDATE products SET ${sets.join(', ')}, updated_at = now() WHERE id = $${values.length + 1}`,
      [...values, id],
    );
  }
  res.json({ data: await findProduct(id) });
}

export async function deleteProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!(await findProduct(id))) throw new AppError(404, 'NOT_FOUND', 'Product not found');

  const ordered = await pool.query('SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1', [id]);
  if (ordered.rowCount) {
    throw new AppError(
      409,
      'PRODUCT_HAS_ORDERS',
      'This product appears in existing orders. Deactivate it instead.',
    );
  }
  await pool.query('DELETE FROM products WHERE id = $1', [id]); // cart_items cascade
  res.status(204).send();
}
