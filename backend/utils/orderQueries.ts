import { Queryable } from '../config/db';

const ORDER_SELECT = `
  SELECT o.id, o.user_id, o.status, o.total, o.payment_method, o.recipient_name, o.phone,
         o.shipping_address, o.created_at, o.updated_at,
         u.name AS customer_name, u.email AS customer_email
  FROM orders o
  JOIN users u ON u.id = o.user_id`;

function mapOrder(row: any, includeCustomer: boolean) {
  return {
    id: row.id,
    status: row.status,
    total: row.total,
    paymentMethod: row.payment_method,
    recipientName: row.recipient_name,
    phone: row.phone,
    shippingAddress: row.shipping_address,
    ...(includeCustomer
      ? { customer: { id: row.user_id, name: row.customer_name, email: row.customer_email } }
      : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrderWithItems(
  db: Queryable,
  id: number,
  opts: { userId?: number; includeCustomer?: boolean } = {},
) {
  const params: unknown[] = [id];
  let where = 'o.id = $1';
  if (opts.userId !== undefined) {
    params.push(opts.userId);
    where += ' AND o.user_id = $2';
  }
  const { rows } = await db.query(`${ORDER_SELECT} WHERE ${where}`, params);
  if (!rows[0]) return null;

  const items = await db.query(
    'SELECT product_id, product_name, unit_price, quantity FROM order_items WHERE order_id = $1 ORDER BY id',
    [id],
  );
  return {
    ...mapOrder(rows[0], !!opts.includeCustomer),
    items: items.rows.map((i: any) => ({
      productId: i.product_id,
      productName: i.product_name,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      lineTotal: i.unit_price * i.quantity,
    })),
  };
}

export async function listOrders(
  db: Queryable,
  opts: { page: number; limit: number; status?: string; userId?: number; includeCustomer?: boolean },
) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.userId !== undefined) {
    params.push(opts.userId);
    where.push(`o.user_id = $${params.length}`);
  }
  if (opts.status) {
    params.push(opts.status);
    where.push(`o.status = $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (await db.query(`SELECT COUNT(*)::int AS count FROM orders o ${whereSql}`, params))
    .rows[0].count as number;

  const { rows } = await db.query(
    `${ORDER_SELECT} ${whereSql} ORDER BY o.created_at DESC, o.id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, opts.limit, (opts.page - 1) * opts.limit],
  );

  return {
    data: rows.map((r: any) => mapOrder(r, !!opts.includeCustomer)),
    meta: {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    },
  };
}

/** Puts every item of an order back into stock. Call inside a transaction. */
export async function restoreStock(db: Queryable, orderId: number): Promise<void> {
  await db.query(
    `UPDATE products p
        SET stock = p.stock + oi.quantity, updated_at = now()
       FROM order_items oi
      WHERE oi.order_id = $1 AND p.id = oi.product_id`,
    [orderId],
  );
}
