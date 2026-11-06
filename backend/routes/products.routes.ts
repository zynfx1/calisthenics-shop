import { Router } from 'express';
import * as products from '../controllers/products.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const admin = [authenticate, requireRole('ADMIN')];

router.get('/', validate(products.listProductsQuery, 'query'), asyncHandler(products.listPublicProducts));
router.get('/:id', asyncHandler(products.getProduct));
router.post('/', ...admin, validate(products.createProductSchema), asyncHandler(products.createProduct));
router.patch('/:id', ...admin, validate(products.updateProductSchema), asyncHandler(products.updateProduct));
router.delete('/:id', ...admin, asyncHandler(products.deleteProduct));

export default router;
