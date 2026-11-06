import { Router } from 'express';
import * as orders from '../controllers/orders.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate, requireRole('CUSTOMER'));

router.post('/', validate(orders.createOrderSchema), asyncHandler(orders.createOrder));
router.get('/', validate(orders.listOrdersQuery, 'query'), asyncHandler(orders.getMyOrders));
router.get('/:id', asyncHandler(orders.getMyOrder));
router.post('/:id/cancel', asyncHandler(orders.cancelMyOrder));

export default router;
