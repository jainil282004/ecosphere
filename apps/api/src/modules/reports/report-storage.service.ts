import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

@Injectable()
export class ReportStorageService {
  private readonly root = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

  resolveAbsolutePath(fileKey: string): string {
    const normalized = fileKey.replace(/\\/g, '/');
    if (normalized.includes('..')) {
      throw new Error('Invalid file key');
    }
    return path.join(this.root, normalized);
  }

  async save(orgId: string, filename: string, data: Buffer): Promise<string> {
    const relativeDir = path.posix.join('reports', orgId);
    const absoluteDir = path.join(this.root, relativeDir);
    await mkdir(absoluteDir, { recursive: true });
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const absolutePath = path.join(absoluteDir, safeName);
    await writeFile(absolutePath, data);
    return path.posix.join(relativeDir, safeName);
  }

  async read(fileKey: string): Promise<Buffer> {
    return readFile(this.resolveAbsolutePath(fileKey));
  }
}
