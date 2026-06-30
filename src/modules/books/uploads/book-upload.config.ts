import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

const BOOK_UPLOAD_DIR = './uploads/books';

const ensureUploadDir = () => {
  if (!existsSync(BOOK_UPLOAD_DIR)) {
    mkdirSync(BOOK_UPLOAD_DIR, { recursive: true });
  }
};

const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  const fileExtension = extname(file.originalname).toLowerCase();
  const isValidMime = allowedMimeTypes.includes(file.mimetype);
  const isValidExt = allowedExtensions.includes(fileExtension);

  if (!isValidMime || !isValidExt) {
    return callback(
      new BadRequestException('Only image files are allowed: JPEG, PNG, WEBP, GIF'),
      false,
    );
  }

  callback(null, true);
};

export const bookCoverImageMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      ensureUploadDir();
      callback(null, BOOK_UPLOAD_DIR);
    },
    filename: (_req, file, callback) => {
      const fileExtension = extname(file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${randomUUID()}${fileExtension}`;
      callback(null, safeName);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: imageFileFilter,
};

/**
 * Keep old export name for existing /books/:id/images endpoint.
 */
export const bookImageMulterOptions = bookCoverImageMulterOptions;