import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', authLimiter, validate(auth.registerSchema), asyncHandler(auth.register));
router.post('/login', authLimiter, validate(auth.loginSchema), asyncHandler(auth.login));
router.post('/refresh', asyncHandler(auth.refresh));
router.post('/logout', authenticate, asyncHandler(auth.logout));
router.get('/me', authenticate, asyncHandler(auth.me));

export default router;
