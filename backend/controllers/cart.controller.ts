import { Request, Response } from 'express';
import { z } from 'zod';
import { pool, Queryable } from '../config/db';
import { AppError } from '../utils/errors';
import { parseId } from '../utils/params';

export const addItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(999),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1).max(999),
});

export async function fetchCart(db: Queryable, userId: number) {
  const { rows } = await db.query(
    `SELECT ci.product_id, ci.quantity, p.name, p.image_url, p.price, p.stock, p.is_active
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = $1
      ORDER BY ci.id`,
    [userId],
  );

  const items = rows.map((r: any) => ({
    productId: r.product_id,
    name: r.name,
    imageUrl: r.image_url,
    unitPrice: r.price,
    quantity: r.quantity,
    stock: r.stock,
    lineTotal: r.price * r.quantity,
    isAvailable: r.is_active && r.stock >= r.quantity,
  }));

  return {
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
  };
}

export async function getCart(req: Request, res: Response) {
  res.json({ data: await fetchCart(pool, req.user!.id) });
}

export async function addItem(req: Request, res: Response) {
  const userId = req.user!.id;
  const { productId, quantity } = req.body;

  const product = await pool.query('SELECT stock, is_active FROM products WHERE id = $1', [productId]);
  if (!product.rows[0] || !product.rows[0].is_active) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }

  const existing = await pool.query(
    'SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
    [userId, productId],
  );
  const newQuantity = (existing.rows[0]?.quantity ?? 0) + quantity;
  if (newQuantity > product.rows[0].stock) {
    throw new AppError(409, 'INSUFFICIENT_STOCK', 'Not enough stock available', [
      { productId, requested: newQuantity, available: product.rows[0].stock },
    ]);
  }

  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    [userId, productId, newQuantity],
  );
  res.status(201).json({ data: await fetchCart(pool, userId) });
}

export async function updateItem(req: Request, res: Response) {
  const userId = req.user!.id;
  const productId = parseId(req.params.productId);
  const { quantity } = req.body;

  const row = await pool.query(
    `SELECT p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = $1 AND ci.product_id = $2`,
    [userId, productId],
  );
  if (!row.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Item is not in your cart');
  if (quantity > row.rows[0].stock) {
    throw new AppError(409, 'INSUFFICIENT_STOCK', 'Not enough stock available', [
      { productId, requested: quantity, available: row.rows[0].stock },
    ]);
  }

  await pool.query('UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3', [
    quantity,
    userId,
    productId,
  ]);
  res.json({ data: await fetchCart(pool, userId) });
}

export async function removeItem(req: Request, res: Response) {
  const userId = req.user!.id;
  const productId = parseId(req.params.productId);
  const result = await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [
    userId,
    productId,
  ]);
  if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Item is not in your cart');
  res.json({ data: await fetchCart(pool, userId) });
}

export async function clearCart(req: Request, res: Response) {
  await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user!.id]);
  res.status(204).send();
}
