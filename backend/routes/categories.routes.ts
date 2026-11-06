import { Router } from 'express';
import * as categories from '../controllers/categories.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const admin = [authenticate, requireRole('ADMIN')];

router.get('/', asyncHandler(categories.listCategories));
router.post('/', ...admin, validate(categories.categorySchema), asyncHandler(categories.createCategory));
router.patch('/:id', ...admin, validate(categories.categorySchema), asyncHandler(categories.updateCategory));
router.delete('/:id', ...admin, asyncHandler(categories.deleteCategory));

export default router;
