import fs from 'fs';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

/** Checks the file's first bytes, since the MIME type comes from the client. */
function hasImageSignature(buf: Buffer, mimetype: string): boolean {
  switch (mimetype) {
    case 'image/jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case 'image/png':
      return buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    case 'image/gif':
      return buf.subarray(0, 4).toString('ascii') === 'GIF8';
    case 'image/webp':
      return buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
    default:
      return false;
  }
}

export async function uploadProductImage(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'No image uploaded', [
      { field: 'image', message: 'Choose an image to upload' },
    ]);
  }

  const handle = await fs.promises.open(file.path, 'r');
  const header = Buffer.alloc(12);
  await handle.read(header, 0, 12, 0);
  await handle.close();

  if (!hasImageSignature(header, file.mimetype)) {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new AppError(400, 'INVALID_FILE_TYPE', 'That file isn’t a valid image');
  }

  res.status(201).json({ data: { url: `${env.PUBLIC_URL}/uploads/${file.filename}` } });
}
