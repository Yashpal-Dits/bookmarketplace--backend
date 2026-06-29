import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { memoryStorage } from 'multer';

export const bookImageMulterOptions = {
  storage: memoryStorage(), // Store in memory (file.buffer)
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Max 5 images per upload
  },
  fileFilter: (_req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    const fileExtension = extname(file.originalname).toLowerCase();
    const isValidMime = allowedMimeTypes.includes(file.mimetype);
    const isValidExt = allowedExtensions.includes(fileExtension);

    if (!isValidMime || !isValidExt) {
      return callback(
        new BadRequestException('Only image files are allowed (JPEG, PNG, WEBP, GIF)'),
        false,
      );
    }

    callback(null, true);
  },
};