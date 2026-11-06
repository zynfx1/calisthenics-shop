import { Router } from 'express';
import * as cart from '../controllers/cart.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate, requireRole('CUSTOMER'));

router.get('/', asyncHandler(cart.getCart));
router.delete('/', asyncHandler(cart.clearCart));
router.post('/items', validate(cart.addItemSchema), asyncHandler(cart.addItem));
router.patch('/items/:productId', validate(cart.updateItemSchema), asyncHandler(cart.updateItem));
router.delete('/items/:productId', asyncHandler(cart.removeItem));

export default router;
