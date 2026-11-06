import { Router } from 'express';
import * as users from '../controllers/users.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate, requireRole('CUSTOMER'));

router.get('/me', asyncHandler(users.getMe));
router.patch('/me', validate(users.updateProfileSchema), asyncHandler(users.updateMe));
router.post('/me/password', validate(users.changePasswordSchema), asyncHandler(users.changePassword));

export default router;
