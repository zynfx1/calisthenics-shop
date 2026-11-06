import { Request, Response } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db';
import { ORDER_STATUSES } from '../config/constants';
import { AppError } from '../utils/errors';
import { getOrderWithItems, listOrders, restoreStock } from '../utils/orderQueries';
import { parseId } from '../utils/params';

export const createOrderSchema = z.object({
  recipientName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(30),
  shippingAddress: z.string().trim().min(1).max(500),
});

export const listOrdersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(ORDER_STATUSES).optional(),
});

/**
 * One transaction: lock products → validate stock → create order + items →
 * decrement stock → clear cart. Everything succeeds or nothing does.
 */
export async function createOrder(req: Request, res: Response) {
  const userId = req.user!.id;
  const { recipientName, phone, shippingAddress } = req.body;

  const order = await withTransaction(async (client) => {
    // FOR UPDATE locks the product rows so two buyers can't take the last item.
    // Ordered by product id so concurrent checkouts lock in the same order (no deadlocks).
    const { rows: cart } = await client.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.is_active
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = $1
        ORDER BY p.id
        FOR UPDATE OF p`,
      [userId],
    );

    if (!cart.length) throw new AppError(409, 'CART_EMPTY', 'Your cart is empty');

    const inactive = cart.filter((c: any) => !c.is_active);
    if (inactive.length) {
      throw new AppError(
        409,
        'PRODUCT_UNAVAILABLE',
        'Some items are no longer available. Remove them from your cart.',
        inactive.map((c: any) => ({ productId: c.product_id, name: c.name })),
      );
    }

    const short = cart.filter((c: any) => c.stock < c.quantity);
    if (short.length) {
      throw new AppError(
        409,
        'INSUFFICIENT_STOCK',
        'Some items are no longer available in the requested quantity.',
        short.map((c: any) => ({
          productId: c.product_id,
          requested: c.quantity,
          available: c.stock,
        })),
      );
    }

    const total = cart.reduce((sum: number, c: any) => sum + c.price * c.quantity, 0);

    const created = await client.query(
      `INSERT INTO orders (user_id, status, total, payment_method, recipient_name, phone, shipping_address)
       VALUES ($1, 'PENDING', $2, 'COD', $3, $4, $5) RETURNING id`,
      [userId, total, recipientName, phone, shippingAddress],
    );
    const orderId = created.rows[0].id as number;

    for (const c of cart) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, c.product_id, c.name, c.price, c.quantity],
      );
      await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = now() WHERE id = $2',
        [c.quantity, c.product_id],
      );
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    return getOrderWithItems(client, orderId, { userId });
  });

  res.status(201).json({ data: order });
}

export async function getMyOrders(req: Request, res: Response) {
  const q = res.locals.query as z.infer<typeof listOrdersQuery>;
  const result = await listOrders(pool, { ...q, userId: req.user!.id });
  res.json(result);
}

export async function getMyOrder(req: Request, res: Response) {
  const order = await getOrderWithItems(pool, parseId(req.params.id), { userId: req.user!.id });
  // Other customers' orders are indistinguishable from non-existent ones.
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  res.json({ data: order });
}

export async function cancelMyOrder(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const userId = req.user!.id;

  const order = await withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [id, userId],
    );
    if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'Order not found');
    if (rows[0].status !== 'PENDING') {
      throw new AppError(
        409,
        'INVALID_STATUS_TRANSITION',
        'Only pending orders can be cancelled',
      );
    }
    await restoreStock(client, id);
    await client.query(`UPDATE orders SET status = 'CANCELLED', updated_at = now() WHERE id = $1`, [id]);
    return getOrderWithItems(client, id, { userId });
  });

  res.json({ data: order });
}
