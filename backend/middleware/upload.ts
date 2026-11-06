import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../utils/errors';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// Extension is derived from the MIME type, never from the user's filename.
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const uploader = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) return cb(null, true);
    cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only JPG, PNG, WebP or GIF images are allowed'));
  },
});

/** Accepts one file in the `image` field and turns multer errors into API errors. */
export function uploadProductImage(req: Request, res: Response, next: NextFunction) {
  uploader.single('image')(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(413, 'FILE_TOO_LARGE', 'Image must be 5 MB or smaller'));
      }
      return next(new AppError(400, 'VALIDATION_ERROR', 'Upload failed. Send one image in the "image" field.'));
    }
    next(err);
  });
}
