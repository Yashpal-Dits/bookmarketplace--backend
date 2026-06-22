import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ERROR_MESSAGES } from '../../../common/constants/messages.constant';


@Injectable()
export class BookUploadService {
  private readonly logger = new Logger(BookUploadService.name);
  private readonly uploadDir = process.env.UPLOAD_DEST || './uploads/books';
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor() {
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory created: ${this.uploadDir}`);
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    this.validateFile(file);

    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${extname(file.originalname)}`;
    const filePath = join(this.uploadDir, uniqueName);

    const { writeFile } = await import('fs/promises');
    await writeFile(filePath, file.buffer);

    this.logger.log(`File uploaded: ${uniqueName}`);

    return `/uploads/books/${uniqueName}`;
  }

  async uploadMultiple(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException(ERROR_MESSAGES.FILE_NOT_FOUND);
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }
}