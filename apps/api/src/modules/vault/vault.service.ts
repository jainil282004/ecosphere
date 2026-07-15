import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VaultRepository } from '../../database/repositories/vault.repository';
import { VaultStorageService } from './vault-storage.service';
import { OcrService } from './ocr.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);

  constructor(
    private readonly vaultRepo: VaultRepository,
    private readonly storage: VaultStorageService,
    private readonly ocr: OcrService,
    private readonly ai: AiService,
  ) {}

  async listFolders(orgId: string, parentId?: string) {
    return this.vaultRepo.listFolders(orgId, parentId);
  }

  async createFolder(orgId: string, userId: string, name: string, parentId?: string) {
    return this.vaultRepo.insertFolder({
      organizationId: orgId,
      name,
      parentId,
      createdById: userId,
    });
  }

  async listDocuments(orgId: string, filters: { folderId?: string | null, search?: string }) {
    return this.vaultRepo.listDocuments(orgId, filters);
  }

  async uploadDocument(
    orgId: string,
    userId: string,
    file: Express.Multer.File,
    metadata: {
      title: string;
      description?: string;
      category?: string;
      folderId?: string;
      tags?: string;
    }
  ) {
    return this.vaultRepo.transaction(async (tx: any) => {
      // 1. Save file to storage
      const { fileKey, fileSize } = await this.storage.save(orgId, file.originalname, file.buffer);

      // 2. OCR Extraction
      const ocrText = await this.ocr.extractText(file.buffer, file.originalname, file.mimetype);

      // 3. AI Analysis (if text available)
      let autoTags: string[] = [];
      let autoSummary = metadata.description || '';
      
      if (ocrText && ocrText.length > 50) {
        try {
          const aiResponse = await this.ai.processQuery('Analyze this document text and provide a short summary and 3 relevant tags: ' + ocrText.substring(0, 500));
          this.logger.debug(`AI Response for doc: ${aiResponse}`);
          autoSummary = autoSummary || aiResponse.substring(0, 200);
          autoTags = ['AI_Processed', ...aiResponse.split(' ').filter(w => w.startsWith('#')).map(w => w.replace('#', '').replace(',', ''))];
        } catch (e) {
          this.logger.warn('AI analysis failed during document upload', e);
        }
      }

      // 4. Create Document Record
      const doc = await this.vaultRepo.insertDocument(tx, {
        organizationId: orgId,
        title: metadata.title || file.originalname,
        description: autoSummary,
        category: metadata.category,
        folderId: metadata.folderId,
        ownerId: userId,
        uploadedById: userId,
        status: 'draft',
      });
      
      if (!doc) throw new Error('Failed to create document');
      const documentId = doc.id;

      // 5. Create Initial Version
      await this.vaultRepo.insertVersion(tx, {
        documentId: documentId,
        versionNumber: 1,
        fileKey,
        originalFilename: file.originalname,
        fileSize,
        mimeType: file.mimetype,
        ocrText,
        changesSummary: 'Initial upload',
        uploadedById: userId,
      });

      // 6. Handle Tags
      const tags = [
        ...(metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : []),
        ...autoTags
      ].filter(Boolean);
      
      if (tags.length) {
        await this.vaultRepo.insertTags(tx, documentId, [...new Set(tags)]);
      }

      // 7. Audit Log
      await this.vaultRepo.logAudit(tx, {
        documentId: documentId,
        userId,
        action: 'UPLOAD',
        details: 'Document uploaded and initialized',
      });

      return doc;
    });
  }

  async getDocumentFile(orgId: string, documentId: string, versionNumber?: number) {
    const doc = await this.vaultRepo.getDocumentById(orgId, documentId);
    if (!doc) throw new NotFoundException('Document not found');

    const version = versionNumber 
      ? (doc as any).versions.find((v: any) => v.versionNumber === versionNumber)
      : (doc as any).versions[0]; // get latest (ordered desc in repo)
      
    if (!version) throw new NotFoundException('Version not found');

    const buffer = await this.storage.read(version.fileKey);
    return {
      buffer,
      filename: version.originalFilename,
      mimetype: version.mimeType,
    };
  }
}
