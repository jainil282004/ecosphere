import { Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import * as crypto from 'node:crypto';

@Injectable()
export class VaultStorageService {
  private readonly logger = new Logger(VaultStorageService.name);
  private readonly root = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

  resolveAbsolutePath(fileKey: string): string {
    const normalized = fileKey.replace(/\\/g, '/');
    if (normalized.includes('..')) {
      throw new Error('Invalid file key');
    }
    return path.join(this.root, normalized);
  }

  async save(orgId: string, filename: string, data: Buffer): Promise<{ fileKey: string; fileSize: number }> {
    const relativeDir = path.posix.join('vault', orgId, new Date().getFullYear().toString(), (new Date().getMonth() + 1).toString().padStart(2, '0'));
    const absoluteDir = path.join(this.root, relativeDir);
    await mkdir(absoluteDir, { recursive: true });
    
    const ext = path.extname(filename);
    const safeBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueId = crypto.randomUUID().split('-')[0];
    const safeName = `${safeBase}-${uniqueId}${ext}`;
    
    const absolutePath = path.join(absoluteDir, safeName);
    await writeFile(absolutePath, data);
    
    return {
      fileKey: path.posix.join(relativeDir, safeName),
      fileSize: data.length
    };
  }

  async read(fileKey: string): Promise<Buffer> {
    return readFile(this.resolveAbsolutePath(fileKey));
  }

  async delete(fileKey: string): Promise<void> {
    try {
      await unlink(this.resolveAbsolutePath(fileKey));
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logger.error(`Failed to delete file ${fileKey}`, error.stack);
        throw error;
      }
    }
  }
}
