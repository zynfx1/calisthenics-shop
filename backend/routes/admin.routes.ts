import { Router } from 'express';
import * as adminOrders from '../controllers/adminOrders.controller';
import { listAdminProducts, listProductsQuery } from '../controllers/products.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

// Products (includes inactive)
router.get('/products', validate(listProductsQuery, 'query'), asyncHandler(listAdminProducts));

// Orders
router.get('/orders', validate(adminOrders.adminListOrdersQuery, 'query'), asyncHandler(adminOrders.adminListOrders));
router.get('/orders/:id', asyncHandler(adminOrders.adminGetOrder));
router.patch('/orders/:id/status', validate(adminOrders.updateStatusSchema), asyncHandler(adminOrders.adminUpdateOrderStatus));

// Customers
router.get('/customers', validate(adminOrders.listCustomersQuery, 'query'), asyncHandler(adminOrders.listCustomers));
router.patch('/customers/:id/active', validate(adminOrders.setActiveSchema), asyncHandler(adminOrders.setCustomerActive));

export default router;
