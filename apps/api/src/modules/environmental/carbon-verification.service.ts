import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  documentVerificationResponseSchema,
  type DocumentVerificationResponse,
  verifyDocumentRequestSchema,
} from '@ecosphere/shared';
import { DomainRepository } from '../../database/repositories/domain.repository';

@Injectable()
export class CarbonVerificationService {
  constructor(private readonly domainRepository: DomainRepository) {}

  /**
   * Verify a document hash for carbon/resource evidence.
   * Checks SHA-256 format and organization-level uniqueness (collision detection).
   */
  async verifyDocument(orgId: string, body: unknown): Promise<DocumentVerificationResponse> {
    const input = verifyDocumentRequestSchema.parse(body);
    const normalizedHash = input.documentHash.toLowerCase();

    const isValidFormat = /^[a-f0-9]{64}$/.test(normalizedHash);

    if (!isValidFormat) {
      return documentVerificationResponseSchema.parse({
        documentHash: normalizedHash,
        isValidFormat: false,
        isUnique: false,
        verificationStatus: 'invalid_format',
        verifiedAt: new Date().toISOString(),
        message: 'Document hash must be a 64-character SHA-256 hexadecimal digest.',
      });
    }

    const existing = await this.domainRepository.listResourceConsumption(orgId);
    const duplicate = existing.some(
      (entry) => entry.documentHash.toLowerCase() === normalizedHash,
    );

    if (duplicate) {
      return documentVerificationResponseSchema.parse({
        documentHash: normalizedHash,
        isValidFormat: true,
        isUnique: false,
        verificationStatus: 'duplicate',
        verifiedAt: new Date().toISOString(),
        message: 'Document hash already registered for this organization.',
      });
    }

    return documentVerificationResponseSchema.parse({
      documentHash: normalizedHash,
      isValidFormat: true,
      isUnique: true,
      verificationStatus: 'verified',
      verifiedAt: new Date().toISOString(),
      message: 'Document hash format valid and unique within organization.',
    });
  }

  /** Compute SHA-256 for raw file bytes (server-side helper for upload pipelines). */
  hashDocumentContent(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
