import { Router } from 'express';
import * as uploads from '../controllers/uploads.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadProductImage } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Auth runs before multer so anonymous requests never write files to disk.
router.post(
  '/product-image',
  authenticate,
  requireRole('ADMIN'),
  uploadProductImage,
  asyncHandler(uploads.uploadProductImage),
);

export default router;
