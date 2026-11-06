import { Request, Response } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db';
import { ORDER_STATUSES, ORDER_TRANSITIONS, OrderStatus } from '../config/constants';
import { AppError } from '../utils/errors';
import { getOrderWithItems, listOrders, restoreStock } from '../utils/orderQueries';
import { parseId } from '../utils/params';
import { revokeAllRefreshTokens } from '../utils/tokens';

export const adminListOrdersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
});

export const updateStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

export const listCustomersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(100).optional(),
});

export const setActiveSchema = z.object({ isActive: z.boolean() });

export async function adminListOrders(_req: Request, res: Response) {
  const q = res.locals.query as z.infer<typeof adminListOrdersQuery>;
  res.json(await listOrders(pool, { ...q, includeCustomer: true }));
}

export async function adminGetOrder(req: Request, res: Response) {
  const order = await getOrderWithItems(pool, parseId(req.params.id), { includeCustomer: true });
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  res.json({ data: order });
}

export async function adminUpdateOrderStatus(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const next = req.body.status as OrderStatus;

  const order = await withTransaction(async (client) => {
    const { rows } = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'Order not found');

    const current = rows[0].status as OrderStatus;
    if (!ORDER_TRANSITIONS[current].includes(next)) {
      throw new AppError(
        409,
        'INVALID_STATUS_TRANSITION',
        `Cannot change order from ${current} to ${next}`,
      );
    }

    if (next === 'CANCELLED') await restoreStock(client, id);
    await client.query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2', [next, id]);
    return getOrderWithItems(client, id, { includeCustomer: true });
  });

  res.json({ data: order });
}

const CUSTOMER_SELECT = `
  SELECT u.id, u.name, u.email, u.is_active AS "isActive", u.created_at AS "createdAt",
         (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS "orderCount"
  FROM users u`;

export async function listCustomers(_req: Request, res: Response) {
  const q = res.locals.query as z.infer<typeof listCustomersQuery>;
  const params: unknown[] = [];
  let where = `WHERE u.role = 'CUSTOMER'`;
  if (q.q) {
    params.push(`%${q.q}%`);
    where += ` AND (u.name ILIKE $1 OR u.email ILIKE $1)`;
  }

  const total = (
    await pool.query(`SELECT COUNT(*)::int AS count FROM users u ${where}`, params)
  ).rows[0].count as number;

  const { rows } = await pool.query(
    `${CUSTOMER_SELECT} ${where} ORDER BY u.created_at DESC, u.id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, q.limit, (q.page - 1) * q.limit],
  );

  res.json({
    data: rows,
    meta: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
  });
}

export async function setCustomerActive(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { isActive } = req.body;

  const result = await pool.query(
    `UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2 AND role = 'CUSTOMER'`,
    [isActive, id],
  );
  if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Customer not found');
  if (!isActive) await revokeAllRefreshTokens(id);

  const { rows } = await pool.query(`${CUSTOMER_SELECT} WHERE u.id = $1`, [id]);
  res.json({ data: rows[0] });
}
