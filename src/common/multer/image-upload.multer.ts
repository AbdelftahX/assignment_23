import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function buildUploadUrl(folder: string, filename: string): string {
  return `/uploads/${folder}/${filename}`;
}

export function createImageMulterOptions(folder: string): MulterOptions {
  const destination = join(process.cwd(), 'uploads', folder);

  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        if (!existsSync(destination)) {
          mkdirSync(destination, { recursive: true });
        }
        cb(null, destination);
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${randomUUID()}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const extension = extname(file.originalname).toLowerCase();
      if (
        !ALLOWED_EXTENSIONS.includes(extension) ||
        !ALLOWED_MIME_TYPES.includes(file.mimetype)
      ) {
        return cb(
          new BadRequestException('Only jpg, jpeg, png and webp images are allowed'),
          false,
        );
      }
      cb(null, true);
    },
    limits: { fileSize: MAX_FILE_SIZE },
  };
}
